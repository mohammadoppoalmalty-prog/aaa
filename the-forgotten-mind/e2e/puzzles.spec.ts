import { expect, test, type Page } from '@playwright/test';

/**
 * Thirteen puzzles, thirteen areas, one test that walks into each of them.
 *
 * The unit suite already proves every board is solvable. What it cannot prove is
 * that a player can *reach* one: that the station is in the area, that pressing
 * E opens it, that the sheet says what the puzzle is, and that finishing it is
 * written to the save. That is what breaks when an area is renamed or a board is
 * added to the registry and forgotten in the map.
 */

const PUZZLES: readonly { area: string; puzzle: string; title: string }[] = [
  { area: 'childhood-home', puzzle: 'attic-order', title: 'Attic Order' },
  { area: 'learning-workshop', puzzle: 'tool-bench', title: 'The Bench' },
  { area: 'innovation-laboratory', puzzle: 'circuit-table', title: 'The Circuit Table' },
  { area: 'developer-studio', puzzle: 'workstation-boot', title: 'Cold Boot' },
  { area: 'knowledge-library', puzzle: 'shelf-order', title: 'The Shelves' },
  { area: 'experience-archive', puzzle: 'journal-rail', title: 'The Rail' },
  { area: 'crystal-lake', puzzle: 'light-reflection', title: 'Reflection' },
  { area: 'underground-cave', puzzle: 'echo-chamber', title: 'The Echo Chamber' },
  { area: 'ancient-temple', puzzle: 'mirror-altar', title: 'The Mirror Altar' },
  { area: 'floating-islands', puzzle: 'gravity-bridge', title: 'The Gravity Bridge' },
  { area: 'dream-observatory', puzzle: 'constellation', title: 'The Constellation' },
  { area: 'sky-bridge', puzzle: 'bridge-assembly', title: 'Bridge Assembly' },
  { area: 'contact-tower', puzzle: 'core-engine', title: 'The Core Engine' },
];

const startIn = (area: string) => `
  try {
    localStorage.setItem('tfm.settings.v1', JSON.stringify({
      quality: 'low', qualityManual: true, showPerfHud: false,
    }));
    localStorage.setItem('tfm.save.v1', JSON.stringify({
      version: 1, seed: 5, createdAt: 0, updatedAt: 0, playtimeMs: 0,
      memories: [], revealedAll: true, area: ${JSON.stringify(area)},
      position: [0, 1.5, 4], yaw: 0, luma: { stage: 0, turns: [] }, hasCat: false,
      puzzles: { 'cursor-ritual': 'solved' },
    }));
  } catch {}
`;

const ready = async (page: Page) => {
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => typeof (window as { __tfmPlayer?: unknown }).__tfmPlayer === 'function');
};

/** Cycle to the station with `]` rather than walking — the puzzle needs no aim. */
const openStation = async (page: Page, title: string) => {
  const prompt = page.locator('.tfm-prompt');
  for (let i = 0; i < 14; i += 1) {
    await page.keyboard.press('BracketRight');
    if (((await prompt.textContent()) ?? '').includes(title)) break;
  }
  await expect(prompt).toContainText(title);
  await page.keyboard.press('KeyE');
};

for (const { area, puzzle, title } of PUZZLES) {
  test(`${title} can be found and finished in ${area}`, async ({ page }) => {
    await page.addInitScript(startIn(area));
    await page.goto('/world');
    await ready(page);

    await openStation(page, title);

    const sheet = page.getByRole('dialog', { name: title });
    await expect(sheet).toBeVisible();
    // The premise is LUMA speaking, and it is the only instruction a player gets.
    await expect(sheet.locator('p').first()).not.toBeEmpty();

    /* Take every hint. The skip is offered three minutes in *or* once the game
       has said everything it has to say — a test should not have to wait out a
       timer to prove the mercy path exists. */
    for (let i = 0; i < 3; i += 1) {
      await sheet.getByRole('button', { name: /Ask/ }).click();
    }

    await sheet.getByRole('button', { name: 'Solve it for me' }).click();

    // Solved is solved: it says so, and it is written down.
    await expect(sheet).toContainText('Solved');
    await expect
      .poll(async () =>
        page.evaluate((id) => {
          const raw = localStorage.getItem('tfm.save.v1');
          if (!raw) return null;
          return (JSON.parse(raw) as { puzzles?: Record<string, string> }).puzzles?.[id] ?? null;
        }, puzzle),
      )
      .toBe('skipped');

    // And the rewards are paid whether it was solved or skipped.
    const memories = await page.evaluate(() => {
      const raw = localStorage.getItem('tfm.save.v1');
      return raw ? ((JSON.parse(raw) as { memories?: string[] }).memories ?? []) : [];
    });
    expect(memories.length).toBeGreaterThan(0);
  });
}

test('a puzzle can be solved by playing it, not only by skipping it', async ({ page }) => {
  /* Every other test here takes the skip, which calls `solve` directly and
     never touches the board's controls. So without this one, thirteen boards
     could be wired to nothing at all and the suite would stay green. Attic
     Order is the one whose state is legible from the DOM, so it is the one that
     gets played: read the years, swap any pair out of order, repeat. */
  await page.addInitScript(startIn('childhood-home'));
  await page.goto('/world');
  await ready(page);

  await openStation(page, 'Attic Order');
  const sheet = page.getByRole('dialog', { name: 'Attic Order' });
  await expect(sheet).toBeVisible();

  const years = async () =>
    (await sheet.locator('li strong').allTextContents()).map((text) => Number(text));

  // Bubble sort, driven entirely through the buttons a player would press.
  for (let pass = 0; pass < 40; pass += 1) {
    const current = await years();
    const at = current.findIndex((year, index) => index > 0 && year < current[index - 1]!);
    if (at === -1) break;
    await sheet.locator('li').nth(at - 1).getByRole('button', { name: /^Swap/ }).click();
  }

  expect(await years()).toEqual([...(await years())].sort((a, b) => a - b));
  await expect(sheet).toContainText('Solved');

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const raw = localStorage.getItem('tfm.save.v1');
        return raw
          ? ((JSON.parse(raw) as { puzzles?: Record<string, string> }).puzzles?.['attic-order'] ?? null)
          : null;
      }),
    )
    .toBe('solved');
});

test('a puzzle sheet closes on Escape, and the world is still there', async ({ page }) => {
  await page.addInitScript(startIn('childhood-home'));
  await page.goto('/world');
  await ready(page);

  await openStation(page, 'Attic Order');
  const sheet = page.getByRole('dialog', { name: 'Attic Order' });
  await expect(sheet).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(page.locator('canvas')).toBeVisible();
});
