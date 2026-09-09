import { expect, test, type Page } from '@playwright/test';

/**
 * The canvas appears before the world does: everything inside `<Physics>` waits
 * on Rapier's WebAssembly, and that includes every interactable. A test that
 * presses a key the moment the canvas is visible is pressing it into an empty
 * registry.
 */
const worldReady = async (page: Page) => {
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => typeof (window as { __tfmPlayer?: unknown }).__tfmPlayer === 'function');
};

/** Every test here starts as a returning visitor, past the Gate's ritual. */
const seed = (extra = '') => `
  try {
    localStorage.setItem('tfm.settings.v1', JSON.stringify({
      quality: 'low', qualityManual: true, showPerfHud: false,
    }));
    if (!localStorage.getItem('tfm.save.v1')) localStorage.setItem('tfm.save.v1', JSON.stringify({
      version: 1, seed: 7, createdAt: 0, updatedAt: 0, playtimeMs: 0,
      memories: [], revealedAll: false, area: '${extra || 'gate'}', position: [0, 1.5, 4], yaw: 0,
      luma: { stage: 0, turns: [] }, hasCat: false, puzzles: { 'cursor-ritual': 'solved' },
    }));
  } catch {}
`;

test('every interactable can be reached without aiming', async ({ page }) => {
  await page.addInitScript(seed());
  await page.goto('/world');
  await worldReady(page);

  /* `[` and `]` cycle by distance and the prompt is a live region, so a screen
     reader hears what is now focused. This is the whole mechanism behind the
     claim that the world is keyboard-completable. */
  const prompt = page.locator('.tfm-prompt');
  await page.keyboard.press('BracketRight');
  await expect(prompt).toBeVisible();
  const first = await prompt.textContent();

  await page.keyboard.press('BracketRight');
  await expect(prompt).not.toHaveText(first ?? '');
  await expect(prompt).toHaveAttribute('aria-live', 'polite');

  // And taking it works from the cycle, with no walking at all.
  await page.keyboard.press('BracketLeft');
  await page.keyboard.press('KeyE');
  await expect(page.getByText('◈ 1 / 5')).toBeVisible();
});

test('the pause menu carries progress off this machine', async ({ page }) => {
  await page.addInitScript(seed());
  await page.goto('/world');
  await worldReady(page);

  await page.keyboard.press('Escape');
  const menu = page.getByRole('dialog', { name: 'Paused' });
  await expect(menu).toBeVisible();

  await menu.getByRole('button', { name: 'Save code' }).click();
  const code = await menu.getByRole('textbox', { name: 'Your save code' }).inputValue();
  expect(code.length).toBeGreaterThan(20);
  expect(code).not.toMatch(/[+/=]/);
});

test('begin again asks first — it is the one destructive action here', async ({ page }) => {
  await page.addInitScript(seed());
  await page.goto('/world');
  await worldReady(page);

  await page.keyboard.press('Escape');
  const menu = page.getByRole('dialog', { name: 'Paused' });
  await menu.getByRole('button', { name: 'Begin again' }).click();
  await expect(menu).toContainText('This erases everything you have recovered.');
  await menu.getByRole('button', { name: 'Keep it' }).click();
  await expect(menu).not.toContainText('This erases everything');
});

test('fast travel lists only what is genuinely reachable', async ({ page }) => {
  await page.addInitScript(seed('village'));
  await page.goto('/world');
  await worldReady(page);

  await page.keyboard.press('Escape');
  const menu = page.getByRole('dialog', { name: 'Paused' });
  await menu.getByRole('button', { name: 'Map & fast travel' }).click();

  await expect(menu.getByRole('button', { name: /Memory Forest/ })).toBeVisible();
  // The Hall needs 40% restoration, and this save has none of it.
  await expect(menu.getByRole('button', { name: /Achievement Hall/ })).toBeHidden();
});

test('the fountain can be solved, and says what it becomes', async ({ page }) => {
  await page.addInitScript(seed('village'));
  await page.goto('/world');
  await worldReady(page);

  // The grate is the nearest interactable at the centre of the plaza.
  await page.keyboard.press('BracketRight');
  await expect(page.locator('.tfm-prompt')).toContainText('grate');
  await page.keyboard.press('KeyE');

  const grate = page.getByRole('dialog', { name: 'The fountain pipes' });
  await expect(grate).toBeVisible();
  await grate.getByRole('button', { name: 'Solve it for me' }).click();
  await expect(grate).toContainText('its level is how much of him you have remembered');
});
