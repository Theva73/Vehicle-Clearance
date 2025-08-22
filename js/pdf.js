import { formatDate, formatDateLongForm, formatVehicleNumber, showNotification } from "./utils.js";
import { db } from "./firebase.js";
import { collection, query, orderBy, getDocs, Timestamp, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export async function generatePDFReport(buttonEl){
  const restore = () => { buttonEl.disabled=false; buttonEl.innerHTML = btnHTML; };
  const btnHTML = buttonEl.innerHTML;
  buttonEl.disabled = true; buttonEl.innerHTML = '<div class="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> Generating...';

  try{
    if (typeof window.jspdf === 'undefined') throw new Error('jsPDF library not loaded');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});

    const now = new Date(); const T24 = new Date(now.getTime() - 24*60*60*1000);
    let report = []; const processed = new Set();

    const escortInfo = (entry)=>{
      let escort = entry.escortRequired ? 'Yes':'No';
      if (entry.escortRequired){
        let by = ' ________ ';
        if (entry.notes){
          const m = entry.notes.toString().match(/\[\s*Escorted\s+by:\s*([^\]]*)\]/i);
          if (m && m[1].trim()) by = ` ${m[1].trim()} `;
        }
        escort += `\n[Escorted by:${by}]`;
      }
      return escort;
    };

    const qC = query(collection(db,"vehicleClearances"), orderBy("createdAt","desc"));
    const snapC = await getDocs(qC);
    const valid = snapC.docs.map(d=>({id:d.id,...d.data()})).filter(c=>c.expiryDate.toDate() >= T24);
    valid.forEach(c=>{
      const expiry = c.expiryDate.toDate(); expiry.setHours(23,59,59,999);
      const status = now <= expiry ? 'ACTIVE':'EXPIRED';
      report.push([ formatVehicleNumber(c.vehicleNumber||'N/A'), c.location||'N/A', escortInfo(c), formatDate(c.expiryDate), status ]);
      processed.add(c.vehicleNumber);
    });

    const qR = query(collection(db,"clearanceRequests"), where("createdAt",">=", Timestamp.fromDate(T24)), orderBy("createdAt","desc"));
    const snapR = await getDocs(qR);
    snapR.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.status!=='rejected').forEach(r=>{
      if (!processed.has(r.vehicleNumber)){
        report.push([ formatVehicleNumber(r.vehicleNumber||'N/A'), r.location||'N/A', escortInfo(r), formatDate(r.expiryDate), (r.status?.toUpperCase()||'PENDING') ]);
        processed.add(r.vehicleNumber);
      }
    });

    doc.setFontSize(20); doc.setFont(undefined,'bold'); doc.text("Vehicle Clearance Report",14,20);
    doc.setFontSize(12); doc.setFont(undefined,'normal'); doc.setTextColor(100);
    doc.text(`Report Period: 24-Hour`,14,30);
    doc.text(`Generated: ${formatDateLongForm(now)} at ${now.toLocaleTimeString()}`,14,36);

    if (!report.length){
      doc.setFontSize(14); doc.setTextColor(150);
      doc.text("No valid clearances or requests found.",14,55);
    }else{
      doc.autoTable({
        head: [['Vehicle No.','Location','Escort Required','Expiry Date','Status']],
        body: report, startY:45, theme:'grid',
        headStyles:{ fillColor:[45,55,72], textColor:255, fontSize:10, fontStyle:'bold' },
        styles:{ fontSize:8, cellPadding:3, halign:'center', valign:'middle', overflow:'linebreak', lineColor:[200,200,200], lineWidth:0.5 },
        columnStyles:{
          0:{ halign:'left', fontStyle:'bold', cellWidth:25 },
          1:{ halign:'left', cellWidth:30 },
          2:{ halign:'left', cellWidth:35, valign:'top' },
          3:{ halign:'center', cellWidth:25 },
          4:{ halign:'center', fontStyle:'bold', cellWidth:20 }
        },
        didParseCell:(d)=>{
          if (d.section!=='body') return;
          if (d.column.index===4){
            const s = d.cell.raw;
            if (s==='ACTIVE'||s==='APPROVED') d.cell.styles.textColor=[22,163,74];
            else if (s==='PENDING') d.cell.styles.textColor=[245,158,11];
            else if (s==='EXPIRED') d.cell.styles.textColor=[239,68,68];
            else d.cell.styles.textColor=[107,114,128];
          }
          if (d.column.index===1 && d.cell.raw==='Foyer Parking'){
            d.cell.styles.fontStyle='bold'; d.cell.styles.fontSize=9; d.cell.styles.textColor=[204,85,0];
          }
          if (d.column.index===2){
            const t = String(d.cell.raw);
            if (t.includes('\n')){ d.cell.styles.fontSize=7; d.cell.styles.cellPadding=2; d.cell.styles.valign='top'; if (t.startsWith('Yes')){ d.cell.styles.fontStyle='bold'; d.cell.styles.textColor=[22,163,74]; } }
            else { d.cell.styles.fontSize=8; if (t==='Yes'){ d.cell.styles.textColor=[22,163,74]; d.cell.styles.fontStyle='bold'; } else if (t==='No'){ d.cell.styles.textColor=[239,68,68]; } }
          }
        }
      });
    }

    const y = doc.lastAutoTable ? doc.lastAutoTable.finalY+20 : 65;
    doc.setFontSize(14); doc.setFont(undefined,'bold'); doc.setTextColor(0); doc.text("Summary",14,y);
    doc.setFontSize(10); doc.setFont(undefined,'normal'); doc.setTextColor(100);
    const active = report.filter(r=>r[4]==='ACTIVE'||r[4]==='APPROVED').length;
    const pending = report.filter(r=>r[4]==='PENDING').length;
    doc.text(`Total Records: ${report.length}`,14,y+8);
    doc.text(`Active Clearances: ${active}`,14,y+16);
    doc.text(`Pending Requests: ${pending}`,14,y+24);

    const name = `Vehicle_Clearance_Report_${now.toISOString().split('T')[0]}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}.pdf`;
    doc.save(name);
    showNotification("PDF report generated successfully!");
  }catch(e){
    showNotification(`Failed to generate PDF: ${e.message}`,"error");
  }finally{ restore(); }
}
