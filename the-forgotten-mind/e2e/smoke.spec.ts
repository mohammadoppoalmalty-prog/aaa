import { expect, test, type Page } from '@playwright/test';

/**
 * The canvas appears before the world is usable: everything inside `<Physics>`
 * waits on Rapier's WebAssembly. Any test that presses a world key right after
 * the canvas becomes visible is racing that load, and will fail perhaps one run
 * in twenty — which is worse than failing every time, because it teaches people
 * to re-run rather than to look.
 */
const worldReady = async (page: Page) => {
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => typeof (window as { __tfmPlayer?: unknown }).__tfmPlayer === 'function');
};

/* The Gate's ritual is an arrival, not a screen these tests are about; they
   start on the far side of it, as a returning visitor does. */
const pastTheRitual = `
  try {
    localStorage.setItem('tfm.save.v1', JSON.stringify({
      version: 1, seed: 1, createdAt: 0, updatedAt: 0, playtimeMs: 0,
      memories: [], revealedAll: false, area: 'gate', position: [0, 1.5, 4], yaw: 0,
      luma: { stage: 0, turns: [] }, puzzles: { 'cursor-ritual': 'solved' },
    }));
  } catch {}
`;

/* The title screen is the one page every visitor sees. Its two doors and its
   zero-JavaScript promise are the things worth asserting on every commit. */

test('the Overture puts the doors in the first viewport', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Forgotten Mind');

  /* The rule that makes an introduction admissible in front of a portfolio: the
     doors are reachable on the first frame, not after a scroll. */
  const hero = page.getByRole('navigation', { name: 'Ways in' }).first();
  await expect(hero.getByRole('link', { name: /Enter the world/ })).toBeInViewport();
  await expect(hero.getByRole('link', { name: /I have five minutes/ })).toBeInViewport();
});

test('the doors stay pinned once the first viewport is gone', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  const pinned = page.getByRole('navigation', { name: 'Ways in' }).last();
  await expect(pinned.getByRole('link', { name: /I have five minutes/ })).toBeInViewport();
});

test('the page heals as it is scrolled', async ({ page }) => {
  await page.goto('/');
  const read = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--r').trim());

  const atTop = Number(await read());
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(async () => Number(await read())).toBeGreaterThan(atTop + 0.5);
});

test('the plain gate is still there for a returning visitor', async ({ page }) => {
  await page.goto('/enter');
  const doors = page.getByRole('navigation', { name: 'Ways in' }).getByRole('link');
  await expect(doors).toHaveCount(2);
  await expect(doors.nth(0)).toContainText('Enter the world');
});

test('the five-minute door reaches the Codex', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /I have five minutes/ }).first().click();
  await expect(page).toHaveURL(/\/codex$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Everything the world remembers');
});

test('the world mounts a WebGL canvas', async ({ page }) => {
  await page.addInitScript(pastTheRitual);
  await page.goto('/world');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  const size = await canvas.boundingBox();
  expect(size?.width ?? 0).toBeGreaterThan(100);
});

test('the perf HUD toggles with H', async ({ page }) => {
  await page.addInitScript(pastTheRitual);
  await page.goto('/world');
  await worldReady(page);
  await page.keyboard.press('KeyH');
  await expect(page.getByRole('status', { name: 'Performance' })).toBeVisible();
  await page.keyboard.press('KeyH');
  await expect(page.getByRole('status', { name: 'Performance' })).toBeHidden();
});

test('the world inspector scrubs restoration', async ({ page }) => {
  await page.addInitScript(pastTheRitual);
  await page.goto('/world?debug=1');
  await worldReady(page);

  const panel = page.getByRole('complementary', { name: 'World inspector' });
  await expect(panel).toBeVisible();

  const scrub = panel.getByRole('slider');
  await scrub.fill('1');
  await expect(panel.getByText('restoration')).toContainText('1.00');

  // The panel hides on backtick and comes back, so it never blocks a screenshot.
  await page.keyboard.press('Backquote');
  await expect(panel).toBeHidden();
});
