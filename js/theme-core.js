/* js/theme-core.js
   Theme list and helpers. Loaded first, before the page draws.
   (Part of LYNQ 2027. See README.md, 'Where to change what'.) */

/* LYNQ team theme helpers: cover + badge are drawn in code (no image files needed) */
const svgURI=s=>'data:image/svg+xml,'+encodeURIComponent(s);
const CH='<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>';
const PAPER_PAT=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .11 0 0 0 0 .07 0 0 0 0 .13 0 0 0 .09 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`;
const THEMES={
 'clean-light':{bg:'#F6F2EC',card:'#FFFFFF',text:'#1d1820',sub:'#6b6470',accent:'#D6248F',cover:'linear-gradient(135deg,#D6248F,#8b1d6a)',border:'rgba(29,24,32,0.09)',wave:['#D6248F','#ff7ac2','#8b1d6a']},
 'black-gray':{bg:'#121212',card:'rgba(30,30,30,0.8)',text:'#f1f1f1',sub:'#a0a0a0',accent:'#888888',cover:'linear-gradient(135deg,#242424,#0d0d0d)',border:'rgba(255,255,255,0.12)',wave:['#6b7280','#e5e7eb','#9ca3af']},
 'white-pink':{bg:'#fff0f5',card:'rgba(255,255,255,0.8)',text:'#2d132c',sub:'#6b4c68',accent:'#d81b60',cover:'linear-gradient(135deg,#ff80bf,#ffb3d9)',border:'rgba(255,255,255,0.7)',wave:['#d81b60','#ff80bf','#ffc2dd']},
 'white-black':{bg:'#f8fafc',card:'rgba(255,255,255,0.85)',text:'#0f172a',sub:'#475569',accent:'#0f172a',cover:'linear-gradient(135deg,#334155,#0f172a)',border:'rgba(255,255,255,0.7)',wave:['#0f172a','#64748b','#cbd5e1']},
 'lgbt-pride':{bg:'#1a1025',card:'rgba(38,24,54,0.85)',text:'#ffffff',sub:'#d8b4fe',accent:'#ec4899',cover:'linear-gradient(90deg,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#a855f7)',border:'rgba(255,255,255,0.15)',wave:['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7']},
 'midnight-blue':{bg:'#090d16',card:'rgba(17,24,39,0.85)',text:'#f3f4f6',sub:'#9ca3af',accent:'#3b82f6',cover:'linear-gradient(135deg,#1e40af,#1e1b4b)',border:'rgba(255,255,255,0.12)',wave:['#3b82f6','#8b5cf6','#06b6d4']},
 'emerald-dark':{bg:'#061a14',card:'rgba(15,41,34,0.85)',text:'#ecfdf5',sub:'#6ee7b7',accent:'#10b981',cover:'linear-gradient(135deg,#047857,#064e3b)',border:'rgba(255,255,255,0.12)',wave:['#10b981','#34d399','#14b8a6','#a7f3d0']},
 'sunset-amber':{bg:'#1c120c',card:'rgba(43,28,20,0.85)',text:'#fffbeb',sub:'#fde68a',accent:'#f59e0b',cover:'linear-gradient(135deg,#d97706,#b45309)',border:'rgba(255,255,255,0.12)',wave:['#f59e0b','#ef4444','#fde68a']},
 /* ---- brand themes (assets go in /assets) ---- */
 'recon-tech':{bg:'#f3f8f4',card:'rgba(255,255,255,0.82)',text:'#14231a',sub:'#4a5d50',accent:'#1f6b34',cover:'linear-gradient(135deg,#1f6b34,#14391f)',border:'rgba(255,255,255,0.7)',wave:['#1f6b34','#4ade80','#a7f3d0'],
  pat:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' fill='none' stroke='%231f6b34' stroke-opacity='.16' stroke-width='2'%3E%3Cpath d='M0 30h40l20 20v30M60 50h60M20 120V90l20-20h30M100 0v30l-20 20M120 90H90'/%3E%3Ccircle cx='60' cy='80' r='3' fill='%231f6b34'/%3E%3Ccircle cx='100' cy='30' r='3'/%3E%3C/svg%3E")`,
  brand:{logo:'assets/recontech-logo.webp',cover:'assets/recontech-logo.webp',coverBg:'#fff'}},
 'davao':{bg:'#f1f8f2',card:'rgba(255,255,255,0.82)',text:'#12261a',sub:'#4b6354',accent:'#1b7f3b',cover:'linear-gradient(135deg,#1b7f3b,#0f4d24)',border:'rgba(255,255,255,0.7)',wave:['#1b7f3b','#4ab4e8','#f9b233','#d81b8a'],
  pat:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='110' height='110' fill='none' stroke='%231b7f3b' stroke-opacity='.15' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M15 60C15 30 40 15 65 15C65 45 40 60 15 60ZM15 60L50 25'/%3E%3Cpath d='M70 105C70 85 85 75 100 75C100 95 85 105 70 105Z'/%3E%3C/svg%3E")`,
  brand:{logo:'assets/davao-logo.webp',cover:'assets/davao-logo.webp',coverBg:'#fff',deco:'assets/davao-eagle.webp'}},
 'zap-it':{bg:'#f2f7ff',card:'rgba(255,255,255,0.82)',text:'#0f1b33',sub:'#4a5b78',accent:'#1d6fe8',cover:'linear-gradient(135deg,#1d6fe8,#38bdf8)',border:'rgba(255,255,255,0.7)',wave:['#1d6fe8','#38bdf8','#93c5fd'],
  pat:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='110' height='110'%3E%3Cpath d='M30 10L18 38h11l-4 24 20-31H32z' fill='%231d6fe8' fill-opacity='.09'/%3E%3Cpath d='M80 66L72 84h7l-3 16 13-20h-8z' fill='%2338bdf8' fill-opacity='.11'/%3E%3C/svg%3E")`,
  brand:{logo:'assets/zapit-logo.webp',cover:'assets/zapit-logo.webp',coverBg:'#fff'}},
 /* ---- LYNQ personnel theme (#D6248F) ---- */
 'lynq-team':{bg:'#F4ECE1',card:'#FFFDF8',text:'#1B1220',sub:'#6A5C6B',accent:'#D6248F',cover:'linear-gradient(#D6248F,#D6248F)',border:'#1B1220',wave:['#1B1220','#D6248F','#1B1220'],
  pat:PAPER_PAT,brand:{logo:'assets/lynq-logo.webp',cover:'assets/lynq-logo.webp',coverBg:'#FFE3F2'}}
};
function customTheme(c){const a=c.accent||'#D6248F',d=c.mode==='dark';
 return{bg:d?'#0d0f14':'#f4f5f7',card:d?'rgba(28,30,38,0.82)':'rgba(255,255,255,0.78)',text:d?'#f1f1f1':'#1a1a1a',sub:d?'#a0a0a0':'#555555',accent:a,
  cover:`linear-gradient(135deg,${a},color-mix(in srgb,${a} 55%,#000))`,border:d?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.6)',wave:[a,`color-mix(in srgb,${a} 55%,#fff)`,a]}}
const getTheme=()=>state.themeKey==='custom'?customTheme(state.custom||{}):(THEMES[state.themeKey]||THEMES['clean-light']);
(function(){const t=THEMES[localStorage.getItem('lynq_theme_key')||'clean-light']||THEMES['clean-light'];document.documentElement.style.setProperty('--bg',t.bg);document.documentElement.dataset.theme=localStorage.getItem('lynq_theme_key')||'clean-light'})();
