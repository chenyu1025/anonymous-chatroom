# 🚀 部署指南 (GitHub + Vercel)

本指南将帮助你将代码推送到 GitHub 并部署到 Vercel。

## 1. 推送代码到 GitHub

1.  登录 [GitHub](https://github.com/) 并创建一个新的 **Public** 或 **Private** 仓库（不要初始化 README 或 .gitignore）。
2.  在终端中运行以下命令（将 `<your-repo-url>` 替换为你的仓库地址）：

```bash
# 添加远程仓库
git remote add origin <your-repo-url>

# 推送代码
git push -u origin main
```

## 2. 部署到 Vercel

1.  登录 [Vercel](https://vercel.com/)。
2.  点击 **"Add New..."** -> **"Project"**。
3.  在 "Import Git Repository" 侧边栏中，点击 **"Import"** 按钮（对应你刚才创建的 GitHub 仓库）。
4.  在 **"Configure Project"** 页面：
    *   **Framework Preset**: 保持默认 (Next.js)。
    *   **Environment Variables**: 展开此部分，将本地 `.env.local` 中的变量逐个添加：
        *   `NEXT_PUBLIC_SUPABASE_URL`: (从 Supabase Settings 获取)
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (从 Supabase Settings 获取)
        *   `SUPABASE_SERVICE_ROLE_KEY`: (从 Supabase Settings 获取)
        *   `OWNER_PASSWORD`: (你自己设置的密码)
5.  点击 **"Deploy"**。

## 3. 验证部署

部署完成后，Vercel 会提供一个访问链接（例如 `https://your-project.vercel.app`）。
*   访客可以直接访问。
*   主人可以通过 `/auth/owner` 页面输入密码登录。

## 4. 后续更新

每次你修改代码并推送到 GitHub (`git push`)，Vercel 会自动触发新的构建和部署。
