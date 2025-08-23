import { showNotification, formatDate } from "../utils.js";
import { db, collection, addDoc, Timestamp } from "../db.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { renderLandingPage } from "./landing.js";

function statusCard(req){
  const entry=req.entryDate?.toDate?req.entryDate.toDate():new Date(req.entryDate);
  const exp=req.expiryDate?.toDate?req.expiryDate.toDate():new Date(req.expiryDate);
  return `<div class='p-4 bg-slate-900/60 border border-slate-700 rounded-xl'>
    <div class='flex justify-between items-center'><b>Request Submitted</b><span class='text-xs bg-slate-700 px-2 py-1 rounded'>${(req.status||'pending').toUpperCase()}</span></div>
    <div class='mt-2 text-sm'>
      <div><span class='text-slate-400'>Vehicle:</span> <b>${(req.vehicleNumber||'').toUpperCase()}</b></div>
      <div><span class='text-slate-400'>Location:</span> ${req.location||'N/A'}</div>
      <div><span class='text-slate-400'>Validity:</span> ${formatDate(entry)} → ${formatDate(exp)}</div>
    </div>
  </div>`;
}

export function renderRequestForm(){
  document.body.className='dark-theme-bg';
  const root=document.getElementById('app-root');
  root.innerHTML=`
  <div class='min-h-screen flex items-center justify-center p-4'>
    <div class='w-full max-w-lg bg-slate-800/80 border border-yellow-500/20 rounded-2xl p-6 space-y-5 text-slate-200'>
      <h2 class='text-2xl font-bold text-white'>Request Vehicle Clearance</h2>
      <form id='form' class='space-y-4'>
        <div><label class='text-sm'>Your Name</label>
          <input name='requesterName' class='mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded text-white' required>
        </div>
        <div><label class='text-sm'>Your Email</label>
          <input type='email' name='requesterEmail' class='mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded text-white' required>
        </div>
        <div><label class='text-sm'>Vehicle Number</label>
          <input name='vehicleNumber' oninput='this.value=this.value.toUpperCase()' class='mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded text-white' required>
        </div>
        <div><label class='text-sm'>Vehicle Type</label>
          <select name='vehicleType' class='mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded text-white' required>
            <option value=''>Select type</option><option>Car</option><option>Motorcycle</option><option>Van</option><option>Tow Truck</option><option>Lorry</option><option>Bus</option><option>Others</option>
          </select>
        </div>
        <div><label class='text-sm'>Location</label>
          <select name='location' class='mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded text-white' required>
            <option value='PCC' selected>PCC</option><option value='Other'>Other</option>
          </select>
          <input name='customLocation' class='mt-2 w-full p-3 bg-slate-900/70 border border-slate-700 rounded text-white hidden' placeholder='Enter location'>
        </div>
        <div class='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div><label class='text-sm'>Entry Date</label><input type='date' name='entryDate' class='mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded text-white' required></div>
          <div><label class='text-sm'>Expiry Date</label><input type='date' name='expiryDate' class='mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded text-white' required></div>
        </div>
        <div><label class='text-sm'>Notes</label>
          <textarea name='notes' rows='3' class='mt-1 w-full p-3 bg-slate-900/70 border border-slate-700 rounded text-white' placeholder='Add any helpful details (optional)'></textarea>
        </div>
        <div class='flex gap-3'>
          <button type='submit' class='flex-1 px-4 py-3 rounded bg-yellow-600 text-white hover:bg-yellow-700'>Submit</button>
          <button type='button' id='back' class='px-4 py-3 rounded bg-slate-700 text-white hover:bg-slate-600'>Back</button>
        </div>
      </form>
    </div>
  </div>`;

  // Toggle custom location
  root.querySelector("select[name='location']").addEventListener('change', (e)=>{
    const custom=root.querySelector("input[name='customLocation']");
    if(e.target.value==='Other'){ custom.classList.remove('hidden'); custom.required=true; } else { custom.classList.add('hidden'); custom.required=false; custom.value=''; }
  });

  document.getElementById('back').addEventListener('click', async ()=>{
    const { renderLandingPage } = await import('./landing.js'); renderLandingPage();
  });

  root.querySelector('#form').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    const data=Object.fromEntries(fd.entries());
    const parse=(s)=>{const [y,m,d]=(s||'').split('-').map(n=>parseInt(n,10)); return new Date(y,m-1,d);};
    if(!data.entryDate||!data.expiryDate){ e.target.reportValidity(); return; }

    const auth=getAuth(); if(!auth.currentUser) await signInAnonymously(auth);
    const payload={
      requesterName:data.requesterName, requesterEmail:data.requesterEmail, requesterId:auth.currentUser?.uid||null,
      vehicleNumber:(data.vehicleNumber||'').toUpperCase(), vehicleType:data.vehicleType,
      location:data.location==='Other'?data.customLocation:data.location,
      entryDate:Timestamp.fromDate(parse(data.entryDate)), expiryDate:Timestamp.fromDate(parse(data.expiryDate)),
      escortRequired:false, notes:data.notes||"", status:"pending", createdAt:Timestamp.now()
    };
    const docRef=await addDoc(collection(db,'clearanceRequests'), payload);
    showNotification('Request submitted successfully!');
    const card=statusCard({id:docRef.id, ...payload});
    const { renderLandingPage } = await import('./landing.js');
    renderLandingPage({trackingHTML:card, vehicleNumber:payload.vehicleNumber});
  });
}
