const CACHE='planner-aruba-curacao-v3.4';
const STATIC=['./styles.css','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  const isCritical=url.pathname.endsWith('/')||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/fix.js');
  if(isCritical){
    event.respondWith(fetch(req,{cache:'no-store'}).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));return resp}).catch(()=>caches.match(req).then(resp=>resp||caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));return resp})));
});