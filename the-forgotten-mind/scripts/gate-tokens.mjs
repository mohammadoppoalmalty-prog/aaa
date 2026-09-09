/* CI gate · the token lint.
   Two rules, both from STANDARDS 7.8 / 8.2:
     1. Components consume the semantic tier only. A component reaching past it to a
        Global token is how a design system quietly stops being one.
     2. No arbitrary pixel values in component styles — spacing comes off the 4px scale.
   Runs before there is much code to fix, which is the only time this is cheap. */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'src/generated/tokens.manifest.json'), 'utf8'));
const globalNames = new Set(manifest.tiers.global);

const SCAN = ['app', 'src'];
const SKIP = /(^|[\\/])(node_modules|\.next|generated)([\\/]|$)/;
const EXT = /\.(css|ts|tsx)$/;

/* Pixel values that are legitimately not spacing: hairlines, and 0. */
const PX_ALLOWED = new Set(['0px', '1px', '2px']);
const PX = /(?<![\w.-])(\d+(?:\.\d+)?px)/g;
const VAR = /--tfm-[a-z0-9-]+/g;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (SKIP.test(full)) continue;
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (EXT.test(full)) yield full;
  }
}

const failures = [];

for (const dir of SCAN) {
  let exists = true;
  try { statSync(resolve(root, dir)); } catch { exists = false; }
  if (!exists) continue;

  for (const file of walk(resolve(root, dir))) {
    const rel = relative(root, file).replace(/\\/g, '/');
    const lines = readFileSync(file, 'utf8').split('\n');

    lines.forEach((line, i) => {
      if (line.includes('token-lint-ignore')) return;
      const at = `${rel}:${i + 1}`;

      for (const name of line.match(VAR) ?? []) {
        if (globalNames.has(name)) {
          failures.push(`${at}  Global token ${name} used outside the semantic tier`);
        }
      }

      if (rel.endsWith('.css')) {
        for (const [, px] of line.matchAll(PX)) {
          if (!PX_ALLOWED.has(px)) failures.push(`${at}  arbitrary pixel value ${px} — use a space token`);
        }
      }
    });
  }
}

if (failures.length) {
  console.error(`token gate: ${failures.length} violation(s)\n`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log('token gate: clean');
