const CACHE_NAME = 'routine-cache-v1';
const CORE_ASSETS = [ './', './index.html', './manifest.webmanifest', './icons/icon-daily-routine.png' ];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CORE_ASSETS))); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))); });
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fetchPromise = fetch(e.request).then(res=>{
        if(res && res.status===200 && res.type==='basic'){
          const clone = res.clone(); caches.open(CACHE_NAME).then(c=>c.put(e.request, clone));
        }
        return res;
      }).catch(()=>cached);
      return cached || fetchPromise;
    })
  );
});
