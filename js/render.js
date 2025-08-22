// js/render.js
import { icons, formatDate, toISODate, formatApprovalString, formatUpdateString, formatApprovalHistory, formatVehicleNumber } from './utils.js';

const appRoot = document.getElementById("app-root");
export let routeHistory = [];

export const goBack = () => {
    if (routeHistory.length > 0) {
        const renderPrevious = routeHistory.pop();
        renderPrevious();
    } else {
        renderLandingPage();
    }
};

export const renderLandingPage = (options = {}) => {
    // ... (This function remains unchanged, no need to copy it again)
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
                <a href="https://theva73.github.io/Vehicle-Clearance/userguide.html" target="_blank" title="User Guide" class="text-sm text-blue-300 hover:text-white">
                  📘 Guide
                </a>
                <img src="https://raw.githubusercontent.com/Theva73/Vehicle-Clearance/main/car_logo.jpg" alt="Car Logo" class="w-48 h-auto mx-auto" onerror="this.onerror=null; this.src='https://placehold.co/192x108/1e293b/94a3b8?text=Logo';">
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
    routeHistory = [];
};

export const renderAdminLogin = (authMode) => {
    // ... (This function also remains unchanged)
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
};

// --- NEW FUNCTION: Renders the form to request a new vehicle clearance ---
export const renderRequestForm = () => {
    document.body.className = 'dark-theme-bg';
    appRoot.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-md mobile-safe-container bg-slate-800/80 backdrop-blur-sm border border-blue-500/20 rounded-2xl shadow-2xl p-8 space-y-6 animate-fade-in">
            <div class="text-center">
                <div class="w-12 h-12 mx-auto text-blue-400">${icons.request}</div>
                <h1 class="text-3xl font-bold text-white mt-4">New Clearance Request</h1>
                <p class="text-slate-400">Fill in the details below to submit a request.</p>
            </div>
            <form id="request-form" class="space-y-4">
                <div>
                    <label class="text-sm font-medium text-slate-300">Vehicle Number</label>
                    <input type="text" name="vehicleNumber" oninput="this.value=this.value.toUpperCase()" class="mobile-input mt-1 block w-full" placeholder="e.g., SJA1234B" required />
                </div>
                <div>
                    <label class="text-sm font-medium text-slate-300">Requester's Name</label>
                    <input type="text" name="requesterName" class="mobile-input mt-1 block w-full" placeholder="e.g., John Doe" required />
                </div>
                <div>
                    <label class="text-sm font-medium text-slate-300">Reason for Entry</label>
                    <textarea name="reason" class="mobile-input mt-1 block w-full" rows="3" placeholder="e.g., Delivery, Official Visit" required></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-sm font-medium text-slate-300">Valid From</label>
                        <input type="date" name="validFrom" class="mobile-input mt-1 block w-full" required />
                    </div>
                    <div>
                        <label class="text-sm font-medium text-slate-300">Valid Until</label>
                        <input type="date" name="validTo" class="mobile-input mt-1 block w-full" required />
                    </div>
                </div>
                <button type="submit" class="w-full flex justify-center py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 mobile-button">Submit Request</button>
            </form>
            <button id="back-btn" class="mt-2 text-slate-400 hover:text-slate-200 underline text-sm block mx-auto">Back to Home</button>
        </div>
    </div>`;
};

// --- NEW FUNCTION: Renders the login page for the Green List ---
export const renderUserLogin = () => {
    document.body.className = 'dark-theme-bg';
    appRoot.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-sm mobile-safe-container bg-slate-800/80 backdrop-blur-sm border border-green-500/20 rounded-2xl shadow-2xl p-8 space-y-6 animate-fade-in">
            <div class="text-center">
                <div class="w-12 h-12 mx-auto text-green-400">${icons.greenlist}</div>
                <h1 class="text-3xl font-bold text-white mt-4">Green List Access</h1>
                <p class="text-slate-400">Enter the access code to view the list.</p>
            </div>
            <form id="user-login-form" class="space-y-4">
                <div>
                    <label class="text-sm font-medium text-slate-300">Access Code</label>
                    <input type="password" name="accessCode" class="mobile-input mt-1 block w-full text-center" placeholder="••••••••" required />
                </div>
                <button type="submit" class="w-full flex justify-center py-3 px-4 rounded-lg text-white bg-green-600 hover:bg-green-700 mobile-button">View List</button>
            </form>
            <button id="back-btn" class="mt-2 text-slate-400 hover:text-slate-200 underline text-sm block mx-auto">Back to Home</button>
        </div>
    </div>`;
};