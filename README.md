# 匿名聊天室

一个支持多人实时对话的匿名聊天室网站，聊天室主人通过密码访问，访客匿名进入。

## 🌟 功能特性

- **匿名聊天**: 访客无需注册即可参与对话
- **主人模式**: 聊天室主人通过密码验证，拥有特殊身份标识
- **实时消息**: 基于 Supabase 实时订阅的多人实时对话
- **在线状态**: 显示当前在线用户数
- **移动端优化**: 响应式设计，完美适配移动设备
- **现代UI**: 紫色主题，聊天泡泡设计

## 🚀 快速开始

### 1. 环境配置

创建 `.env.local` 文件并配置以下环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务角色密钥
OWNER_PASSWORD=聊天室主人密码
```

### 2. 安装依赖

```bash
npm install
```

### 3. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📱 使用说明

### 访客访问
1. 直接访问主页面即可进入聊天室
2. 以匿名身份发送和接收消息

### 主人访问
1. 访问 `/auth/owner` 或点击主页面设置图标
2. 输入正确的密码进行验证
3. 进入聊天室，显示特殊身份标识

## 🛠️ 技术栈

- **前端**: Next.js 14, React 18, TypeScript
- **样式**: Tailwind CSS
- **后端**: Supabase (认证 + 实时数据库 + 实时订阅)
- **部署**: Vercel

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   │   ├── auth/owner/    # 主人认证API
│   │   ├── messages/      # 消息API
│   │   └── users/         # 用户API
│   ├── auth/owner/        # 主人认证页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 聊天室主页
├── components/            # React组件
│   ├── MessageBubble.tsx  # 消息泡泡组件
│   └── MessageInput.tsx   # 消息输入组件
└── lib/                   # 工具库
    ├── session.ts         # 会话管理
    └── supabase.ts        # Supabase客户端
```

## 🔧 部署

### Vercel一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/anonymous-chatroom)

### 手动部署

1. 推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

## 📊 数据库结构

### 用户表 (users)
- `id`: UUID 主键
- `user_type`: 用户类型 ('owner' | 'guest')
- `session_id`: 会话ID
- `last_seen`: 最后活跃时间
- `is_online`: 在线状态

### 消息表 (messages)
- `id`: UUID 主键
- `user_id`: 用户ID (外键)
- `content`: 消息内容
- `user_type`: 用户类型
- `created_at`: 创建时间

## 🔒 安全特性

- 行级安全策略 (RLS)
- 用户权限控制
- 会话管理
- 输入验证

## 🎨 自定义

### 修改主题颜色
编辑 `tailwind.config.js` 中的颜色配置。

### 修改聊天室名称
编辑 `src/app/page.tsx` 中的标题。

### 修改主人密码
更新环境变量 `OWNER_PASSWORD`。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License