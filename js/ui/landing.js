import { byId, showNotification, formatDate } from "../utils.js";
import { db } from "../firebase.js";
import {
  collection, getDocs, query, where, limit
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Minimal icon placeholders (optional)
const icons = {
  request: "👤", search: "🔍", shield: "🛡", green: "✅"
};

export function renderLandingPage({ trackingHTML = "", vehicleNumber = "" } = {}) {
  const root = document.getElementById("app-root");
  root.innerHTML = `
    <div class="min-h-[100dvh] flex items-center justify-center p-3 sm:p-4">
      <div class="w-full max-w-md bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 sm:p-8 text-center shadow-2xl animate-fade-in text-slate-200">

        <!-- Guide + Logo -->
        <div class="flex justify-between items-center mb-2">
          <a href="https://theva73.github.io/Vehicle-Clearance/userguide.html" target="_blank" class="flex items-center text-blue-400 hover:text-blue-300 gap-1 text-sm">📘 Guide</a>
          <img src="https://raw.githubusercontent.com/Theva73/Vehicle-Clearance/main/car_logo.jpg" alt="Logo" class="w-40 h-auto opacity-90" />
          <span class="w-10"></span>
        </div>

        <h1 class="text-3xl font-bold text-white">Vehicle Clearance</h1>
        <p class="mt-1 text-slate-400 text-sm">Your gateway to seamless access.</p>

        <!-- Main action -->
        <button id="request" class="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold">
          ${icons.request} Request Clearance
        </button>

        <!-- Secondary actions -->
        <div class="mt-4 grid grid-cols-2 gap-3">
          <button id="admin" class="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center gap-1">${icons.shield} Admin</button>
          <button id="greenlist" class="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center gap-1">${icons.green} Green List</button>
        </div>

        <!-- Tracking box -->
        <div class="mt-6">
          <p class="text-slate-400 text-sm">Or, track an existing request.</p>
          <form id="trackForm" class="flex items-center gap-2 mt-2">
            <input id="trackInput" value="${vehicleNumber}" placeholder="Enter Vehicle Number"
              class="flex-1 p-3 rounded-lg bg-slate-900/70 border border-slate-700 text-white placeholder-slate-500" />
            <button id="trackBtn" class="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg" title="Search">${icons.search}</button>
          </form>
          <div id="tracking-result" class="mt-4">${trackingHTML}</div>
        </div>
      </div>
    </div>
  `;

  // Routes
  byId("request").addEventListener("click", async () => {
    const { renderRequestForm } = await import("./requestForm.js");
    renderRequestForm();
  });
  byId("admin").addEventListener("click", async () => {
    const { renderAdminReview } = await import("./adminReview.js"); // swap to your admin landing if different
    // Example: renderAdminReview('<REQUEST_ID>')
    showNotification("Open your admin list to pick a request to review.", "info");
  });
  byId("greenlist").addEventListener("click", async () => {
    showNotification("Green List UI not wired yet in this snippet.", "info");
  });

  // Tracking events
  const trackForm = byId("trackForm");
  const trackInput = byId("trackInput");
  trackForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const plate = normalizePlate(trackInput.value);
    if (!plate) { showNotification("Enter a valid vehicle number.", "error"); return; }
    const html = await fetchTrackingHTML(plate);
    // re-render to keep state + result
    renderLandingPage({ trackingHTML: html, vehicleNumber: plate });
  });
}

/* ---------- Tracking logic ---------- */

const normalizePlate = (v) => (v || "").toString().trim().toUpperCase();

/**
 * Query Firestore for:
 * 1) Active/expired clearances in "vehicleClearances"
 * 2) Recent requests in "clearanceRequests"
 * Combine into a clear status block.
 */
async function fetchTrackingHTML(plate) {
  try {
    // 1) Current/previous clearances
    const clearancesQ = query(
      collection(db, "vehicleClearances"),
      where("vehicleNumber", "==", plate),
      limit(5)
    );
    const clrSnap = await getDocs(clearancesQ);
    const clearances = clrSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 2) Recent requests
    const requestsQ = query(
      collection(db, "clearanceRequests"),
      where("vehicleNumber", "==", plate),
      limit(10)
    );
    const reqSnap = await getDocs(requestsQ);
    const requests = reqSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Build HTML
    const parts = [];

    // Summary header
    parts.push(`
      <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-700">
        <div class="flex items-center justify-between">
          <div class="text-slate-300 text-sm">Tracking</div>
          <div class="text-xs text-slate-400">Plate</div>
        </div>
        <h3 class="text-xl font-bold text-white mt-1">${plate}</h3>
    `);

    // Active clearance (if any)
    const now = new Date();
    const active = clearances.find(c => {
      const exp = c.expiryDate?.toDate ? c.expiryDate.toDate() : new Date(c.expiryDate);
      // treat expiry as end-of-day
      exp.setHours(23, 59, 59, 999);
      return now <= exp;
    });

    if (active) {
      const exp = active.expiryDate?.toDate ? active.expiryDate.toDate() : new Date(active.expiryDate);
      parts.push(`
        <div class="mt-3 p-3 rounded-lg bg-emerald-600/15 border border-emerald-600/30">
          <div class="text-emerald-400 font-semibold">ACTIVE CLEARANCE</div>
          <div class="text-slate-200 text-sm mt-1">Location: <b>${active.location || "N/A"}</b></div>
          <div class="text-slate-200 text-sm">Valid until: <b>${formatDate(exp)}</b></div>
          ${renderEscortTag(active)}
        </div>
      `);
    } else if (clearances.length) {
      // Show the latest (expired) clearance
      const latest = clearances[0];
      const exp = latest.expiryDate?.toDate ? latest.expiryDate.toDate() : new Date(latest.expiryDate);
      parts.push(`
        <div class="mt-3 p-3 rounded-lg bg-rose-600/15 border border-rose-600/30">
          <div class="text-rose-400 font-semibold">NO ACTIVE CLEARANCE</div>
          <div class="text-slate-200 text-sm mt-1">Last clearance expired on <b>${formatDate(exp)}</b>.</div>
          ${renderEscortTag(latest)}
        </div>
      `);
    } else {
      parts.push(`
        <div class="mt-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
          <div class="text-slate-300">No clearance records yet.</div>
        </div>
      `);
    }

    // Request history
    if (requests.length) {
      parts.push(`<div class="mt-4 text-slate-300 font-semibold">Recent Requests</div>`);
      parts.push(`<div class="mt-2 space-y-2">`);
      requests.forEach(r => {
        const status = (r.status || "pending").toUpperCase();
        const entry = r.entryDate?.toDate ? r.entryDate.toDate() : r.entryDate;
        const expiry = r.expiryDate?.toDate ? r.expiryDate.toDate() : r.expiryDate;
        parts.push(`
          <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-700">
            <div class="flex items-center justify-between">
              <div class="text-slate-200"><b>${r.location || "N/A"}</b></div>
              <span class="text-xs px-2 py-0.5 rounded ${badgeColor(status)}">${status}</span>
            </div>
            <div class="text-slate-400 text-xs mt-1">
              ${formatDate(entry)} → ${formatDate(expiry)}
            </div>
            ${renderEscortTag(r)}
          </div>
        `);
      });
      parts.push(`</div>`);
    } else {
      parts.push(`
        <div class="mt-4 text-slate-400 text-sm">No requests found for this plate.</div>
      `);
    }

    parts.push(`</div>`); // close container
    return parts.join("");
  } catch (err) {
    console.error(err);
    showNotification(`Tracking failed: ${err.message}`, "error");
    return `<div class="p-3 rounded bg-rose-600/20 border border-rose-600/30 text-rose-100">Failed to fetch tracking info.</div>`;
  }
}

function badgeColor(status) {
  if (status === "APPROVED") return "bg-emerald-600/30 text-emerald-300 border border-emerald-600/40";
  if (status === "PENDING")  return "bg-amber-600/30 text-amber-200 border border-amber-600/40";
  if (status === "REJECTED") return "bg-rose-600/30 text-rose-200 border border-rose-600/40";
  return "bg-slate-600/30 text-slate-200 border border-slate-600/40";
}

function renderEscortTag(item) {
  const yes = !!item.escortRequired;
  if (!yes && !item?.notes) return "";
  // Try to extract [Escorted by: ___]
  let escortedBy = "";
  if (typeof item.notes === "string") {
    const m = item.notes.match(/\[\s*Escorted\s+by:\s*([^\]]*)\]/i);
    if (m && m[1]) escortedBy = m[1].trim();
  }
  if (yes || escortedBy) {
    return `<div class="mt-1 text-xs text-slate-300">${yes ? "Escort required" : ""}${escortedBy ? ` • Escorted by: <b>${escortedBy}</b>` : ""}</div>`;
  }
  return "";
}
