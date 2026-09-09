import { expect, test } from '@playwright/test';

/**
 * CI gate 2 — the memory-leak test.
 *
 * Three.js does not garbage-collect GPU resources: every geometry, material and
 * texture stays alive until something disposes it. In Phase 0 there is one
 * scene, so this test proves the baseline — mount and unmount the world
 * repeatedly and the heap must come back down. The `DisposalRegistry` arrives
 * in Phase 1 and this is the test it will have to keep passing.
 */

const CYCLES = 4;

test('mounting and unmounting the world does not grow the heap', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'heap measurement needs the CDP session');

  const client = await page.context().newCDPSession(page);
  const heap = async (): Promise<number> => {
    await client.send('HeapProfiler.collectGarbage');
    const { result } = await client.send('Runtime.evaluate', {
      expression: 'performance.memory.usedJSHeapSize',
      returnByValue: true,
    });
    return Number(result.value);
  };

  await page.goto('/world');
  await page.waitForTimeout(4000);

  // One warm-up cycle, so shader compilation and lazy chunks are not counted.
  await page.goto('/codex');
  await page.goto('/world');
  await page.waitForTimeout(3000);
  const baseline = await heap();

  for (let i = 0; i < CYCLES; i += 1) {
    await page.goto('/codex');
    await page.waitForTimeout(500);
    await page.goto('/world');
    await page.waitForTimeout(3000);
  }

  const after = await heap();
  const growthMb = (after - baseline) / 1_048_576;

  // Four full world teardowns must not cost more than 12 MB of retained heap.
  // A real leak in this loop grows by an order of magnitude more than that.
  expect(growthMb, `heap grew ${growthMb.toFixed(1)} MB across ${CYCLES} world mounts`).toBeLessThan(12);
});
