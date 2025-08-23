import { byId, showNotification, formatDate } from "../utils.js";
import { db } from "../firebase.js";
import { collection, getDocs, query, where, limit } from "../db.js";

async function safeImport(path, exportName){
  const m = await import(path);
  if (exportName && !m[exportName]) throw new Error(`Missing export ${exportName} in ${path}`);
  return m;
}

export function renderLandingPage({ trackingHTML = "", vehicleNumber = "" } = {}){
  const root = document.getElementById("app-root");
  root.innerHTML = `
  <div class="min-h-[100dvh] flex items-center justify-center p-3 sm:p-4">
    <div class="w-full max-w-md bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 sm:p-8 text-center shadow-2xl animate-fade-in text-slate-200">
      <div class="flex justify-between items-center mb-2">
        <a href="https://theva73.github.io/Vehicle-Clearance/userguide.html" class="text-blue-400 hover:text-blue-300 text-sm">📘 Guide</a>
        <img src="https://raw.githubusercontent.com/Theva73/Vehicle-Clearance/main/car_logo.jpg" class="w-40 h-auto opacity-90" />
        <span class="w-10"></span>
      </div>
      <h1 class="text-3xl font-bold text-white">Vehicle Clearance</h1>
      <p class="mt-1 text-slate-400 text-sm">Your gateway to seamless access.</p>
      <button id="request" class="mt-6 w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold">👤 Request Clearance</button>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <button id="admin" class="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white">🛡 Admin</button>
        <button id="greenlist" class="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white">✅ Green List</button>
      </div>
      <div class="mt-6">
        <p class="text-slate-400 text-sm">Or, track an existing request.</p>
        <form id="trackForm" class="flex items-center gap-2 mt-2">
          <input id="trackInput" value="${vehicleNumber}" placeholder="Enter Vehicle Number" class="flex-1 p-3 rounded-lg bg-slate-900/70 border border-slate-700 text-white placeholder-slate-500"/>
          <button class="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg" type="submit">🔍</button>
        </form>
        <div id="tracking-result" class="mt-4">${trackingHTML}</div>
      </div>
    </div>
  </div>`;

  byId("request").addEventListener("click", async ()=>{
    (await import("./requestForm.js")).renderRequestForm();
  });
  byId("admin").addEventListener("click", async ()=>{
    (await import("./adminList.js")).renderAdminList();
  });
  byId("greenlist").addEventListener("click", async ()=>{
    (await import("./greenList.js")).renderGreenList();
  });

  const trackForm = byId("trackForm");
  const trackInput = byId("trackInput");
  trackForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const plate = (trackInput.value||'').trim().toUpperCase(); if(!plate) return;
    const html = await fetchTrackingHTML(plate);
    renderLandingPage({ trackingHTML: html, vehicleNumber: plate });
  });
}

async function fetchTrackingHTML(plate){
  const clearances = (await getDocs(query(collection(db,'vehicleClearances'), where('vehicleNumber','==',plate), limit(5)))).docs.map(d=>({id:d.id, ...d.data()}));
  const requests   = (await getDocs(query(collection(db,'clearanceRequests'),   where('vehicleNumber','==',plate), limit(10)))).docs.map(d=>({id:d.id, ...d.data()}));
  const now = new Date();
  const active = clearances.find(c=>{ const exp=c.expiryDate?.toDate?c.expiryDate.toDate():new Date(c.expiryDate); exp.setHours(23,59,59,999); return now<=exp; });
  const parts = [];
  parts.push(`<div class="p-4 rounded-xl bg-slate-900/60 border border-slate-700"><h3 class="text-xl font-bold text-white">${plate}</h3>`);
  if(active){
    const exp = active.expiryDate?.toDate?active.expiryDate.toDate():new Date(active.expiryDate);
    parts.push(`<div class="mt-3 p-3 rounded-lg bg-emerald-600/15 border border-emerald-600/30"><div class="text-emerald-400 font-semibold">ACTIVE CLEARANCE</div><div class="text-slate-200 text-sm mt-1">Location: <b>${active.location||'N/A'}</b></div><div class="text-slate-200 text-sm">Valid until: <b>${formatDate(exp)}</b></div></div>`);
  } else if (clearances.length){
    const latest = clearances[0]; const exp=latest.expiryDate?.toDate?latest.expiryDate.toDate():new Date(latest.expiryDate);
    parts.push(`<div class="mt-3 p-3 rounded-lg bg-rose-600/15 border border-rose-600/30"><div class="text-rose-400 font-semibold">NO ACTIVE CLEARANCE</div><div class="text-slate-200 text-sm mt-1">Last clearance expired on <b>${formatDate(exp)}</b>.</div></div>`);
  } else {
    parts.push(`<div class="mt-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30"><div class="text-slate-300">No clearance records yet.</div></div>`);
  }
  if(requests.length){
    parts.push(`<div class="mt-4 text-slate-300 font-semibold">Recent Requests</div><div class="mt-2 space-y-2">`);
    requests.forEach(r=>{
      const status=(r.status||'pending').toUpperCase();
      const entry=r.entryDate?.toDate?r.entryDate.toDate():r.entryDate; const expiry=r.expiryDate?.toDate?r.expiryDate.toDate():r.expiryDate;
      parts.push(`<div class="p-3 rounded-lg bg-slate-900/60 border border-slate-700"><div class="flex items-center justify-between"><div class="text-slate-200"><b>${r.location||'N/A'}</b></div><span class="text-xs px-2 py-0.5 rounded ${status==='APPROVED'?'bg-emerald-600/30 text-emerald-300 border border-emerald-600/40':status==='PENDING'?'bg-amber-600/30 text-amber-200 border border-amber-600/40':status==='REJECTED'?'bg-rose-600/30 text-rose-200 border border-rose-600/40':'bg-slate-600/30 text-slate-200 border border-slate-600/40'}">${status}</span></div><div class="text-slate-400 text-xs mt-1">${formatDate(entry)} → ${formatDate(expiry)}</div></div>`);
    });
    parts.push(`</div>`);
  }
  parts.push(`</div>`);
  return parts.join("");
}
