
const CACHE = "za-companion-v2";
const CORE = [
  "./",
  "./index.html",
  "./app.js",
  "./data.json",
  "./manifest.webmanifest",
  "./icon.svg"
];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=="GET")return;
 e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
   if(res && (res.ok || res.type==="opaque")){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}
   return res;
 }).catch(()=>caches.match(e.request))));
});
