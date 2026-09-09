import { expect, test } from '@playwright/test';

/**
 * CI gate 1 — the React-commit-count gate.
 *
 * Architecture Rule 1: React never renders per frame. A re-render during
 * gameplay is a bug, and it is the single most common cause of an R3F project
 * quietly losing half its frame rate over a few months. This test makes that
 * rule enforceable instead of aspirational.
 *
 * It counts commits through the DevTools global hook, which React looks for at
 * startup — so the hook has to be installed before any application script runs.
 */

const HOOK = `
  (() => {
    const counter = { commits: 0 };
    globalThis.__tfmCommits = counter;
    if (!globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        renderers: new Map(),
        supportsFiber: true,
        inject: () => 1,
        onCommitFiberRoot: () => { counter.commits += 1; },
        onCommitFiberUnmount: () => {},
        onPostCommitFiberRoot: () => {},
      };
    }
  })();
`;

/* The tier is pinned by hand before the page loads. A quality change is a real,
   legitimate commit — detect-gpu resolving, or the adapter dropping a tier on a
   software renderer — and leaving it in would measure the adapter rather than
   the rule under test, which is: does *walking around* re-render React? */
const PIN_QUALITY = `
  try {
    localStorage.setItem('tfm.settings.v1', JSON.stringify({
      quality: 'low', qualityManual: true, showPerfHud: false,
    }));
    /* Start after the Gate's ritual: this gate measures gameplay, and the
       arrival is a screen the player has already passed by then. */
    localStorage.setItem('tfm.save.v1', JSON.stringify({
      version: 1, seed: 1, createdAt: 0, updatedAt: 0, playtimeMs: 0,
      memories: [], revealedAll: false, area: 'gate', position: [0, 1.5, 4], yaw: 0,
      luma: { stage: 0, turns: [] }, puzzles: { 'cursor-ritual': 'solved' },
    }));
  } catch {}
`;

test('gameplay produces no React commits', async ({ page }) => {
  await page.addInitScript(PIN_QUALITY);
  await page.addInitScript(HOOK);
  await page.goto('/world');

  /* Let the engine mount and settle. Commits here are expected and ignored: the
     engine mounts, the save hydrates, and the HUD's memory counter shows itself
     for four seconds and then hides again. Six seconds clears all of it, so what
     is measured afterwards is gameplay and nothing else. */
  await page.waitForTimeout(6000);
  const warm = await page.evaluate(() => (globalThis as { __tfmCommits?: { commits: number } }).__tfmCommits?.commits ?? -1);
  expect(warm, 'the DevTools hook was not installed before React started').toBeGreaterThan(0);

  /* Ten seconds of gameplay: walking, running, turning, strafing.

     Deliberately no `E`. `E` interacts when a memory is within reach, and
     recovering one is a state change a visitor asked for — a legitimate commit
     that would mask the thing this gate exists to catch. Movement is what must
     be free. */
  await page.keyboard.down('KeyW');
  await page.keyboard.down('ShiftLeft');
  for (let i = 0; i < 10; i += 1) {
    const key = i % 2 === 0 ? 'KeyQ' : i % 3 === 0 ? 'KeyA' : 'KeyD';
    await page.keyboard.down(key);
    await page.waitForTimeout(1000);
    await page.keyboard.up(key);
  }
  await page.keyboard.up('ShiftLeft');
  await page.keyboard.up('KeyW');

  const after = await page.evaluate(() => (globalThis as { __tfmCommits?: { commits: number } }).__tfmCommits?.commits ?? -1);

  // With the tier pinned, zero is the standard and the only allowance is one
  // stray commit from a media-query listener firing late.
  expect(after - warm, 'React re-rendered during gameplay — check for hooks in a per-frame path').toBeLessThanOrEqual(1);
});
