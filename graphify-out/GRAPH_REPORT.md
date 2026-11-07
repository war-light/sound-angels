<<<<<<< HEAD
# Graph Report - sound-angels  (2026-11-07)

## Corpus Check
- 160 files · ~171,281 words
=======
# Graph Report - sound-angels  (2026-11-06)

## Corpus Check
- 229 files · ~326,795 words
>>>>>>> 90ab91a640541ced29022f81249bbd425f4504c0
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 4, .css 1)

## Summary
<<<<<<< HEAD
- 888 nodes · 2468 edges · 57 communities (30 shown, 27 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `135e09b4`
=======
- 1160 nodes · 3372 edges · 62 communities (43 shown, 19 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 56 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c84d185f`
>>>>>>> 90ab91a640541ced29022f81249bbd425f4504c0
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
<<<<<<< HEAD
- useSessionStore
- sessionPhase.test.ts
- useSessionStore.ts
- arrangement.ts
- theory.ts
- combat.ts
- player.ts
=======
- cn
- positions.ts
- melodyBank.ts
- arrangement.ts
- parryChart.ts
- qte.ts
- QtePanel.tsx
>>>>>>> 90ab91a640541ced29022f81249bbd425f4504c0
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
<<<<<<< HEAD
- bluesky-icon symbol
- qte.ts
=======
- icons.svg SVG Icon Sprite
- session.ts
>>>>>>> 90ab91a640541ced29022f81249bbd425f4504c0
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
<<<<<<< HEAD
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
=======
- stageCombat.ts
- groove.ts
- melodyGenerator.ts
- storage.ts
- Wiring
- useSessionStore.ts
- progress.tsx
- enemies.ts
- combat.ts
- emit
- Key
- game/perform.ts
- theory.ts
- sfx.ts
- selectBank
- stageMusic.ts
- stageClips.ts
- useWasd.ts
- StepGrid.tsx
- StageCombatants.tsx
- Stage combat: handoff notes
>>>>>>> 90ab91a640541ced29022f81249bbd425f4504c0

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
<<<<<<< HEAD
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
=======
- `Combat rules (`src/game/stageCombat.ts`)` --references--> `advanceStage()`  [INFERRED]
  docs/stage-combat.md → src/game/stageCombat.ts
- `Wiring` --references--> `CombatScreen()`  [INFERRED]
  docs/stage-combat.md → src/components/screens/CombatScreen.tsx
- `Wiring` --references--> `ResultOverlay()`  [INFERRED]
  docs/stage-combat.md → src/components/screens/ResultOverlay.tsx
- `Wiring` --references--> `LoopStrip()`  [INFERRED]
  docs/stage-combat.md → src/components/stage/LoopStrip.tsx
- `Wiring` --references--> `StageBoard()`  [INFERRED]
  docs/stage-combat.md → src/components/stage/StageBoard.tsx
>>>>>>> 90ab91a640541ced29022f81249bbd425f4504c0

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Music loop station as combat damage engine** — docs_mechanics_loop_station, docs_mechanics_atb_system, agents_concept_melody_lanes_potency [EXTRACTED 0.75]
- **V1 menu prep combat result game flow** — docs_v1_plan_gamephase_state_machine, docs_v1_plan_screen_flow, docs_v1_plan_encounter_system [INFERRED 0.75]
- **Rhythmic QTE call-and-response system** — docs_combat_pacing_plan_parry_call_response, docs_qte_redesign_highway_always_visible, docs_mechanics_ddr_qte_panel [INFERRED 0.85]

<<<<<<< HEAD
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
=======
## Communities (62 total, 19 thin omitted)

### Community 0 - "cn"
Cohesion: 0.06
Nodes (79): react, react-dom, @testing-library/react, vitest, App(), phaseForOverlay(), CardPreviewButton(), previewSpy (+71 more)

### Community 1 - "positions.ts"
Cohesion: 0.26
Nodes (11): moveFighter(), assignToSlot(), deckIds(), defaultSlots(), MAX_FRONT, removeToDeck(), SlotId, slotOf() (+3 more)

### Community 2 - "melodyBank.ts"
Cohesion: 0.16
Nodes (23): DEFAULT_BARS, cloneTemplate(), cloneTracks(), createDawnAnthem(), createDefaultMelodyBank(), createSolemnGround(), createStaccatoFlight(), deleteTemplate() (+15 more)

### Community 3 - "arrangement.ts"
Cohesion: 0.05
Nodes (87): tone, ensureAudio(), getMaster(), auditionBlip(), auditionEnd(), auditionNote(), auditionStart(), chordVoice() (+79 more)

### Community 4 - "parryChart.ts"
Cohesion: 0.11
Nodes (28): EnemyProfile, buildAntecedentCell(), CellNote, chordPool(), DEFAULT_PARRY_PARAMS, DEFAULT_SLOTS, degreeToParryLane(), developConsequentCell() (+20 more)

### Community 5 - "qte.ts"
Cohesion: 0.12
Nodes (26): PerformKey, chartFromMelody(), chartFromPattern(), chartKeys(), createQte(), degreeToPerformKey(), fitChartToWindow(), harmonicChart() (+18 more)

### Community 6 - "QtePanel.tsx"
Cohesion: 0.23
Nodes (15): ActiveHighway(), LaneConfig, LANES, PARRY_LANES, QtePanel(), ratingMeta(), ReceptorProps, ReceptorRow (+7 more)
>>>>>>> 90ab91a640541ced29022f81249bbd425f4504c0

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

<<<<<<< HEAD
### Community 21 - "qte.ts"
Cohesion: 0.11
Nodes (32): requestChordQte(), requestPresetQte(), beatDegreeFor(), chartFromMelody(), chartFromPattern(), chartKeys(), createQte(), degreeToPerformKey() (+24 more)
=======
### Community 20 - "icons.svg SVG Icon Sprite"
Cohesion: 0.29
Nodes (7): bluesky-icon symbol, discord-icon symbol, documentation-icon symbol, github-icon symbol, social-icon symbol, icons.svg SVG Icon Sprite, x-icon symbol

### Community 21 - "session.ts"
Cohesion: 0.08
Nodes (29): getRigPreset(), melodyMuted(), refreshPotency(), releaseQteKey(), createDefaultLoadout(), Loadout, MAX_GROOVE_CARDS, MAX_MELODY_CARDS (+21 more)
>>>>>>> 90ab91a640541ced29022f81249bbd425f4504c0

### Community 22 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 23 - "Hero Image (stacked isometric platforms)"
Cohesion: 0.50
Nodes (4): Two stacked rounded-square platforms in isometric view, dashed connectors, Hero Image (stacked isometric platforms), Minimal dark 3D style, black faces with purple metallic edge, Unreferenced static asset, no import found in src, likely landing hero visual

<<<<<<< HEAD
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
=======
### Community 39 - "stageCombat.ts"
Cohesion: 0.11
Nodes (27): DEGREES, FN_STYLE, MODS, getStageClip(), BarReport, checkOver(), INTRO_LOOPS, isStrikeLoop() (+19 more)

### Community 40 - "groove.ts"
Cohesion: 0.06
Nodes (64): BANKS, BankSpec, BROKEN, defaultRig(), HALFTIME, makeBank(), preset(), RIG_PRESETS (+56 more)

### Community 41 - "melodyGenerator.ts"
Cohesion: 0.13
Nodes (19): STEPS_PER_BAR, ARPEGGIO_DEGREE_TRANSITIONS, findDegreeForPitchClass(), getDiatonicDirection(), MarkovMelodyGenerator, MelodyNote, MelodyStyle, MotifMemoryItem (+11 more)

### Community 42 - "storage.ts"
Cohesion: 0.25
Nodes (17): saveGrooveBottle(), clearAllPersistedData(), isStorageAvailable(), KEYS, loadCardLoadout(), loadClearedEncounters(), loadCustomChords(), loadEquippedGroove() (+9 more)

### Community 43 - "Wiring"
Cohesion: 0.15
Nodes (20): Combat rules (`src/game/stageCombat.ts`), Wiring, configureStage(), Hichord(), getEncounter(), createFight(), advanceStageTo(), beginFight() (+12 more)

### Community 44 - "useSessionStore.ts"
Cohesion: 0.10
Nodes (40): configurePlayer(), stop(), stopStage(), getActiveMelodyCardId(), getArrangement(), getBanks(), getClearedEncounters(), getCustomChordPresets() (+32 more)

### Community 46 - "enemies.ts"
Cohesion: 0.12
Nodes (19): DEFAULT_ENCOUNTER_ID, EncounterDef, ENCOUNTERS, getNextEncounterId(), validateEncounters(), Archetype, BassRecipe, ENEMIES (+11 more)

### Community 49 - "combat.ts"
Cohesion: 0.12
Nodes (31): setKey(), aliveEnemies(), aliveParty(), AtbState, cadenceSteps(), computeNoteDamage(), DEFAULT_PARTY, defaultPerformerId() (+23 more)

### Community 50 - "emit"
Cohesion: 0.13
Nodes (22): cancelQte(), pushLog(), requestChordQte(), requestPresetQte(), selectLoadoutId(), toggleLoadoutId(), randomChart(), cancelChart() (+14 more)

### Community 51 - "Key"
Cohesion: 0.10
Nodes (20): PreviewLayers, TransportBar(), NoteEvent, FIGHT_KEYS, FightKeyOpts, keyEquals(), randomFightKey(), resolveFightKey() (+12 more)

### Community 52 - "game/perform.ts"
Cohesion: 0.19
Nodes (12): cursorDegree(), HOME_CURSOR, isParryKey(), MAX_DEGREE, MAX_OCTAVE, MIN_DEGREE, MIN_OCTAVE, moveCursor() (+4 more)

### Community 53 - "theory.ts"
Cohesion: 0.12
Nodes (24): C_MAJOR, C_MINOR, chordFunction(), DEFAULT_KEY, diatonicFitScore(), FLAT_TO_SHARP, isMinorScale(), normalizePitchClass() (+16 more)

### Community 54 - "sfx.ts"
Cohesion: 0.47
Nodes (10): playChordChange(), playDefeatSting(), playDrumHit(), playEnemyTelegraph(), playQteHit(), playQteMiss(), playUiClick(), playVictoryJingle() (+2 more)

### Community 55 - "selectBank"
Cohesion: 0.31
Nodes (9): defaultBank(), getBank(), equipGrooveNow(), queueOrEquip(), rigUnderEdit(), selectBank(), selectKit(), selectPad() (+1 more)

### Community 56 - "stageMusic.ts"
Cohesion: 0.09
Nodes (37): breakClips, inBar(), isStrong(), KEYS, ornamentSteps(), PICKS, pitchedClips, soundingSteps() (+29 more)

### Community 57 - "stageClips.ts"
Cohesion: 0.12
Nodes (22): describeEffect(), ROLE_STYLE, StageBoard(), STATUS_TEXT, breaks(), BY_ID, clipsForRole(), allMixes() (+14 more)

### Community 58 - "useWasd.ts"
Cohesion: 0.29
Nodes (7): ChordMod, inStageCombat(), KEYS, MOD_KEYS, NUM_KEYS, PARRY_KEYS, useWasd()

### Community 59 - "StepGrid.tsx"
Cohesion: 0.31
Nodes (13): coverage(), StepGrid(), onsetKey(), performSlot(), advanceSeqCursor(), clampSeqCursor(), digitToDegree(), fromIndex() (+5 more)

### Community 60 - "StageCombatants.tsx"
Cohesion: 0.44
Nodes (7): CombatLog(), StageCombatScreen(), LoopStrip(), StageFoes(), StageParty(), Vitals(), STAGE_BPM

### Community 61 - "Stage combat: handoff notes"
Cohesion: 0.29
Nodes (6): Clip notation, Files, How every mix stays safe, Next steps, Stage combat: handoff notes, Why
>>>>>>> 90ab91a640541ced29022f81249bbd425f4504c0

## Ambiguous Edges - Review These
- `Dynamic 2-bar versus 4-bar loop length` → `Audio-clock anchored playhead with transform-only notes`  [AMBIGUOUS]
  docs/combat-pacing-plan.md · relation: conceptually_related_to

## Knowledge Gaps
<<<<<<< HEAD
- **42 isolated node(s):** `jsdom`, `oxlint`, `tailwindcss`, `@testing-library/user-event`, `@types/node` (+37 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 342 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.
=======
- **364 isolated node(s):** `Why`, `How every mix stays safe`, `Clip notation`, `Files`, `Next steps` (+359 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 409 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.
>>>>>>> 90ab91a640541ced29022f81249bbd425f4504c0

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

<<<<<<< HEAD
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
=======
- **What is the exact relationship between `Dynamic 2-bar versus 4-bar loop length` and `Audio-clock anchored playhead with transform-only notes`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `vitest` connect `cn` to `positions.ts`, `melodyBank.ts`, `arrangement.ts`, `parryChart.ts`, `qte.ts`, `stageCombat.ts`, `groove.ts`, `storage.ts`, `package.json`, `useSessionStore.ts`, `enemies.ts`, `vite.config.ts`, `combat.ts`, `Key`, `game/perform.ts`, `theory.ts`, `stageMusic.ts`, `StepGrid.tsx`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **What connects `Why`, `How every mix stays safe`, `Clip notation` to the rest of the system?**
  _364 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.05757575757575758 - nodes in this community are weakly interconnected._
- **Why does `useSessionStore` connect `useSessionStore.ts` to `cn`, `positions.ts`, `melodyBank.ts`, `arrangement.ts`, `QtePanel.tsx`, `session.ts`, `stageCombat.ts`, `melodyGenerator.ts`, `storage.ts`, `Wiring`, `combat.ts`, `emit`, `Key`, `game/perform.ts`, `sfx.ts`, `selectBank`, `stageMusic.ts`, `stageClips.ts`, `useWasd.ts`, `StepGrid.tsx`, `StageCombatants.tsx`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `arrangement.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052922139729678276 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
>>>>>>> 90ab91a640541ced29022f81249bbd425f4504c0
