export const byId = (id) => document.getElementById(id);

export const showNotification = (message, type="success") => {
  const div = document.createElement("div");
  const bg = type==="success" ? "bg-green-500" : type==="error" ? "bg-red-500" : "bg-blue-500";
  div.className = `fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white flex items-center animate-fade-in z-[100] ${bg} max-w-sm`;
  div.innerHTML = `<span class="mr-3 text-lg">${type==="success"?"✓":type==="error"?"✗":"ℹ"}</span><span>${message}</span>`;
  document.body.appendChild(div);
  setTimeout(()=>div.remove(), 4000);
};

export const formatDate = (date) => {
  if (!date) return "N/A";
  const d = date instanceof Date ? date : date.toDate?.() ?? new Date(date);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(-2)}`;
};
export const formatDateLongForm = (date) => {
  if (!date) return "N/A";
  const d = date instanceof Date ? date : date.toDate?.() ?? new Date(date);
  return d.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
};
export const formatVehicleNumber = (v) => (v ? v.toUpperCase() : "N/A");
