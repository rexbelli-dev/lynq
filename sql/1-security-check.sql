-- LYNQ security check. Run each part by itself and read the result.

-- PART A: every table must have rls_on = true.
-- Expected policies: nfc_cards 1, profiles 4, card_notes 2, shared_contacts 2, saved_contacts 1,
-- card_stats 1, link_clicks 1, support_tickets 1, notifications 1, staff 0, staff_log 0, app_secrets 0
select c.relname as table_name, c.relrowsecurity as rls_on,
  (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=c.relname) as policies
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' order by 1;

-- PART B: must return ZERO rows (no rule may apply to "public" or "anon")
select tablename, policyname, cmd, roles from pg_policies
where schemaname='public' and (roles::text like '%public%' or roles::text like '%anon%');

-- PART C: only these may say true: card_for_handle, get_card, increment_tap, is_staff,
-- leave_note, share_contact, track_click (and the trigger helpers).
select p.proname as function, has_function_privilege('anon', p.oid, 'execute') as visitors_can_run
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public' and p.prokind='f' order by 2 desc, 1;
