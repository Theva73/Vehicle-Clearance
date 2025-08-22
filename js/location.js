export const getCurrentLocation = () => new Promise((resolve,reject)=>{
  if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
  navigator.geolocation.getCurrentPosition(
    (pos)=> resolve({ latitude:pos.coords.latitude, longitude:pos.coords.longitude, accuracy:pos.coords.accuracy }),
    (err)=>{
      const map = {1:"Location permission denied.",2:"Location info unavailable.",3:"Location request timed out."};
      reject(new Error(map[err.code] || "Location error"));
    },
    { enableHighAccuracy:true, timeout:15000, maximumAge:300000 }
  );
});

const R = 6371e3;
const toRad = (d)=> d*Math.PI/180;
export const distanceMeters = (lat1,lon1,lat2,lon2)=>{
  const φ1=toRad(lat1), φ2=toRad(lat2); const dφ=toRad(lat2-lat1); const dλ=toRad(lon2-lon1);
  const a=Math.sin(dφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(dλ/2)**2;
  return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
};
export const findNearestLocation = (userLocation, allowedLocations)=>{
  if (!allowedLocations?.length) return null;
  let nearest = allowedLocations[0];
  let min = distanceMeters(userLocation.latitude,userLocation.longitude,nearest.latitude,nearest.longitude);
  for (const loc of allowedLocations.slice(1)){
    const d = distanceMeters(userLocation.latitude,userLocation.longitude,loc.latitude,loc.longitude);
    if (d<min){ min=d; nearest=loc; }
  }
  return { name: nearest.name, distance: Math.round(min) };
};
