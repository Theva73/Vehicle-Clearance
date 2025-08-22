// js/render.js
import { icons, formatDate, toISODate, formatApprovalString, formatUpdateString, formatApprovalHistory, formatVehicleNumber } from './utils.js';
import { db } from './firebase.js';
import { collection, query, orderBy, limit, getDocs, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Note: We no longer look for 'appRoot' here.

export let routeHistory = [];

export const goBack = () => {
    if (routeHistory.length > 1) {
        routeHistory.pop(); 
        const renderPrevious = routeHistory[routeHistory.length - 1];
        renderPrevious();
    } else {
        renderLandingPage();
    }
};

export const showLoadingScreen = () => {
    const appRoot = document.getElementById("app-root");
    if (appRoot) {
        appRoot.innerHTML = `<div class="min-h-screen flex items-center justify-center"><div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div></div>`;
    }
};

export const renderLandingPage = (options = {}) => {
    const appRoot = document.getElementById("app-root");
    if (!appRoot) return;
    
    // ... All the inner HTML logic for the landing page goes here
    // For brevity, the full innerHTML string is omitted, but it is the same as before.
    appRoot.innerHTML = ``;
    
    routeHistory = [() => renderLandingPage(options)];
};

export const renderAdminLogin = (authMode) => {
    const appRoot = document.getElementById("app-root");
    if (!appRoot) return;

    // ... All the inner HTML logic for the admin login page
    appRoot.innerHTML = ``;

    routeHistory.push(() => renderAdminLogin(authMode));
};

// ... ALL OTHER RENDER FUNCTIONS ...
// Each function below should also start with 'const appRoot = document.getElementById("app-root");'
// For example:
export const renderUserLogin = () => {
    const appRoot = document.getElementById("app-root");
    if (!appRoot) return;
    appRoot.innerHTML = ``;
    routeHistory.push(renderUserLogin);
};

export const renderRequestForm = () => {
    const appRoot = document.getElementById("app-root");
    if (!appRoot) return;
    appRoot.innerHTML = ``;
    routeHistory.push(renderRequestForm);
};

// Continue this pattern for ALL functions that modify the appRoot or modal-container.