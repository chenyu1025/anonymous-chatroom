# Supabase 配置指南

## 1. 创建项目
- 访问 https://supabase.com 并登录
- 新建 Project，选择离你最近的 Region
- 记录 Project URL 与 `anon`、`service_role` 密钥

## 2. 初始化数据库
- 打开 Dashboard -> SQL Editor
- 复制并执行 `supabase/schema.sql` 中的 SQL
- 打开 Database -> Replication -> Realtime，启用 `public.messages` 与 `public.users`

## 3. 环境变量
- 在本地创建 `.env.local` 并填入：
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
OWNER_PASSWORD=<owner-password>
```
- 在 Vercel 项目 Settings -> Environment Variables 同步以上变量

## 4. 本地运行
```
npm install
npm run dev
```

## 5. 验证
- 访客直接打开首页，匿名发言
- 主人通过 `/auth/owner` 输入 `OWNER_PASSWORD` 进入，消息以紫色泡泡显示

## 6. 常见问题
- 如果出现 `Invalid supabaseUrl`，请确认 `.env.local` 中的 URL 正确且以 `https://` 开头
- 未看到实时消息：确认 Realtime 已对两张表启用；并确保 RLS 策略允许 INSERT/SELECT
