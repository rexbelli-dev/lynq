/* LYNQ service worker: lets the page open on weak signal. Profile data itself is cached by the page. */
const V='lynq-v2';
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.add('./')).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  const photo=u.hostname.endsWith('supabase.co')&&u.pathname.startsWith('/storage/v1/object/public/');
  if(r.method!=='GET'||(u.hostname.endsWith('supabase.co')&&!photo))return;   // never cache data or sign-in; public photos are fine
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put('./',cp));return res})
      .catch(()=>caches.match('./',{ignoreSearch:true})));return;
  }
  if(photo||u.origin===location.origin||['cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)){
    e.respondWith(caches.match(r).then(hit=>{
      const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>hit);
      return hit||net;
    }));
  }
});
