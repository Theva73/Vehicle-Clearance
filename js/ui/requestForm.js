import { renderLandingPage } from "./landing.js";
import { showNotification, formatDate } from "../utils.js";
import { db } from "../firebase.js";
import { collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

function createStatusCard(req){
  const entry = req.entryDate?.toDate ? req.entryDate.toDate() : new Date(req.entryDate);
  const exp = req.expiryDate?.toDate ? req.expiryDate.toDate() : new Date(req.expiryDate);
  return `
    <div class="p-4 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-200 animate-fade-in">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-slate-100">Request Submitted</h3>
        <span class="px-2 py-1 text-xs rounded bg-slate-700">${(req.status||'pending').toUpperCase()}</span>
      </div>
      <div class="mt-2 text-sm">
        <div><span class="text-slate-400">Vehicle:</span> <b>${(req.vehicleNumber||'').toUpperCase()}</b></div>
        <div><span class="text-slate-400">Location:</span> ${req.location||'N/A'}</div>
        <div><span class="text-slate-400">Validity:</span> ${formatDate(entry)} → ${formatDate(exp)}</div>
        ${req.escortRequired ? `<div class="mt-1 text-emerald-400 font-medium">Escort Required</div>` : ``}
      </div>
    </div>`;
}

export function renderRequestForm(){
  document.body.className = 'dark-theme-bg';
  const root = document.getElementById("app-root");
  root.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-lg bg-slate-800/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl shadow-2xl p-8 space-y-6 animate-fade-in">
        <div class="text-center">
          <div class="w-12 h-12 mx-auto text-yellow-400">📝</div>
          <h1 class="text-3xl font-bold text-white mt-4">Request Vehicle Clearance</h1>
          <p class="text-slate-400">Fill in the details below</p>
        </div>
        <form id="request-form" class="space-y-4 text-left">
          <div>
            <label class="text-sm font-medium text-slate-300">Your Name</label>
            <input name="requesterName" class="mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" placeholder="e.g. John Doe" required />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-300">Your Email Address</label>
            <input type="email" name="requesterEmail" placeholder="you@example.com" class="mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" required />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-300">Vehicle Number</label>
            <input name="vehicleNumber" oninput="this.value=this.value.toUpperCase()" class="mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" required />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-300">Vehicle Type</label>
            <select name="vehicleType" class="mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" required>
              <option value="">Select type</option>
              <option>Car</option><option>Motorcycle</option><option>Van</option><option>Tow Truck</option><option>Lorry</option><option>Bus</option><option>Others</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-300">Location</label>
            <select name="location" class="mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" required>
              <option value="PCC" selected>PCC</option>
              <option value="Other">Other</option>
            </select>
            <input name="customLocation" class="mt-2 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white hidden" placeholder="Enter location"/>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-slate-300">Entry Date</label>
              <input type="date" name="entryDate" class="mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" required />
            </div>
            <div>
              <label class="text-sm font-medium text-slate-300">Expiry Date</label>
              <input type="date" name="expiryDate" class="mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" required />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input id="escortRequired" type="checkbox" name="escortRequired" class="h-4 w-4" />
            <label for="escortRequired" class="text-sm text-slate-300">Escort required</label>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-300">Notes</label>
            <textarea name="notes" rows="3" id="modal-notes-textarea" class="mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-white" placeholder="[Escorted by: ______ ]"></textarea>
          </div>
          <div class="flex gap-3">
            <button type="submit" class="flex-1 px-4 py-3 rounded-lg text-white bg-yellow-600 hover:bg-yellow-700">Submit Request</button>
            <button type="button" id="back" class="px-4 py-3 rounded-lg text-slate-300 bg-slate-700/60 hover:bg-slate-700">Back</button>
          </div>
        </form>
      </div>
    </div>`;

  // Toggle custom location input when "Other" is chosen
  document.body.addEventListener("change", (e)=>{
    if (e.target?.name === "location"){
      const form = e.target.closest('form');
      const custom = form?.querySelector('input[name="customLocation"]');
      if (!custom) return;
      if (e.target.value === "Other"){ custom.classList.remove('hidden'); custom.required = true; }
      else { custom.classList.add('hidden'); custom.required = false; custom.value = ''; }
    }
  });

  document.getElementById("back").addEventListener("click", async ()=>{
    const { renderLandingPage } = await import("./landing.js");
    renderLandingPage();
  });

  document.getElementById("request-form").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const form = e.target;
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    const getFormObj = (form)=> Object.fromEntries(new FormData(form).entries());
    const parseLocalDate = (s)=>{
      if (!s) return null; const [y,m,d] = s.split('-').map(n=>parseInt(n,10)); if(!y||!m||!d) return null; return new Date(y, m-1, d);
    };

    try {
      const data = getFormObj(form);
      const entryDate = parseLocalDate(data.entryDate);
      const expiryDate = parseLocalDate(data.expiryDate);
      if(!entryDate || !expiryDate || !form.checkValidity()){ form.reportValidity(); showNotification("Please fill all required fields with valid dates.","error"); if(button) button.disabled=false; return; }

      // Ensure anonymous auth session exists
      let auth = getAuth();
      if (!auth.currentUser){ await signInAnonymously(auth); }

      const payload = {
        requesterName: data.requesterName,
        requesterEmail: data.requesterEmail,
        requesterId: auth.currentUser?.uid || null,
        vehicleNumber: (data.vehicleNumber||'').toUpperCase(),
        vehicleType: data.vehicleType,
        location: data.location === "Other" ? data.customLocation : data.location,
        entryDate: Timestamp.fromDate(entryDate),
        expiryDate: Timestamp.fromDate(expiryDate),
        escortRequired: !!data.escortRequired,
        notes: data.notes || "",
        status: "pending",
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db,"clearanceRequests"), payload);
      showNotification("Request submitted successfully! You will be notified by email of any status changes.");
      const newReq = { id: docRef.id, ...payload };
      renderLandingPage({ trackingResultHTML: createStatusCard(newReq), vehicleNumber: newReq.vehicleNumber });
    } catch (err){
      showNotification(`Failed to submit request: ${err.message}`,"error");
    } finally {
      if (button) button.disabled = false;
    }
  });
}
