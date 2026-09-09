import { expect, test } from '@playwright/test';

/* The title screen is the one page every visitor sees. Its two doors and its
   zero-JavaScript promise are the things worth asserting on every commit. */

test('the title screen offers both ways in, honestly labelled', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Forgotten Mind');

  const doors = page.getByRole('navigation', { name: 'Ways in' }).getByRole('link');
  await expect(doors).toHaveCount(2);
  await expect(doors.nth(0)).toContainText('Enter the world');
  await expect(doors.nth(1)).toContainText('I have five minutes');
});

test('the five-minute door reaches the Codex', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /I have five minutes/ }).click();
  await expect(page).toHaveURL(/\/codex$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Everything the world remembers');
});

test('the world mounts a WebGL canvas', async ({ page }) => {
  await page.goto('/world');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  const size = await canvas.boundingBox();
  expect(size?.width ?? 0).toBeGreaterThan(100);
});

test('the perf HUD toggles with H', async ({ page }) => {
  await page.goto('/world');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  await page.keyboard.press('KeyH');
  await expect(page.getByRole('status', { name: 'Performance' })).toBeVisible();
  await page.keyboard.press('KeyH');
  await expect(page.getByRole('status', { name: 'Performance' })).toBeHidden();
});

test('the world inspector scrubs restoration', async ({ page }) => {
  await page.goto('/world?debug=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });

  const panel = page.getByRole('complementary', { name: 'World inspector' });
  await expect(panel).toBeVisible();

  const scrub = panel.getByRole('slider');
  await scrub.fill('1');
  await expect(panel.getByText('restoration')).toContainText('1.00');

  // The panel hides on backtick and comes back, so it never blocks a screenshot.
  await page.keyboard.press('Backquote');
  await expect(panel).toBeHidden();
});
