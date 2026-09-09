/* Look at it.
   Every other gate in this project asks a question a machine can answer. This
   one answers the question no assertion can: does it look like anything?

     node scripts/shot.mjs --area village --restoration 1
     node scripts/shot.mjs --area memory-forest --restoration 0 --out bare.png

   Runs against a production build, waits for the world to settle, and writes a
   PNG. It is not a gate and never fails a build — it exists to be looked at. */

import { spawn, spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};

const AREA = String(arg('area', 'village'));
const RESTORATION = Number(arg('restoration', 1));
const OUT = resolve(root, String(arg('out', `shot-${AREA}-${Math.round(RESTORATION * 100)}.png`)));
const PORT = Number(arg('port', 3117));
const YAW = Number(arg('yaw', 0));
/* How long to let the world settle. The ending speaks for half a minute. */
const WAIT = Number(arg('wait', 4000));

const server = spawn('npx', ['next', 'start', '--port', String(PORT)], {
  cwd: root,
  shell: process.platform === 'win32',
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await new Promise((ok, fail) => {
    const timer = setTimeout(() => fail(new Error('next start did not become ready')), 120_000);
    server.stdout.on('data', (chunk) => {
      if (String(chunk).includes('Ready')) {
        clearTimeout(timer);
        ok();
      }
    });
    server.on('exit', (code) => fail(new Error(`next start exited with ${code}`)));
  });

  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  await page.addInitScript(
    ([area, restoration, yaw]) => {
      try {
        localStorage.setItem('tfm.settings.v1', JSON.stringify({ quality: 'high', qualityManual: true, showPerfHud: false }));
        localStorage.setItem(
          'tfm.save.v1',
          JSON.stringify({
            version: 1, seed: 1, createdAt: 0, updatedAt: 0, playtimeMs: 0,
            memories: [], revealedAll: restoration >= 1, area,
            position: [0, 1.5, 14], yaw,
            luma: { stage: 0, turns: [] }, hasCat: false,
            puzzles: { 'cursor-ritual': 'solved', fountain: 'solved', 'core-engine': 'solved' },
          }),
        );
      } catch { /* a screenshot of the defaults is still worth looking at */ }
    },
    [AREA, RESTORATION, YAW],
  );

  await page.goto(`http://127.0.0.1:${PORT}/world`);
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 60_000 });
  // Let the first frames, the fog and the instance matrices settle.
  await page.waitForTimeout(WAIT);
  await page.screenshot({ path: OUT });
  await browser.close();

  console.log(`\n  ${AREA} at ${Math.round(RESTORATION * 100)}% → ${OUT}`);
} finally {
  if (process.platform === 'win32' && server.pid !== undefined) {
    spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    server.kill('SIGTERM');
  }
}
