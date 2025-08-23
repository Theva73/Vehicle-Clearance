export const byId = (id)=>document.getElementById(id);
export const showNotification=(message, type='success')=>{
  const div=document.createElement('div');
  const bg=type==='success'?'bg-emerald-600':type==='error'?'bg-rose-600':'bg-slate-700';
  div.className=`fixed bottom-5 right-5 z-50 text-white px-4 py-3 rounded shadow ${bg}`;
  div.textContent=message; document.body.appendChild(div);
  setTimeout(()=>div.remove(),3500);
};
export const formatDate=(date)=>{
  if(!date) return 'N/A';
  const d=date?.toDate?date.toDate():new Date(date);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`;
};
