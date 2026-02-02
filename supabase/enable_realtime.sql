-- 开启 Realtime 功能的 SQL 命令
-- 请在 Supabase Dashboard -> SQL Editor 中运行此脚本

begin;
  -- 尝试创建 supabase_realtime 发布（如果不存在）
  -- 注意：通常新建项目默认已存在此发布，如果报错说已存在，可忽略此步骤
  -- create publication supabase_realtime;
commit;

-- 将 messages 和 users 表添加到实时发布中
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table users;

-- 验证是否开启成功
select * from pg_publication_tables where pubname = 'supabase_realtime';
