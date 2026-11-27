/* js/storage.js
   Saving photos and saving the profile.
   (Part of LYNQ 2027. See README.md, 'Where to change what'.) */
/* ---------- photos live in Supabase Storage (bucket: profile-photos) ---------- */
const PB=SUPABASE_URL+'/storage/v1/object/public/profile-photos/';
let lastPaths=new Set();
function pathsOf(st){
  const out=new Set(),add=u=>{if(typeof u==='string'&&u.startsWith(PB))out.add(decodeURIComponent(u.slice(PB.length)))};
  add(st.avatar);add(st.cover);add(st.qrImage);(st.photos||[]).forEach(add);((st.biz&&st.biz.items)||[]).forEach(it=>add(it.photo));
  return out;
}
async function uploadImg(dataUrl,kind){
  try{
    const blob=await (await fetch(dataUrl)).blob();
    const ext=blob.type==='image/webp'?'webp':blob.type==='image/png'?'png':'jpg';
    const path=`${curSession.user.id}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`;
    const{error}=await supabaseClient.storage.from('profile-photos').upload(path,blob,{contentType:blob.type,cacheControl:'31536000'});
    if(error){console.warn('LYNQ upload:',error.message);return dataUrl}      // keeps the photo inline if storage is unavailable
    return supabaseClient.storage.from('profile-photos').getPublicUrl(path).data.publicUrl;
  }catch(e){console.warn('LYNQ upload:',e);return dataUrl}
}
async function uploadPending(){
  const up=async(v,k)=>(typeof v==='string'&&v.startsWith('data:'))?await uploadImg(v,k):v;
  state.avatar=await up(state.avatar,'avatar');state.cover=await up(state.cover,'cover');state.qrImage=await up(state.qrImage,'qr');
  state.photos=await Promise.all(Array.from(state.photos||[],v=>up(v,'gallery')));
  const b=BZ();b.items=await Promise.all(b.items.map(async it=>({...it,photo:await up(it.photo,'item')})));
}
async function purgeMyPhotos(){
  const uid=curSession.user.id;
  for(const b of ['profile-photos','support-files']){
    try{
      const bk=supabaseClient.storage.from(b),{data}=await bk.list(uid,{limit:1000});
      if(data&&data.length)await bk.remove(data.map(f=>uid+'/'+f.name));
    }catch(_e){}
  }
}

/* ---------- persistence ---------- */
let _saving=Promise.resolve();
const persist=()=>(_saving=_saving.then(_persist,_persist));      // one save at a time
async function _persist(){
  if(!isOwner)return false;
  const{data:{session}}=await supabaseClient.auth.getSession();
  if(!session)return false;
  await uploadPending();
  const{error}=await supabaseClient.from('profiles').upsert({user_id:session.user.id,bio:JSON.stringify(state),card_title:state.name,updated_at:new Date().toISOString()});
  if(error){console.warn('LYNQ save:',error.message);return false}
  const now=pathsOf(state),gone=[...lastPaths].filter(x=>!now.has(x));
  if(gone.length)supabaseClient.storage.from('profile-photos').remove(gone);   // old photos that are no longer used
  lastPaths=now;
  return true;
}

