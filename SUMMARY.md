# DESCEND — Project Summary

---

## Project Overview

**DESCEND** is a terminal-style interactive fiction game built on Next.js. The player inhabits Neo from The Matrix, making choices that diverge from the source material. The design philosophy:

> *"This is not a game about winning. It is a game about realizing too late that you chose wrong."*

Every node, every choice leads somewhere. Denial paths reroute with narrative logic. Alternate timelines (blue pill, late awakening, limbo) carry equal emotional weight to the canonical escape. The game has no wrong answers — only consequences.

**Current state:** 149 nodes, 3 endings (escape / captured / limbo), 7 distinct terminal states, full red pill and blue pill arcs, AI-powered free text input, ambient procedural audio, Supabase backend with local JSON fallback.

---

## Engineering Details

### Stack
- **Framework:** Next.js 16.2.2 (App Router, Turbopack)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4 (`@theme` inline — no config file)
- **State:** Zustand 5
- **Animation:** Framer Motion 12
- **Audio:** Web Audio API (procedural — no audio files)
- **Backend:** Supabase (JSONB node storage, 60s cache, local fallback)
- **AI routing:** Anthropic SDK (`claude-haiku-4-5`) via `/api/narrative`
- **Font:** JetBrains Mono (Google Fonts, weights 400/700)

### Project Structure
```
src/
├── app/
│   ├── page.tsx              # Boot screen / start
│   ├── game/page.tsx         # Game wrapper
│   ├── ending/page.tsx       # Three ending screens
│   ├── api/narrative/route.ts # AI text routing endpoint
│   └── globals.css           # Tailwind v4 @theme + keyframes
├── components/
│   ├── Terminal.tsx          # Main game shell
│   ├── TypewriterText.tsx    # Character-by-character renderer
│   ├── ChoiceList.tsx        # Keyboard + click choice UI
│   ├── GlitchOverlay.tsx     # 4-level glitch system
│   ├── AmbientAudio.tsx      # Procedural drone + noise
│   └── FreeTextInput.tsx     # AI-routed free text input
├── engine/
│   ├── narrativeEngine.ts    # resolveNode, applyEffects, filterChoices
│   └── conditionEvaluator.ts # belief >= 2, flags.x >= 1, etc.
├── store/
│   └── gameStore.ts          # Zustand store, makeChoice, immutable state
├── lib/
│   ├── supabase.ts           # Client wrapper (null if env vars missing)
│   └── nodeRepository.ts     # getNodes (async), getNodesSync (fallback)
├── types/
│   └── game.ts               # GameNode, Choice, GameState, Effects types
└── data/
    └── matrix/
        └── nodes.json        # 149 nodes, full Matrix arc
```

### Game State
```typescript
GameState {
  timeElapsed: number      // accumulates via node effects
  dangerLevel: number      // 0–10, affects ambient audio volume
  belief: number           // 0–5, gates conditional choices
  location: string
  flags: Record<string, boolean | number>  // arbitrary per-arc flags
  loopCount: number
}
```

### Key Flags Used
| Flag | Set by | Unlocks |
|---|---|---|
| `trainingFast` | training_fast arc | `the_dodge` choice in agent_smith |
| `trainingSlow` | training_slow arc | `the_calculation` choice in agent_smith |
| `physicsGap` | training_slow_replay | `lobby_ghost_route` (no-combat path) |
| `cypherSuspect` | cypher_watch | warn Trinity, affects rescue weight |
| `bulkheadNumber` | awakening_retreat_dark | subtle lore callback |
| `loopCount` | loop_01 | unlocks escape from loop_03 |

### Node Format
```json
{
  "id": "unique_snake_case_id",
  "text": ["line one", "line two"],
  "choices": [
    {
      "id": "c1",
      "label": "Choice shown to player",
      "next": "next_node_id",
      "condition": "belief >= 2",
      "effect": { "belief": 1 }
    }
  ],
  "effects": { "time": 10, "danger": 2, "belief": 1 },
  "glitch": "none | subtle | intense | extreme",
  "ending": "escape | captured | limbo",
  "inputType": "choices | text | mixed",
  "textPrompt": "What do you do?"
}
```

### AI Text Routing
Nodes with `inputType: "text"` or `"mixed"` show a terminal `>` prompt. Player types freely. POST to `/api/narrative` with node context + game state → Claude Haiku classifies intent → returns `choiceId` + optional atmospheric bridge sentence. Falls back to first choice on any error.

Requires `ANTHROPIC_API_KEY` in `.env.local`.

### Audio
Procedural Web Audio API. Five oscillator layers (110Hz, 220Hz, 330Hz, 440Hz, 660Hz — A minor pentatonic) plus pink-filtered bandpass noise (center 1200Hz). Master gain 0.35, scales with dangerLevel up to +0.25. Mute toggle fixed bottom-right. `unlockAudio()` called on start button click to satisfy browser autoplay policy.

### Backend (Supabase)
Schema in `supabase/schema.sql`. Tables: `stories`, `nodes` (JSONB `data` column). RLS: public SELECT. Cache: 60s TTL per storyId. Game runs fully offline on bundled JSON if env vars missing.

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```

---

## Story Arcs

### Node Count by Arc
| Arc | Nodes | Status |
|---|---|---|
| Intro (apartment → offer) | 10 | Complete |
| Blue pill arc | 18 | Complete |
| Awakening (unplugging → construct) | 16 | Complete |
| Training Fast | 11 | Complete |
| Training Slow | 9 | Complete |
| Oracle visit | 17 | Complete |
| Cypher pre-arc | 9 | Complete |
| Lobby assault | 11 | Complete |
| Smith encounter + expansion | 13 | Complete |
| The One Moment (secret path) | 7 | Complete |
| Death / resurrection | 3 | Complete |
| Loop system | 4 | Complete |
| Terminal endings | 7 | Complete |

**Total: 149 nodes**

---

### Arc 1: The Intro
`init → apartment_night → the_message → doorbell → the_club → the_offer`

Neo at 2:13 AM. The message. The white rabbit tattoo. The club. Morpheus with two pills. Every refusal loops back. The loop escalates (loop_01 → loop_03 → loop_04 → ending_limbo) with increasing glitch intensity until the player either takes a pill or accepts limbo.

**Fork:** Red pill → Awakening Arc. Blue pill → Blue Pill Arc.

---

### Arc 2: Blue Pill Arc
`blue_wakeup → [many branches] → ending_blue_pill_deep / dream_denial / revelation_suppression / blue_late_awakening`

Neo takes the blue pill and lives with it. Multiple branch points over five years:
- **blue_wakeup_linger** → early search (finds Morpheus court docs)
- **back_to_work** → deep_work_months (finds undocumented server process) → server_room_obsession
- **meeting_trinity_again** → follow her or stay
- **the_dream** → run the code / delete it / show Claire
- **the_revelation** (free text node) → contact Trinity / wait / destroy everything
- **too_late_choice** → send the message or don't

The late awakening path (`blue_late_awakening → the_unplugging_late`) delivers the game's most emotionally heavy escape: Trinity is older, Morpheus is dead, the door is almost closed.

**Endings reachable:** escape (late), limbo (several variants)

---

### Arc 3: Awakening
`the_unplugging → awakening_eyes_open → [8 nodes] → the_construct`

Neo's first hours in his real body. Never used these muscles. The light burns. The goop. Tank explains the pods. The mirror — "the structure beneath the performance." Free text moment. One question before the construct.

The game's best writing. Do not touch it.

**Key nodes:** `awakening_the_mirror` (primary shattering moment), `awakening_eat_goop` (26 years first lands)

---

### Arc 4: Training Fast
`training_fast → training_fast_spar_01 → [5 nodes] → oracle_arrival`

Neo loads everything at speed. Loses the first sparring match badly. Builds overconfidence. Sees code bleed through a door glitch. Sets `flags.trainingFast = 1`.

**Unlocks:** `the_dodge` choice in agent_smith confrontation.

---

### Arc 5: Training Slow
`training_slow → training_slow_spar_01 → [5 nodes] → oracle_arrival`

Neo wins first sparring match by timing, not strength. Discovers the 40ms physics gap. Refuses weapons download and wins the argument with Morpheus. Sees the horizon perspective error. Sets `flags.trainingSlow = 1`, `flags.physicsGap = 1`.

**Unlocks:** `the_calculation` (physics gap fight), `lobby_ghost_route` (no-combat path), secret path to `the_one_moment` (belief >= 4).

---

### Arc 6: Oracle Visit
`oracle_arrival → [7 nodes] → cypher_unease_ship`

Neo logs the neighbourhood (too clean, wrong proportions). Waiting room — the spoon boy. Kitchen — the Oracle looks at him, not his face. The vase. Causality conversation. "Twenty-six years of being caused." Morpheus's belief declared. Neo's motivation for the rescue locked in.

**Key mechanic:** Spoon-bending gated on `belief >= 2`. Free text node (`oracle_the_gift`) — Oracle asks what Neo thinks he is.

---

### Arc 7: Cypher Pre-Arc
`cypher_unease_ship → cypher_watch → cypher_find_trinity → cypher_warn_trinity → cypher_jackIn_moment → morpheus_captured`

The game's original addition. Neo can detect Cypher's betrayal before it lands: the already-clean gun, the hand tremor, the smell of steak. Warning Trinity propagates `flags.trinityWarned` into the rescue. The betrayal arrives with different weight depending on what the player knew.

---

### Arc 8: Lobby Assault
`the_rescue → lobby_entrance → [quiet / loud / ghost paths] → agent_smith`

Three approaches: quiet (one by one), loud (alarms), ghost (physicsGap players route around guards entirely with no combat). Neo's interiority restored throughout — he's the pattern-reading observer, not a generic action hero. The lobby nodes acknowledge he was Thomas Anderson three weeks ago.

---

### Arc 9: Smith Encounter
`agent_smith → [5 choices] → various`

Conditional choices based on accumulated state:
- `belief >= 2` → `neo_defiance` (death/resurrection path)
- `flags.trainingSlow` → `the_calculation` (physics gap — wins the fight)
- `flags.trainingFast` → `the_dodge` (overconfident — gets hit, recovers)
- Default → `smith_grip_wrong` (expanded Smith encounter arc)
- Run → `smith_grip_wrong`

---

### Arc 10: Death / Resurrection
`neo_defiance → neo_death → neo_resurrection`

Only reached via "My name is Neo" choice (belief >= 2). Smith hits Neo anyway. Neo is killed. The dark. Twenty-six years acknowledged. Trinity's declaration. The heartbeat. Standing up. The bullets stopping. The 26 years surfacing in the moment of transcendence. Ends with its own escape variant.

---

### Arc 11: The One Moment (Secret Path)
`smith_study_crack → the_one_moment → [3 endings]`

Requires `belief >= 4` AND `flags.trainingSlow >= 1`. Neo stops running. Turns around. Sees the code in his own skin. Bullets stop without reaching out. Three variants based on final choice: "It's over" / walk past / look him in the eye. The most powerful escape in the game.

---

### Arc 12: Loop System
`loop_01 → apartment_night → [escalating] → loop_03 → loop_04 → ending_limbo`

Every refusal loops. Glitch intensity escalates: subtle → intense → extreme. `loop_03` offers an escape hatch if `loopCount >= 1`. `loop_04` removes the exit. `ending_limbo` — "The door does not come twice."

---

## Terminal Endings

| Ending | Node | How reached |
|---|---|---|
| Escape (canonical) | `ending_escape` | Answer the phone / the_dodge high belief |
| Escape (resurrection) | `neo_resurrection` | "My name is Neo" → death → Trinity |
| Escape (The One) | `the_one_its_over` etc. | Secret path, belief >= 4 + slow training |
| Escape (late blue pill) | `the_unplugging_late` | Send the message after 5 years |
| Captured | `ending_captured` | Abort rescue / freeze at phone |
| Limbo (deep blue) | `ending_blue_pill_deep` | Delete the message |
| Limbo (denial) | `dream_denial` | Delete the sleep-code |
| Limbo (suppression) | `revelation_suppression` | Format the drive |
| Limbo (loop) | `ending_limbo` | Loop until exit closes |

---

## Known Open Items

- `the_dodge` c1 (belief >= 2) jumps to `ending_escape` without passing through death/resurrection — same gap that was fixed for the "My name is Neo" path
- `dream_denial` and `revelation_suppression` are short for the emotional weight they carry
- The Nebuchadnezzar never becomes a physical environment (only a staging area)
- No second story arc yet (Lord of the Rings, Inception, etc. — backend is ready)
- No admin UI for writers; currently use Supabase dashboard directly
- Not deployed (build is production-ready; Netlify-compatible)

---

## QA History

**The Investigator** (Matrix-expert QA agent) traversed the canonical path (54 nodes, init → ending_escape) and found 10 issues. All 10 were fixed:

1. `the_construct` re-explained atrophy after 8 awakening nodes — fixed
2. `the_oracle` (orphaned legacy node) — removed
3. `morpheus_captured` "training run" contradiction — fixed
4. Raw conditional logic in `lobby_upper_floor` prose — removed
5. Smith's subway dialogue on a rooftop — rewritten for setting
6. "My name is Neo" skipped death/resurrection — death arc added
7. `the_phone` showed new Agent without explanation — bridged
8. `loop_02` orphaned — connected from blue pill offer
9. `the_phone` false choice — reframed, gated on belief <= 1
10. `morpheus_captured` abort had no character logic — replaced with rescue_hesitation

**Story Analysis** (SA1–SA8 framework) identified 3 high-impact issues. All 3 addressed:

1. Third-act emotional flatness (lobby/Smith) — Neo's interiority restored in all 6 lobby nodes and the_calculation
2. Escape ending lacked grief — Thomas Anderson acknowledged in ending_escape, neo_death, neo_resurrection
3. Twenty-six years as undetonated charge — surfaces in oracle_how_did_you_know, neo_death, neo_resurrection, ending_escape
