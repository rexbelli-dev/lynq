/* LYNQ service worker: lets the page open on weak signal. Profile data itself is cached by the page.
   Rule of thumb: our own files (html/css/js) = newest first, saved copy only when offline.
   Photos, fonts and libraries = saved copy first (fast). Raise V when you want everyone to refresh the saved copies. */
const V='lynq-v7';
const SHELL=['./','css/tokens.css','css/base.css','css/profile.css','css/components.css','css/flow.css','css/editor.css','css/overlays.css','css/features.css','css/themes.css','js/theme-core.js','js/icons.js','js/config.js','js/storage.js','js/media.js','js/render.js','js/legal-i18n.js','js/dialogs-account.js','js/features.js','js/tour-menu.js','js/flow.js','js/card-binding.js','js/boot.js','admin.html','admin.webmanifest','css/admin.css','js/admin-core.js','js/admin-dash.js','js/admin-cards.js','js/admin-reports.js','js/admin-money.js','js/admin-team.js','js/admin-boot.js','assets/admin-icon-192.png','assets/lynq-wordmark.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const save=(r,res)=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res};
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  const photo=u.hostname.endsWith('supabase.co')&&u.pathname.startsWith('/storage/v1/object/public/');
  if(r.method!=='GET'||(u.hostname.endsWith('supabase.co')&&!photo))return;   // never cache data or sign-in; public photos are fine
  if(r.mode==='navigate'){   // the page itself: newest first; offline falls back to the saved page (same file, any ?card=)
    e.respondWith(fetch(r).then(res=>{save(u.origin+u.pathname,res.clone());return res})
      .catch(()=>caches.match(u.origin+u.pathname).then(h=>h||caches.match('./',{ignoreSearch:true}))));return;
  }
  if(u.origin===location.origin&&/\.(html|css|js)$/.test(u.pathname)){   // our own code: network first
    e.respondWith(fetch(r).then(res=>save(r,res)).catch(()=>caches.match(r)));return;
  }
  if(photo||u.origin===location.origin||['cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)){   // images, fonts, libraries: saved copy first
    e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>save(r,res)).catch(()=>hit)));
  }
});
