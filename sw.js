const CACHE_NAME = 'accounting-static-v1';
const CORE_ASSETS = ['./', './index.html', './style.css', './app.js', './icon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('accounting-static-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok && ['document','script','style','image','manifest'].includes(event.request.destination)) {
      const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
    }
    return response;
  }).catch(()=>caches.match(event.request)));
});
