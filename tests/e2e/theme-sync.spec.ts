import { test, expect } from '@playwright/test';

test.describe('Theme Synchronization', () => {
  test('guest should sync theme from owner', async ({ browser }) => {
    // 1. Create Owner Context
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    
    // Owner logs in
    await ownerPage.goto('http://localhost:3000');
    await ownerPage.evaluate(() => {
      localStorage.setItem('chatroom_user_type', 'owner');
    });
    await ownerPage.reload();
    await expect(ownerPage.getByText('主人', { exact: true })).toBeVisible();

    // 2. Create Guest Context
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    
    // Guest joins (default is guest)
    await guestPage.goto('http://localhost:3000');
    await expect(guestPage.getByText('匿名聊天室')).toBeVisible();

    // 3. Owner changes theme to Kirby
    await ownerPage.click('button[title="切换主题"]');
    await expect(ownerPage.getByText('切换气泡主题')).toBeVisible();
    const kirbyThemeButton = ownerPage.locator('button').filter({ has: ownerPage.getByAltText('星之卡比') });
    await kirbyThemeButton.click();
    
    // Verify Owner theme applied (pink background style check or bubble check)
    // We check the main container style for background gradient
    const ownerContainer = ownerPage.locator('div.h-\\[100dvh\\]');
    await expect(ownerContainer).toHaveAttribute('style', /linear-gradient/);
    
    // 4. Verify Guest syncs theme
    // Guest should receive realtime update and change background
    const guestContainer = guestPage.locator('div.h-\\[100dvh\\]');
    
    // Wait for sync (might take a moment for realtime)
    // Kirby theme gradient contains #ffcce5 or pinkish colors
    // Let's just check if it matches the owner's style eventually
    await expect(async () => {
      const ownerStyle = await ownerContainer.getAttribute('style');
      const guestStyle = await guestContainer.getAttribute('style');
      expect(guestStyle).toBe(ownerStyle);
    }).toPass({ timeout: 10000 });

    // 5. Verify Message Bubbles also sync
    // Owner sends a message
    const message = `Sync Test ${Date.now()}`;
    await ownerPage.fill('input[type="text"]', message);
    await ownerPage.click('button[type="submit"]');

    // Guest sees message with correct theme
    const guestBubble = guestPage.locator('div.rounded-2xl.max-w-\\[70\\%\\]').filter({ hasText: message });
    await expect(guestBubble).toBeVisible();
    
    const className = await guestBubble.getAttribute('class');
    expect(className).toContain('bg-[#ffcce5]'); // Kirby theme color
  });
});
