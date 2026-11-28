/* js/admin-orders.js
   Orders page: shop orders, payment proof, referral info, status, shop settings. Needs sql/8-orders.sql. */

let ORD={st:'',rows:[],counts:{},open:null};
const OSTAT=[['new','New'],['paid','Paid'],['packed','Packed'],['shipped','Shipped'],['delivered','Delivered'],['cancelled','Cancelled']];
const ODT=d=>d?new Date(d).toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short'}):'';
const PHP=n=>'₱'+Number(n||0).toLocaleString('en-PH');
const SHOPSET=[['price','Price per card (PHP)'],['custom_price','Price per card, customized (PHP)'],['ship_fee','Shipping outside Mindanao (PHP)'],['ship_half_qty','Cards for shipping discount'],['ship_half_pct','Shipping discount (%)'],['ship_free_qty','Cards for free shipping'],['custom_min','Minimum cards, customized'],['referral_off','Referral discount (PHP)'],['gcash_name','GCash account name'],['gcash_number','GCash number (optional)']];

async function refreshOrdBadge(){
  const{data}=await sb.rpc('admin_order_counts');
  if(data){NEWORD=data.new||0;buildNav()}
}
LOADERS.orders=async()=>{const p=$('p-orders');
  if(!p.dataset.ready){p.dataset.ready=1;
    p.innerHTML=pageHead('Orders','Orders from the shop, newest first',isFounder()?'<button class="btn" id="ordSet">Shop settings</button>':'')+
    `<div id="ordSetBox"></div><div class="row sp" style="margin-bottom:12px;flex-wrap:wrap"><div class="seg" id="ordSeg"></div><input id="ordQ" placeholder="Search order no, name, phone, code" aria-label="Search orders" style="max-width:260px"></div><div id="ordList"></div>`;
    $('ordSeg').onclick=e=>{const b=e.target.closest('button[data-s]');if(!b)return;ORD.st=b.dataset.s;ORD.open=null;LOADERS.orders()};
    let t;$('ordQ').addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>LOADERS.orders(),300)});
    $('p-orders').addEventListener('click',ordClick);
    if($('ordSet'))$('ordSet').onclick=openShopSet;
  }
  const[r,c]=await Promise.all([sb.rpc('admin_orders',{p_status:ORD.st||null,p_search:$('ordQ').value.trim(),p_limit:200}),sb.rpc('admin_order_counts')]);
  if(r.error){$('ordList').innerHTML='<div class="empty">Could not load. Run sql/8-orders.sql in the Supabase SQL Editor first.</div>';return}
  ORD.rows=(r.data||[]).map(x=>x.o||x);ORD.counts=c.data||{};NEWORD=ORD.counts.new||0;buildNav();drawOrd();
};
function drawOrd(){
  const cn=ORD.counts,all=Object.values(cn).reduce((a,b)=>a+b,0);
  $('ordSeg').innerHTML=`<button data-s=""${ORD.st===''?' class="on"':''}>All ${all}</button>`+OSTAT.map(s=>`<button data-s="${s[0]}"${ORD.st===s[0]?' class="on"':''}>${s[1]}${cn[s[0]]?' '+cn[s[0]]:''}</button>`).join('');
  $('ordList').innerHTML=ORD.rows.length?ORD.rows.map(o=>ordCard(o)).join(''):'<div class="empty">No orders yet.</div>';
  if(ORD.open)loadImgs(ORD.open);
}
const SCHIP={new:'y',paid:'g',packed:'p',shipped:'p',delivered:'g',cancelled:'r'};
function ordCard(o){
  const open=ORD.open===o.id,where=[o.city,o.province].filter(Boolean).join(', ');
  let h=`<div class="card" style="margin:0 0 10px"><div class="row sp" data-o="${o.id}" style="cursor:pointer;flex-wrap:nowrap;gap:10px"><div style="min-width:0"><b>${esc(o.order_no)}</b> <span class="chip ${SCHIP[o.status]||''}">${esc(o.status)}</span>${o.is_custom?' <span class="chip p">Custom</span>':''}${o.referral_code?' <span class="chip g">Referral</span>':''}
   <div class="mut sm">${esc(o.full_name)} · ${num(o.qty)} card${o.qty>1?'s':''} · ${esc(where)}</div></div><div style="text-align:right;white-space:nowrap"><b>${PHP(o.total)}</b><div class="mut sm">${esc(ODT(o.created_at))}</div></div></div>`;
  if(open){
    const items=(o.items||[]).map(i=>`${esc(i.name||i.id)} ×${num(i.qty)}`).join(', ');
    h+=`<div style="margin-top:14px;display:grid;gap:12px">
     <div><b>Items</b><div class="sm">${items}</div></div>
     <div><b>Price</b><div class="sm">Cards ${PHP(o.subtotal)} (${num(o.qty)} × ${PHP(o.unit_price)}) · Shipping ${PHP(o.shipping)}${o.shipping_discount?' − '+PHP(o.shipping_discount)+' discount':''}${o.referral_discount?' · Referral − '+PHP(o.referral_discount):''} · <b>Total ${PHP(o.total)}</b>${o.in_mindanao?' · Mindanao (free shipping)':''}</div></div>
     <div><b>Customer</b><div class="sm">${esc(o.full_name)} · <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a>${o.email?' · <a href="mailto:'+esc(o.email)+'">'+esc(o.email)+'</a>':''}</div></div>
     <div><b>Deliver to</b><div class="sm">${esc([o.street,o.barangay,o.city,o.province,o.region,o.postal_code].filter(Boolean).join(', '))}</div></div>
     ${o.referral_code?`<div><b>Referral</b><div class="sm">Code <code>${esc(o.referral_code)}</code> · Referred by ${o.referrer_email?esc(o.referrer_email):'unknown'}${o.referrer_card_uid?' · from card <code>'+esc(o.referrer_card_uid)+'</code>':''}<br>Code applied: ${esc(ODT(o.referral_applied_at))}<br>Order placed: ${esc(ODT(o.created_at))}</div></div>`:''}
     <div><b>Payment</b><div class="sm">GCash reference: ${esc(o.payment_ref||'not given')}</div><div id="img-p-${o.id}" class="mut sm">Loading screenshot…</div></div>
     ${o.is_custom?`<div><b>Custom design</b><div class="sm">${esc(o.design_notes||'')}</div><div id="img-d-${o.id}" class="mut sm">Loading design…</div></div>`:''}
     <label class="f"><span class="sm"><b>Your note</b> (only staff see this)</span><textarea id="note-${o.id}" rows="2" style="width:100%">${esc(o.admin_note||'')}</textarea></label>
     <div class="row" style="flex-wrap:wrap">${OSTAT.filter(s=>s[0]!==o.status).map(s=>`<button class="btn sm${s[0]==='cancelled'?' dng':''}" data-set="${s[0]}" data-id="${o.id}">Mark ${s[1].toLowerCase()}</button>`).join('')}<button class="btn sm" data-note="${o.id}">Save note</button></div></div>`;
  }
  return h+'</div>';
}
async function loadImgs(id){
  const o=ORD.rows.find(x=>x.id===id);if(!o)return;
  const put=async(path,el,label)=>{const box=$(el);if(!box)return;
    if(!path){box.textContent='No '+label;return}
    const r=await sb.storage.from('order-files').createSignedUrl(path,3600);
    box.innerHTML=r.data&&r.data.signedUrl?`<a href="${esc(r.data.signedUrl)}" target="_blank" rel="noopener"><img src="${esc(r.data.signedUrl)}" alt="${label}" style="max-width:260px;max-height:340px;border-radius:10px;border:1px solid var(--line)"></a><div class="mut sm">Tap to open full size</div>`:'Could not load the image.'};
  put(o.proof_path,'img-p-'+id,'payment screenshot');if(o.is_custom)put(o.design_path,'img-d-'+id,'design');
}
async function ordClick(e){
  const s=e.target.closest('button[data-set]');
  if(s){const id=s.dataset.id,st=s.dataset.set;
    if(st==='cancelled'&&!await confirmBox('Cancel this order?','The customer is not notified automatically. Message them yourself.','Cancel order',true))return;
    await rpc('admin_order_set',{p_id:id,p_status:st,p_note:null},'Order marked '+st);LOADERS.orders();return}
  const n=e.target.closest('button[data-note]');
  if(n){const id=n.dataset.note;await rpc('admin_order_set',{p_id:id,p_status:null,p_note:$('note-'+id).value},'Note saved');LOADERS.orders();return}
  if(e.target.closest('a,textarea,input,button'))return;
  const r=e.target.closest('[data-o]');if(r){ORD.open=ORD.open===r.dataset.o?null:r.dataset.o;drawOrd()}
}
async function openShopSet(){
  const b=$('ordSetBox');if(b.innerHTML){b.innerHTML='';return}
  const{data,error}=await sb.rpc('admin_shop_settings',{p_set:null});
  if(error||!data){toast('Could not load settings',true);return}
  b.innerHTML=`<div class="card" style="margin-bottom:14px"><b>Shop settings</b><div class="mut sm" style="margin:4px 0 12px">Changes apply to new orders straight away. Mindanao always has free shipping.</div>
   <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">${SHOPSET.map(k=>`<label class="f"><span class="sm">${k[1]}</span><input data-k="${k[0]}" value="${esc(data[k[0]]??'')}"></label>`).join('')}</div>
   <div class="row" style="margin-top:12px"><button class="btn pri" id="setSave">Save settings</button></div></div>`;
  $('setSave').onclick=async()=>{const o={};b.querySelectorAll('input[data-k]').forEach(i=>o[i.dataset.k]=i.value.trim());
    await rpc('admin_shop_settings',{p_set:o},'Settings saved');b.innerHTML=''};
}
