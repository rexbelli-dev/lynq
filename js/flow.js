/* js/flow.js
   Dark screens: claim, success, setup wizard.
   (Part of LYNQ 2027. See README.md, 'Where to change what'.) */
/* ---------- dark flow: coded card, claim, success, setup ---------- */
const CHAIN='<svg viewBox="0 0 24 24" fill="none" stroke="url(#chainG)" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
const CARD_HTML=`<div class="flogo" id="lcard"><i class="wm" role="img" aria-label="LYNQ"></i></div>`;
function cycleCard(){}
function flowShow(html){
  hideLoader();const f=$('flow'),b=$('flowBody');f.classList.add('open');b.innerHTML=html;f.scrollTop=0;
  b.classList.remove('enter');void b.offsetWidth;b.classList.add('enter');cycleCard();
}
const flowClose=()=>$('flow').classList.remove('open');
const infoScreen=(t,s)=>flowShow(`${CARD_HTML}<h2>${t}</h2><p>${s}</p>`);
function claimScreen(uid){
  flowShow(`${CARD_HTML}<h2>${T('claimT')}</h2><p>${T('claimP')}</p>
  <div class="gpanel"><div class="gstep"><b>1</b><div><strong>${T('s1t')}</strong><span>${T('s1d')}</span></div></div>
  <div class="gstep"><b>2</b><div><strong>${T('s2t')}</strong><span>${T('s2d')}</span></div></div></div>
  <button class="gbtn white" id="claimGoogleBtn"><svg viewBox="0 0 24 24" style="width:18px;height:18px"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.2v3.15C3.17 21.32 7.28 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.2C.44 8.12 0 9.87 0 11.7s.44 3.58 1.2 5.12l4.08-2.55z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.28 0 3.17 2.68 1.2 6.58l4.08 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>${T('google')}</button>
  <p class="fine">${T('fine')}</p>
  <p class="fine">${LANGROW}</p>`);
  document.querySelectorAll('[data-lang]').forEach(a=>a.onclick=e=>{e.preventDefault();LANG=a.dataset.lang;localStorage.setItem('lynq_lang',LANG);claimScreen(uid)});
  $('claimGoogleBtn').onclick=async()=>{
    if(!termsOk())return openLegal('terms',true);
    sessionStorage.setItem('pending_lynq_card',uid);
    supabaseClient.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname+'?card='+uid}});
  };
}
function successScreen(inh){
  flowShow(`<div class="bigcheck"><svg viewBox="0 0 52 52"><circle class="cc" cx="26" cy="26" r="24"/><path class="ck" d="M15 27l8 8 14-16"/></svg></div>
  <h2>${inh?'Card added':'Claimed successfully'}</h2><p>${inh?'This card now shows your existing profile.':'Your LYNQ card is now linked to your account.'}</p>
  <button class="gbtn primary" id="editYourCard" style="margin-top:10px">${inh?'View my profile':'Edit your card'}</button>`);
  $('editYourCard').onclick=inh?()=>{flowClose();scrollTo(0,0)}:()=>wiz(0);
}
const HINTS={
 instagram:'Open Instagram, go to your profile, tap Share profile, then Copy link.',
 facebook:'Open your Facebook profile, tap the three dots (⋯), then Copy link to profile.',
 whatsapp:'Use https://wa.me/ followed by your number with country code, no + or spaces. Example: https://wa.me/639123456789',
 messenger:'Use https://m.me/ followed by your Facebook username. Example: https://m.me/yourname',
 viber:'Open Viber, go to your profile, and copy your profile link to paste here.',
 telegram:'Use https://t.me/ followed by your Telegram username. Example: https://t.me/yourname',
 twitter:'Open your profile on X, tap the share icon, then Copy link.',
 tiktok:'Open your TikTok profile, tap the share icon, then Copy link.',
 youtube:'Open your YouTube channel, tap More (⋯), then Share and Copy link.',
 linkedin:'Open your LinkedIn profile, tap More (⋯), then copy your profile link.',
 website:'Open your website in a browser and copy the address from the top bar. You can add your logo below.',
 github:'Use https://github.com/ followed by your username. Example: https://github.com/yourname'
};
const THEME_SW=[['clean-light','Clean Light','#D6248F'],['black-gray','Black & Gray','linear-gradient(135deg,#242424,#0d0d0d)'],['white-pink','White & Pink','linear-gradient(135deg,#ff80bf,#ffb3d9)'],['white-black','White & Black','linear-gradient(135deg,#334155,#0f172a)'],['lgbt-pride','Pride','linear-gradient(90deg,red,orange,yellow,green,blue,purple)'],['midnight-blue','Midnight','linear-gradient(135deg,#1e40af,#1e1b4b)'],['emerald-dark','Emerald','linear-gradient(135deg,#047857,#064e3b)'],['sunset-amber','Sunset','linear-gradient(135deg,#d97706,#b45309)'],['recon-tech','ReconTech','linear-gradient(135deg,#fff,#1f6b34)'],['davao','Davao','linear-gradient(135deg,#fff,#1b7f3b 60%,#d81b8a)'],['zap-it','Zap it','linear-gradient(135deg,#fff,#1d6fe8)'],['custom','Custom','conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)']];
const WS=[
 {k:'theme',t:'Choose your theme',s:'Pick a look for your profile. You can change it any time.'},
 {k:'avatar',t:'Add your profile photo',s:'Choose a photo, then drag and pinch to fit it.'},
 {k:'cover',t:'Add a cover photo',s:'It sits behind your profile. Drag and pinch to frame it.'},
 {k:'name',t:"What's your name?",s:'This is the name people see first.'},
 {k:'bio',t:'Write a short bio',s:'One or two lines about you or your work.'},
 {k:'contact',t:'How can people reach you?',s:'Add a phone, email and where you work. All optional.'},
 {k:'link',t:'Add your first link',s:'Instagram, Facebook, WhatsApp or any website.'}
];
function wiz(i){
  if(i>=WS.length)return wizDone();
  const w=WS[i],k=w.k,isImg=k==='avatar'||k==='cover';let b='';
  if(k==='avatar')b=`<div class="pv" id="pv">${state.avatar?`<img src="${state.avatar}" alt="">`:`<span>${esc(initials())}</span>`}</div>`;
  if(k==='cover')b=`<div class="pv cv" id="pv">${state.cover?`<img src="${state.cover}" alt="">`:'Tap to choose'}</div>`;
  if(k==='theme')b=`<div class="wprev" id="wPrev"></div><div class="wthemes" id="wThemes"></div><div id="wCustom" class="fgrp hidden"><div class="wdots" id="wDots"></div><div class="wseg"><button data-m="light">Light</button><button data-m="dark">Dark</button></div></div>`;
  if(k==='name')b=`<input class="gfield" id="wName" maxlength="40" placeholder="Your full name" value="${state.name==='Your Name'?'':esc(state.name)}" autocomplete="name">`;
  if(k==='bio')b=`<textarea class="gfield" id="wBio" maxlength="220" placeholder="Tell people who you are...">${state.bio===DEFAULT_STATE.bio?'':esc(state.bio)}</textarea>`;
  if(k==='contact')b=`<input class="gfield" id="wPhone" type="tel" placeholder="Phone e.g. +639123456789" value="${esc(state.phone)}"><input class="gfield" id="wEmail" type="email" placeholder="Email address" value="${esc(state.email)}"><input class="gfield" id="wCity" placeholder="City, Country e.g. Davao City, Philippines" value="${esc(state.workCityCountry)}">`;
  if(k==='link')b=`<div class="fgrp"><select class="gfield sm" id="wPlat">${Object.entries(ICONS).map(([a,v])=>`<option value="${a}">${v.label}</option>`).join('')}</select><input class="gfield sm" id="wUrl" type="url" placeholder="Paste your link here" autocapitalize="off" autocorrect="off"><p class="hint" id="wHint"></p><button class="gbtn sm hidden" id="wLogo" type="button">Add your logo (optional)</button></div>`;
  const label=isImg&&!state[k]?'Choose photo':(i===WS.length-1?'Finish':'Continue');
  flowShow(`<div class="dots">${WS.map((_,j)=>`<i class="${j<=i?'on':''}"></i>`).join('')}</div><h2>${w.t}</h2><p>${w.s}</p>${b}<button class="gbtn primary" id="wNext" style="margin-top:6px">${label}</button><button class="ghost" id="wSkip">Set up later</button>`);
  if(isImg){const again=()=>pick(k,u=>{state[k]=u;wiz(i)});$('pv').onclick=again;
    $('wNext').onclick=()=>{if(!state[k])return again();persist();wiz(i+1)}}
  else $('wNext').onclick=()=>{
    if(k==='name'){const v=$('wName').value.trim();if(v)state.name=v}
    if(k==='bio'){const v=$('wBio').value.trim();if(v)state.bio=v}
    if(k==='contact'){state.phone=$('wPhone').value.trim();state.email=$('wEmail').value.trim();state.workCityCountry=$('wCity').value.trim()}
    if(k==='link'){const u=$('wUrl').value.trim();if(u){const pl=$('wPlat').value;state.links.push({platform:pl,url:u,customName:'',logo:pl==='website'?wizLogo:''})}}
    persist();wiz(i+1)};
  if(k==='theme'){
    const staff=isStaff;
    const list=THEME_SW.concat(staff?[['lynq-team','LYNQ Team','linear-gradient(135deg,#F4ECE1 50%,#D6248F 50%)']]:[]);
    const mark=()=>{
      document.querySelectorAll('#wThemes .wsw').forEach(e=>e.classList.toggle('on',e.dataset.k===(state.themeKey||'clean-light')));
      $('wCustom').classList.toggle('hidden',state.themeKey!=='custom');
      const m=(state.custom||{}).mode||'light';document.querySelectorAll('.wseg button').forEach(x=>x.classList.toggle('on',x.dataset.m===m));
      const t=getTheme();
      $('wPrev').innerHTML=`<div style="height:46px;background:${t.cover}"></div><div style="padding:0 12px 12px;background:${t.bg}"><div style="width:34px;height:34px;border-radius:50%;background:${t.accent};margin-top:-17px;border:3px solid ${t.bg}"></div><div style="font-weight:700;font-size:13px;color:${t.text};margin-top:6px">Your Name</div><div style="font-size:11px;color:${t.sub}">Your bio goes here</div><div style="margin-top:8px;height:26px;border-radius:9px;background:${t.accent}"></div></div>`;
    };
    $('wThemes').innerHTML=list.map(([k2,n,bg])=>`<div class="wsw" data-k="${k2}"><i style="background:${bg}"></i>${n}</div>`).join('');
    $('wDots').innerHTML=['#D6248F','#2563eb','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#111827'].map(c=>`<i data-c="${c}" style="background:${c}"></i>`).join('');
    $('wThemes').onclick=e=>{const t=e.target.closest('.wsw');if(!t)return;state.themeKey=t.dataset.k;
      if(t.dataset.k==='custom')state.custom={accent:'#D6248F',mode:'light',...(state.custom||{})};
      localStorage.setItem('lynq_theme_key',state.themeKey);mark()};
    $('wDots').onclick=e=>{const c=e.target.dataset.c;if(c){state.custom={mode:'light',...(state.custom||{}),accent:c};mark()}};
    document.querySelectorAll('.wseg button').forEach(x=>x.onclick=()=>{state.custom={accent:'#D6248F',...(state.custom||{}),mode:x.dataset.m};mark()});
    mark();
  }
  $('wSkip').onclick=()=>wiz(i+1);
  const wp=$('wPlat');if(wp){const hint=()=>{$('wHint').textContent=HINTS[wp.value]||'';$('wLogo').classList.toggle('hidden',wp.value!=='website')};wizLogo='';hint();$('wLogo').onclick=()=>logoPick(u=>{wizLogo=u;$('wLogo').textContent='Logo added ✓  Tap to change'});wp.onchange=()=>{const u=$('wUrl');if(wp.value==='whatsapp')u.value='https://wa.me/';else if(u.value==='https://wa.me/')u.value='';hint()}}
}
async function wizDone(){
  await persist();
  flowShow(`<div class="bigcheck"><svg viewBox="0 0 52 52"><circle class="cc" cx="26" cy="26" r="24"/><path class="ck" d="M15 27l8 8 14-16"/></svg></div><h2>You're all set</h2><p>Your profile is live. You can change anything later with Edit Profile.</p><a class="gbtn" href="${COMMUNITY_URL}" target="_blank" rel="noopener" style="text-decoration:none;margin-top:10px">Join the LYNQ community</a><button class="gbtn primary" id="wView" style="margin-top:4px">View my profile</button>`);
  $('wView').onclick=()=>{flowClose();render();scrollTo(0,0)};
}

