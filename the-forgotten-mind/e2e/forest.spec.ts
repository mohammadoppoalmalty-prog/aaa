import { expect, test, type Page } from '@playwright/test';

const worldReady = async (page: Page) => {
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => typeof (window as { __tfmPlayer?: unknown }).__tfmPlayer === 'function');
};

/** Start in the Forest, past the Gate's ritual, as a player walking in would. */
const inTheForest = `
  try {
    localStorage.setItem('tfm.settings.v1', JSON.stringify({
      quality: 'low', qualityManual: true, showPerfHud: false,
    }));
    if (!localStorage.getItem('tfm.save.v1')) localStorage.setItem('tfm.save.v1', JSON.stringify({
      version: 1, seed: 5, createdAt: 0, updatedAt: 0, playtimeMs: 0,
      memories: [], revealedAll: false, area: 'memory-forest', position: [0, 1.5, 4], yaw: 0,
      luma: { stage: 0, turns: [] }, hasCat: false, puzzles: { 'cursor-ritual': 'solved' },
    }));
  } catch {}
`;

test('LUMA speaks on arrival, without being asked', async ({ page }) => {
  await page.addInitScript(inTheForest);
  await page.goto('/world');
  await worldReady(page);

  /* The player spawns nine metres from the cracked stone, so meeting LUMA is
     not an interaction — a first contact that has to be requested is not an
     arrival. */
  const speech = page.getByRole('status').filter({ hasText: 'You came back' });
  await expect(speech).toBeVisible({ timeout: 15_000 });
});

test('the lanterns can be turned, and say which way they face', async ({ page }) => {
  await page.addInitScript(inTheForest);
  await page.goto('/world');
  await worldReady(page);

  const prompt = page.locator('.tfm-prompt');

  // Cycle to a lantern rather than walking to one — the puzzle needs no aim.
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press('BracketRight');
    const text = (await prompt.textContent()) ?? '';
    if (text.includes('lantern')) break;
  }
  await expect(prompt).toContainText('lantern');

  const before = (await prompt.textContent()) ?? '';
  await page.keyboard.press('KeyE');
  // Turning it changes the compass direction in its own label.
  await expect(prompt).not.toHaveText(before);
  await expect(prompt).toContainText('lantern');
});

test('the cat is found by leaving the path, and then follows', async ({ page }) => {
  await page.addInitScript(inTheForest);
  await page.goto('/world');
  await worldReady(page);

  const prompt = page.locator('.tfm-prompt');
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('BracketRight');
    const text = (await prompt.textContent()) ?? '';
    if (text.includes('cat')) break;
  }
  await expect(prompt).toContainText('grey cat');

  await page.keyboard.press('KeyE');
  // It is remembered, because a companion that forgets you is not one.
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const raw = localStorage.getItem('tfm.save.v1');
        return raw ? (JSON.parse(raw) as { hasCat?: boolean }).hasCat === true : false;
      }),
    )
    .toBe(true);
});
