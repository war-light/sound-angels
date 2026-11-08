# Graph Report - sound-angels  (2026-11-07)

## Corpus Check
- 160 files · ~171,281 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 4, .css 1)

## Summary
- 888 nodes · 2468 edges · 57 communities (30 shown, 27 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `135e09b4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useSessionStore
- sessionPhase.test.ts
- useSessionStore.ts
- arrangement.ts
- theory.ts
- combat.ts
- player.ts
- ua-arch-analyze.cjs
- ua-arch-analyze.js
- opencode.json
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
- bluesky-icon symbol
- qte.ts
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
- parryChart.ts
- session.ts
- storage.ts
- QtePanel.tsx
- loadout.ts
- progress.tsx
- game/perform.ts
- vitest
- phase.ts
- NoteEvent
- discord-icon symbol
- documentation-icon symbol
- github-icon symbol
- social-icon symbol
- icons.svg SVG Icon Sprite
- x-icon symbol

## God Nodes (most connected - your core abstractions)
1. `useSessionStore` - 148 edges
2. `cn()` - 52 edges
3. `Button()` - 45 edges
4. `vitest` - 39 edges
5. `emit()` - 35 edges
6. `advanceTick()` - 35 edges
7. `Key` - 27 edges
8. `react` - 25 edges
9. `isDown()` - 24 edges
10. `degreeToMidi()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Audio-clock anchored playhead with transform-only notes` --conceptually_related_to--> `Tone.js transport scheduling and synths stack`  [INFERRED]
  docs/qte-redesign.md → README.md
- `Fight key locked at createFight` --conceptually_related_to--> `Chord progression quality scoring voice-leading diatonic syntax`  [INFERRED]
  AGENTS.md → docs/mechanics.md
- `Number keys 1-3 select front-row performer` --conceptually_related_to--> `Melody lanes equal front positions with potency fade`  [INFERRED]
  docs/combat-pacing-plan.md → AGENTS.md
- `chordPcs()` --calls--> `romanToChord()`  [EXTRACTED]
  src/game/parryChart.test.ts → src/game/theory.ts
- `getGrooveBottles()` --indirect_call--> `cloneGroove()`  [INFERRED]
  src/game/session.ts → src/game/groove.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Music loop station as combat damage engine** — docs_mechanics_loop_station, docs_mechanics_atb_system, agents_concept_melody_lanes_potency [EXTRACTED 0.75]
- **V1 menu prep combat result game flow** — docs_v1_plan_gamephase_state_machine, docs_v1_plan_screen_flow, docs_v1_plan_encounter_system [INFERRED 0.75]
- **Rhythmic QTE call-and-response system** — docs_combat_pacing_plan_parry_call_response, docs_qte_redesign_highway_always_visible, docs_mechanics_ddr_qte_panel [INFERRED 0.85]

## Communities (57 total, 27 thin omitted)

### Community 0 - "useSessionStore"
Cohesion: 0.09
Nodes (53): react, react-dom, App(), phaseForOverlay(), CardPreviewButton(), CombatFeedback(), FloatingTag, CombatLog() (+45 more)

### Community 1 - "sessionPhase.test.ts"
Cohesion: 0.15
Nodes (17): getEncounter(), createFight(), createDefaultLoadout(), resetPresetCooldowns(), beginFight(), getArrangement(), getEncounterId(), getFight() (+9 more)

### Community 2 - "useSessionStore.ts"
Cohesion: 0.09
Nodes (39): ChordPreset, EncounterDef, setChords(), setKey(), Loadout, MelodyTemplate, cursorDegree(), HOME_CURSOR (+31 more)

### Community 3 - "arrangement.ts"
Cohesion: 0.06
Nodes (64): GrooveMeter(), LABELS, LABELS, useTypingFocus(), VoiceBar(), Arrangement, ATTACK_SLOTS, checkPos() (+56 more)

### Community 4 - "theory.ts"
Cohesion: 0.08
Nodes (39): ChordPicker(), ChordWheel(), CustomChordBuilder(), ROMAN_PALETTE_MAJOR, ROMAN_PALETTE_MINOR, TransportBar(), CHORD_PRESETS, ChordEffect (+31 more)

### Community 5 - "combat.ts"
Cohesion: 0.07
Nodes (60): allOnsetKeys(), clearTracks(), loopLength(), onsetKey(), onsetKeysOf(), advanceTick(), aliveEnemies(), aliveParty() (+52 more)

### Community 6 - "player.ts"
Cohesion: 0.06
Nodes (61): tone, ensureAudio(), getMaster(), auditionBlip(), auditionEnd(), auditionStart(), beatVoice(), chordVoice() (+53 more)

### Community 7 - "ua-arch-analyze.cjs"
Cohesion: 0.05
Nodes (37): allIdPaths, allPaths, apiHandlerFiles, crossCategoryEdges, crossMap, dataModelFiles, dependencyDirection, directoryGroups (+29 more)

### Community 8 - "ua-arch-analyze.js"
Cohesion: 0.04
Nodes (39): allIdPaths, allPaths, apiHandlerFiles, crossCategoryEdges, crossMap, dataModelFiles, dependencyDirection, directoryGroups (+31 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+12 more)

### Community 11 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 12 - "package.json"
Cohesion: 0.11
Nodes (18): name, private, type, version, clsx, jsdom, lucide-react, oxlint (+10 more)

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

### Community 21 - "qte.ts"
Cohesion: 0.11
Nodes (32): requestChordQte(), requestPresetQte(), beatDegreeFor(), chartFromMelody(), chartFromPattern(), chartKeys(), createQte(), degreeToPerformKey() (+24 more)

### Community 22 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 23 - "Hero Image (stacked isometric platforms)"
Cohesion: 0.50
Nodes (4): Two stacked rounded-square platforms in isometric view, dashed connectors, Hero Image (stacked isometric platforms), Minimal dark 3D style, black faces with purple metallic edge, Unreferenced static asset, no import found in src, likely landing hero visual

### Community 39 - "melodyBank.ts"
Cohesion: 0.17
Nodes (20): cloneTemplate(), cloneTracks(), createDawnAnthem(), createDefaultMelodyBank(), createSolemnGround(), createStaccatoFlight(), deleteTemplate(), emptyTracks() (+12 more)

### Community 40 - "parryChart.ts"
Cohesion: 0.14
Nodes (21): buildAntecedentCell(), CellNote, chordPool(), DEFAULT_PARRY_PARAMS, DEFAULT_SLOTS, degreeToParryLane(), developConsequentCell(), extractPlayerCell() (+13 more)

### Community 41 - "session.ts"
Cohesion: 0.11
Nodes (34): setGroove(), refreshPotency(), releaseQteKey(), applyPendingSwaps(), arrangement, cancelChart(), emit(), equipGrooveNow() (+26 more)

### Community 42 - "storage.ts"
Cohesion: 0.28
Nodes (15): clearAllPersistedData(), isStorageAvailable(), KEYS, loadCardLoadout(), loadClearedEncounters(), loadCustomChords(), loadEquippedGroove(), loadGrooveBottles() (+7 more)

### Community 43 - "QtePanel.tsx"
Cohesion: 0.23
Nodes (15): ActiveHighway(), LaneConfig, LANES, PARRY_LANES, QtePanel(), ratingMeta(), ReceptorProps, ReceptorRow (+7 more)

### Community 44 - "loadout.ts"
Cohesion: 0.15
Nodes (14): DEFAULT_GROOVE_ID, MAX_GROOVE_CARDS, MAX_MELODY_CARDS, parseLoadout(), sanitizeLoadout(), selectLoadoutId(), toggleLoadoutId(), DEFAULT_MELODY_CARD_ID (+6 more)

### Community 46 - "game/perform.ts"
Cohesion: 0.17
Nodes (10): MAX_DEGREE, MAX_OCTAVE, MIN_DEGREE, MIN_OCTAVE, PARRY_KEYS, ParryKey, PerformKey, KEYS (+2 more)

### Community 47 - "vitest"
Cohesion: 0.31
Nodes (3): @testing-library/jest-dom, @testing-library/react, vitest

### Community 49 - "NoteEvent"
Cohesion: 0.40
Nodes (5): NoteEvent, GenerateParryChartOpts, PresetEntry, PresetRecall, QtePayload

## Ambiguous Edges - Review These
- `Dynamic 2-bar versus 4-bar loop length` → `Audio-clock anchored playhead with transform-only notes`  [AMBIGUOUS]
  docs/combat-pacing-plan.md · relation: conceptually_related_to

## Knowledge Gaps
- **42 isolated node(s):** `jsdom`, `oxlint`, `tailwindcss`, `@testing-library/user-event`, `@types/node` (+37 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 342 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `useSessionStore`, `sessionPhase.test.ts`, `useSessionStore.ts`, `arrangement.ts`, `theory.ts`, `combat.ts`, `player.ts`, `melodyBank.ts`, `parryChart.ts`, `storage.ts`, `package.json`, `vite.config.ts`, `qte.ts`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **What connects `jsdom`, `oxlint`, `tailwindcss` to the rest of the system?**
  _42 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useSessionStore` be split into smaller, more focused modules?**
  _Cohesion score 0.08624708624708624 - nodes in this community are weakly interconnected._
- **Why does `useSessionStore` connect `useSessionStore.ts` to `useSessionStore`, `sessionPhase.test.ts`, `arrangement.ts`, `theory.ts`, `combat.ts`, `player.ts`, `melodyBank.ts`, `session.ts`, `QtePanel.tsx`, `loadout.ts`, `game/perform.ts`, `vitest`, `qte.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `useSessionStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09407665505226481 - nodes in this community are weakly interconnected._
- **Why does `react` connect `useSessionStore` to `arrangement.ts`, `theory.ts`, `player.ts`, `QtePanel.tsx`, `package.json`, `progress.tsx`, `game/perform.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Dynamic 2-bar versus 4-bar loop length` and `Audio-clock anchored playhead with transform-only notes`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
