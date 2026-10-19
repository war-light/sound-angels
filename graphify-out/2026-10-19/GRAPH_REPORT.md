# Graph Report - sound-angels  (2026-10-19)

## Corpus Check
- 165 files · ~176,141 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 4, .css 1)

## Summary
- 960 nodes · 2674 edges · 55 communities (36 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `135e09b4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- session.ts
- QtePanel.tsx
- arrangement.ts
- theory.ts
- qte.ts
- preview.ts
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
- sessionPhase.test.ts
- useSessionStore.ts
- progress.tsx
- enemies.ts
- vitest
- advanceTick
- combat.ts
- SessionStore
- positions.ts
- selectBank
- phase.ts

## God Nodes (most connected - your core abstractions)
1. `useSessionStore` - 130 edges
2. `Button()` - 41 edges
3. `cn()` - 40 edges
4. `vitest` - 34 edges
5. `advanceTick()` - 33 edges
6. `emit()` - 32 edges
7. `react` - 24 edges
8. `SessionStore` - 20 edges
9. `Key` - 19 edges
10. `compilerOptions` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Audio-clock anchored playhead with transform-only notes` --conceptually_related_to--> `Tone.js transport scheduling and synths stack`  [INFERRED]
  docs/qte-redesign.md → README.md
- `Fight key locked at createFight` --conceptually_related_to--> `Chord progression quality scoring voice-leading diatonic syntax`  [INFERRED]
  AGENTS.md → docs/mechanics.md
- `Number keys 1-3 select front-row performer` --conceptually_related_to--> `Melody lanes equal front positions with potency fade`  [INFERRED]
  docs/combat-pacing-plan.md → AGENTS.md
- `CustomChordBuilder()` --indirect_call--> `pitchClassOfMidi()`  [INFERRED]
  src/components/CustomChordBuilder.tsx → src/game/theory.ts
- `rigsForBank()` --indirect_call--> `cloneGroove()`  [INFERRED]
  src/data/beats.ts → src/game/groove.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Music loop station as combat damage engine** — docs_mechanics_loop_station, docs_mechanics_atb_system, agents_concept_melody_lanes_potency [EXTRACTED 0.75]
- **V1 menu prep combat result game flow** — docs_v1_plan_gamephase_state_machine, docs_v1_plan_screen_flow, docs_v1_plan_encounter_system [INFERRED 0.75]
- **Rhythmic QTE call-and-response system** — docs_combat_pacing_plan_parry_call_response, docs_qte_redesign_highway_always_visible, docs_mechanics_ddr_qte_panel [INFERRED 0.85]

## Communities (55 total, 19 thin omitted)

### Community 0 - "Button"
Cohesion: 0.07
Nodes (61): react, react-dom, App(), phaseForOverlay(), CardPreviewButton(), previewSpy, ChordPicker(), ChordWheel() (+53 more)

### Community 1 - "session.ts"
Cohesion: 0.09
Nodes (34): defaultRig(), getRigPreset(), setGroove(), refreshPotency(), releaseQteKey(), bottleGroove(), cloneGroove(), createDefaultLoadout() (+26 more)

### Community 2 - "QtePanel.tsx"
Cohesion: 0.11
Nodes (26): ActiveHighway(), LaneConfig, LANES, PARRY_LANES, QtePanel(), ratingMeta(), ReceptorProps, ReceptorRow (+18 more)

### Community 3 - "arrangement.ts"
Cohesion: 0.09
Nodes (38): firstStep(), useTypingFocus(), VoiceBar(), allOnsetKeys(), ATTACK_SLOTS, checkPos(), checkSlot(), clearTracks() (+30 more)

### Community 4 - "theory.ts"
Cohesion: 0.06
Nodes (50): buildAntecedentCell(), CellNote, chordPool(), DEFAULT_PARRY_PARAMS, DEFAULT_SLOTS, degreeToParryLane(), developConsequentCell(), extractPlayerCell() (+42 more)

### Community 5 - "qte.ts"
Cohesion: 0.13
Nodes (25): chartFromMelody(), chartFromPattern(), chartKeys(), createQte(), degreeToPerformKey(), fitChartToWindow(), harmonicChart(), isQteComplete() (+17 more)

### Community 6 - "preview.ts"
Cohesion: 0.10
Nodes (47): tone, ensureAudio(), getMaster(), auditionBlip(), auditionEnd(), auditionStart(), chordVoice(), configurePlayer() (+39 more)

### Community 7 - "ua-arch-analyze.cjs"
Cohesion: 0.05
Nodes (37): allIdPaths, allPaths, apiHandlerFiles, crossCategoryEdges, crossMap, dataModelFiles, dependencyDirection, directoryGroups (+29 more)

### Community 8 - "ua-arch-analyze.js"
Cohesion: 0.04
Nodes (39): allIdPaths, allPaths, apiHandlerFiles, crossCategoryEdges, crossMap, dataModelFiles, dependencyDirection, directoryGroups (+31 more)

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
Cohesion: 0.19
Nodes (18): DEFAULT_BARS, cloneTemplate(), cloneTracks(), createDawnAnthem(), createDefaultMelodyBank(), createSolemnGround(), createStaccatoFlight(), deleteTemplate() (+10 more)

### Community 40 - "groove.ts"
Cohesion: 0.07
Nodes (62): GrooveMatrix(), Sparkline(), VOICE_LABELS, StudioScreen(), BANKS, BankSpec, BROKEN, defaultBank() (+54 more)

### Community 41 - "emit"
Cohesion: 0.15
Nodes (19): selectLoadoutId(), toggleLoadoutId(), cancelChart(), deleteGrooveBottle(), deleteMelodyCard(), emit(), moveFighter(), mutateArrangement() (+11 more)

### Community 42 - "storage.ts"
Cohesion: 0.26
Nodes (16): clearAllPersistedData(), isStorageAvailable(), KEYS, loadCardLoadout(), loadClearedEncounters(), loadCustomChords(), loadEquippedGroove(), loadGrooveBottles() (+8 more)

### Community 43 - "sessionPhase.test.ts"
Cohesion: 0.13
Nodes (18): getEncounter(), createFight(), reconcilePotency(), resetPresetCooldowns(), beginFight(), getArrangement(), getEncounterId(), getFight() (+10 more)

### Community 44 - "useSessionStore.ts"
Cohesion: 0.10
Nodes (36): ChordPreset, setChords(), setKey(), defaultPerformerId(), keeperInstrument(), DrumKit, cursorDegree(), HOME_CURSOR (+28 more)

### Community 46 - "enemies.ts"
Cohesion: 0.11
Nodes (21): DEFAULT_ENCOUNTER_ID, EncounterDef, ENCOUNTERS, getNextEncounterId(), isEncounterUnlocked(), validateEncounters(), Archetype, BassRecipe (+13 more)

### Community 47 - "vitest"
Cohesion: 0.31
Nodes (3): @testing-library/jest-dom, @testing-library/react, vitest

### Community 49 - "advanceTick"
Cohesion: 0.15
Nodes (22): advanceTick(), aliveEnemies(), aliveParty(), cadenceSteps(), computeNoteDamage(), evadeChance(), laneAttacker(), pickRandom() (+14 more)

### Community 50 - "combat.ts"
Cohesion: 0.18
Nodes (17): EnemyProfile, AtbState, cancelQte(), DEFAULT_PARTY, LogEntry, NoteHit, pressQteKey(), pushLog() (+9 more)

### Community 51 - "SessionStore"
Cohesion: 0.22
Nodes (13): Arrangement, NoteEvent, TickResult, Groove, MelodyTemplate, GenerateParryChartOpts, SlotId, PresetEntry (+5 more)

### Community 52 - "positions.ts"
Cohesion: 0.33
Nodes (9): moveFighter(), assignToSlot(), deckIds(), defaultSlots(), MAX_FRONT, removeToDeck(), slotOf(), PARTY (+1 more)

### Community 53 - "selectBank"
Cohesion: 0.36
Nodes (8): applyKit(), withBank(), queueOrEquip(), rigUnderEdit(), selectBank(), selectKit(), selectPad(), tweakEquippedGroove()

## Ambiguous Edges - Review These
- `Dynamic 2-bar versus 4-bar loop length` → `Audio-clock anchored playhead with transform-only notes`  [AMBIGUOUS]
  docs/combat-pacing-plan.md · relation: conceptually_related_to

## Knowledge Gaps
- **324 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `fs` (+319 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 365 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Dynamic 2-bar versus 4-bar loop length` and `Audio-clock anchored playhead with transform-only notes`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `vitest` connect `vitest` to `Button`, `arrangement.ts`, `theory.ts`, `qte.ts`, `melodyBank.ts`, `groove.ts`, `storage.ts`, `sessionPhase.test.ts`, `package.json`, `useSessionStore.ts`, `enemies.ts`, `vite.config.ts`, `advanceTick`, `combat.ts`, `positions.ts`, `keys.ts`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _324 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.07071189679885333 - nodes in this community are weakly interconnected._
- **Why does `useSessionStore` connect `useSessionStore.ts` to `Button`, `session.ts`, `QtePanel.tsx`, `arrangement.ts`, `preview.ts`, `groove.ts`, `emit`, `sessionPhase.test.ts`, `vitest`, `keys.ts`, `selectBank`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `session.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09388335704125178 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `QtePanel.tsx`, `arrangement.ts`, `preview.ts`, `groove.ts`, `package.json`, `progress.tsx`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._