export function renderRequestForm(){
  const root = document.getElementById("app-root");
  root.innerHTML = `<div class='min-h-screen flex items-center justify-center p-6 text-white bg-slate-900'>
    <div class='max-w-xl w-full bg-slate-800 rounded-xl p-6 space-y-4'>
      <h2 class='text-2xl font-bold'>Request Clearance</h2>
      <p class='text-slate-300'>This is a placeholder. Move your existing request form markup & logic here.</p>
      <button id="back" class="mt-2 px-4 py-2 rounded bg-slate-700 hover:bg-slate-600">Back</button>
    </div>
  </div>`;
  document.getElementById("back").addEventListener("click", async ()=>{
    const { renderLandingPage } = await import("./landing.js");
    renderLandingPage();
  });
}
