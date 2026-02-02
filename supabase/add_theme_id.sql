-- Add theme_id to users table
alter table users add column if not exists theme_id varchar(50) default 'sprigatito';

-- Allow update theme_id
create policy "Allow update theme_id" on users for update using (true) with check (true);
