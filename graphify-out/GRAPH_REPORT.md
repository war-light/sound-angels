# Graph Report - sound-angels  (2026-10-16)

## Corpus Check
- 159 files · ~171,638 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 4, .css 1)

## Summary
- 907 nodes · 2494 edges · 46 communities (29 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c02c9779`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useSessionStore
- session.ts
- useSessionStore.ts
- vitest
- theory.ts
- combat.ts
- player.ts
- ua-arch-analyze.cjs
- ua-arch-analyze.js
- coder
- compilerOptions
- components.json
- package.json
- compilerOptions
- devDependencies
- Pure TS combat music engine (session, advanceTick)
- vite.config.ts
- Always-visible QTE highway with bottom receptors
- dependencies
- scripts
- icons.svg SVG Icon Sprite
- keys.ts
- .oxlintrc.json
- Hero Image (stacked isometric platforms)
- Chord progression quality scoring voice-leading diatonic syntax
- tsconfig.json
- Melody lanes equal front positions with potency fade
- HP and shield rebalance for 4-5 minute fights
- Combat intro grace period of two loops
- Stagger gauge rewarding harmonic skill with stun and burst
- Menu prep combat result screen flow
- Favicon SVG icon (purple lightning bolt)
- Versioned localStorage JSON persistence
- Sound Angels Dark Room-like music combat game
- React Logo SVG
- Vite Boilerplate Asset
- Default Vite boilerplate asset, unused by game
- Vite Logo SVG
- melodyBank.ts
- groove.ts
- emit
- storage.ts
- cloneGroove
- loadout.ts
- progress.tsx

## God Nodes (most connected - your core abstractions)
1. `useSessionStore` - 127 edges
2. `Button()` - 41 edges
3. `cn()` - 41 edges
4. `emit()` - 34 edges
5. `advanceTick()` - 33 edges
6. `vitest` - 31 edges
7. `react` - 24 edges
8. `Key` - 22 edges
9. `compilerOptions` - 19 edges
10. `getVoices()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Audio-clock anchored playhead with transform-only notes` --conceptually_related_to--> `Tone.js transport scheduling and synths stack`  [INFERRED]
  docs/qte-redesign.md → README.md
- `Fight key locked at createFight` --conceptually_related_to--> `Chord progression quality scoring voice-leading diatonic syntax`  [INFERRED]
  AGENTS.md → docs/mechanics.md
- `Number keys 1-3 select front-row performer` --conceptually_related_to--> `Melody lanes equal front positions with potency fade`  [INFERRED]
  docs/combat-pacing-plan.md → AGENTS.md
- `FightKeyOpts` --references--> `Key`  [EXTRACTED]
  src/game/keys.ts → src/game/theory.ts
- `CustomChordBuilder()` --indirect_call--> `pitchClassOfMidi()`  [INFERRED]
  src/components/CustomChordBuilder.tsx → src/game/theory.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Music loop station as combat damage engine** — docs_mechanics_loop_station, docs_mechanics_atb_system, agents_concept_melody_lanes_potency [EXTRACTED 0.75]
- **V1 menu prep combat result game flow** — docs_v1_plan_gamephase_state_machine, docs_v1_plan_screen_flow, docs_v1_plan_encounter_system [INFERRED 0.75]
- **Rhythmic QTE call-and-response system** — docs_combat_pacing_plan_parry_call_response, docs_qte_redesign_highway_always_visible, docs_mechanics_ddr_qte_panel [INFERRED 0.85]

## Communities (46 total, 17 thin omitted)

### Community 0 - "useSessionStore"
Cohesion: 0.06
Nodes (82): react, react-dom, App(), phaseForOverlay(), CardPreviewButton(), ChordPicker(), ChordWheel(), CombatFeedback() (+74 more)

### Community 1 - "session.ts"
Cohesion: 0.08
Nodes (41): getEncounter(), createFight(), resetPresetCooldowns(), arrangement, beginFight(), fight, getActiveMelodyCardId(), getArrangement() (+33 more)

### Community 2 - "useSessionStore.ts"
Cohesion: 0.05
Nodes (57): ActiveHighway(), LaneConfig, LANES, PARRY_LANES, QtePanel(), ratingMeta(), ReceptorProps, ReceptorRow (+49 more)

### Community 3 - "vitest"
Cohesion: 0.06
Nodes (39): @testing-library/react, vitest, EncounterBanner(), useTypingFocus(), VoiceBar(), DEFAULT_ENCOUNTER_ID, ENCOUNTERS, getNextEncounterId() (+31 more)

### Community 4 - "theory.ts"
Cohesion: 0.07
Nodes (50): EnemyProfile, buildAntecedentCell(), CellNote, chordPool(), DEFAULT_PARRY_PARAMS, DEFAULT_SLOTS, degreeToParryLane(), developConsequentCell() (+42 more)

### Community 5 - "combat.ts"
Cohesion: 0.06
Nodes (77): allOnsetKeys(), clearTracks(), advanceTick(), aliveEnemies(), aliveParty(), beatInstrument(), cadenceSteps(), cancelQte() (+69 more)

### Community 6 - "player.ts"
Cohesion: 0.08
Nodes (53): tone, ensureAudio(), getMaster(), auditionBlip(), auditionEnd(), auditionStart(), beatVoice(), chordVoice() (+45 more)

### Community 7 - "ua-arch-analyze.cjs"
Cohesion: 0.04
Nodes (39): allIdPaths, allPaths, apiHandlerFiles, crossCategoryEdges, crossMap, dataModelFiles, dependencyDirection, directoryGroups (+31 more)

### Community 8 - "ua-arch-analyze.js"
Cohesion: 0.05
Nodes (37): allIdPaths, allPaths, apiHandlerFiles, crossCategoryEdges, crossMap, dataModelFiles, dependencyDirection, directoryGroups (+29 more)

### Community 9 - "coder"
Cohesion: 0.09
Nodes (21): agents, coder, plan, reviewer, description, mode, model, steps (+13 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+12 more)

### Community 11 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 12 - "package.json"
Cohesion: 0.10
Nodes (19): name, private, type, version, clsx, jsdom, lucide-react, oxlint (+11 more)

### Community 13 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 14 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, jsdom, oxlint, tailwindcss, @tailwindcss/vite, @testing-library/jest-dom, @testing-library/react, @testing-library/user-event (+7 more)

### Community 15 - "Pure TS combat music engine (session, advanceTick)"
Cohesion: 0.17
Nodes (12): Tone.js audio renderer with pooled voices, Pure TS combat music engine (session, advanceTick), Zustand session store mirroring engine, Dynamic 2-bar versus 4-bar loop length, Preset recall QTE derived from melody onsets, Active Time Battle gauges with HP shield buffs, WASD loop station recording at playhead, Audio-clock anchored playhead with transform-only notes (+4 more)

### Community 17 - "Always-visible QTE highway with bottom receptors"
Cohesion: 0.29
Nodes (6): Parry as rhythmic call-and-response mirror, DDR-style piano roll QTE panel for parry and chord swap, Chord maker attacker defender beat keeper slots, Always-visible QTE highway with bottom receptors, QtePanel RAF resubscribe and inline-style jank causes, Missing full DDR FNF QTE lane game feel gap

### Community 18 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, clsx, cn, lucide-react, radix-ui, @radix-ui/react-dialog, react, react-dom (+3 more)

### Community 19 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, test:watch

### Community 20 - "icons.svg SVG Icon Sprite"
Cohesion: 0.29
Nodes (7): bluesky-icon symbol, discord-icon symbol, documentation-icon symbol, github-icon symbol, social-icon symbol, icons.svg SVG Icon Sprite, x-icon symbol

### Community 21 - "keys.ts"
Cohesion: 0.38
Nodes (6): TransportBar(), FIGHT_KEYS, FightKeyOpts, keyEquals(), randomFightKey(), resolveFightKey()

### Community 22 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 23 - "Hero Image (stacked isometric platforms)"
Cohesion: 0.50
Nodes (4): Two stacked rounded-square platforms in isometric view, dashed connectors, Hero Image (stacked isometric platforms), Minimal dark 3D style, black faces with purple metallic edge, Unreferenced static asset, no import found in src, likely landing hero visual

### Community 39 - "melodyBank.ts"
Cohesion: 0.15
Nodes (22): DEFAULT_BARS, STEPS_PER_BAR, cloneTemplate(), cloneTracks(), createDawnAnthem(), createDefaultMelodyBank(), createSolemnGround(), createStaccatoFlight() (+14 more)

### Community 40 - "groove.ts"
Cohesion: 0.15
Nodes (19): toggleGrooveStep(), clampDensity(), clampSwing(), countGrooveHits(), emptyCell(), GROOVE_CARDS, GrooveCell, GrooveEffect (+11 more)

### Community 41 - "emit"
Cohesion: 0.15
Nodes (19): bottleGroove(), selectLoadoutId(), toggleLoadoutId(), cancelChart(), deleteGrooveBottle(), deleteMelodyCard(), emit(), moveFighter() (+11 more)

### Community 42 - "storage.ts"
Cohesion: 0.28
Nodes (15): clearAllPersistedData(), isStorageAvailable(), KEYS, loadCardLoadout(), loadClearedEncounters(), loadCustomChords(), loadEquippedGroove(), loadGrooveBottles() (+7 more)

### Community 43 - "cloneGroove"
Cohesion: 0.17
Nodes (16): setGroove(), tweakGrooveKnobs(), cloneGroove(), defaultGroove(), getGrooveCard(), createDefaultLoadout(), applyPendingSwaps(), equipGrooveNow() (+8 more)

### Community 44 - "loadout.ts"
Cohesion: 0.25
Nodes (7): DEFAULT_GROOVE_ID, Loadout, MAX_GROOVE_CARDS, MAX_MELODY_CARDS, parseLoadout(), sanitizeLoadout(), DEFAULT_MELODY_CARD_ID

## Ambiguous Edges - Review These
- `Dynamic 2-bar versus 4-bar loop length` → `Audio-clock anchored playhead with transform-only notes`  [AMBIGUOUS]
  docs/combat-pacing-plan.md · relation: conceptually_related_to

## Knowledge Gaps
- **315 isolated node(s):** `fs`, `pathOf`, `allPaths`, `prefixSegs`, `directoryGroups` (+310 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 355 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Dynamic 2-bar versus 4-bar loop length` and `Audio-clock anchored playhead with transform-only notes`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `vitest` connect `vitest` to `useSessionStore`, `session.ts`, `useSessionStore.ts`, `theory.ts`, `combat.ts`, `player.ts`, `melodyBank.ts`, `groove.ts`, `storage.ts`, `package.json`, `vite.config.ts`, `keys.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `fs`, `pathOf`, `allPaths` to the rest of the system?**
  _315 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useSessionStore` be split into smaller, more focused modules?**
  _Cohesion score 0.06138726677111522 - nodes in this community are weakly interconnected._
- **Why does `useSessionStore` connect `useSessionStore` to `session.ts`, `useSessionStore.ts`, `vitest`, `theory.ts`, `combat.ts`, `player.ts`, `melodyBank.ts`, `groove.ts`, `emit`, `cloneGroove`, `keys.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `session.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07575757575757576 - nodes in this community are weakly interconnected._
- **Why does `react` connect `useSessionStore` to `useSessionStore.ts`, `vitest`, `package.json`, `progress.tsx`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._