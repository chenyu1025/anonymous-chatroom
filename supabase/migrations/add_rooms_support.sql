-- Create rooms table
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  password_hash text not null,
  created_at timestamptz default now()
);

-- Add room_id to messages
alter table messages add column if not exists room_id uuid references rooms(id) on delete cascade;
create index if not exists idx_messages_room_id on messages(room_id);

-- Add room_id to users
alter table users add column if not exists room_id uuid references rooms(id) on delete cascade;
create index if not exists idx_users_room_id on users(room_id);
