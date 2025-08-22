import { icons } from "../icons.js";
import { bindVoice } from "../voice.js";
import { byId } from "../utils.js";
import { pushRoute } from "../state.js";

export function renderLandingPage({ trackingHTML="", vehicleNumber="" } = {}){
  document.body.className = 'landing-solid';
  const root = document.getElementById("app-root");
  root.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-3 sm:p-4">
      <div class="w-full max-w-md bg-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-center animate-fade-in">
        <header class="space-y-4">
          <div class="flex justify-between items-center">
            <a href="https://theva73.github.io/Vehicle-Clearance/userguide.html" target="_blank" class="text-sm text-blue-300 hover:text-white">📘 Guide</a>
            <img src="https://raw.githubusercontent.com/Theva73/Vehicle-Clearance/main/car_logo.jpg" class="w-48 h-auto mx-auto" alt="Car Logo" />
            <div class="w-12"></div>
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-white mt-2">Vehicle Clearance</h1>
          <p class="text-slate-400">Your gateway to seamless access.</p>
        </header>

        <main class="space-y-4">
          <button id="request-btn" class="w-full flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition transform hover:scale-105 shadow-lg shadow-blue-600/20">
            <div class="w-6 h-6">${icons.request}</div>
            <span class="font-semibold text-lg">Request Clearance</span>
          </button>
          <div class="grid grid-cols-2 gap-4">
            <button id="admin-btn" class="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg">
              <div class="w-8 h-8 text-blue-400">${icons.shield}</div>
              <span class="mt-2 font-semibold">Admin</span>
            </button>
            <button id="user-btn" class="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg">
              <div class="w-8 h-8 text-green-400">${icons.greenlist}</div>
              <span class="mt-2 font-semibold">Green List</span>
            </button>
          </div>
        </main>

        <footer class="pt-6">
          <form id="track-form" class="space-y-3">
            <label class="text-sm font-medium text-slate-400">Or, track an existing request.</label>
            <div class="flex gap-2">
              <input id="track-input" class="block w-full px-4 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-white placeholder-slate-500" placeholder="Enter Vehicle Number" value="${vehicleNumber}"/>
              <button type="submit" class="flex items-center justify-center px-4 py-2 rounded-lg text-white bg-slate-700 hover:bg-slate-600">${icons.search}</button>
              <button id="voice-btn" type="button" class="voice-search-btn flex items-center justify-center px-3 py-2 rounded-lg text-white bg-slate-700 hover:bg-slate-600" title="Voice Search">
                ${icons.mic}
              </button>
            </div>
          </form>
          <div id="tracking-result" class="mt-4">${trackingHTML}</div>
        </footer>
      </div>
    </div>
  `;

  const trackInput = byId("track-input");
  const voiceBtn = byId("voice-btn");
  bindVoice(voiceBtn, trackInput, (n)=>{/* optionally auto-submit */});
  byId("track-form").addEventListener("submit",(e)=>{ e.preventDefault(); /* TODO: call tracking render */ });

  byId("admin-btn").addEventListener("click", async ()=>{
    const { renderAdminLogin } = await import("./adminAuth.js");
    pushRoute(()=>renderLandingPage());
    renderAdminLogin();
  });
  byId("user-btn").addEventListener("click", async ()=>{
    const { renderUserLogin } = await import("./userAccess.js");
    pushRoute(()=>renderLandingPage());
    renderUserLogin();
  });
  byId("request-btn").addEventListener("click", async ()=>{
    const { renderRequestForm } = await import("./requestForm.js");
    pushRoute(()=>renderLandingPage());
    renderRequestForm?.();
  });
}
