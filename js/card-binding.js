/* js/card-binding.js
   What happens when a card is tapped (the brain of the page).
   (Part of LYNQ 2027. See README.md, 'Where to change what'.) */
/* ---------- card binding ---------- */
function setOwnerUI(){
  document.body.classList.add('is-owner');isOwner=true;$('editFab').classList.remove('hidden');$('inboxFab').classList.remove('hidden');
  $('visitorNoteSection').classList.add('hidden');$('authPromptBtn').classList.add('hidden');
  $('switchAccountBtn').classList.remove('hidden');fetchInboxNotes();
}
async function handleNfcCardBinding(){
  let uid=new URLSearchParams(location.search).get('card');
  let{data:{session}}=await supabaseClient.auth.getSession();
  if(session){try{const{error:ue2}=await supabaseClient.auth.getUser();
    if(ue2&&(ue2.status===401||ue2.status===403||ue2.status===404||/not exist|sub claim|invalid jwt/i.test(ue2.message||''))){await supabaseClient.auth.signOut({scope:'local'});session=null}}catch(_e){}}
  if(session){try{isStaff=(await supabaseClient.rpc('is_staff')).data===true}catch(_e){}}
  if(!uid){const h=new URLSearchParams(location.search).get('u');
    if(h){const r=await supabaseClient.rpc('card_for_handle',{p_handle:h});
      if(r.data)try{localStorage.setItem('lynq_h_'+h.toLowerCase(),r.data)}catch(_e){}
      uid=r.data||(r.error?localStorage.getItem('lynq_h_'+h.toLowerCase()):null);
      if(!uid){infoScreen('Profile not found','Please check the link and try again.');return}}}
  if(!uid)uid=sessionStorage.getItem('pending_lynq_card');
  if(!uid){if(session)homePicker(session);else homeSignIn();return}
  currentCardUid=uid;curSession=session;
  if(isStaff)$('swTeam').classList.remove('hidden');
  let{data:rec,error}=await supabaseClient.rpc('get_card',{p_uid:uid});
  if(rec&&!error){try{localStorage.setItem('lynq_card_'+uid,JSON.stringify(rec))}catch(_e){}}
  else{const c=localStorage.getItem('lynq_card_'+uid);if(c&&(error||!navigator.onLine)){try{rec=JSON.parse(c);error=null;offline=true}catch(_e){}}}
  if(error||!rec){infoScreen('Card not found','Please check your LYNQ card link and try again.');return}
  curVerified=rec.verified||'';curHandle=rec.handle||'';curRef=rec.ref||'';
  if(rec.disabled&&!(session&&rec.user_id===session.user.id)&&!isStaff){infoScreen('Card disabled','The owner has turned off this LYNQ card.');return}
  if(!rec.user_id&&!session){claimScreen(uid);if(!termsOk())openLegal('terms',true);return}

  if(rec.bio&&rec.user_id){
    try{const p=JSON.parse(rec.bio);if(p&&typeof p==='object')state={...DEFAULT_STATE,...p}}
    catch(_e){state.bio=rec.bio;if(rec.card_title)state.name=rec.card_title}
  }
  if(session){
    if(rec.user_id===session.user.id)setOwnerUI();
    else if(!rec.user_id){
      hideLoader();await askTerms();
      await checkAccount();
      const intended=sessionStorage.getItem('pending_lynq_card')===uid;   // they just pressed "Continue with Google" for this card
      if(myCount>0||!intended){
        if(!await confirmClaim(uid)){location.href=location.pathname+(myUid?'?card='+encodeURIComponent(myUid):'');return}
      }
      sessionStorage.removeItem('pending_lynq_card');
      const res=(await supabaseClient.rpc('claim_card',{p_uid:uid})).data;
      if(res==='taken'){await lynqAlert('This card was just claimed by someone else.','Card already claimed');location.reload();return}
      if(res==='ok'){
        let{data:pr}=await supabaseClient.from('profiles').select('*').eq('user_id',session.user.id).maybeSingle();
        if(!(pr&&pr.bio)){
          const{data:old}=await supabaseClient.from('nfc_cards').select('bio,card_title').eq('user_id',session.user.id).not('bio','is',null).limit(1);
          if(old&&old[0]){pr={bio:old[0].bio,card_title:old[0].card_title};await supabaseClient.from('profiles').upsert({user_id:session.user.id,bio:pr.bio,card_title:pr.card_title})}
        }
        let inherited=false;
        if(pr&&pr.bio){try{const p=JSON.parse(pr.bio);if(p&&typeof p==='object'){state={...DEFAULT_STATE,...p};inherited=true}}catch(_e){}}
        setOwnerUI();justClaimed=true;window._inherited=inherited;
      }
    }
  }else{
    $('authPromptBtn').classList.remove('hidden');
    $('signInLink').onclick=e=>{e.preventDefault();
      if(!termsOk())return openLegal('terms',true);
      sessionStorage.setItem('pending_lynq_card',uid);
      supabaseClient.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname+'?card='+uid}})};
  }

  if(curSession){
    const known=await checkAccount();
    if(known&&!hasAccount&&!isOwner&&rec.user_id){
      hideLoader();
      await lynqAlert('No existing LYNQ account was found for this Google account. Please get your own LYNQ card first.','No LYNQ account yet');
      await supabaseClient.rpc('delete_my_account');
      await supabaseClient.auth.signOut({scope:'local'});
      sessionStorage.clear();location.reload();return;
    }
  }

  /* tap counter: counts visitors only, once per browser session */
  tapCount=+rec.tap_count||0;
  if(!isOwner&&!isStaff&&!offline&&!new URLSearchParams(location.search).get('nt')&&!sessionStorage.getItem('tap_'+uid)){
    sessionStorage.setItem('tap_'+uid,'1');
    try{const{data,error:te}=await supabaseClient.rpc('increment_tap',{p_uid:uid});if(te)console.warn('LYNQ tap counter:',te.message);else if(typeof data==='number')tapCount=data;else tapCount+=1}catch(e){console.warn('LYNQ tap counter:',e)}
  }
  render();
  if(isOwner)lastPaths=pathsOf(state);
  if(offline)$('offBar').classList.remove('hidden');
  $('menuBtn').classList.remove('hidden');scVisitor=!isOwner;setSc(!sessionStorage.getItem('sc_min'));buildMenu();
  if(justClaimed)successScreen(window._inherited);
}

async function init(){
  populatePlatforms();
  $('clrDots').innerHTML=['#D6248F','#2563eb','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#111827'].map(c=>`<i data-c="${c}" style="background:${c}"></i>`).join('');
  $('clrDots').onclick=e=>{const c=e.target.dataset.c;if(c)setCustom({accent:c})};
  $('customClr').addEventListener('input',e=>setCustom({accent:e.target.value}));
  $('customModeSel').addEventListener('change',e=>setCustom({mode:e.target.value}));
  buildSharePanel();
  document.querySelectorAll('.tile').forEach((t,i)=>{const x=document.createElement('span');x.className='tx';x.dataset.i=i;x.textContent='×';t.appendChild(x)});
  document.querySelector('.tiles').addEventListener('click',e=>{const x=e.target.closest('.tx');if(!x)return;e.preventDefault();e.stopPropagation();state.photos[+x.dataset.i]='';render()},true);
  $('avRm').onclick=()=>{state.avatar='';render()};$('cvRm').onclick=()=>{state.cover='';render()};
  const pops=()=>{$('menuPanel').classList.add('hidden')};
  $('menuBtn').onclick=e=>{e.stopPropagation();const o=$('menuPanel').classList.contains('hidden');pops();if(o){buildMenu();$('menuPanel').classList.remove('hidden')}};
  $('scBtn').onclick=e=>{e.stopPropagation();pops();setSc(true)};
  addEventListener('resize',fitSc);
  document.addEventListener('click',e=>{if(!e.target.closest('.pop'))pops()});
  $('mContacts').onclick=()=>{pops();openContacts()};
  $('goMineBtn').onclick=$('mGoMine').onclick=()=>{pops();if(myUid)location.href=location.pathname+'?card='+encodeURIComponent(myUid)};
  $('mSaveThis').onclick=()=>{pops();saveLynqContact(true)};
  $('mSignIn').onclick=()=>{pops();const a=$('signInLink');if(a)a.click()};
  $('mDelProfile').onclick=()=>{pops();deleteMyProfile()};
  $('mDelAccount').onclick=()=>{pops();deleteMyAccount()};
  $('mCards').onclick=()=>{pops();openMyCards()};$('mStats').onclick=()=>{pops();openStats()};
  $('mInstall').onclick=()=>{pops();installApp()};$('mAdmin').onclick=()=>{location.href='admin.html'};
  $('saveHandleBtn').onclick=saveHandle;
  $('copyHandleBtn').onclick=async()=>{try{await navigator.clipboard.writeText(shareUrl());lynqAlert('Link copied.','Done')}catch(_e){}};
  $('bizOn').addEventListener('change',e=>{BZ().on=e.target.checked;render()});
  $('bizOpen').addEventListener('change',e=>{BZ().open=e.target.checked;render()});
  $('bizOpenLabel').addEventListener('change',e=>{BZ().label=e.target.value;render()});
  $('bizBtn').addEventListener('change',e=>{BZ().btn=e.target.value;render()});
  $('bizBook').addEventListener('input',e=>{BZ().book=e.target.value;render()});
  $('bizMsg').addEventListener('input',e=>{BZ().msg=e.target.value;render()});
  $('bizPhotoFile').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)compressImage(f,360,.6,u=>{bizPhoto=u;$('bizPhotoTxt').textContent='Photo added'})});
  $('addBizBtn').addEventListener('click',()=>{
    const n=$('bizName').value.trim();if(!n)return;const b=BZ();
    if(b.items.length>=12){lynqAlert('You can add up to 12 items.','Limit reached');return}
    b.items.push({name:n,price:$('bizPrice').value.trim(),desc:$('bizDesc').value.trim(),photo:bizPhoto});
    bizPhoto='';['bizName','bizPrice','bizDesc'].forEach(id=>$(id).value='');$('bizPhotoTxt').textContent='Add photo';render();
  });
  document.addEventListener('click',e=>{const im=e.target.closest('[data-gi]');if(im){galShow(+im.dataset.gi,false);$('galleryModal').classList.add('open')}});
  document.addEventListener('click',e=>{const a=e.target.closest('[data-trk]');if(a&&!isOwner&&!isStaff&&!offline&&currentCardUid)supabaseClient.rpc('track_click',{p_uid:currentCardUid,p_key:a.dataset.trk})});
  $('tabNotes').onclick=()=>inboxTab('notes');$('tabContacts').onclick=()=>inboxTab('contacts');
  await handleNfcCardBinding().catch(()=>infoScreen('Please tap your LYNQ card','Or paste your LYNQ portfolio exact URL.'));

  $('eduRoadmapToggle').addEventListener('click',()=>$('eduRoadmapBox').classList.toggle('open'));
  $('shareBtn').addEventListener('click',async()=>{
    const d={title:state.name?`${state.name}'s LYNQ Profile`:'LYNQ Profile',text:`Check out ${state.name||'this'} digital portfolio card!`,url:shareUrl()};
    try{if(navigator.share)await navigator.share(d);else{await navigator.clipboard.writeText(shareUrl());lynqAlert('Profile link copied to clipboard!')}}catch(_e){}
  });
  const modal=(openId,modalId,closeId)=>{
    if(openId)$(openId).addEventListener('click',()=>$(modalId).classList.add('open'));
    $(closeId).addEventListener('click',()=>$(modalId).classList.remove('open'));
    $(modalId).addEventListener('click',e=>{if(e.target.id===modalId)$(modalId).classList.remove('open')});
  };
  modal('infoBtn','infoModal','closeInfoBtn');modal(null,'qrModal','closeQrBtn');modal(null,'galleryModal','closeGalleryBtn');modal(null,'contactsModal','closeContactsBtn');modal(null,'cardsModal','closeCardsBtn');modal(null,'notifModal','closeNotifBtn');modal(null,'qrpModal','closeQrpBtn');modal(null,'reportModal','closeReportBtn');modal(null,'statsModal','closeStatsBtn');
  $('openGalleryBtn').addEventListener('click',()=>{galShow(0,false);$('galleryModal').classList.add('open')});
  $('galPrev').addEventListener('click',()=>galShow(gi-1,true));
  $('galNext').addEventListener('click',()=>galShow(gi+1,true));
  let sx=null;const st=$('galStage');
  st.addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});
  st.addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>40)galShow(gi+(dx<0?1:-1),true)});

  $('switchAccountBtn').addEventListener('click',async e=>{e.preventDefault();await supabaseClient.auth.signOut();await supabaseClient.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.href}})});
  $('nameEl').addEventListener('input',e=>state.name=e.target.textContent);
  $('bioEl').addEventListener('input',e=>state.bio=e.target.textContent);
  $('opRange').addEventListener('input',e=>{state.coverOpacity=e.target.value/100;render()});
  document.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{const sel=$(b.parentElement.dataset.for);sel.value=b.dataset.v;sel.dispatchEvent(new Event('change'))}));
  $('showTapsSw').addEventListener('change',e=>{state.showTaps=e.target.checked;render()});
  $('layoutStyleSel').addEventListener('change',e=>{state.layoutStyle=e.target.value;render()});
  $('iconStyleSel').addEventListener('change',e=>{state.iconStyle=e.target.value;render()});
  [['workCityCountry','workCityCountry'],['languagesInput','languages'],['hobbiesInput','hobbies'],['phoneInput','phone'],['emailInput','email'],['qrNameInput','qrName']].forEach(([id,k])=>$(id).addEventListener('input',e=>{state[k]=e.target.value;render()}));

  [['photoFile1',0],['photoFile2',1],['photoFile3',2]].forEach(([id,idx])=>$(id).addEventListener('change',e=>{
    const f=e.target.files[0];if(!f)return;
    compressImage(f,600,.7,u=>{state.photos=state.photos||[];state.photos[idx]=u;render()})}));
  $('avatarFile').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)openCropper(f,'avatar',u=>{state.avatar=u;render()})});
  $('coverFile').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)openCropper(f,'cover',u=>{state.cover=u;render()})});
  $('qrFile').addEventListener('change',e=>{const f=e.target.files[0];if(f)compressImage(f,600,.8,u=>{state.qrImage=u;render()})});

  $('toggleNoteBtn').addEventListener('click',()=>{const d=$('noteDrawer');d.classList.toggle('open');$('toggleNoteBtn').textContent=d.classList.contains('open')?'Cancel':'Leave a note'});
  $('addEduBtn').addEventListener('click',()=>{
    const school=$('eduSchoolInput').value.trim();if(!school)return;
    state.educationMilestones=state.educationMilestones||[];
    state.educationMilestones.push({level:$('eduLevelInput').value,school,year:$('eduYearInput').value.trim(),program:$('eduProgramInput').value.trim(),achievements:$('eduAchieveInput').value.trim()});
    ['eduSchoolInput','eduYearInput','eduProgramInput','eduAchieveInput'].forEach(id=>$(id).value='');render();
  });
  $('addWorkBtn').addEventListener('click',()=>{
    const role=$('workRole').value.trim();if(!role)return;
    state.work=state.work||[];state.work.push({role,company:$('workCompany').value.trim(),duration:$('workDuration').value.trim()});
    ['workRole','workCompany','workDuration'].forEach(id=>$(id).value='');render();
  });
  $('addLinkBtn').addEventListener('click',()=>{
    const platform=$('platformSel').value,url=$('linkUrl').value.trim();if(!url)return;
    state.links.push({platform,url,customName:platform==='website'?$('customNameInput').value.trim():'',logo:platform==='website'?pendingLogo:''});pendingLogo='';syncLogoUI();
    $('linkUrl').value=platform==='whatsapp'?'https://wa.me/':'';$('customNameInput').value='';render();
  });
  $('logoFile').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)compressLogo(f,u=>{pendingLogo=u;syncLogoUI()})});
  $('logoRm').addEventListener('click',()=>{pendingLogo='';syncLogoUI()});
  $('doneBtn').addEventListener('click',()=>{editing=false;render()});
  $('saveBtn').addEventListener('click',async()=>{
    const s=$('statusEl');
    if(!isOwner){s.textContent='Only the verified owner can save changes.';return}
    s.textContent='Saving to database...';
    try{if(!(await persist()))throw new Error('Check database string size.');s.textContent='Saved successfully! Changes are now live.'}
    catch(err){s.textContent='Could not save: '+(err?.message||'Check database string size.')}
  });
  $('editFab').addEventListener('click',()=>{editing=!editing;$('inboxPanel').classList.add('hidden');render();maybeTour()});
  $('tcNext').onclick=()=>{if(tourI>=TOUR.length-1)endTour();else showTour(tourI+1)};
  $('tcBack').onclick=()=>{if(tourI>0)showTour(tourI-1)};
  $('tcSkip').onclick=endTour;
  $('mQr').onclick=()=>{pops();openQr()};$('mCommunity').onclick=()=>{pops();window.open(COMMUNITY_URL,'_blank','noopener')};$('mRef').onclick=()=>{pops();showReferral()};
  $('bizTpl').addEventListener('click',e=>{const x=e.target.closest('button[data-t]');if(x)applyBizTpl(x.dataset.t)});
  $('bellBtn').onclick=openNotifs;$('notifReport').onclick=openReport;$('mReport').onclick=()=>{pops();openReport()};$('rpSend').onclick=sendReport;
  $('rpImg').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)compressImage(f,1000,.7,u=>{rpFile=u;$('rpImgTxt').textContent='Image attached'})});
  setInterval(()=>{if(document.visibilityState==='visible')loadNotifs()},60000);
  $('mTour').onclick=()=>{pops();editing=true;$('inboxPanel').classList.add('hidden');render();setTimeout(startTour,300)};
  $('inboxFab').addEventListener('click',()=>{editing=false;render();$('inboxPanel').classList.toggle('hidden');fetchInboxNotes()});
  $('closeInboxBtn').addEventListener('click',()=>$('inboxPanel').classList.add('hidden'));
  $('sendNoteBtn').addEventListener('click',async()=>{
    const msg=$('visitorNoteText').value.trim(),ns=$('noteStatusEl');
    if(!msg){ns.textContent='Please write a message first.';return}
    ns.textContent='Sending note...';
    const{data:{session}}=await supabaseClient.auth.getSession();
    const{data:okNote,error}=await supabaseClient.rpc('leave_note',{p_card_uid:currentCardUid,p_message:msg});
    if(error||okNote!==true)ns.textContent='Could not send right now. Please try again later.';else{ns.textContent='Note sent successfully!';$('visitorNoteText').value=''}
  });
}
