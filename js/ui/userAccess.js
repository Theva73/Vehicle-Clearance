import { showNotification } from "../utils.js";
import { validateUserID, getAllowedLocations, checkLocationAccess, logAccessAttempt, updateLastUsed } from "../db.js";

export function renderUserLogin(){
  document.body.className = 'dark-theme-bg';
  const root = document.getElementById("app-root");
  root.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-slate-800/80 backdrop-blur-sm border border-green-500/20 rounded-2xl shadow-2xl p-8 space-y-6 animate-fade-in text-center">
        <div class="w-12 h-12 mx-auto text-green-400">✔️</div>
        <h1 class="text-3xl font-bold text-white mt-4">Secure Access</h1>
        <p class="text-slate-400">Enter your User ID and verify location</p>
        <form id="secure-user-login-form" class="space-y-4 pt-4">
          <div><label class="text-sm font-medium text-slate-300">User ID</label>
            <input type="text" name="userID" class="mt-1 block w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" placeholder="Enter your User ID" oninput="this.value=this.value.toUpperCase()" required/>
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
          <button type="submit" class="w-full py-3 px-4 rounded-lg text-white bg-green-600 hover:bg-green-700">🔍 Verify Access</button>
        </form>
        <div class="text-xs text-slate-500 space-y-1">
          <p>🔒 Secure access requires:</p><p>• Valid User ID</p><p>• Physical presence at authorized location</p>
        </div>
        <button id="back-btn" class="mt-4 text-slate-400 hover:text-slate-200 underline text-sm">Back</button>
      </div>
    </div>
  `;

  document.getElementById("back-btn").addEventListener("click", async ()=>{
    const { renderLandingPage } = await import("./landing.js");
    renderLandingPage();
  });

  document.getElementById("secure-user-login-form").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const form = new FormData(e.target);
    const userID = (form.get('userID')||"").toString().trim().toUpperCase();
    const profile = await validateUserID(userID);
    if (!profile){ showNotification("Invalid or inactive User ID","error"); return; }

    const status = document.getElementById("location-status");
    status.classList.remove("hidden");
    try{
      const { getCurrentLocation } = await import("../location.js");
      const pos = await getCurrentLocation();
      const allowed = await getAllowedLocations();
      const check = await checkLocationAccess(pos, allowed);
      await logAccessAttempt(userID, pos, check.allowed, check.reason);
      if (!check.allowed){ showNotification(check.reason || "Access denied","error"); }
      else{
        await updateLastUsed(profile.id);
        window.sessionStorage.setItem('isDashboardLogin','true');
        window.sessionStorage.setItem('currentUserID', userID);
        showNotification(`Access verified at ${check.locationName} (${check.distance}m)`);
        // TODO: route to user dashboard
      }
    }catch(err){ showNotification(err.message,"error"); }
    finally{ status.classList.add("hidden"); }
  });
}
