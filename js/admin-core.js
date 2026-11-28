/* js/admin-core.js
   Shared tools for the admin app: database connection, small helpers, icons, charts,
   popups, the menu, and page switching. Other admin-*.js files use these. */

const sb=window.supabase.createClient('https://cmiuramqfgwyumniedfv.supabase.co','sb_publishable_yegka1PYoQm-U1dpEJJJHA_qbb1ujc6');
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BASE=location.origin+'/';                       // where the profile page lives (cards open this)
const peso=n=>(n<0?'-':'')+'₱'+Math.abs(+n||0).toLocaleString('en-PH',{minimumFractionDigits:0,maximumFractionDigits:2});
const num=n=>(+n||0).toLocaleString('en-PH');
const dstr=d=>d?new Date(d+(String(d).length===10?'T00:00':'')).toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}):'';
const mlabel=k=>new Date(k+'-01T00:00').toLocaleDateString('en-PH',{month:'short',year:'2-digit'});
const today=()=>new Date().toISOString().slice(0,10);
let ME={email:'',role:'staff',name:''};           // filled in at sign-in
const isFounder=()=>ME.role==='founder';

/* ---------- icons (one list: change an icon here) ---------- */
const AIC={
 grid:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
 bag:'<path d="M6 2l-3 4v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
 box:'<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
 card:'<rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/>',
 users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
 flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
 wallet:'<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
 team:'<path d="M12 2l3 6 6 .9-4.4 4.3 1 6.2L12 16.5 6.4 19.4l1-6.2L3 8.9 9 8z"/>',
 plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
 list:'<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
 more:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
 download:'<path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M5 21h14"/>',
 trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
 archive:'<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><line x1="10" y1="12" x2="14" y2="12"/>',
 out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
 edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
 app:'<rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
 back:'<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>'
};
const ic=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${AIC[n]||''}</svg>`;

/* ---------- popups ---------- */
function modal(html,onClose){
  const o=document.createElement('div');o.className='ov';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');
  o.innerHTML=`<div class="sheet">${html}</div>`;
  const close=()=>{o.remove();onClose&&onClose()};
  o.addEventListener('mousedown',e=>{if(e.target===o)close()});
  o.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  $('modalRoot').appendChild(o);
  const f=o.querySelector('input,select,textarea,button');f&&f.focus();
  o.close=close;return o;
}
function confirmBox(title,msg,okLabel,danger){
  return new Promise(res=>{
    const o=modal(`<h2>${esc(title)}</h2><p class="mut">${esc(msg)}</p><div class="acts"><button class="btn" data-x="0">Cancel</button><button class="btn ${danger?'dng':'pri'}" data-x="1">${esc(okLabel||'OK')}</button></div>`,()=>res(false));
    o.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(b){res(b.dataset.x==='1');o.remove()}});
  });
}
let toastT;
function toast(msg,bad){const t=$('toastRoot');t.innerHTML=`<div class="toast${bad?' bad':''}">${esc(msg)}</div>`;clearTimeout(toastT);toastT=setTimeout(()=>t.innerHTML='',3200)}
async function rpc(fn,args,okMsg){
  const{data,error}=await sb.rpc(fn,args||{});
  if(error){toast(error.message||'Something went wrong',true);return{error}}
  if(okMsg)toast(okMsg);return{data};
}
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'text/csv'}));a.download=name;a.click()}
const csvCell=v=>{v=String(v??'');return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const toCSV=(head,rows)=>[head.map(csvCell).join(',')].concat(rows.map(r=>r.map(csvCell).join(','))).join('\n');

/* ---------- charts (plain SVG, no library) ---------- */
function niceMax(v){if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v))),f=v/p;return(f<=1?1:f<=2?2:f<=5?5:10)*p}
function areaChart(data,o){
  o=o||{};const W=640,H=o.h||200,p={l:40,r:8,t:10,b:24},iw=W-p.l-p.r,ih=H-p.t-p.b,color=o.color||'#D6248F';
  const vals=data.map(d=>+d.n||0),mx=niceMax(Math.max(...vals,1)),n=Math.max(data.length-1,1);
  const X=i=>p.l+iw*i/n,Y=v=>p.t+ih-ih*v/mx;
  const line=vals.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join(' ');
  const grid=[0,.25,.5,.75,1].map(f=>{const y=p.t+ih*(1-f);return`<line x1="${p.l}" x2="${W-p.r}" y1="${y}" y2="${y}" stroke="#E4D9CB"/><text x="${p.l-6}" y="${y+4}" text-anchor="end">${num(Math.round(mx*f))}</text>`}).join('');
  const xs=[0,Math.floor(n/2),n].map(i=>data[i]?`<text x="${X(i)}" y="${H-6}" text-anchor="${i===0?'start':i===n?'end':'middle'}">${esc(data[i].day?data[i].day.slice(5):data[i].x)}</text>`:'').join('');
  const total=vals.reduce((a,b)=>a+b,0);
  return`<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc((o.label||'Chart')+': total '+num(total))}">${grid}<path d="${line} L${X(n)} ${p.t+ih} L${X(0)} ${p.t+ih}Z" fill="${color}" opacity=".14"/><path d="${line}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${vals.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="${data.length>45?0:3}" fill="${color}"><title>${esc(data[i].day||data[i].x)}: ${num(v)}</title></circle>`).join('')}${xs}</svg></div>`;
}
function barPairs(data,names,colors){
  const W=640,H=230,p={l:48,r:8,t:10,b:26},iw=W-p.l-p.r,ih=H-p.t-p.b;
  const mx=niceMax(Math.max(...data.flatMap(d=>[d.a,d.b]),1)),gw=iw/data.length,bw=Math.min(18,gw/2.6);
  const grid=[0,.5,1].map(f=>{const y=p.t+ih*(1-f);return`<line x1="${p.l}" x2="${W-p.r}" y1="${y}" y2="${y}" stroke="#E4D9CB"/><text x="${p.l-6}" y="${y+4}" text-anchor="end">${num(Math.round(mx*f))}</text>`}).join('');
  const bars=data.map((d,i)=>{const cx=p.l+gw*i+gw/2,h1=ih*d.a/mx,h2=ih*d.b/mx;
    return`<rect x="${cx-bw-1}" y="${p.t+ih-h1}" width="${bw}" height="${h1}" rx="3" fill="${colors[0]}"><title>${esc(d.x)} ${esc(names[0])}: ${peso(d.a)}</title></rect><rect x="${cx+1}" y="${p.t+ih-h2}" width="${bw}" height="${h2}" rx="3" fill="${colors[1]}"><title>${esc(d.x)} ${esc(names[1])}: ${peso(d.b)}</title></rect><text x="${cx}" y="${H-8}" text-anchor="middle">${esc(d.x)}</text>`}).join('');
  return`<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(names[0]+' and '+names[1]+' by month')}">${grid}${bars}</svg></div><div class="legend"><span><i style="background:${colors[0]}"></i>${esc(names[0])}</span><span><i style="background:${colors[1]}"></i>${esc(names[1])}</span></div>`;
}
function hbars(items,fmt,color){
  if(!items.length)return'<div class="mut sm">Nothing yet.</div>';const mx=Math.max(...items.map(i=>i.n),1);
  return`<div class="hb">${items.map(i=>`<div><div class="l"><span>${esc(i.k)}</span><b>${fmt?fmt(i.n):num(i.n)}</b></div><div class="tr"><i style="width:${Math.max(2,100*i.n/mx)}%;${color?'background:'+color:''}"></i></div></div>`).join('')}</div>`;
}
function donut(parts){
  const tot=parts.reduce((a,p)=>a+p.n,0)||1;let a0=-Math.PI/2;const R=60,r=38,C=75;
  const arcs=parts.filter(p=>p.n>0).map(p=>{const a1=a0+2*Math.PI*p.n/tot,big=a1-a0>Math.PI?1:0;
    const pt=(a,rr)=>[C+rr*Math.cos(a),C+rr*Math.sin(a)];const[x0,y0]=pt(a0,R),[x1,y1]=pt(a1-.0001,R),[x2,y2]=pt(a1-.0001,r),[x3,y3]=pt(a0,r);
    const d=parts.filter(q=>q.n>0).length===1?`M${C} ${C-R}A${R} ${R} 0 1 1 ${C-.01} ${C-R}L${C-.01} ${C-r}A${r} ${r} 0 1 0 ${C} ${C-r}Z`:`M${x0} ${y0}A${R} ${R} 0 ${big} 1 ${x1} ${y1}L${x2} ${y2}A${r} ${r} 0 ${big} 0 ${x3} ${y3}Z`;
    a0=a1;return`<path d="${d}" fill="${p.c}"><title>${esc(p.k)}: ${num(p.n)}</title></path>`}).join('');
  return`<div class="donutw"><svg viewBox="0 0 150 150" role="img" aria-label="${esc(parts.map(p=>p.k+' '+p.n).join(', '))}">${arcs}<text x="75" y="80" text-anchor="middle" style="font-size:20px;font-weight:800;fill:#1B1220">${num(tot===1&&!parts.some(p=>p.n)?0:tot)}</text></svg><div class="legend" style="flex-direction:column;gap:8px;margin:0">${parts.map(p=>`<span><i style="background:${p.c}"></i>${esc(p.k)}: <b style="color:#1B1220">${num(p.n)}</b></span>`).join('')}</div></div>`;
}

/* ---------- menu and page switching ---------- */
const NAV=[
 {id:'dash',t:'Dashboard',i:'grid',bottom:1},
 {id:'cards',t:'Cards',i:'card'},
 {id:'orders',t:'Orders',i:'bag',bottom:1},
 {id:'stock',t:'Inventory',i:'box'},
 {id:'rep',t:'Reports',i:'flag',bottom:1},
 {id:'money',t:'Monitoring',i:'wallet',f:1,bottom:1},
 {id:'users',t:'Users',i:'users'},
 {id:'team',t:'Team',i:'team',f:1},
 {id:'gen',t:'Generate cards',i:'plus'},
 {id:'log',t:'Activity log',i:'list'}
];
const LOADERS={};let CUR='dash',OPENREP=0,NEWORD=0;
const navList=()=>NAV.filter(n=>!n.f||isFounder());
function buildNav(){
  const L=navList(),bt=L.filter(n=>n.bottom).slice(0,4);
  $('side').innerHTML=`<div class="brand"><img src="assets/lynq-logo.webp" alt=""><div><i class="wm" role="img" aria-label="LYNQ" style="height:16px;display:block"></i><span>Admin</span></div></div>`+
    L.map(n=>`<button class="nv" data-go="${n.id}" aria-label="${n.t}">${ic(n.i)}<span>${n.t}</span>${n.id==='rep'&&OPENREP?`<em class="dot">${OPENREP}</em>`:''}${n.id==='orders'&&NEWORD?`<em class="dot">${NEWORD}</em>`:''}</button>`).join('')+
    `<div class="grow"></div><button class="nv hide" id="installBtn" aria-label="Install app">${ic('app')}<span>Install app</span></button>
     <button class="me" data-go="me" aria-label="My profile"><span class="av">${esc((ME.name||ME.email||'?')[0].toUpperCase())}</span><div><b class="sm">${esc(ME.name||'Me')}</b><small>${esc(ME.email)}</small></div></button>
     <button class="nv" id="outBtn" aria-label="Sign out">${ic('out')}<span>Sign out</span></button>`;
  $('bnav').innerHTML=bt.map(n=>`<button class="bn" data-go="${n.id}">${ic(n.i)}${n.t==='Monitoring'?'Money':n.t}${n.id==='rep'&&OPENREP?`<em class="dot">${OPENREP}</em>`:''}${n.id==='orders'&&NEWORD?`<em class="dot">${NEWORD}</em>`:''}</button>`).join('')+`<button class="bn" id="moreBtn">${ic('more')}More</button>`;
  markNav();if(window._pwa)$('installBtn').classList.remove('hide');
}
function markNav(){document.querySelectorAll('[data-go]').forEach(b=>b.classList.toggle('on',b.dataset.go===CUR));$('moreBtn')&&$('moreBtn').classList.toggle('on',!navList().filter(n=>n.bottom).slice(0,4).some(n=>n.id===CUR))}
function go(id){
  if(!document.getElementById('p-'+id))id='dash';
  const meta=NAV.find(n=>n.id===id);if(meta&&meta.f&&!isFounder())id='dash';
  CUR=id;document.querySelectorAll('.page').forEach(p=>p.classList.toggle('hide',p.id!=='p-'+id));
  history.replaceState(null,'','#'+id);markNav();window.scrollTo(0,0);LOADERS[id]&&LOADERS[id]();
}
document.addEventListener('click',e=>{
  const g=e.target.closest('[data-go]');if(g){document.querySelector('.ov')&&document.querySelector('.ov').close();go(g.dataset.go);return}
  if(e.target.closest('#outBtn')||e.target.closest('[data-out]')){sb.auth.signOut().then(()=>location.reload());return}
  if(e.target.closest('#moreBtn')){
    const items=navList().filter(n=>!navList().filter(m=>m.bottom).slice(0,4).includes(n));
    const o=modal(`<h2>More</h2><div style="display:flex;flex-direction:column;gap:8px">${items.map(n=>`<button class="btn" data-go="${n.id}" style="justify-content:flex-start">${ic(n.i)}${n.t}</button>`).join('')}<button class="btn" data-go="me" style="justify-content:flex-start">${ic('users')}My profile</button>${window._pwa?`<button class="btn" id="installBtn2" style="justify-content:flex-start">${ic('app')}Install app</button>`:''}<button class="btn dng" data-out style="justify-content:flex-start">${ic('out')}Sign out</button></div>`);return}
  if(e.target.closest('#installBtn')||e.target.closest('#installBtn2')){installApp()}
});
async function installApp(){
  if(window._pwa){window._pwa.prompt();await window._pwa.userChoice;window._pwa=null;buildNav();return}
  modal(`<h2>Install LYNQ Admin</h2><p>On <b>iPhone / iPad</b>: tap the Share button in Safari, then <b>Add to Home Screen</b>.</p><p>On <b>Android / Chrome</b>: open the browser menu and choose <b>Install app</b>.</p><p>On a <b>computer</b>: click the install icon at the right end of the address bar (Chrome or Edge).</p><div class="acts"><button class="btn pri" onclick="this.closest('.ov').close()">Got it</button></div>`);
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();window._pwa=e;buildNav()});
window.addEventListener('offline',()=>$('offline').classList.remove('hide'));window.addEventListener('online',()=>$('offline').classList.add('hide'));
function pageHead(title,sub,actions){return`<div class="bar"><div><h1 id="t-${CUR}">${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div><div class="row">${actions||''}</div></div>`}
