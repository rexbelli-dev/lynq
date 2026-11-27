/* js/boot.js
   Add to Home Screen, offline mode, and the start-up call.
   (Part of LYNQ 2027. See README.md, 'Where to change what'.) */
/* ---------- Add to Home Screen + offline ---------- */
try{
  const q=new URLSearchParams(location.search),keep=new URLSearchParams();
  ['card','u'].forEach(k=>q.get(k)&&keep.set(k,q.get(k)));
  const start=location.origin+location.pathname+(keep.toString()?'?'+keep:''),ic=n=>new URL('assets/'+n,location.href).href;
  const mf={name:'LYNQ',short_name:'LYNQ',start_url:start,scope:new URL('./',location.href).href,display:'standalone',background_color:'#0f0a0e',theme_color:'#D6248F',icons:[{src:ic('icon-192.png'),sizes:'192x192',type:'image/png'},{src:ic('icon-512.png'),sizes:'512x512',type:'image/png'}]};
  const l=document.createElement('link');l.rel='manifest';l.href=URL.createObjectURL(new Blob([JSON.stringify(mf)],{type:'application/manifest+json'}));document.head.appendChild(l);
  if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}catch(_e){}
init();

