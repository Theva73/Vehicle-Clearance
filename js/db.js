import { db } from "./firebase.js";
import {
  collection, doc, addDoc, setDoc, deleteDoc, onSnapshot,
  query, Timestamp, getDoc, where, updateDoc, getDocs, orderBy, writeBatch, limit
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { distanceMeters, findNearestLocation } from "./location.js";

export const streams = { clearancesUnsub:null, vvipsUnsub:null };

export async function validateUserID(userID){
  try{
    const q = query(collection(db,"authorizedUsers"), where("userId","==",userID), where("isActive","==",true));
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  }catch{ return null; }
}

export async function getAllowedLocations(){
  try{
    const q = query(collection(db,"allowedLocations"), where("isActive","==",true));
    const snap = await getDocs(q);
    return snap.docs.map(d=>({ id:d.id, ...d.data() }));
  }catch{ return []; }
}

export async function checkLocationAccess(userLocation, allowedLocations){
  if (!userLocation || !allowedLocations.length) return { allowed:false, reason:"No valid locations configured" };
  for (const loc of allowedLocations){
    let effective = loc.radiusMeters;
    if (userLocation.accuracy>50) effective += Math.min(userLocation.accuracy*0.5,100);
    const d = distanceMeters(userLocation.latitude,userLocation.longitude,loc.latitude,loc.longitude);
    if (d <= effective) return { allowed:true, locationName:loc.name, distance:Math.round(d), method:'gps' };
  }
  return { allowed:false, reason:"You are not within an authorized location", nearestLocation: findNearestLocation(userLocation,allowedLocations) };
}

export async function logAccessAttempt(userID, userLocation, accessGranted, reason){
  try{
    const data = {
      userId:userID, location:userLocation || null, locationName:null,
      accessGranted, reason, timestamp: Timestamp.now(), userAgent: navigator.userAgent, ipAddress: null
    };
    if (accessGranted && userLocation){
      const allowed = await getAllowedLocations();
      const check = await checkLocationAccess(userLocation, allowed);
      if (check.allowed) data.locationName = check.locationName;
    }
    await addDoc(collection(db,"accessLogs"), data);
  }catch{}
}
export const updateLastUsed = async (authUserId) =>
  updateDoc(doc(db,"authorizedUsers",authUserId), { lastUsed: Timestamp.now() });

export function listenClearances(cb){
  streams.clearancesUnsub?.();
  streams.clearancesUnsub = onSnapshot(collection(db,"vehicleClearances"), snap => {
    cb(snap.docs.map(d=>({id:d.id, ...d.data()})));
  });
}
export function listenVVIPs(cb){
  streams.vvipsUnsub?.();
  streams.vvipsUnsub = onSnapshot(query(collection(db,"vvips"), orderBy("vehicleNumber")), snap=>{
    cb(snap.docs.map(d=>({id:d.id, ...d.data()})));
  });
}

export async function exportDatabaseData(button, notify){
  try{
    notify("Exporting database data…","info");
    const collections = ['vehicleClearances','clearanceRequests','vvips','admins','publicConfig','authorizedUsers','allowedLocations','accessLogs'];
    const payload = { exportDate: new Date().toISOString(), collections:{} };
    for (const name of collections){
      const snap = await getDocs(collection(db,name));
      payload.collections[name] = snap.docs.map(docSnap => {
        const data = docSnap.data();
        for (const k in data){
          if (data[k]?.toDate) data[k] = data[k].toDate().toISOString();
        }
        return { id: docSnap.id, ...data };
      });
    }
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `vehicle_clearance_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    notify("✅ Database exported successfully!");
  }catch(e){ notify(`❌ Export failed: ${e.message}`,"error"); }
}

export async function clearAllDatabaseData(notify){
  try{
    notify("Starting database cleanup…","info");
    const cols = ['vehicleClearances','clearanceRequests'];
    let total=0;
    for (const name of cols){
      const snap = await getDocs(collection(db,name));
      if (snap.size){
        const batch = writeBatch(db);
        snap.docs.forEach((d)=> batch.delete(d.ref));
        await batch.commit(); total += snap.size;
        notify(`✅ Cleared ${snap.size} documents from ${name}`);
      }
    }
    notify(`🎉 Cleanup complete! Deleted ${total} total documents.`);
  }catch(e){ notify(`❌ Error clearing database: ${e.message}`,"error"); }
}
