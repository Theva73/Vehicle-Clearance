import { renderLandingPage } from "./landing.js";
import { showNotification, formatDate } from "../utils.js";
import { db } from "../firebase.js";
import { collection, getDocs } from "../db.js";

export async function renderAdminList(){
  document.body.className='dark-theme-bg';
  const root = document.getElementById('app-root');
  root.innerHTML = `<div class='min-h-[100dvh] flex items-center justify-center p-4'>
    <div class='w-full max-w-3xl bg-slate-800/80 rounded-2xl border border-slate-700 p-6 text-slate-200'>
      <div class='flex items-center justify-between'>
        <h2 class='text-2xl font-bold text-white'>Admin — Pending Requests</h2>
        <button id='back' class='px-3 py-2 rounded bg-slate-700 hover:bg-slate-600'>Back</button>
      </div>
      <div id='list' class='mt-4 text-sm'>Loading…</div>
    </div>
  </div>`;

  document.getElementById('back').addEventListener('click',()=>renderLandingPage());

  try{
    const snap = await getDocs(collection(db,'clearanceRequests'));
    const rows = snap.docs.map(d=>({ id:d.id, ...d.data() }));
    const pending = rows.filter(r=>(r.status||'pending').toLowerCase()==='pending');
    if(!pending.length){
      document.getElementById('list').innerHTML = `<div class='text-slate-300'>No pending requests.</div>`;
      return;
    }
    const html = [`<div class='overflow-x-auto'><table class='w-full text-left'>`,
      `<thead><tr class='text-slate-300'><th class='py-2'>Vehicle</th><th>Location</th><th>Validity</th><th>Requester</th><th></th></tr></thead><tbody>`];
    pending.forEach(r=>{
      const entry = formatDate(r.entryDate), exp = formatDate(r.expiryDate);
      html.push(`<tr class='border-t border-slate-700'>
        <td class='py-2 font-medium text-white'>${(r.vehicleNumber||'').toUpperCase()}</td>
        <td>${r.location||'N/A'}</td>
        <td class='text-slate-300 text-xs'>${entry} → ${exp}</td>
        <td class='text-slate-300'>${r.requesterName||'-'}</td>
        <td class='text-right'><button class='px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white' data-id='${r.id}'>Review</button></td>
      </tr>`);
    });
    html.push(`</tbody></table></div>`);
    document.getElementById('list').innerHTML = html.join('');

    document.getElementById('list').addEventListener('click', async (e)=>{
      const btn = e.target.closest('button[data-id]'); if(!btn) return;
      const id = btn.getAttribute('data-id');
      const { renderAdminReview } = await import('./adminReview.js');
      renderAdminReview(id);
    });
  }catch(err){
    console.error(err); showNotification(`Failed to load list: ${err.message}`,'error');
    document.getElementById('list').innerHTML = `<div class='text-rose-300'>Failed to load.</div>`;
  }
}
