import { icons } from "../icons.js";
export function renderLandingPage({trackingHTML='',vehicleNumber=''}={}){
  const root=document.getElementById('app-root');
  root.innerHTML=`
  <div class='min-h-screen flex items-center justify-center p-4'>
    <div class='w-full max-w-md bg-slate-800 rounded-2xl p-6 space-y-6 text-center text-slate-200 animate-fade-in'>
      <h1 class='text-3xl font-bold text-white'>Vehicle Clearance</h1>
      <button id='request' class='w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded text-white'>
        ${icons.request}<span class='font-semibold'>Request Clearance</span>
      </button>
      <div id='track' class='text-left'>${trackingHTML}</div>
    </div>
  </div>`;
  document.getElementById('request').addEventListener('click', async ()=>{
    const { renderRequestForm } = await import('./requestForm.js'); renderRequestForm();
  });
}
