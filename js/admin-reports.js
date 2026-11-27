/* js/admin-reports.js
   Reports from customers: reply, mark progress, archive, restore, delete. */

let REP_VIEW='active',REP_FILTER='all',REP_DATA=[];
LOADERS.rep=loadReports;
async function loadReports(){
  const p=$('p-rep');
  p.innerHTML=pageHead('Reports','Problems and messages from customers',`<div class="seg" role="group" aria-label="Which reports"><button data-v="active" class="${REP_VIEW==='active'?'on':''}">Active</button><button data-v="archived" class="${REP_VIEW==='archived'?'on':''}">Archived</button></div>`)+'<div id="repBody"><div class="empty">Loading…</div></div>';
  const{data,error}=await sb.rpc('admin_tickets',{p_archived:REP_VIEW==='archived'});
  if(error||!data){$('repBody').innerHTML='<div class="empty">Could not load reports. Did you run sql/4-admin-dashboard.sql?</div>';return}
  REP_DATA=data;
  if(REP_VIEW==='active'){OPENREP=data.filter(t=>t.status!=='resolved').length;buildNav()}
  drawReports();
}
async function refreshBadge(){const{data}=await sb.rpc('admin_tickets',{p_archived:false});if(data){OPENREP=data.filter(t=>t.status!=='resolved').length;buildNav()}}
async function drawReports(){
  const L=REP_DATA.filter(t=>REP_FILTER==='all'||t.status===REP_FILTER);
  const urls={};
  await Promise.all(L.filter(t=>t.image_path).map(async t=>{const r=await sb.storage.from('support-files').createSignedUrl(t.image_path,3600);urls[t.id]=r.data&&r.data.signedUrl}));
  const chips=['all','open','in_progress','resolved'].map(k=>`<button data-f="${k}" class="${REP_FILTER===k?'on':''}">${k==='all'?'All':k==='open'?'Open':k==='in_progress'?'In progress':'Resolved'}</button>`).join('');
  $('repBody').innerHTML=`<div class="seg" style="margin-bottom:14px" role="group" aria-label="Filter by status">${chips}</div>`+
  (L.length?`<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr));align-items:start">`+L.map(t=>`<div class="card" style="margin:0"><div class="row sp"><b>${esc(t.category)}</b><span class="chip ${t.status==='resolved'?'g':t.status==='in_progress'?'y':'r'}">${esc(String(t.status).replace('_',' '))}</span></div>
  <div class="mut sm" style="margin:4px 0;overflow-wrap:anywhere">${esc(t.name||'(no name yet)')} · ${esc(t.email||'')} · Card <code>${esc(t.card_uid||'none')}</code> · ${new Date(t.created_at).toLocaleString()}</div>
  <div style="white-space:pre-wrap;margin:8px 0;overflow-wrap:anywhere">${esc(t.message)}</div>
  ${urls[t.id]?`<a href="${urls[t.id]}" target="_blank" rel="noopener"><img src="${urls[t.id]}" alt="Attached picture" style="max-width:100%;max-height:200px;border-radius:12px;margin:6px 0"></a>`:''}
  ${t.staff_reply?`<div class="mut sm">Last reply: ${esc(t.staff_reply)}</div>`:''}
  ${REP_VIEW==='active'?`<div class="fld" style="margin:10px 0"><label for="r-${esc(t.id)}">Reply (the customer sees it in their notifications)</label><textarea id="r-${esc(t.id)}" placeholder="Write a reply…"></textarea></div>
  <div class="row"><button class="btn sm" data-tk="reply" data-id="${esc(t.id)}" data-s="${esc(t.status)}">Send reply</button><button class="btn sm" data-tk="in_progress" data-id="${esc(t.id)}">In progress</button><button class="btn sm pri" data-tk="resolved" data-id="${esc(t.id)}">Resolved</button></div>`:''}
  ${t.card_uid&&REP_VIEW==='active'?`<div class="row" style="margin-top:10px"><span class="mut sm">Card:</span><a class="btn sm" target="_blank" rel="noopener" href="${BASE}?card=${encodeURIComponent(t.card_uid)}&nt=1">Open</a><button class="btn sm" data-tk="block" data-u="${esc(t.card_uid)}" data-v="${!t.card_disabled}">${t.card_disabled?'Unblock':'Block'}</button>${t.card_claimed?`<button class="btn sm dng" data-tk="reset" data-u="${esc(t.card_uid)}">Reset</button>`:''}</div>`:''}
  <div class="row" style="margin-top:12px;border-top:1px solid var(--line);padding-top:12px"><button class="btn sm" data-tk="${REP_VIEW==='active'?'archive':'restore'}" data-id="${esc(t.id)}">${ic('archive')}${REP_VIEW==='active'?'Archive':'Restore'}</button><button class="btn sm dng" data-tk="delete" data-id="${esc(t.id)}">${ic('trash')}Delete</button></div></div>`).join('')+'</div>':`<div class="empty">${REP_VIEW==='active'?'No reports here. Nice and quiet.':'Nothing archived.'}</div>`);
}
$('p-rep').addEventListener('click',async e=>{
  const v=e.target.closest('[data-v]');if(v){REP_VIEW=v.dataset.v;REP_FILTER='all';loadReports();return}
  const f=e.target.closest('[data-f]');if(f){REP_FILTER=f.dataset.f;drawReports();return}
  const b=e.target.closest('button[data-tk]');if(!b)return;const k=b.dataset.tk,id=b.dataset.id;
  if(k==='block'){await rpc('set_card_disabled',{p_uid:b.dataset.u,p_disabled:b.dataset.v==='true'},'Done')}
  else if(k==='reset'){if(!await confirmBox('Reset '+b.dataset.u+'?','The owner loses this card.','Reset card',true))return;await rpc('admin_reset_card',{p_uid:b.dataset.u},'Card reset')}
  else if(k==='archive'||k==='restore'){await rpc('admin_ticket_archive',{p_id:id,p_archive:k==='archive'},k==='archive'?'Archived':'Restored')}
  else if(k==='delete'){if(!await confirmBox('Delete this report?','It is removed for good, including the attached picture. Archive it instead if you may need it later.','Delete forever',true))return;await rpc('admin_ticket_delete',{p_id:id},'Deleted')}
  else{const reply=($('r-'+id)||{}).value||'';await rpc('admin_ticket_update',{p_id:id,p_status:k==='reply'?b.dataset.s:k,p_reply:reply},k==='reply'?'Reply sent':'Updated')}
  loadReports();
});
