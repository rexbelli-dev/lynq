/* js/admin-team.js
   Team page (founders): who can open the admin app, and each person's profile with the cards they own.
   My profile page (everyone on the team). */

LOADERS.team=loadTeam;
async function loadTeam(){
  const p=$('p-team');p.innerHTML=pageHead('Team','People who can open this admin app')+'<div class="empty">Loading…</div>';
  const{data,error}=await sb.rpc('admin_team');
  if(error||!data){p.innerHTML=pageHead('Team','')+'<div class="empty">Could not load the team. Did you run sql/4-admin-dashboard.sql?</div>';return}
  p.innerHTML=pageHead('Team','People who can open this admin app')+
  `<div class="card"><h3>Add a person</h3><div class="form"><div class="fld"><label for="tmE">Their Google email</label><input id="tmE" type="email" inputmode="email" autocapitalize="off" placeholder="name@gmail.com"></div>
  <div class="fld"><label for="tmN">Name</label><input id="tmN" placeholder="Full name"></div>
  <div class="fld"><label for="tmR">Role</label><select id="tmR"><option value="staff">Staff (cards, users, reports)</option><option value="founder">Founder (also money and team)</option></select></div>
  <div class="fld" style="justify-content:flex-end"><button class="btn pri" id="tmAdd">${ic('plus')}Add to team</button></div></div>
  <div class="mut sm" style="margin-top:10px">They sign in at the admin page with exactly this Google account. Founders see the money pages and can manage the team.</div></div>
  <h2 style="margin:20px 0 12px">Profiles</h2><div class="grid people">${data.map(m=>{const me=m.email.toLowerCase()===ME.email.toLowerCase();return`<div class="card person" style="margin:0">
    <div class="top"><span class="av">${esc((m.name||m.email)[0].toUpperCase())}</span><div style="min-width:0"><b>${esc(m.name||'(no name yet)')}</b> ${me?'<span class="chip p">You</span>':''}<div class="mut sm" style="overflow-wrap:anywhere">${esc(m.email)}</div></div><span class="chip ${m.role==='founder'?'p':''}" style="margin-left:auto">${m.role==='founder'?'Founder':'Staff'}</span></div>
    <div><b>${num(m.cards)}</b> card${m.cards==1?'':'s'} owned</div>
    ${m.card_list&&m.card_list.length?`<div class="serials">${m.card_list.map(c=>`<a class="chip ${c.disabled?'r':'g'}" target="_blank" rel="noopener" href="${BASE}?card=${encodeURIComponent(c.uid)}&nt=1" title="${num(c.taps)} taps">${esc(c.uid)}</a>`).join('')}</div>`:'<div class="mut sm">No cards claimed with this email yet.</div>'}
    ${me?'':`<div class="row"><select data-role="${esc(m.email)}" aria-label="Role of ${esc(m.email)}" style="width:auto"><option value="staff"${m.role==='staff'?' selected':''}>Staff</option><option value="founder"${m.role==='founder'?' selected':''}>Founder</option></select><button class="btn sm dng" data-rm="${esc(m.email)}">${ic('trash')}Remove</button></div>`}
  </div>`}).join('')}</div>`;
}
$('p-team').addEventListener('click',async e=>{
  if(e.target.closest('#tmAdd')){const email=$('tmE').value.trim();if(!email)return toast('Type their email first',true);
    const r=await rpc('admin_team_add',{p_email:email,p_name:$('tmN').value,p_role:$('tmR').value},'Added to the team');if(!r.error)loadTeam();return}
  const rm=e.target.closest('[data-rm]');
  if(rm){if(!await confirmBox('Remove '+rm.dataset.rm+'?','They will no longer be able to open the admin app. Their own LYNQ profile and cards are not touched.','Remove',true))return;
    const r=await rpc('admin_team_remove',{p_email:rm.dataset.rm},'Removed');if(!r.error)loadTeam()}
});
$('p-team').addEventListener('change',async e=>{const s=e.target.closest('[data-role]');if(!s)return;
  const r=await rpc('admin_team_add',{p_email:s.dataset.role,p_name:'',p_role:s.value},'Role updated');loadTeam()});

/* ---------- my profile ---------- */
LOADERS.me=async()=>{
  const p=$('p-me');p.innerHTML=pageHead('My profile',esc(ME.email))+'<div class="empty">Loading…</div>';
  const{data:{session}}=await sb.auth.getSession();
  const{data}=await sb.from('nfc_cards').select('nfc_uid,tap_count,disabled').eq('user_id',session.user.id);
  const L=data||[];
  p.innerHTML=pageHead('My profile','')+`<div class="card person" style="max-width:640px"><div class="top"><span class="av">${esc((ME.name||ME.email||'?')[0].toUpperCase())}</span><div><b>${esc(ME.name||ME.email)}</b><div class="mut sm">${esc(ME.email)}</div></div><span class="chip ${isFounder()?'p':''}" style="margin-left:auto">${isFounder()?'Founder':'Staff'}</span></div>
  <div><b>${L.length}</b> card${L.length==1?'':'s'} owned</div>
  ${L.length?`<div class="rows">${L.map(c=>`<div class="rr" style="grid-template-columns:1fr auto auto"><code>${esc(c.nfc_uid)}</code><span class="mut sm">${num(c.tap_count)} taps</span><a class="btn sm" target="_blank" rel="noopener" href="${BASE}?card=${encodeURIComponent(c.nfc_uid)}&nt=1">Open</a></div>`).join('')}</div>`:'<div class="mut sm">You have not claimed a card with this Google account yet. Tap a card on your phone to claim it.</div>'}
  <div class="row"><a class="btn" href="./">${ic('back')}Open my LYNQ profile</a></div></div>`;
};
