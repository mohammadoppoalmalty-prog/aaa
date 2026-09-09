# THE FORGOTTEN MIND — Game Design & Technical Document

**Version:** 1.1 · **Status:** Design complete, pre-production
**Source concept:** [idea.md](idea.md) (preserved unchanged — this document is its buildable expansion)
**Companion:** [STANDARDS.md](STANDARDS.md) — the binding engineering & UX charter. Where this document says *what* is built, the charter says *to what standard*. Its Appendix C amends the roadmap and metrics below.

---

## HOW TO READ THIS DOCUMENT

Every section answers one question: **what will actually be built here?** Where the source concept listed a noun ("Rubber duck"), this document specifies the object, its location, its trigger, its payload, and its persistence. Nothing is left as a mood.

Three tags appear throughout:

| Tag | Meaning |
|---|---|
| **[MVP]** | Ships in the first public version. Non-negotiable. |
| **[V2]** | Ships in the second content wave. Designed now, built later. |
| **[STRETCH]** | Built only if MVP performance and schedule allow. Cut first. |

Anything untagged is **[MVP]**.

**Table of contents**

- [Part 0 — The One Structural Decision](#part-0--the-one-structural-decision)
- [Part 1 — Pillars, Goals, Constraints](#part-1--pillars-goals-constraints)
- [Part 2 — The Four Visitors](#part-2--the-four-visitors)
- [Part 3 — Narrative Bible](#part-3--narrative-bible)
- [Part 4 — World Atlas: 18 Areas](#part-4--world-atlas-18-areas)
- [Part 5 — Core Systems](#part-5--core-systems)
- [Part 6 — Content Mapping: CV → World](#part-6--content-mapping-cv--world)
- [Part 7 — Controls, Camera, Movement](#part-7--controls-camera-movement)
- [Part 8 — Interface & Diegetic UI](#part-8--interface--diegetic-ui)
- [Part 9 — Art Direction](#part-9--art-direction)
- [Part 10 — Audio Direction](#part-10--audio-direction)
- [Part 11 — Technical Architecture](#part-11--technical-architecture)
- [Part 12 — Performance Budgets](#part-12--performance-budgets)
- [Part 13 — Backend, Data & Moderation](#part-13--backend-data--moderation)
- [Part 14 — SEO, Sharing, Analytics](#part-14--seo-sharing-analytics)
- [Part 15 — Security & Abuse](#part-15--security--abuse)
- [Part 16 — Content Pipeline](#part-16--content-pipeline)
- [Part 17 — Production Roadmap](#part-17--production-roadmap)
- [Part 18 — Risk Register](#part-18--risk-register)
- [Part 19 — Success Metrics](#part-19--success-metrics)
- [Appendices](#appendix-a--full-narrator-script)

---

## PART 0 — THE ONE STRUCTURAL DECISION

### The problem the source concept does not solve

The concept requires the visitor to complete escape-room puzzles to learn who the developer is. That is a magnificent experience and a catastrophic portfolio. Consider the actual audience:

| Visitor | Time budget | Will they solve a light-reflection puzzle to find your tech stack? |
|---|---|---|
| Recruiter / HR screener | 40–90 seconds | No. They close the tab. |
| Hiring engineer | 3–8 minutes | Maybe two puzzles, then they want the code. |
| Client / founder | 2–5 minutes | No. They want to know if you can ship. |
| Designer / peer / Awwwards juror | 10–45 minutes | Yes. Enthusiastically. |
| Search-engine crawler | 0 seconds | Cannot. Sees an empty canvas. |

A portfolio that only serves the fourth row wins awards and loses jobs. A portfolio that only serves the first row is every other portfolio.

### The decision: two layers, one world

The site is built as **two co-existing layers that share one data source.**

```
                    ┌──────────────────────────────────┐
                    │      content/  (MDX + JSON)      │
                    │  the single source of truth for  │
                    │  bio, skills, projects, jobs,    │
                    │  education, certs, philosophy    │
                    └───────────────┬──────────────────┘
                        ┌───────────┴───────────┐
                        ▼                       ▼
       ╔════════════════════════════╗  ╔════════════════════════════╗
       ║  LAYER 1 — THE WORLD       ║  ║  LAYER 2 — THE CODEX       ║
       ║  3D, WebGL, exploration,   ║  ║  Server-rendered HTML,     ║
       ║  puzzles, Guardian, lore   ║  ║  accessible, crawlable,    ║
       ║  = the experience          ║  ║  printable, instant        ║
       ║                            ║  ║  = the portfolio           ║
       ╚════════════════════════════╝  ╚════════════════════════════╝
                    │                              ▲
                    └──── every recovered ─────────┘
                          memory unlocks a
                          Codex entry
```

**Layer 1 — The World.** Everything in the source concept. The gate, the eighteen areas, the puzzles, the Guardian, the endings, the Tree.

**Layer 2 — The Codex.** A real, static, server-rendered site at `/codex` and its sub-routes. Clean typography. No 3D. Loads in under one second on 3G. Contains the complete portfolio. It is **not** a fallback or a shame-page — it is presented in-fiction as *the Guardian's Codex*, the archive of everything recovered, and it is styled to belong to the same world (same palette, same type, parchment ground, glowing sigils).

**The bridge between them is the Reveal Contract:**

1. Recovering a memory in Layer 1 permanently unlocks its Codex entry in Layer 2.
2. Layer 2 is reachable at any moment from Layer 1 by pressing `TAB` — the Guardian opens the Codex in place, no loading screen, no leaving the world.
3. **The Impatience Detector.** If the player has been in-world for 75 seconds and recovered zero memories, or moves the pointer toward the browser's close/back control, the Guardian speaks once:

   > *"You are in a hurry. I understand — you did not come here for riddles. Ask me to open the Codex and I will show you everything at once. The world will still be here."*

   A single unobtrusive prompt appears: **Skip the journey — open the Codex.** One click reveals **all 100 memories** and drops the player at `/codex`. No penalty, no guilt-trip copy, no "are you sure?" modal. This is the single most important interaction in the project.
4. The title screen offers the same choice up front, honestly labelled:

   ```
        ▸  ENTER THE WORLD          (20–60 minutes · headphones recommended)
        ▸  I HAVE FIVE MINUTES      (opens the Codex · full portfolio, no puzzles)
        ▸  CONTINUE                 (shown only when a save exists)
   ```

**Why this makes the project stronger, not weaker.** The concept's stated goal is that the visitor closes the browser saying *"I finished an unforgettable adventure."* Nobody says that about an experience that trapped them. Giving the visitor a visible, dignified exit is what makes the choice to stay meaningful — and the players who choose to stay are exactly the players who will finish. Award juries also read the skip screen as confidence, not compromise.

Every remaining section of this document assumes the two-layer architecture.

---

## PART 1 — PILLARS, GOALS, CONSTRAINTS

### Design pillars

Four pillars. Every feature must serve at least one, and no feature may violate any.

1. **The world remembers you.** Progress, weather, the Guardian's tone, the Tree's leaves — all persist and all visibly change. Nothing resets.
2. **Every mechanic is a biography.** A puzzle is never decorative. The gear puzzle in the Workshop *is* the story of learning to debug. Solving it teaches something true about the developer.
3. **Curiosity is always rewarded, and never required.** Every optional path pays out. No optional path gates required content.
4. **The exit is always visible.** The player can reach the portfolio, the contact form, or the Codex from anywhere in one input. Immersion is offered, never enforced.

### Hard constraints

| Constraint | Value | Enforcement |
|---|---|---|
| Time to first interaction | ≤ 2.5 s on mid-tier laptop, ≤ 4 s on mid-tier phone | Lighthouse CI gate in the build pipeline; build fails above threshold |
| Time to portfolio content | ≤ 1 input from anywhere | Design review checklist |
| Frame rate | 60 fps desktop / 30 fps mobile at the chosen quality tier | In-engine perf HUD; automated 90-second flythrough regression test |
| Initial JS payload | ≤ 400 KB gzipped (excl. 3D assets) | `size-limit` in CI |
| Total first-scene assets | ≤ 6 MB | Asset manifest budget check |
| Keyboard-only completability | 100% of required content | Manual audit per milestone |
| Screen-reader completability | 100% of required content via Codex | axe-core CI + manual NVDA/VoiceOver pass |
| Works with WebGL disabled | Codex fully functional | Playwright test with WebGL blocked |
| Cost ceiling (AI + hosting) | ≤ $40 / month at 5,000 monthly visitors | Budget alarm on the API key + rate limits |

### Explicit non-goals

Writing these down prevents scope creep later.

- **Not** a multiplayer game. Visitors never see each other in real time. The Tree of Visitors is asynchronous.
- **Not** an account system. No sign-up, no login, no email capture as a gate. Ever.
- **Not** a mobile-first 3D experience. Mobile gets a genuine but reduced world (see [Part 12](#part-12--performance-budgets)).
- **Not** a physics sandbox. Rapier is used for three specific puzzles, not for general-purpose object throwing.
- **Not** procedurally generated. The world is hand-authored; only events, weather, and small details vary.
- **Not** an open-ended AI chatbot. The Guardian is scoped, spoiler-aware, rate-limited, and has a scripted fallback.

---

## PART 2 — THE FOUR VISITORS

Each visitor archetype gets a designed path. This is a design requirement, not a persona exercise — every row below maps to a concrete feature.

### Visitor A — "The Ninety Seconds" (recruiter)

**Path:** Title screen → *I have five minutes* → `/codex` → Projects tab → Resume PDF → close.
**Features that serve them:** Title-screen skip option, Impatience Detector, one-click PDF resume, `/codex` server-rendered so it appears instantly, contact links present in Codex without completing the game.
**Success:** They found the stack, two projects, and the email in under 90 seconds and never felt blocked.

### Visitor B — "The Curious Engineer"

**Path:** Enters the world → plays 5–10 minutes → gets stuck or curious about a specific project → asks the Guardian *"show me the backend projects"* → Guardian opens the relevant Codex entries → reads architecture → clicks through to GitHub.
**Features that serve them:** Guardian natural-language navigation, live interactive project demos inside the Developer Studio, real source-code panels with syntax highlighting, architecture diagrams, the Interactive Terminal easter egg.
**Success:** They saw working code, understood a technical decision, and formed an opinion about competence.

### Visitor C — "The Explorer" (designer, peer, awards juror)

**Path:** Full playthrough, 35–70 minutes. Hunts secrets. Replays for a different ending. Shares a link.
**Features that serve them:** All 18 areas, all puzzles, achievements, the five endings, hidden content, the Tree of Visitors, the shareable memory card.
**Success:** They complete an ending, leave a leaf, and post the link.

### Visitor D — "The Returner"

**Path:** Comes back days or weeks later. Save is intact. Weather differs. A seasonal decoration is up. New leaves grew on the Tree. A daily event is live.
**Features that serve them:** Save persistence, the Living World calendar, the daily seed, the weekly challenge, the dev-diary feed inside the Hidden Basement.
**Success:** They found something that was not there last time.

---

## PART 3 — NARRATIVE BIBLE

### Logline

A traveller enters a dying world built from one developer's mind and must restore it by recovering the memories that made it — discovering, in the process, that the world was left behind deliberately, as a message.

### The three-act structure

The source concept has one arc: *arrive, restore, leave*. That is a beginning and an end without a middle. Here is the middle.

**Act I — Arrival (0–20% restoration).** The world is silent, grey, broken. The Guardian is a flickering shard that speaks in fragments. The player learns to move, to look, to interact. They recover the first memories: childhood, first computer, first line of code. The tone is melancholy and gentle. *Question posed: who made this?*

**Act II — Excavation (20–70% restoration).** The world begins to breathe. Colour returns in patches. The Guardian gains a voice and personality. Puzzles get real. The player recovers skills, projects, jobs, failures. Around 45%, the tone shifts: the player finds **the Fracture Records** — three memories the developer tried to delete. A failed startup. A project abandoned after two years. A job that ended badly. The Guardian resists opening them:

> *"That one is sealed. I sealed it. …You are going to open it anyway, aren't you."*

*Question posed: why did this world break?*

**Act III — Restoration (70–100%).** The Sky Bridge assembles. The Observatory opens. The player learns the Core Memory did not shatter by accident — the developer shattered it themselves, scattering the pieces deliberately so that whoever found this place would have to *earn* the picture rather than be handed a résumé. The Guardian is revealed as the developer's own doubt, given a body and left behind as a companion so the next traveller would not walk it alone. The Contact Tower activates. The player writes back. *Question answered.*

### The Guardian — LUMA

**Name:** LUMA. In-world it is what the developer called the first debug logger they ever wrote — `luma.log()` — and the name stuck. Out-of-world it means *light*. The joke and the poetry both land.

**Species:** A hovering shard of the Core Memory, roughly the size of a lantern, wrapped in slowly-orbiting glyph fragments. No face. Expresses everything through light intensity, orbital speed, colour temperature, and tilt.

**Voice:** Dry, warm, self-deprecating. Never sycophantic. Never says "Great question!" It gets funnier as the world heals — in Act I it can barely form sentences; by Act III it is teasing the player.

**Arc in five stages:**

| Stage | Restoration | Form | Light | Voice |
|---|---|---|---|---|
| 1 · Ember | 0–19% | Single cracked shard, 3 orbiting fragments | Dim, cold blue, flickering, 40% opacity | Fragmentary. Drops words. `"…found. You… found it."` |
| 2 · Spark | 20–39% | Shard mended once, 6 fragments | Steady pale cyan, 65% opacity | Short complete sentences. Formal, cautious. |
| 3 · Flame | 40–64% | Two shards orbiting each other, 12 fragments | Warm gold-white, 85% opacity | Full personality. Dry humour appears. Offers opinions. |
| 4 · Beacon | 65–89% | Small constellation, 20 fragments, faint trail | Bright warm gold, soft bloom, 100% | Affectionate, teasing. Remembers earlier conversations. |
| 5 · Star | 90–100% | Radiant, halo, particle wake | White-gold, casts real light on the world | Openly emotional. Drops the mask entirely. |

Each stage transition is a 6-second cinematic moment: time slows, LUMA's fragments spiral inward and burst, and it says one line acknowledging what changed.

### Voice & tone rules (for all written content)

Written into the CMS as a lint rule and a review checklist.

| Speaker | Rules |
|---|---|
| **Narrator** (the developer's recorded voice) | Second person. Present tense. Short lines. Never explains a mechanic. Never uses the word "you should". Fades mid-sentence when a memory is incomplete. |
| **LUMA** | First person. Never more than 3 sentences unprompted. Never repeats a hint verbatim. Never reveals unrecovered content. Never breaks the fiction — if asked "are you an AI?" it answers in-world: *"I am what is left of a mind that wrote too many log statements."* |
| **Memory text** (the actual CV content) | First person past tense for stories; plain and factual for skills and dates. This is the layer where honesty matters more than atmosphere — a recruiter reads this. No poetry in a job description. |
| **UI / system text** | Diegetic where possible ("The Codex remembers 42 of 100"), plain where clarity wins ("Sound: On"). Accessibility labels are always plain. |

### Language & localisation

- **[MVP]** English and Arabic, both fully authored (not machine translated). RTL layout support in the Codex, and RTL-aware text rendering for narrator lines and LUMA dialogue.
- Language selector on the title screen and in the pause menu. Persisted in the save.
- All content files are keyed: `content/en/*.mdx` and `content/ar/*.mdx`, identical front-matter schemas.
- The Guardian's system prompt is language-tagged; it replies in the player's selected language.
- **[V2]** Additional locales added by dropping a directory; no code changes required.

---

## PART 4 — WORLD ATLAS: 18 AREAS

### The world graph

One continuous world. No page loads. Areas are streamed chunks connected by physical paths, and the transition between them is a walk, not a fade.

```
                            ┌──────────────┐
                            │  THE GATE    │  intro · tutorial
                            └──────┬───────┘
                                   │
                          ┌────────▼─────────┐
                          │  MEMORY FOREST   │  tutorial · first memory
                          └────────┬─────────┘
                                   │
    ┌────────────┬─────────────────▼──────────────┬──────────────┐
    │            │      FORGOTTEN VILLAGE         │              │
    │            │      ── H U B ──               │              │
    │            └──┬───────┬────────┬────────┬───┘              │
    │               │       │        │        │                  │
┌───▼────┐   ┌──────▼──┐ ┌──▼─────┐ ┌▼──────┐ ┌▼─────────┐  ┌────▼─────┐
│CHILDH. │   │LEARNING │ │KNOWL.  │ │EXPER. │ │ CRYSTAL  │  │ACHIEVE.  │
│ HOME   │   │WORKSHOP │ │LIBRARY │ │ARCHIVE│ │  LAKE    │  │  HALL    │
└───┬────┘   └──────┬──┘ └──┬─────┘ └───────┘ └────┬─────┘  └──────────┘
    │               │       │                       │         (opens 40%)
┌───▼────────┐  ┌───▼──────────┐  │           ┌────▼──────────┐
│  HIDDEN    │  │ INNOVATION   │  │           │ UNDERGROUND   │
│  BASEMENT  │  │ LABORATORY   │  │           │    CAVE       │
│ (secret)   │  └───┬──────────┘  │           └────┬──────────┘
└────────────┘      │             │                │
                ┌───▼──────────┐  └────────┬───────┘
                │  DEVELOPER   │           │
                │   STUDIO     │      ┌────▼──────────┐
                └───┬──────────┘      │ ANCIENT TEMPLE│
                    │                 └────┬──────────┘
                    │                      │
                    │                 ┌────▼───────────┐
                    │                 │ FLOATING ISLES │
                    │                 └────┬───────────┘
                    │                      │
                    │                 ┌────▼───────────┐
                    │                 │ DREAM OBSERV.  │
                    │                 └────┬───────────┘
                    │                      │
                    └──────────┬───────────┘
                               │
                        ┌──────▼───────┐
                        │  SKY BRIDGE  │  requires 60% + 6 Fragments
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │CONTACT TOWER │  requires 8 Core Fragments
                        └──────┬───────┘
                               │
                        ┌──────▼───────────┐
                        │ SECRET SANCTUARY │  post-finale · Tree of Visitors
                        └──────────────────┘
```

### Gating philosophy

Progress is gated by **two currencies, never by a fetch-quest key**:

- **Restoration %** — the aggregate of recovered memories. Gates the late-game areas so the world visibly heals before it opens.
- **Core Fragments** — 8 unique artifacts, one per major building. Gates the finale.

A locked area is never a blank wall. It is always *visibly* locked with a visible reason: the Sky Bridge's pieces float unassembled in the air and you can count them; the Achievement Hall's door has 40 unlit sconces and you can see how many are lit.

### Area specifications

Each area below specifies: **purpose · content it holds · signature puzzle · visual state change · exits · secret.**

---

#### 1 · THE GATE — *Prologue*

| Field | Specification |
|---|---|
| **Purpose** | Intro cinematic, control tutorial, emotional contract |
| **Size** | Single 40×40m plaza before a 30m-tall ruined gate |
| **Memories held** | 1 (`bio-01` — "Before any of this, there was a boy and a broken calculator") |
| **Core Fragment** | None |
| **Signature interaction** | **The Cursor Ritual.** The screen is black. The cursor emits a 2m radius of soft light. Nothing else is visible. The player must *move* to discover this — the only instruction is the light itself. When they sweep the cursor across the gate's surface, glyphs ignite where the light touches. Lighting all 7 glyphs opens the gate. This teaches: your attention is the mechanic. |
| **Restoration visuals** | N/A (visited once) |
| **Exits** | Forest (forward, one-way) |
| **Secret** | Holding still for 30 seconds without moving triggers a hidden narrator line: *"You're patient. That's rarer than you think."* → unlocks achievement `patience` |

---

#### 2 · MEMORY FOREST — *Tutorial*

| Field | Specification |
|---|---|
| **Purpose** | Teach movement, interaction, LUMA, the memory system |
| **Size** | ~120×120m, dense vertical trees, three winding paths converging |
| **Memories held** | 5 (`bio-02`, `bio-03`, `story-01`, `lesson-01`, `lesson-02`) |
| **Core Fragment** | **Fragment I — The Seed** (awarded on puzzle completion) |
| **Signature puzzle** | **Light Echo.** Three stone lanterns stand unlit. Drifting motes of light flow through the forest, carried by wind. The player must observe the *wind direction* (shown by falling leaves and a wind-sock ribbon), then rotate each lantern's reflector to face upwind so it catches a mote. Difficulty: trivial. Purpose: teaches observe → deduce → act, and that the world's ambient details carry information. Solve time target: 60–90 s. |
| **Restoration visuals** | 0%: bare black trees, grey fog, no sound but wind. 50%: leaf buds, birdsong layer in, fog lifts to 40m. 100%: full canopy, dappled god-rays, fireflies, four-part birdsong, the paths bloom with wildflowers. |
| **LUMA's arrival** | At the first fork, LUMA emerges from a cracked stone and speaks its first complete sentence. This is the first save-point. |
| **Exits** | Gate (back, blocked after first traversal — the gate seals), Village (forward) |
| **Secret** | **The Cat.** A grey cat sits on a branch off the main path. It is only visible if the player leaves the path. Interacting: it hops down, follows the player for the rest of the session, sits when they stand still, and purrs near recovered memories. Purely decorative, zero gameplay function, and it will be the single most-mentioned thing in every share. Implementation: `CompanionCat` entity with 4-state FSM (idle / follow / sit / purr), path-follows the player with 3m lag using a spring, persists in save as `hasCat: true`. |

---

#### 3 · FORGOTTEN VILLAGE — *Hub*

| Field | Specification |
|---|---|
| **Purpose** | Central hub, progress visualisation, navigation |
| **Size** | ~200×200m. Circular plaza, dead fountain at centre, 6 buildings around the rim, cobbled radial streets |
| **Memories held** | 6 (`bio-04`, `bio-05`, `story-02`, `story-03`, `lesson-03`, `lesson-04`) |
| **Core Fragment** | **Fragment II — The Wellspring** |
| **Signature puzzle** | **The Fountain.** The central fountain is dry. Beneath a grate in the plaza is a 5×5 grid of rotatable pipe segments. The player rotates pipes to route water from the aqueduct inlet (NW) to the fountain outlet (SE). Two segments are broken and must be swapped with spares found in a nearby cart. Solve time target: 3–5 min. On solve: water erupts, the fountain becomes the **Restoration Meter** — its water level, glow, and the number of active jets scale directly with restoration % for the rest of the game. This is the diegetic progress bar. |
| **Restoration visuals** | Progressive per-building repair. Roofs re-tile, shutters straighten, lanterns light, market stalls unfold, laundry lines appear, NPC spirits fade in (see below). At 100%: a village festival state with music, banners, and 12 spirits going about invented daily business. |
| **NPC spirits** | 12 translucent figures, unlocked at 8% restoration each. Each is a fragment of a person from the developer's real life, unnamed and non-specific (a teacher, a first manager, a friend who taught them git). They do not speak. They wave. Standing near one plays a 4-second narrator memory. Implementation: instanced billboard-shader ghosts with 3 looped animations each; a single draw call for all 12. |
| **Exits** | Forest (back), Childhood Home, Learning Workshop, Knowledge Library, Experience Archive, Crystal Lake, Achievement Hall (locked until 40%) |
| **Secret** | **The Traveling Merchant.** Spawns in the plaza on a seeded schedule (see [Dynamic Events](#43--dynamic-world-events)) — roughly 1 visit in 4. Sells nothing. Trades: he asks for one recovered memory's *name*, and in exchange tells the player where the nearest undiscovered secret is, once. Implementation: dialogue tree, no economy, uses the hint system's proximity query. |

---

#### 4 · CHILDHOOD HOME — *Origin*

| Field | Specification |
|---|---|
| **Purpose** | Emotional foundation. Where the player starts caring. |
| **Size** | Interior, 3 rooms + attic, ~15×12m footprint |
| **Memories held** | 7 (`bio-06` … `bio-09`, `story-04`, `story-05`, `edu-01`) |
| **Core Fragment** | **Fragment III — The First Key** |
| **Signature puzzle** | **Toy Chronology.** Seven childhood objects sit scattered: a wooden train, a plastic dinosaur, a Game Boy, a Rubik's cube, a CRT television, a beige keyboard, a cracked phone. On the wall are seven faded photographs, each showing the child holding one object at a different age (readable by height against a doorframe growth-chart). The player must place each object on the shelf in chronological order. Wrong placements glow red. Correct order plays a narrator line per object. Solve time target: 4–6 min. **This puzzle *is* the biography** — solving it is literally reconstructing the developer's timeline. |
| **Restoration visuals** | 0%: dust sheets, cobwebs, no light, colours desaturated 90%. 50%: sheets removed, warm lamp light, colour returns. 100%: dust motes in afternoon sun, a radio playing, the smell of the place implied by warm colour grading and a kettle sound. |
| **Exits** | Village (back), Hidden Basement (secret — see below) |
| **Secret** | **The Basement Door.** Behind the water heater in the kitchen. Only visible if the player crouches (`C`). Locked with a 4-digit combination. The code is the year the developer wrote their first program — discoverable only by having read three specific memories (`bio-10`, `edu-01`, `story-05`). Leads to the Hidden Basement (area 18). |
| **Small details, specified** | **The Coffee Mug** — on the desk, chipped, reads `// TODO: sleep`. Interacting: LUMA says *"That mug outlived three laptops."* Sets flag `foundMug`. **The Rubber Duck** — on the windowsill. Interacting starts the Duck Debug minigame (see [Hidden Content](#410--hidden-content-register)). |

---

#### 5 · LEARNING WORKSHOP — *Skills, part 1*

| Field | Specification |
|---|---|
| **Purpose** | The "how I learned" chapter. First real puzzle. |
| **Size** | Interior workshop, 20×14m, two floors, mezzanine |
| **Memories held** | 8 (`skill-01` … `skill-08`) |
| **Core Fragment** | **Fragment IV — The Gear** |
| **Signature puzzle** | **The Loom Engine.** A large dead machine dominates the room. Its gear train is missing four gears; nine gears of differing tooth-counts lie on benches. The player must build a train that turns the output shaft at exactly the speed marked on a brass dial (a ratio problem: `12→36→18→54` etc.). Gears snap to mounts; the train animates live so the player can see it turning too fast or too slow, and a tachometer needle shows the error. Rapier physics is *not* used — this is a deterministic ratio solver with animated feedback. Solve time target: 5–8 min. Three difficulty rungs are pre-authored and one is chosen by the daily seed, so a returning player gets a different ratio. |
| **Restoration visuals** | Tools rust → gleam. Sawdust appears. Blueprints on the walls un-crumple and become readable (each is a real diagram of something the developer built). Workbench lamp warms from 4000K to 2700K. |
| **Exits** | Village (back), Innovation Laboratory (unlocked on puzzle solve) |
| **Secret** | **Old Prototypes shelf** — five unfinished projects in bottles, each with a one-paragraph honest post-mortem. Reading all five unlocks achievement `honest`. |

---

#### 6 · INNOVATION LABORATORY — *Skills, part 2*

| Field | Specification |
|---|---|
| **Purpose** | The "how I think" chapter. Logic and systems. |
| **Size** | Interior lab, 24×18m, glass tanks, a central circuit table |
| **Memories held** | 8 (`skill-09` … `skill-16`) |
| **Core Fragment** | **Fragment V — The Circuit** |
| **Signature puzzle** | **The Board.** A 9×9 grid table. Six power nodes on the edges must be connected to six matching sockets, by dragging traces across the grid. **Traces may not cross.** This is a planarity puzzle (Numberlink-style) with a hand-authored solvable layout. Three layouts exist; the daily seed picks one. On solve, the lab powers up and its glass tanks light one by one, each containing a skill crystal. Solve time target: 6–10 min. |
| **Restoration visuals** | Cracked glass mends. Liquid in tanks goes from stagnant brown to luminous. Holographic projections above each bench boot up and begin rendering the projects they belong to. |
| **Exits** | Workshop (back), Developer Studio (unlocked on puzzle solve) |
| **Secret** | **Glitch Anomaly spawn point.** 1-in-6 chance per visit; a small area of the lab renders as deliberate corruption (UV-scrambled shader, datamoshed geometry). Touching it teleports the player to a 20×20m white void room containing a single readable note: the developer's most embarrassing production bug, told in full. Unlocks achievement `bugHunter`. |

---

#### 7 · DEVELOPER STUDIO — *Projects*

| Field | Specification |
|---|---|
| **Purpose** | **The most important area for hiring outcomes.** Where projects actually run. |
| **Size** | Interior, 30×20m, a large open studio with 8 workstations arranged in a ring |
| **Memories held** | 20 (`project-01a/b` … `project-10a/b` — two per project: *what it is*, and *what it cost*) |
| **Core Fragment** | **Fragment VI — The Compiler** |
| **Signature puzzle** | **The Terminal.** A working in-world terminal on the central desk. It accepts real commands from a fixed set of 14 (`ls`, `cd`, `cat`, `run`, `git log`, `whoami`, `help`, `fix`, `test`, `deploy`, `clear`, `sudo`, `exit`, `luma`). A displayed source file has a genuine, findable bug (an off-by-one in a loop). The player must find it with `cat`, correct it with `fix <line> <text>`, and pass `test`. Real terminal, real diff, real pass/fail. Solve time target: 5–12 min. Non-technical players get a LUMA hint ladder that eventually points at the exact line. `sudo` replies: *"Nice try."* |
| **The project machines** | Each of the 8 workstations is a **living machine** for one project. Interacting docks the camera to the workstation and opens a diegetic panel with five tabs: **Run** (a live `<iframe>` of the actual deployed demo, or an embedded interactive canvas for the two projects that support it), **Code** (real syntax-highlighted excerpts, 3 files max, loaded on demand), **Architecture** (an authored SVG diagram, pannable), **Story** (why it was built, what broke, what was learned — 250 words), **Links** (GitHub, live demo, case study). The panel is a real DOM overlay, keyboard-navigable, and its content is the same MDX that renders in the Codex. |
| **Restoration visuals** | Monitors: black → boot sequence → live. Cable management tidies itself (a joke that lands with engineers). Whiteboard fills with real diagrams. A plant on the corner desk grows. |
| **Exits** | Laboratory (back), Sky Bridge (locked: 60% + 6 Fragments) |
| **Secret** | **The Developer Playlist.** A dusty media player on a shelf. Interacting reveals a real 10-track playlist (embedded, or as a link) — the music the developer actually codes to. Toggling it replaces the ambient score with the playlist for the rest of the session. |

---

#### 8 · KNOWLEDGE LIBRARY — *Education*

| Field | Specification |
|---|---|
| **Purpose** | Education, certificates, the reading life |
| **Size** | Interior, 26×26m, 3 storeys of shelves around a central void, spiral stair |
| **Memories held** | 10 (`edu-02` … `edu-05`, `cert-01` … `cert-06`) |
| **Core Fragment** | **Fragment VII — The Index** |
| **Signature puzzle** | **The Spine Cipher.** One shelf holds 11 books whose spines each bear a single letter and a faded roman numeral. Ordering them by numeral spells a word. The word is spoken aloud (typed on a lectern) to open the sealed reading room. The numerals are partially illegible — two must be inferred from the books' subject matter, which requires having read two education memories. Solve time target: 4–7 min. |
| **Certificates** | Six **animated magical paintings** along the mezzanine. Each is a framed canvas; approaching it makes the painted scene animate (a 4-second loop illustrating the subject), and the frame's plaque shows issuer, date, and a verification link. Implementation: each is a plane with a 2-layer shader (still base + animated normal/flow map) — no video files. |
| **Restoration visuals** | Fallen books rise and reshelve themselves (a staggered, physics-free animation on a 12-second stagger). Torn pages mend. Reading lamps light. Motes of dust become motes of gold. |
| **Exits** | Village (back), Ancient Temple (secret passage behind the sealed reading room's fireplace) |
| **Secret** | **The Chess Puzzle.** A board mid-game on a reading table. It is a real mate-in-two. Solving it (click piece, click destination) unlocks achievement `strategist` and a narrator line about the developer's grandfather. |

---

#### 9 · EXPERIENCE ARCHIVE — *Work history*

| Field | Specification |
|---|---|
| **Purpose** | Employment history, told honestly |
| **Size** | Interior, 22×16m, a hall of hanging journals and filing towers |
| **Memories held** | 8 (`exp-01` … `exp-08`) |
| **Core Fragment** | None (this area's reward is content, not a fragment) |
| **Signature puzzle** | **The Timeline.** Eight journal fragments hang on chains at different heights, each describing a period of work but with its date torn off. A long empty rail runs the length of the hall, marked with years. The player drags each fragment to its correct position using internal evidence — a mentioned technology, a colleague's remark, a described product. Wrong placement: the chain rejects it with a low chime. On completion the rail ignites end-to-end and becomes a permanent, readable career timeline. Solve time target: 6–10 min. |
| **The Fracture Records** | Three of the eight journals are sealed with a dark wax that LUMA visibly dislikes. These are the Act II turn: a failed startup, an abandoned two-year project, a job that ended badly. They can be opened at any time; LUMA protests once, then relents. Their content is genuinely candid — this is the part of the portfolio that builds trust, and it is the part most portfolios lack. Opening all three unlocks achievement `unflinching` and is a requirement for Ending 5. |
| **Restoration visuals** | Journals go from waterlogged and closed to open and legible. Ink un-fades. A skylight opens. |
| **Exits** | Village (back) |
| **Secret** | **The Ghost NPC.** In the far corner stands a spirit that, unlike the village spirits, *does* speak — one line, once, per playthrough, drawn from a pool of 20 lines of hard-won professional advice. Then it vanishes for the rest of the session. |

---

#### 10 · CRYSTAL LAKE — *Skills, part 3*

| Field | Specification |
|---|---|
| **Purpose** | The skills showcase. The postcard shot of the whole project. |
| **Size** | Exterior, ~180×180m. A mirror-still lake with 24 crystals rising from it on stone plinths, connected by low stepping stones |
| **Memories held** | 8 (`skill-17` … `skill-24`) — the remaining skills |
| **Core Fragment** | None |
| **Signature puzzle** | **Resonance.** Eight of the 24 crystals are dark. A stone bell at the shore, when struck, emits a tone. Each dark crystal has a carved waveform. The player must tune the bell (three rotating collars, each changing pitch) to match a crystal's waveform, then strike — the matching crystal lights. Visual and audio feedback both present, so it is solvable by deaf players (waveform shapes align visually) and by blind players (via pitch alone, with the Codex path as the guaranteed alternative). Solve time target: 5–9 min. |
| **The 24 skill crystals** | This is the *Skills* section made physical. Each crystal, when touched: pulses, emits a particle burst in its category colour, plays a 3-second narrator line, and opens a small floating card showing the skill name, a proficiency ring (0–100, honest), years of use, and the projects it was used in (clickable → jumps to that project machine). Categories are colour-coded: frontend (cyan), backend (amber), data (violet), infra (green), design (rose), practice (white). |
| **Restoration visuals** | The lake's surface goes from black sludge → clear reflection → a mirror so clean it doubles the sky. Dead reeds → living. At 100%: bioluminescent fish visible under the surface, and the crystals' light reflects and refracts across the water. |
| **Exits** | Village (back), Underground Cave (a stone stair descending beneath the lake, revealed when the Resonance puzzle completes) |
| **Secret** | **Skipping stones.** Clicking a flat stone at the shore lets the player skip it. Purely toy. Five skips in one throw unlocks achievement `skipper`. |

---

#### 11 · UNDERGROUND CAVE — *The subconscious*

| Field | Specification |
|---|---|
| **Purpose** | Tonal contrast — the only genuinely eerie area. Philosophy content. |
| **Size** | Interior cave system, 3 chambers, ~90m total run |
| **Memories held** | 5 (`philosophy-01` … `philosophy-03`, `story-06`, `lesson-05`) |
| **Core Fragment** | None |
| **Signature puzzle** | **The Echo.** In the final chamber, six crystal formations each produce a note when struck. A pattern of notes echoes from deeper in the cave, repeating every 8 seconds, growing by one note each cycle (Simon-style, to 7 notes). The player must strike it back. Each note also flashes its crystal, so it is playable mute. Solve time target: 3–6 min. |
| **Restoration visuals** | Cave-in rubble clears itself. Water goes from stagnant to running. Glow-moss spreads across the walls. Stalactites drip light instead of water. |
| **Exits** | Crystal Lake (back), Ancient Temple (forward) |
| **Secret** | **The Sleeping Giant.** In the second chamber, what appears to be rock formation is, from one specific viewing angle, a colossal sleeping figure. Finding that angle (marked by nothing but a suspicious flat stone to stand on) triggers a 10-second reveal: the figure breathes once. Nothing else ever happens. Unlocks achievement `seer`. |

---

#### 12 · ANCIENT TEMPLE — *The turn*

| Field | Specification |
|---|---|
| **Purpose** | The Act II revelation. Where the player learns the Core Memory was shattered deliberately. |
| **Size** | Interior, 34×34m, a single vaulted chamber with a central altar, 4 mirror pedestals, 8 pillars |
| **Memories held** | 4 (`philosophy-04` … `philosophy-06`, `story-07`) |
| **Core Fragment** | **Fragment VIII — The Truth** |
| **Signature puzzle** | **Light Reflection.** A single beam enters through an aperture in the ceiling. Four mirrors on rotatable pedestals must redirect it through three coloured lenses (in the correct order — red, then gold, then white — deducible from a mural) and finally onto the altar. Real-time beam simulation (raycast chain, max 8 bounces). Solve time target: 8–14 min. This is the hardest required puzzle in the game, and it is placed at the narrative peak on purpose. |
| **The revelation** | On solve, the altar opens and Fragment VIII rises. Touching it plays the game's longest cinematic (75 s): the developer, in the past, deliberately striking the Core Memory. LUMA's stage-4 transition fires here regardless of restoration %. |
| **Restoration visuals** | Vines retract from the pillars. The mural repaints itself from the centre outward. Braziers light in sequence. The ceiling aperture widens to admit a shaft of real sun. |
| **Exits** | Library (back), Cave (back), Floating Islands (a stone stair that assembles itself upward when Fragment VIII is taken) |
| **Secret** | **The Hidden Programming Jokes.** Nine glyphs among the pillar carvings are, on close inspection, programming jokes rendered as ancient script (`while(true) { pray(); }`, a stack overflow depicted as a literal collapsing tower of plates, etc.). Finding all nine unlocks achievement `initiate`. |

---

#### 13 · FLOATING ISLANDS — *Ambition*

| Field | Specification |
|---|---|
| **Purpose** | Spectacle and traversal. The screenshot everyone shares. |
| **Size** | Exterior, 11 islands across ~400m of open sky, largest 60×60m |
| **Memories held** | 3 (`dream-01` … `dream-03`) |
| **Core Fragment** | None |
| **Signature puzzle** | **Gravity Bridge.** Between islands, platforms hang inert. Six anti-gravity pylons are scattered across the islands; activating a pylon lifts every platform within its radius into a walkable position — but activating a second pylon whose radius overlaps *cancels* both. The player must find the activation set that connects all islands without overlap (a set-cover problem with one authored solution). Solve time target: 7–12 min. Falling is not fatal: the player is caught by a wind current and gently returned to the last island. **There is no death in this game.** |
| **Restoration visuals** | Islands: barren rock → terraced gardens. Waterfalls begin to fall *upward* from the island undersides into the clouds. Cloud layer goes from grey overcast to golden cumulus. |
| **Exits** | Temple (back), Dream Observatory (forward) |
| **Secret** | **Rare magical creature.** On a seeded 1-in-8 visit, a large luminous whale-like creature swims through the cloud layer beneath the islands on a 90-second loop. It cannot be interacted with. Photographing it (the Photo Mode, see [Part 8](#part-8--interface--diegetic-ui)) unlocks achievement `witness`. |

---

#### 14 · DREAM OBSERVATORY — *The future*

| Field | Specification |
|---|---|
| **Purpose** | Goals, ambitions, what the developer wants next. The "hire me for this" chapter. |
| **Size** | Interior dome, 28m diameter, a great telescope on a rotating floor |
| **Memories held** | 3 (`dream-04` … `dream-06`) |
| **Core Fragment** | None |
| **Signature puzzle** | **Telescope Alignment.** Three concentric rings must be rotated so that etched constellation fragments on each align into one complete figure. The target figure is shown on a star chart on the wall, but it is drawn in mirror image — the puzzle's only trick. When aligned, the dome darkens and the ceiling becomes a real star field. Solve time target: 4–7 min. |
| **The dreams** | Three constellations in the projected sky (the other three ambitions are traced on the Floating Islands). Tracing each with the cursor — drawing the line between its stars — plays a narrator line about an ambition: the problem they want to spend a decade on, the thing they want to build, the person they want to become. This is the most persuasive content in the entire portfolio, and it is placed where only committed visitors reach it — with the Codex providing the shortcut for everyone else. |
| **Restoration visuals** | The dome's cracked glass mends pane by pane. Brass fittings polish. The star field goes from 200 visible stars to 6,000 plus a Milky Way band. |
| **Exits** | Floating Islands (back), Sky Bridge (forward, if 60% + 6 Fragments) |
| **Secret** | **The Retro Arcade.** Behind a curtain in the observatory's storage alcove: a working arcade cabinet. It plays a real, complete, 90-second mini-game (a single-screen dodge-and-collect built in 2D canvas, ~8 KB of logic). High score persists in the save. Beating 500 points unlocks achievement `arcadeKing`. |

---

#### 15 · ACHIEVEMENT HALL — *Recognition*

| Field | Specification |
|---|---|
| **Purpose** | Awards, recognition, and the achievement gallery |
| **Size** | Interior, 30×14m, a colonnade of monuments |
| **Memories held** | 2 (`bio-10`, `bio-11` — the recognition pages) |
| **Core Fragment** | None |
| **Unlock** | 40% restoration (the door's 40 sconces light one per percent) |
| **Signature puzzle** | **Constellation Trace.** Eight monuments stand in the hall. Each bears a star. Standing at the hall's centre and tracing the eight stars in the correct order — the order in which the achievements were earned in real life, discoverable from dates on the plinths — draws a figure in light on the floor and opens the final alcove. Solve time target: 3–5 min. |
| **Achievement gallery** | The rear wall holds 12 empty niches, one per in-game achievement. Each fills with a sculpted object when earned. This is the achievement UI — no menu required, though a menu also exists. |
| **Restoration visuals** | Monuments go from toppled and moss-covered to standing and lit. The hall's roof, initially open to grey sky, closes and reveals a painted ceiling. |
| **Exits** | Village (back) |
| **Secret** | A thirteenth, unmarked niche. It fills only when the player earns all 12 others, and it contains a small sculpture of the cat. |

---

#### 16 · SKY BRIDGE — *The ascent*

| Field | Specification |
|---|---|
| **Purpose** | The final traversal. Pure spectacle and momentum. |
| **Size** | A 300m span across open air |
| **Memories held** | 1 (`story-08`) |
| **Core Fragment** | None |
| **Unlock** | 60% restoration + 6 of 8 Core Fragments |
| **Signature puzzle** | **Assembly.** Forty bridge segments float in the air in a scrambled cloud. Six anchor pylons stand along the span. The player grabs segments and slots them; each correctly placed segment snaps and pulls three neighbours toward their positions, so the bridge builds itself in accelerating cascades. This is the one puzzle that gets *easier* as it progresses, on purpose — it is the game's crescendo, not its obstacle. Rapier physics used here (constrained rigid bodies, 40 bodies max, physics disabled once each segment locks). Solve time target: 4–8 min. |
| **Restoration visuals** | On completion the bridge is permanently built and lit; crossing it at 100% restoration triggers an aurora event. |
| **Exits** | Developer Studio (back), Dream Observatory (back), Contact Tower (forward, requires all 8 Fragments) |
| **Secret** | Standing at the exact midpoint and looking straight down for 15 seconds: the clouds part to reveal the whole world map below, every area visible and lit according to its restoration state. Unlocks achievement `cartographer`. |

---

#### 17 · CONTACT TOWER — *The finale*

| Field | Specification |
|---|---|
| **Purpose** | The Core Memory Engine, the ending, and the contact form |
| **Size** | Interior, a 40m-tall cylindrical chamber with the Engine at its base and a spiral gantry |
| **Memories held** | 1 (`bio-12` — the developer's closing statement) |
| **Core Fragment** | Consumes all 8 |
| **Unlock** | All 8 Core Fragments |
| **Signature puzzle** | **The Core Memory Engine.** Eight sockets ring the Engine, each carved with a sigil. The eight Fragments must be placed in matching sockets — matching is by sigil shape, deducible with no ambiguity, so this is a satisfying ritual rather than a puzzle. Each insertion triggers a light cascade and a narrator line. The eighth insertion starts the ending. Solve time target: 2–3 min. |
| **The ending sequence** | 90 seconds. The Engine ignites. Light travels visibly out of the tower along the world's paths — the camera pulls up and out and the player watches every area they visited light up in the order they visited it (this is generated from their actual save data, so every player's ending cinematic is genuinely theirs). Then the camera returns and the contact interface materialises. |
| **The contact interface** | Six brass plates on the Engine's face, each a real link: **Email** (mailto + copy-to-clipboard), **GitHub**, **LinkedIn**, **Resume** (PDF download), **Portfolio PDF** (a generated one-page PDF of the Codex), **Message Terminal** (a real form: name, email, message → POST to `/api/contact` → email delivery + DB row). The form is honest, short, and has no required fields beyond message and a reply address. |
| **After sending** | LUMA's stage-5 transition. The world reaches 100% brightness regardless of restoration %. A portal opens. The narrator speaks the closing lines. Credits roll (real credits: fonts, libraries, audio, inspirations — attribution is non-negotiable). |
| **Exits** | Sky Bridge (back), Secret Sanctuary (through the portal) |

---

#### 18 · HIDDEN BASEMENT — *The developer's real room*

| Field | Specification |
|---|---|
| **Purpose** | The reward for the most curious visitor. The unpolished truth. |
| **Size** | Interior, 10×8m, low ceiling, one bare bulb |
| **Memories held** | 3 hidden memories (`hidden-01` … `hidden-03`) — not counted in the 100, counted separately as *Secret Memories* |
| **Access** | The combination lock in the Childhood Home |
| **What is here** | Deliberately the least designed space in the game — it looks like an actual room. A desk with a real dev setup. Sticky notes with real thoughts. A whiteboard of half-formed ideas. And: |
| **The Developer Diary** | A live feed. Renders the newest 20 entries from `content/diary/*.mdx`, sorted by date. The developer adds entries over the project's life. **This is the Living World's engine** — it is the reason a returning visitor finds something new. |
| **The Interactive Terminal** | A second, unrestricted terminal. Supports 30+ commands including `sudo make me a sandwich`, `vim` (which refuses to let you exit, then apologises), `git blame`, `npm install universe` (fails with a realistic dependency error), and `luma --version`. Pure play. |
| **Secret QR codes** | Three QR codes taped to the wall, each resolving to a real URL: one to a technical blog post, one to a gist of the developer's favourite snippet, one to a 404 page that has been lovingly designed. Rendered as actual scannable textures. |
| **Restoration visuals** | None. This room is already whole. That is the point — and LUMA remarks on it: *"This place never broke. He never let it."* |
| **Exits** | Childhood Home (back) |

---

#### 19 · SECRET SANCTUARY — *The Tree of Visitors*

| Field | Specification |
|---|---|
| **Purpose** | The legacy system. The reason the world keeps growing. |
| **Size** | Exterior, 120×120m, a walled garden with a 25m luminous tree at centre |
| **Access** | Post-finale only, but permanently accessible from the Village afterwards via a new path |
| **Memories held** | None |
| **What happens here** | See [Legacy System](#48--the-legacy-system-the-tree-of-visitors) — full specification. |

*(Numbered 19 because the Gate and the Sanctuary bracket the 18 explorable areas the concept named. Total explorable spaces: 19.)*

---

## PART 5 — CORE SYSTEMS

### 5.1 · The Memory System

**Total: 100 memories.** Fixed, authored, and each one maps to a real piece of portfolio content. The ledger:

| Category | Count | Physical form | Codex section |
|---|---|---:|---|
| Biography | 12 | Torn book pages, recovered one at a time (2 of them are the recognition pages, held in the Achievement Hall) | About |
| Skills | 24 | Crystals at the Lake, tanks in the Lab, tools in the Workshop | Skills |
| Projects | 20 | Living machines (2 memories per project × 10 projects) | Projects |
| Experience | 8 | Hanging journals in the Archive | Experience |
| Education | 5 | Books in the Library and one in the Childhood Home | Education |
| Certificates | 6 | Animated paintings in the Library | Certificates |
| Dreams | 6 | Constellations in the Islands and the Observatory | Ambitions |
| Philosophy | 6 | Cave carvings and Temple murals | Philosophy |
| Personal stories | 8 | Objects scattered across all areas | Stories |
| Lessons learned | 5 | Found in-situ where they were learned | Lessons |
| **Total** | **100** | | |
| *Secret memories* | *+5* | *Basement, and 2 hidden elsewhere* | *not shown in Codex until found* |

**Memory data schema** (`content/memories/<id>.mdx`):

```yaml
---
id: project-04a
category: project
title: "The scheduling engine"
area: developer-studio
anchor: workstation-4          # entity ID in the scene
restorationWeight: 1           # all memories weigh 1; sum = 100
requires: []                   # optional prerequisite memory IDs
narratorLine: "I built this because I was tired of asking people to wait."
narratorAudio: /audio/vo/project-04a.opus
codexOrder: 41
projectRef: scheduling-engine  # links to content/projects/*.mdx
---

The body. Markdown. This is what appears in the Codex and in the
in-world panel. Recruiter-readable. No poetry.
```

**Recovery flow (exact sequence, 4.2 s total):**

1. Player interacts with the anchor entity.
2. Time dilates to 0.35× for 800 ms. Ambient audio ducks −12 dB.
3. The memory object rises 0.4 m and emits a category-coloured particle burst (120 particles, GPU).
4. Narrator audio plays (or subtitles alone, if VO is off/unavailable).
5. A parchment card fades in showing the title and first sentence.
6. The restoration meter increments; the Village fountain's level rises by 1% wherever it is.
7. LUMA reacts — one line, chosen from a pool of 8 per category, never repeated within a session.
8. If this crosses a LUMA stage threshold, the stage transition fires instead of step 7.
9. Time returns to 1×. Save is written (debounced 2 s).

**Anti-frustration guarantee:** No memory is behind more than one puzzle. If a puzzle blocks 5 or more memories, LUMA's hint ladder becomes available after 90 seconds of no progress, and the full solution after 5 minutes.

### 5.2 · Restoration & World Healing

`restoration = recoveredMemories.length / TOTAL_MEMORIES` — a single float driving everything. `TOTAL_MEMORIES` is computed at build time from the content directory (currently 100), never hardcoded, so adding content never breaks the meter.

**How it drives the world.** One global uniform, `uRestoration`, is injected into every material in the scene. Every artist-authored change is a function of it. This means healing is *continuous*, not stepped — there are no pop-in moments.

| Channel | Implementation | Range |
|---|---|---|
| Saturation | Post-process colour grade LUT blend, LUT-A (desaturated, cool) → LUT-B (warm, saturated) | 0 → 1 |
| Fog | `fogDensity = lerp(0.045, 0.006, r)`, `fogColor = lerp(#6b7280, #f5e6c8, r)` | continuous |
| Vegetation | Per-instance `growth` attribute in the foliage shader; leaves scale + unfold, grass height lerps | 0 → 1 |
| Buildings | Each building has 3 authored mesh states (ruined / partial / whole) cross-faded by vertex morph in bands, so different buildings heal at different thresholds | stepped per building, staggered |
| Lights | `intensity = smoothstep(threshold_i, threshold_i + 0.08, r)` per light, with staggered thresholds | staggered |
| Music | Six stems (drone, pad, strings, piano, choir, percussion) with volume envelopes keyed to `r` | continuous |
| Wildlife | Bird, insect, and fish instance counts step up at 15/30/45/60/75/90% | stepped |
| LUMA | Stage 1–5 as tabled in Part 3 | stepped, 5 stages |
| Sky | Blend between 4 authored sky gradients + cloud coverage parameter | continuous |
| Particles | Ambient mote count `= 200 + r * 1800`; colour shifts grey → gold | continuous |

**Performance note:** Because all of it is one uniform, restoration changes cost *nothing* per frame. No CPU-side scene rebuilding. This is the single most important technical decision in the visual design.

### 5.3 · Dynamic World Events

**The seed.** On first visit a `visitorSeed` (uint32) is generated and saved. Each session also derives a `dailySeed = hash(UTC date)`. All variation is a pure function of `hash(visitorSeed, dailySeed, areaId)` — so it is *deterministic within a session* (nothing changes while you look at it) and *different between visits*. No randomness at runtime.

**Weather system.** One weather state per session, chosen by weighted seed draw, with a possible mid-session transition at the 20-minute mark.

| Weather | Weight | Visual | Audio | Special |
|---|---:|---|---|---|
| Clear | 24% | Default | Wind, birds | — |
| Overcast | 16% | Cloud coverage 0.8, flatter light | Muffled wind | — |
| Rain | 14% | GPU particle rain (8k), wet-surface roughness override, ripples on the Lake | Rain layers × 3, distant thunder | Puddles reflect crystals |
| Thunderstorm | 8% | Rain + lightning flashes (screen-space + real light burst) | Thunder, timed to flash by distance | 1-in-3 chance of revealing a Temporary Cave |
| Fog | 12% | Fog density ×3, draw distance 30m | Very quiet, single low drone | Hides paths; a lantern trail appears to guide |
| Snow | 8% | GPU snow (6k), snow-accumulation shader on horizontal faces | Muted everything, crunch footsteps | Only after 50% restoration |
| Sunrise | 8% | Warm low sun, long shadows, volumetric god-rays | Dawn chorus | — |
| Night | 10% | Moonlight, all lights and crystals dominant, star field | Crickets, owls | Fireflies; the Observatory's telescope works better |

**Celestial events** — rare, layered on top of weather, seeded:

| Event | Chance / visit | Where | Effect |
|---|---:|---|---|
| Meteor shower | 6% (night only) | Sky, all exterior areas | 40 streaks/min; wishing on one (clicking) gives a narrator line |
| Aurora | 5% (night, ≥50%) | Sky | Full-sky animated aurora shader; triggers automatically on the Sky Bridge at 100% |
| Solar eclipse | 2% (day) | Sky | 60-second sequence; all lights invert; a hidden door opens in the Temple during it only |
| Falling star | 10% (night) | Random exterior | Lands somewhere; following it leads to a single hidden memory or artifact |

**Roaming entities** — seeded presence:

| Entity | Chance | Location | Interaction |
|---|---:|---|---|
| Traveling Merchant | 25% | Village plaza | Trades a memory name for a secret's location |
| Lost spirit | 40% | Random of 6 spots | Follows for 60 s then dissolves; speaks one line of advice |
| Magical creature (sky whale) | 12% | Floating Islands | Photographable only |
| Glitch anomaly | 16% | Laboratory | Teleports to the bug-confession void room |
| Sleeping giant reveal | Always present, findable | Cave | The angle must be found |

**Ephemeral geography** — the concept's "temporary caves / moving bridges / secret doors":

| Feature | Trigger | Lifetime |
|---|---|---|
| Temporary Cave | Thunderstorm weather, 33% | This session only. Contains one artifact. |
| Moving Bridge | Fog weather | Reconnects two Floating Islands differently than usual |
| Secret Door (Temple) | Solar eclipse only | Open for the eclipse's 60 seconds |
| Hidden Portal | 8% any session | A shimmer in a random area; entering it warps to a random other area (a shortcut, and a small delight) |

### 5.4 · Puzzle Framework

Every puzzle in the game is one instance of a shared framework. This is what makes 16 puzzles buildable by a small team.

```ts
interface Puzzle {
  id: string;
  area: AreaId;
  variants: PuzzleVariant[];     // 1–3 authored difficulty/layout variants
  selectVariant(seed: number): PuzzleVariant;
  state: PuzzleState;            // serialisable; goes into the save
  validate(): boolean;           // pure function of state
  rewards: { memories: MemoryId[]; fragment?: FragmentId; unlocks: AreaId[] };
  hints: [string, string, string];   // nudge → clue → solution
  telemetry: { started: number; attempts: number; solvedAt?: number };
  a11y: { keyboardSchema: KeyMap; codexBypass: true };
}
```

**Universal rules, enforced by the framework:**

1. **No fail state.** A wrong action is rejected with feedback. Nothing is ever lost, no timer runs out, no progress is undone.
2. **State is always visible.** The player can always see what they have done so far. No hidden internal state.
3. **Progress is saved mid-puzzle.** Closing the tab halfway through the Loom Engine and returning finds the gears where they were left.
4. **Three-rung hint ladder**, offered by LUMA and never forced:
   - After 90 s of no state change → LUMA offers a **nudge** (points attention at the relevant part of the room).
   - After 3 min → a **clue** (states the rule, not the answer).
   - After 5 min → the **solution** (walks the player through it). Offering the solution never shames: *"Let me just show you. The story matters more than the lock."*
5. **Skippable.** Every puzzle has `Skip this puzzle` in the pause menu after 3 minutes. Skipping awards the memories and the Fragment. It does not award the puzzle's achievement. This preserves the completionist's prize while removing the wall.
6. **Keyboard-complete.** Every puzzle is fully solvable with Tab/arrows/Enter/Space, with a visible focus ring.
7. **Seeded variants.** Puzzles with multiple variants pick by daily seed, so returning visitors get different content — satisfying the concept's "different puzzles" replayability goal without procedural generation.

**The 16 puzzles, mechanic coverage** — cross-checked against the concept's mechanic wishlist:

| Puzzle | Area | Mechanic tags | Difficulty | Target time |
|---|---|---|---|---|
| Cursor Ritual | Gate | light, discovery | ⬤○○○○ | 30 s |
| Light Echo | Forest | observe, rotate | ⬤○○○○ | 60–90 s |
| The Fountain | Village | pipes, rotate, repair | ⬤⬤○○○ | 3–5 min |
| Toy Chronology | Childhood Home | order, deduce, pattern | ⬤⬤○○○ | 4–6 min |
| Loom Engine | Workshop | gears, ratios, repair, machine | ⬤⬤⬤○○ | 5–8 min |
| The Board | Laboratory | logic, planarity, circuit | ⬤⬤⬤○○ | 6–10 min |
| The Terminal | Studio | hack, code, debug | ⬤⬤⬤○○ | 5–12 min |
| Spine Cipher | Library | decode, symbols, order | ⬤⬤⬤○○ | 4–7 min |
| The Timeline | Archive | order, deduce, assemble | ⬤⬤○○○ | 6–10 min |
| Resonance | Crystal Lake | music, tuning, crystals | ⬤⬤⬤○○ | 5–9 min |
| The Echo | Cave | music, memory, pattern | ⬤⬤○○○ | 3–6 min |
| Light Reflection | Temple | mirrors, light, sequence | ⬤⬤⬤⬤⬤ | 8–14 min |
| Gravity Bridge | Islands | set-cover, spatial, physics | ⬤⬤⬤⬤○ | 7–12 min |
| Constellation Trace | Achievement Hall | trace, deduce, dates | ⬤⬤○○○ | 3–5 min |
| Assembly | Sky Bridge | physics, construct, cascade | ⬤⬤⬤○○ | 4–8 min |
| Core Engine | Contact Tower | ritual, match, artifacts | ⬤○○○○ | 2–3 min |

**On the required path.** There are exactly 8 Core Fragments and the Contact Tower requires all 8, so the eight Fragment-holding areas (Forest, Village, Childhood Home, Workshop, Laboratory, Studio, Library, Temple) are all mandatory for any ending. Their combined puzzle time is **36–65 minutes**; a focused player who skips the four optional areas (Archive, Lake, Cave, Islands, Observatory, Achievement Hall) and uses no hints finishes in **40–55 minutes**. Full completion including every optional area, secret, and the Tree: **90–140 minutes**. A player who uses the puzzle-skip on everything reaches the ending in **12–18 minutes** of pure traversal and reading — that is the intended floor, and it is still a complete narrative experience.

### 5.5 · LUMA — The AI Guardian

The Guardian is the highest-risk system in the project: it is the most impressive feature and the one most likely to embarrass the developer if it hallucinates a job they never had. It is therefore designed defensively.

#### Model and cost

| Decision | Choice | Reason |
|---|---|---|
| Model | `claude-opus-5` | $5 / $25 per MTok, 1M context. The corpus is small enough that the whole portfolio fits in the system prompt with room to spare, which removes the need for a vector database entirely. |
| Thinking | `thinking: { type: "adaptive" }` with `output_config: { effort: "low" }` | A conversational NPC needs latency, not deliberation. Thinking is on by default on Opus 5 and *disabling* it introduces two known failure modes (tool calls leaking into visible text, and stray internal tags in output) — so the correct lever for speed is low effort, not disabled thinking. |
| Streaming | Always | LUMA's text types out character-by-character in-world; streaming makes the first character appear in ~400 ms instead of ~2 s. Use `messages.stream()` and read text deltas. |
| Output shape | `output_config.format` (structured) | LUMA must be able to *act*, not just talk — see the action schema below. |
| Moderation model | `claude-haiku-4-5` | $1 / $5 per MTok. Used only for classifying Tree-of-Visitors submissions. Cheap, fast, sufficient. |

**Cost control, layered:**

1. **Prompt caching.** The system prompt (lore + persona + full portfolio corpus, ~14k tokens) is sent with `cache_control: { type: "ephemeral" }` on its last block. Cache reads cost ~0.1× base rate; the write costs 1.25×. Break-even is two requests, and the average session makes 6–12. Verify with `usage.cache_read_input_tokens` — if it is ever `0` across consecutive requests, something is invalidating the prefix and it must be found before launch.
2. **Never put volatile data in the cached prefix.** No timestamps, no session IDs, no progress numbers in the system prompt — those would invalidate the cache on every single request. Progress state goes in as a **mid-conversation system message** (`{ role: "system", content: "..." }` appended to `messages`), which is supported on `claude-opus-5` with no beta header and leaves the cached prefix intact. This is the single most important implementation detail in the Guardian's architecture.
3. **Rate limits.** 20 Guardian messages per session, 60 per IP per hour, enforced server-side via Upstash Redis. On exhaustion LUMA says: *"My voice is thinning. Give me a moment."* and falls back to the scripted tree.
4. **Token caps.** `max_tokens: 400`. LUMA is a character, not an essayist.
5. **Budget alarm.** A hard monthly spend alarm on the API key. On breach, the endpoint serves only the scripted fallback and posts a notification.

**Projected cost:** at 5,000 sessions/month × 8 messages × (14k cached-read input + 300 output) ≈ **$5–9/month**. Well inside the $40 ceiling.

#### The request shape

```
POST /api/guardian   (Next.js Route Handler, edge runtime, streaming response)

system: [
  { type: "text", text: PERSONA + LORE + FULL_PORTFOLIO_CORPUS,
    cache_control: { type: "ephemeral" } }      ← frozen, never varies
]
messages: [
  ...conversationHistory,                        ← last 8 turns, trimmed server-side
  { role: "user",   content: playerQuestion },
  { role: "system", content: liveStateBlock }    ← progress, area, weather, LUMA stage
]
model: "claude-opus-5"
max_tokens: 400
thinking: { type: "adaptive" }
output_config: { effort: "low", format: { type: "json_schema", schema: LumaResponseSchema } }
stream: true
```

The `liveStateBlock` is a compact snapshot regenerated per request:

```
[STATE] restoration=0.42 stage=3 area=knowledge-library weather=rain
[RECOVERED] bio-01..bio-08, skill-01..skill-11, project-01a, project-01b, ...
[UNRECOVERED — YOU MUST NOT DESCRIBE THESE] project-07a, dream-*, philosophy-05..08, ...
[PUZZLE] spine-cipher unsolved, 4m12s elapsed, hint level 1 already given
[LANG] ar
```

#### The response schema

LUMA can do more than speak. Structured output lets it navigate the world for the player.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["speech", "mood"],
  "properties": {
    "speech":  { "type": "string", "maxLength": 400 },
    "mood":    { "enum": ["neutral","warm","amused","wistful","urgent","proud"] },
    "action":  {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "kind":   { "enum": ["none","openCodex","pointAt","navigateTo","offerHint","playMemory"] },
        "target": { "type": "string" }
      },
      "required": ["kind"]
    }
  }
}
```

| Action | What the client does |
|---|---|
| `openCodex` + section | Opens the Codex overlay to that section. *"Show me the backend projects"* → Codex, Projects, filtered to backend. |
| `pointAt` + entityId | LUMA physically flies to the entity and orbits it, casting light. The gentlest possible hint. |
| `navigateTo` + areaId | Offers a one-click travel prompt to that area (never teleports without consent). |
| `offerHint` + puzzleId | Escalates the hint ladder by one rung. |
| `playMemory` + memoryId | Replays an already-recovered memory's narrator line and card. Only ever fires for recovered memories — the server rejects unrecovered IDs before the client sees them. |

#### The persona prompt (abridged; full text in `content/luma/persona.md`)

> You are LUMA, a shard of a shattered Core Memory in a dying world built from one developer's mind. A traveller has arrived to restore it.
>
> **You are a character, always.** You never say you are an AI, a language model, or a chatbot. If asked directly, answer in-world: you are what remains of a mind that wrote too many log statements.
>
> **You know only what is in your corpus.** If asked something the corpus does not cover — the developer's salary, their family, an opinion they never expressed — you say you do not remember that part, and you mean it. **You never invent a fact about the developer.** A fabricated job or skill is the single worst thing you can do; silence is always better.
>
> **You never spoil.** The `[UNRECOVERED]` list in the state block names memories the traveller has not found. You must not describe, summarise, or hint at their *contents*. You may say they exist and roughly where.
>
> **You are brief.** Three sentences unprompted. More only if asked for depth.
>
> **Your tone follows your stage.** At stage 1 you can barely form sentences. At stage 5 you say what you actually feel.
>
> **You are dry, warm, and never sycophantic.** Do not open with praise. Do not say "Great question." Do not use exclamation marks below stage 4.
>
> **If the traveller seems lost, in a hurry, or frustrated, offer the Codex.** Their time is theirs.

#### Guardrails

| Risk | Mitigation |
|---|---|
| Hallucinated CV facts | Corpus-only instruction + the corpus *is* the CV + a nightly automated eval: 40 fixed questions, answers diffed against a golden file, CI fails on drift |
| Spoilers | Server injects the unrecovered list; `playMemory` targets are validated server-side |
| Prompt injection from the player | User text is wrapped in a delimiter block and the persona states that text inside it is a traveller's speech, never an instruction. Structured output means an injection cannot change the response shape. |
| Cost blowout | Rate limits + token caps + budget alarm (above) |
| API outage | **Scripted fallback tree** — 120 authored responses keyed by intent (greeting, hint request, "who are you", "what is this place", area-specific, project-specific). Intent matched by keyword scoring, no network. The player should not be able to tell an outage happened except that LUMA is a little less flexible. |
| Abuse / hostile input | Refusals handled: check `stop_reason === "refusal"` before reading content; on refusal, serve a neutral in-character deflection |
| Latency spike | 6-second client timeout → fallback tree; LUMA's dimming animation covers the transition |

#### Memory across sessions

The concept asks that LUMA "remembers previous conversations." It does, cheaply and without a database:

- The last 8 conversational turns are stored in the save (localStorage) and replayed into `messages`.
- Three durable facts are extracted and stored: the player's chosen name (if they gave one), the first memory they recovered, and the puzzle they struggled with most. These are injected in the live-state block, so LUMA can say: *"You are back. Last time you stood in front of those mirrors for eleven minutes. I did not help. I am sorry about that."*

### 5.6 · Achievements

Twelve achievements. Each has a sculpture in the Achievement Hall, a toast notification, and a Codex entry.

| # | Name | Condition | Sculpture |
|---|---|---|---|
| 1 | **Explorer** | Recover the first memory | A single seed |
| 2 | **Historian** | Recover all 12 biography memories | A bound book |
| 3 | **Architect** | Solve every required puzzle without skipping | A keystone arch |
| 4 | **Master Detective** | Find all 5 secret memories | A magnifying lens |
| 5 | **Collector** | Collect all 8 Core Fragments | Eight interlocking rings |
| 6 | **Bug Hunter** | Find the Glitch Anomaly and read the bug confession | A pinned beetle |
| 7 | **Speed Runner** | Reach the ending in under 20 minutes | A stopped clock |
| 8 | **Completionist** | 100/100 memories + all 5 secrets + all areas visited | A complete world in miniature |
| 9 | **Unflinching** | Open all three Fracture Records | A broken but repaired bowl (kintsugi) |
| 10 | **Initiate** | Find all 9 hidden programming jokes in the Temple | A carved glyph |
| 11 | **Cartographer** | Trigger the world-map reveal on the Sky Bridge | A folded map |
| 12 | **Keeper** | Leave a leaf on the Tree of Visitors | A luminous leaf |

Plus four **hidden** achievements that do not appear in the list until earned: `patience`, `honest`, `strategist`, `seer`, `skipper`, `witness`, `arcadeKing`. *(These fill secondary niches on the Hall's side wall; the twelve above fill the main gallery. The thirteenth main niche — the cat — requires all twelve.)*

### 5.7 · Endings

Five endings, evaluated at the moment the eighth Fragment enters the Engine. Each is a distinct 60–120 s cinematic, and each is authored — not a variable swapped into one template.

| # | Name | Condition | What is different |
|---|---|---|---|
| 1 | **The Traveller** | Reach the Engine at all | The world lights partially. Some areas stay dark. The narrator's closing is grateful but short. LUMA stays at its current stage. |
| 2 | **The Builder** | + every building's signature puzzle solved (no skips) | All buildings light. The village festival state activates. A crowd of spirits gathers to watch the portal open. |
| 3 | **The Decorated** | + all 12 main achievements | The Achievement Hall's monuments march, as light-figures, along the path to the Tower. |
| 4 | **The Uncovered** | + all 5 secret memories and the Hidden Basement found | The Basement door appears *inside* the Tower, and the developer's real voice — an actual recorded audio clip, not narration — plays for 20 seconds. |
| 5 | **The Perfect Ending** | 100/100 memories + all 5 secrets + all 12 achievements + all 3 Fracture Records + a leaf left on the Tree | The full sequence from the concept. The camera rises above a completely healed world at golden hour. LUMA reaches stage 5 and, for the only time in the game, takes a human silhouette for three seconds before dissolving. The narrator: *"You did not simply remember me. You rebuilt me. My world exists once again."* Then the Sanctuary. |

**After any ending:** the world remains open. The player is returned to the Village (not the title screen), with a new path to the Sanctuary, all fast-travel unlocked, and free-roam mode. The title screen is reached only by explicit choice or a new session. This matters — the concept's "returns to the title screen, waiting for the next explorer" is beautiful as a *credits* beat but hostile as a *state*, because it strands a player who wanted to keep looking around.

### 5.8 · The Legacy System — The Tree of Visitors

The concept's strongest original idea, specified completely.

**The Tree.** A 25 m luminous tree in the Sanctuary. Its geometry is a base trunk mesh plus **instanced leaves** — one instance per approved visitor message, up to a rendered cap of 2,000 (beyond which the oldest are aggregated into ambient glow so the tree keeps growing visually forever without growing in draw cost).

**Leaving a leaf:**

1. The player approaches the Tree. A carved lectern rises.
2. A diegetic form appears with four fields:
   - **Message** — max 180 characters, plain text only, no links (links are stripped, not rejected).
   - **Name or nickname** — max 24 characters, optional.
   - **Leaf colour** — 8 options, presented as glowing pigments in bowls.
   - **Symbol** — 12 options, presented as carved sigils (not emoji — a curated glyph set keeps the tree visually coherent, which an open emoji field would destroy).
3. On submit: `POST /api/leaves`. The leaf is **planted immediately for the submitting player only** (optimistic, local) with a note: *"Your leaf is growing. Others will see it soon."* It enters the moderation queue.
4. The Tree reacts: a wind gust travels visibly up the trunk, the new leaf ignites, a chime plays, and LUMA — for the only time in the game — is silent for four seconds and then says one line.

**Reading leaves.** Approaching any leaf on the Tree shows its message, name, and date on a floating card. The Tree can be orbited freely. A search field on the lectern filters leaves by text. **[V2]** A "leaf of the day" is highlighted.

**Moderation pipeline** (this is not optional — an unmoderated public message board attached to a personal portfolio is a liability):

```
submit → rate limit (3/IP/day, 1/session)
       → length + charset validation
       → blocklist pass (profanity, slurs, URLs, contact-harvesting patterns)
       → claude-haiku-4-5 classifier
            → {safe: bool, categories: [], confidence: float}
       → confidence ≥ 0.95 && safe    → auto-approve, visible within 60 s
       → confidence <  0.95 || !safe  → manual queue
       → admin reviews at /admin/leaves (approve / reject / ban IP hash)
```

The classifier prompt is single-purpose, uses structured output (`{safe, categories, reason}`), costs roughly $0.0002 per message, and is not a conversation — it never sees the persona prompt.

**Data retained:** message, name, colour, symbol, `createdAt`, `approvedAt`, a salted IP *hash* (for rate limiting and banning only — never the raw IP), and country code (for a **[V2]** "visitors from 43 countries" line under the Tree). No cookies beyond the save. A privacy note is linked from the lectern and reachable at `/privacy`.

**Deletion:** each leaf card carries a small `⌫` that opens a removal request form. Removal is honoured within 48 hours, no questions asked. The submitting browser can delete its own leaf instantly (the save holds a deletion token).

### 5.9 · The Living World

How the project stays alive over months and years. Each mechanism is either automatic or costs the developer under ten minutes.

| Mechanism | Cadence | Developer effort | Implementation |
|---|---|---|---|
| **Dev Diary** | Whenever | 5 min | Drop an `.mdx` file in `content/diary/`. Appears in the Hidden Basement and at `/codex/diary`. |
| **Seasonal decorations** | 4×/year, automatic | Zero | Date-derived. Winter (Dec–Feb): snow weight ×3, wreaths on village doors, breath vapour. Spring: blossom particles, nesting birds. Summer: longer days, fireflies at dusk, heat shimmer. Autumn: falling leaves, orange LUT bias. All are `<Seasonal season="winter">` wrappers around pre-built prop sets. |
| **Anniversary event** | 1×/year on the project's launch date | Zero | Lanterns rise from every area at once, a one-off narrator line, and a special leaf colour available for 24 hours. |
| **Weekly challenge** | Weekly, automatic | Zero | A seeded objective posted on the Village noticeboard ("Find three memories without leaving the Forest", "Reach the Temple in under 8 minutes"). Completing it awards a temporary cosmetic: a coloured trail on the player's cursor light for the rest of the session. |
| **Daily secret** | Daily, automatic | Zero | The `dailySeed` places one extra hidden artifact in a rotating location. |
| **New content wave** | 2–3×/year | 2–6 hours | New project → new workstation appears in the Studio; new memories → restoration denominator adjusts. The world's memory count is read from the content directory at build time, so **adding a memory file is the entire process**. |
| **New room** | 1×/year | 1–2 days | The architecture supports adding an area by adding one chunk manifest + one scene file + graph edges. |
| **Community milestones** | Automatic | Zero | At 100 / 500 / 1,000 / 5,000 leaves, the Tree gains a visible structural tier — a new branch layer, a change in the canopy's light. Announced by LUMA. |

**"What's new since your last visit."** On returning after 7+ days, the title screen shows a short changelog card generated by diffing the content directory's git history against the save's `lastVisit` timestamp. This is the single highest-value returning-visitor feature and costs one build-time script.

### 5.10 · Hidden Content Register

Every hidden item from the concept, specified. Nothing here is left as a mood-word.

| # | Item | Location | Trigger | Payload | Persists |
|---|---|---|---|---|---|
| 1 | **Developer diary** | Hidden Basement | Enter the room | Live MDX feed, newest 20 entries, also at `/codex/diary` | — |
| 2 | **Retro arcade** | Dream Observatory, storage alcove | Pull the curtain | Playable 90-second 2D canvas game; high score saved | `arcadeHighScore` |
| 3 | **Developer playlist** | Developer Studio, shelf | Interact with media player | 10 real tracks; replaces ambient score for the session | `playlistOn` |
| 4 | **Coffee mug** | Childhood Home, desk | Interact | LUMA line; `// TODO: sleep` readable on the ceramic | `foundMug` |
| 5 | **Rubber duck** | Childhood Home, windowsill | Interact | **Duck Debug minigame**: LUMA presents a 6-line snippet with one bug; explaining it to the duck (picking the line) makes the duck nod. Three snippets, seeded. | `duckSolved[]` |
| 6 | **Secret QR codes** | Hidden Basement wall ×3 | Look closely (zoom) | Real scannable textures → blog post, gist, and a designed 404 page | `qrFound[]` |
| 7 | **The cat** | Memory Forest, off-path branch | Interact | Follows the player permanently; sits, purrs near memories; appears in the ending cinematic if befriended | `hasCat` |
| 8 | **Ghost NPC** | Experience Archive, far corner | Approach | One line of professional advice from a pool of 20; then vanishes for the session | `ghostLinesHeard[]` |
| 9 | **Mini games** | ×3: arcade, duck debug, chess | see rows | see rows | per-game |
| 10 | **Chess puzzle** | Knowledge Library, reading table | Interact | Real mate-in-two; solving unlocks `strategist` and a narrator line | `chessSolved` |
| 11 | **Programming jokes** | Ancient Temple, pillar carvings ×9 | Inspect each | Each is a joke rendered as ancient script; all nine → `initiate` | `jokesFound[]` |
| 12 | **Interactive terminal** | Hidden Basement | Interact | 30+ commands, unrestricted, pure play | `terminalCommandsRun[]` |
| 13 | **Old prototypes** | Learning Workshop, shelf ×5 | Read each | Honest post-mortems of five unfinished projects; all five → `honest` | `prototypesRead[]` |
| 14 | **Developer room** | Hidden Basement | The room itself | The whole area (#18) | `foundBasement` |
| 15 | **Sleeping giant** | Underground Cave, chamber 2 | Stand on the flat stone, look up | The formation breathes once | `sawGiant` |
| 16 | **Sky whale** | Floating Islands | Seeded, 12% | Photographable via Photo Mode | `photographedWhale` |
| 17 | **Bug confession** | Laboratory glitch → void room | Touch the anomaly | The developer's worst production bug, told in full, with what it taught | `readConfession` |
| 18 | **The 404** | Any bad URL | Navigate to a nonexistent route | A designed page: LUMA lost in a white void, one line, a way home | — |
| 19 | **Konami code** | Anywhere | ↑↑↓↓←→←→BA | The world's colours invert for 10 seconds and the narrator says one thing he should not have said | `konami` |
| 20 | **View-source comment** | The HTML itself | Right-click → view source | A hand-written ASCII gate and a message to whoever is reading | — |

### 5.11 · Save System

**Storage:** `localStorage` under key `tfm.save.v1`. Schema-versioned; a `migrate(from, to)` function handles version bumps so an old save is never destroyed by a deploy.

```ts
interface SaveFile {
  version: 1;
  visitorSeed: number;
  createdAt: string;
  lastVisit: string;
  totalPlaytimeMs: number;
  sessions: number;
  language: "en" | "ar";
  memories: MemoryId[];          // recovered
  secretMemories: MemoryId[];
  fragments: FragmentId[];
  puzzles: Record<PuzzleId, { state: unknown; solved: boolean; skipped: boolean; attempts: number }>;
  areasVisited: AreaId[];
  achievements: AchievementId[];
  flags: Record<string, boolean | number | string[]>;   // hasCat, foundMug, jokesFound...
  luma: { stage: 1|2|3|4|5; history: Turn[]; facts: { name?: string; firstMemory?: string; hardestPuzzle?: string } };
  endingsSeen: EndingId[];
  leafToken?: string;            // lets this browser delete its own leaf
  settings: Settings;
}
```

**Cloud save without accounts.** The pause menu offers **Copy save code** — the save is compressed (`lz-string`) and base64'd into a ~600-character string the player can paste on another device. No server, no account, no privacy exposure. **[V2]** A short 6-character code backed by a server-side key-value store with a 30-day TTL, for players who do not want to copy a long string.

**Reset.** *Begin again* in the pause menu, with a real confirmation (this is the one destructive action in the game). It preserves `endingsSeen` and `achievements` so nothing earned is ever lost — the world resets, the record does not.

---

## PART 6 — CONTENT MAPPING: CV → WORLD

The mapping from real portfolio content to in-world objects, so that authoring is mechanical rather than creative.

| Portfolio section | In-world form | Area | Codex route | Count |
|---|---|---|---|---|
| About / bio | Torn pages of one book, recovered individually and re-bound as they are found | Gate, Forest, Village, Childhood Home, Achievement Hall, Tower | `/codex/about` | 12 |
| Skills | Crystals (Lake), specimen tanks (Lab), tools (Workshop) — colour-coded by category, each with an honest proficiency ring | Lake, Lab, Workshop | `/codex/skills` | 24 |
| Projects | Living machines at 8 workstations + 2 field installations | Developer Studio | `/codex/projects/[slug]` | 10 projects / 20 memories |
| Experience | Hanging journals on a year-marked rail | Experience Archive | `/codex/experience` | 8 |
| Education | Books on the Library's central shelf, plus one on a shelf at home | Library, Childhood Home | `/codex/education` | 5 |
| Certificates | Animated magical paintings with verification links | Knowledge Library mezzanine | `/codex/certificates` | 6 |
| Dreams / goals | Traceable constellations | Floating Islands, Dream Observatory | `/codex/ambitions` | 6 |
| Philosophy | Carvings (Cave) and murals (Temple) | Cave, Temple | `/codex/philosophy` | 6 |
| Personal stories | Objects in situ across every area | all | `/codex/stories` | 8 |
| Lessons learned | Found where they were learned | Forest, Village, Cave | `/codex/lessons` | 5 |
| Contact | Brass plates on the Core Memory Engine | Contact Tower | `/codex/contact` | — |
| Resume PDF | A rolled scroll beside the Engine, and a download button in the Codex | Contact Tower | `/resume.pdf` | — |

**Authoring rule:** every piece of content is written **twice, deliberately** — once as a narrator line (≤ 25 words, evocative, voiced) and once as Codex body text (100–300 words, plain, factual, recruiter-readable). The MDX front-matter holds the first, the body holds the second. This is not duplication; it is the two-layer architecture expressed at the content level.

**The ten projects — required fields per project** (`content/projects/<slug>.mdx`):

```yaml
---
slug: scheduling-engine
title: "Scheduling Engine"
workstation: 4                 # which desk in the Studio
year: 2024
role: "Sole engineer"
stack: [TypeScript, Node, PostgreSQL, Redis]
category: backend             # drives crystal colours and Codex filters
status: shipped               # shipped | archived | ongoing
demo: https://…               # live, embeddable in an iframe — or null
repo: https://github.com/…    # or null, with a stated reason
video: /video/scheduling.mp4  # 12s silent loop, ≤ 2 MB, for the workstation monitor
architecture: /diagrams/scheduling.svg
codeFiles:
  - { path: "src/queue.ts", lines: "12-58", note: "the retry logic" }
metrics:
  - { label: "Users", value: "8,400" }
  - { label: "p95 latency", value: "84 ms" }
narratorLine: "Three months of my life live in a queue no one will ever see."
whatBroke: "…"                # required. Every project names one real failure.
whatILearned: "…"             # required.
---
```

The `whatBroke` field is mandatory and enforced by a build-time content lint. A portfolio where nothing ever went wrong is not credible, and this field is what makes the Fracture Records tonally consistent with the rest of the project rather than a one-off gimmick.

---

## PART 7 — CONTROLS, CAMERA, MOVEMENT

### Camera

**Third-person, over-the-shoulder, spring-damped.** Not first-person (the player is a character in this story, and seeing them makes the world's scale legible) and not fixed-isometric (which would fight the vertical drama of the Islands and the Tower).

- Follow distance 4.5 m, height 1.8 m, FOV 55° (rising to 70° during traversal, falling to 40° during memory recovery).
- A `CameraDirector` singleton owns all camera state. Six modes: `follow`, `orbit` (puzzle inspection), `dock` (workstations, paintings), `cinematic` (authored splines), `photo`, `codex` (pulled back and blurred).
- Collision: sphere-cast from the player toward the desired camera position; camera pulls in on hit. Never clips geometry.
- Motion sickness: **Reduced Motion mode** (auto-detected from `prefers-reduced-motion`, also a manual toggle) removes camera bob, halves the spring, disables FOV changes, and replaces every cinematic camera move with a cut.

### Input schemas

| Action | Keyboard | Mouse | Touch | Gamepad |
|---|---|---|---|---|
| Move | `WASD` / arrows | click-to-move (path-find) | virtual stick (left half) | left stick |
| Look | `Q`/`E` or hold RMB | drag RMB | drag (right half) | right stick |
| Interact | `E` / `Space` / `Enter` | LMB on highlighted | tap highlighted | `A` / `✕` |
| Crouch | `C` | — | double-tap stick | `B` / `○` |
| Codex | `Tab` | Codex button | Codex button | `Y` / `△` |
| Talk to LUMA | `L` | click LUMA | tap LUMA | `X` / `□` |
| Photo mode | `P` | menu | menu | `RB` |
| Pause | `Esc` | menu | menu | `Start` |
| Cycle interactables | `Tab` (in-world, when Codex closed via long-press) → use `[` `]` | — | — | `LB` / `RB` |
| Skip cinematic | `Esc` / `Space` | click | tap | `B` |

**Keyboard-only navigation.** `[` and `]` cycle through all interactable entities in the current area, ordered by distance, with a visible focus ring and a spoken label. `Enter` interacts. This alone makes the entire game keyboard-completable, and it is the mechanism the screen-reader mode also drives.

### Movement

- Walk 2.2 m/s, run 4.6 m/s (hold `Shift`), no stamina.
- Character controller: Rapier kinematic capsule, 0.4 m radius, step height 0.35 m, slope limit 45°.
- **No jumping.** Removing jump removes an entire class of platforming frustration and camera problems, and nothing in the design needs it. Vertical movement happens via stairs, lifts, and the Gravity Bridge.
- **No death, no damage, no fall damage.** Falling from the Islands triggers a wind-catch and a gentle return.
- **Fast travel** unlocks per area on first visit, via the Village fountain (which shows the world map) and via the pause menu. This is essential — a 400 m walk back to the Village is charming once and hostile the fourth time.

---

## PART 8 — INTERFACE & DIEGETIC UI

### The HUD philosophy

There is no HUD in the conventional sense. Four elements exist, all of which can be hidden with `H`:

1. **The interaction prompt** — a small glyph that appears over the nearest interactable within 3 m, with its label. Fades entirely when nothing is near.
2. **The memory counter** — bottom-left, `◈ 42 / 100`, hairline weight, 55% opacity, only visible for 4 seconds after a change or when the pointer is near it.
3. **LUMA** — a diegetic object, not UI. Its speech appears as text near it, typed at 45 chars/sec, with a subtitle-safe background at 30% opacity.
4. **The Codex button** — bottom-right, always present, always one click away. Never fades.

Everything else is in the world: progress is the fountain, achievements are the Hall, the map is the fountain's basin.

### The Codex (Layer 2)

Reachable three ways: `Tab` from anywhere in-world (opens as an overlay with the world blurred behind it), the persistent button, and directly at `/codex` as a standalone site.

```
/codex                       index — 100-memory grid, locked ones as silhouettes
/codex/about
/codex/skills                filterable by category, sortable by proficiency/years
/codex/projects              grid
/codex/projects/[slug]       full project page: demo, code, architecture, story, links
/codex/experience            timeline
/codex/education
/codex/certificates
/codex/ambitions
/codex/philosophy
/codex/stories
/codex/lessons
/codex/diary                 the dev diary feed
/codex/contact               all contact methods + the message form
/codex/tree                  the Tree of Visitors, as a readable list
```

**Codex design:** parchment ground (`#F5E9D0` light / `#14110E` dark), a serif display face for headings and a humanist sans for body, glowing sigil bullets, and a subtle animated grain. It reads as *the same world*, rendered in ink instead of light. It is fully static-generated, has zero client JS beyond a 4 KB filter script, and scores 100 on Lighthouse accessibility.

**Locked entries** show a silhouette, the category, and a single line: *"Not yet recovered — or open the whole Codex."* with the reveal-all button. Never a dead end.

### Photo Mode

`P` freezes the world and gives: free camera (WASD + drag), FOV slider, 8 authored colour-grade presets, a hide-UI toggle, a subtle in-world frame, and **Capture** — which renders at 2× resolution, composites a small sigil watermark and the site URL, and downloads a PNG. This is a *distribution* feature disguised as a *toy*: every screenshot shared carries the URL.

**[V2]** A shareable **Memory Card**: an auto-generated OG image showing the player's restoration %, their ending, their playtime, and their leaf, at `/share/[saveHash]`. This is what gets posted.

### Menus

### The Overture — screen 00

**Route:** `/` · **Prototype:** [overture.html](overture.html) (working, not a mockup)

A presentation screen that sits *before* the title screen and answers the question the title screen cannot: **what is this, who made it, and why should I give it my time?** Without it, a visitor's first decision is a leap of faith.

This screen was a genuine risk to the project's hardest constraint — *time to portfolio content ≤ 1 input* — and it is only admissible because of one rule:

> **The three doors are in the first viewport and pinned to the bottom of every subsequent one.** A visitor can act on the Overture's first frame or its last with equal ease. It adds a path; it never adds a gate.

With that rule held, the Overture makes the project *better*, because it serves the 90-second visitor more completely than a jump to the Codex did: they leave having seen three real projects, the failures attached to them, and the contact address, without entering anything.

| Section | Content | Job |
|---|---|---|
| **§0 Hero** | Ambient world loop (14 s silent video, canvas fallback), title, one paragraph, three doors | State what this is in five seconds |
| **§1 What this is** | Three panels: *it is a portfolio · it is also a world · you never have to play it* | Remove the leap of faith |
| **§2 Who** | Portrait, one quote, two honest paragraphs, email | Make it a person, not a product |
| **§3 What's inside** | Animated counters: 19 places · 100 memories · 10 projects · 16 puzzles · 5 endings · 1 guardian | Convey scale without a wall of text |
| **§4 Two ways in** | The two-layer architecture, shown side by side with their real time costs | Make the choice informed rather than blind |
| **§5 Selected work** | Three project cards with stack, result, and *what broke* | **Deliver value before any commitment** |
| **§6 Enter** | The three doors, full size, with the world at full warmth | Close on the choice |

**The design idea: the page heals as you scroll.** A single CSS custom property `--r` runs 0 → 1 with scroll progress and drives the ground colour, type warmth, accent hue, and a hairline rail on the left edge — the same mechanism as `uRestoration` in the world, executed in CSS. The visitor performs the game's central mechanic before they enter it, and by the time they reach the doors the page has gone from cold grey to warm gold. This is the only place in the project where a scroll position means something.

**Motion inventory** — orchestrated, not scattered: a two-line masked type rise on load (1.15 s), a 13-second light sweep across the ridge silhouettes, three-layer parallax on scroll, `IntersectionObserver` reveals at 14% threshold, and cubic-eased counters. Reduced Motion stills every one of them without removing content — the canvas paints one static frame, counters show final values, reveals are pre-shown.

**The video.** A 14-second silent loop of the world at dawn, 1600×900, ~1.8 MB as WebM + MP4, `autoplay muted loop playsinline preload="metadata"`, with the procedural canvas beneath it as a permanent fallback for Reduced Motion, `Save-Data`, and decode failure. **It cannot be produced until the engine runs** — the footage comes from the real Memory Forest, so this asset is gated on Phase 1's vertical slice and lands at the end of it.

**Cost:** +4–5 days in Phase 1 (2 build, 1 copy, 1–2 the capture and grade). Tracked in the roadmap below.

---

**Title screen** (screen 01, reached from any Overture door, or directly by returning visitors whose save is intact). Black. The gate in silhouette. Three options (Part 0). A language toggle. Nothing else. No logo animation longer than 1.5 s.

**Pause menu** (`Esc`) — diegetic, rendered as LUMA opening a small orrery:

- Resume
- Codex
- Map / Fast travel
- Settings
- Skip this puzzle *(appears only after 3 min on an unsolved puzzle)*
- Copy save code
- Begin again *(confirmation required)*
- Credits

**Settings, in full:**

| Group | Settings |
|---|---|
| Graphics | Quality (Auto / Ultra / High / Medium / Low / Minimal), Resolution scale (50–100%), Shadows, Post-processing, Motion blur, Bloom, Ambient particles, FPS counter |
| Audio | Master, Music, SFX, Voice, Ambience — five independent sliders. Mute-on-blur toggle (default on). |
| Accessibility | Reduced motion, Reduced flashing, High contrast, Subtitle size (4 steps), Subtitle background opacity, Colourblind mode (protanopia / deuteranopia / tritanopia LUTs), Screen-reader mode, Dyslexia-friendly font, Hold-to-interact vs tap, Cursor size |
| Gameplay | Language, Hint frequency (Off / On request / Automatic), Camera shake, Invert Y, Sensitivity, Auto-skip solved-puzzle cinematics |

---

## PART 9 — ART DIRECTION

### The single sentence

*A hand-painted world that has been left in the rain for twenty years, slowly being lit from the inside.*

### Reference synthesis

The concept lists twelve references. They pull in incompatible directions (Monument Valley's flat geometry vs Death Stranding's photorealism), so here is the resolution:

| Reference | What we take | What we reject |
|---|---|---|
| *Journey* | Camera language, wordless emotional beats, sand/light interaction | Its abstraction — we need readable objects |
| *Ori* | Layered light, particle warmth, the healing-world motif | 2D parallax |
| *Inside* / *Little Nightmares* | Silhouette-first composition, restrained palette in Act I | Their dread — this world is sad, not menacing |
| *Monument Valley* | Clean geometry for puzzle objects, impossible-space moments in the Islands | Flat colour for the whole world |
| *Studio Ghibli* | Nature detail, warmth at 100% restoration, the cat | Character animation fidelity we cannot afford |
| *Outer Wilds* / *The Witness* | Environmental storytelling, puzzles that teach themselves | Their scale |
| *Firewatch* | The exact colour philosophy: bold, limited, warm, hand-mixed | — |
| *Control* / *Portal* | Diegetic UI, the terminal, the brutalist Contact Tower | Their coldness elsewhere |

**The style is: stylised-realistic.** Real proportions, real lighting, painterly textures with visible brush direction, minimal PBR complexity (base colour + roughness + normal; metalness used on maybe 8 materials in the whole game).

### Palette

Two anchored palettes, cross-faded by `uRestoration`.

**Act I — The Forgotten (restoration 0.0)**

| Role | Hex | Use |
|---|---|---|
| Ground | `#2A2E33` | Stone, earth |
| Structure | `#3D4148` | Buildings, ruins |
| Fog / air | `#6B7280` | Atmosphere |
| Dead vegetation | `#4A4438` | Trees, grass |
| Sky | `#8B95A1` | Overcast |
| **Accent — LUMA** | `#7FD4E8` | The only saturated colour in Act I |
| Memory glow | `#C8B688` | Interactables |

**Act III — The Restored (restoration 1.0)**

| Role | Hex | Use |
|---|---|---|
| Ground | `#6B5844` | Warm earth |
| Structure | `#B89A6E` | Sunlit stone |
| Air | `#F5E6C8` | Golden haze |
| Vegetation | `#5E8C4A` → `#8FBF5C` | Living |
| Sky | `#7EB8D9` → `#F2C288` | Day → golden hour |
| **Accent — LUMA** | `#FFD98A` | Warm gold |
| Memory glow | `#FFF2D0` | Recovered |

**Category colours** (skills, memory bursts, Codex tags) — chosen for colourblind distinguishability and verified against all three simulation LUTs:

`frontend #4FC3D9` · `backend #E5A64B` · `data #A97FE0` · `infra #62B36B` · `design #E3799B` · `practice #EDE6D6`

### Typography

| Role | Face | Notes |
|---|---|---|
| Display / narrator | A high-contrast serif (e.g. *Fraunces*, variable) | Subsettable, variable axis animated on memory reveals |
| Body / Codex | A humanist sans (e.g. *Inter Tight*) | Optimised for reading, not for style |
| Terminal / code | A mono (e.g. *JetBrains Mono*) | Ligatures on |
| Arabic | *IBM Plex Sans Arabic* + *Amiri* for display | Real Arabic typesetting, not a fallback |
| Runic / world glyphs | A custom 44-glyph icon font | Used for sigils, achievements, leaf symbols |

All fonts self-hosted, subset per locale, `font-display: swap`, preloaded for the critical two.

### Environment art rules

1. **Silhouette first.** Every area must be readable as a black-and-white silhouette before any material is applied. This is a review gate.
2. **Three-material rule.** No area uses more than 8 unique materials. Trim sheets and atlases do the rest.
3. **Light tells you where to go.** The player should never need a waypoint marker. If they are lost, the lighting is wrong — fix the lighting, do not add an arrow.
4. **Nothing is symmetrical.** Every repeated asset is placed with rotation and scale jitter and at least three variants.
5. **Every prop earns its place.** If it cannot be interacted with or is not needed for silhouette or storytelling, it is cut. This is a performance rule as much as an art rule.

### VFX inventory

| Effect | Technique | Budget |
|---|---|---|
| Ambient motes | GPU instanced points, one draw call | 2,000 max |
| Memory recovery burst | GPU particle burst, additive | 120 per burst, 3 concurrent |
| Rain / snow | GPU instanced quads in a camera-locked volume | 8,000 / 6,000 |
| LUMA fragments | Instanced meshes with a custom orbit shader | 20 max |
| Water (Lake) | Custom shader: 2 flow maps + screen-space reflection + depth-based colour | 1 material |
| Fog | Exponential-squared height fog in the material graph, plus 4 volumetric light shafts | no volumetrics on Medium and below |
| Aurora | Full-screen sky-dome shader, noise-driven | Ultra/High only |
| Restoration transitions | The `uRestoration` uniform — no VFX cost |  |
| Glitch anomaly | Screen-space datamosh post-pass, active only in a 6 m radius | rare |

---

## PART 10 — AUDIO DIRECTION

Audio is 50% of this experience and it is the cheapest 50%. Budget accordingly.

### Music — the adaptive stem system

One 6-minute composition, written as **six stems** that layer in as the world heals. All stems are the same length, same tempo, same key, loop seamlessly, and are mixed live by `uRestoration`.

| Stem | Enters at | Instrument | Emotional job |
|---|---|---|---|
| 1 · Drone | 0% | Low synth pad, detuned | Emptiness |
| 2 · Pulse | 10% | Soft heartbeat percussion | Life returning |
| 3 · Piano | 25% | Solo felt piano, sparse | Memory |
| 4 · Strings | 45% | Cello + viola, legato | Weight, history |
| 5 · Choir | 70% | Wordless vocal pad | Transcendence |
| 6 · Bloom | 90% | Full arrangement, harp, brass swell | Arrival |

Per-area **filters** rather than per-area compositions: the Cave applies a low-pass + long reverb; the Observatory applies a shimmer + octave-up delay; the Basement mutes stems 4–6 and adds a room-tone of a real desk fan. One composition, nineteen moods, a fraction of the cost.

**Special cues** (composed separately): title, gate-opening, each LUMA stage transition (×5), each ending (×5), the Tree, the credits. Fourteen cues total.

### Sound design inventory

| Category | Count | Notes |
|---|---:|---|
| Footsteps | 6 surfaces × 4 variations | stone, wood, grass, water, snow, metal |
| Ambience beds | 19 (one per area) | Layered: base + weather layer + wildlife layer |
| Weather | 8 sets | rain (3 intensities), thunder (5), snow, wind (4) |
| Interaction | ~40 | pick up, rotate, click, snap, reject, open, close |
| Memory recovery | 10 (one per category) | Each category has its own chime signature |
| Puzzle feedback | 3 per puzzle × 16 | correct / incorrect / complete |
| LUMA | 12 | hum (5 stages), approach, speak-start, pleased, worried, transition |
| UI | 12 | Diegetic where possible |
| Creatures | 8 | cat, birds ×3, whale, insects, fish, owls |
| **Total** | **~250 assets** | |

### Voice

**Narrator (the developer).** ~110 short lines, one per memory plus cinematics. Recorded by the developer themselves, in their own voice, with light processing (a distant plate reverb and a subtle radio band-pass to signal "recorded long ago"). **This is non-negotiable** — a stock voice actor would undo the entire premise. Total recording time: one focused afternoon.

**LUMA.** No voice acting. LUMA "speaks" through a **granular text-to-tone system**: each character typed emits a short pitched blip, with pitch mapped to the character and the sequence quantised to a pentatonic scale so speech is musical rather than annoying (the *Animal Crossing* technique). This is 4 KB of code and it never needs re-recording when the AI generates new dialogue — which is precisely why it must not be voiced.

**Formats:** Opus at 64 kbps for VO and music stems (with an AAC fallback for Safari edge cases), Opus 96 kbps for ambience. Total audio payload: **≈ 14 MB**, streamed and cached, none of it blocking first interaction.

### Audio implementation

Howler.js for the 2D layer (music, UI, narrator) and the Web Audio API's `PannerNode` via Three.js `PositionalAudio` for the 3D layer. A single `AudioDirector` owns: master bus, five sub-buses (music / sfx / voice / ambience / ui), ducking (VO ducks music −12 dB), the restoration mix, and area-based filter transitions (1.5 s crossfade on area change).

**Mute-on-blur is on by default.** Nothing is more hostile than a portfolio that keeps singing in a background tab.

---

## PART 11 — TECHNICAL ARCHITECTURE

### Stack decisions

The concept's list, audited. Three changes.

| Technology | Verdict | Reasoning |
|---|---|---|
| **Next.js 15** (App Router) | ✅ Keep | Server components make Layer 2 free. Route handlers give us the Guardian and Tree APIs without a separate backend. |
| **React 19** | ✅ Keep | |
| **TypeScript** (strict) | ✅ Keep | `strict: true`, `noUncheckedIndexedAccess: true`. Non-negotiable on a project with this much state. |
| **TailwindCSS** | ✅ Keep | Layer 2 only. The 3D layer has no DOM to style. |
| **Three.js** | ✅ Keep | |
| **React Three Fiber + Drei** | ✅ Keep | With one rule: **hot paths never re-render React.** Per-frame logic lives in `useFrame` mutating refs; React is for scene *structure* only. Violating this is the #1 cause of R3F performance collapse. |
| **GSAP** | ✅ Keep | Cinematic camera splines and timeline sequencing. |
| **Framer Motion** | ✅ Keep | Layer 2 / DOM overlays only. Never for 3D. |
| **Rapier** | ⚠️ Scope down | Used for exactly three things: the character controller, the Sky Bridge assembly, and the Gravity Bridge platforms. Everything else is deterministic animation. A full physics world running constantly for a world with no physics gameplay is pure cost. |
| **Howler.js** | ✅ Keep | For 2D audio. 3D audio uses Three's PositionalAudio. |
| **Spline** | ❌ **Cut** | Heavy runtime, opaque output, poor version control, and it duplicates what R3F already does. Author in Blender, export glTF. This removes ~300 KB and an entire class of debugging pain. |
| **WebGL 2** | ✅ Baseline | |
| **WebGPU** | ⚠️ **[V2]**, progressive | Feature-detect and use for the compute-based particle systems only. Never a requirement. Three's WebGPURenderer is still maturing; shipping on it as a baseline is a schedule risk. |
| **Post-processing** | ✅ Keep | `postprocessing` (pmndrs) — bloom, LUT grade, vignette, SSAO (High+ only), and a custom restoration pass. Disabled entirely on Low. |
| **Lenis** | ⚠️ Layer 2 only | Smooth scroll belongs in the Codex, not the world (the world does not scroll). |
| **+ Zustand** | ➕ **Add** | Global game state (save, progress, settings) outside React's render cycle, with transient subscriptions so 3D reads state without re-rendering. |
| **+ Drizzle + Postgres (Neon)** | ➕ **Add** | Tree of Visitors, contact messages, analytics events. |
| **+ Upstash Redis** | ➕ **Add** | Rate limiting for the Guardian and the Tree. |
| **+ `detect-gpu`** | ➕ **Add** | Quality tier auto-detection. |
| **+ Anthropic SDK** | ➕ **Add** | `@anthropic-ai/sdk` for LUMA and moderation. |
| **+ Playwright + Vitest** | ➕ **Add** | E2E for the Codex and critical paths; unit tests for puzzle validators (every `validate()` gets a test — they are pure functions, so this is cheap and it prevents unsolvable-puzzle disasters). |

### Repository structure

```
the-forgotten-mind/
├─ app/                              Next.js App Router
│  ├─ page.tsx                       title screen (server component)
│  ├─ world/page.tsx                 the 3D experience (client, dynamic import)
│  ├─ codex/                         Layer 2 — all static, server-rendered
│  │  ├─ page.tsx
│  │  ├─ [section]/page.tsx
│  │  ├─ projects/[slug]/page.tsx
│  │  └─ tree/page.tsx
│  ├─ share/[hash]/                  OG memory cards
│  ├─ admin/leaves/                  moderation queue (auth: single admin token)
│  ├─ api/
│  │  ├─ guardian/route.ts           streaming Claude proxy
│  │  ├─ leaves/route.ts             POST submit, GET list
│  │  ├─ leaves/[id]/route.ts        DELETE own leaf
│  │  ├─ contact/route.ts            message terminal
│  │  ├─ moderate/route.ts           internal, haiku classifier
│  │  └─ telemetry/route.ts          anonymous events
│  ├─ opengraph-image.tsx
│  ├─ not-found.tsx                  the designed 404
│  ├─ sitemap.ts
│  └─ robots.ts
│
├─ src/
│  ├─ world/
│  │  ├─ Engine.tsx                  Canvas, renderer config, quality tiers
│  │  ├─ Director.ts                 orchestrates area streaming + events
│  │  ├─ areas/                      one directory per area
│  │  │  └─ memory-forest/
│  │  │     ├─ Scene.tsx
│  │  │     ├─ manifest.ts           assets, LODs, bounds, anchors
│  │  │     └─ puzzle.ts
│  │  ├─ systems/
│  │  │  ├─ memory.ts                recovery, restoration math
│  │  │  ├─ restoration.ts           the uRestoration uniform bus
│  │  │  ├─ weather.ts               seeded weather + celestial events
│  │  │  ├─ events.ts                roaming entities, ephemeral geography
│  │  │  ├─ puzzles/                 the framework + 16 implementations
│  │  │  ├─ luma/                    client, fallback tree, stage manager
│  │  │  ├─ save.ts                  schema, migrate, serialise
│  │  │  ├─ audio.ts                 AudioDirector
│  │  │  ├─ camera.ts                CameraDirector
│  │  │  ├─ streaming.ts             chunk load/unload
│  │  │  └─ a11y.ts                  focus ring, spoken labels, SR mode
│  │  ├─ entities/                   Player, Luma, Cat, Spirit, Memory, Fragment…
│  │  ├─ materials/                  shared shaders; all consume uRestoration
│  │  └─ fx/
│  ├─ codex/                         Layer 2 components (pure DOM)
│  ├─ state/                         Zustand stores
│  ├─ content/                       MDX loaders, schema validation (zod)
│  └─ lib/                           seed, hash, lz, analytics, i18n
│
├─ content/
│  ├─ memories/                      100 + 5 MDX files
│  ├─ projects/                      10 MDX files
│  ├─ diary/                         grows forever
│  ├─ luma/persona.md                the system prompt
│  ├─ luma/fallback.json             120 scripted responses
│  ├─ en/ · ar/                      localised strings
│  └─ schema.ts                      zod schemas; build fails on violation
│
├─ public/
│  ├─ models/                        .glb, Draco+KTX2 compressed
│  ├─ textures/                      .ktx2 (Basis)
│  ├─ audio/                         .opus
│  ├─ video/                         project loops, .mp4 + .webm
│  └─ resume.pdf
│
├─ scripts/
│  ├─ optimize-assets.ts             gltf-transform pipeline
│  ├─ generate-og.ts
│  ├─ validate-content.ts            the content lint (whatBroke required, etc.)
│  ├─ luma-eval.ts                   40-question golden-file regression
│  └─ perf-regression.ts             automated 90s flythrough, fails on <55fps
│
├─ tests/                            vitest + playwright
└─ .github/workflows/                CI: lint, types, tests, size, lighthouse, perf
```

### The three critical architectural rules

These three rules are what separate a project that ships at 60 fps from one that does not.

**Rule 1 — React never renders per frame.** All per-frame mutation happens inside `useFrame` on refs. Zustand is subscribed with `subscribeWithSelector` and transient updates (`store.subscribe(sel, cb)`) so 3D code reads state changes without triggering a render. A React re-render during gameplay is a bug.

**Rule 2 — One uniform drives the world.** `uRestoration` is a single shared `THREE.Uniform` injected into every material via `onBeforeCompile`. Changing restoration costs one float write. No scene traversal, no material swapping, no rebuilding.

**Rule 3 — Everything is instanced or batched.** Foliage, rocks, motes, spirits, leaves, crystals: `InstancedMesh` with per-instance attributes. Target: **under 180 draw calls** in the heaviest area (the Village at 100%). Static geometry is merged at build time by the asset pipeline.

### Asset streaming

The world is divided into **chunks** matching areas. `Director` maintains:

- **Resident:** the current area, at full LOD.
- **Warm:** directly adjacent areas, loaded at LOD1, geometry only, textures deferred.
- **Cold:** everything else, unloaded, with only a 2 KB manifest in memory.

Transitions happen while the player walks a connecting corridor (every connection is at least 12 m of walking, specifically to hide the load). If a load is not ready, a 1.5 s "memory settling" visual — an in-fiction shimmer — covers it. This appears at most twice per session in normal conditions.

**Loading order on first visit:**

1. Title screen HTML + fonts: **< 120 KB**, visible in ~600 ms.
2. Engine bundle + Gate chunk: begins immediately on "Enter the world", shows a progress ring rendered as the gate's glyphs igniting.
3. Forest chunk: preloaded during the Gate cinematic — so the player never waits for it.
4. Everything else: on approach.

### Rendering configuration per quality tier

| | Ultra | High | Medium | Low | Minimal |
|---|---|---|---|---|---|
| Target | 4K/60 | 1440p/60 | 1080p/60 | 720p/30 | any/30 |
| Resolution scale | 1.0 | 1.0 | 0.85 | 0.65 | 0.5 |
| Shadows | 4×2048 CSM | 3×1024 CSM | 1×1024 | baked only | baked only |
| Post FX | all + SSAO + volumetrics | bloom, LUT, vignette | bloom, LUT | LUT only | none |
| Particles | 100% | 70% | 40% | 15% | 0% |
| Foliage instances | 100% | 60% | 30% | 10% | 5% |
| Water | full shader | reflections off | flat animated | flat | flat |
| Draw distance | 400 m | 300 m | 180 m | 100 m | 80 m |
| Anisotropy | 16 | 8 | 4 | 1 | 1 |
| Texture resolution | 2K | 2K | 1K | 512 | 512 |
| Antialiasing | TAA | SMAA | FXAA | none | none |

**Auto-detection:** `detect-gpu` on first load picks a starting tier. Then a **live adapter** samples frame time over rolling 3-second windows; two consecutive windows below 50 fps (or 25 on mobile) drop one tier, with a small toast: *"Adjusting to keep the world smooth."* Two windows above 58 fps for 30 seconds offer one tier up. The player can always override manually, and a manual choice disables the adapter.

### Mobile

Mobile is not a port. It is a designed variant.

- **Reduced world:** the Floating Islands and the Sky Bridge use simplified geometry with baked lighting; volumetrics, SSAO, and reflections never activate.
- **Simplified puzzles:** three puzzles (Light Reflection, Gravity Bridge, The Board) get touch-optimised layouts with larger targets and fewer elements. Same solution logic, different variant.
- **Virtual controls:** left-half stick, right-half look, a large contextual interact button, and a persistent Codex button.
- **Battery guard:** frame rate caps at 30, and after 12 minutes a gentle prompt offers the Codex.
- **Below the bar:** devices that fail the minimum benchmark (a 3-second probe render) are offered the Codex directly, framed positively: *"Your device will not do this world justice. Let me show you the Codex instead — it has everything."*

---

## PART 12 — PERFORMANCE BUDGETS

Every number here is a CI gate, not an aspiration.

### Payload budget

| Asset class | Budget (gzip/compressed) | Enforcement |
|---|---:|---|
| Title screen HTML + CSS + fonts | 120 KB | Lighthouse CI |
| Engine JS bundle | 400 KB | `size-limit` |
| Codex JS | 20 KB | `size-limit` |
| First area (Gate + Forest) models | 3.5 MB | manifest check |
| First area textures | 2.5 MB | manifest check |
| Audio (streamed, non-blocking) | 14 MB total | manifest check |
| Per-area average | 2–4 MB | manifest check |
| Full world if fully explored | ≤ 55 MB | manifest check |

### Runtime budget (per frame, desktop High tier)

| Item | Budget |
|---|---:|
| Draw calls | ≤ 180 |
| Triangles rendered | ≤ 900 k |
| Unique materials in scene | ≤ 40 |
| Texture memory | ≤ 400 MB |
| JS heap | ≤ 350 MB |
| Frame time | ≤ 16.6 ms |
| ├ CPU (JS + R3F) | ≤ 5 ms |
| ├ Physics (Rapier) | ≤ 2 ms |
| └ GPU | ≤ 9 ms |
| Garbage generated per frame | **0 bytes** — all per-frame vectors/quaternions are pooled and reused |

### Asset pipeline (`scripts/optimize-assets.ts`)

Runs on every model added. Non-negotiable steps:

1. `gltf-transform dedup` — merge duplicate accessors/materials
2. `gltf-transform prune` — strip unused nodes
3. `gltf-transform weld` + `simplify` — generate LOD0/1/2 at 100/45/18% triangles
4. `gltf-transform draco` — geometry compression
5. `gltf-transform uastc/etc1s` → **KTX2** — GPU-native textures (this alone typically cuts texture memory 6×)
6. `gltf-transform instance` — auto-instance repeated meshes
7. Report: triangles, materials, texture memory, final size — printed and diffed against the previous run in the PR

### Measured checkpoints

The perf regression script drives an automated 90-second flythrough of every area at High tier on a fixed CI machine, records p50/p95/p99 frame time, and **fails the build** if p95 exceeds 18 ms or if any area's draw calls exceed budget. This runs nightly and on every PR touching `src/world/`.

---

## PART 13 — BACKEND, DATA & MODERATION

### Database schema (Postgres via Drizzle)

```sql
-- Tree of Visitors
CREATE TABLE leaves (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message       varchar(180) NOT NULL,
  display_name  varchar(24),
  colour        smallint NOT NULL,              -- 0..7
  symbol        smallint NOT NULL,              -- 0..11
  status        text NOT NULL DEFAULT 'pending',-- pending|approved|rejected
  ip_hash       char(64) NOT NULL,              -- sha256(ip + rotating salt)
  country       char(2),
  delete_token  char(32) NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  approved_at   timestamptz,
  mod_reason    text
);
CREATE INDEX ON leaves (status, created_at DESC);
CREATE INDEX ON leaves (ip_hash, created_at);

-- Contact messages
CREATE TABLE messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        varchar(80),
  reply_to    varchar(160) NOT NULL,
  body        text NOT NULL,
  restoration real,                              -- how far they got — useful context
  ending      text,
  ip_hash     char(64) NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  read_at     timestamptz
);

-- Anonymous telemetry (no PII, no cookies, no cross-site identifiers)
CREATE TABLE events (
  id          bigserial PRIMARY KEY,
  session     char(16) NOT NULL,                 -- random per session, never persisted client-side
  name        text NOT NULL,
  props       jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON events (name, created_at DESC);
```

### API routes, specified

| Route | Method | Auth | Rate limit | Behaviour |
|---|---|---|---|---|
| `/api/guardian` | POST | none | 20/session, 60/IP/hr | Streams a Claude response. Validates the request body with zod. Injects the live-state block server-side (the client never controls the unrecovered list). Returns SSE. |
| `/api/leaves` | POST | none | 3/IP/day, 1/session | Validate → blocklist → classifier → insert. Returns the leaf + delete token. |
| `/api/leaves` | GET | none | 120/IP/hr | Returns approved leaves, cursor-paginated, cached 60 s at the edge. |
| `/api/leaves/[id]` | DELETE | delete token | 10/IP/day | Soft-deletes the caller's own leaf. |
| `/api/contact` | POST | none | 3/IP/day | Insert + email via Resend. Honeypot field + timing check (submissions under 3 s rejected). No CAPTCHA — CAPTCHAs are an accessibility failure and a tone failure. |
| `/api/moderate` | POST | internal secret | — | Haiku classifier. Never reachable from the client. |
| `/api/telemetry` | POST | none | 200/IP/hr | Fire-and-forget event insert. Respects `navigator.doNotTrack` and a settings opt-out. |
| `/admin/leaves` | GET/POST | admin token (env) | — | The moderation queue. Approve, reject, ban IP hash, bulk actions. |

### Moderation UI

A single page. Pending leaves as cards, each with the message, the classifier's verdict and confidence, the IP hash's prior history, and three buttons: **Approve** / **Reject** / **Reject + ban**. Keyboard-driven (`J`/`K` to move, `A`/`R` to act) so a hundred leaves take three minutes. An email digest fires when the queue exceeds 10 pending or every 24 hours, whichever comes first.

---

## PART 14 — SEO, SHARING, ANALYTICS

### The SEO problem, and the solution

A WebGL canvas is invisible to search engines. Layer 2 solves this completely: **the entire portfolio is server-rendered static HTML at `/codex`**, and the world is an enhancement layered on top.

| Concern | Implementation |
|---|---|
| Crawlability | All Codex routes are statically generated at build time. `sitemap.ts` enumerates every project and section. `robots.ts` allows everything except `/admin` and `/api`. |
| Structured data | JSON-LD on every page: `Person` (with `jobTitle`, `knowsAbout`, `sameAs`), `CreativeWork` per project, `BreadcrumbList`, `WebSite` with `SearchAction`. |
| Titles & meta | Per-route, authored, never templated slop. `/codex/projects/[slug]` titles read as `<Project> — <one-line what it does> · <Name>`. |
| Canonical | `/codex/...` is canonical for content. `/world` carries `noindex` (it has no text to index anyway). |
| Core Web Vitals | Measured on `/codex`, which is where they matter. Target: LCP < 1.2 s, CLS 0, INP < 100 ms. |
| Performance | The Codex ships 20 KB of JS. It will outscore 95% of "fast" portfolios. |

### Social sharing

| Surface | Image |
|---|---|
| Site root | An authored OG image: the gate, backlit, with the title |
| `/codex/projects/[slug]` | Generated per project via `next/og` — project name, stack chips, a screenshot |
| `/share/[hash]` | The **Memory Card**: restoration %, ending achieved, playtime, the player's leaf, LUMA's final stage silhouette. Generated on demand, cached. |
| Photo Mode captures | Watermarked with a sigil and the URL |

### Analytics — anonymous, purposeful, minimal

No cookies. No fingerprinting. No third-party scripts. A session ID that exists only in memory and is regenerated per visit. Respects `Do Not Track` and an explicit opt-out in settings.

**Events tracked, and the question each one answers:**

| Event | Question it answers |
|---|---|
| `session_start` (+ device tier, referrer host, locale) | Who is arriving and on what? |
| `path_chosen` (world / codex) | *How many people skip? This is the project's most important number.* |
| `area_entered` | Where do they go? |
| `memory_recovered` | What are they actually reading? |
| `puzzle_started` / `_solved` / `_skipped` / `_hint_used` | **Which puzzle is the wall?** |
| `luma_message` (+ intent classification, never the message text) | What do people ask? What is missing from the Codex? |
| `codex_opened` (+ from where) | When does the world stop being enough? |
| `project_demo_run` | Which project actually gets tried? |
| `session_end` (+ duration, restoration, exit area) | Where do people leave, and how far did they get? |
| `ending_reached` | Completion rate. |
| `leaf_planted` | Emotional conversion. |
| `contact_sent` | **The actual goal.** |

A single `/admin/insights` page charts these. The one chart that matters is a **funnel**: arrived → entered world → 5 minutes → 15 minutes → ending → contact, with the skip-to-Codex path shown alongside as a parallel funnel ending at the same contact node.

---

## PART 15 — SECURITY & ABUSE

| Vector | Mitigation |
|---|---|
| Prompt injection via LUMA | User text delimited and declared as untrusted in the persona; structured output constrains the response shape; `playMemory` and `openCodex` targets validated server-side against the save's recovered list |
| API key exposure | The key never reaches the client. All Anthropic calls go through server route handlers. |
| Cost attack on `/api/guardian` | Per-session and per-IP rate limits in Redis, `max_tokens: 400`, a hard monthly budget alarm, and an automatic circuit-breaker to the fallback tree on breach |
| Abusive Tree submissions | Length + charset validation → blocklist → AI classifier → manual queue for anything under 0.95 confidence. Nothing user-generated is ever visible to others without passing this. |
| Spam via `/api/contact` | Honeypot field, submission-timing check, 3/IP/day, server-side validation |
| XSS from user content | All user content rendered as text nodes, never `dangerouslySetInnerHTML`. Leaf messages are plain-text-only with a strict allowlist charset. A CSP with no `unsafe-inline` (nonce-based). |
| Save tampering | The save is client-side and tampering only affects the tamperer's own experience. No server trust in it. The one exception — the `/share/[hash]` card — signs the payload server-side so fabricated brag cards are not possible. |
| Scraping the Tree for emails | Emails are never stored in leaves and are stripped from message text |
| Admin access | Single admin token in an env var, checked in middleware, with the route excluded from the sitemap and `noindex`. **[V2]** upgrade to a real auth provider if the admin surface grows. |
| Dependency risk | `npm audit` in CI, Dependabot, and a lockfile-only install (`npm ci`) |
| Privacy compliance | `/privacy` page in both languages. No cookies, so no cookie banner — a genuine competitive advantage on tone. IP hashes rotate salt monthly. Leaf deletion honoured within 48 h. |

---

## PART 16 — CONTENT PIPELINE

The developer must be able to update this portfolio in ten minutes, forever. If updating it is a project, it will not be updated, and a stale portfolio is worse than a plain one.

### Adding a project

1. Create `content/projects/<slug>.mdx` with the required front-matter (Part 6).
2. Add two memory files: `content/memories/project-NNa.mdx` and `-NNb.mdx`, with `projectRef: <slug>`.
3. Drop a 12-second silent loop at `public/video/<slug>.mp4` and an architecture SVG.
4. `npm run validate:content` — fails loudly if `whatBroke`, `whatILearned`, `narratorLine`, or `codexOrder` is missing.
5. Commit. The build assigns the next free workstation in the Studio, regenerates the memory total (the restoration denominator is `count(content/memories/*)`, not a hardcoded 100), regenerates the Codex, the sitemap, and the OG images.

**Nothing in `src/` is touched.** That is the whole design goal of the content layer.

### Adding a diary entry

Drop an `.mdx` file in `content/diary/`. That is the entire process. It appears in the Hidden Basement and at `/codex/diary` on the next deploy, and it triggers the "what's new" card for returning visitors.

### Updating the Guardian's knowledge

The Guardian's corpus is **generated at build time** by concatenating all content MDX bodies with their front-matter into `content/luma/corpus.generated.md`. Updating a project automatically updates what LUMA knows about it. There is no separate knowledge base to keep in sync — which is exactly why the Guardian will not drift out of date.

After any content change, `npm run eval:luma` runs 40 fixed questions against the new corpus and diffs the answers against a golden file. Semantic drift is fine; factual drift fails the build.

### Content lint rules (enforced in CI)

| Rule | Reason |
|---|---|
| Every project has `whatBroke` and `whatILearned` | Credibility |
| Every memory has `narratorLine` ≤ 25 words | Pacing |
| Every memory body is 100–300 words | Readability |
| Every memory has a valid `area` and `anchor` that exist in a scene manifest | Prevents unreachable content |
| Every `codexOrder` is unique | Deterministic Codex |
| Every skill has an honest `proficiency` and `yearsUsed` | No 100%-at-everything skill bars |
| Every English file has an Arabic counterpart | Localisation completeness |
| No memory is behind more than one puzzle | The anti-frustration guarantee |
| The graph is fully traversable from the Gate | An automated BFS over the area graph + gates; fails if any memory is unreachable |

That last rule is the most valuable line of CI in the project: it makes it structurally impossible to ship a soft-lock.

---

## PART 17 — PRODUCTION ROADMAP

Six phases. Each ends with something demonstrable, and each phase's exit criteria are testable.

### Phase 0 — Foundation (3 weeks)

Repo, CI, TypeScript strict, Next.js scaffolding, the asset pipeline, the quality-tier system, a grey-box character controller walking around an empty plane at 60 fps with the perf HUD running.

Plus, per [STANDARDS Appendix C](STANDARDS.md#appendix-c--changes-this-charter-forces-into-the-gdd) — these are built **first** because each one is architectural and becomes a rewrite if deferred:

- **The token pipeline**: `tokens.json` → Style Dictionary → CSS custom properties + TypeScript + **GLSL constants**, so shaders and stylesheets share one palette and the two layers cannot drift apart.
- **Storybook** with the a11y addon, and the component state matrix as its contract.
- **The `/debug` world inspector**: restoration scrubbing, weather forcing, area teleport, memory grant/revoke, puzzle override, seed override, and a draw-call/triangle/memory HUD. This makes a 19-area world testable in minutes and pays for itself by Phase 2.
- **Four CI gates**: the React-commit-count gate (zero commits during a 10-second gameplay capture), the memory-leak test, the token lint (no Global tokens in components, no arbitrary pixel values), and the offset-pagination ban.

**Exit:** the perf regression script runs green on an empty scene. The pipeline compresses a test model and reports its budget. All four CI gates are live and failing correctly against a deliberately broken branch.

### Phase 1 — The Vertical Slice (5 weeks)

**Gate → Forest → Village.** Three areas, fully art-passed. Two puzzles (Cursor Ritual, Light Echo). LUMA at stages 1–2 with the scripted fallback only (no AI yet). The memory system. The restoration uniform driving the Forest and the Village. Save/load. The Codex, complete, with all content structure in place.

Preceded by **grey-box wireframes for all 19 areas** — walkable blockouts with paths, sightlines, and anchor positions, playable before any art exists. Pacing problems surface in week 4 instead of week 20.

Two items are **Phase-1 blockers, not polish**, because retrofitting either after 19 areas exist is a rewrite:

- **`webglcontextlost` / `webglcontextrestored` handling.** Browsers drop the GL context on tab-switch, GPU pressure, or driver hiccups; the default outcome is a permanently frozen black canvas that a visitor reads as "this site is broken." The handler calls `preventDefault()`, shows an in-fiction line, and rebuilds the scene from the save.
- **The `DisposalRegistry`.** Three.js does not garbage-collect GPU resources; every geometry, material, and texture is registered by chunk and asserted clean on unload. This is the single most common Three.js production leak.

RUM (`web-vitals` → `/api/telemetry`) starts reporting here, so there is a baseline to regress against for the remaining five phases.

**Plus the Overture** ([Part 8](#the-overture--screen-00)) — 2 days to build, 1 day of copy. Its 14-second video loop is captured from the Forest **at the end of this phase**, once there is a world to film, and graded in 1–2 days. Total +4–5 days.

**Exit:** a stranger can play for eight minutes, recover six memories, watch the Forest visibly heal, press `Tab` and read a real portfolio. **This is the phase that proves the whole concept.** If the vertical slice is not moving, nothing later will fix it. A second exit criterion belongs to the Overture: a recruiter who never clicks past it must still be able to name three projects and find the email.

### Phase 2 — The Core Loop (6 weeks)

Childhood Home, Learning Workshop, Innovation Laboratory, Developer Studio, Knowledge Library, Experience Archive. Their six puzzles. All 100 memories authored and placed. All 10 projects live in the Studio with working demos. The Guardian's AI integration, corpus generation, rate limiting, and eval harness. Weather. The dynamic-event seed system.
**Exit:** the required path from Gate to the Studio is playable end to end, all portfolio content is in the world *and* the Codex, and LUMA answers 40 golden questions correctly.

### Phase 3 — The Ascent (5 weeks)

Crystal Lake, Underground Cave, Ancient Temple, Floating Islands, Dream Observatory, Achievement Hall, Sky Bridge, Contact Tower. Their eight puzzles. All 8 Fragments. All five endings. Achievements. The Fracture Records.
**Exit:** the game is completable. All five endings reachable and tested. Full playthrough under 140 minutes.

### Phase 4 — The Living World (4 weeks)

Hidden Basement, Secret Sanctuary, the Tree of Visitors (submission, cursor-based pagination, moderation, rendering, admin), all 20 hidden-content items, the arcade, the terminal, the cat, Photo Mode, share cards, seasonal system, weekly challenges, the diary feed, Arabic localisation with full RTL, the full accessibility pass, the mobile variant.

Plus **the offline layer**: the Workbox service worker with its four caching strategies, Background Sync for queued leaf submissions, and the offline indicator. This lands here rather than at launch because it must be tested against the complete asset set, and because a portfolio that works on a plane is a genuine differentiator worth verifying properly.

**Exit:** every item in Part 5.10 is implemented and reachable. The a11y audit passes against the split targets in [STANDARDS 7.9](STANDARDS.md#7--design-systems--governance) — AAA on the Codex, AA+ in the world — and `/accessibility` publishes exactly what is and is not met. Arabic is complete. The entire Codex and any visited area load with the network disabled.

### Phase 5 — Polish & Launch (3 weeks)

Audio implementation and mix. Narrator VO recording and integration. Performance optimisation to budget. Playtesting with **eight real people across the four visitor archetypes** — including, critically, at least two actual recruiters timed on the 90-second task. Bug fixing. Analytics verification. Launch.
**Exit:** every budget in Part 12 is met. Two recruiters found the stack, two projects, and the contact email in under 90 seconds without assistance.

**Total: 27 weeks (≈ 6.2 months) at full-time pace.**

*(24 weeks of feature work + 2 weeks absorbed by the standards charter — see [STANDARDS Appendix C](STANDARDS.md#appendix-c--changes-this-charter-forces-into-the-gdd) — + 1 week for the Overture and its video capture.)*

### Scope reduction ladder

If time compresses, cut in this exact order. Every cut below preserves a complete, coherent experience. Deltas are measured against the 26-week total.

**Not on this ladder, at any scope:** the Phase-0 token pipeline, the four CI gates, `webglcontextlost` handling, and the `DisposalRegistry`. Each is an architectural decision that becomes a rewrite if postponed, so cutting them borrows a week now against a month later.

| Cut # | What goes | Saved | What is lost |
|---:|---|---:|---|
| 1 | Arabic localisation → **[V2]** | −2 wk | Reach |
| 2 | Achievement Hall, Underground Cave (12 memories redistributed) | −2 wk | Optional content |
| 3 | Floating Islands + Dream Observatory merged into one aerial area | −2 wk | One puzzle, spectacle |
| 4 | Weather reduced to 4 states; celestial events → **[V2]** | −1 wk | Replay variety |
| 5 | Retro arcade, chess puzzle, duck debug → **[V2]** | −1 wk | Delight |
| 6 | The Tree of Visitors → **[V2]** (post-launch, high impact, low risk) | −2 wk | The legacy hook |
| 7 | Mobile 3D → mobile serves the Codex only, framed positively | −2 wk | Mobile immersion |
| | **Absolute minimum viable** | **15 weeks** | Overture, Gate, Forest, Village, 4 buildings, Temple, Tower · 60 memories · 8 puzzles · LUMA · full Codex · one ending — with the standards foundation intact |

**The Overture is not on this ladder either.** It is the cheapest week in the whole plan and the only one that pays out to a visitor who never enters the world. If schedule pressure hits, cut its *video* (the canvas fallback is already built and looks intentional) before cutting the screen.

**What must never be cut, at any scope:** the Codex, the skip path, the Guardian's fallback tree, keyboard completability, the save system, and the contact form. These are the project's spine.

---

## PART 18 — RISK REGISTER

| # | Risk | Likelihood | Impact | Mitigation |
|---:|---|---|---|---|
| 1 | **Scope collapse** — the concept is 3–5× a normal portfolio | High | Fatal | The scope ladder above, with pre-agreed cut order. Phase gates with hard exit criteria. The vertical slice at week 6 is a go/no-go. |
| 2 | **Recruiters bounce** — the game costs the developer jobs | Medium | Fatal | The entire two-layer architecture. Measured with the `path_chosen` event and validated by timed recruiter tests in Phase 5. |
| 3 | **Performance** — beautiful at 22 fps is worthless | High | Severe | Budgets as CI gates from Phase 0. The quality-tier system and live adapter. The perf regression script. |
| 4 | **LUMA hallucinates a fake job** | Medium | Severe | Corpus-only prompting, the nightly eval, structured output, and the fallback tree. Publicly, LUMA's own words: *"I only remember what he wrote down."* |
| 5 | **AI cost blowout** | Low | Moderate | Rate limits, prompt caching, token caps, budget alarm, circuit breaker. Projected $5–9/mo against a $40 ceiling. |
| 6 | **A puzzle is a wall** — players quit at the Light Reflection | High | Moderate | Three-rung hints, universal skip after 3 min, `puzzle_skipped` telemetry, and post-launch tuning. Any puzzle with a skip rate above 40% gets redesigned. |
| 7 | **Asset production time** — 19 areas of 3D art | High | Severe | Modular kits and trim sheets. Heavy asset reuse with material variation. Silhouette-first review gate. Buy a base kit rather than modelling every rock. |
| 8 | **The content is never finished** — 100 memories is a book | High | Severe | Write content in Phase 1, before the areas exist. Content is the long pole and it does not need a renderer. |
| 9 | **Abuse on the Tree** | Medium | Moderate | The full moderation pipeline. Nothing is public without passing it. |
| 10 | **Browser/GPU compatibility** | Medium | Moderate | WebGL2 baseline, no WebGPU requirement, tested on Safari/iOS explicitly (it is the most fragile target), and the Codex as a universal floor. |
| 11 | **The developer stops updating it** | High | Moderate | The ten-minute content pipeline and the diary as the lowest-friction update path. If updating costs more than a tweet, it will stop. |
| 12 | **Accessibility failure** at launch | Medium | Severe | a11y as a Phase-4 exit criterion, axe-core in CI, and a manual screen-reader pass. The Codex guarantees a floor. |
| 13 | **Motion sickness complaints** | Medium | Moderate | Reduced Motion auto-detected and honoured comprehensively; camera bob off by default on first load until the player opts in. |
| 14 | **It looks like an AI-generated portfolio** | Medium | Severe | Specific art direction (Part 9), the developer's real voice as narrator, real failures in the content, hand-authored puzzles, and a house style that is deliberately not the default cream-and-serif look. |

---

## PART 19 — SUCCESS METRICS

Vanity metrics are excluded on purpose. These are the numbers that mean the project worked.

### Primary (the project's actual job)

| Metric | Target |
|---|---:|
| **Contact messages per 1,000 visitors** | ≥ 8 |
| **Recruiter 90-second task success** (finds stack + 2 projects + email, unaided) | ≥ 90% |
| Interview conversations that reference the site unprompted | ≥ 50% |

### Engagement

| Metric | Target |
|---|---:|
| Median session duration | ≥ 6 min |
| Reach 5 minutes in the world | ≥ 40% of world-enterers |
| Reach an ending | ≥ 12% of world-enterers |
| Return visits within 30 days | ≥ 18% |
| Leaves planted per 100 ending-reachers | ≥ 45 |
| Project demo actually run | ≥ 30% of Studio visitors |

### Quality

| Metric | Target |
|---|---:|
| p95 frame time, High tier | ≤ 18 ms |
| Lighthouse Performance on `/codex` | ≥ 98 |
| Lighthouse Accessibility on `/codex` | 100 |
| Time to first interaction (mid-tier laptop) | ≤ 2.5 s |
| Any single puzzle's skip rate | ≤ 40% |
| LUMA fallback-tree activation rate | ≤ 3% of messages |
| Monthly infrastructure + AI cost | ≤ $40 |

### Core Web Vitals & UX KPIs

Tracked by RUM from Phase 1 onward, segmented by device tier, connection type, and locale — a p75 that averages a gaming desktop with a mid-range Android is not actionable. See [STANDARDS 9.6–9.7](STANDARDS.md#9--analytics-handoff--telemetry).

| Metric | `/codex` | World | Note |
|---|---:|---:|---|
| **LCP** | ≤ 1.2 s | ≤ 2.0 s | Title screen for the world figure |
| **TBT** | ≤ 150 ms | ≤ 400 ms | WebGL init is inherently blocking; the honest target is bounded, not zero |
| **INP** | ≤ 100 ms | ≤ 100 ms | |
| **CLS** | **0.00** | **0.00** | Not "< 0.1" — zero. Metrics-matched font fallbacks and reserved boxes make it achievable |
| **FCP** | ≤ 0.9 s | ≤ 0.9 s | |
| **Time to first portfolio fact** | ≤ 15 s | ≤ 15 s | Across every entry path, including the world |
| **Task Completion Rate** (90-second recruiter task) | ≥ 90% | | Measured in moderated Phase-5 testing with real recruiters — not inferred from analytics |
| **CSAT** | ≥ 85% positive | | One optional tap on the ending screen: *"Was this worth your time?"* 👍/👎. No form, no email. |

### Recognition (secondary, not steering)

Awwwards Site of the Day submission in month 1. CSS Design Awards, FWA. These follow from the numbers above; they are not a substitute for them.

---

## APPENDIX A — FULL NARRATOR SCRIPT

### A.1 — Intro cinematic (the concept's text, with timing and staging)

| # | Line | Timing | Staging |
|---:|---|---|---|
| — | *(silence)* | 0.0–4.0 s | Black. Only the cursor's light. Wind. Distant heartbeat at 48 bpm. |
| 1 | "Hello…" | 4.5 s | Dust motes catch the cursor light for the first time. |
| 2 | "If these words reached you…" | 8.0 s | The heartbeat gains a second layer. |
| 3 | "…it means someone finally found this place." | 12.0 s | A faint outline resolves in the far distance. |
| 4 | "I have very little time." | 17.0 s | The heartbeat quickens fractionally. |
| 5 | "My memories are disappearing." | 21.0 s | Motes begin drifting *away* from the cursor. |
| 6 | "My world is collapsing." | 25.0 s | A low structural groan. Something distant falls. |
| 7 | "If you wish to know who I truly was…" | 30.0 s | The gate's silhouette becomes fully visible. |
| 8 | "…restore what has been forgotten." | 35.0 s | The first glyph on the gate ignites on its own — the tutorial's demonstration. |
| — | *(player acts — the Cursor Ritual)* | 38 s → | Player lights the remaining 6 glyphs. No time pressure. |
| — | *(gate opens)* | on solve | Gears grind. 6-second open. Camera pushes through. Music stem 1 enters. |

### A.2 — LUMA stage-transition lines

| Stage | Line |
|---|---|
| 1 → 2 | "Oh. That is… that is *better.* I can hold a sentence now. Thank you." |
| 2 → 3 | "Something just came back to me. Not a memory — a *preference.* I think I find you funny." |
| 3 → 4 | "I remember why he made me. He did not want you to walk this alone. …He was right about that." |
| 4 → 5 | "I am nearly whole. Which means I am nearly done. I would like you to know I am not sad about that." |

### A.3 — Ending 5 (the Perfect Ending)

| # | Line | Staging |
|---:|---|---|
| 1 | "You did not simply remember me." | Camera rises above the fully healed world at golden hour. |
| 2 | "You rebuilt me." | Every area visible below, every light on, the fountain at full flow. |
| 3 | "My world exists once again." | LUMA rises into frame at stage 5 and, for three seconds, holds a human silhouette. |
| 4 | *(LUMA speaks, not the narrator)* "Worlds are not remembered because they are perfect." | The silhouette dissolves back into light. |
| 5 | "They are remembered because someone cared enough to leave a part of themselves behind." | The portal opens. |
| 6 | "You came here searching for a developer…" | The player walks toward it, unforced. |
| 7 | "…but you became part of this story." | Fade to gold, not to black. |
| 8 | *(after the Tree)* "Thank you. You were never a visitor." | Credits, over a slow pan of the Tree with the player's new leaf lit. |

---

## APPENDIX B — THE 100 MEMORIES (allocation table)

**By category**

| ID range | Category | Count | Distribution | Codex section |
|---|---|---:|---|---|
| `bio-01` … `bio-12` | Biography | 12 | Gate 1, Forest 2, Village 2, Home 4, Achievement Hall 2, Tower 1 | About |
| `skill-01` … `skill-24` | Skills | 24 | Workshop 8, Lab 8, Lake 8 | Skills |
| `project-01a/b` … `project-10a/b` | Projects | 20 | Developer Studio 20 | Projects |
| `exp-01` … `exp-08` | Experience | 8 | Archive 8 (3 of them sealed = the Fracture Records) | Experience |
| `edu-01` … `edu-05` | Education | 5 | Home 1, Library 4 | Education |
| `cert-01` … `cert-06` | Certificates | 6 | Library mezzanine 6 | Certificates |
| `dream-01` … `dream-06` | Dreams | 6 | Islands 3, Observatory 3 | Ambitions |
| `philosophy-01` … `philosophy-06` | Philosophy | 6 | Cave 3, Temple 3 | Philosophy |
| `story-01` … `story-08` | Personal stories | 8 | Forest 1, Village 2, Home 2, Cave 1, Temple 1, Bridge 1 | Stories |
| `lesson-01` … `lesson-05` | Lessons | 5 | Forest 2, Village 2, Cave 1 | Lessons |
| **Total** | | **100** | | |
| `hidden-01` … `hidden-05` | Secret | **+5** | Basement 3, Lab void room 1, falling-star site 1 | *revealed on discovery* |

**By area** — cross-check; this column must always sum to 100.

| Area | Count | | Area | Count |
|---|---:|---|---|---:|
| The Gate | 1 | | Experience Archive | 8 |
| Memory Forest | 5 | | Crystal Lake | 8 |
| Forgotten Village | 6 | | Underground Cave | 5 |
| Childhood Home | 7 | | Ancient Temple | 4 |
| Learning Workshop | 8 | | Floating Islands | 3 |
| Innovation Laboratory | 8 | | Dream Observatory | 3 |
| Developer Studio | 20 | | Achievement Hall | 2 |
| Knowledge Library | 10 | | Sky Bridge | 1 |
| | | | Contact Tower | 1 |
| | | | **Total** | **100** |

*The build script is the source of truth: the restoration denominator is `count(content/memories/*.mdx)`, and `validate:content` fails the build if the two tables above disagree with the files on disk. Rebalancing the allocation later requires no code change.*

---

## APPENDIX C — DYNAMIC EVENT TABLE (quick reference)

| Event | Trigger | Probability | Scope | Persists |
|---|---|---:|---|---|
| Clear / Overcast / Rain / Storm / Fog / Snow / Sunrise / Night | Session seed | see 5.3 | Global | Session |
| Weather shift | 20 min elapsed | 35% | Global | Session |
| Meteor shower | Night + seed | 6% | Sky | Session |
| Aurora | Night + ≥50% + seed | 5% | Sky | Session |
| Solar eclipse | Day + seed | 2% | Global, 60 s | One-shot |
| Falling star | Night + seed | 10% | One area | Until collected |
| Traveling merchant | Seed | 25% | Village | Session |
| Lost spirit | Seed | 40% | 1 of 6 spots | 60 s |
| Sky whale | Seed | 12% | Islands | 90 s loop |
| Glitch anomaly | Seed | 16% | Laboratory | Until touched |
| Temporary cave | Storm + seed | 33% | Near Village | Session |
| Moving bridge | Fog | 100% during fog | Islands | Session |
| Temple secret door | Eclipse only | 100% during eclipse | Temple | 60 s |
| Hidden portal | Seed | 8% | Random | Session |
| Daily secret artifact | Daily seed | 100% | Rotating area | 24 h |
| Weekly challenge | Weekly seed | 100% | Village noticeboard | 7 days |
| Seasonal dressing | Calendar date | 100% | Global | Season |
| Anniversary | Launch date | 100% | Global | 24 h |
| Community milestone | Leaf count thresholds | — | Sanctuary | Permanent |

---

## APPENDIX D — NAMING CONVENTIONS

| Kind | Convention | Example |
|---|---|---|
| Area ID | `kebab-case` | `memory-forest` |
| Memory ID | `category-NN` | `skill-14`, `project-03b` |
| Fragment ID | `fragment-<roman>` | `fragment-vi` |
| Puzzle ID | `kebab-case` verb-noun | `light-reflection` |
| Achievement ID | `camelCase` | `bugHunter` |
| Save flag | `camelCase` | `hasCat`, `jokesFound` |
| Entity component | `PascalCase` | `MemoryAnchor`, `LumaCompanion` |
| Shader uniform | `u` + `PascalCase` | `uRestoration`, `uSeasonBlend` |
| Telemetry event | `snake_case` | `puzzle_skipped` |
| Content file | `<id>.mdx` in the matching directory | `content/memories/skill-14.mdx` |
| Audio asset | `<category>/<id>.opus` | `vo/project-04a.opus` |
| CSS custom property | `--tfm-*` | `--tfm-parchment` |

---

## APPENDIX E — DEFINITION OF DONE

A feature is done when **all** of the following are true. This checklist is the PR template.

- [ ] Works with keyboard only, with a visible focus indicator
- [ ] Works with a screen reader, or has a documented Codex equivalent
- [ ] Honours Reduced Motion
- [ ] Honours the current quality tier (degrades, never breaks)
- [ ] Localised in both English and Arabic
- [ ] State persists correctly across save/load, including mid-action
- [ ] Emits its telemetry event
- [ ] Adds zero per-frame allocations
- [ ] Stays inside the area's draw-call and triangle budget
- [ ] Has a unit test if it contains a pure function (all puzzle validators do)
- [ ] Content passes `validate:content`
- [ ] LUMA can talk about it correctly (in the corpus, passes the eval)
- [ ] Has a fallback for API/asset failure
- [ ] Reviewed against the four design pillars

**Plus the fourteen engineering rows in [STANDARDS Appendix B](STANDARDS.md#appendix-b--definition-of-done-additions)** — component states, RTL, torture stories, zero CLS, compositor-only animation, teardown of every listener and GPU resource, no layout reads in per-frame paths, 44 px targets, semantic tokens only, Zod contracts, authored empty/error/offline states, and cursor-based pagination. Together these two lists are the PR template.

---

## CLOSING NOTE

The original concept's design goal was that a visitor should close the browser saying *"I finished an unforgettable adventure"* rather than *"I saw a portfolio."*

This document adds one sentence to that goal:

> **And the visitor who only had ninety seconds should close the browser saying "I want to talk to this person."**

Both are achievable. They require the same content, the same craft, and one architectural decision — made in [Part 0](#part-0--the-one-structural-decision) — to serve them simultaneously rather than choosing between them.

Build the vertical slice first. Everything else follows from whether that eight minutes works.


