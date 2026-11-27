/* js/admin-boot.js
   Start-up: sign-in check, who is on the team, build the menu, open the right page, offline helper. */

async function boot(){
  const{data:{session}}=await sb.auth.getSession();
  if(!session){$('gate').classList.remove('hide');return}
  const ok=(await sb.rpc('is_staff')).data===true;
  if(!ok){$('gate').classList.remove('hide');$('gateMsg').textContent=session.user.email+' is not on the LYNQ team list. Ask a founder to add you, or sign in with another account.';$('goSign').classList.add('hide');$('gateOut').classList.remove('hide');return}
  const me=await sb.rpc('admin_me');
  ME=me.data||{email:session.user.email,role:'staff',name:''};
  if(!ME.email)ME.email=session.user.email;
  $('app').classList.remove('hide');buildNav();
  go((location.hash||'#dash').slice(1));
  refreshBadge();
  if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
  if(!navigator.onLine)$('offline').classList.remove('hide');
}
$('goSign').onclick=()=>sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname,queryParams:{prompt:'select_account'}}});
$('gateOut').onclick=async()=>{await sb.auth.signOut();location.reload()};
window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(id&&id!==CUR&&$('app')&&!$('app').classList.contains('hide'))go(id)});
boot();
