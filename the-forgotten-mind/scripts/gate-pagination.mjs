/* CI gate 4 — the offset-pagination ban (STANDARDS 1).
   Offset pagination on a list that anyone can append to (the Tree of Visitors,
   the diary) silently duplicates and skips rows as the list grows underneath
   the reader. Cursor pagination is the only correct shape here, and the time to
   ban the wrong one is before the first query exists. */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN = ['app', 'src'];
const SKIP = /(^|[\\/])(node_modules|\.next|generated)([\\/]|$)/;
const EXT = /\.(ts|tsx)$/;

/* Each pattern names a real offset API, not the word "offset" — `offsetWidth`,
   `shadow-camera-offset` and CSS offsets are not what this gate is about. */
const PATTERNS = [
  { re: /\.offset\s*\(/, why: 'query builder .offset()' },
  { re: /\boffset\s*:\s*(?!0\b)[\w$]/, why: 'an offset: argument' },
  { re: /\bskip\s*:\s*(?!0\b)[\w$]/, why: 'a skip: argument' },
  { re: /\bOFFSET\s+\$?\d/, why: 'SQL OFFSET' },
  { re: /[?&]page=\$\{/, why: 'a page= query parameter' },
];

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
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (line.includes('pagination-gate-ignore')) return;
      for (const { re, why } of PATTERNS) {
        if (re.test(line)) failures.push(`${rel}:${i + 1}  ${why} — paginate by cursor`);
      }
    });
  }
}

if (failures.length) {
  console.error(`pagination gate: ${failures.length} violation(s)\n`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log('pagination gate: clean');
