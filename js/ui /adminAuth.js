import { icons } from "../icons.js";

export function renderAdminLogin(){
  document.body.className = 'dark-theme-bg';
  const root = document.getElementById("app-root");
  root.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-slate-800/80 backdrop-blur-sm border border-blue-500/20 rounded-2xl shadow-2xl p-8 space-y-6 animate-fade-in">
        <div class="text-center">
          <div class="w-12 h-12 mx-auto text-blue-400">${icons.shield}</div>
          <h1 class="text-3xl font-bold text-white mt-4">Admin Access</h1>
          <p class="text-slate-400">Sign in to manage clearances</p>
        </div>
        <form id="auth-form" class="space-y-4">
          <div><label class="text-sm text-slate-300">Username</label><input type="text" name="username" class="mt-1 block w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" placeholder="e.g., steve" required/></div>
          <div><label class="text-sm text-slate-300">Password</label><input type="password" name="password" class="mt-1 block w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" placeholder="••••••••" required/></div>
          <button type="submit" class="w-full py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700">Login</button>
        </form>
        <button id="back-btn" class="mt-2 text-slate-400 hover:text-slate-200 underline text-sm block mx-auto">Back</button>
      </div>
    </div>
  `;
  document.getElementById("back-btn").addEventListener("click", async ()=>{
    const { renderLandingPage } = await import("./landing.js");
    renderLandingPage();
  });
  document.getElementById("auth-form").addEventListener("submit", (e)=>{
    e.preventDefault();
    // TODO: Plug your existing Firebase admin auth logic here.
  });
}
