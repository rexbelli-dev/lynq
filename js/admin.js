/* js/admin.js
   Logic of the staff-only admin page (admin.html). */

const sb=window.supabase.createClient('https://cmiuramqfgwyumniedfv.supabase.co','sb_publishable_yegka1PYoQm-U1dpEJJJHA_qbb1ujc6');
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BASE=location.origin+'/';          // where portfolio.html is served (the page the cards open)
let USERS=[];
async function boot(){
  const{data:{session}}=await sb.auth.getSession();
  if(!session){$('signin').classList.remove('hide');return}
  const ok=(await sb.rpc('is_staff')).data===true;
  if(!ok){document.body.innerHTML='<div class="wrap"><div class="card" style="margin-top:60px;text-align:center"><h1>Not authorized</h1><p class="muted">This Google account is not on the LYNQ staff list.</p><button class="b" id="o2">Sign out</button></div></div>';$('o2').onclick=async()=>{await sb.auth.signOut();location.reload()};return}
  $('who').textContent=session.user.email;$('app').classList.remove('hide');loadOv();loadCards();loadUsers();loadLog();loadTickets();
}
$('goSign').onclick=()=>sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname,queryParams:{prompt:'select_account'}}});
$('out').onclick=async()=>{await sb.auth.signOut();location.reload()};
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));
  ['ov','cards','users','gen','rep','log'].forEach(t=>$('t-'+t).classList.toggle('hide',t!==b.dataset.t));
});
async function loadOv(){
  const{data}=await sb.rpc('admin_stats');if(!data){$('t-ov').innerHTML='<div class="card">Could not load.</div>';return}
  const S=[['Cards made',data.cards],['Claimed',data.claimed],['Unclaimed',data.unclaimed],['Blocked',data.disabled],['Users',data.users],['Total taps',data.taps]];
  const last=+localStorage.getItem('lynq_last_backup')||0,days=last?Math.floor((Date.now()-last)/864e5):null;
  const warn=days===null||days>=7;
  $('t-ov').innerHTML='<div class="grid">'+S.map(([k,v])=>`<div class="card stat"><b>${v}</b><span class="muted">${k}</span></div>`).join('')+`</div>
  <div class="card"><b>Backup</b><div class="muted" style="margin:4px 0 8px;${warn?'color:#fde68a':''}">${days===null?'No backup downloaded from this browser yet.':'Last backup from this browser: '+(days===0?'today':days+' day'+(days>1?'s':'')+' ago')+'.'}${warn?' Download one now and keep it somewhere private.':''}</div><button class="b p" id="bkBtn">Download backup (JSON)</button><div class="muted" style="margin-top:8px">Photos stay in Supabase Storage and are not inside this file. Do this weekly and before big changes.</div></div>`;
}
$('t-ov').addEventListener('click',async e=>{
  if(!e.target.closest('#bkBtn'))return;
  const{data,error}=await sb.rpc('admin_export');if(error||!data){alert('Could not export.');return}
  const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,1)],{type:'application/json'}));
  l.download='lynq-backup-'+new Date().toISOString().slice(0,10)+'.json';l.click();
  localStorage.setItem('lynq_last_backup',Date.now());loadOv();loadLog();
});
async function loadCards(){
  const{data,error}=await sb.rpc('admin_cards',{p_search:$('q').value.trim(),p_limit:50});
  if(error||!data){$('cards').innerHTML='<div class="card">Could not load.</div>';return}
  $('cards').innerHTML=data.length?data.map(c=>`<div class="card"><div class="row sp"><code>${esc(c.nfc_uid)}</code><span>${c.claimed?'<span class="chip g">Claimed</span>':'<span class="chip">Unclaimed</span>'}${c.disabled?'<span class="chip r">Blocked</span>':''}</span></div>
  <div class="muted" style="margin:4px 0 8px">${c.claimed?esc(c.owner_email||'')+(c.owner_name?' · '+esc(c.owner_name):''):'Not claimed yet'} · ${c.taps} taps</div>
  <div class="row"><a class="b" target="_blank" rel="noopener" href="${BASE}?card=${encodeURIComponent(c.nfc_uid)}&nt=1">Open</a>
  <button class="b" data-a="dis" data-u="${esc(c.nfc_uid)}" data-v="${!c.disabled}">${c.disabled?'Unblock':'Block'}</button>
  ${c.claimed?`<button class="b d" data-a="reset" data-u="${esc(c.nfc_uid)}">Reset</button>`:''}</div></div>`).join(''):'<div class="card muted">No cards found.</div>';
}
$('qGo').onclick=loadCards;$('q').addEventListener('keydown',e=>{if(e.key==='Enter')loadCards()});
$('cards').addEventListener('click',async e=>{
  const b=e.target.closest('button[data-a]');if(!b)return;const u=b.dataset.u;
  if(b.dataset.a==='dis'){await sb.rpc('set_card_disabled',{p_uid:u,p_disabled:b.dataset.v==='true'})}
  if(b.dataset.a==='reset'){if(!confirm('Reset '+u+'? The owner loses this card and its taps, notes and shared contacts. Their profile stays on their account.'))return;await sb.rpc('admin_reset_card',{p_uid:u})}
  loadCards();loadOv();loadLog();
});
async function loadTickets(){
  const{data,error}=await sb.rpc('admin_tickets');
  if(error||!data){$('t-rep').innerHTML='<div class="card">Could not load reports.</div>';return}
  const openN=data.filter(t=>t.status!=='resolved').length;
  document.querySelector('[data-t="rep"]').textContent='Reports'+(openN?' ('+openN+')':'');
  const urls={};
  await Promise.all(data.filter(t=>t.image_path).map(async t=>{const r=await sb.storage.from('support-files').createSignedUrl(t.image_path,3600);urls[t.id]=r.data&&r.data.signedUrl}));
  $('t-rep').innerHTML=data.length?data.map(t=>`<div class="card"><div class="row sp"><b>${esc(t.category)}</b><span class="chip ${t.status==='resolved'?'g':t.status==='in_progress'?'y':'r'}">${esc(t.status.replace('_',' '))}</span></div>
  <div class="muted" style="margin:4px 0">${esc(t.name||'(no name yet)')} · ${esc(t.email)} · Card <code>${esc(t.card_uid||'none')}</code> · ${new Date(t.created_at).toLocaleString()}</div>
  <div style="white-space:pre-wrap;margin:6px 0">${esc(t.message)}</div>
  ${urls[t.id]?`<a href="${urls[t.id]}" target="_blank" rel="noopener"><img src="${urls[t.id]}" style="max-width:100%;max-height:200px;border-radius:12px;margin:6px 0"></a>`:''}
  ${t.staff_reply?`<div class="muted">Last reply: ${esc(t.staff_reply)}</div>`:''}
  <textarea id="r-${esc(t.id)}" placeholder="Reply to the user (shown in their notifications)" style="width:100%;margin:8px 0;min-height:60px;background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:10px;font-size:16px"></textarea>
  <div class="row"><button class="b" data-tk="reply" data-id="${esc(t.id)}" data-s="${esc(t.status)}">Send reply</button><button class="b" data-tk="in_progress" data-id="${esc(t.id)}">In progress</button><button class="b p" data-tk="resolved" data-id="${esc(t.id)}">Resolved</button></div>
  ${t.card_uid?`<div class="row" style="margin-top:8px"><span class="muted">Manage card:</span><a class="b" target="_blank" rel="noopener" href="${BASE}?card=${encodeURIComponent(t.card_uid)}&nt=1">Open</a><button class="b" data-tk="block" data-u="${esc(t.card_uid)}" data-v="${!t.card_disabled}">${t.card_disabled?'Unblock':'Block'}</button>${t.card_claimed?`<button class="b d" data-tk="reset" data-u="${esc(t.card_uid)}">Reset</button>`:''}</div>`:''}</div>`).join(''):'<div class="card muted">No reports yet.</div>';
}
$('t-rep').addEventListener('click',async e=>{
  const b=e.target.closest('button[data-tk]');if(!b)return;const k=b.dataset.tk;
  if(k==='block'){await sb.rpc('set_card_disabled',{p_uid:b.dataset.u,p_disabled:b.dataset.v==='true'})}
  else if(k==='reset'){if(!confirm('Reset '+b.dataset.u+'? The owner loses this card.'))return;await sb.rpc('admin_reset_card',{p_uid:b.dataset.u})}
  else{const id=b.dataset.id,reply=($('r-'+id)||{}).value||'';await sb.rpc('admin_ticket_update',{p_id:id,p_status:k==='reply'?b.dataset.s:k,p_reply:reply})}
  loadTickets();loadCards();loadOv();loadLog();
});
async function loadLog(){
  const{data}=await sb.rpc('admin_log',{p_limit:150});
  $('t-log').innerHTML=data&&data.length?data.map(r=>`<div class="card"><div class="row sp"><b>${esc(r.action)}</b><span class="muted">${new Date(r.at).toLocaleString()}</span></div><div class="muted">${esc(r.staff_email||'')} · ${esc(r.target||'')}${r.detail?' · '+esc(r.detail):''}</div></div>`).join(''):'<div class="card muted">No staff actions yet.</div>';
}
async function loadUsers(){
  const{data,error}=await sb.rpc('admin_users');if(error||!data){$('users').innerHTML='<div class="card">Could not load.</div>';return}
  USERS=data;drawUsers();
}
function drawUsers(){
  const f=$('uq').value.trim().toLowerCase();
  const L=USERS.filter(u=>!f||[u.email,u.name,u.handle,u.ref_code].join(' ').toLowerCase().includes(f));
  $('users').innerHTML=L.length?L.map(u=>`<div class="card"><div class="row sp"><div>${u.first_card?`<a href="${BASE}?card=${encodeURIComponent(u.first_card)}&nt=1" target="_blank" rel="noopener"><b>${esc(u.name||u.email)}</b></a>`:`<b>${esc(u.name||u.email)}</b>`}<div class="muted">${esc(u.email)}${u.handle?' · @'+esc(u.handle):''}${u.ref_code?' · ref '+esc(u.ref_code):''} · ${u.cards} card${u.cards==1?'':'s'}</div></div>
  <select data-u="${esc(u.user_id)}"><option value="">No badge</option>${['staff','student','company'].map(k=>`<option value="${k}"${u.verified===k?' selected':''}>${k[0].toUpperCase()+k.slice(1)} ✓</option>`).join('')}</select></div></div>`).join(''):'<div class="card muted">No users.</div>';
}
$('uq').addEventListener('input',drawUsers);
$('users').addEventListener('change',async e=>{const s=e.target.closest('select[data-u]');if(!s)return;await sb.rpc('admin_set_verified',{p_user:s.dataset.u,p_kind:s.value});loadUsers();loadLog()});
$('genGo').onclick=async()=>{
  const n=Math.max(1,Math.min(1000,+$('n').value||1));$('genGo').disabled=true;
  const{data,error}=await sb.rpc('admin_generate_cards',{n});$('genGo').disabled=false;
  if(error||!data){$('genOut').innerHTML='<div class="card">Could not generate: '+esc(error&&error.message)+'</div>';return}
  const rows=['serial,url'].concat(data.map(s=>s+','+BASE+'?card='+s)).join('\n');
  const url=URL.createObjectURL(new Blob([rows],{type:'text/csv'}));
  $('genOut').innerHTML=`<div class="card"><b>${data.length} cards created.</b> <a class="b p" download="lynq-cards-${Date.now()}.csv" href="${url}">Download CSV</a><div class="muted" style="margin-top:8px">The CSV has the exact URL to write on each NFC chip.</div></div>`;
  loadOv();loadLog();
};
boot();
