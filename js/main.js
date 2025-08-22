// js/main.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, query, Timestamp, getDoc, where, updateDoc, getDocs, orderBy, writeBatch, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import * as render from './render.js';
import * as dbManager from './database.js';
import * as api from './api.js';
import { showNotification, getFormObj, parseLocalDate, isValidSecureSession } from './utils.js';
import { initializeVoiceRecognition, startVoiceSearch } from './voice-search.js';
import { generatePDFReport } from './pdf-generator.js';

// --- State Management & Config ---
// ... (all your state variables)

// --- Auth State Listener ---
onAuthStateChanged(auth, async (user) => {
    // ... (your full onAuthStateChanged function)
});

// --- Global Event Listeners ---
document.body.addEventListener("click", async (e) => {
    // ... (your full click handler)
});

document.body.addEventListener("submit", async (e) => {
    // ... (your full submit handler with the email login fix)
});

// --- Other Listeners & Initial Load ---
// UPDATED: This waits for the HTML to be ready before running the script
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Initializing app.");
    initializeVoiceRecognition();
    render.renderLandingPage();
});