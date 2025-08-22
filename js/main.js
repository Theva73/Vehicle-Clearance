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
        // This will call render functions from the render.js module
        // Example: render.renderAdminDashboard(currentAdminProfile);
    } else if (user && user.isAnonymous && isValidSecureSession()) {
        // ... (logic for secure user session)
        // Example: render.showUserDashboard(user);
    } else {
        sessionStorage.removeItem('isDashboardLogin');
        sessionStorage.removeItem('currentUserID');
        sessionStorage.removeItem('accessLocation');
        render.renderLandingPage();
    }
});

// --- Global Event Listener (for clicks) ---
document.body.addEventListener("click", async (e) => {
    // ... (All your click handling logic goes here)
    // It will call functions from other modules.
    // Example for back button:
    const button = e.target.closest('button');
    if (!button) return;

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
    // ... etc. for all other buttons
});

// --- Global Event Listener (for form submissions) ---
document.body.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    // ... (All your form submission logic goes here)
    // Example for auth form:
    if (form.id === "auth-form") {
        const { email, password, inviteCode, username, designation } = getFormObj(form);
        if (authMode === "login") {
            // ... login logic
        } else {
            // ... signup logic
        }
    }
    // ... etc. for all other forms
});


// --- Initial Load ---
// Any setup that needs to run on page load, like initializing voice search
// can be called here.
render.renderLandingPage();
