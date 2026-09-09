# The Forgotten Mind

A portfolio built as two co-existing layers over one source of truth: **the world**
(WebGL, explorable) and **the Codex** (server-rendered, readable, crawlable). The
design is [GDD.md](../GDD.md); the engineering charter is [STANDARDS.md](../STANDARDS.md);
the visual language is design 06, *The Assembly*.

**This repository is Phase 0 — the foundation.** What is here is the architecture
everything else is built on, and nothing more. Phase 0 exists precisely because
each of these decisions becomes a rewrite if it is deferred.

## What works today

| Deliverable | State |
|---|---|
| Next.js 15 · React 19 · TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) | ✅ |
| The token pipeline — `tokens.json` → CSS custom properties · TypeScript · **GLSL** · Tailwind theme | ✅ |
| The quality-tier system and its live adapter, unit-tested without a GPU | ✅ |
| Grey-box world: Rapier kinematic capsule, third-person spring camera, blockout geometry | ✅ |
| Perf HUD (`H`) — fps, frame time, draw calls, triangles, geo/tex, heap | ✅ |
| `/debug` world inspector | ✅ shell + the controls that have something to control |
| CI gate · token lint | ✅ |
| CI gate · offset-pagination ban | ✅ |
| CI gate · React-commit-count | ✅ |
| CI gate · memory-leak | ✅ baseline |
| `webglcontextlost` handling | ✅ guard in place (in-fiction copy lands with LUMA) |
| Storybook + the component state matrix | ⬜ next |
| Asset pipeline (`gltf-transform`, Draco + KTX2) | ⬜ next |
| The Codex, the memory system, LUMA, the 19 areas | ⬜ Phase 1+ |

## Getting started

```bash
npm install
npm run dev          # tokens are rebuilt first, automatically
```

- `/` — the title screen, two doors, zero client JavaScript
- `/world` — the grey-box. `WASD` move · `Shift` run · `Q`/`E` or right-drag turn · `H` perf HUD
- `/debug` — quality tiers, switches, and the live palette
- `/codex` — Layer 2, written in Phase 1

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

```bash
npm run verify     # types, unit tests, and both static gates
npm run e2e        # the runtime gates, against a production build
```

## Architecture rules

Three rules separate a project that ships at 60 fps from one that does not. They
are not style preferences and CI enforces the first one.

1. **React never renders per frame.** Per-frame mutation happens on refs inside
   `useFrame`. Zustand is read transiently. A commit during gameplay is a bug.
2. **One uniform drives the world.** `uRestoration` is a single shared uniform
   injected into every material — changing restoration costs one float write, not
   a scene traversal. (Lands in Phase 1.)
3. **Everything is instanced or batched.** Target: under 180 draw calls in the
   heaviest area. The perf HUD colours that number red at 180 so the budget is
   visible while building, not at the end.

## Layout

```
app/            routes — title screen, /world shell, /codex, /debug
src/world/      engine, quality tiers, entities, grey-box
src/state/      Zustand stores, outside React's render cycle
src/generated/  token outputs — generated, committed, checked by CI
tokens/         tokens.json, the single source of truth
scripts/        the token pipeline and the static gates
tests/          vitest — pure logic, no browser
e2e/            playwright — the runtime gates
```
