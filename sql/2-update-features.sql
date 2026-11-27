-- LYNQ update: email alert for reports, backup export, referral codes.
-- Run this whole file once in the Supabase SQL Editor.

-- A) EMAIL ALERT WHEN A REPORT IS SENT
create extension if not exists pg_net;
create table if not exists public.app_secrets (key text primary key, value text not null);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;

create or replace function public.notify_new_ticket() returns trigger
language plpgsql security definer set search_path = public as $$
declare k text; to_email text; adm text; em text; nm text;
begin
  select value into k        from public.app_secrets where key = 'resend_api_key';
  select value into to_email from public.app_secrets where key = 'alert_email';
  select value into adm      from public.app_secrets where key = 'admin_url';
  if k is null or to_email is null then return new; end if;
  select email into em from auth.users where id = new.user_id;
  select card_title into nm from public.profiles where user_id = new.user_id;
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || k),
    body := jsonb_build_object(
      'from','LYNQ Alerts <onboarding@resend.dev>',
      'to', jsonb_build_array(to_email),
      'subject','New LYNQ report: ' || new.category,
      'text','From: ' || coalesce(nm,'(no name)') || ' <' || coalesce(em,'') || E'>\nCard: ' || coalesce(new.card_uid,'none')
             || E'\n\n' || left(new.message,800) || E'\n\nOpen the admin page: ' || coalesce(adm,'')));
  return new;
exception when others then return new;
end $$;
drop trigger if exists trg_notify_ticket on public.support_tickets;
create trigger trg_notify_ticket after insert on public.support_tickets
for each row execute function public.notify_new_ticket();

-- B) BACKUP EXPORT (staff only)
create or replace function public.admin_export() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  r := jsonb_build_object(
    'exported_at', now(),
    'nfc_cards',        coalesce((select jsonb_agg(to_jsonb(x)) from public.nfc_cards x), '[]'::jsonb),
    'profiles',         coalesce((select jsonb_agg(to_jsonb(x)) from public.profiles x), '[]'::jsonb),
    'users',            coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'email',u.email,'created_at',u.created_at)) from auth.users u), '[]'::jsonb),
    'saved_contacts',   coalesce((select jsonb_agg(to_jsonb(x)) from public.saved_contacts x), '[]'::jsonb),
    'shared_contacts',  coalesce((select jsonb_agg(to_jsonb(x)) from public.shared_contacts x), '[]'::jsonb),
    'card_notes',       coalesce((select jsonb_agg(to_jsonb(x)) from public.card_notes x), '[]'::jsonb),
    'support_tickets',  coalesce((select jsonb_agg(to_jsonb(x)) from public.support_tickets x), '[]'::jsonb),
    'staff',            coalesce((select jsonb_agg(email) from public.staff), '[]'::jsonb));
  insert into public.staff_log (staff_email, action) values (auth.jwt()->>'email', 'export_backup');
  return r;
end $$;
revoke execute on function public.admin_export() from public, anon;
grant  execute on function public.admin_export() to authenticated;

-- C) REFERRAL CODES
alter table public.profiles add column if not exists ref_code text;
create unique index if not exists profiles_ref_code_key on public.profiles (ref_code);
create or replace function public.profiles_set_ref() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin if new.ref_code is null then new.ref_code := public.gen_serial(5); end if; return new; end $$;
drop trigger if exists trg_profiles_ref on public.profiles;
create trigger trg_profiles_ref before insert on public.profiles
for each row execute function public.profiles_set_ref();
update public.profiles set ref_code = public.gen_serial(5) where ref_code is null;

-- D) card lookup and user list now include the referral code
create or replace function public.get_card(p_uid text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('nfc_uid', c.nfc_uid, 'user_id', c.user_id, 'tap_count', c.tap_count,
    'disabled', c.disabled, 'card_title', p.card_title,
    'bio', case when c.disabled and c.user_id is distinct from auth.uid() and not public.is_staff() then null else p.bio end,
    'verified', p.verified, 'handle', p.handle, 'ref', p.ref_code)
  from public.nfc_cards c left join public.profiles p on p.user_id = c.user_id
  where c.nfc_uid = p_uid;
$$;

create or replace function public.admin_users() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  return coalesce((select jsonb_agg(x) from (
    select u.id as user_id, u.email, p.card_title as name, p.verified, p.handle, p.ref_code,
           (select count(*) from nfc_cards c where c.user_id = u.id) as cards,
           (select c.nfc_uid from nfc_cards c where c.user_id = u.id order by c.created_at limit 1) as first_card
    from auth.users u left join profiles p on p.user_id = u.id
    order by u.created_at desc limit 500) x), '[]'::jsonb);
end $$;
