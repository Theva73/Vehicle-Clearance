import { db } from "../firebase.js";
import { doc, getDoc, updateDoc, Timestamp } from "../db.js";
import { showNotification, formatDate } from "../utils.js";
import { renderLandingPage } from "./landing.js";

export async function renderAdminReview(requestId){
  document.body.className='dark-theme-bg';
  const root=document.getElementById('app-root');
  root.innerHTML=`<div class='min-h-[100dvh] flex items-center justify-center p-4'>
    <div class='w-full max-w-2xl bg-slate-800/80 rounded-2xl border border-blue-500/20 p-6 space-y-5 animate-fade-in'>
      <h1 class='text-2xl font-bold text-white'>Review Request</h1>
      <div id='content' class='text-slate-200'>Loading…</div>
      <div class='flex gap-3 pt-2'>
        <button id='approve' class='px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700'>Approve</button>
        <button id='reject' class='px-4 py-2 rounded bg-rose-600 text-white hover:bg-rose-700'>Reject</button>
        <button id='back' class='ml-auto px-4 py-2 rounded bg-slate-700 text-white hover:bg-slate-600'>Back</button>
      </div>
    </div>
  </div>`;

  if (!requestId){ document.getElementById('content').innerHTML='<div class="text-slate-300">No request selected. Open from the Admin list.</div>'; return; }

  const ref=doc(db,'clearanceRequests',requestId);
  const snap=await getDoc(ref);
  if(!snap.exists()){ document.getElementById('content').innerHTML='<div class="text-rose-300">Request not found.</div>'; return; }
  const r={id:snap.id, ...snap.data()};

  document.getElementById('content').innerHTML=`
    <div class='grid grid-cols-1 md:grid-cols-2 gap-4'>
      <div class='p-3 rounded-lg bg-slate-900/60 border border-slate-700'>
        <div><span class='text-slate-400'>Requester:</span> <b>${r.requesterName}</b></div>
        <div><span class='text-slate-400'>Email:</span> ${r.requesterEmail}</div>
        <div><span class='text-slate-400'>Vehicle:</span> <b>${r.vehicleNumber}</b> • ${r.vehicleType||'N/A'}</div>
        <div><span class='text-slate-400'>Location:</span> ${r.location||'N/A'}</div>
        <div><span class='text-slate-400'>Validity:</span> ${formatDate(r.entryDate)} → ${formatDate(r.expiryDate)}</div>
      </div>
      <div class='p-3 rounded-lg bg-slate-900/60 border border-slate-700'>
        <label class='flex items-center gap-2'><input id='escortRequired' type='checkbox' class='h-4 w-4' ${r.escortRequired?'checked':''}/> <span>Escort required</span></label>
        <div id='escortWrap' class='mt-3 ${r.escortRequired?'':'hidden'}'>
          <label class='text-sm text-slate-300'>Escorted by…</label>
          <input id='escortBy' class='mt-1 w-full p-2 bg-slate-900/70 border border-slate-700 rounded text-white' placeholder='Name / Team'>
          <p class='text-xs text-slate-400 mt-1'>Will store as: [Escorted by: &lt;name&gt;]</p>
        </div>
        <div class='mt-4'>
          <label class='text-sm text-slate-300'>Notes</label>
          <textarea id='notes' rows='3' class='mt-1 w-full p-2 bg-slate-900/70 border border-slate-700 rounded text-white'>${r.notes||''}</textarea>
        </div>
      </div>
    </div>`;

  const escortChk=document.getElementById('escortRequired');
  const escortWrap=document.getElementById('escortWrap');
  const escortBy=document.getElementById('escortBy');
  escortChk.addEventListener('change',()=>escortWrap.classList.toggle('hidden', !escortChk.checked));

  function composeNotes(existing, escortName){
    const trimmed=(existing||'').trim();
    if(!escortName){ return trimmed.replace(/\[\s*Escorted\s+by:[^\]]*\]/ig,'').trim(); }
    const tag=`[Escorted by: ${escortName}]`;
    const replaced=trimmed.replace(/\[\s*Escorted\s+by:[^\]]*\]/ig, tag);
    return replaced===trimmed ? (trimmed ? trimmed+' '+tag : tag) : replaced;
  }

  async function commit(status){
    const payload={
      status, escortRequired:!!escortChk.checked,
      notes: composeNotes(document.getElementById('notes').value, escortChk.checked?escortBy.value:''),
      reviewedAt: Timestamp.now()
    };
    await updateDoc(ref, payload);
    showNotification(status==='approved'?'Approved.':'Rejected.');
    renderLandingPage();
  }

  document.getElementById('approve').addEventListener('click',()=>commit('approved'));
  document.getElementById('reject').addEventListener('click',()=>commit('rejected'));
  document.getElementById('back').addEventListener('click',()=>renderLandingPage());
}
