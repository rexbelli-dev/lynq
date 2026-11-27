-- Run AFTER 2-update-features.sql. Replace the three values with your own, then run.
insert into public.app_secrets (key, value) values
 ('resend_api_key','re_PASTE_YOUR_KEY_HERE'),
 ('alert_email','you@gmail.com'),
 ('admin_url','https://YOUR-SITE/admin.html')
on conflict (key) do update set value = excluded.value;
