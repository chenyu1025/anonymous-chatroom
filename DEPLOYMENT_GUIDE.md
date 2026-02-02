# 🚀 匿名聊天室部署指南

## 📋 部署前准备

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并注册账号
2. 创建新项目，记住以下信息：
   - Project URL: `https://[your-project].supabase.co`
   - Anon Key: 在 Settings > API 中找到
   - Service Role Key: 在 Settings > API 中找到

### 2. 设置数据库

在 Supabase 控制台中，进入 SQL Editor，执行以下 SQL：

```sql
-- 创建用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('owner', 'guest')),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建消息表
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('owner', 'guest')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_users_session_id ON users(session_id);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_online ON users(is_online);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_user_id ON messages(user_id);

-- 启用行级安全
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 消息权限策略
CREATE POLICY "Messages are viewable by everyone" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert messages" ON messages
  FOR INSERT WITH CHECK (true);

-- 用户权限策略
CREATE POLICY "Users can manage own data" ON users
  FOR ALL USING (auth.uid() = id OR user_type = 'guest');

-- 授予权限
GRANT SELECT ON messages TO anon;
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON messages TO authenticated;
GRANT ALL PRIVILEGES ON users TO authenticated;
```

### 3. 配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
OWNER_PASSWORD=your-secure-password-here
```

## 🌐 Vercel 部署

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/anonymous-chatroom)

### 手动部署步骤

1. **推送代码到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/anonymous-chatroom.git
   git push -u origin main
   ```

2. **在 Vercel 中导入项目**
   - 访问 [Vercel](https://vercel.com)
   - 点击 "New Project"
   - 选择你的 GitHub 仓库

3. **配置环境变量**
   在 Vercel 项目设置中添加以下环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OWNER_PASSWORD`

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待部署完成

## 🔧 本地开发

### 安装依赖
```bash
npm install
```

### 运行开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

## 📱 使用说明

### 访客访问
- 直接访问主页面即可进入聊天室
- 以匿名身份发送和接收消息

### 主人访问
- 访问 `/auth/owner` 或点击主页面设置图标
- 输入正确的密码进行验证
- 进入聊天室，显示特殊身份标识

## 🎨 自定义配置

### 修改主题颜色
编辑 `tailwind.config.js` 中的颜色配置：

```javascript
colors: {
  purple: {
    50: '#f3e8ff',
    500: '#7c3aed',
    600: '#6d28d9',
    // ... 其他颜色
  },
}
```

### 修改聊天室名称
编辑 `src/app/page.tsx` 中的标题：

```typescript
<h1 className="text-xl font-semibold text-gray-800">
  {userType === 'owner' ? '我的聊天室' : '匿名聊天室'}
</h1>
```

### 修改主人密码
更新环境变量 `OWNER_PASSWORD`。

## 🔒 安全建议

1. **使用强密码**：为聊天室主人设置复杂的密码
2. **定期更新密钥**：定期更换 Supabase 密钥
3. **监控使用情况**：关注 Supabase 控制台的使用统计
4. **设置使用限制**：在 Supabase 中设置适当的数据库限制

## 🐛 常见问题

### Q: 部署后无法连接数据库？
A: 检查环境变量是否正确配置，特别是 Supabase URL 和密钥。

### Q: 实时消息不工作？
A: 确保在 Supabase 中正确启用了实时功能，并检查了数据库权限设置。

### Q: 如何重置主人密码？
A: 在 Vercel 环境变量中更新 `OWNER_PASSWORD`，然后重新部署。

## 📞 支持

如有问题，请在 GitHub 提交 Issue。

## 📄 许可证

MIT License