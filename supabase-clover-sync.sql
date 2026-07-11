create table if not exists public.clover_app_snapshots (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.clover_app_snapshots enable row level security;

drop policy if exists "Allow anon read clover snapshots" on public.clover_app_snapshots;
drop policy if exists "Allow anon upsert clover snapshots" on public.clover_app_snapshots;

create policy "Allow anon read clover snapshots"
on public.clover_app_snapshots
for select
to anon
using (true);

create policy "Allow anon upsert clover snapshots"
on public.clover_app_snapshots
for all
to anon
using (true)
with check (true);

create or replace function public.touch_clover_app_snapshots_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_clover_app_snapshots_updated_at on public.clover_app_snapshots;

create trigger touch_clover_app_snapshots_updated_at
before update on public.clover_app_snapshots
for each row
execute function public.touch_clover_app_snapshots_updated_at();
