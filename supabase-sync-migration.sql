-- Additive, repeatable migration. Existing diary rows are retained.
begin;
create table if not exists public.app_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_data add column if not exists revision bigint not null default 1;
alter table public.app_data enable row level security;

drop policy if exists "Users can read their own data" on public.app_data;
create policy "Users can read their own data" on public.app_data for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert their own data" on public.app_data;
create policy "Users can insert their own data" on public.app_data for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own data" on public.app_data;
create policy "Users can update their own data" on public.app_data for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update on public.app_data to authenticated;
revoke all on public.app_data from anon;

create or replace function public.advance_app_data_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
drop trigger if exists app_data_revision on public.app_data;
create trigger app_data_revision before update on public.app_data for each row execute function public.advance_app_data_revision();

-- Compare-and-swap runs atomically under Postgres row locking.
-- An empty result means another device saved first; the client must re-read and merge.
drop function if exists public.save_app_data(jsonb,bigint);
create or replace function public.save_app_data(p_user_id uuid, p_data jsonb, p_expected_revision bigint)
returns table(revision bigint, updated_at timestamptz)
language plpgsql security invoker set search_path = '' as $$
declare
  account_id uuid := auth.uid();
begin
  if account_id is null or p_user_id is null or account_id <> p_user_id then raise exception 'Authenticated account changed' using errcode = '42501'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'Invalid snapshot or revision' using errcode = '22023';
  end if;
  if p_expected_revision = 0 then
    return query insert into public.app_data as a(user_id, data, revision, updated_at)
      values(account_id, p_data, 1, clock_timestamp())
      on conflict(user_id) do nothing returning a.revision, a.updated_at;
  else
    return query update public.app_data as a set data = p_data
      where a.user_id = account_id and a.revision = p_expected_revision
      returning a.revision, a.updated_at;
  end if;
end;
$$;
revoke all on function public.save_app_data(uuid,jsonb,bigint) from public, anon;
grant execute on function public.save_app_data(uuid,jsonb,bigint) to authenticated;
commit;
