// js/render.js
import { icons, formatDate, toISODate, formatApprovalString, formatUpdateString, formatApprovalHistory, formatVehicleNumber } from './utils.js';
import { db } from './firebase.js';
import { collection, query, orderBy, limit, getDocs, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// This file no longer has a single 'appRoot' constant at the top.
// Instead, each function will find it just before it needs it.
export let routeHistory = [];

export const goBack = () => {
    // ... (This function remains the same)
};

export const renderLandingPage = (options = {}) => {
    const appRoot = document.getElementById("app-root"); // Find the div here
    // ... (The rest of the function is the same)
};

export const renderAdminLogin = (authMode) => {
    const appRoot = document.getElementById("app-root"); // Find the div here
    // ... (The rest of the function is the same)
};

// ... AND SO ON FOR EVERY SINGLE RENDER FUNCTION IN THE FILE ...
// Each function that starts with "export const render..." should have
// 'const appRoot = document.getElementById("app-root");' as its first line.