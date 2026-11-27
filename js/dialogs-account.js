/* js/dialogs-account.js
   Saved contacts, popup dialogs, delete profile, business mode, share-link name.
   (Part of LYNQ 2027. See README.md, 'Where to change what'.) */
/* ---------- saved LYNQ contacts ---------- */
async function saveLynqContact(manual){
  if(isOwner||!currentCardUid)return;
  if(!curSession){if(manual)lynqAlert('Sign in to keep LYNQ contacts.');return}
  const{error}=await supabaseClient.from('saved_contacts').upsert({user_id:curSession.user.id,card_uid:currentCardUid,name:state.name});
  if(manual)lynqAlert(error?'Could not save: '+error.message:'Saved to your LYNQ contacts.');
}
async function openContacts(){
  if(!curSession){lynqAlert('Sign in to see your LYNQ contacts.');return}
  const{data,error}=await supabaseClient.from('saved_contacts').select('*').eq('user_id',curSession.user.id).order('created_at',{ascending:false});
  $('savedList').innerHTML=error?'Could not load contacts.':(data&&data.length?data.map(c=>`<div class="note-item"><a href="${location.pathname}?card=${encodeURIComponent(c.card_uid)}" style="color:var(--text);font-weight:700;text-decoration:none">${esc(c.name||'LYNQ profile')}</a><span class="del-note" onclick="removeSaved('${esc(c.card_uid)}')">Remove</span><div style="font-size:11px;color:var(--sub);margin-top:2px">Saved ${new Date(c.created_at).toLocaleDateString()}</div></div>`).join(''):'No saved contacts yet. Open someone\'s LYNQ profile and use the menu to save it.');
  $('contactsModal').classList.add('open');
}
async function removeSaved(uid){await supabaseClient.from('saved_contacts').delete().eq('card_uid',uid);openContacts()}

/* ---------- themed dialogs (replace the browser's alert/confirm/prompt) ---------- */
const TRI='<svg viewBox="0 0 24 24" stroke="#ff7a8a"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
function lynqDialog(o){return new Promise(res=>{
  const d=$('dlg'),inp=$('dlgInput'),ok=$('dlgOk'),cn=$('dlgCancel'),need=o.word||'';
  $('dlgTitle').textContent=o.title||'LYNQ';$('dlgText').textContent=o.text||'';
  $('dlgIc').className='dlg-ic'+(o.danger?' danger':'');$('dlgIc').innerHTML=o.danger?TRI:CHAIN;
  inp.classList.toggle('hidden',!need);inp.value='';inp.placeholder=need?`Type ${need} to confirm`:'';
  ok.textContent=o.ok||'OK';ok.className='gbtn '+(o.danger?'danger':'primary');ok.disabled=!!need;
  cn.classList.toggle('hidden',!o.cancel);
  const done=v=>{d.classList.remove('open');ok.onclick=cn.onclick=inp.oninput=inp.onkeydown=null;res(v)};
  inp.oninput=()=>{ok.disabled=inp.value.trim().toUpperCase()!==need.toUpperCase()};
  inp.onkeydown=e=>{if(e.key==='Enter'&&!ok.disabled)done(true)};
  ok.onclick=()=>done(true);cn.onclick=()=>done(false);
  d.classList.add('open');if(need)setTimeout(()=>inp.focus(),300);
})}
const lynqAlert=(text,title)=>lynqDialog({title:title||'LYNQ',text,ok:'OK'});
const lynqConfirm=o=>lynqDialog({...o,cancel:true});

/* ---------- delete profile / account ---------- */
async function deleteMyProfile(){
  if(!curSession)return;
  if(!await lynqConfirm({danger:true,title:'Delete your profile?',text:'Your photos, links and details will be erased. Your cards stay linked to your Google account.',word:'DELETE',ok:'Delete profile'}))return;
  await purgeMyPhotos();
  const{error}=await supabaseClient.from('profiles').delete().eq('user_id',curSession.user.id);
  if(error){await lynqAlert('Could not delete: '+error.message,'Something went wrong');return}
  await lynqAlert('Your profile was deleted.','Done');location.reload();
}
async function deleteMyAccount(){
  if(!curSession)return;
  if(!await lynqConfirm({danger:true,title:'Delete your account?',text:'This permanently removes your Google sign-in from LYNQ, your profile and saved contacts, and unlinks all your cards. This cannot be undone.',word:'DELETE',ok:'Delete account'}))return;
  await purgeMyPhotos();
  const{error}=await supabaseClient.rpc('delete_my_account');
  if(error){await lynqAlert('Could not delete: '+error.message,'Something went wrong');return}
  await supabaseClient.auth.signOut({scope:'local'});sessionStorage.clear();
  await lynqAlert('Your account was deleted.','Done');
  location.href=location.pathname+(currentCardUid?'?card='+encodeURIComponent(currentCardUid):'');
}

/* ---------- business mode ---------- */
const BZ=()=>state.biz=state.biz||{on:false,items:[],book:'',msg:''};
let bizPhoto='';
function bizHTML(){
  const b=BZ();if(!b.on)return '';
  const ph=gPhotos().slice(0,3);
  if(!(b.items.length||ph.length||b.book||b.msg))return '';
  const items=b.items.map(it=>`<div class="biz-i">${it.photo?`<img src="${it.photo}" alt="">`:''}<div class="biz-x"><b>${esc(it.name)}</b>${it.desc?`<span>${esc(it.desc)}</span>`:''}</div>${it.price?`<div class="biz-p">${esc(it.price)}</div>`:''}</div>`).join('');
  const photos=ph.length?`<div class="biz-ph n${ph.length}">${ph.map((u,i)=>`<img src="${u}" alt="" data-gi="${i}">`).join('')}</div>`:'';
  const btn=(u,l,k,c)=>u?`<a class="btn ${c}" href="${esc(safeUrl(u))}" target="_blank" rel="noopener" data-trk="${k}">${l}</a>`:'';
  return `<div class="biz">${items?`<div class="biz-t">Services &amp; products</div>${items}`:''}${photos}<div class="biz-b">${btn(b.book,esc(b.btn||'Book now'),'booking','')}${btn(b.msg,'Message us','message','secondary')}</div></div>`;
}

/* ---------- share link (username) ---------- */
const shareUrl=()=>curHandle?location.origin+location.pathname+'?u='+encodeURIComponent(curHandle):location.href;
function refreshHandleUI(){
  if(document.activeElement!==$('handleInput'))$('handleInput').value=curHandle||'';
  $('handleShow').textContent=curHandle?'Your link: '+shareUrl():'No username yet.';$('copyHandleBtn').hidden=!curHandle;
}
async function saveHandle(){
  const h=$('handleInput').value.trim().toLowerCase().replace(/^@/,'');
  const{data,error}=await supabaseClient.rpc('set_handle',{p_handle:h});
  const m={ok:'Saved!',invalid:'Use 3 to 20 letters, numbers or underscores.',reserved:'That name is reserved. Try another one.',taken:'That username is already taken.',no_profile:'Save your profile first (Save & publish), then set a username.',no_auth:'Please sign in first.'};
  if(data==='ok'){curHandle=h;refreshHandleUI()}
  await lynqAlert(m[data]||(error&&error.message)||'Something went wrong.',data==='ok'?'Done':'Username');
}

