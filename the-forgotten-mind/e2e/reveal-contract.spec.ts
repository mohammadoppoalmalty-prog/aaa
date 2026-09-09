import { expect, test } from '@playwright/test';

/**
 * The Reveal Contract — GDD Part 0.
 *
 * "Recovering a memory in Layer 1 permanently unlocks its Codex entry in Layer
 * 2" is the entire bridge between the two halves of this project. It is one
 * sentence in the design document and it is the thing most likely to silently
 * break, because the two layers share nothing but a save.
 */

const pin = `
  try {
    localStorage.setItem('tfm.settings.v1', JSON.stringify({
      quality: 'low', qualityManual: true, showPerfHud: false,
    }));
  } catch {}
`;

/* Seeded only when no save exists yet.

   `addInitScript` runs on *every* navigation in the page, including the one
   into the Codex at the end of a test — so an unguarded seed silently restores
   the starting save and erases what the world just recovered, which looks
   exactly like a broken Reveal Contract. */
const seedSave = (memories: string[]) => `
  try {
    if (!localStorage.getItem('tfm.save.v1')) localStorage.setItem('tfm.save.v1', JSON.stringify({
      version: 1, seed: 1, createdAt: 0, updatedAt: 0, playtimeMs: 0,
      memories: ${JSON.stringify(memories)}, revealedAll: false,
      area: 'gate', position: [0, 1.5, 4], yaw: 0,
      luma: { stage: 0, turns: [] }, puzzles: { 'cursor-ritual': 'solved' },
    }));
  } catch {}
`;

test('a recovered memory is unlocked in the Codex', async ({ page }) => {
  await page.addInitScript(pin);
  await page.addInitScript(seedSave(['greybox-1']));

  await page.goto('/codex');
  const counter = page.getByRole('status');
  await expect(counter).toContainText('1 /');

  // The recovered card shows its title; every other card is still a silhouette.
  await expect(page.getByRole('heading', { name: 'Grey-box memory 1' })).toBeVisible();
  await expect(page.getByText('Not yet recovered').first()).toBeVisible();
});

test('the skip path opens everything, with no confirmation in the way', async ({ page }) => {
  await page.addInitScript(pin);
  await page.goto('/codex');

  await expect(page.getByRole('status')).toContainText('0 /');
  await page.getByRole('button', { name: 'open the whole Codex' }).click();

  await expect(page.getByRole('status')).toContainText('everything is open');
  await expect(page.getByText('Not yet recovered')).toHaveCount(0);

  // And it survives a reload — the skip is a decision, not a session flag.
  await page.reload();
  await expect(page.getByRole('status')).toContainText('everything is open');
});

test('recovering a memory in the world reaches the Codex', async ({ page }) => {
  await page.addInitScript(pin);
  await page.addInitScript(seedSave([]));
  await page.goto('/world');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('◈ 0 / 5')).toBeVisible();

  /* Walk to the mote at [-2, 1.2, 8]: the player spawns at [0, 1.5, 4] facing
     -Z, so walking backwards reaches it.

     Held until the mote is in reach rather than for a fixed duration. The
     controller clamps its delta to 1/30 s so a stalled frame cannot tunnel the
     capsule through a wall — which means that on a software renderer at ~10 fps
     the player genuinely covers less ground per second, and a wall-clock walk
     would be a flake waiting to happen on slower CI. */
  /* The canvas appears before the controller does: Rapier's WASM loads inside
     Suspense, so the keyboard listener attaches a beat later. A key pressed
     before then is lost entirely — the browser sends no repeat events for a key
     that is already held — and the player simply never moves. */
  await page.waitForFunction(() => typeof window.__tfmPlayer === 'function');

  await page.keyboard.down('KeyS');
  /* Waiting on the prompt itself rather than polling `page.evaluate`: ten
     round-trips a second compete with the render loop for the main thread, and
     on a software renderer already at ~10 fps that alone can keep the player
     from ever arriving. Playwright's visibility wait costs the page nothing. */
  await expect(page.locator('.tfm-prompt')).toBeVisible({ timeout: 45_000 });
  await page.keyboard.up('KeyS');
  await page.keyboard.press('KeyE');

  await expect(page.getByText('◈ 1 / 5')).toBeVisible();

  await page.goto('/codex');
  await expect(page.getByRole('status')).toContainText('1 /');
});

declare global {
  interface Window {
    __tfmPlayer?: () => { x: number; y: number; z: number; near: string | null };
  }
}
