/* js/admin-cards.js
   Cards, Users, Generate cards, Activity log pages. */

LOADERS.cards=()=>{const p=$('p-cards');if(!p.dataset.ready){p.dataset.ready=1;p.innerHTML=pageHead('Cards','Search, open, block or reset a card')+
  `<div class="row" style="margin-bottom:14px"><input id="q" placeholder="Search serial or owner email" aria-label="Search cards" style="flex:1;min-width:200px"><button class="btn pri" id="qGo">Search</button></div><div id="cards" class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))"></div>`;
  $('qGo').onclick=loadCards;$('q').addEventListener('keydown',e=>{if(e.key==='Enter')loadCards()})}loadCards()};
async function loadCards(){
  const{data,error}=await sb.rpc('admin_cards',{p_search:$('q').value.trim(),p_limit:60});
  if(error||!data){$('cards').innerHTML='<div class="empty">Could not load.</div>';return}
  $('cards').innerHTML=data.length?data.map(c=>`<div class="card" style="margin:0"><div class="row sp"><code>${esc(c.nfc_uid)}</code><span>${c.claimed?'<span class="chip g">Claimed</span>':'<span class="chip">Unclaimed</span>'} ${c.disabled?'<span class="chip r">Blocked</span>':''}</span></div>
  <div class="mut sm" style="margin:6px 0 10px">${c.claimed?esc(c.owner_email||'')+(c.owner_name?' · '+esc(c.owner_name):''):'Not claimed yet'} · ${num(c.taps)} taps</div>
  <div class="row"><a class="btn sm" target="_blank" rel="noopener" href="${BASE}?card=${encodeURIComponent(c.nfc_uid)}&nt=1">Open</a>
  <button class="btn sm" data-a="dis" data-u="${esc(c.nfc_uid)}" data-v="${!c.disabled}">${c.disabled?'Unblock':'Block'}</button>
  ${c.claimed?`<button class="btn sm dng" data-a="reset" data-u="${esc(c.nfc_uid)}">Reset</button>`:''}</div></div>`).join(''):'<div class="empty">No cards found.</div>';
}
$('p-cards').addEventListener('click',async e=>{
  const b=e.target.closest('button[data-a]');if(!b)return;const u=b.dataset.u;
  if(b.dataset.a==='dis'){await rpc('set_card_disabled',{p_uid:u,p_disabled:b.dataset.v==='true'},b.dataset.v==='true'?'Card blocked':'Card unblocked')}
  if(b.dataset.a==='reset'){if(!await confirmBox('Reset '+u+'?','The owner loses this card and its taps, notes and shared contacts. Their profile stays on their account.','Reset card',true))return;await rpc('admin_reset_card',{p_uid:u},'Card reset')}
  loadCards();
});

/* ---------- users ---------- */
let USERS=[];
LOADERS.users=async()=>{const p=$('p-users');if(!p.dataset.ready){p.dataset.ready=1;p.innerHTML=pageHead('Users','Everyone with a LYNQ profile')+`<input id="uq" placeholder="Filter by name, email or username" aria-label="Filter users" style="margin-bottom:14px"><div id="users" class="grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))"></div>`;
  $('uq').addEventListener('input',drawUsers);
  $('users').addEventListener('change',async e=>{const s=e.target.closest('select[data-u]');if(!s)return;await rpc('admin_set_verified',{p_user:s.dataset.u,p_kind:s.value},'Badge updated');LOADERS.users()})}
  const{data,error}=await sb.rpc('admin_users');if(error||!data){$('users').innerHTML='<div class="empty">Could not load.</div>';return}USERS=data;drawUsers()};
function drawUsers(){
  const f=$('uq').value.trim().toLowerCase();
  const L=USERS.filter(u=>!f||[u.email,u.name,u.handle,u.ref_code].join(' ').toLowerCase().includes(f));
  $('users').innerHTML=L.length?L.map(u=>`<div class="card" style="margin:0"><div class="row sp" style="flex-wrap:nowrap"><div style="min-width:0">${u.first_card?`<a href="${BASE}?card=${encodeURIComponent(u.first_card)}&nt=1" target="_blank" rel="noopener"><b>${esc(u.name||u.email)}</b></a>`:`<b>${esc(u.name||u.email)}</b>`}<div class="mut sm" style="overflow-wrap:anywhere">${esc(u.email)}${u.handle?' · @'+esc(u.handle):''}${u.ref_code?' · ref '+esc(u.ref_code):''} · ${u.cards} card${u.cards==1?'':'s'}</div></div>
  <select data-u="${esc(u.user_id)}" aria-label="Verified badge for ${esc(u.name||u.email)}" style="width:auto"><option value="">No badge</option>${['staff','student','company'].map(k=>`<option value="${k}"${u.verified===k?' selected':''}>${k[0].toUpperCase()+k.slice(1)} ✓</option>`).join('')}</select></div></div>`).join(''):'<div class="empty">No users.</div>';
}

/* ---------- generate cards ---------- */
LOADERS.gen=()=>{const p=$('p-gen');if(p.dataset.ready)return;p.dataset.ready=1;
  p.innerHTML=pageHead('Generate cards','Creates new unclaimed cards with random serial numbers')+`<div class="card" style="max-width:520px"><div class="fld"><label for="n">How many cards?</label><input id="n" type="number" min="1" max="1000" value="100"></div><button class="btn pri" id="genGo" style="margin-top:12px">${ic('plus')}Generate</button></div><div id="genOut" style="margin-top:14px;max-width:520px"></div>`;
  $('genGo').onclick=async()=>{
    const n=Math.max(1,Math.min(1000,+$('n').value||1));$('genGo').disabled=true;
    const{data,error}=await sb.rpc('admin_generate_cards',{n});$('genGo').disabled=false;
    if(error||!data){$('genOut').innerHTML='<div class="note">Could not generate: '+esc(error&&error.message)+'</div>';return}
    const csv=['serial,url'].concat(data.map(s=>s+','+BASE+'?card='+s)).join('\n');
    $('genOut').innerHTML=`<div class="card"><b>${data.length} cards created.</b><div class="mut sm" style="margin:6px 0 12px">The CSV has the exact web address to write on each NFC chip.</div><button class="btn pri" id="csvBtn">${ic('download')}Download CSV</button></div>`;
    $('csvBtn').onclick=()=>download('lynq-cards-'+Date.now()+'.csv',csv);toast(data.length+' cards created');
  }};

/* ---------- activity log ---------- */
LOADERS.log=async()=>{const p=$('p-log');p.innerHTML=pageHead('Activity log','Who did what, and when')+'<div id="logList"></div>';
  const{data}=await sb.rpc('admin_log',{p_limit:150});
  $('logList').innerHTML=data&&data.length?`<div class="card"><div class="rows">${data.map(r=>`<div class="rr" style="grid-template-columns:minmax(120px,1fr) 2fr 170px" data-cols><div class="b" data-l="Action">${esc(r.action)}</div><div class="mut sm" data-l="Who">${esc(r.staff_email||'')}${r.target?' · '+esc(r.target):''}${r.detail?' · '+esc(r.detail):''}</div><div class="mut sm" data-l="When">${new Date(r.at).toLocaleString()}</div></div>`).join('')}</div></div>`:'<div class="empty">No staff actions yet.</div>'};
