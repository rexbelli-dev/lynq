/* js/tour-menu.js
   First-time walkthrough, top-right menu, visitor share panel.
   (Part of LYNQ 2027. See README.md, 'Where to change what'.) */
/* ---------- first-time walkthrough of the editor ---------- */
const TOUR=[
 {t:'Welcome to your editor',x:'This quick tour shows where everything is. It takes about a minute.'},
 {s:0,t:'Photos',x:'Add your profile photo and cover here. Tap Remove if you change your mind.'},
 {s:1,t:'Appearance',x:'Pick a theme, or choose your own color. You can switch any time.'},
 {s:2,t:'About you',x:'Add your location, languages and hobbies. Tap your name or bio at the top of the page to edit them directly.'},
 {s:3,t:'Contact & payment',x:'Add your phone, email and your GCash or Maya QR so people can reach and pay you.'},
 {s:4,t:'Education & work',x:'Share where you studied and where you work. Education and Work experience sit right here.'},
 {s:6,t:'Add a link',x:'Add Instagram, Facebook, WhatsApp, your website and more. Tap the × on a link to remove it.'},
 {s:7,t:'Selling something?',x:'Turn on Business mode to list services or products with prices and photos, add a Book or Order button, and show a status badge.'},
 {s:8,t:'Your share link',x:'Choose a short username to share online. Your card still opens with its own serial number.'},
 {bar:1,t:'Save & publish',x:'Nothing goes live until you press this. Do it when you are finished.'},
 {t:'You are all set!',x:'Open the menu (top right) any time for My cards, Analytics and more. You can replay this tour from the menu under Tutorial.'}
];
let tourI=-1,tourTimer=null;
function tourTarget(st){
  if(st.bar)return document.querySelector('.actionbar');
  if(st.s==null)return null;
  const sec=document.querySelectorAll('#editPanel > details.sec')[st.s];
  return sec?sec.querySelector('summary'):null;
}
function showTour(i){
  tourI=i;const st=TOUR[i],el=tourTarget(st),card=$('tourCard'),spot=$('tourSpot');
  clearInterval(tourTimer);
  const tx=(TOURX[LANG]||[])[i];
  $('tcStep').textContent=`${T('step')} ${i+1} ${T('of')} ${TOUR.length}`;$('tcTitle').textContent=tx?tx[0]:st.t;$('tcText').textContent=tx?tx[1]:st.x;$('tcSkip').textContent=T('skip');$('tcBack').textContent=T('back');
  $('tcBack').classList.toggle('hidden',i===0);$('tcNext').textContent=i===TOUR.length-1?T('done'):T('next');
  if(!el){spot.className='none';spot.style.cssText='';card.className='mid';return}
  spot.className='';card.className='bottom';
  el.scrollIntoView({block:'center',behavior:'smooth'});
  tourTimer=setInterval(()=>{
    const r=el.getBoundingClientRect();
    spot.style.left=(r.left-6)+'px';spot.style.top=(r.top-6)+'px';spot.style.width=(r.width+12)+'px';spot.style.height=(r.height+12)+'px';
    card.className=(r.top+r.height/2>innerHeight*.5)?'top':'bottom';
  },120);
}
function startTour(){if(!editing)return;$('tour').classList.remove('hidden');showTour(0)}
function endTour(){
  clearInterval(tourTimer);$('tour').classList.add('hidden');tourI=-1;
  state.tourDone=true;try{localStorage.setItem('lynq_tour','1')}catch(_e){}
  if(isOwner)persist();
}
const maybeTour=()=>{if(editing&&!state.tourDone&&!localStorage.getItem('lynq_tour'))setTimeout(startTour,450)};

/* ---------- menu + visitor "share your contact" ---------- */
function buildMenu(){
  const signed=!!curSession;
  $('mSignIn').classList.toggle('hidden',signed||!$('signInLink'));
  $('mSaveThis').classList.toggle('hidden',isOwner||!currentCardUid);
  $('mOwner').classList.toggle('hidden',!(signed&&hasAccount));
  const go=signed&&hasAccount&&!!myUid&&!isOwner;
  $('mGoMine').classList.toggle('hidden',!go);$('goMineBtn').classList.toggle('hidden',!go);
  $('mTour').classList.toggle('hidden',!isOwner);
  $('mRef').classList.toggle('hidden',!(signed&&hasAccount));
  $('mCommunity').classList.toggle('hidden',!(signed&&hasAccount));
  {const g=!isOwner&&!(signed&&hasAccount)&&!!GET_LYNQ_URL,gl=$('getLynq');
   gl.classList.toggle('hidden',!g);
   if(g)gl.href=GET_LYNQ_URL+(curRef?(GET_LYNQ_URL.includes('?')?'&':'?')+'ref='+encodeURIComponent(curRef):'')}
  $('mReport').classList.toggle('hidden',!(signed&&hasAccount));
  $('bellBtn').classList.toggle('hidden',!(signed&&hasAccount));
  if(signed&&hasAccount&&!notifLoaded){notifLoaded=true;loadNotifs()}
  $('mCards').classList.toggle('hidden',!(signed&&hasAccount));
  $('mStats').classList.toggle('hidden',!(signed&&hasAccount&&(isOwner||!!myUid)));
  $('mInstall').classList.toggle('hidden',!!standalone());
  $('mAdmin').classList.toggle('hidden',!isStaff);
}
let scVisitor=false;const SC_T='Share your contact with the profile owner';
function fitSc(){$('scPanel').style.setProperty('--scs',Math.max(.5,Math.min(.7,(innerWidth-112)/340)))}
function setSc(open){
  if(open)sessionStorage.removeItem('sc_min');else sessionStorage.setItem('sc_min','1');
  if(open)$('scStatus').textContent=SC_T;
  $('scPanel').classList.toggle('hidden',!(scVisitor&&open));
  $('scBtn').classList.toggle('hidden',!scVisitor||open);
  fitSc();
}
const ico=k=>`<svg viewBox="0 0 24 24">${ICONS[k].svg.replace(/currentColor/g,ICONS[k].color)}</svg>`;
function buildSharePanel(){
  const ph='<svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  $('scPanel').innerHTML=`<div class="sch"><h4 id="scStatus">${SC_T}</h4><button id="scMin" type="button" aria-label="Minimize"><svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg></button></div>
  <div class="scg">
  <label class="scf1"><span class="sci">Aa</span><input id="scName" type="text" placeholder="Name" maxlength="80" autocomplete="name"></label>
  <label class="scf1">${ico('instagram')}<input id="scIg" type="text" placeholder="@instagram" maxlength="80" autocapitalize="off"></label>
  <label class="scf1">${ico('facebook')}<input id="scFb" type="text" placeholder="Facebook" maxlength="200" autocapitalize="off"></label>
  <label class="scf1">${ph}<input id="scPh" type="tel" placeholder="Phone" maxlength="30"></label>
  <label class="scf1">${ico('website')}<input id="scLk" type="text" placeholder="Link" maxlength="300" autocapitalize="off"></label>
  <button class="btn" id="scSend" type="button">Send</button>
  </div>`;
  $('scMin').onclick=()=>setSc(false);
  $('scSend').onclick=async()=>{
    const v=id=>$(id).value.trim(),st=$('scStatus');
    if(!v('scName')){st.textContent='Please enter your name.';return}
    const k='sc_'+currentCardUid;
    if(Date.now()-(+localStorage.getItem(k)||0)<60000){st.textContent='Already sent. Try again in a minute.';return}
    st.textContent='Sending...';
    const{data,error}=await supabaseClient.rpc('share_contact',{p_card_uid:currentCardUid,p_name:v('scName'),p_instagram:v('scIg'),p_facebook:v('scFb'),p_phone:v('scPh'),p_link:v('scLk')});
    if(error||data!==true){st.textContent='Could not send. Try again later.';return}
    localStorage.setItem(k,Date.now());st.textContent='Sent! The owner will see it.';setTimeout(()=>setSc(false),1800);
    ['scName','scIg','scFb','scPh','scLk'].forEach(id=>$(id).value='');
  };
}

