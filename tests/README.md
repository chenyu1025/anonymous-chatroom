
# 测试指南 (Testing Guide)

本项目包含两种类型的测试建议：E2E (End-to-End) 测试和单元测试。

## 1. 安装测试依赖

要运行这些测试，你需要安装 Playwright 和 Jest (或类似工具)。

```bash
# 安装 Playwright
npm init playwright@latest

# 安装 Jest (可选，用于单元测试)
npm install --save-dev jest @types/jest ts-jest
```

## 2. 运行 E2E 测试

确保本地开发服务器已启动：

```bash
npm run dev
```

然后运行测试：

```bash
npx playwright test
```

测试文件位于 `tests/e2e/chat.spec.ts`。

## 3. 运行单元测试

```bash
npx jest
```

测试文件位于 `tests/unit/easter-eggs.test.ts`。

## 4. 手动测试

请参考根目录下的 [TEST_PLAN.md](../TEST_PLAN.md) 进行详细的手动功能验证。
