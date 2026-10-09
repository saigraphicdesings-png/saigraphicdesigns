// Cache only the billing shell. Never cache admin API responses or intercept other pages.
const CACHE = 'sai-billing-shell-v1';
const FILES = ['/admin-billing.html','/admin-billing.js','/admin-billing.css','/admin.css','/admin-liquid-glass.css','/admin-sidebar.js'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('sai-billing-shell-')&&k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch', event => {
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!FILES.includes(url.pathname))return;
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(url.pathname,copy)));}return response;}).catch(()=>caches.match(url.pathname)));
});
