/* js/render.js
   Draws the profile page, and the visitor notes.
   (Part of LYNQ 2027. See README.md, 'Where to change what'.) */
/* ---------- render ---------- */
function render(){
  const t=getTheme(),R=document.documentElement.style;
  R.setProperty('--bg',t.bg);R.setProperty('--card-bg',t.card.replace(/rgba\(([^)]*),\s*[\d.]+\)/,'rgba($1,.97)'));R.setProperty('--text',t.text);R.setProperty('--sub',t.sub);
  R.setProperty('--accent',t.accent);R.setProperty('--border',t.border);R.setProperty('--ovop',state.coverOpacity??.55);
  R.setProperty('--wave',`linear-gradient(90deg,${[...t.wave,t.wave[0]].join(',')})`);
  R.setProperty('--pat',t.pat||'none');document.documentElement.dataset.theme=state.themeKey||'clean-light';

  const cv=$('coverEl'),B=t.brand,brandCover=!state.cover&&B&&B.cover;
  cv.style.backgroundImage=state.cover?`url(${state.cover})`:(brandCover?`url("${B.cover}")`:t.cover);
  cv.style.backgroundSize=brandCover&&!B.full?'auto 100px':'cover';cv.style.backgroundRepeat='no-repeat';cv.style.backgroundPosition=brandCover&&!B.full?'center 30px':'center';cv.style.height=brandCover?'250px':'';
  cv.style.backgroundColor=brandCover?(B.coverBg||'#fff'):'';cv.querySelector('.ov').style.display=(brandCover||!state.cover)?'none':'';
  if(brandCover){const im=new Image();im.onerror=()=>{cv.style.backgroundImage=t.cover;cv.style.backgroundSize='cover';cv.style.backgroundPosition='center';cv.style.backgroundColor='';cv.style.height='';cv.querySelector('.ov').style.display=''};im.src=B.cover}
  const bb=$('brandBadge');bb.onerror=()=>bb.classList.add('hidden');bb.classList.toggle('hidden',!(B&&B.logo));if(B&&B.logo)bb.src=B.logo;
  const dc=$('decoEl');dc.classList.toggle('hidden',!(B&&B.deco));if(B&&B.deco)dc.src=B.deco;
  $('mainCardEl').classList.add('solo');
  $('customBox').classList.toggle('hidden',state.themeKey!=='custom');
  $('customModeSel').value=(state.custom||{}).mode||'light';$('customClr').value=(state.custom||{}).accent||'#D6248F';

  const ai=$('avatarImg');
  if(state.avatar){ai.src=state.avatar;ai.style.display='block';$('avatarInitials').textContent=''}
  else{ai.style.display='none';$('avatarInitials').textContent=initials()}
  $('nameEl').textContent=state.name;$('bioEl').textContent=state.bio;$('nameEl').dataset.v=curVerified;$('nameEl').title=curVerified?'Verified LYNQ '+curVerified:'';
  $('tapPill').classList.toggle('hidden',state.showTaps===false);$('mainCardEl').classList.toggle('no-taps',state.showTaps===false);$('showTapsSw').checked=state.showTaps!==false;
  $('tapText').innerHTML=`${tapCount}<span class="tl"> tap${tapCount===1?'':'s'}</span>`;

  const ms=state.educationMilestones||[];ms.sort((a,b)=>(EDU_RANKS[b.level]||0)-(EDU_RANKS[a.level]||0));
  const eb=$('eduRoadmapBox');
  if(ms.length){
    eb.classList.remove('hidden');const h=ms[0];
    $('eduRoadmapSummary').textContent=`${h.level}: ${h.school} (${h.program||h.year||''})`;
    $('timelineListEl').innerHTML=ms.map(m=>{
      const ach=m.achievements?m.achievements.split(',').map(a=>`<li>${esc(a.trim())}</li>`).join(''):'';
      return `<div class="timeline-item"><div class="timeline-level">${esc(m.level)}</div><div class="timeline-school">${esc(m.school)}</div><div class="timeline-subinfo">${esc([m.program,m.year].filter(Boolean).join(' • '))}</div>${ach?`<ul class="timeline-achievements">${ach}</ul>`:''}</div>`}).join('');
  }else eb.classList.add('hidden');
  $('educationList').innerHTML=ms.map((m,i)=>`<div class="worklistitem"><span><b>${esc(m.level)}</b>: ${esc(m.school)} — ${esc(m.program||'')} (${esc(m.year||'')})</span><span class="rm" data-i="${i}">×</span></div>`).join('');
  $('educationList').querySelectorAll('.rm').forEach(el=>el.onclick=()=>{state.educationMilestones.splice(+el.dataset.i,1);render()});

  const chips=(label,str)=>{const a=(str||'').split(',').map(s=>s.trim()).filter(Boolean);return a.length?`<div class="extra-group"><span class="extra-label">${label}</span><div class="chips-flex">${a.map(x=>`<div class="chip-bubble">${esc(x)}</div>`).join('')}</div></div>`:''};
  const ex=chips('Languages:',state.languages)+chips('Hobbies:',state.hobbies);
  $('extraTagsContainer').innerHTML=ex?`<div class="extra-section-container">${ex}</div>`:'';
  $('bizEl').innerHTML=bizHTML();
  {const mt=[['a profile photo',!!state.avatar,20],['your name',!!state.name&&state.name!=='Your Name',15],['a short bio',!!state.bio&&state.bio!==DEFAULT_STATE.bio,15],['a phone or email',!!(state.phone||state.email),15],['at least one link',(state.links||[]).length>0,20],['a cover photo',!!state.cover,10],['your location',!!state.workCityCountry,5]];
   const pct=mt.reduce((a,r)=>a+(r[1]?r[2]:0),0),nx=mt.find(r=>!r[1]);
   $('meter').innerHTML=`<div class="mt-top"><b>Your profile is ${pct}% complete</b><span>${nx?'Next: add '+nx[0]:'Complete. Go share it!'}</span></div><div class="mt-bar"><i style="width:${pct}%"></i></div>`}
  {const o=BZ(),on=!!(o.on&&o.open);$('openWrap').innerHTML=on?'<span class="opill"><i></i>'+esc(o.label||'Open to work')+'</span>':'';$('avatarContainer').classList.toggle('open',on)}

  let ch='';
  if(state.phone||state.email)ch+=`<button class="contact-btn" id="saveContactBtn" data-trk="save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg> Save</button>`;
  if(state.phone)ch+=`<a class="contact-btn" data-trk="call" href="tel:${esc(state.phone)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Call</a>`;
  if(state.email)ch+=`<a class="contact-btn" data-trk="email" href="mailto:${esc(state.email)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg> Email</a>`;
  if(state.qrImage)ch+=`<a class="contact-btn" id="openQrModalBtn" data-trk="qr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3z"/><path d="M17 17h4v4h-4z"/></svg> ${esc(state.qrName||'QR')}</a>`;
  $('contactRow').innerHTML=ch;
  if($('saveContactBtn'))$('saveContactBtn').onclick=downloadVCard;
  if($('openQrModalBtn'))$('openQrModalBtn').onclick=()=>{$('modalQrTitle').textContent=state.qrName||'Payment QR';$('modalQrImg').src=state.qrImage;$('qrModal').classList.add('open')};

  const wl=$('workLocationEl');
  if(state.workCityCountry){wl.textContent=state.workCityCountry;wl.classList.remove('hidden')}else{wl.classList.add('hidden');wl.textContent=''}
  $('openGalleryBtn').classList.add('hidden');
  $('galT').classList.toggle('hidden',!BZ().on);document.querySelector('.tiles').classList.toggle('hidden',!BZ().on);

  const work=state.work||[];
  $('workEl').innerHTML=work.map(w=>`<div class="workrow"><b>${esc(w.role)}</b>${w.company?' — '+esc(w.company):''}${w.duration?` <span class="dur">(${esc(w.duration)})</span>`:''}</div>`).join('');
  $('workList').innerHTML=work.map((w,i)=>`<div class="worklistitem"><span>${esc(w.role)}${w.company?' — '+esc(w.company):''}${w.duration?' ('+esc(w.duration)+')':''}</span><span class="rm" data-i="${i}">×</span></div>`).join('');
  $('workList').querySelectorAll('.rm').forEach(el=>el.onclick=()=>{state.work.splice(+el.dataset.i,1);render()});

  const le=$('linksEl');le.className='links '+(state.layoutStyle==='grid'?'grid-layout':'list-layout');le.innerHTML='';
  const is=state.iconStyle||'brand';
  state.links.forEach((l,i)=>{
    const meta=ICONS[l.platform]||ICONS.website,row=document.createElement(editing?'div':'a');row.className='linkbtn';row.dataset.trk=l.platform;
    if(!editing){row.href=safeUrl(l.url);row.target='_blank';row.rel='noopener'}
    const col=is==='match'?t.accent:meta.color;
    const svg=meta.svg.replace(/fill="currentColor"/g,`fill="${col}"`).replace(/stroke="currentColor"/g,`stroke="${col}"`);
    row.innerHTML=`${(l.platform==='website'&&l.logo)?`<img class="lgo" src="${l.logo}" alt="">`:`<svg viewBox="0 0 24 24">${svg}</svg>`}<span>${esc((l.platform==='website'&&l.customName)?l.customName:meta.label)}</span>`;
    if(editing){if(l.platform==='website'){const lb=document.createElement('span');lb.className='lgbtn';lb.textContent=l.logo?'Change logo':'Add logo';lb.onclick=()=>logoPick(u=>{l.logo=u;render()});row.appendChild(lb)}const rm=document.createElement('span');rm.className='rm';rm.textContent='×';rm.onclick=()=>{state.links.splice(i,1);render()};row.appendChild(rm)}
    le.appendChild(row);
  });

  $('nameEl').contentEditable=editing;$('bioEl').contentEditable=editing;
  $('editPanel').classList.toggle('hidden',!editing);document.body.classList.toggle('editing',editing);
  $('edAvPrev').style.backgroundImage=state.avatar?`url(${state.avatar})`:'';$('avRm').hidden=!state.avatar;$('cvRm').hidden=!state.cover;
  $('edCvPrev').style.backgroundImage=state.cover?`url(${state.cover})`:t.cover;
  [0,1,2].forEach(i=>{const el=$('tile'+(i+1)),ph=(state.photos||[])[i];el.style.backgroundImage=ph?`url(${ph})`:'';el.classList.toggle('has',!!ph)});
  document.querySelectorAll('.sw').forEach(e=>e.classList.toggle('on',e.dataset.k===(state.themeKey||'clean-light')));
  $('opRange').value=Math.round((state.coverOpacity??.55)*100);
  $('layoutStyleSel').value=state.layoutStyle||'list';$('iconStyleSel').value=state.iconStyle||'brand';
  document.querySelectorAll('.seg').forEach(g=>{const v=$(g.dataset.for).value;g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===v))});
  [['workCityCountry','workCityCountry'],['languagesInput','languages'],['hobbiesInput','hobbies'],['phoneInput','phone'],['emailInput','email'],['qrNameInput','qrName']].forEach(([id,k])=>{if(document.activeElement!==$(id))$(id).value=state[k]||''});
  const bz2=BZ();$('bizOn').checked=!!bz2.on;$('bizOpen').checked=!!bz2.open;$('bizOpenLabel').value=bz2.label||'Open to work';$('bizBtn').value=bz2.btn||'Book now';
  if(document.activeElement!==$('bizBook'))$('bizBook').value=bz2.book||'';if(document.activeElement!==$('bizMsg'))$('bizMsg').value=bz2.msg||'';
  $('bizList').innerHTML=bz2.items.map((it,i)=>`<div class="worklistitem"><span>${esc(it.name)}${it.price?' — '+esc(it.price):''}</span><span class="rm" data-i="${i}">×</span></div>`).join('');
  $('bizList').querySelectorAll('.rm').forEach(el=>el.onclick=()=>{BZ().items.splice(+el.dataset.i,1);render()});
  refreshHandleUI();
  hideLoader();
}
function populatePlatforms(){$('platformSel').innerHTML=Object.entries(ICONS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('');toggleCustomLabel()}

/* ---------- notes ---------- */
async function deleteNote(id){const{error}=await supabaseClient.from('card_notes').delete().eq('id',id);if(!error)fetchInboxNotes()}
async function deleteShared(id){const{error}=await supabaseClient.from('shared_contacts').delete().eq('id',id);if(!error)fetchInboxNotes()}
function inboxTab(t){
  $('tabNotes').classList.toggle('on',t==='notes');$('tabContacts').classList.toggle('on',t==='contacts');
  $('notesListContainer').classList.toggle('hidden',t!=='notes');$('contactsListContainer').classList.toggle('hidden',t!=='contacts');
}
async function fetchInboxNotes(){
  if(!currentCardUid)return;
  const[n,c]=await Promise.all([
    supabaseClient.from('card_notes').select('*').eq('card_uid',currentCardUid).order('created_at',{ascending:false}),
    supabaseClient.from('shared_contacts').select('*').eq('card_uid',currentCardUid).order('created_at',{ascending:false})]);
  const notes=n.data||[],cons=c.data||[];
  $('inboxCount').textContent=notes.length+cons.length;
  $('tabNotes').textContent=`Visitor notes (${notes.length})`;$('tabContacts').textContent=`Shared contacts (${cons.length})`;
  $('notesListContainer').innerHTML=notes.length?notes.map(n=>`<div class="note-item"><b>${esc(n.visitor_email||'Anonymous')}</b><span class="del-note" onclick="deleteNote('${esc(n.id)}')">Delete</span><div style="font-size:14px;color:var(--text);margin-top:2px">${esc(n.message)}</div><div style="font-size:11px;color:var(--sub);margin-top:2px">${new Date(n.created_at).toLocaleString()}</div></div>`).join(''):'No notes yet.';
  const row=(lab,txt,href)=>txt?`<div style="font-size:13px;margin-top:3px"><span style="color:var(--sub)">${lab}</span> ${href?`<a href="${esc(href)}" target="_blank" rel="noopener" style="color:var(--accent)">${esc(txt)}</a>`:esc(txt)}</div>`:'';
  $('contactsListContainer').innerHTML=cons.length?cons.map(x=>{
    const ig=(x.instagram||'').replace(/^@/,''),fb=x.facebook||'';
    return `<div class="note-item"><b style="color:var(--text)">${esc(x.name)}</b><span class="del-note" onclick="deleteShared('${esc(x.id)}')">Delete</span>${row('Instagram',ig&&'@'+ig,ig&&'https://instagram.com/'+encodeURIComponent(ig))}${row('Facebook',fb,fb&&(/^https?:/i.test(fb)?fb:'https://facebook.com/'+encodeURIComponent(fb)))}${row('Phone',x.phone,x.phone&&'tel:'+x.phone)}${row('Link',x.link,x.link&&safeUrl(x.link))}<div style="font-size:11px;color:var(--sub);margin-top:3px">${new Date(x.created_at).toLocaleString()}</div></div>`}).join(''):'No shared contacts yet.';
}

