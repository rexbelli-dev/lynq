// LYNQ link previews. When Messenger, Facebook, WhatsApp, etc. fetch a profile link,
// this answers with that person's name, bio and photo. Everyone else gets the normal site.
const SB  = 'https://cmiuramqfgwyumniedfv.supabase.co';
const KEY = 'sb_publishable_yegka1PYoQm-U1dpEJJJHA_qbb1ujc6';           // the public (publishable) key only
const BOTS = /facebookexternalhit|facebot|messenger|whatsapp|twitterbot|slackbot|telegrambot|linkedinbot|discordbot|pinterest|skypeuripreview|viber/i;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function rpc(fn, args) {
  try {
    const r = await fetch(`${SB}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    return r.ok ? await r.json() : null;
  } catch (_e) { return null; }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (BOTS.test(req.headers.get('user-agent') || '') && url.pathname === '/') {
      let uid = url.searchParams.get('card');
      const h = url.searchParams.get('u');
      if (!uid && h) uid = await rpc('card_for_handle', { p_handle: h });
      const c = uid && await rpc('get_card', { p_uid: uid });
      if (c && c.user_id && !c.disabled) {
        let p = {}; try { p = JSON.parse(c.bio || '{}'); } catch (_e) {}
        const name = p.name || c.card_title || 'LYNQ profile';
        const desc = (p.bio || 'Tap to see my LYNQ profile.').slice(0, 160);
        const img  = (p.avatar && /^https?:/.test(p.avatar)) ? p.avatar : new URL('/assets/icon-512.png', url).href;
        return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(name)} · LYNQ</title>
<meta property="og:type" content="profile"><meta property="og:site_name" content="LYNQ">
<meta property="og:title" content="${esc(name)} · LYNQ"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}"><meta property="og:url" content="${esc(url.href)}">
<meta name="twitter:card" content="summary"></head><body></body></html>`,
          { headers: { 'content-type': 'text/html;charset=utf-8', 'cache-control': 'public, max-age=300' } });
      }
    }
    return env.ASSETS.fetch(req);      // everyone else: the normal LYNQ site
  }
};
