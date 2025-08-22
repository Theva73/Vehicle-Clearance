// js/main.js
console.log("main.js: Script started");

import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, query, Timestamp, getDoc, where, updateDoc, getDocs, orderBy, writeBatch, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import * as render from './render.js';
import * as dbManager from './database.js';
import * as api from './api.js';
import { showNotification, getFormObj, parseLocalDate, isValidSecureSession } from './utils.js';
import { initializeVoiceRecognition, startVoiceSearch } from './voice-search.js';
import { generatePDFReport } from './pdf-generator.js';

console.log("main.js: All modules imported");

// --- State Management & Config ---
let clearances = [], clearanceRequests = [], vvips = [], userPasswordConfig = null, currentAdminProfile = null;
let unsubClearances = null, unsubRequests = null, unsubConfig = null, unsubVVIPs = null;
let authMode = "login";
const ADMIN_INVITE_CODE = "ADMIN2025";
const DEFAULT_USER_PASSWORD = "123456";

console.log("main.js: State and config loaded");

// --- Auth State Listener ---
onAuthStateChanged(auth, async (user) => {
    // This code only runs when login status changes
    // ...
});
console.log("main.js: Auth listener attached");

// --- Global Event Listeners ---
document.body.addEventListener("click", async (e) => { /* ... click logic ... */ });
document.body.addEventListener("submit", async (e) => { /* ... submit logic ... */ });
console.log("main.js: Event listeners attached");

// --- Logic Handlers ---
const handleSaveClearance = async (button) => { /* ... */ };
const handleApproval = async (button) => { /* ... */ };
const handleRejection = async (form) => { /* ... */ };
const handleGetCurrentLocation = async (button) => { /* ... */ };
console.log("main.js: Logic handlers defined");

// --- Other Listeners & Initial Load ---
window.addEventListener('load', initializeVoiceRecognition);
console.log("main.js: 'load' event listener attached");

console.log("main.js: About to call renderLandingPage()...");
render.renderLandingPage();
console.log("main.js: renderLandingPage() called successfully. Script finished.");