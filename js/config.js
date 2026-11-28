/* js/config.js
   Database address, public key and links you may need to change.
   (Part of LYNQ 2027. See README.md, 'Where to change what'.) */

const SUPABASE_URL='https://cmiuramqfgwyumniedfv.supabase.co';
const SUPABASE_ANON_KEY='sb_publishable_yegka1PYoQm-U1dpEJJJHA_qbb1ujc6';
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
/* where "Get your own LYNQ card" sends people. A Messenger link works well: https://m.me/YOURPAGE (the ?ref= code shows up in your inbox) */
const COMMUNITY_URL='https://m.me/cm/o9AXOlYLAw4_DUXC/';   // LYNQ Messenger Community
const GET_LYNQ_URL='https://lynq.ph/shop';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>/^(https?:|mailto:|tel:)/i.test(u)?u:'https://'+u;

const ICONS={
  instagram:{label:"Instagram",color:"#E1306C",svg:'<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="7" r="1.3" fill="currentColor"/>'},
  facebook:{label:"Facebook",color:"#1877F2",svg:'<circle cx="12" cy="12" r="10" fill="currentColor"/><text x="12" y="17" font-size="13" fill="#fff" text-anchor="middle" font-family="Arial" font-weight="bold">f</text>'},
  whatsapp:{label:"WhatsApp",color:"#25D366",svg:'<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M8 16l1-3a5 5 0 1 1 2 2z" fill="none" stroke="#fff" stroke-width="1.6"/>'},
  messenger:{label:"Messenger",color:"#0084FF",svg:'<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7 14l3-3 2 2 3-3" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'},
  viber:{label:"Viber",color:"#7360F2",svg:'<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M8 16l1-3a5 5 0 1 1 2 2z" fill="none" stroke="#fff" stroke-width="1.6"/>'},
  telegram:{label:"Telegram",color:"#229ED9",svg:'<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M6 12l12-5-5 11-2-5z" fill="#fff"/>'},
  twitter:{label:"Twitter / X",color:"#111111",svg:'<rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor"/><text x="12" y="16" font-size="12" fill="#fff" text-anchor="middle" font-family="Arial" font-weight="bold">X</text>'},
  tiktok:{label:"TikTok",color:"#111111",svg:'<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M13 7v7a2.5 2.5 0 1 1-2-2.4" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M13 7c.3 1.6 1.4 2.6 3 2.8" fill="none" stroke="#fff" stroke-width="1.5"/>'},
  youtube:{label:"YouTube",color:"#FF0000",svg:'<rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor"/><path d="M10 9l6 3-6 3z" fill="#fff"/>'},
  linkedin:{label:"LinkedIn",color:"#0A66C2",svg:'<rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor"/><text x="12" y="16" font-size="9" fill="#fff" text-anchor="middle" font-family="Arial" font-weight="bold">in</text>'},
  website:{label:"Website",color:"#2E5395",svg:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" fill="none" stroke="currentColor" stroke-width="1.4"/>'},
  github:{label:"GitHub",color:"#181717",svg:'<circle cx="12" cy="12" r="10" fill="currentColor"/><text x="12" y="16" font-size="10" fill="#fff" text-anchor="middle" font-family="monospace" font-weight="bold">&lt;/&gt;</text>'}
};
const DEFAULT_STATE={name:"Your Name",bio:"Tap a link below to connect with me.",avatar:"",cover:"",coverOpacity:.55,themeKey:"clean-light",custom:{accent:"#D6248F",mode:"light"},layoutStyle:"list",iconStyle:"brand",photos:[],workCityCountry:"",showTaps:true,educationMilestones:[],languages:"",hobbies:"",phone:"",email:"",qrName:"",qrImage:"",work:[],links:[]};
let state=JSON.parse(JSON.stringify(DEFAULT_STATE));
let pendingLogo="",wizLogo="",editing=false,isOwner=false,currentCardUid=null,tapCount=0,justClaimed=false;
const EDU_RANKS={'Elementary':1,'Junior High':2,'Senior High':3,'College':4,'Masteral':5,'Doctoral':6};

const initials=()=>{const n=(state.name||'Your Name').trim().split(/\s+/);return ((n[0]||'?')[0]+(n.length>1?n[n.length-1][0]:'')).toUpperCase()};
function hideLoader(){const l=$('loadingScreen');if(l){l.style.opacity='0';setTimeout(()=>l.remove(),400)}}


/* Remembers "signed in" for the landing page (lynq.ph) so it can show "Go to your profile". Holds no login data. */
function setLoginFlag(on){
  try{
    if(!/(^|\.)lynq\.ph$/.test(location.hostname))return;
    document.cookie='lynq_in='+(on?'1':'')+'; domain=.lynq.ph; path=/; max-age='+(on?31536000:0)+'; SameSite=Lax; Secure';
  }catch(_e){}
}
