/* js/features.js
   My cards, analytics, notifications, QR, referral, business templates.
   (Part of LYNQ 2027. See README.md, 'Where to change what'.) */
/* ---------- my cards / analytics / install ---------- */
async function openMyCards(){
  if(!curSession)return;
  const{data,error}=await supabaseClient.from('nfc_cards').select('nfc_uid,tap_count,disabled').eq('user_id',curSession.user.id).order('created_at');
  $('cardsList').innerHTML=error?'Could not load your cards.':(data&&data.length?data.map(c=>`<div class="note-item"><b style="color:var(--text);font-family:ui-monospace,monospace;font-size:13px">${esc(c.nfc_uid)}</b><div style="font-size:12px;margin:3px 0 8px">${c.tap_count} taps · ${c.disabled?'<span style="color:#e5484d">Disabled</span>':'Active'}</div><button class="btn secondary" style="padding:7px 12px;font-size:12px" onclick="toggleCard('${esc(c.nfc_uid)}',${!c.disabled})">${c.disabled?'Enable card':'Disable card'}</button> <button class="btn secondary" style="padding:7px 12px;font-size:12px;color:#e5484d" onclick="releaseCard('${esc(c.nfc_uid)}')">Remove from my account</button></div>`).join(''):'No cards yet.');
  $('cardsModal').classList.add('open');
}
async function toggleCard(uid,dis){
  if(dis&&!await lynqConfirm({danger:true,title:'Disable this card?',text:'Anyone who taps it will see that it is disabled until you enable it again. Use this if the card is lost.',ok:'Disable card'}))return;
  const{data}=await supabaseClient.rpc('set_card_disabled',{p_uid:uid,p_disabled:dis});
  if(!data)await lynqAlert('Could not update the card.','Something went wrong');
  openMyCards();
}
async function releaseCard(uid){
  if(!await lynqConfirm({danger:true,title:'Remove this card?',text:'This card will be unlinked from your account. Its visitor notes, shared contacts and tap stats are erased, and anyone who taps it can claim it. Your profile stays on your account.',ok:'Remove card'}))return;
  const{data}=await supabaseClient.rpc('release_card',{p_uid:uid});
  if(!data){await lynqAlert('Could not remove the card.','Something went wrong');return}
  if(uid===currentCardUid){location.reload();return}
  openMyCards();
}
async function openStats(){
  const uid=isOwner?currentCardUid:myUid;if(!uid)return;
  const since=new Date(Date.now()-30*864e5).toISOString().slice(0,10);
  const[a,b]=await Promise.all([supabaseClient.from('card_stats').select('day,taps').eq('card_uid',uid).gte('day',since),supabaseClient.from('link_clicks').select('platform,clicks').eq('card_uid',uid).gte('day',since)]);
  const m={};(a.data||[]).forEach(r=>m[r.day]=r.taps);
  const days=[...Array(14)].map((_,i)=>new Date(Date.now()+8*36e5-(13-i)*864e5).toISOString().slice(0,10));
  const mx=Math.max(1,...days.map(d=>m[d]||0)),tot=(a.data||[]).reduce((t,r)=>t+r.taps,0);
  const bars=days.map(d=>`<div title="${d}: ${m[d]||0}" style="flex:1;display:flex;align-items:flex-end;height:90px"><div style="width:100%;border-radius:4px 4px 0 0;background:var(--accent);height:${Math.round((m[d]||0)/mx*80)+3}px"></div></div>`).join('');
  const agg={};(b.data||[]).forEach(r=>agg[r.platform]=(agg[r.platform]||0)+r.clicks);
  const top=Object.entries(agg).sort((x,y)=>y[1]-x[1]).slice(0,8);
  $('statsBody').innerHTML=`<div style="font-size:13px;color:var(--sub)">Taps, last 30 days</div><div style="font-size:30px;font-weight:800;color:var(--text)">${tot}</div><div style="display:flex;gap:3px;margin:8px 0 4px">${bars}</div><div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--sub)"><span>${days[0].slice(5)}</span><span>${days[13].slice(5)}</span></div><div style="font-weight:700;color:var(--text);margin:14px 0 6px">Most clicked</div>${top.length?top.map(([k,v])=>`<div style="display:flex;justify-content:space-between;font-size:14px;padding:6px 0;border-bottom:1px solid rgba(127,127,127,.15)"><span style="color:var(--text)">${esc((ICONS[k]&&ICONS[k].label)||k)}</span><b style="color:var(--text)">${v}</b></div>`).join(''):'<div style="font-size:13px">No clicks yet.</div>'}<div class="note" style="margin-top:10px">Your own visits are not counted.</div>`;
  $('statsModal').classList.add('open');
}
let deferredPrompt=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e});
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
async function installApp(){
  if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;return}
  await lynqAlert(/iphone|ipad|ipod/i.test(navigator.userAgent)?'Tap the Share button in Safari, then choose "Add to Home Screen".':'Open your browser menu (the three dots) and choose "Install app" or "Add to Home screen".','Add to Home Screen');
}

/* ---------- notifications (bell) + reports to LYNQ ---------- */
let notifs=[],notifLoaded=false,rpFile=null;
async function loadNotifs(){
  if(!curSession||!hasAccount)return;
  const{data}=await supabaseClient.from('notifications').select('*').eq('user_id',curSession.user.id).order('created_at',{ascending:false}).limit(30);
  notifs=data||[];const n=notifs.filter(x=>!x.read).length;
  $('bellDot').textContent=n>9?'9+':n;$('bellDot').classList.toggle('hidden',!n);
}
async function openNotifs(){
  await loadNotifs();
  $('notifList').innerHTML=notifs.length?notifs.map(n=>`<div class="note-item" style="${n.read?'':'background:rgba(127,127,127,.1);border-radius:10px;padding:10px 8px'}"><b style="color:var(--text)">${esc(n.title)}</b><div style="font-size:13px;margin-top:2px">${esc(n.body||'')}</div><div style="font-size:11px;color:var(--sub);margin-top:3px">${new Date(n.created_at).toLocaleString()}</div></div>`).join(''):'No notifications yet.';
  $('notifModal').classList.add('open');
  if(notifs.some(n=>!n.read)){await supabaseClient.rpc('mark_notifications_read');$('bellDot').classList.add('hidden')}
}
async function openReport(){
  if(!curSession)return;
  const{data}=await supabaseClient.from('nfc_cards').select('nfc_uid').eq('user_id',curSession.user.id).order('created_at');
  $('rpCard').innerHTML='<option value="">No specific card</option>'+(data||[]).map(c=>`<option value="${esc(c.nfc_uid)}"${c.nfc_uid===currentCardUid?' selected':''}>${esc(c.nfc_uid)}</option>`).join('');
  $('rpMsg').value='';$('rpStatus').textContent='';$('rpImgTxt').textContent='Attach image';rpFile=null;
  $('notifModal').classList.remove('open');$('reportModal').classList.add('open');
}
async function sendReport(){
  const msg=$('rpMsg').value.trim(),st=$('rpStatus');
  if(!msg){st.textContent='Please describe the problem.';return}
  $('rpSend').disabled=true;st.textContent='Sending...';
  let path=null;
  if(rpFile){
    try{
      const blob=await (await fetch(rpFile)).blob();
      path=`${curSession.user.id}/${Date.now()}.jpg`;
      const{error}=await supabaseClient.storage.from('support-files').upload(path,blob,{contentType:'image/jpeg'});
      if(error){console.warn('LYNQ report image:',error.message);path=null}
    }catch(_e){path=null}
  }
  const{data,error}=await supabaseClient.rpc('create_ticket',{p_card_uid:$('rpCard').value||null,p_category:$('rpCat').value,p_message:msg,p_image_path:path});
  $('rpSend').disabled=false;
  if(error||!data){st.textContent="Could not send. You may have reached today's limit. Please wait for our reply.";return}
  $('reportModal').classList.remove('open');
  await lynqAlert('We received your report. You will see updates under the bell icon.','Report sent');
  loadNotifs();
}

/* ---------- QR code for a profile ---------- */
function qrDataUrl(text){
  const qr=qrcode(0,'M');qr.addData(text);qr.make();
  const n=qr.getModuleCount(),m=8,q=4,sz=(n+2*q)*m,c=document.createElement('canvas');c.width=c.height=sz;
  const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,sz,sz);x.fillStyle='#111';
  for(let r=0;r<n;r++)for(let k=0;k<n;k++)if(qr.isDark(r,k))x.fillRect((k+q)*m,(r+q)*m,m,m);
  return c.toDataURL('image/png');
}
async function openQr(){
  if(typeof qrcode!=='function'){await lynqAlert('The QR code needs a connection the first time. Please try again online.','QR code');return}
  const u=shareUrl(),d=qrDataUrl(u);
  $('qrpName').textContent=state.name||'QR code';$('qrpImg').src=d;$('qrpUrl').textContent=u;
  $('qrpDl').href=d;$('qrpDl').download=((state.name||'lynq').replace(/\s+/g,'_'))+'_qr.png';
  $('qrpModal').classList.add('open');
}

/* ---------- referral code ---------- */
async function showReferral(){
  const{data}=await supabaseClient.from('profiles').select('ref_code').eq('user_id',curSession.user.id).maybeSingle();
  const code=data&&data.ref_code;
  if(!code){await lynqAlert('Save your profile first (Save & publish) and your referral code will appear here.','Referral code');return}
  const link=GET_LYNQ_URL+(GET_LYNQ_URL.includes('?')?'&':'?')+'ref='+encodeURIComponent(code);
  try{await navigator.clipboard.writeText(link)}catch(_e){}
  await lynqAlert(`Your referral code is ${code}. Friends who use it when they order a LYNQ card are linked to you. This link was copied: ${link}`,'Your referral code');
}

/* ---------- business starter templates ---------- */
const BTPL={
 salon:{label:'Available for bookings',btn:'Book now',items:[['Haircut','₱150'],['Hair color','₱800'],['Manicure','₱250'],['Hair rebond','₱1,500']]},
 food:{label:'Open for orders',btn:'Order now',items:[['House special meal','₱180'],['Iced coffee','₱90'],['Dessert of the day','₱120']]},
 free:{label:'Open to work',btn:'Learn more',items:[['Logo design','₱1,500'],['Social media post','₱300'],['Basic website','₱5,000']]},
 shop:{label:'Open for orders',btn:'Shop now',items:[['Product 1','₱299'],['Product 2','₱499'],['Bundle deal','₱699']]}
};
async function applyBizTpl(k){
  const t=BTPL[k],b=BZ();
  if(b.items.length&&!await lynqConfirm({title:'Replace your items?',text:'This replaces your current items with example ones that you can edit.',ok:'Replace'}))return;
  b.on=true;b.label=t.label;b.btn=t.btn;
  b.items=t.items.map(([n,pr])=>({name:n,price:pr,desc:'Example - edit me',photo:''}));
  render();
  await lynqAlert('Example items were added. Edit the names and prices to match what you offer.','Template applied');
}

