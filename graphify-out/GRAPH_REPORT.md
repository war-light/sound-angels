# Graph Report - sound-angels  (2026-10-19)

## Corpus Check
- 165 files · ~177,182 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 4, .css 1)

## Summary
- 973 nodes · 2730 edges · 55 communities (36 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `135e09b4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- session.ts
- QtePanel.tsx
- arrangement.ts
- parryChart.ts
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
- Key
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
- ChordPicker.tsx
- combat.ts
- combatQte.test.ts
- SessionStore
- positions.ts
- theory.ts
- phase.ts

## God Nodes (most connected - your core abstractions)
1. `useSessionStore` - 130 edges
2. `cn()` - 43 edges
3. `Button()` - 39 edges
4. `vitest` - 35 edges
5. `advanceTick()` - 35 edges
6. `emit()` - 32 edges
7. `react` - 25 edges
8. `CombatScreen()` - 23 edges
9. `Key` - 20 edges
10. `SessionStore` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Audio-clock anchored playhead with transform-only notes` --conceptually_related_to--> `Tone.js transport scheduling and synths stack`  [INFERRED]
  docs/qte-redesign.md → README.md
- `Fight key locked at createFight` --conceptually_related_to--> `Chord progression quality scoring voice-leading diatonic syntax`  [INFERRED]
  AGENTS.md → docs/mechanics.md
- `Number keys 1-3 select front-row performer` --conceptually_related_to--> `Melody lanes equal front positions with potency fade`  [INFERRED]
  docs/combat-pacing-plan.md → AGENTS.md
- `rigsForBank()` --indirect_call--> `cloneGroove()`  [INFERRED]
  src/data/beats.ts → src/game/groove.ts
- `getGrooveBottles()` --indirect_call--> `cloneGroove()`  [INFERRED]
  src/game/session.ts → src/game/groove.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Music loop station as combat damage engine** — docs_mechanics_loop_station, docs_mechanics_atb_system, agents_concept_melody_lanes_potency [EXTRACTED 0.75]
- **V1 menu prep combat result game flow** — docs_v1_plan_gamephase_state_machine, docs_v1_plan_screen_flow, docs_v1_plan_encounter_system [INFERRED 0.75]
- **Rhythmic QTE call-and-response system** — docs_combat_pacing_plan_parry_call_response, docs_qte_redesign_highway_always_visible, docs_mechanics_ddr_qte_panel [INFERRED 0.85]

## Communities (55 total, 19 thin omitted)

### Community 0 - "cn"
Cohesion: 0.07
Nodes (62): react, @testing-library/react, App(), phaseForOverlay(), CardPreviewButton(), previewSpy, ChordPicker(), CombatFeedback() (+54 more)

### Community 1 - "session.ts"
Cohesion: 0.09
Nodes (37): defaultRig(), getRigPreset(), setGroove(), refreshPotency(), bottleGroove(), cloneGroove(), createDefaultLoadout(), Loadout (+29 more)

### Community 2 - "QtePanel.tsx"
Cohesion: 0.12
Nodes (26): ActiveHighway(), LaneConfig, LANES, PARRY_LANES, QtePanel(), ratingMeta(), ReceptorProps, ReceptorRow (+18 more)

### Community 3 - "arrangement.ts"
Cohesion: 0.08
Nodes (45): @testing-library/jest-dom, vitest, firstStep(), useTypingFocus(), VoiceBar(), allOnsetKeys(), ATTACK_SLOTS, checkPos() (+37 more)

### Community 4 - "parryChart.ts"
Cohesion: 0.11
Nodes (26): EnemyProfile, buildAntecedentCell(), CellNote, chordPool(), DEFAULT_PARRY_PARAMS, DEFAULT_SLOTS, degreeToParryLane(), developConsequentCell() (+18 more)

### Community 5 - "qte.ts"
Cohesion: 0.13
Nodes (24): chartFromMelody(), chartFromPattern(), chartKeys(), createQte(), degreeToPerformKey(), fitChartToWindow(), harmonicChart(), isQteComplete() (+16 more)

### Community 6 - "preview.ts"
Cohesion: 0.11
Nodes (43): tone, ensureAudio(), getMaster(), auditionBlip(), auditionEnd(), auditionStart(), chordVoice(), configurePlayer() (+35 more)

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

### Community 21 - "Key"
Cohesion: 0.30
Nodes (8): TransportBar(), FIGHT_KEYS, FightKeyOpts, keyEquals(), randomFightKey(), resolveFightKey(), GenerateParryChartOpts, Key

### Community 22 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 23 - "Hero Image (stacked isometric platforms)"
Cohesion: 0.50
Nodes (4): Two stacked rounded-square platforms in isometric view, dashed connectors, Hero Image (stacked isometric platforms), Minimal dark 3D style, black faces with purple metallic edge, Unreferenced static asset, no import found in src, likely landing hero visual

### Community 39 - "melodyBank.ts"
Cohesion: 0.18
Nodes (21): cloneTemplate(), cloneTracks(), createDawnAnthem(), createDefaultMelodyBank(), createSolemnGround(), createStaccatoFlight(), deleteTemplate(), emptyTracks() (+13 more)

### Community 40 - "groove.ts"
Cohesion: 0.06
Nodes (63): BANKS, BankSpec, BROKEN, defaultBank(), getBank(), HALFTIME, makeBank(), preset() (+55 more)

### Community 41 - "emit"
Cohesion: 0.21
Nodes (15): selectLoadoutId(), toggleLoadoutId(), deleteGrooveBottle(), deleteMelodyCard(), emit(), requestPresetChart(), saveCustomChordPreset(), saveCustomMelodyCard() (+7 more)

### Community 42 - "storage.ts"
Cohesion: 0.28
Nodes (15): clearAllPersistedData(), isStorageAvailable(), KEYS, loadCardLoadout(), loadClearedEncounters(), loadCustomChords(), loadEquippedGroove(), loadGrooveBottles() (+7 more)

### Community 43 - "sessionPhase.test.ts"
Cohesion: 0.17
Nodes (16): getEncounter(), createFight(), reconcilePotency(), resetPresetCooldowns(), beginFight(), getMelodyBank(), loadMelodyTemplate(), requestTemplateChart() (+8 more)

### Community 44 - "useSessionStore.ts"
Cohesion: 0.10
Nodes (37): stop(), setKey(), defaultPerformerId(), isParryKey(), cancelChart(), getActiveMelodyCardId(), getArrangement(), getBanks() (+29 more)

### Community 46 - "enemies.ts"
Cohesion: 0.12
Nodes (20): DEFAULT_ENCOUNTER_ID, ENCOUNTERS, getNextEncounterId(), isEncounterUnlocked(), validateEncounters(), Archetype, BassRecipe, ENEMIES (+12 more)

### Community 47 - "ChordPicker.tsx"
Cohesion: 0.19
Nodes (16): AuraSummary(), chordLabel(), ChordPickerProps, matchesLive(), voicingOf(), CustomChordBuilder(), CustomChordBuilderProps, MetricBar() (+8 more)

### Community 49 - "combat.ts"
Cohesion: 0.12
Nodes (34): fitProgression(), setChords(), advanceTick(), aliveEnemies(), aliveParty(), AtbState, cadenceSteps(), computeNoteDamage() (+26 more)

### Community 50 - "combatQte.test.ts"
Cohesion: 0.23
Nodes (10): cancelQte(), pressQteKey(), pushLog(), qteLocked(), requestChordQte(), requestPresetQte(), hitAllOnTime(), KEY (+2 more)

### Community 51 - "SessionStore"
Cohesion: 0.18
Nodes (12): PreviewLayers, ChordPreset, EncounterDef, Arrangement, TickResult, Groove, MelodyTemplate, PerformCursor (+4 more)

### Community 52 - "positions.ts"
Cohesion: 0.33
Nodes (9): moveFighter(), assignToSlot(), deckIds(), defaultSlots(), MAX_FRONT, removeToDeck(), slotOf(), PARTY (+1 more)

### Community 53 - "theory.ts"
Cohesion: 0.13
Nodes (21): C_MAJOR, C_MINOR, diatonicFitScore(), FLAT_TO_SHARP, HarmonicFunction, isMinorScale(), normalizePitchClass(), parseRoman() (+13 more)

## Ambiguous Edges - Review These
- `Dynamic 2-bar versus 4-bar loop length` → `Audio-clock anchored playhead with transform-only notes`  [AMBIGUOUS]
  docs/combat-pacing-plan.md · relation: conceptually_related_to

## Knowledge Gaps
- **326 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `fs` (+321 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 368 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Dynamic 2-bar versus 4-bar loop length` and `Audio-clock anchored playhead with transform-only notes`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `vitest` connect `arrangement.ts` to `cn`, `QtePanel.tsx`, `parryChart.ts`, `qte.ts`, `melodyBank.ts`, `groove.ts`, `storage.ts`, `sessionPhase.test.ts`, `package.json`, `useSessionStore.ts`, `enemies.ts`, `ChordPicker.tsx`, `vite.config.ts`, `combat.ts`, `combatQte.test.ts`, `positions.ts`, `Key`, `theory.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _326 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.07214912280701755 - nodes in this community are weakly interconnected._
- **Why does `useSessionStore` connect `useSessionStore.ts` to `cn`, `session.ts`, `QtePanel.tsx`, `arrangement.ts`, `parryChart.ts`, `preview.ts`, `melodyBank.ts`, `emit`, `sessionPhase.test.ts`, `ChordPicker.tsx`, `combat.ts`, `Key`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Should `session.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08710801393728224 - nodes in this community are weakly interconnected._
- **Why does `react` connect `cn` to `QtePanel.tsx`, `arrangement.ts`, `preview.ts`, `package.json`, `progress.tsx`, `ChordPicker.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._