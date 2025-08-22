import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, query, Timestamp, getDoc, where, updateDoc, getDocs, orderBy, writeBatch, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import * as render from './render.js';
import * as dbManager from './database.js';
import * as api from './api.js';
import { showNotification, getFormObj, parseLocalDate, isValidSecureSession } from './utils.js';
import { initializeVoiceRecognition, startVoiceSearch } from './voice-search.js';
import { generatePDFReport } from './pdf-generator.js';

// --- State Management ---
let clearances = [];
let clearanceRequests = [];
let vvips = [];
let userPasswordConfig = null;
let currentAdminProfile = null;
let unsubClearances = null, unsubRequests = null, unsubConfig = null, unsubVVIPs = null;
let authMode = "login";

// --- Configuration ---
const ADMIN_INVITE_CODE = "ADMIN2025";
const DEFAULT_USER_PASSWORD = "123456";

// --- Auth State Listener ---
onAuthStateChanged(auth, async (user) => {
    unsubClearances?.();
    unsubRequests?.();
    unsubConfig?.();
    unsubVVIPs?.();
    currentAdminProfile = null;

    if (user && !user.isAnonymous) {
        render.showLoadingScreen();
        try {
            const adminDoc = await getDoc(doc(db, "admins", user.uid));
            if (adminDoc.exists()) {
                currentAdminProfile = { uid: user.uid, ...adminDoc.data() };
                unsubVVIPs = onSnapshot(query(collection(db, "vvips"), orderBy("vehicleNumber")), snap => {
                    vvips = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    if (document.getElementById('vvip-list-container-settings')) {
                        render.renderVVIPListForSettings(vvips);
                    }
                });
                const configRef = doc(db, "publicConfig", "userAccess");
                unsubConfig = onSnapshot(configRef, async (snap) => {
                    if (!snap.exists()) {
                        await setDoc(configRef, { password: DEFAULT_USER_PASSWORD });
                        userPasswordConfig = { password: DEFAULT_USER_PASSWORD };
                    } else {
                        userPasswordConfig = snap.data();
                    }
                    render.renderAdminDashboard(currentAdminProfile, userPasswordConfig);
                });
            } else {
                await signOut(auth);
            }
        } catch (error) {
            showNotification("Error verifying admin status", "error");
            await signOut(auth);
        }
    } else if (user && user.isAnonymous && isValidSecureSession()) {
        render.showUserDashboard(user);
    } else {
        sessionStorage.clear();
        render.renderLandingPage();
    }
});


// --- Global Event Listener (Clicks) ---
document.body.addEventListener("click", async (e) => {
    const target = e.target;
    const button = target.closest('button');

    if (['settings-backdrop', 'form-modal-backdrop', 'review-modal-backdrop', 'vvip-modal-backdrop', 'rejection-modal-backdrop'].includes(target.id)) {
        if (e.target.id === target.id) target.closest('#modal-container').innerHTML = '';
    }
    
    if (!button) return;
    if (button.classList.contains('edit-btn') || button.classList.contains('delete-btn')) e.stopPropagation();

    try {
        // Simple UI Actions
        if (button.id === "clear-tracking-btn") { render.renderLandingPage({ vehicleNumber: "", trackingResultHTML: "" }); }
        else if (button.id === 'settings-btn') { render.toggleSettingsPanel(true); }
        else if (button.id === 'close-settings-panel-btn') { render.toggleSettingsPanel(false); }
        else if (button.id === 'show-vvip-btn') { render.renderVVIPModal(vvips); }
        else if (['close-vvip-modal-btn', 'close-modal-btn', 'cancel-modal-btn', 'cancel-rejection-btn'].includes(button.id)) { button.closest("#modal-container").innerHTML = ""; }
        else if (button.id === "back-btn") { render.goBack(); }
        else if (button.id === "auth-toggle-button") { authMode = authMode === "login" ? "signup" : "login"; render.renderAdminLogin(authMode); }

        // Navigation
        else if (button.id === "request-btn") { render.routeHistory.push(() => render.renderLandingPage()); render.renderRequestForm(); }
        else if (button.id === "admin-btn") { render.routeHistory.push(() => render.renderLandingPage()); render.renderAdminLogin(authMode); }
        else if (button.id === "user-btn") { render.routeHistory.push(() => render.renderLandingPage()); render.renderUserLogin(); }
        
        // Data Actions
        else if (button.id === "logout-button") { await dbManager.performSecureLogout(signOut, auth); }
        else if (button.id === "download-report-btn") { await generatePDFReport(button, db); }
        else if (button.id === "add-clearance-btn") { render.renderModal(); }
        else if (button.classList.contains("edit-btn")) {
            const clearanceToEdit = clearances.find(c => c.id === button.dataset.id);
            if (clearanceToEdit) render.renderModal(clearanceToEdit);
            else showNotification("Error: Clearance not found", "error");
        }
        else if (button.classList.contains("delete-btn")) {
            render.renderConfirmationModal('Delete Clearance', 'Are you sure?', async () => {
                try {
                    await deleteDoc(doc(db, "vehicleClearances", button.dataset.id));
                    showNotification("Clearance deleted.");
                } catch(err) { showNotification("Error deleting clearance.", "error"); }
            });
        }
        else if (button.classList.contains("delete-vvip-btn")) {
            render.renderConfirmationModal('Delete VVIP', 'Are you sure?', async () => {
                try {
                    await deleteDoc(doc(db, "vvips", button.dataset.id));
                    showNotification("VVIP removed.");
                } catch(err) { showNotification("Error removing VVIP.", "error"); }
            });
        }
        else if (button.classList.contains("review-btn")) {
            const requestToReview = clearanceRequests.find(r => r.id === button.dataset.id);
            if (requestToReview) render.renderReviewModal(requestToReview);
        }
        else if (button.classList.contains("reject-request-btn")) {
            render.renderRejectionModal(button.dataset.id);
        }
        else if (button.classList.contains("approve-request-btn")) {
            await handleApproval(button);
        }
        else if (button.classList.contains("save-clearance-btn")) {
            await handleSaveClearance(button);
        }
        else if (button.classList.contains('settings-tab-btn')) {
            render.switchSettingsTab(button.dataset.tab);
            if (button.dataset.tab === 'database') await dbManager.updateDatabaseStats(db);
        }
        else if (button.id === 'export-database-btn') { await dbManager.exportDatabaseData(button, db); }
        else if (button.id === 'reset-database-btn') {
            render.renderConfirmationModal('Reset Data', 'This removes clearances and requests only.', () => dbManager.resetToDefaultState(button, db));
        }
        else if (button.id === 'clear-database-btn') {
            render.renderConfirmationModal('Wipe Data', 'This PERMANENTLY deletes all clearances and requests.', () => dbManager.clearAllDatabaseData(button, db));
        }
        else if (button.classList.contains('voice-search-btn')) {
            const input = button.closest('form, .flex')?.querySelector('input');
            if (input) startVoiceSearch(input, button);
        }
        else if (button.id === 'get-current-location-btn') {
            await handleGetCurrentLocation(button);
        }
        else if (button.classList.contains('toggle-user-btn')) {
            await dbManager.toggleDocStatus(button.dataset.id, "authorizedUsers", button.dataset.active === 'true', "User", render.renderAuthorizedUsersList);
        }
        else if (button.classList.contains('delete-user-id-btn')) {
            render.renderConfirmationModal('Delete User ID', 'Are you sure?', () => dbManager.deleteDocById(button.dataset.id, "authorizedUsers", "User ID", render.renderAuthorizedUsersList));
        }
        else if (button.classList.contains('toggle-location-btn')) {
            await dbManager.toggleDocStatus(button.dataset.id, "allowedLocations", button.dataset.active === 'true', "Location", render.renderAllowedLocationsList);
        }
        else if (button.classList.contains('delete-location-btn')) {
            render.renderConfirmationModal('Delete Location', 'Are you sure?', () => dbManager.deleteDocById(button.dataset.id, "allowedLocations", "Location", render.renderAllowedLocationsList));
        }
        else if (button.id === 'refresh-logs-btn') {
            await render.renderAccessLogsList(db);
            showNotification("Access logs refreshed");
        }

    } catch (error) {
        console.error("Click handler error:", error);
        showNotification("An error occurred. Please try again.", "error");
    }
});


// --- Global Event Listener (Form Submissions) ---
document.body.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    try {
        if (form.id === "auth-form") {
            const { email, password, inviteCode, username, designation } = getFormObj(form);
            if (authMode === "login") {
                const q = query(collection(db, "admins"), where("username", "==", username));
                const snap = await getDocs(q);
                if (snap.empty) { throw new Error("Invalid username or password."); }
                await signInWithEmailAndPassword(auth, snap.docs[0].data().email, password);
            } else {
                if (inviteCode !== ADMIN_INVITE_CODE) { throw new Error("Invalid admin invite code."); }
                const q = query(collection(db, "admins"), where("username", "==", username));
                if (!(await getDocs(q)).empty) { throw new Error("Username is already taken."); }
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "admins", cred.user.uid), { email, username, designation, createdAt: Timestamp.now() });
                showNotification("Admin account created!");
            }
        }
        else if (form.id === "request-form") {
            let user = auth.currentUser;
            if (!user) user = (await signInAnonymously(auth)).user;
            const data = getFormObj(form);
            const payload = {
                ...data,
                requesterId: user.uid,
                vehicleNumber: data.vehicleNumber.toUpperCase(),
                entryDate: Timestamp.fromDate(parseLocalDate(data.entryDate)),
                expiryDate: Timestamp.fromDate(parseLocalDate(data.expiryDate)),
                escortRequired: !!data.escortRequired,
                status: "pending",
                createdAt: Timestamp.now()
            };
            const docRef = await addDoc(collection(db, "clearanceRequests"), payload);
            showNotification("Request submitted successfully!");
            render.renderLandingPage({ trackingResultHTML: render.createStatusCard({ id: docRef.id, ...payload }), vehicleNumber: payload.vehicleNumber });
        }
        else if (form.id === "track-request-form") {
            const vehicleNumber = form.querySelector("input").value.trim().toUpperCase();
            if (!vehicleNumber) return;
            render.renderLandingPage({ trackingResultHTML: render.createLoadingCard(), vehicleNumber });
            if (!auth.currentUser) await signInAnonymously(auth);
            const status = await dbManager.findCurrentVehicleStatus(db, vehicleNumber);
            const resultHTML = status ? render.createStatusCard(status) : render.createNotFoundCard(vehicleNumber);
            render.renderLandingPage({ trackingResultHTML: resultHTML, vehicleNumber });
        }
        else if (form.id === "rejection-form") {
            await handleRejection(form);
        }
        else if (form.id === "user-password-form") {
            const { password } = getFormObj(form);
            if (password && password.length >= 6) {
                await setDoc(doc(db, "publicConfig", "userAccess"), { password });
                showNotification("User access password updated!");
            } else { throw new Error("Password must be >= 6 characters."); }
        }
        else if (form.id === "add-vvip-form") {
            const data = getFormObj(form);
            await addDoc(collection(db, "vvips"), { vehicleNumber: data.vehicleNumber.toUpperCase(), designation: data.designation });
            showNotification("VVIP added.");
            form.reset();
        }
        else if (form.id === "secure-user-login-form") {
            await dbManager.handleSecureUserLogin(getFormObj(form).userID);
        }
        else if (form.id === "add-user-id-form") {
            const data = getFormObj(form);
            if(await dbManager.validateUserID(db, data.userId)) throw new Error("User ID already exists");
            await addDoc(collection(db, "authorizedUsers"), { userId: data.userId.toUpperCase(), description: data.description, isActive: true, createdAt: Timestamp.now(), lastUsed: null });
            showNotification("User ID added");
            form.reset();
            render.renderAuthorizedUsersList(db);
        }
        else if (form.id === "add-location-form") {
             const data = getFormObj(form);
            await dbManager.addLocation(db, data);
            showNotification("Location added");
            form.reset();
            render.renderAllowedLocationsList(db);
        }

    } catch (error) {
        showNotification(`${error.message}`, "error");
    } finally {
        if (button) button.disabled = false;
    }
});


// --- Logic Handlers ---

const handleSaveClearance = async (button) => {
    const form = button.closest('form');
    if (!form) throw new Error("Cannot find clearance form.");
    
    const data = getFormObj(form);
    const entryDate = parseLocalDate(data.entryDate);
    const expiryDate = parseLocalDate(data.expiryDate);

    if (!entryDate || !expiryDate || !form.checkValidity()) {
        form.reportValidity();
        throw new Error("Please fill all required fields.");
    }
    if (!currentAdminProfile) throw new Error("Admin profile not loaded.");

    const payload = {
        ownerName: data.ownerName,
        vehicleNumber: data.vehicleNumber.toUpperCase(),
        vehicleType: data.vehicleType,
        location: data.location === "Other" ? data.customLocation : data.location,
        entryDate: Timestamp.fromDate(entryDate),
        expiryDate: Timestamp.fromDate(expiryDate),
        escortRequired: !!data.escortRequired,
        notes: data.notes || ""
    };
    
    const editingId = button.dataset.id;
    if (editingId) {
        const existingDoc = await getDoc(doc(db, "vehicleClearances", editingId));
        const history = existingDoc.data().approvalHistory || [];
        history.push({ action: 'updated', byUsername: currentAdminProfile.username, byDesignation: currentAdminProfile.designation, timestamp: Timestamp.now() });
        payload.approvalHistory = history;
        payload.lastUpdatedAt = Timestamp.now();
        payload.lastUpdatedByUsername = currentAdminProfile.username;
        payload.lastUpdatedByDesignation = currentAdminProfile.designation;
        await updateDoc(doc(db, "vehicleClearances", editingId), payload);
        showNotification(`Clearance updated by ${currentAdminProfile.username}`);
    } else {
        payload.createdAt = Timestamp.now();
        payload.approvedByUsername = currentAdminProfile.username;
        payload.approvedByDesignation = currentAdminProfile.designation;
        payload.approvedAt = Timestamp.now();
        payload.approvalHistory = [{ action: 'created', byUsername: currentAdminProfile.username, byDesignation: currentAdminProfile.designation, timestamp: Timestamp.now() }];
        await addDoc(collection(db, "vehicleClearances"), payload);
        showNotification(`Clearance created by ${currentAdminProfile.username}`);
    }
    document.getElementById("modal-container").innerHTML = "";
};

const handleApproval = async (button) => {
    const form = button.closest('form');
    const requestId = button.dataset.id;
    if (!form || !requestId) throw new Error("Cannot find form or request ID.");

    const originalRequest = clearanceRequests.find(r => r.id === requestId);
    if (!originalRequest) throw new Error("Cannot find original request in state.");
    
    const data = getFormObj(form);
    const entryDate = parseLocalDate(data.entryDate);
    const expiryDate = parseLocalDate(data.expiryDate);
    if (!entryDate || !expiryDate) throw new Error("Invalid dates.");
    if (!currentAdminProfile) throw new Error("Admin profile not loaded.");
    
    const approvalTimestamp = Timestamp.now();
    const clearancePayload = {
        ownerName: data.ownerName, vehicleNumber: data.vehicleNumber.toUpperCase(), vehicleType: data.vehicleType,
        location: data.location === "Other" ? data.customLocation : data.location,
        entryDate: Timestamp.fromDate(entryDate), expiryDate: Timestamp.fromDate(expiryDate),
        escortRequired: !!data.escortRequired, notes: data.notes || "", createdAt: approvalTimestamp,
        approvedByUsername: currentAdminProfile.username, approvedByDesignation: currentAdminProfile.designation, approvedAt: approvalTimestamp,
        approvalHistory: [{ action: 'approved', byUsername: currentAdminProfile.username, byDesignation: currentAdminProfile.designation, timestamp: approvalTimestamp, notes: `From request ID: ${requestId}` }]
    };
    
    await addDoc(collection(db, "vehicleClearances"), clearancePayload);
    await updateDoc(doc(db, "clearanceRequests", requestId), { status: 'approved', approvedBy: currentAdminProfile.username, approvedAt: approvalTimestamp });
    showNotification(`Request approved by ${currentAdminProfile.username}`);
    
    if (originalRequest.requesterEmail) {
        try {
            showNotification("Generating approval email...", "info");
            const emailPrompt = `Generate a professional HTML email. The user's vehicle clearance request is APPROVED. Details: Vehicle: ${clearancePayload.vehicleNumber}, Location: ${clearancePayload.location}, Validity: From ${data.entryDate} to ${data.expiryDate}. Keep it concise.`;
            const emailBody = await api.callGeminiApi(emailPrompt);
            await api.sendEmail(originalRequest.requesterEmail, `Vehicle Clearance Approved: ${clearancePayload.vehicleNumber}`, emailBody);
        } catch (emailError) {
            console.error("Email notification failed:", emailError);
            showNotification("Approval saved, but failed to send email.", "error");
        }
    }
    document.getElementById("modal-container").innerHTML = "";
};

const handleRejection = async (form) => {
    const { rejectionReason } = getFormObj(form);
    const requestId = form.querySelector('button[type="submit"]').dataset.id;
    if (!rejectionReason.trim()) throw new Error("Rejection reason is required.");

    const originalRequest = clearanceRequests.find(r => r.id === requestId);
    if (!originalRequest) throw new Error("Could not find original request.");

    await updateDoc(doc(db, "clearanceRequests", requestId), { 
        status: 'rejected', 
        rejectionReason: rejectionReason.trim(),
        reviewedBy: currentAdminProfile.username,
        reviewedAt: Timestamp.now()
    });
    showNotification("Request rejected.");

    if (originalRequest.requesterEmail) {
        try {
            showNotification("Generating rejection email...", "info");
            const emailPrompt = `Generate a professional HTML email. The user's vehicle clearance request is REJECTED. Details: Vehicle: ${originalRequest.vehicleNumber}, Reason: "${rejectionReason.trim()}". Keep it concise.`;
            const emailBody = await api.callGeminiApi(emailPrompt);
            await api.sendEmail(originalRequest.requesterEmail, `Update on Vehicle Request: ${originalRequest.vehicleNumber}`, emailBody);
        } catch (emailError) {
            console.error("Email notification failed:", emailError);
            showNotification("Rejection saved, but failed to send email.", "error");
        }
    }
    document.getElementById("modal-container").innerHTML = "";
};

const handleGetCurrentLocation = async (button) => {
    button.disabled = true;
    const originalText = button.innerHTML;
    button.innerHTML = '<div class="animate-spin w-4 h-4 border-t-transparent border-2 rounded-full mx-auto"></div>';
    try {
        const location = await dbManager.getCurrentLocation();
        const form = button.closest('form');
        form.latitude.value = location.latitude.toFixed(6);
        form.longitude.value = location.longitude.toFixed(6);
        showNotification(`Location captured! Accuracy: ±${Math.round(location.accuracy)}m`);
    } catch (error) {
        showNotification(`Location error: ${error.message}`, "error");
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
};

// --- Other Listeners & Initial Load ---
document.body.addEventListener("change", (e) => {
    const form = e.target.closest('form');
    if (e.target.name === "location") {
        const customInput = form?.querySelector('input[name="customLocation"]');
        if (customInput) {
            const isOther = e.target.value === "Other";
            customInput.classList.toggle('hidden', !isOther);
            customInput.required = isOther;
            if(!isOther) customInput.value = '';
        }
    } else if (e.target.name === "escortRequired") {
        const textareaId = form?.id === 'review-form' ? 'review-notes-textarea' : 'modal-notes-textarea';
        render.handleEscortCheckboxChange(e.target, textareaId);
    }
});

document.body.addEventListener("input", e => {
    if (e.target.id === 'daily-clearance-search-input') {
        render.renderClearanceListForUser(clearances, e.target.value.toUpperCase());
    }
});
document.body.addEventListener("reset", e => {
    if (e.target.id === "daily-clearance-search-form") {
        setTimeout(() => render.renderClearanceListForUser(clearances, null), 0);
    }
});

window.addEventListener('load', initializeVoiceRecognition);

render.renderLandingPage(); // Initial render