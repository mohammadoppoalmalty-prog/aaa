import { expect, test } from '@playwright/test';

const pin = `
  try {
    localStorage.setItem('tfm.settings.v1', JSON.stringify({
      quality: 'low', qualityManual: true, showPerfHud: false,
    }));
  } catch {}
`;

const pastTheRitual = `
  try {
    if (!localStorage.getItem('tfm.save.v1')) localStorage.setItem('tfm.save.v1', JSON.stringify({
      version: 1, seed: 1, createdAt: 0, updatedAt: 0, playtimeMs: 0,
      memories: [], revealedAll: false, area: 'gate', position: [0, 1.5, 4], yaw: 0,
      luma: { stage: 0, turns: [] }, puzzles: { 'cursor-ritual': 'solved' },
    }));
  } catch {}
`;

test.describe('the Gate', () => {
  test('opens with the ritual, and says nothing until the light finds something', async ({ page }) => {
    await page.addInitScript(pin);
    await page.goto('/world');

    const stage = page.getByRole('application', { name: /Move the light/ });
    await expect(stage).toBeVisible();

    // No instruction text before the first glyph — the light is the instruction.
    await expect(page.getByText('/ 7')).toBeHidden();

    // Nor a skip offer: that appears only after three minutes.
    await expect(page.getByRole('button', { name: 'Open it for me' })).toBeHidden();
  });

  test('is completable from the keyboard alone', async ({ page }) => {
    await page.addInitScript(pin);
    await page.goto('/world');
    const stage = page.getByRole('application', { name: /Move the light/ });
    await expect(stage).toBeVisible();

    /* The ritual is the first thing a visitor meets, so "works without a
       pointer" decides whether the site opens at all for them.

       The light starts at the centre and each arrow press moves it 4% of the
       face, so the test reads a glyph's actual position out of the DOM and
       presses exactly as far as it needs to. Sweeping the whole face blindly
       took six hundred key presses and nearly two minutes, and still missed the
       upper half — a slow test that also tests the wrong thing. */
    const glyph = stage.locator('span[style*="left"]').first();
    const box = await glyph.evaluate((node) => ({
      x: parseFloat((node as HTMLElement).style.left) / 100,
      y: parseFloat((node as HTMLElement).style.top) / 100,
    }));

    const step = 0.04;
    const presses = (delta: number) => Math.round(Math.abs(delta) / step);
    for (let i = 0; i < presses(box.x - 0.5); i += 1) {
      await page.keyboard.press(box.x > 0.5 ? 'ArrowRight' : 'ArrowLeft');
    }
    for (let i = 0; i < presses(box.y - 0.5); i += 1) {
      await page.keyboard.press(box.y > 0.5 ? 'ArrowDown' : 'ArrowUp');
    }

    /* Any glyph is the point: the claim under test is that a keyboard can light
       the gate at all, not that it lights exactly one on the way past. */
    await expect(stage.getByText(/[1-7] \/ 7/)).toBeVisible({ timeout: 10_000 });
  });

  test('does not ask a returning visitor to do it again', async ({ page }) => {
    await page.addInitScript(pin);
    await page.addInitScript(pastTheRitual);
    await page.goto('/world');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('application', { name: /Move the light/ })).toBeHidden();
  });
});

test.describe('LUMA', () => {
  test('answers, and points at the Codex when it does not know', async ({ page }) => {
    await page.addInitScript(pin);
    await page.addInitScript(pastTheRitual);
    await page.goto('/world');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: /Ask LUMA/ }).click();
    const panel = page.getByRole('complementary', { name: 'LUMA' });
    await expect(panel).toBeVisible();

    await panel.getByRole('textbox').fill('I am in a hurry');
    await panel.getByRole('button', { name: 'Ask' }).click();
    await expect(panel).toContainText('open the Codex');

    await panel.getByRole('textbox').fill('what is his salary expectation');
    await panel.getByRole('button', { name: 'Ask' }).click();
    // It says it does not know rather than inventing a fact about a person.
    await expect(panel).toContainText('I do not hold that one');
  });

  test('admits it is not an AI when asked', async ({ page }) => {
    await page.addInitScript(pin);
    await page.addInitScript(pastTheRitual);
    await page.goto('/world');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });

    await page.keyboard.press('KeyL');
    const panel = page.getByRole('complementary', { name: 'LUMA' });
    await panel.getByRole('textbox').fill('are you a real ai');
    await panel.getByRole('button', { name: 'Ask' }).click();
    await expect(panel).toContainText('written down in advance');
  });
});
