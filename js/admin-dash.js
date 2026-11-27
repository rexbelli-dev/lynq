/* js/admin-dash.js
   The Dashboard page: key numbers, statistics charts, money snapshot (founders), backup. */

let DASH_DAYS=30;
LOADERS.dash=loadDash;
async function loadDash(){
  const p=$('p-dash');
  if(!p.dataset.ready)p.innerHTML=pageHead('Dashboard','How LYNQ is doing')+'<div class="empty">Loading…</div>';
  const[st,ins,fin]=await Promise.all([sb.rpc('admin_stats'),sb.rpc('admin_insights',{p_days:DASH_DAYS}),isFounder()?sb.rpc('fin_list'):Promise.resolve({})]);
  const s=st.data,i=ins.data;
  if(!s){p.innerHTML=pageHead('Dashboard','')+'<div class="empty">Could not load. Check your connection and the SQL step.</div>';return}
  p.dataset.ready=1;OPENREP=(i&&i.open_reports)||0;buildNav();
  const claimedPct=s.cards?Math.round(100*s.claimed/s.cards):0;
  const last=+localStorage.getItem('lynq_last_backup')||0,days=last?Math.floor((Date.now()-last)/864e5):null,warn=days===null||days>=7;
  let money='';
  if(fin.data){
    const M=computeMoney(fin.data.rows,fin.data.settings);
    money=`<h2 style="margin:6px 0 10px">Money</h2><div class="grid kpis">
      <div class="kpi"><span>Total sales</span><b>${peso(M.t.sales)}</b><small>${num(M.t.cards)} cards sold</small></div>
      <div class="kpi"><span>Total expenses</span><b>${peso(M.t.exp)}</b></div>
      <div class="kpi ${M.t.net<0?'neg':''}"><span>Net profit</span><b>${peso(M.t.net)}</b></div>
      <div class="kpi hi"><span>Cash on hand</span><b>${peso(M.cash)}</b><small>We owe ${peso(M.owe)} · Owed to us ${peso(M.owed)}</small></div></div>`;
  }
  const taps=(i&&i.taps_by_day)||[],sign=(i&&i.signups_by_day)||[];
  const sumTaps=taps.reduce((a,d)=>a+d.n,0),sumSign=sign.reduce((a,d)=>a+d.n,0);
  p.innerHTML=pageHead('Dashboard','How LYNQ is doing',`<div class="seg" role="group" aria-label="Time range">${[7,30,90].map(d=>`<button data-days="${d}" class="${d===DASH_DAYS?'on':''}">${d} days</button>`).join('')}</div>`)+
  `<div class="grid kpis">
    <div class="kpi hi"><span>Cards made</span><b>${num(s.cards)}</b><small>${num(s.claimed)} claimed (${claimedPct}%)</small></div>
    <div class="kpi"><span>Users</span><b>${num(s.users)}</b><small>${num(i&&i.verified||0)} verified · ${num(i&&i.business_profiles||0)} business</small></div>
    <div class="kpi"><span>Total taps</span><b>${num(s.taps)}</b><small>${num(sumTaps)} in last ${DASH_DAYS} days</small></div>
    <div class="kpi"><span>Open reports</span><b>${num(i&&i.open_reports||0)}</b><small><a href="#rep" data-go="rep">Go to reports</a></small></div>
  </div>${money}
  <div class="grid two" style="margin-top:14px">
    <div class="card"><h3>Taps per day <span class="chip p">${num(sumTaps)}</span></h3>${areaChart(taps,{label:'Taps per day'})}</div>
    <div class="card"><h3>New users per day <span class="chip p">${num(sumSign)}</span></h3>${areaChart(sign,{label:'New users per day',color:'#1B1220'})}</div>
    <div class="card"><h3>Card status</h3>${donut([{k:'Claimed',n:Math.max(0,s.claimed-(s.disabled||0)),c:'#D6248F'},{k:'Blocked',n:s.disabled||0,c:'#1B1220'},{k:'Unclaimed',n:s.unclaimed,c:'#E4D9CB'}])}</div>
    <div class="card"><h3>Most clicked links</h3>${hbars(((i&&i.top_links)||[]).map(x=>({k:x.platform,n:+x.n})))}</div>
    <div class="card"><h3>Themes in use</h3>${hbars(((i&&i.themes)||[]).map(x=>({k:x.k,n:+x.n})),null,'#1B1220')}</div>
    <div class="card"><h3>Busiest cards</h3>${hbars(((i&&i.top_cards)||[]).map(x=>({k:x.uid,n:+x.n})))}</div>
  </div>
  <div class="card" style="margin-top:14px"><h3>Backup</h3>
    <div class="${warn?'note':'note ok'}">${days===null?'No backup downloaded from this device yet.':'Last backup from this device: '+(days===0?'today':days+' day'+(days>1?'s':'')+' ago')+'.'}${warn?' Download one now and keep it somewhere private.':''}</div>
    <button class="btn pri" id="bkBtn">${ic('download')}Download backup (JSON)</button>
    <div class="mut sm" style="margin-top:8px">Photos stay in Supabase Storage and are not inside this file. Do this weekly and before big changes.</div></div>`;
}
$('p-dash').addEventListener('click',async e=>{
  const d=e.target.closest('[data-days]');if(d){DASH_DAYS=+d.dataset.days;loadDash();return}
  if(!e.target.closest('#bkBtn'))return;
  const{data,error}=await sb.rpc('admin_export');if(error||!data){toast('Could not export',true);return}
  download('lynq-backup-'+today()+'.json',JSON.stringify(data,null,1),'application/json');
  localStorage.setItem('lynq_last_backup',Date.now());toast('Backup downloaded');loadDash();
});
