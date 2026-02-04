
import { test, expect } from '@playwright/test';

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // 假设本地运行在 3000 端口
    await page.goto('http://localhost:3000');
  });

  test('should send a text message', async ({ page }) => {
    const message = 'Hello, automated world!';

    // 定位输入框并输入
    await page.fill('input[type="text"]', message);

    // 点击发送
    await page.click('button[type="submit"]');

    // 验证消息出现在列表中 (假设消息气泡有特定的类名或文本)
    await expect(page.locator('body')).toContainText(message);
  });

  test('should reply to a message', async ({ page }) => {
    // 1. 发送一条消息
    const message = `Message to reply ${Date.now()}`;
    await page.fill('input[type="text"]', message);
    await page.click('button[type="submit"]');

    // 2. 找到引用按钮并点击
    // 强制显示按钮：移动端始终显示，桌面端悬浮显示。
    // 在测试中，我们可以强制点击，Playwright 会自动尝试滚动和 hover。

    // 等待消息元素出现并稳定
    const messageBubble = page.locator(`div:has-text("${message}")`).last();
    await messageBubble.waitFor({ state: 'visible', timeout: 10000 });

    // 定位引用按钮：它在气泡内，且有 title="引用回复"
    // 注意：MessageBubble 组件中，按钮是绝对定位在气泡外的，所以 locator 选择策略要调整
    // 我们使用 locator 的关联查找，找到 messageBubble 关联的 replyButton
    // 假设 replyButton 是 messageBubble 的兄弟元素或者子元素
    // 根据之前代码：button 是 div 的兄弟或子元素
    // 查看 MessageBubble.tsx: button 是 div.max-w-[70%] 的兄弟元素（如果非 owner）或者子元素（如果是）
    // 但最简单的方式是直接找 title="引用回复" 的最后一个按钮，因为我们刚发了最新消息
    const replyButton = page.locator('button[title="引用回复"]').last();

    // 等待按钮存在（不一定可见，因为可能有 opacity: 0）
    await replyButton.waitFor({ state: 'attached' });

    // 强制点击，绕过 opacity/visibility 检查
    await replyButton.click({ force: true });

    // 3. 验证输入框上方出现引用预览
    // 引用预览包含 "回复" 字样和原消息内容
    await expect(page.locator('text=回复')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.truncate').filter({ hasText: message })).toBeVisible();

    // 4. 发送回复
    const replyContent = `This is a reply ${Date.now()}`;
    await page.fill('input[type="text"]', replyContent);
    await page.click('button[type="submit"]');

    // 5. 验证回复消息显示
    await expect(page.locator('body')).toContainText(replyContent);
    // 验证回复消息中包含原消息引用
    // 引用块通常有 border-l-2 类名
    await expect(page.locator('.border-l-2').filter({ hasText: message }).last()).toBeVisible();
  });

  test('should handle image upload flow', async ({ page }) => {
    // 模拟文件上传
    // Playwright 处理 hidden input
    const fileInput = page.locator('input[type="file"]');

    // 打开工具栏 (点击加号按钮)
    // 按钮通常是一个圆形的，里面有 Plus 图标
    // 我们可以用更稳健的选择器
    await page.click('button:has(svg.lucide-plus)');

    // 设置文件
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('this is a test image buffer')
    });

    // 验证是否出现图片消息
    // 图片消息包含 group-image 类
    // 由于上传和渲染需要时间，我们增加超时时间
    // 并且我们不等待真正的图片加载完成（因为 buffer 是假的），只看 DOM 结构是否出现
    await expect(page.locator('.group-image').last()).toBeVisible({ timeout: 15000 });
  });
});
