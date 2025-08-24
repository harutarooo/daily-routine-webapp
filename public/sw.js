const CACHE_NAME = 'routine-cache-v2';
const CORE_ASSETS = [ './', './index.html', './manifest.webmanifest', './icons/icon-daily-routine.png' ];
self.addEventListener('install', e=>{
  e.waitUntil((async ()=>{
    const c = await caches.open(CACHE_NAME);
    await c.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e=>{
  e.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e=>{
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // ブラウザ拡張 (chrome-extension:// など) や data:, blob:, file: は触らない
  if(url.protocol !== 'http:' && url.protocol !== 'https:') return;
  e.respondWith((async ()=>{
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(e.request);
    const networkPromise = fetch(e.request).then(res=>{
      if(res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')){
        const reqUrl = new URL(e.request.url);
        if(reqUrl.protocol === 'http:' || reqUrl.protocol === 'https:'){
          const clone = res.clone();
          cache.put(e.request, clone).catch(()=>{});
        }
      }
      return res;
    }).catch(()=> cached);
    return cached || networkPromise;
  })());
});
