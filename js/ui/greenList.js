import { renderLandingPage } from "./landing.js";
import { showNotification, formatDate } from "../utils.js";
import { db } from "../firebase.js";
import { collection, getDocs } from "../db.js";

export async function renderGreenList(){
  document.body.className='dark-theme-bg';
  const root=document.getElementById('app-root');
  root.innerHTML=`<div class='min-h-[100dvh] flex items-center justify-center p-6'>
    <div class='w-full max-w-3xl bg-slate-800/80 rounded-2xl border border-slate-700 p-6 text-slate-200'>
      <div class='flex items-center justify-between'>
        <h2 class='text-2xl font-bold text-white'>Green List (Active Clearances)</h2>
        <button id='back' class='px-3 py-2 rounded bg-slate-700 hover:bg-slate-600'>Back</button>
      </div>
      <div id='list' class='mt-4 text-sm'>Loading…</div>
    </div>
  </div>`;

  document.getElementById('back').addEventListener('click',()=>renderLandingPage());

  try{
    const snap = await getDocs(collection(db,'vehicleClearances'));
    const items = snap.docs.map(d=>({ id:d.id, ...d.data() }));
    const now = new Date();
    const active = items.filter(c=>{
      const exp = c.expiryDate?.toDate?c.expiryDate.toDate():new Date(c.expiryDate);
      exp.setHours(23,59,59,999);
      return now<=exp;
    });
    if(!active.length){ document.getElementById('list').innerHTML = `<div class='text-slate-300'>No active entries.</div>`; return; }
    const html = [`<div class='overflow-x-auto'><table class='w-full text-left'>`,
      `<thead><tr class='text-slate-300'><th class='py-2'>Vehicle</th><th>Location</th><th>Valid until</th></tr></thead><tbody>`];
    active.forEach(a=>{
      const exp=a.expiryDate?.toDate?a.expiryDate.toDate():a.expiryDate;
      html.push(`<tr class='border-t border-slate-700'><td class='py-2 font-medium text-white'>${(a.vehicleNumber||'').toUpperCase()}</td><td>${a.location||'N/A'}</td><td class='text-slate-300 text-xs'>${formatDate(exp)}</td></tr>`);
    });
    html.push(`</tbody></table></div>`);
    document.getElementById('list').innerHTML = html.join('');
  }catch(err){
    console.error(err); showNotification('Failed to load green list: '+err.message,'error');
    document.getElementById('list').innerHTML = `<div class='text-rose-300'>Failed to load.</div>`;
  }
}
