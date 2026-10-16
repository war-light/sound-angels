# Graph Report - sound-angels  (2026-10-16)

## Corpus Check
- 155 files · ~163,665 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 3, .css 1)

## Summary
- 693 nodes · 1915 edges · 39 communities (24 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.89)
- Token cost: 1,200 input · 150 output

## Community Hubs (Navigation)
- UI Components Gallery
- Session Fight Lifecycle
- QTE Perform Highway
- Arrangement Melody Bank
- Parry Theory Scoring
- Combat ATB Core
- Audio Renderer Voices
- QTE Chart Engine
- Encounters Enemy Data
- Agent Config
- TS App Config
- UI Component Aliases
- Package Metadata
- TS Node Config
- Dev Dependencies
- Design Docs Concepts
- Test Build Setup
- QTE Design Rationale
- Runtime Dependencies
- NPM Scripts
- Icon Sprite Set
- Fight Key Picker
- Lint Config
- Hero Artwork Asset
- Music Data Model
- TS Project Refs
- Melody Lane Mapping
- Fight Pacing Balance
- Encounter Form Phases
- Enemy Variant Mechanics
- App Boot Flow
- Favicon Icon
- Save Persistence Format
- Game Pitch Concept
- React Logo Asset
- React Boilerplate Note
- Vite Boilerplate Note
- Vite Logo Asset

## God Nodes (most connected - your core abstractions)
1. `useSessionStore` - 109 edges
2. `Button()` - 35 edges
3. `advanceTick()` - 32 edges
4. `vitest` - 30 edges
5. `cn()` - 24 edges
6. `emit()` - 23 edges
7. `Key` - 22 edges
8. `react` - 21 edges
9. `compilerOptions` - 19 edges
10. `degreeToMidi()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Fight key locked at createFight` --conceptually_related_to--> `Chord progression quality scoring voice-leading diatonic syntax`  [INFERRED]
  AGENTS.md → docs/mechanics.md
- `Number keys 1-3 select front-row performer` --conceptually_related_to--> `Melody lanes equal front positions with potency fade`  [INFERRED]
  docs/combat-pacing-plan.md → AGENTS.md
- `Audio-clock anchored playhead with transform-only notes` --conceptually_related_to--> `Tone.js transport scheduling and synths stack`  [INFERRED]
  docs/qte-redesign.md → README.md
- `CustomChordBuilder()` --indirect_call--> `pitchClassOfMidi()`  [INFERRED]
  src/components/CustomChordBuilder.tsx → src/game/theory.ts
- `FightKeyOpts` --references--> `Key`  [EXTRACTED]
  src/game/keys.ts → src/game/theory.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Music loop station as combat damage engine** — docs_mechanics_loop_station, docs_mechanics_atb_system, agents_concept_melody_lanes_potency [EXTRACTED 0.75]
- **Rhythmic QTE call-and-response system** — docs_combat_pacing_plan_parry_call_response, docs_qte_redesign_highway_always_visible, docs_mechanics_ddr_qte_panel [INFERRED 0.85]
- **V1 menu prep combat result game flow** — docs_v1_plan_gamephase_state_machine, docs_v1_plan_screen_flow, docs_v1_plan_encounter_system [INFERRED 0.75]

## Communities (39 total, 15 thin omitted)

### Community 0 - "UI Components Gallery"
Cohesion: 0.08
Nodes (60): react, react-dom, @testing-library/react, App(), phaseForOverlay(), ChordPicker(), ChordWheel(), CombatFeedback() (+52 more)

### Community 1 - "Session Fight Lifecycle"
Cohesion: 0.06
Nodes (72): getEncounter(), isEncounterUnlocked(), cancelQte(), createFight(), moveFighter(), pressQteKey(), pushLog(), qteLocked() (+64 more)

### Community 2 - "QTE Perform Highway"
Cohesion: 0.06
Nodes (50): ActiveHighway(), LaneConfig, LANES, PARRY_LANES, QtePanel(), ratingMeta(), ReceptorProps, ReceptorRow (+42 more)

### Community 3 - "Arrangement Melody Bank"
Cohesion: 0.08
Nodes (48): allOnsetKeys(), ATTACK_SLOTS, checkPos(), checkSlot(), clearTracks(), createDefaultArrangement(), DEFAULT_BARS, emptyTracks() (+40 more)

### Community 4 - "Parry Theory Scoring"
Cohesion: 0.07
Nodes (47): EnemyProfile, BASE_CELLS, chordPool(), DEFAULT_PARRY_PARAMS, DEFAULT_SLOTS, degreeToParryLane(), developCell(), generateParryChart() (+39 more)

### Community 5 - "Combat ATB Core"
Cohesion: 0.09
Nodes (39): setKey(), aliveEnemies(), aliveParty(), AtbState, beatInstrument(), computeNoteDamage(), DEFAULT_PARTY, defaultPerformerId() (+31 more)

### Community 6 - "Audio Renderer Voices"
Cohesion: 0.13
Nodes (35): tone, ensureAudio(), getMaster(), auditionBlip(), auditionEnd(), auditionStart(), beatVoice(), chordVoice() (+27 more)

### Community 7 - "QTE Chart Engine"
Cohesion: 0.11
Nodes (29): beatDegreeFor(), chartFromMelody(), chartFromPattern(), chartKeys(), createQte(), degreeToPerformKey(), fitChartToWindow(), harmonicChart() (+21 more)

### Community 8 - "Encounters Enemy Data"
Cohesion: 0.11
Nodes (21): DEFAULT_ENCOUNTER_ID, EncounterDef, ENCOUNTERS, getNextEncounterId(), validateEncounters(), Archetype, BassRecipe, ENEMIES (+13 more)

### Community 9 - "Agent Config"
Cohesion: 0.09
Nodes (21): agents, coder, plan, reviewer, description, mode, model, steps (+13 more)

### Community 10 - "TS App Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+12 more)

### Community 11 - "UI Component Aliases"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 12 - "Package Metadata"
Cohesion: 0.12
Nodes (16): name, private, type, version, clsx, jsdom, oxlint, tailwind-merge (+8 more)

### Community 13 - "TS Node Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 14 - "Dev Dependencies"
Cohesion: 0.13
Nodes (15): devDependencies, jsdom, oxlint, tailwindcss, @tailwindcss/vite, @testing-library/jest-dom, @testing-library/react, @testing-library/user-event (+7 more)

### Community 15 - "Design Docs Concepts"
Cohesion: 0.17
Nodes (12): Tone.js audio renderer with pooled voices, Pure TS combat music engine (session, advanceTick), Zustand session store mirroring engine, Dynamic 2-bar versus 4-bar loop length, Preset recall QTE derived from melody onsets, Active Time Battle gauges with HP shield buffs, WASD loop station recording at playhead, Audio-clock anchored playhead with transform-only notes (+4 more)

### Community 16 - "Test Build Setup"
Cohesion: 0.25
Nodes (4): @tailwindcss/vite, @testing-library/jest-dom, @vitejs/plugin-react, vitest

### Community 17 - "QTE Design Rationale"
Cohesion: 0.29
Nodes (6): Parry as rhythmic call-and-response mirror, DDR-style piano roll QTE panel for parry and chord swap, Chord maker attacker defender beat keeper slots, Always-visible QTE highway with bottom receptors, QtePanel RAF resubscribe and inline-style jank causes, Missing full DDR FNF QTE lane game feel gap

### Community 18 - "Runtime Dependencies"
Cohesion: 0.29
Nodes (7): dependencies, clsx, react, react-dom, tailwind-merge, tone, zustand

### Community 19 - "NPM Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, test:watch

### Community 20 - "Icon Sprite Set"
Cohesion: 0.29
Nodes (7): bluesky-icon symbol, discord-icon symbol, documentation-icon symbol, github-icon symbol, social-icon symbol, icons.svg SVG Icon Sprite, x-icon symbol

### Community 21 - "Fight Key Picker"
Cohesion: 0.48
Nodes (4): FIGHT_KEYS, FightKeyOpts, randomFightKey(), resolveFightKey()

### Community 22 - "Lint Config"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 23 - "Hero Artwork Asset"
Cohesion: 0.50
Nodes (4): Two stacked rounded-square platforms in isometric view, dashed connectors, Hero Image (stacked isometric platforms), Minimal dark 3D style, black faces with purple metallic edge, Unreferenced static asset, no import found in src, likely landing hero visual

## Ambiguous Edges - Review These
- `Dynamic 2-bar versus 4-bar loop length` → `Audio-clock anchored playhead with transform-only notes`  [AMBIGUOUS]
  docs/combat-pacing-plan.md · relation: conceptually_related_to

## Knowledge Gaps
- **229 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `$schema` (+224 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 251 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Dynamic 2-bar versus 4-bar loop length` and `Audio-clock anchored playhead with transform-only notes`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `vitest` connect `Test Build Setup` to `UI Components Gallery`, `Session Fight Lifecycle`, `QTE Perform Highway`, `Arrangement Melody Bank`, `Parry Theory Scoring`, `Combat ATB Core`, `QTE Chart Engine`, `Encounters Enemy Data`, `Package Metadata`, `Fight Key Picker`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _229 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components Gallery` be split into smaller, more focused modules?**
  _Cohesion score 0.07592385218365062 - nodes in this community are weakly interconnected._
- **Why does `useSessionStore` connect `UI Components Gallery` to `Session Fight Lifecycle`, `QTE Perform Highway`, `Arrangement Melody Bank`, `Parry Theory Scoring`, `Combat ATB Core`, `Audio Renderer Voices`, `QTE Chart Engine`, `Test Build Setup`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `Session Fight Lifecycle` be split into smaller, more focused modules?**
  _Cohesion score 0.061938061938061936 - nodes in this community are weakly interconnected._
- **Why does `devDependencies` connect `Dev Dependencies` to `Package Metadata`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._