-- Clover Desk 클라우드 동기화용 테이블
-- Supabase 대시보드 > SQL Editor 에 이 내용을 그대로 붙여넣고 Run 하세요.

create table if not exists app_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table app_data enable row level security;

create policy "Users can read their own data"
  on app_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own data"
  on app_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own data"
  on app_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
