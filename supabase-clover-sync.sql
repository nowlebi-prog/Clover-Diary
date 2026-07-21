-- Deprecated public snapshot sync.
--
-- Do not use this migration for Clover Desk personal data.
-- The previous version allowed anonymous read/write access to one shared
-- JSON snapshot table, which is unsafe for a public GitHub/Vercel app.
--
-- Use supabase-setup.sql instead. It stores data in public.app_data and
-- protects each row with Supabase Auth user-scoped RLS policies.

drop policy if exists "Allow anon read clover snapshots" on public.clover_app_snapshots;
drop policy if exists "Allow anon upsert clover snapshots" on public.clover_app_snapshots;

alter table if exists public.clover_app_snapshots enable row level security;

-- No anon policies are intentionally created here.
