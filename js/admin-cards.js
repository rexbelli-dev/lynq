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


/* ---------- inventory: unused links vs cards already made ---------- */
let STK={tab:'link',rows:[],sel:new Set(),counts:{link:0,made:0,claimed:0}};
LOADERS.stock=async()=>{const p=$('p-stock');
  if(!p.dataset.ready){p.dataset.ready=1;
    p.innerHTML=pageHead('Inventory','Which card links are already on a physical card, and which are still unused')+
    `<div class="grid kpis" id="stkK"></div>
     <div class="row sp" style="margin-bottom:12px"><div class="seg" id="stkSeg"><button data-t="link">Unused links</button><button data-t="made">On cards (for sale)</button></div>
     <input id="stkQ" placeholder="Search serial" aria-label="Search serial" style="max-width:240px"></div>
     <div id="stkAct" class="row" style="margin-bottom:12px"></div><div id="stkList"></div>`;
    $('stkSeg').onclick=e=>{const b=e.target.closest('button[data-t]');if(!b)return;STK.tab=b.dataset.t;STK.sel.clear();LOADERS.stock()};
    let t;$('stkQ').addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>LOADERS.stock(),300)});
    $('p-stock').addEventListener('click',stkClick);$('p-stock').addEventListener('change',e=>{const c=e.target.closest('input[data-s]');if(!c)return;c.checked?STK.sel.add(c.dataset.s):STK.sel.delete(c.dataset.s);drawStk()});
  }
  const{data,error}=await sb.rpc('admin_stock',{p_stock:STK.tab,p_search:$('stkQ').value.trim(),p_limit:2000});
  if(error||!data){$('stkList').innerHTML='<div class="empty">Could not load. Run sql/6-card-inventory.sql in the Supabase SQL Editor first.</div>';return}
  STK.rows=data.rows||[];STK.counts=data.counts||STK.counts;drawStk();
};
function drawStk(){
  const c=STK.counts,L=STK.rows,u=STK.tab==='link';
  $('stkK').innerHTML=`<div class="kpi${u?' hi':''}"><span>Unused links</span><b>${num(c.link)}</b><small>Not on a physical card yet</small></div><div class="kpi${u?'':' hi'}"><span>On cards (for sale)</span><b>${num(c.made)}</b><small>Written to a physical card</small></div><div class="kpi"><span>Claimed by customers</span><b>${num(c.claimed)}</b></div>`;
  document.querySelectorAll('#stkSeg button').forEach(b=>b.classList.toggle('on',b.dataset.t===STK.tab));
  const n=STK.sel.size;
  $('stkAct').innerHTML=L.length?(u?
    `<button class="btn" data-k="all">${n===L.length?'Clear selection':'Select all'+(L.length>0?' ('+num(L.length)+')':'')}</button>
     <button class="btn pri" data-k="csv">${ic('download')}Download CSV ${n?'('+num(n)+' selected)':'(all '+num(L.length)+' shown)'}</button>
     <button class="btn" data-k="made"${n?'':' disabled'}>Mark ${n?num(n):''} as made</button>`:
    `<button class="btn" data-k="all">${n===L.length?'Clear selection':'Select all'}</button>
     <button class="btn" data-k="back"${n?'':' disabled'}>Move ${n?num(n):''} back to unused</button>
     <span class="mut sm">Claimed cards cannot be moved back.</span>`):'';
  $('stkList').innerHTML=L.length?`<div class="card"><div class="mut sm" style="margin-bottom:8px">${u?'These links exist in the system but have not been written to a card. Write them to chips, then mark them as made so they are never used twice.':'These links are already on physical cards. Do not write them to another card.'}${L.length>=2000?' Showing the first 2,000.':''}</div>
    <div class="rows">${L.map(r=>`<label class="rr" style="grid-template-columns:28px 1fr auto auto;cursor:pointer"><input type="checkbox" data-s="${esc(r.uid)}"${STK.sel.has(r.uid)?' checked':''} aria-label="Select ${esc(r.uid)}"><code style="justify-self:start">${esc(r.uid)}</code><span class="mut sm">${dstr((r.created_at||'').slice(0,10))}</span><span>${r.claimed?'<span class="chip g">Claimed</span>':u?'<span class="chip y">Unused</span>':'<span class="chip">In stock</span>'}${r.disabled?' <span class="chip r">Blocked</span>':''}</span></label>`).join('')}</div></div>`
    :`<div class="empty">${u?'No unused links. Use Generate cards to create more.':'No cards marked as made yet.'}</div>`;
}
async function stkClick(e){
  const b=e.target.closest('button[data-k]');if(!b)return;const k=b.dataset.k,L=STK.rows;
  if(k==='all'){STK.sel.size===L.length?STK.sel.clear():L.forEach(r=>STK.sel.add(r.uid));drawStk();return}
  const ids=STK.sel.size?[...STK.sel]:L.map(r=>r.uid);
  if(k==='csv'){
    if(!ids.length)return;
    const csv=['serial,url'].concat(ids.map(s=>s+','+BASE+'?card='+s)).join('\n');
    download('lynq-unused-links-'+Date.now()+'.csv',csv);
    if(await confirmBox('Did you write these '+num(ids.length)+' links to cards?','If yes, mark them as made now. They will leave the unused list, so the same link is never written twice.','Yes, mark as made')){
      const r=await rpc('admin_set_stock',{p_uids:ids,p_stock:'made'},num(ids.length)+' marked as made');STK.sel.clear();if(!r.error)LOADERS.stock();
    }
    return;
  }
  if(k==='made'){
    if(!STK.sel.size)return;
    if(!await confirmBox('Mark '+num(ids.length)+' as made?','This says the links are already written to physical cards.','Mark as made'))return;
    await rpc('admin_set_stock',{p_uids:ids,p_stock:'made'},num(ids.length)+' marked as made');STK.sel.clear();LOADERS.stock();return;
  }
  if(k==='back'){
    if(!STK.sel.size)return;
    if(!await confirmBox('Move '+num(ids.length)+' back to unused?','Only do this if these links are NOT on a physical card.','Move back',true))return;
    const r=await rpc('admin_set_stock',{p_uids:ids,p_stock:'link'});if(!r.error)toast(num(r.data)+' moved back to unused');STK.sel.clear();LOADERS.stock();
  }
}

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
    $('genOut').innerHTML=`<div class="card"><b>${data.length} cards created.</b><div class="mut sm" style="margin:6px 0 12px">The CSV has the exact web address to write on each NFC chip. These links stay listed as unused in Inventory until you mark them as made, so you can always find them again.</div><button class="btn pri" id="csvBtn">${ic('download')}Download CSV</button></div>`;
    $('csvBtn').onclick=()=>download('lynq-cards-'+Date.now()+'.csv',csv);toast(data.length+' cards created');
  }};

/* ---------- activity log ---------- */
LOADERS.log=async()=>{const p=$('p-log');p.innerHTML=pageHead('Activity log','Who did what, and when')+'<div id="logList"></div>';
  const{data}=await sb.rpc('admin_log',{p_limit:150});
  $('logList').innerHTML=data&&data.length?`<div class="card"><div class="rows">${data.map(r=>`<div class="rr" style="grid-template-columns:minmax(120px,1fr) 2fr 170px" data-cols><div class="b" data-l="Action">${esc(r.action)}</div><div class="mut sm" data-l="Who">${esc(r.staff_email||'')}${r.target?' · '+esc(r.target):''}${r.detail?' · '+esc(r.detail):''}</div><div class="mut sm" data-l="When">${new Date(r.at).toLocaleString()}</div></div>`).join('')}</div></div>`:'<div class="empty">No staff actions yet.</div>'};
