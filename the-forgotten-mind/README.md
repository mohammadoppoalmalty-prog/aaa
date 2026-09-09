# The Forgotten Mind

A portfolio built as two co-existing layers over one source of truth: **the world**
(WebGL, explorable) and **the Codex** (server-rendered, readable, crawlable). The
design is [GDD.md](../GDD.md); the engineering charter is [STANDARDS.md](../STANDARDS.md);
the visual language is design 06, *The Assembly*.

**Phase 0 is complete; Phase 1 is well under way.** The foundation exists because
every decision in it becomes a rewrite if deferred. What is missing is stated as
plainly as what is here — including the one thing that cannot be scaffolded: the
real career content in `content/`.

## What works today

| Deliverable | State |
|---|---|
| Next.js 15 · React 19 · TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) | ✅ |
| The token pipeline — `tokens.json` → CSS custom properties · TypeScript · **GLSL** · Tailwind theme | ✅ |
| The quality-tier system and its live adapter, unit-tested without a GPU | ✅ |
| Grey-box world: Rapier kinematic capsule, third-person spring camera, blockout geometry | ✅ |
| Perf HUD (`H`) — fps, frame time, draw calls, triangles, geo/tex, heap | ✅ |
| `/debug` world inspector + the in-world panel (`/world?debug=1`) | ✅ restoration scrub, tier switch, disposal readout |
| CI gate · token lint | ✅ |
| CI gate · offset-pagination ban | ✅ |
| CI gate · React-commit-count | ✅ |
| CI gate · memory-leak | ✅ baseline |
| `webglcontextlost` handling | ✅ guard in place (in-fiction copy lands with LUMA) |
| Storybook + a11y addon + the component state matrix | ✅ |
| Asset pipeline (`gltf-transform`, Draco, LOD0/1/2) | ✅ |
| Perf regression (90s flythrough, p50/p95/p99, baseline diff) | ✅ |
| `uRestoration` bus + DisposalRegistry | ✅ (pulled forward — both are architectural) |
| **Phase 1 · started** — content contract (zod), content lint, Codex shell + memories + projects routes | ✅ |
| **Phase 1** — save system (versioned, migrated, flushed on pagehide) | ✅ |
| **Phase 1** — the Reveal Contract, end to end and covered by a test | ✅ |
| **Phase 1** — memory motes, one InstancedMesh, restoration driven by progress | ✅ |
| **Phase 1** — the Impatience Detector and the skip path | ✅ |
| **Phase 1** — all 19 areas as walkable blockouts, generated from the atlas | ✅ |
| **Phase 1** — the Director: residency, gating, routing — pure and tested | ✅ |
| **Phase 1** — puzzle framework + Cursor Ritual, Light Echo, The Fountain | ✅ proved solvable across 100 seeds each |
| **Phase 1** — LUMA's scripted tree, with the golden-question eval as a unit test | ✅ |
| **Phase 1** — Codex sections: memories, projects, skills, experience, contact | ✅ |
| **Phase 1** — RUM (`web-vitals` → `/api/telemetry`), anonymous, DNT-respecting | ✅ |
| **Phase 1** — one interaction system: `[`/`]` cycling, live-region prompt, keyboard-completable | ✅ |
| **Phase 1** — pause menu: fast travel, settings, save code in and out, begin again | ✅ |
| **Phase 1** — `/accessibility`, stating per surface what is met and what is not | ✅ |
| **Phase 1** — the Fountain, playable, and the cat | ✅ |
| **Phase 1** — the Overture (screen 00): heals as you scroll, doors pinned throughout | ✅ |
| **Phase 1** — the Memory Forest: LUMA arrives and speaks, Light Echo in its scene, the cat | ✅ |
| Phase 1 · art pass — the Forest and the Village as places, not blockouts | ⬜ |
| Phase 1 · the cat, the Overture, LUMA's arrival, the other 13 puzzles | ⬜ |

## Getting started

```bash
npm install
npm run dev          # tokens are rebuilt first, automatically
```

- `/` — the Overture: what this is, who made it, and three doors that are never more than a click away
- `/enter` — the plain gate (screen 01) for a returning visitor
- `/world` — the grey-box. `WASD` move · `Shift` run · `Q`/`E` or right-drag turn · `H` perf HUD
- `/debug` — quality tiers, switches, and the live palette
- `/world?debug=1` — the in-world inspector: restoration scrub, tier switch, disposal readout (` ` ` to hide)
- `/world?perf=90` — the automated flythrough the perf gate drives
- `/codex` — the memory grid, projects, skills, experience, contact
- In the world: `E` interact · `L` LUMA · `H` perf HUD · backtick opens the inspector with `?debug=1`

## The token pipeline

`tokens/tokens.json` is the only place a colour, a space, a radius or an easing is
written down. `npm run tokens` compiles it into four outputs in `src/generated/`:

| Output | Consumed by |
|---|---|
| `tokens.css` | every stylesheet in the Codex |
| `tokens.ts` | React components, and the world's materials |
| `tokens.glsl` | shaders — **this is the point**: the world and the Codex read one palette, so the two layers cannot drift apart |
| `tokens.tailwind.css` | the Tailwind v4 `@theme` block |

Colours are authored in **OKLCH**, so the restoration cross-fade interpolates
perceptually instead of dragging a warm gold through desaturated mud on its way
to a cool grey. Tokens have three tiers, and the rule that makes them worth
having is enforced by CI: **components consume the semantic tier only.**

Two deliberate deviations from STANDARDS 7.8 / 9.3, both narrow:

1. **Style Dictionary is replaced by `scripts/build-tokens.mjs`** (~150 lines, zero
   dependencies). It emits the same four targets, and it can enforce project
   rules Style Dictionary has no opinion about — a CSS-name collision between two
   tiers is a build error here, and translucent tokens emit `color-mix()` against
   a live `var()` so a themed override still flows through them.
2. **The Figma variables target is not generated yet.** It is a publish step with
   no consumer until there is a Figma file to publish into.

## The four CI gates

They are built before there is code to regress, which is the only point at which
they are cheap.

| Gate | Command | What it prevents |
|---|---|---|
| Token lint | `npm run gate:tokens` | a component reaching past the semantic tier; arbitrary pixel values |
| Offset-pagination ban | `npm run gate:pagination` | a paginated list that duplicates and skips rows as it grows |
| React-commit-count | `npx playwright test e2e/react-commits.spec.ts` | a re-render during gameplay — the classic R3F performance collapse |
| Memory-leak | `npx playwright test e2e/memory-leak.spec.ts` | undisposed GPU resources across world mounts |
| Bundle budgets | `npx size-limit` | the Codex creeping past its 20 KB of JavaScript |
| Content lint | `npm run content` | a project without a stated failure; placeholder text in a published entry |

```bash
npm run verify     # lint, types, unit tests, and both static gates
npm run e2e        # the runtime gates, against a production build
npm run perf       # the 90-second flythrough, diffed against the baseline
npm run assets     # compress every model in assets/source and report its budget
npm run storybook  # the component state matrix, with the a11y panel
```

## The asset pipeline

`assets/source/*.glb` → `public/models/*.{lod0,lod1,lod2}.glb`, via dedup → prune →
instance → weld → simplify → Draco, with the report diffed against the previous
run in `assets/manifest.json`. LODs are cut to 100 / 45 / 18 % triangles.

On the test model: **428 KB → 25 KB** at LOD0, and the duplicate material and
unused node are gone. KTX2 needs the `toktx` binary from KTX-Software on PATH;
without it the pipeline compresses textures to WebP and says so in the report
rather than failing.

## The perf gate

`npm run perf` drives a fixed 90-second camera spline and records p50/p95/p99 frame
time and peak draw calls. Two separate questions, deliberately not conflated:

- **Does the world meet its budget?** Only answerable on the machine the budget was
  written for. Enforced with `--strict` (or `PERF_MACHINE=ci`).
- **Did this commit make it slower?** Answerable anywhere, by diffing against
  `perf-baseline.json` recorded on the same machine. This is the default check.

It compares **p50**, not p95: two runs of identical code move p95 by tens of
percent, and a gate that goes red on a rerun is a gate that gets switched off.
Vsync is disabled during measurement — with it on, p50 pins to the refresh
interval and the number describes the compositor rather than the world.

## Architecture rules

Three rules separate a project that ships at 60 fps from one that does not. They
are not style preferences and CI enforces the first one.

1. **React never renders per frame.** Per-frame mutation happens on refs inside
   `useFrame`. Zustand is read transiently. A commit during gameplay is a bug.
2. **One uniform drives the world.** `uRestoration` is a single shared uniform
   injected into every material via `onBeforeCompile` — changing restoration costs
   one float write, not a scene traversal. Scrub it live at `/world?debug=1`.
3. **Everything is instanced or batched.** Target: under 180 draw calls in the
   heaviest area. The perf HUD colours that number red at 180 so the budget is
   visible while building, not at the end.

## The content layer

`content/schema.ts` is the contract. The loader, the Codex and `npm run content`
all import it, so what is authored and what is rendered cannot drift.

Two rules in it are editorial, and they are why it is worth having:

- **`whatBroke` is required on every project.** A portfolio in which nothing ever
  went wrong is not credible. The build fails without it.
- **Everything is written twice.** `narratorLine` (≤25 words, voiced in the world)
  and the MDX body (100–300 words, factual, recruiter-readable) describe the same
  work. That is the two-layer architecture at the content level.

Every entry in `content/` today is `draft: true` — a template with the real
fields and `REPLACE` where the career goes. Drafts never reach a visitor, and the
lint fails any *published* entry that still contains placeholder text. **Filling
these in is the one task that cannot be done from the repository.**

## Layout

```
app/            routes — title screen, /world shell, /codex, /debug
src/world/      engine, quality tiers, entities, grey-box
src/state/      Zustand stores, outside React's render cycle
src/generated/  token outputs — generated, committed, checked by CI
tokens/         tokens.json, the single source of truth
scripts/        the token pipeline and the static gates
tests/          vitest — pure logic, no browser
content/        MDX + the zod contract — the single source both layers read
e2e/            playwright — the runtime gates
```
