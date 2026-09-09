/* The content lint — GDD Part 6, STANDARDS 9.5.
   Runs in CI and before every build. It checks three kinds of thing:

     1. the schema, via the same zod definitions the loader and the Codex use;
     2. the editorial rules a schema cannot express — body length, placeholder
        text left in a published entry, duplicate ids;
     3. the counts the GDD commits to, reported rather than enforced while the
        content is still being written.

   A draft entry is held to the schema but not to the editorial rules: templates
   exist to be incomplete. What is forbidden is a *published* entry that still
   says REPLACE. */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* Imported straight from the TypeScript source — Node strips the types — so the
   lint and the application validate against one definition, not two that drift. */
const { COLLECTIONS, BODY_WORDS } = await import('../content/schema.ts');

const PLACEHOLDER = /\bREPLACE\b/;
const words = (text) => text.trim().split(/\s+/).filter(Boolean).length;

const problems = [];
const warnings = [];
const counts = {};

for (const [name, { dir, schema, key }] of Object.entries(COLLECTIONS)) {
  const path = join(root, 'content', dir);
  const seen = new Map();
  let published = 0;
  let drafts = 0;

  if (!existsSync(path)) {
    warnings.push(`content/${dir}/ does not exist yet`);
    counts[name] = { published: 0, drafts: 0 };
    continue;
  }

  for (const file of readdirSync(path).filter((f) => f.endsWith('.mdx')).sort()) {
    const at = `content/${dir}/${file}`;
    const { data, content } = matter(readFileSync(join(path, file), 'utf8'));

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        problems.push(`${at}  ${issue.path.join('.') || '(root)'}: ${issue.message}`);
      }
      continue;
    }

    const entry = parsed.data;
    const id = String(entry[key]);
    const twin = seen.get(id);
    if (twin) problems.push(`${at}  duplicate ${key} "${id}" — also in ${twin}`);
    seen.set(id, at);

    if (entry.draft) {
      drafts += 1;
      continue;
    }
    published += 1;

    const body = content.trim();
    const count = words(body);
    if (count < BODY_WORDS.min || count > BODY_WORDS.max) {
      problems.push(`${at}  body is ${count} words; the rule is ${BODY_WORDS.min}–${BODY_WORDS.max}`);
    }
    if (PLACEHOLDER.test(body) || PLACEHOLDER.test(JSON.stringify(data))) {
      problems.push(`${at}  still contains placeholder text but is not marked draft: true`);
    }
  }

  counts[name] = { published, drafts };
}

/* The GDD's committed counts. Reported, not enforced — failing a build for
   content that has not been written yet would make the lint useless during the
   months it is being written. */
const TARGETS = { projects: 10, memories: 100, skills: 24, experience: 8 };

console.log('\ncontent lint');
for (const [name, { published, drafts }] of Object.entries(counts)) {
  const target = TARGETS[name];
  const bar = target ? `  (${published}/${target} authored)` : '';
  console.log(`  ${name.padEnd(11)} ${String(published).padStart(3)} published · ${drafts} draft${bar}`);
}

if (warnings.length) {
  console.log('');
  for (const w of warnings) console.log(`  note: ${w}`);
}

if (problems.length) {
  console.error(`\ncontent lint: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('\ncontent lint: clean\n');
