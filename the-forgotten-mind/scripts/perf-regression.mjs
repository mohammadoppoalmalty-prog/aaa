/* The perf regression gate — GDD Part 12.
   Drives the automated flythrough against a production build, records p50/p95/p99
   frame time and peak draw calls, and fails the build on a budget breach. Runs
   nightly and on every PR touching src/world/.

   Usage:
     node scripts/perf-regression.mjs                       # 30s, this area's baseline
     node scripts/perf-regression.mjs --area memory-forest  # the heaviest area
     node scripts/perf-regression.mjs --bare                # the same area at 0%
     node scripts/perf-regression.mjs --update              # rewrite its baseline
     node scripts/perf-regression.mjs --seconds 90 --strict # what CI runs

   On run length: the default is thirty seconds because a laptop iGPU throttles
   under sustained load, and p95 drifts with it. Measured on this machine, the
   same commit reported 21 ms over 20 s and 35 ms over 90 s — a 60% "regression"
   that was entirely heat. Compare like with like: a baseline recorded at one
   duration says nothing about a run at another, and the script refuses to
   compare across durations for that reason.

   The budgets assume a fixed CI machine with a real GPU. A software renderer
   (SwiftShader, most CI containers, this developer's sandbox) cannot meet them
   and the script says so plainly rather than reporting a false failure. */

import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = resolve(root, 'perf-baseline.json');

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};
const has = (name) => process.argv.includes(`--${name}`);

const SECONDS = Number(arg('seconds', process.env.PERF_SECONDS ?? 30));
/* Which area to fly through, and how healed it is while doing so. A budget is
   only meaningful against the heaviest thing the world can show, and for this
   project that is a fully restored area rather than a bare one. */
const AREA = String(arg('area', 'gate'));
const RESTORED = process.argv.includes('--bare') ? 0 : 1;
const PORT = Number(arg('port', 3111));
const BUDGET = {
  p95: Number(process.env.PERF_MAX_P95 ?? 18),
  drawCalls: Number(process.env.PERF_MAX_DRAWS ?? 180),
  fps: Number(process.env.PERF_MIN_FPS ?? 55),
};
/* A real GPU is a precondition for the numbers, not part of what is measured. */
const SOFTWARE_RENDERER_IS_FINE = process.env.PERF_ALLOW_SOFTWARE === '1';

const ms = (n) => `${n.toFixed(2)} ms`;

async function withServer(run) {
  const server = spawn('npx', ['next', 'start', '--port', String(PORT)], {
    cwd: root,
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await new Promise((ok, fail) => {
      const timer = setTimeout(() => fail(new Error('next start did not become ready in 120s')), 120_000);
      server.stdout.on('data', (chunk) => {
        if (String(chunk).includes('Ready')) {
          clearTimeout(timer);
          ok();
        }
      });
      server.on('exit', (code) => fail(new Error(`next start exited early with code ${code}`)));
    });
    return await run();
  } finally {
    /* `next start` runs under a shell, and killing the shell orphans the server —
       which then holds the port and makes the next run fail to start. Kill the
       whole tree. */
    if (process.platform === 'win32' && server.pid !== undefined) {
      spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      server.kill('SIGTERM');
    }
  }
}

async function measure() {
  /* Vsync must be off. With it on, every frame is quantised to the display's
     refresh interval: p50 pins at 16.7 ms whatever the world costs, and a single
     missed frame reports as 33 ms. That measures the compositor, not the scene. */
  const browser = await chromium.launch({
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--disable-gpu-vsync',
      '--disable-frame-rate-limit',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
    ],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  /* High tier, pinned. The adapter exists to protect a visitor's frame rate;
     letting it drop a tier mid-run would measure the adapter, not the world. */
  await page.addInitScript(
    ([area, restored]) => {
      try {
        localStorage.setItem(
          'tfm.settings.v1',
          JSON.stringify({ quality: 'high', qualityManual: true, showPerfHud: false }),
        );
        localStorage.setItem(
          'tfm.save.v1',
          JSON.stringify({
            version: 1, seed: 1, createdAt: 0, updatedAt: 0, playtimeMs: 0,
            memories: [], revealedAll: restored === 1, area,
            position: [0, 1.5, 4], yaw: 0, luma: { stage: 0, turns: [] }, hasCat: false,
            puzzles: { 'cursor-ritual': 'solved' },
          }),
        );
      } catch { /* storage unavailable — the defaults are close enough to report on */ }
    },
    [AREA, RESTORED],
  );

  await page.goto(`http://127.0.0.1:${PORT}/world?perf=${SECONDS}`);

  const renderer = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    const info = gl?.getExtension('WEBGL_debug_renderer_info');
    return info && gl ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'unknown';
  });

  await page.waitForFunction(() => window.__tfmPerf?.done === true, undefined, {
    timeout: (SECONDS + 40) * 1000,
  });
  const report = await page.evaluate(() => window.__tfmPerf);

  await browser.close();
  return { ...report, renderer };
}

const report = await withServer(measure);
const software = /swiftshader|llvmpipe|software/i.test(report.renderer);

console.log(`\nperf regression · flythrough · ${AREA}${RESTORED ? ' · fully restored' : ' · bare'}`);
console.log(`  renderer     ${report.renderer}${software ? '  (software — budgets are advisory)' : ''}`);
console.log(`  duration     ${report.seconds.toFixed(1)} s over ${report.frames} frames`);
console.log(`  fps          ${report.fps.toFixed(1)}`);
console.log(`  p50 / p95 / p99   ${ms(report.p50)} / ${ms(report.p95)} / ${ms(report.p99)}`);
console.log(`  draw calls   ${report.maxDrawCalls} peak   ·   triangles ${(report.maxTriangles / 1000).toFixed(0)}k peak`);
/* Reported from inside the running world rather than from the flag that asked
   for it: restoration decides how much geometry exists, so a run that silently
   measured a bare world would otherwise look like a regression in a full one. */
console.log(`  restoration  ${(report.restoration * 100).toFixed(0)}% (measured, not requested)`);
if (Math.abs(report.restoration - RESTORED) > 0.02) {
  console.log(`
  ⚠ asked for ${RESTORED * 100}% restoration and measured ${(report.restoration * 100).toFixed(0)}% —`);
  console.log('    this run is not comparable with a baseline recorded at a different one.');
}

/* Baselines are keyed by area. The Gate is an empty plaza and a restored Forest
   is a hundred and twenty trees; comparing one against the other says nothing,
   and a single shared baseline quietly did exactly that. */
const readBaselines = () => {
  if (!existsSync(BASELINE)) return {};
  const parsed = JSON.parse(readFileSync(BASELINE, 'utf8'));
  // A file from before areas were keyed held one report: it was the Gate's.
  return typeof parsed.renderer === 'string' ? { gate: parsed } : parsed;
};

const baselines = readBaselines();
const before = baselines[AREA];

if (before) {
  const delta = report.p95 - before.p95;
  const sign = delta >= 0 ? '+' : '';
  console.log(`  vs baseline  p95 ${sign}${delta.toFixed(2)} ms  (was ${ms(before.p95)} in ${AREA})`);
} else {
  console.log(`  vs baseline  none recorded for ${AREA} yet`);
}

if (has('update')) {
  writeFileSync(BASELINE, JSON.stringify({ ...baselines, [AREA]: report }, null, 2) + '\n');
  console.log(`\n  baseline for ${AREA} written to perf-baseline.json`);
}

/* Two different questions, and conflating them makes the gate useless.

   "Does the world meet its budget?" is only answerable on the machine the budget
   was written for — a fixed CI box with a discrete GPU. Asking it on a laptop
   iGPU or a software renderer produces a failure that says nothing about the
   commit, and a gate that cries wolf gets switched off within a week.

   "Did this commit make the world slower?" is answerable anywhere, by comparing
   against a baseline recorded on the same machine. That is the check that runs
   by default; the absolute budgets are enforced with --strict (set on CI). */
const strict = has('strict') || process.env.PERF_MACHINE === 'ci';
const failures = [];

// Draw calls are geometry, not silicon: this budget holds on any machine.
if (report.maxDrawCalls > BUDGET.drawCalls) {
  failures.push(`draw calls ${report.maxDrawCalls} exceeds the ${BUDGET.drawCalls} budget`);
}

const overBudget = [];
if (report.p95 > BUDGET.p95) overBudget.push(`p95 ${ms(report.p95)} over the ${BUDGET.p95} ms budget`);
if (report.fps < BUDGET.fps) overBudget.push(`${report.fps.toFixed(1)} fps under the ${BUDGET.fps} fps floor`);

if (strict && !(software && !SOFTWARE_RENDERER_IS_FINE)) {
  failures.push(...overBudget);
} else if (overBudget.length) {
  console.log(`\n  advisory (not this machine's budget): ${overBudget.join(' · ')}`);
  if (software) console.log('  this run used a software renderer — frame times are not comparable to the budget');
}

/* The regression check, which is the one that runs everywhere.

   It compares p50, not p95. Two runs of identical code on the same machine move
   p95 by tens of percent — one background process, one GC pause, and the tail
   moves — so gating on p95 produces a red build that a rerun turns green, which
   is the fastest way to teach a team to ignore a gate. p50 is the steady-state
   cost of a frame and barely moves between runs; a real slowdown moves it. p95
   is still checked, at a threshold wide enough that only a genuine stall trips
   it, and both are printed either way. */
const REGRESSION = { p50: 1.15, p95: 1.5 };

if (!has('update') && before) {
  const pct = (now, then) => (((now - then) / then) * 100).toFixed(0);

  if (before.renderer !== report.renderer) {
    console.log('\n  baseline was recorded on a different renderer — regression check skipped');
  } else if (before.seconds < SECONDS * 0.9 || before.seconds > SECONDS * 1.1) {
    console.log('\n  baseline was recorded over a different duration — regression check skipped');
  } else {
    const regressions = [];
    if (report.p50 > before.p50 * REGRESSION.p50) {
      regressions.push(`p50 regressed ${pct(report.p50, before.p50)}% (${ms(before.p50)} → ${ms(report.p50)})`);
    }
    if (report.p95 > before.p95 * REGRESSION.p95) {
      regressions.push(`p95 regressed ${pct(report.p95, before.p95)}% (${ms(before.p95)} → ${ms(report.p95)})`);
    }
    /* A short run is for a quick look while working, not for gating: twelve
       seconds of samples move p50 by a third on the same code. Only the full
       flythrough is trusted to fail a build. */
    if (SECONDS >= 60) failures.push(...regressions);
    else if (regressions.length) console.log(`\n  advisory (short run): ${regressions.join(' · ')}`);
  }
}

if (failures.length) {
  console.error('\nperf regression: FAILED');
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log('\nperf regression: within budget\n');
