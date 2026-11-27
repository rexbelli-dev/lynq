/* js/legal-i18n.js
   Terms/Privacy sheet, account check, English/Tagalog/Bisaya wording, claim confirmation.
   (Part of LYNQ 2027. See README.md, 'Where to change what'.) */
/* ---------- Terms / Privacy sheet (with "agree first" mode) ---------- */
let needAgree=false;
const termsOk=()=>localStorage.getItem('lynq_terms_2027')==='1';
function openLegal(kind,agree){
  const p=kind==='privacy';needAgree=!!agree;
  $('legalTitle').textContent=p?'Privacy Policy':'Terms of Use';
  $('legalBody').innerHTML=$(p?'tplPrivacy':'tplTerms').innerHTML;$('legalBody').scrollTop=0;
  $('legalClose').textContent=agree?'I Agree & Continue':'Close';$('legalX').style.display=agree?'none':'';
  $('legal').classList.add('open');
}
const closeLegal=()=>$('legal').classList.remove('open');
document.addEventListener('click',e=>{const a=e.target.closest('[data-legal]');if(a){e.preventDefault();openLegal(a.dataset.legal)}});
$('legalClose').onclick=()=>{if(needAgree){localStorage.setItem('lynq_terms_2027','1');needAgree=false}closeLegal()};
$('legalX').onclick=closeLegal;
$('legal').addEventListener('click',e=>{if(e.target.id==='legal'&&!needAgree)closeLegal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!needAgree)closeLegal()});

/* resolves once the user has agreed (instantly if already agreed in this browser) */
function askTerms(){return new Promise(r=>{
  if(termsOk())return r();
  openLegal('terms',true);const c=$('legalClose'),old=c.onclick;
  c.onclick=()=>{old();c.onclick=old;r()};
})}

/* ---------- does this signed-in Google account have a LYNQ account? ---------- */
let curSession=null,myUid=null,myCount=0,hasAccount=false,isStaff=false,curVerified='',curHandle='',curRef='',offline=false;
async function checkAccount(){
  const uid=curSession.user.id;
  const[c,pr]=await Promise.all([
    supabaseClient.from('nfc_cards').select('nfc_uid').eq('user_id',uid).order('created_at'),
    supabaseClient.from('profiles').select('user_id').eq('user_id',uid).maybeSingle()]);
  if(c.error||pr.error)return false;            // unknown (e.g. weak signal): never treat as "no account"
  myUid=c.data&&c.data[0]?c.data[0].nfc_uid:null;myCount=c.data?c.data.length:0;
  hasAccount=!!(myUid||pr.data);
  return true;
}

/* ---------- languages: English, Tagalog, Bisaya (claim screen + walkthrough) ---------- */
let LANG=localStorage.getItem('lynq_lang')||(/^(fil|tl)/i.test(navigator.language||'')?'tl':'en');
const LG='<a href="#" data-legal="terms">Terms</a>',LP='<a href="#" data-legal="privacy">Privacy Policy</a>';
const I18N={
 en:{claimT:'Claim your LYNQ card',claimP:'Sign in once to activate your card.',s1t:'Sign in with Google',s1d:'Tap Continue with Google to claim ownership.',s2t:'Build your profile',s2d:'Add your photo, links and contact details.',google:'Continue with Google',
  fine:`By signing in, you agree to our ${LG} and ${LP}. We only use your Google account to secure your card.`,
  ccT:'Claim this card?',ccHas:n=>`Your account already has ${n} LYNQ card${n>1?'s':''}. Are you sure you also want to claim this card?`,ccNew:'You are about to become the owner of this LYNQ card.',ccYes:'Claim this card',ccNoHas:'No, take me to my profile',ccNoNew:'Not now',
  next:'Next',back:'Back',skip:'Skip',done:'Done',step:'Step',of:'of'},
 tl:{claimT:'I-claim ang iyong LYNQ card',claimP:'Mag-sign in nang isang beses para ma-activate ang card mo.',s1t:'Mag-sign in gamit ang Google',s1d:'I-tap ang Continue with Google para maging may-ari ng card.',s2t:'Buuin ang iyong profile',s2d:'Magdagdag ng litrato, mga link, at contact details.',google:'Magpatuloy gamit ang Google',
  fine:`Sa pag-sign in, sumasang-ayon ka sa aming ${LG} at ${LP}. Ginagamit lang namin ang Google account mo para protektahan ang card mo.`,
  ccT:'I-claim ang card na ito?',ccHas:n=>`May ${n} LYNQ card na ang account mo. Sigurado ka bang gusto mo ring i-claim ang card na ito?`,ccNew:'Ikaw ang magiging may-ari ng LYNQ card na ito.',ccYes:'I-claim ang card na ito',ccNoHas:'Hindi, dalhin ako sa profile ko',ccNoNew:'Hindi muna',
  next:'Susunod',back:'Bumalik',skip:'Laktawan',done:'Tapos na',step:'Hakbang',of:'sa'},
 ceb:{claimT:'I-claim ang imong LYNQ card',claimP:'Mag-sign in kausa aron ma-activate ang imong card.',s1t:'Mag-sign in gamit ang Google',s1d:'I-tap ang Continue with Google aron mahimong tag-iya sa card.',s2t:'Buhaton ang imong profile',s2d:'Pagdugang og litrato, links, ug contact details.',google:'Padayon gamit ang Google',
  fine:`Sa pag-sign in, mouyon ka sa among ${LG} ug ${LP}. Gamiton ra namo ang imong Google account aron mapanalipdan ang imong card.`,
  ccT:'I-claim kini nga card?',ccHas:n=>`Naa nay ${n} ka LYNQ card ang imong account. Sigurado ka ba nga gusto nimo i-claim usab kini nga card?`,ccNew:'Ikaw na ang mahimong tag-iya niining LYNQ card.',ccYes:'I-claim kini nga card',ccNoHas:'Dili, dad-a ko sa akong profile',ccNoNew:'Dili pa',
  next:'Sunod',back:'Balik',skip:'Laktawi',done:'Human na',step:'Lakang',of:'sa'}
};
const T=k=>{const v=(I18N[LANG]&&I18N[LANG][k]);return v!==undefined?v:I18N.en[k]};
const LANGROW='<a href="#" data-lang="en">English</a> · <a href="#" data-lang="tl">Tagalog</a> · <a href="#" data-lang="ceb">Bisaya</a>';
const TOURX={
 tl:[['Maligayang pagdating sa editor mo','Ipapakita ng mabilis na tour na ito kung nasaan ang lahat. Mga isang minuto lang.'],
  ['Mga larawan','Dito mo ilalagay ang profile photo at cover mo. I-tap ang Remove kung magbabago ang isip mo.'],
  ['Hitsura','Pumili ng theme o gumawa ng sarili mong kulay. Puwede mo itong palitan anumang oras.'],
  ['Tungkol sa iyo','Ilagay ang lokasyon, mga wika, at hilig mo. I-tap ang pangalan o bio sa itaas ng page para direktang i-edit.'],
  ['Contact at bayad','Ilagay ang phone, email, at GCash o Maya QR mo para ma-contact at mabayaran ka ng mga tao.'],
  ['Edukasyon at trabaho','Ibahagi kung saan ka nag-aral at nagtatrabaho. Nandito lang ang Education at Work experience.'],
  ['Magdagdag ng link','Idagdag ang Instagram, Facebook, WhatsApp, website mo, at iba pa. I-tap ang × sa link para alisin ito.'],
  ['May ibinebenta ka ba?','I-on ang Business mode para maglista ng serbisyo o produkto na may presyo at larawan, magdagdag ng Book o Order button, at magpakita ng status badge.'],
  ['Share link mo','Pumili ng maikling username para i-share online. Ang card mo ay bubukas pa rin gamit ang sarili nitong serial number.'],
  ['I-save at i-publish','Walang mapa-publish hangga\'t hindi mo ito pinipindot. Gawin ito kapag tapos ka na.'],
  ['Handa ka na!','Buksan ang menu (kanang itaas) anumang oras para sa My cards, Analytics, at iba pa. Puwede mong ulitin ang tour na ito sa menu sa ilalim ng Tutorial.']],
 ceb:[['Maayong pag-abot sa imong editor','Ipakita sa kuwik nga tour kung asa ang tanan. Mga usa ka minuto ra.'],
  ['Mga hulagway','Diri nimo ibutang ang imong profile photo ug cover. I-tap ang Remove kung mausab imong hunahuna.'],
  ['Dagway','Pili og theme o paghimo og imong kaugalingong kolor. Mabalhin nimo kini bisan kanus-a.'],
  ['Bahin kanimo','Ibutang ang imong lokasyon, mga pinulongan, ug mga hilig. I-tap ang imong ngalan o bio sa ibabaw sa page aron direktang ma-edit.'],
  ['Contact ug bayad','Ibutang ang imong phone, email, ug GCash o Maya QR aron ma-contact ka ug mabayran sa mga tawo.'],
  ['Edukasyon ug trabaho','Ipakigbahin kung asa ka nag-eskwela ug nagtrabaho. Naa ra diri ang Education ug Work experience.'],
  ['Pagdugang og link','Idugang ang Instagram, Facebook, WhatsApp, imong website, ug uban pa. I-tap ang × sa link aron kini tangtangon.'],
  ['Naay gibaligya?','I-on ang Business mode aron maglista og serbisyo o produkto nga naay presyo ug hulagway, magdugang og Book o Order button, ug magpakita og status badge.'],
  ['Imong share link','Pili og mubo nga username aron i-share online. Ang imong card maabli gihapon gamit ang kaugalingon niyang serial number.'],
  ['I-save ug i-publish','Walay mapa-publish hangtod dili nimo kini pinduton. Buhata kini kung human ka na.'],
  ['Human na ka!','Ablihi ang menu (tuo sa ibabaw) bisan kanus-a para sa My cards, Analytics, ug uban pa. Mahimo nimo balikon kini nga tour sa menu ubos sa Tutorial.']]
};

/* ---------- "Claim this card?" confirmation ---------- */
function confirmClaim(uid){return new Promise(res=>{
  const n=myCount;
  flowShow(`${CARD_HTML}<h2>${T('ccT')}</h2>
  <p>${n>0?T('ccHas')(n):T('ccNew')}</p>
  <p class="fine">Card ${esc(uid)}</p>
  <button class="gbtn primary" id="ccYes">${T('ccYes')}</button>
  <button class="ghost" id="ccNo">${n>0?T('ccNoHas'):T('ccNoNew')}</button>`);
  $('ccYes').onclick=()=>res(true);$('ccNo').onclick=()=>res(false);
})}

