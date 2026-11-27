/* js/media.js
   Save-contact file, website logos, photo cropper, gallery.
   (Part of LYNQ 2027. See README.md, 'Where to change what'.) */
/* ---------- vCard ---------- */
async function downloadVCard(){
  saveLynqContact(false);
  const name=state.name||'Contact',parts=name.trim().split(' '),last=parts.length>1?parts.pop():'',first=parts.join(' ');
  const w=(state.work||[])[0],fold=l=>l.replace(/(.{74})(?=.)/g,'$1\r\n ');
  let photo='';
  if(state.avatar){try{const bl=await (await fetch(state.avatar)).blob();photo=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(String(fr.result).split(',')[1]||'');fr.readAsDataURL(bl)})}catch(_e){}}
  const L=['BEGIN:VCARD','VERSION:3.0',`N:${last};${first};;;`,`FN:${name}`,
    w&&w.company?`ORG:${w.company}`:'',w&&w.role?`TITLE:${w.role}`:'',
    state.workCityCountry?`ADR;TYPE=WORK:;;;${state.workCityCountry};;;`:'',
    state.phone?`TEL;TYPE=CELL:${state.phone}`:'',state.email?`EMAIL;TYPE=INTERNET:${state.email}`:'',
    photo?`PHOTO;ENCODING=b;TYPE=JPEG:${photo}`:'',
    ...(state.links||[]).map(l=>`URL;TYPE=${((ICONS[l.platform]||ICONS.website).label).replace(/[^A-Za-z]/g,'')}:${safeUrl(l.url)}`),
    state.bio?`NOTE:${state.bio.replace(/\n/g,'\\n')}`:'',`URL;TYPE=LYNQ:${shareUrl()}`,'END:VCARD'].filter(Boolean).map(fold).join('\r\n');
  const url=URL.createObjectURL(new Blob([L],{type:'text/vcard;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=`${name.replace(/\s+/g,'_')}_contact.vcf`;
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}

function applyThemePreset(key){state.themeKey=key;localStorage.setItem('lynq_theme_key',key);render()}
function setCustom(p){state.custom={accent:'#D6248F',mode:'light',...(state.custom||{}),...p};state.themeKey='custom';localStorage.setItem('lynq_theme_key','custom');render()}
function toggleCustomLabel(){
  const sel=$('platformSel').value,ci=$('customNameInput'),lu=$('linkUrl');
  ci.parentElement.classList.toggle('hidden',sel!=='website');if(sel!=='website')ci.value='';$('logoRow').classList.toggle('hidden',sel!=='website');if(sel!=='website'&&pendingLogo){pendingLogo='';syncLogoUI()}
  if(sel==='whatsapp'){lu.value='https://wa.me/';lu.placeholder='https://wa.me/639123456789 (Use international format)'}
  else{if(lu.value==='https://wa.me/')lu.value='';lu.placeholder='https:// or phone / email'}
}
function compressImage(file,maxW,q,cb){
  const r=new FileReader();r.readAsDataURL(file);
  r.onload=e=>{const img=new Image();img.src=e.target.result;img.onload=()=>{
    const c=document.createElement('canvas');let w=img.width,h=img.height;
    if(w>maxW){h=Math.round(h*maxW/w);w=maxW}
    c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);cb(c.toDataURL('image/jpeg',q))}};
}

/* ---------- website logos ---------- */
function compressLogo(file,cb){
  const r=new FileReader();
  r.onload=e=>{const img=new Image();img.onload=()=>{
    const iw=img.width||160,ih=img.height||160,k=Math.min(1,160/Math.max(iw,ih)),w=Math.max(1,Math.round(iw*k)),h=Math.max(1,Math.round(ih*k)),c=document.createElement('canvas');
    c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);cb(c.toDataURL('image/webp',.9))};img.src=e.target.result};
  r.readAsDataURL(file);
}
function logoPick(cb){const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=()=>{const f=i.files[0];if(f)compressLogo(f,cb)};i.click()}
function syncLogoUI(){
  $('logoPrev').style.backgroundImage=pendingLogo?`url(${pendingLogo})`:'';
  $('logoRm').hidden=!pendingLogo;$('logoUp').firstChild.nodeValue=pendingLogo?'Change':'Upload';
}

/* ---------- drag & pinch cropper ---------- */
function openCropper(file,kind,cb){
  const av=kind==='avatar',W=Math.min(innerWidth-48,340),H=av?W:Math.round(W*.48);
  const vp=$('cropVp'),im=$('cropImg'),z=$('cropZoom'),url=URL.createObjectURL(file);
  vp.style.width=W+'px';vp.style.height=H+'px';
  $('cropMask').className='cmask'+(av?' circle':'');
  $('cropTitle').textContent=av?'Adjust profile photo':'Adjust cover photo';
  let s=1,minS=1,tx=0,ty=0,nw=1,nh=1;
  const clamp=()=>{s=Math.min(Math.max(s,minS),minS*5);tx=Math.min(0,Math.max(W-nw*s,tx));ty=Math.min(0,Math.max(H-nh*s,ty));
    im.style.transform=`translate(${tx}px,${ty}px) scale(${s})`;z.value=Math.round(s/minS*100)};
  const zoomAt=(f,cx,cy)=>{const ns=Math.min(Math.max(s*f,minS),minS*5);f=ns/s;tx=cx-(cx-tx)*f;ty=cy-(cy-ty)*f;s=ns;clamp()};
  im.onload=()=>{nw=im.naturalWidth;nh=im.naturalHeight;im.style.width=nw+'px';im.style.height=nh+'px';
    minS=Math.max(W/nw,H/nh);s=minS;tx=(W-nw*s)/2;ty=(H-nh*s)/2;clamp()};
  im.src=url;$('crop').classList.add('open');
  const P=new Map();let ld=0,lm=null;
  const info=()=>{const a=[...P.values()];return a.length===2?{d:Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]),m:[(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2]}:null};
  vp.onpointerdown=e=>{vp.setPointerCapture(e.pointerId);P.set(e.pointerId,[e.clientX,e.clientY]);const i=info();ld=i?i.d:0;lm=i?i.m:null};
  vp.onpointermove=e=>{
    if(!P.has(e.pointerId))return;const p=P.get(e.pointerId);P.set(e.pointerId,[e.clientX,e.clientY]);
    if(P.size===1){tx+=e.clientX-p[0];ty+=e.clientY-p[1];clamp()}
    else if(P.size===2){const i=info(),r=vp.getBoundingClientRect();
      if(ld&&lm){tx+=i.m[0]-lm[0];ty+=i.m[1]-lm[1];zoomAt(i.d/ld,i.m[0]-r.left,i.m[1]-r.top)}ld=i.d;lm=i.m}};
  vp.onpointerup=vp.onpointercancel=e=>{P.delete(e.pointerId);ld=0;lm=null};
  vp.onwheel=e=>{e.preventDefault();const r=vp.getBoundingClientRect();zoomAt(e.deltaY<0?1.08:.92,e.clientX-r.left,e.clientY-r.top)};
  z.oninput=()=>zoomAt(z.value/100*minS/s,W/2,H/2);
  const close=()=>{$('crop').classList.remove('open');URL.revokeObjectURL(url)};
  $('cropCancel').onclick=close;
  $('cropOk').onclick=()=>{const ow=av?480:1000,oh=Math.round(ow*H/W),c=document.createElement('canvas');
    c.width=ow;c.height=oh;c.getContext('2d').drawImage(im,-tx/s,-ty/s,W/s,H/s,0,0,ow,oh);
    cb(c.toDataURL('image/jpeg',.82));close()};
}
function pick(kind,cb){const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=()=>{const f=i.files[0];if(f)openCropper(f,kind,cb)};i.click()}

/* ---------- gallery carousel ---------- */
let gi=0;const gPhotos=()=>(state.photos||[]).filter(Boolean);
function galShow(n,animate){
  const p=gPhotos();if(!p.length)return;gi=(n+p.length)%p.length;
  const img=$('galImg'),set=()=>{img.src=p[gi];img.classList.remove('sw')};
  if(animate){img.classList.add('sw');setTimeout(set,180)}else set();
  $('galDots').innerHTML=p.map((_,i)=>`<i class="${i===gi?'on':''}"></i>`).join('');
  $('galPrev').classList.toggle('hidden',p.length<2);$('galNext').classList.toggle('hidden',p.length<2);
}

