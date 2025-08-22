// js/main.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, query, Timestamp, getDoc, where, updateDoc, getDocs, orderBy, writeBatch, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { showNotification, getFormObj, parseLocalDate, isValidSecureSession } from './utils.js';
import * as render from './render.js';
import { callGeminiApi, sendEmail } from './api.js';
// Import other modules as needed (e.g., database.js, voice-search.js)

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
        // ... (logic for authenticated admin user)
    } else if (user && user.isAnonymous && isValidSecureSession()) {
        // ... (logic for secure user session)
    } else {
        sessionStorage.removeItem('isDashboardLogin');
        sessionStorage.removeItem('currentUserID');
        sessionStorage.removeItem('accessLocation');
        render.renderLandingPage();
    }
});

// --- Global Event Listener (for clicks) ---
document.body.addEventListener("click", async (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    if (button.id === "request-btn") {
        console.log("Request Clearance button clicked!");
        render.renderRequestForm(); // UPDATED: Calls the new render function
        return;
    }

    if (button.id === "admin-btn") {
        console.log("Admin button clicked!");
        render.renderAdminLogin("login");
        return;
    }

    if (button.id === "user-btn") {
        console.log("Green List button clicked!");
        render.renderUserLogin(); // UPDATED: Calls the new render function
        return;
    }
    
    if (button.id === "back-btn") {
        e.preventDefault();
        render.goBack();
        return;
    }
    
    if (button.id === "auth-toggle-button") { 
        e.preventDefault(); 
        authMode = authMode === "login" ? "signup" : "login"; 
        render.renderAdminLogin(authMode); 
        return; 
    }
});

// --- Global Event Listener (for form submissions) ---
document.body.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    
    if (form.id === "auth-form") {
        const { email, password, inviteCode, username, designation } = getFormObj(form);
        if (authMode === "login") {
            // ... login logic here
        } else {
            // ... signup logic here
        }
    } 
    // --- NEW: LOGIC TO HANDLE THE NEW REQUEST FORM ---
    else if (form.id === "request-form") {
        const formData = getFormObj(form);
        console.log("New Request Submitted:", formData);
        // TODO: Add logic to save this data to your 'clearanceRequests' collection in Firestore
        showNotification("Request submitted successfully! Awaiting approval.", "success");
        render.renderLandingPage(); // Go back to home page after submission
    }
    // --- NEW: LOGIC TO HANDLE THE USER/GREEN LIST LOGIN FORM ---
    else if (form.id === "user-login-form") {
        const { accessCode } = getFormObj(form);
        console.log("User login attempt with code:", accessCode);
        // TODO: Add logic to verify the access code
        if (accessCode === "YOUR_CODE_HERE") { // Replace with your actual code check
             showNotification("Access granted!", "success");
            // e.g., render.renderGreenListPage();
        } else {
            showNotification("Invalid access code.", "error");
        }
    }
});


// --- Initial Load ---
render.renderLandingPage();