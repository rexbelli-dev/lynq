/* js/admin-money.js
   Monitoring (founders only): sales, expenses, loans and repayments, with the same math as the old
   LYNQ Sales & Profit Tracker spreadsheet. Everything is saved in Supabase (tables fin_entries, fin_settings). */

const LOAN_IN='We borrowed',LOAN_OUT='Someone borrowed from us';
let FIN={settings:{},rows:[]},FT='sum',FM='all',FQ='';
LOADERS.money=loadMoney;

/* ---------- the math ---------- */
function computeMoney(rows,S){
  S=S||{};const open=+S.opening_cash||0,shares=S.shares||{};
  const by=k=>rows.filter(r=>r.kind===k),sales=by('sale'),exps=by('expense'),loans=by('loan'),reps=by('repayment');
  const loanBy={};loans.forEach(l=>loanBy[l.id]=l);
  const keys=rows.map(r=>String(r.entry_date).slice(0,7));
  let lo='2026-11',hi='2027-12';keys.forEach(k=>{if(k<lo)lo=k;if(k>hi)hi=k});
  const months=[];let[y,m]=lo.split('-').map(Number);
  while(y+'-'+String(m).padStart(2,'0')<=hi){months.push({k:y+'-'+String(m).padStart(2,'0'),cards:0,sales:0,exp:0,net:0,borrowed:0,repOut:0,lent:0,repIn:0,move:0,bal:0});if(++m>12){m=1;y++}}
  const at={};months.forEach(x=>at[x.k]=x);
  const mk=r=>at[String(r.entry_date).slice(0,7)];
  sales.forEach(r=>{const x=mk(r);if(x){x.cards+=+r.qty||0;x.sales+=+r.amount||0}});
  exps.forEach(r=>{const x=mk(r);if(x)x.exp+=+r.amount||0});
  loans.forEach(r=>{const x=mk(r);if(x){if(r.category===LOAN_IN)x.borrowed+=+r.amount||0;else x.lent+=+r.amount||0}});
  reps.forEach(r=>{const x=mk(r),l=loanBy[r.loan_id];if(x&&l){if(l.category===LOAN_IN)x.repOut+=+r.amount||0;else x.repIn+=+r.amount||0}});
  let bal=open;const t={cards:0,sales:0,exp:0,net:0,borrowed:0,repOut:0,lent:0,repIn:0};
  months.forEach(x=>{x.net=x.sales-x.exp;x.move=x.sales+x.borrowed+x.repIn-x.exp-x.repOut-x.lent;bal+=x.move;x.bal=bal;Object.keys(t).forEach(k=>t[k]+=x[k])});
  const loanList=loans.map(l=>{const paid=reps.filter(r=>r.loan_id===l.id).reduce((a,r)=>a+(+r.amount||0),0),balance=(+l.amount||0)-paid;
    return Object.assign({},l,{paid,balance,status:balance<=0?'Paid':(l.due_date&&l.due_date<today()?'Overdue':'Open')})});
  const sumLoans=(dir)=>loanList.filter(l=>l.category===dir).reduce((a,l)=>a+(+l.amount||0),0);
  const owe=sumLoans(LOAN_IN)-t.repOut,owed=sumLoans(LOAN_OUT)-t.repIn;
  const byCat={};exps.forEach(r=>{const k=r.category||'Other';byCat[k]=(byCat[k]||0)+(+r.amount||0)});
  const sh={};Object.keys(shares).forEach(n=>sh[n]=t.net*(+shares[n]||0));
  return{months,t,cash:bal,owe,owed,shares:sh,byCat,loanList,loanBy};
}

/* ---------- page ---------- */
async function loadMoney(){
  const p=$('p-money');if(!p.dataset.ready)p.innerHTML=pageHead('Monitoring','Sales, expenses and loans')+'<div class="empty">Loading…</div>';
  const{data,error}=await sb.rpc('fin_list');
  if(error||!data){p.innerHTML=pageHead('Monitoring','')+'<div class="empty">Could not load. Only founders can open this page, and sql/4-admin-dashboard.sql must be run once.</div>';return}
  p.dataset.ready=1;FIN=data;drawMoney();
}
function drawMoney(){
  const p=$('p-money'),M=computeMoney(FIN.rows,FIN.settings);
  const tabs=[['sum','Summary'],['sale','Sales'],['expense','Expenses'],['loan','Loans'],['set','Settings']];
  p.innerHTML=pageHead('Monitoring','Replaces the Sales &amp; Profit Tracker spreadsheet',`<button class="btn pri" data-add="sale">${ic('plus')}Sale</button><button class="btn" data-add="expense">${ic('plus')}Expense</button><button class="btn" data-add="loan">${ic('plus')}Loan</button>`)+
  `<div class="seg" style="margin-bottom:16px" role="tablist">${tabs.map(([k,l])=>`<button role="tab" data-ft="${k}" class="${FT===k?'on':''}">${l}</button>`).join('')}</div><div id="mBody"></div>`;
  ({sum:()=>drawSummary(M),sale:()=>drawList('sale',M),expense:()=>drawList('expense',M),loan:()=>drawLoans(M),set:drawSettings})[FT]();
}
function drawSummary(M){
  const t=M.t,last=M.months.filter(x=>x.sales||x.exp||x.borrowed||x.lent||x.repIn||x.repOut);
  const from=Math.max(0,M.months.findIndex(x=>x.sales||x.exp||x.borrowed||x.lent||x.repIn||x.repOut)),nowK=today().slice(0,7);
  let upto=M.months.length-1;for(let i=M.months.length-1;i>=0;i--){const x=M.months[i];if(x.sales||x.exp||x.borrowed||x.lent||x.repIn||x.repOut||x.k<=nowK){upto=i;break}}
  const shown=M.months.slice(last.length?from:0,Math.max(upto+1,(last.length?from:0)+2));
  const shSum=Object.values(FIN.settings.shares||{}).reduce((a,b)=>a+(+b||0),0);
  $('mBody').innerHTML=`<div class="grid kpis">
   <div class="kpi"><span>Cards sold</span><b>${num(t.cards)}</b></div>
   <div class="kpi"><span>Total sales</span><b>${peso(t.sales)}</b></div>
   <div class="kpi"><span>Total expenses</span><b>${peso(t.exp)}</b></div>
   <div class="kpi hi ${t.net<0?'neg':''}"><span>Net profit</span><b>${peso(t.net)}</b><small>Sales minus expenses. Loans never count as profit.</small></div>
   <div class="kpi"><span>Cash on hand</span><b>${peso(M.cash)}</b></div>
   <div class="kpi"><span>We still owe</span><b>${peso(M.owe)}</b></div>
   <div class="kpi"><span>Owed to us</span><b>${peso(M.owed)}</b></div></div>
  <div class="grid two"><div class="card"><h3>Sales and expenses by month</h3>${barPairs(shown.map(x=>({x:mlabel(x.k),a:x.sales,b:x.exp})),['Sales','Expenses'],['#D6248F','#1B1220'])}</div>
  <div class="card"><h3>Profit share</h3>${Math.abs(shSum-1)>.001?`<div class="note">Shares add up to ${Math.round(shSum*100)}%, not 100%. Fix it in Settings.</div>`:''}
   <div class="rows">${Object.keys(M.shares).map(n=>`<div class="rr" style="grid-template-columns:1fr auto auto"><b>${esc(n)}</b><span class="mut sm">${Math.round((+FIN.settings.shares[n]||0)*1000)/10}%</span><b class="${M.shares[n]<0?'neg':''}">${peso(M.shares[n])}</b></div>`).join('')}</div>
   <h3 style="margin-top:18px">Where the money goes</h3>${hbars(Object.entries(M.byCat).sort((a,b)=>b[1]-a[1]).map(([k,n])=>({k,n})),peso,'#1B1220')}</div></div>
  <div class="card" style="margin-top:14px"><h3>Month by month <button class="btn sm" id="csvSum">${ic('download')}CSV</button></h3><div class="scroll"><table class="t"><thead><tr><th>Month</th><th>Cards</th><th>Sales</th><th>Expenses</th><th>Net profit</th><th>Borrowed in</th><th>Loans repaid</th><th>Lent out</th><th>Repaid to us</th><th>Cash balance</th></tr></thead><tbody>${shown.map(x=>`<tr><td>${mlabel(x.k)}</td><td>${num(x.cards)}</td><td>${peso(x.sales)}</td><td>${peso(x.exp)}</td><td class="${x.net<0?'neg':''}">${peso(x.net)}</td><td>${peso(x.borrowed)}</td><td>${peso(x.repOut)}</td><td>${peso(x.lent)}</td><td>${peso(x.repIn)}</td><td>${peso(x.bal)}</td></tr>`).join('')}<tr class="tot"><td>Total</td><td>${num(t.cards)}</td><td>${peso(t.sales)}</td><td>${peso(t.exp)}</td><td>${peso(t.net)}</td><td>${peso(t.borrowed)}</td><td>${peso(t.repOut)}</td><td>${peso(t.lent)}</td><td>${peso(t.repIn)}</td><td>${peso(M.cash)}</td></tr></tbody></table></div></div>`;
  $('csvSum').onclick=()=>download('lynq-monthly-summary.csv',toCSV(['Month','Cards sold','Sales','Expenses','Net profit','Borrowed in','Loans repaid','Lent out','Repaid to us','Cash balance'],M.months.map(x=>[x.k,x.cards,x.sales,x.exp,x.net,x.borrowed,x.repOut,x.lent,x.repIn,x.bal])));
}
function filt(kind){
  return FIN.rows.filter(r=>r.kind===kind&&(FM==='all'||String(r.entry_date).startsWith(FM))&&(!FQ||[r.label,r.category,r.paid_by,r.notes].join(' ').toLowerCase().includes(FQ.toLowerCase())));
}
function filters(kind){
  const ms=[...new Set(FIN.rows.filter(r=>r.kind===kind).map(r=>String(r.entry_date).slice(0,7)))].sort().reverse();
  return`<div class="row" style="margin-bottom:12px"><select id="fMonth" aria-label="Month" style="width:auto"><option value="all">All months</option>${ms.map(m=>`<option value="${m}"${FM===m?' selected':''}>${mlabel(m)}</option>`).join('')}</select><input id="fQ" placeholder="Search" aria-label="Search" value="${esc(FQ)}" style="flex:1;min-width:140px"><button class="btn" id="csvList">${ic('download')}CSV</button></div>`;
}
const actBtns=id=>`<span class="act row" style="justify-content:flex-end;gap:6px"><button class="btn sm" data-edit="${id}" aria-label="Edit">${ic('edit')}</button><button class="btn sm dng" data-del="${id}" aria-label="Delete">${ic('trash')}</button></span>`;
function drawList(kind,M){
  const L=filt(kind),isS=kind==='sale',tot=L.reduce((a,r)=>a+(+r.amount||0),0),cols=isS?'96px 1fr 56px 84px 100px 100px 96px':'96px 1fr 1fr 110px 110px 96px';
  $('mBody').innerHTML=filters(kind)+`<div class="card"><h3>${isS?'Sales log':'Expenses log'} <span class="chip p">${L.length} · ${peso(tot)}</span></h3>${L.length?`<div class="rows">
   <div class="rr h" style="grid-template-columns:${cols}"><span>Date</span><span>${isS?'Customer / order':'What it was for'}</span>${isS?'<span class="n">Cards</span><span class="n">Unit price</span><span class="n">Total</span><span>Paid via</span>':'<span>Category</span><span>Paid by</span><span class="n">Amount</span>'}<span></span></div>
   ${L.map(r=>isS?`<div class="rr" data-cols style="grid-template-columns:${cols}"><span data-l="Date">${dstr(r.entry_date)}</span><span data-l="Customer">${esc(r.label||'')}${r.notes?`<div class="mut sm">${esc(r.notes)}</div>`:''}</span><span class="n" data-l="Cards">${num(r.qty)}</span><span class="n" data-l="Unit price">${peso(r.unit_price)}</span><b class="n" data-l="Total">${peso(r.amount)}</b><span data-l="Paid via">${esc(r.category||'')}</span>${actBtns(r.id)}</div>`
     :`<div class="rr" data-cols style="grid-template-columns:${cols}"><span data-l="Date">${dstr(r.entry_date)}</span><span data-l="What for">${esc(r.label||'')}${r.notes?`<div class="mut sm">${esc(r.notes)}</div>`:''}</span><span data-l="Category">${esc(r.category||'')}</span><span data-l="Paid by">${esc(r.paid_by||'')}</span><b class="n" data-l="Amount">${peso(r.amount)}</b>${actBtns(r.id)}</div>`).join('')}</div>`:`<div class="empty">No ${isS?'sales':'expenses'} yet. Tap “+ ${isS?'Sale':'Expense'}” above.</div>`}</div>`;
  $('csvList').onclick=()=>download('lynq-'+kind+'s.csv',toCSV(isS?['Date','Customer','Cards','Unit price','Total','Paid via','Notes']:['Date','What for','Category','Paid by','Amount','Notes'],L.map(r=>isS?[r.entry_date,r.label,r.qty,r.unit_price,r.amount,r.category,r.notes]:[r.entry_date,r.label,r.category,r.paid_by,r.amount,r.notes])));
}
function drawLoans(M){
  const L=M.loanList.filter(l=>(FM==='all'||String(l.entry_date).startsWith(FM))&&(!FQ||[l.label,l.notes].join(' ').toLowerCase().includes(FQ.toLowerCase())));
  const P=FIN.rows.filter(r=>r.kind==='repayment').sort((a,b)=>String(b.entry_date).localeCompare(String(a.entry_date)));
  const cols='92px 1fr 130px 100px 100px 100px 84px';
  $('mBody').innerHTML=filters('loan')+`<div class="grid kpis"><div class="kpi"><span>We still owe</span><b>${peso(M.owe)}</b></div><div class="kpi"><span>Owed to us</span><b>${peso(M.owed)}</b></div></div>
  <div class="card"><h3>Loans <span class="chip p">${L.length}</span></h3>${L.length?`<div class="rows"><div class="rr h" style="grid-template-columns:${cols}"><span>Date</span><span>Person</span><span>Direction</span><span class="n">Amount</span><span class="n">Paid back</span><span class="n">Balance</span><span>Status</span></div>
  ${L.map(l=>`<div class="rr" data-cols style="grid-template-columns:${cols}"><span data-l="Date">${dstr(l.entry_date)}</span><span data-l="Person">${esc(l.label||'')}${l.due_date?`<div class="mut sm">Due ${dstr(l.due_date)}</div>`:''}${l.notes?`<div class="mut sm">${esc(l.notes)}</div>`:''}</span><span data-l="Direction">${esc(l.category)}</span><span class="n" data-l="Amount">${peso(l.amount)}</span><span class="n" data-l="Paid back">${peso(l.paid)}</span><b class="n" data-l="Balance">${peso(l.balance)}</b><span data-l="Status"><span class="chip ${l.status==='Paid'?'g':l.status==='Overdue'?'r':'y'}">${l.status}</span></span>
   <span class="act row" style="grid-column:1/-1;justify-content:flex-end;gap:6px">${l.status!=='Paid'?`<button class="btn sm pri" data-pay="${l.id}">${ic('plus')}Payment</button>`:''}<button class="btn sm" data-edit="${l.id}" aria-label="Edit">${ic('edit')}</button><button class="btn sm dng" data-del="${l.id}" aria-label="Delete">${ic('trash')}</button></span></div>`).join('')}</div>`:'<div class="empty">No loans yet. Tap “+ Loan” above.</div>'}</div>
  <div class="card"><h3>Payments <span class="chip p">${P.length}</span></h3>${P.length?`<div class="rows">${P.map(r=>{const l=M.loanBy[r.loan_id]||{};return`<div class="rr" data-cols style="grid-template-columns:96px 1fr 130px 110px 84px"><span data-l="Date">${dstr(r.entry_date)}</span><span data-l="Person">${esc(l.label||'')}${r.notes?`<div class="mut sm">${esc(r.notes)}</div>`:''}</span><span data-l="Direction">${esc(l.category||'')}</span><b class="n" data-l="Amount">${peso(r.amount)}</b>${actBtns(r.id)}</div>`}).join('')}</div>`:'<div class="empty">No payments yet.</div>'}</div>`;
  $('csvList').onclick=()=>download('lynq-loans.csv',toCSV(['Date','Person','Direction','Amount','Due date','Paid back','Balance','Status','Notes'],M.loanList.map(l=>[l.entry_date,l.label,l.category,l.amount,l.due_date,l.paid,l.balance,l.status,l.notes])));
}
function drawSettings(){
  const S=FIN.settings,sh=S.shares||{},ls=k=>(S[k]||[]).join('\n');
  $('mBody').innerHTML=`<div class="grid two" style="align-items:start">
  <div class="card"><h3>Basics</h3><div class="form"><div class="fld"><label for="sPrice">Card price (₱)</label><input id="sPrice" type="number" step="0.01" min="0" value="${+S.card_price||0}"></div><div class="fld"><label for="sOpen">Opening cash on hand (₱)</label><input id="sOpen" type="number" step="0.01" value="${+S.opening_cash||0}"></div></div><button class="btn pri" id="saveBasics" style="margin-top:12px">Save</button><div class="mut sm" style="margin-top:8px">Opening cash is the cash plus e-wallet money you hold at the start. The card price fills in new sales (you can still change it per sale).</div></div>
  <div class="card"><h3>Profit shares</h3><div id="shRows" class="form">${Object.keys(sh).map(n=>`<div class="fld"><label>${esc(n)} (%)</label><input type="number" step="0.1" min="0" max="100" data-sh="${esc(n)}" value="${Math.round((+sh[n]||0)*1000)/10}"></div>`).join('')}</div>
  <div class="row" style="margin-top:12px"><button class="btn pri" id="saveShares">Save shares</button></div><div class="mut sm" style="margin-top:8px">Must add up to 100. The old sheet used Rex 50% and Jim 50%. Set what your founders’ agreement says now that Maverick is a founder.</div></div>
  <div class="card"><h3>Expense categories</h3><div class="fld"><label for="sCats">One per line</label><textarea id="sCats" rows="8">${esc(ls('categories'))}</textarea></div><button class="btn pri" id="saveCats" style="margin-top:12px">Save</button></div>
  <div class="card"><h3>Paid via and Paid by lists</h3><div class="fld"><label for="sPay">Payment methods (one per line)</label><textarea id="sPay" rows="4">${esc(ls('pay_methods'))}</textarea></div><div class="fld" style="margin-top:10px"><label for="sPayers">Who pays expenses (one per line)</label><textarea id="sPayers" rows="4">${esc(ls('payers'))}</textarea></div><button class="btn pri" id="saveLists" style="margin-top:12px">Save</button></div></div>`;
}
const lines=v=>v.split('\n').map(s=>s.trim()).filter(Boolean);
async function setSetting(k,v,msg){const r=await rpc('fin_set_setting',{p_key:k,p_value:v},msg||'Saved');if(!r.error){FIN.settings[k]=v}return r}

/* ---------- add / edit form ---------- */
function openEntry(kind,row,presetLoan){
  const S=FIN.settings,r=row||{},T={sale:'sale',expense:'expense',loan:'loan',repayment:'payment'}[kind],opt=(arr,v)=>(arr||[]).map(x=>`<option${x===v?' selected':''}>${esc(x)}</option>`).join('');
  let f=`<div class="fld"><label for="f_date">Date</label><input id="f_date" type="date" value="${esc(String(r.entry_date||today()).slice(0,10))}"></div>`;
  if(kind==='sale')f+=`<div class="fld"><label for="f_label">Customer / order</label><input id="f_label" value="${esc(r.label||'')}" placeholder="e.g. Juan Dela Cruz"></div>
   <div class="fld"><label for="f_qty">Cards sold</label><input id="f_qty" type="number" min="1" step="1" value="${r.qty||1}"></div>
   <div class="fld"><label for="f_unit">Unit price (₱)</label><input id="f_unit" type="number" min="0" step="0.01" value="${r.unit_price!=null?r.unit_price:(+S.card_price||0)}"></div>
   <div class="fld full"><b id="f_tot"></b></div>
   <div class="fld"><label for="f_cat">Paid via</label><select id="f_cat">${opt(S.pay_methods,r.category)}</select></div>`;
  if(kind==='expense')f+=`<div class="fld"><label for="f_cat">Category</label><select id="f_cat">${opt(S.categories,r.category)}</select></div>
   <div class="fld full"><label for="f_label">What was it for?</label><input id="f_label" value="${esc(r.label||'')}" placeholder="e.g. 50 NFC card blanks"></div>
   <div class="fld"><label for="f_amt">Amount (₱)</label><input id="f_amt" type="number" min="0" step="0.01" value="${r.amount||''}"></div>
   <div class="fld"><label for="f_by">Paid by</label><select id="f_by">${opt(S.payers,r.paid_by)}</select></div>`;
  if(kind==='loan')f+=`<div class="fld"><label for="f_label">Person</label><input id="f_label" value="${esc(r.label||'')}" placeholder="Who lent or borrowed?"></div>
   <div class="fld"><label for="f_cat">Direction</label><select id="f_cat"><option${r.category===LOAN_IN?' selected':''}>${LOAN_IN}</option><option${r.category===LOAN_OUT?' selected':''}>${LOAN_OUT}</option></select></div>
   <div class="fld"><label for="f_amt">Amount (₱)</label><input id="f_amt" type="number" min="0" step="0.01" value="${r.amount||''}"></div>
   <div class="fld"><label for="f_due">Due date (optional)</label><input id="f_due" type="date" value="${esc(r.due_date||'')}"></div>`;
  if(kind==='repayment'){const M=computeMoney(FIN.rows,FIN.settings),open=M.loanList.filter(l=>l.status!=='Paid'||l.id===r.loan_id),pick=r.loan_id||presetLoan;
    f+=`<div class="fld full"><label for="f_loan">Which loan?</label><select id="f_loan">${open.map(l=>`<option value="${l.id}"${l.id===pick?' selected':''}>${esc(l.label)} · ${esc(l.category)} · balance ${peso(l.balance)}</option>`).join('')}</select></div>
     <div class="fld"><label for="f_amt">Amount paid (₱)</label><input id="f_amt" type="number" min="0" step="0.01" value="${r.amount||''}"></div>`}
  f+=`<div class="fld full"><label for="f_notes">Notes (optional)</label><input id="f_notes" value="${esc(r.notes||'')}"></div>`;
  const o=modal(`<h2>${row?'Edit':'Add'} ${T}</h2><div class="form">${f}</div><div class="acts"><button class="btn" data-x="0">Cancel</button><button class="btn pri" id="f_save">Save</button></div>`);
  const tot=()=>{const el=o.querySelector('#f_tot');if(el)el.textContent='Total: '+peso((+o.querySelector('#f_qty').value||0)*(+o.querySelector('#f_unit').value||0))};
  if(kind==='sale'){o.querySelector('#f_qty').oninput=o.querySelector('#f_unit').oninput=tot;tot()}
  o.addEventListener('click',async e=>{
    if(e.target.closest('[data-x]'))return o.close();
    if(!e.target.closest('#f_save'))return;
    const g=id=>{const el=o.querySelector('#'+id);return el?el.value:''},p={id:r.id||'',kind,entry_date:g('f_date'),notes:g('f_notes')};
    if(kind==='sale'){p.label=g('f_label');p.qty=g('f_qty');p.unit_price=g('f_unit');p.amount=(+p.qty||0)*(+p.unit_price||0);p.category=g('f_cat');if(!(+p.qty>0))return toast('Enter how many cards',true)}
    else{p.amount=g('f_amt');if(!(+p.amount>0))return toast('Enter an amount',true)}
    if(kind==='expense'){p.label=g('f_label');p.category=g('f_cat');p.paid_by=g('f_by')}
    if(kind==='loan'){p.label=g('f_label');p.category=g('f_cat');p.due_date=g('f_due');if(!p.label.trim())return toast('Who is the loan with?',true)}
    if(kind==='repayment'){p.loan_id=g('f_loan');if(!p.loan_id)return toast('Pick a loan first',true)}
    const res=await rpc('fin_save',{p},row?'Saved':'Added');if(res.error)return;o.close();loadMoney();
  });
}

/* ---------- clicks ---------- */
$('p-money').addEventListener('click',async e=>{
  const a=e.target.closest('[data-add]');if(a)return openEntry(a.dataset.add);
  const t=e.target.closest('[data-ft]');if(t){FT=t.dataset.ft;FM='all';FQ='';return drawMoney()}
  const pay=e.target.closest('[data-pay]');if(pay)return openEntry('repayment',null,pay.dataset.pay);
  const ed=e.target.closest('[data-edit]');if(ed){const r=FIN.rows.find(x=>x.id===ed.dataset.edit);return r&&openEntry(r.kind,r)}
  const dl=e.target.closest('[data-del]');
  if(dl){if(!await confirmBox('Delete this entry?','It is removed for good. Deleting a loan also deletes its payments.','Delete',true))return;const r=await rpc('fin_delete',{p_id:dl.dataset.del},'Deleted');if(!r.error)loadMoney();return}
  if(e.target.closest('#saveBasics')){await setSetting('card_price',+$('sPrice').value||0);await setSetting('opening_cash',+$('sOpen').value||0,'Saved');return}
  if(e.target.closest('#saveShares')){const o={};let s=0;document.querySelectorAll('[data-sh]').forEach(i=>{const v=(+i.value||0)/100;o[i.dataset.sh]=v;s+=v});
    if(Math.abs(s-1)>.0005)return toast('Shares must add up to 100% (now '+Math.round(s*1000)/10+'%)',true);return setSetting('shares',o)}
  if(e.target.closest('#saveCats'))return setSetting('categories',lines($('sCats').value));
  if(e.target.closest('#saveLists')){await setSetting('pay_methods',lines($('sPay').value));return setSetting('payers',lines($('sPayers').value))}
});
$('p-money').addEventListener('change',e=>{if(e.target.id==='fMonth'){FM=e.target.value;drawMoney()}});
$('p-money').addEventListener('input',e=>{if(e.target.id==='fQ'){FQ=e.target.value;const pos=e.target.selectionStart;drawMoney();const q=$('fQ');q&&(q.focus(),q.setSelectionRange(pos,pos))}});
