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

drop policy if exists "Messages are viewable by everyone" on messages;
create policy "Messages are viewable by everyone" on messages
  for select using (true);

drop policy if exists "Anyone can insert messages" on messages;
create policy "Anyone can insert messages" on messages
  for insert with check (true);

drop policy if exists "Users can manage own data" on users;
create policy "Users can manage own data" on users
  for all using (true);

-- Enable realtime for tables (requires dashboard toggle)
-- In Supabase Dashboard: Database -> Replication -> Realtime, enable for public.messages and public.users
