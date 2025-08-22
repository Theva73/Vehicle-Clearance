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
    // This function is complex and should be copied from your last complete version
});

// --- Global Event Listener (Clicks) ---
document.body.addEventListener("click", async (e) => {
    // This is the full click handler from your original script
    const target = e.target;
    const button = target.closest('button');
    
    // Logic for closing modals
    if (['settings-backdrop', 'form-modal-backdrop', 'review-modal-backdrop', 'vvip-modal-backdrop', 'rejection-modal-backdrop'].includes(target.id)) {
        if (e.target.id === target.id) target.closest('#modal-container').innerHTML = '';
    }
    
    if (!button) return;

    try {
        if (button.id === "request-btn") { 
            render.renderRequestForm(); 
        } else if (button.id === "admin-btn") { 
            render.renderAdminLogin(authMode); 
        } else if (button.id === "user-btn") { 
            render.renderUserLogin(); 
        }
        // ... ALL OTHER 'if/else if' conditions for every other button from your original script go here ...
    } catch (error) {
        console.error("Click handler error:", error);
        showNotification("An error occurred.", "error");
    }
});

// --- Global Event Listener (Form Submissions) ---
document.body.addEventListener("submit", async (e) => {
    // This is the full submit handler with the corrected login logic
    e.preventDefault();
    const form = e.target;
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    try {
        if (form.id === "auth-form") {
            const { loginEmail, email, password, inviteCode, username, designation } = getFormObj(form);

            if (authMode === "login") {
                if (!loginEmail || !password) throw new Error("Email and password are required.");
                await signInWithEmailAndPassword(auth, loginEmail, password);
                showNotification("Login successful!", "success");
            } else {
                if (inviteCode !== ADMIN_INVITE_CODE) throw new Error("Invalid admin invite code.");
                const q = query(collection(db, "admins"), where("username", "==", username));
                if (!(await getDocs(q)).empty) throw new Error("Username is already taken.");
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "admins", cred.user.uid), { email, username, designation, createdAt: Timestamp.now() });
                showNotification("Admin account created successfully!");
            }
        }
        // ... ALL OTHER 'else if' conditions for every other form from your original script go here ...
    } catch (error) {
        showNotification(`${error.message}`, "error");
    } finally {
        if (button) button.disabled = false;
    }
});


// ... All other Logic Handlers, other listeners, and the initial render call go here ...