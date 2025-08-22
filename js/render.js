// js/render.js
import { icons, formatDate, toISODate, formatApprovalString, formatUpdateString, formatApprovalHistory, formatVehicleNumber } from './utils.js';
import { db } from './firebase.js';
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const appRoot = document.getElementById("app-root");
export let routeHistory = [];

export const goBack = () => {
    if (routeHistory.length > 1) {
        routeHistory.pop(); // Pop the current page's render function
        const renderPrevious = routeHistory[routeHistory.length - 1]; // Get the previous one
        renderPrevious(); // Render it
    } else {
        renderLandingPage();
    }
};

export const showLoadingScreen = () => {
    appRoot.innerHTML = `<div class="min-h-screen flex items-center justify-center"><div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div></div>`;
};

export const renderLandingPage = (options = {}) => {
    const { trackingResultHTML = "", vehicleNumber = "" } = options;
    document.body.className = 'landing-solid';
    let trackingSection = '';
    if (trackingResultHTML) {
        trackingSection = `
            <div class="mt-6 space-y-4">
                <h3 class="text-sm font-medium text-slate-300">Tracking Result:</h3>
                ${trackingResultHTML}
                <button id="clear-tracking-btn" class="w-full px-4 py-2 text-sm bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">Clear Result</button>
            </div>
        `;
    }

    appRoot.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div class="w-full max-w-md mobile-safe-container bg-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 sm:space-y-8 text-center animate-fade-in">
            <header class="space-y-4">
              <div class="flex justify-between items-center">
                <a href="userguide.html" target="_blank" title="User Guide" class="text-sm text-blue-300 hover:text-white">
                  📘 Guide
                </a>
                <img src="car_logo.jpg" alt="Car Logo" class="w-48 h-auto mx-auto" onerror="this.style.display='none'">
                <div class="w-12"></div>
              </div>
                <div>
                    <h1 class="text-4xl font-bold tracking-tight text-white mt-4">Vehicle Clearance</h1>
                    <p class="text-slate-400 mt-2">Your gateway to seamless access.</p>
                </div>
            </header>

            <main class="space-y-4">
                <button id="request-btn" class="w-full flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-600/20">
                    <div class="w-6 h-6">${icons.request}</div>
                    <span class="font-semibold text-lg">Request Clearance</span>
                </button>
                <div class="grid grid-cols-2 gap-4">
                    <button id="admin-btn" class="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors duration-300">
                        <div class="w-8 h-8 text-blue-400">${icons.shield}</div>
                        <span class="mt-2 font-semibold">Admin</span>
                    </button>
                    <button id="user-btn" class="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors duration-300">
                        <div class="w-8 h-8 text-green-400">${icons.greenlist}</div>
                        <span class="mt-2 font-semibold">Green List</span>
                    </button>
                </div>
            </main>

            <footer class="pt-8">
                <form id="track-request-form" class="space-y-3">
                    <label class="text-sm font-medium text-slate-400">Or, track an existing request.</label>
                    <div class="flex gap-2">
                        <input id="track-id-input" oninput="this.value=this.value.toUpperCase()" class="mobile-input block w-full px-4 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter Vehicle Number" value="${vehicleNumber}" />
                        <button type="submit" class="flex items-center justify-center px-4 py-2 rounded-lg text-white bg-slate-700 hover:bg-slate-600 transition-colors">
                            <span class="w-5 h-5">${icons.search}</span>
                        </button>
                    </div>
                </form>
                <div id="tracking-result">${trackingSection}</div>
            </footer>
        </div>
    </div>
    <div id="modal-container"></div>`;
    routeHistory = [() => renderLandingPage(options)];
};

export const renderAdminLogin = (authMode) => {
    document.body.className = 'dark-theme-bg';
    const isSignup = authMode === "signup";
    appRoot.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-md mobile-safe-container bg-slate-800/80 backdrop-blur-sm border border-blue-500/20 rounded-2xl shadow-2xl shadow-blue-900/20 p-8 space-y-6 animate-fade-in">
            <div class="text-center">
                <div class="w-12 h-12 mx-auto text-blue-400">${icons.shield}</div>
                <h1 class="text-3xl font-bold text-white mt-4">Admin Access</h1>
                <p class="text-slate-400">${isSignup ? "Create an admin account" : "Sign in to manage clearances"}</p>
            </div>
            <form id="auth-form" class="space-y-4">
                <div class="${isSignup ? '' : 'hidden'}">
                    <label class="text-sm font-medium text-slate-300">Admin Invite Code</label>
                    <input type="text" name="inviteCode" class="mobile-input mt-1 block w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" placeholder="Enter the secret code" />
                </div>
                 <div class="${isSignup ? '' : 'hidden'}">
                    <label class="text-sm font-medium text-slate-300">Email</label>
                    <input type="email" name="email" class="mobile-input mt-1 block w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" placeholder="admin@example.com" ${isSignup ? 'required' : ''} />
                </div>
                <div>
                    <label class="text-sm font-medium text-slate-300">Username</label>
                    <input type="text" name="username" class="mobile-input mt-1 block w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" placeholder="e.g., steve" required />
                </div>
                <div class="${isSignup ? '' : 'hidden'}">
                    <label class="text-sm font-medium text-slate-300">Designation</label>
                    <input type="text" name="designation" class="mobile-input mt-1 block w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" placeholder="e.g., AD,OC,APO..." ${isSignup ? 'required' : ''} />
                </div>
                <div>
                    <label class="text-sm font-medium text-slate-300">Password</label>
                    <input type="password" name="password" class="mobile-input mt-1 block w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" placeholder="••••••••" required />
                </div>
                <button type="submit" class="w-full flex justify-center py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 mobile-button">${isSignup ? "Sign Up" : "Login"}</button>
            </form>
            <p class="text-center text-sm text-slate-400">
                <span>${isSignup ? "Already have an account?" : "Need an admin account?"}</span>
                <button id="auth-toggle-button" class="font-medium text-blue-400 hover:text-blue-300 ml-1">${isSignup ? "Login" : "Sign Up"}</button>
            </p>
            <button id="back-btn" class="mt-2 text-slate-400 hover:text-slate-200 underline text-sm block mx-auto">Back</button>
        </div>
    </div>`;
    routeHistory.push(() => renderAdminLogin(authMode));
};

export const renderUserLogin = () => {
    document.body.className = 'dark-theme-bg';
    appRoot.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-md mobile-safe-container bg-slate-800/80 backdrop-blur-sm border border-green-500/20 rounded-2xl shadow-2xl shadow-green-900/20 p-8 space-y-6 animate-fade-in text-center">
            <div class="w-12 h-12 mx-auto text-green-400">${icons.greenlist}</div>
            <h1 class="text-3xl font-bold text-white mt-4">Secure Access</h1>
            <p class="text-slate-400">Enter your User ID and verify location</p>
            <form id="secure-user-login-form" class="space-y-4 pt-4">
                <div>
                    <label class="text-sm font-medium text-slate-300">User ID</label>
                    <input type="text" name="userID" class="mobile-input block w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" placeholder="Enter your User ID" oninput="this.value=this.value.toUpperCase()" required />
                </div>
                <div id="location-status" class="hidden p-3 rounded-lg border border-blue-500/30 bg-blue-500/10">
                    <div class="flex items-center gap-2 justify-center">
                        <div class="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                        <span class="text-sm text-blue-300">Verifying your location...</span>
                    </div>
                </div>
                <div id="location-help" class="hidden p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                    <div class="text-xs text-yellow-300">
                        <p class="font-semibold mb-1">📍 Location Access Required</p>
                        <p>This system requires location verification for security. Please enable location permissions when prompted.</p>
                    </div>
                </div>
                <button type="submit" class="w-full py-3 px-4 rounded-lg text-white bg-green-600 hover:bg-green-700 mobile-button">
                    🔍 Verify Access
                </button>
            </form>
            <div class="text-xs text-slate-500 space-y-1">
                <p>🔒 Secure access requires:</p>
                <p>• Valid User ID</p>
                <p>• Physical presence at authorized location</p>
            </div>
            <button id="back-btn" class="mt-4 text-slate-400 hover:text-slate-200 underline text-sm">Back</button>
        </div>
    </div>`;
    routeHistory.push(renderUserLogin);
};

export const renderRequestForm = () => {
    document.body.className = 'dark-theme-bg';
    appRoot.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-lg mobile-safe-container bg-slate-800/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl shadow-2xl shadow-yellow-900/20 p-8 space-y-6 animate-fade-in">
            <div class="text-center">
                <div class="w-12 h-12 mx-auto text-yellow-400">${icons.request}</div>
                <h1 class="text-3xl font-bold text-white mt-4">Request Vehicle Clearance</h1>
                <p class="text-slate-400">Fill in the details below</p>
            </div>
            <form id="request-form" class="space-y-4 text-left">
                <div>
                    <label class="text-sm font-medium text-slate-300">Your Name</label>
                    <input name="requesterName" class="mobile-input mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" placeholder="e.g. John Doe" required />
                </div>
                 <div>
                    <label class="text-sm font-medium text-slate-300">Your Email Address</label>
                    <input type="email" name="requesterEmail" placeholder="you@example.com" class="mobile-input mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" required />
                </div>
                <div>
                    <label class="text-sm font-medium text-slate-300">Vehicle Number</label>
                    <input name="vehicleNumber" oninput="this.value=this.value.toUpperCase()" class="mobile-input mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" required />
                </div>
                <div>
                    <label class="text-sm font-medium text-slate-300">Vehicle Type</label>
                    <select name="vehicleType" class="mobile-input mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" required>
                        <option value="">Select type...</option>
                        <option>Car</option><option>Motorcycle</option><option>Van</option><option>Tow Truck</option><option>Lorry</option><option>Bus</option><option>Others</option>
                    </select>
                </div>
                <div>
                    <label class="text-sm font-medium text-slate-300">Location</label>
                    <select name="location" class="mobile-input mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" required>
                        <option value="PCC" selected>PCC</option>
                    </select>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="text-sm font-medium text-slate-300">Entry Date</label>
                        <input type="date" name="entryDate" class="mobile-input mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" required />
                    </div>
                    <div>
                        <label class="text-sm font-medium text-slate-300">Expiry Date</label>
                        <input type="date" name="expiryDate" class="mobile-input mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" required />
                    </div>
                </div>
                <div>
                    <label class="text-sm font-medium text-slate-300">Notes</label>
                    <textarea name="notes" rows="3" class="mobile-input mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" placeholder="Purpose of entry"></textarea>
                </div>
                <div class="flex justify-between pt-4">
                    <button id="back-btn" type="button" class="px-6 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 mobile-button">Back</button>
                    <button type="submit" class="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 mobile-button">Submit</button>
                </div>
            </form>
        </div>
    </div>`;
    routeHistory.push(renderRequestForm);
};

export const createStatusCard = (r) => {
    // ... logic to create status card HTML ...
};

export const createNotFoundCard = (vehicleNumber) => {
    // ... logic to create 'not found' card HTML ...
};

export const createLoadingCard = () => {
    return `<div class="mt-6 space-y-4"><div class="p-4 bg-slate-900/50 border border-slate-700 rounded-xl text-center animate-fade-in"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div><p class="text-slate-400 text-sm">Searching for current status...</p></div></div>`;
};

// ... (Rest of the many render functions go here, fully implemented and exported)
// e.g., export const renderAdminDashboard = (adminUser, userPasswordConfig) => { ... };