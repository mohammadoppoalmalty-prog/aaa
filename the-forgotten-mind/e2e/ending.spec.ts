import { expect, test, type Page } from '@playwright/test';

/**
 * The ending, from a visitor's side.
 *
 * The script's rules are unit-tested. What this checks is the part no pure
 * function can: that it plays on its own, that it is announced rather than
 * painted, and that the last thing in the tower is a link out of the fiction —
 * which is the entire stated purpose of the room.
 */

const inTheTower = (over: Record<string, unknown> = {}) => `
  try {
    localStorage.setItem('tfm.settings.v1', JSON.stringify({
      quality: 'low', qualityManual: true, showPerfHud: false, reducedMotion: true,
    }));
    localStorage.setItem('tfm.save.v1', JSON.stringify({
      version: 1, seed: 5, createdAt: 0, updatedAt: 0, playtimeMs: 0,
      memories: [], revealedAll: false, area: 'contact-tower',
      position: [0, 1.5, 4], yaw: 0, luma: { stage: 0, turns: [] }, hasCat: false,
      puzzles: { 'core-engine': 'solved' },
      ...${JSON.stringify(over)},
    }));
  } catch {}
`;

const ready = async (page: Page) => {
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => typeof (window as { __tfmPlayer?: unknown }).__tfmPlayer === 'function');
};

test('plays itself, and is announced rather than painted', async ({ page }) => {
  await page.addInitScript(inTheTower());
  await page.goto('/world');
  await ready(page);

  /* Nothing is pressed. Standing in the room is the whole interaction — the
     last thing this world says is not something to be asked for. Reduced
     Motion is on, so each line prints whole and the wait is only the hold. */
  const caption = page.getByRole('status');
  await expect(caption.filter({ hasText: 'The engine is running' })).toBeVisible({ timeout: 20_000 });
});

test('ends at a real person, not inside its own story', async ({ page }) => {
  await page.addInitScript(inTheTower());
  await page.goto('/world');
  await ready(page);

  // The tower's stated purpose in the atlas: "the way to reach a real person."
  const door = page.getByRole('link', { name: 'Write to him' });
  await expect(door).toBeVisible({ timeout: 60_000 });
  await expect(door).toHaveAttribute('href', '/codex/contact');

  await door.click();
  await expect(page).toHaveURL(/\/codex\/contact$/);
});

test('does not claim the visitor found what they did not', async ({ page }) => {
  await page.addInitScript(inTheTower());
  await page.goto('/world');
  await ready(page);

  /* This save recovered nothing. An ending that congratulated it would be the
     one lie this project cannot afford, so the assertion is on the text a
     visitor actually sees rather than on the pure function alone. */
  const stage = page.locator('body');
  await expect(page.getByRole('link', { name: 'Write to him' })).toBeVisible({ timeout: 60_000 });
  await expect(stage).not.toContainText('nearly all of it');
  await expect(stage).not.toContainText('More than half');
});

test('stays shut until the Engine is running', async ({ page }) => {
  await page.addInitScript(`
    try {
      localStorage.setItem('tfm.settings.v1', JSON.stringify({ quality: 'low', qualityManual: true }));
      localStorage.setItem('tfm.save.v1', JSON.stringify({
        version: 1, seed: 5, createdAt: 0, updatedAt: 0, playtimeMs: 0,
        memories: [], revealedAll: false, area: 'contact-tower',
        position: [0, 1.5, 4], yaw: 0, luma: { stage: 0, turns: [] }, hasCat: false,
        puzzles: {},
      }));
    } catch {}
  `);
  await page.goto('/world');
  await ready(page);

  // The room is still a room. It just has nothing to say yet.
  await expect(page.getByRole('link', { name: 'Write to him' })).toBeHidden();
});
