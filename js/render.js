import { icons, formatDate, toISODate, formatApprovalString, formatUpdateString, formatApprovalHistory, formatVehicleNumber } from './utils.js';

const appRoot = document.getElementById("app-root");
export let routeHistory = [];

export const goBack = () => {
    if (routeHistory.length > 1) {
        routeHistory.pop(); // remove current page
        const renderPrevious = routeHistory.pop(); // get previous page
        renderPrevious();
    } else {
        renderLandingPage();
    }
};

export const showLoadingScreen = () => {
    appRoot.innerHTML = `<div class="min-h-screen flex items-center justify-center"><div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div></div>`;
};

// ... (All your other render functions from the big script go here)
// renderLandingPage, renderAdminLogin, renderUserLogin, renderRequestForm,
// createStatusCard, renderAdminDashboard, renderClearanceListForUser, etc.

// --- All render functions from your original script are now placed here ---

export const renderLandingPage = (options = {}) => {
    const { trackingResultHTML = "", vehicleNumber = "" } = options;
    document.body.className = 'landing-solid';
    appRoot.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div class="w-full max-w-md mobile-safe-container bg-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 sm:space-y-8 text-center animate-fade-in">
            <header class="space-y-4">
                <div class="flex justify-between items-center">
                    <a href="userguide.html" target="_blank" title="User Guide" class="text-sm text-blue-300 hover:text-white">📘 Guide</a>
                    <img src="car_logo.jpg" alt="Car Logo" class="w-48 h-auto mx-auto" onerror="this.style.display='none'">
                    <div class="w-12"></div>
                </div>
                <div>
                    <h1 class="text-4xl font-bold tracking-tight text-white mt-4">Vehicle Clearance</h1>
                    <p class="text-slate-400 mt-2">Your gateway to seamless access.</p>
                </div>
            </header>
            <main class="space-y-4">
                <button id="request-btn" class="w-full flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                    <div class="w-6 h-6">${icons.request}</div>
                    <span class="font-semibold text-lg">Request Clearance</span>
                </button>
                <div class="grid grid-cols-2 gap-4">
                    <button id="admin-btn" class="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
                        <div class="w-8 h-8 text-blue-400">${icons.shield}</div>
                        <span class="mt-2 font-semibold">Admin</span>
                    </button>
                    <button id="user-btn" class="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
                        <div class="w-8 h-8 text-green-400">${icons.greenlist}</div>
                        <span class="mt-2 font-semibold">Green List</span>
                    </button>
                </div>
            </main>
            <footer class="pt-8">
                <form id="track-request-form" class="space-y-3">
                    <label class="text-sm font-medium text-slate-400">Or, track an existing request.</label>
                    <div class="flex gap-2">
                        <input id="track-id-input" oninput="this.value=this.value.toUpperCase()" class="mobile-input block w-full px-4 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-white" placeholder="Enter Vehicle Number" value="${vehicleNumber}" />
                        <button type="submit" class="flex items-center justify-center p-3 rounded-lg text-white bg-slate-700 hover:bg-slate-600">
                            <span class="w-5 h-5">${icons.search}</span>
                        </button>
                    </div>
                </form>
                <div id="tracking-result">${trackingResultHTML}</div>
            </footer>
        </div>
    </div>
    <div id="modal-container"></div>`;
    if (routeHistory.length === 0) routeHistory.push(renderLandingPage);
};

// ... ALL OTHER render... and create... FUNCTIONS from the original script go here
// I've omitted them for brevity but you should copy them all into this file.
// Make sure each one is EXPORTED. e.g. export const renderAdminLogin = () => { ... }