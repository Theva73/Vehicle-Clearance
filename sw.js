const CACHE = "vs-ultra-v3";
const ASSETS = [
  "./",
  "./watch.html",
  "./manifest.webmanifest",
  "./offline.html",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE && caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e)=>{
  const req = e.request;
  const url = new URL(req.url);
  if(req.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    caches.match(req).then(cached => {
      if(cached) return cached;
      return fetch(req).then(res => {
        const copy = res.clone();
        if(res.ok && (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html") || /\.(js|css|png|jpg|svg|webmanifest)$/.test(url.pathname))){
          caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(()=> caches.match("./offline.html"));
    })
  );
});
