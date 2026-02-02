-- Users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  user_type varchar(20) not null check (user_type in ('owner','guest')),
  session_id varchar(255) unique not null,
  last_seen timestamptz default now(),
  is_online boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_users_session_id on users(session_id);
create index if not exists idx_users_user_type on users(user_type);
create index if not exists idx_users_online on users(is_online);

-- Messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  content text not null,
  user_type varchar(20) not null check (user_type in ('owner','guest')),
  created_at timestamptz default now()
);

create index if not exists idx_messages_created_at on messages(created_at desc);
create index if not exists idx_messages_user_id on messages(user_id);

-- RLS
alter table messages enable row level security;
alter table users enable row level security;

-- 允许所有操作（因为是匿名聊天室，且鉴权在 API 层处理）
create policy "Allow all access to messages" on messages for all using (true) with check (true);
create policy "Allow all access to users" on users for all using (true) with check (true);

-- Enable realtime for tables (requires dashboard toggle)
-- In Supabase Dashboard: Database -> Replication -> Realtime, enable for public.messages and public.users
