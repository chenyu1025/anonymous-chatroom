import { test, expect } from '@playwright/test';

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    // 1. 访问页面
    await page.goto('http://localhost:3000');

    // 2. 模拟 Owner 登录状态
    await page.evaluate(() => {
      localStorage.setItem('chatroom_user_type', 'owner');
    });

    // 3. 刷新页面以应用状态
    await page.reload();
  });

  test('should switch theme and apply styles to messages', async ({ page }) => {
    // 验证已进入 Owner 模式
    await expect(page.getByText('主人', { exact: true })).toBeVisible();
    await expect(page.locator('button[title="切换主题"]')).toBeVisible();

    // 1. 打开主题选择器
    await page.click('button[title="切换主题"]');
    await expect(page.getByText('切换气泡主题')).toBeVisible();

    // 2. 选择 "星之卡比" 主题 (id: kirby)
    // 根据 ThemeSelector.tsx，Image alt 为 theme.name
    const kirbyThemeButton = page.locator('button').filter({ has: page.getByAltText('星之卡比') });
    await kirbyThemeButton.click();

    // 验证主题选择器关闭（或需要手动关闭？代码中 onSelect 会关闭）
    await expect(page.getByText('切换气泡主题')).not.toBeVisible();

    // 3. 发送消息
    const messageContent = `Test Kirby Theme ${Date.now()}`;
    await page.fill('input[type="text"]', messageContent);
    await page.click('button[type="submit"]');

    // 4. 验证消息样式
    // 星之卡比主题的 bubbleClass 是 'bg-[#ffcce5] border-pink-200'

    // 使用更宽松的选择器：找到包含文本的元素，然后向上找 bubble 容器
    // Bubble 容器具有 'rounded-2xl' 和 'max-w-[70%]' 类
    const bubbleContainer = page.locator('div.rounded-2xl.max-w-\\[70\\%\\]').filter({ hasText: messageContent });

    // 等待元素可见
    await expect(bubbleContainer).toBeVisible();

    // 打印 class 以便调试 (在报告中可见)
    const className = await bubbleContainer.getAttribute('class');
    console.log(`Found bubble class: ${className}`);

    // 检查 class
    // 使用 toContain 检查子字符串，避开正则转义问题
    expect(className).toContain('bg-[#ffcce5]');
    expect(className).toContain('border-pink-200');
    expect(className).toContain('text-pink-900');
  });
});
