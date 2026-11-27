# LYNQ 2027: where to change what

Plain HTML, CSS and JavaScript. No build step. Upload the whole folder to GitHub and Cloudflare publishes it.

## Folder map
```
portfolio.html     the profile page (the only page a card opens)
admin.html         staff-only admin page
styleguide.html    every button, icon and color in one place (for you, not customers)
sw.js              offline helper. Raise  V='lynq-v3'  to  v4  when you want everyone to refresh
worker.js          optional link-preview helper (not connected yet)
css/               how it looks
js/                what it does
assets/            logos and images
sql/               scripts you paste into Supabase
```

## I want to change...
| What | Where |
|---|---|
| The LYNQ pink, outline color, dark screen color | `css/tokens.css` (top 4 lines) |
| A button's look on the profile | `css/components.css` (`.btn`) and `css/profile.css` (`.contact-btn`, `.linkbtn`, `.tap-pill`) |
| A button's look on the dark screens | `css/flow.css` (`.gbtn`) |
| The editor's look | `css/editor.css` |
| The LYNQ team theme (paper and ink) | bottom of `css/themes.css` |
| Other themes (ReconTech, Davao, Zap it, colors) | `js/theme-core.js` |
| A small icon (menu, share, bell...) | `js/icons.js`, one line per icon |
| A social icon (Instagram, TikTok...) | `ICONS` list in `js/config.js` |
| Database address, community link, "Get your own LYNQ" link | top of `js/config.js` |
| English / Tagalog / Bisaya wording | `js/legal-i18n.js` |
| Terms and Privacy text | inside `portfolio.html` (search `tplTerms`, `tplPrivacy`) |
| What happens on tap | `js/card-binding.js` |
| Admin page | `admin.html`, `css/admin.css`, `js/admin.js` |

Tip: open `styleguide.html` after any CSS or icon change to see everything at once.

## Rules to keep it safe
- CSS files load in this order (it matters): tokens, base, profile, components, flow, editor, overlays, features, themes. The last one wins, so tweaks go in `themes.css`.
- JS files also load in order (see the bottom of `portfolio.html`). Do not rename them without changing that list and the `SHELL` list in `sw.js`.
- Only the publishable key goes in `js/config.js`. Never paste a secret key.
- Never touch the LYNQ 2026 Supabase project.

## Adding a new icon
1. Copy its drawing (24x24 line icon, e.g. from lucide.dev) into `js/icons.js` as a new line.
2. In the page use `<svg viewBox="0 0 24 24" data-icon="your-name"></svg>`.

## Before launch checklist
1. Upload this folder to GitHub (keep the folders as they are).
2. Supabase, SQL Editor: run `sql/1-security-check.sql` and send me the results for A, B, C. Then `2-update-features.sql`, then `3-email-alert-setup.sql` (fill in your Resend key first).
3. Put `lynq-logo.webp` and `zapit-logo.webp` in `assets/`.
4. In `js/config.js` change `GET_LYNQ_URL` to your Messenger/order link.
5. Test with a real phone: tap, claim, edit, save, share, delete.
6. Have a Bisaya speaker read the Bisaya text, and a lawyer read the Terms and Privacy.
7. Decide on lynq.ph before programming chips.
8. Supabase free plan has no automatic backups: use the Download backup button in the admin page every week.
