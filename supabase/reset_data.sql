-- 清空所有消息和用户数据
-- 请在 Supabase Dashboard -> SQL Editor 中运行此脚本

-- 清空消息表（由于有外键约束，建议先清空消息）
TRUNCATE TABLE messages CASCADE;

-- 清空用户表
TRUNCATE TABLE users CASCADE;

-- 如果你想重置 ID 序列（虽然 UUID 不需要，但为了整洁）：
-- (UUID 是随机生成的，所以不需要重置序列)

-- 确认数据已清空
SELECT count(*) FROM messages;
SELECT count(*) FROM users;
