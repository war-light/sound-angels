# Graph Report - sound-angels  (2026-10-19)

## Corpus Check
- 166 files · ~177,530 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 4, .css 1)

## Summary
- 974 nodes · 2738 edges · 55 communities (35 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dd1f74e9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- session.ts
- QteKey
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
- loadout.ts
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
- units.ts
- groove.ts
- cloneGroove
- storage.ts
- createFight
- useSessionStore.ts
- progress.tsx
- enemies.ts
- combat.ts
- combatQte.test.ts
- SessionStore
- positions.ts
- theory.ts
- phase.ts

## God Nodes (most connected - your core abstractions)
1. `useSessionStore` - 131 edges
2. `cn()` - 43 edges
3. `Button()` - 39 edges
4. `vitest` - 36 edges
5. `advanceTick()` - 35 edges
6. `emit()` - 32 edges
7. `react` - 25 edges
8. `CombatScreen()` - 23 edges
9. `SessionStore` - 20 edges
10. `Key` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Audio-clock anchored playhead with transform-only notes` --conceptually_related_to--> `Tone.js transport scheduling and synths stack`  [INFERRED]
  docs/qte-redesign.md → README.md
- `Fight key locked at createFight` --conceptually_related_to--> `Chord progression quality scoring voice-leading diatonic syntax`  [INFERRED]
  AGENTS.md → docs/mechanics.md
- `Number keys 1-3 select front-row performer` --conceptually_related_to--> `Melody lanes equal front positions with potency fade`  [INFERRED]
  docs/combat-pacing-plan.md → AGENTS.md
- `rigsForBank()` --indirect_call--> `cloneGroove()`  [INFERRED]
  src/data/beats.ts → src/game/groove.ts
- `chordPcs()` --calls--> `romanToChord()`  [EXTRACTED]
  src/game/parryChart.test.ts → src/game/theory.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Music loop station as combat damage engine** — docs_mechanics_loop_station, docs_mechanics_atb_system, agents_concept_melody_lanes_potency [EXTRACTED 0.75]
- **V1 menu prep combat result game flow** — docs_v1_plan_gamephase_state_machine, docs_v1_plan_screen_flow, docs_v1_plan_encounter_system [INFERRED 0.75]
- **Rhythmic QTE call-and-response system** — docs_combat_pacing_plan_parry_call_response, docs_qte_redesign_highway_always_visible, docs_mechanics_ddr_qte_panel [INFERRED 0.85]

## Communities (55 total, 20 thin omitted)

### Community 0 - "cn"
Cohesion: 0.05
Nodes (90): react, react-dom, @testing-library/jest-dom, @testing-library/react, vitest, App(), phaseForOverlay(), CardPreviewButton() (+82 more)

### Community 1 - "session.ts"
Cohesion: 0.09
Nodes (45): cancelQte(), refreshPotency(), releaseQteKey(), selectLoadoutId(), toggleLoadoutId(), deleteTemplate(), getTemplate(), isPresetMelodyCard() (+37 more)

### Community 2 - "QteKey"
Cohesion: 0.29
Nodes (8): LaneConfig, ReceptorProps, AtbState, QteKey, Slots, QteNote, QteState, Fighter

### Community 3 - "arrangement.ts"
Cohesion: 0.07
Nodes (56): firstStep(), useTypingFocus(), VoiceBar(), ATTACK_SLOTS, checkPos(), checkSlot(), clearTracks(), countOnsets() (+48 more)

### Community 4 - "parryChart.ts"
Cohesion: 0.07
Nodes (40): EnemyProfile, buildAntecedentCell(), CellNote, chordPool(), DEFAULT_PARRY_PARAMS, DEFAULT_SLOTS, degreeToParryLane(), developConsequentCell() (+32 more)

### Community 5 - "qte.ts"
Cohesion: 0.13
Nodes (24): chartFromMelody(), chartFromPattern(), chartKeys(), createQte(), degreeToPerformKey(), fitChartToWindow(), harmonicChart(), isQteComplete() (+16 more)

### Community 6 - "preview.ts"
Cohesion: 0.11
Nodes (44): tone, ensureAudio(), getMaster(), auditionBlip(), auditionEnd(), auditionStart(), chordVoice(), configurePlayer() (+36 more)

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

### Community 21 - "loadout.ts"
Cohesion: 0.22
Nodes (10): defaultRig(), createDefaultLoadout(), Loadout, MAX_GROOVE_CARDS, MAX_MELODY_CARDS, parseLoadout(), sanitizeLoadout(), DEFAULT_MELODY_CARD_ID (+2 more)

### Community 22 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 23 - "Hero Image (stacked isometric platforms)"
Cohesion: 0.50
Nodes (4): Two stacked rounded-square platforms in isometric view, dashed connectors, Hero Image (stacked isometric platforms), Minimal dark 3D style, black faces with purple metallic edge, Unreferenced static asset, no import found in src, likely landing hero visual

### Community 39 - "units.ts"
Cohesion: 0.31
Nodes (8): addShield(), applyBuff(), Buff, BuffId, damageThroughShield(), healFighter(), makeFighter(), tickBuffs()

### Community 40 - "groove.ts"
Cohesion: 0.07
Nodes (61): BANKS, BankSpec, BROKEN, defaultBank(), getBank(), HALFTIME, makeBank(), preset() (+53 more)

### Community 41 - "cloneGroove"
Cohesion: 0.16
Nodes (17): getRigPreset(), setGroove(), bottleGroove(), cloneGroove(), equipGrooveNow(), getGrooveBottles(), getGrooveById(), getGrooveChoices() (+9 more)

### Community 42 - "storage.ts"
Cohesion: 0.26
Nodes (16): clearAllPersistedData(), isStorageAvailable(), KEYS, loadCardLoadout(), loadClearedEncounters(), loadCustomChords(), loadEquippedGroove(), loadGrooveBottles() (+8 more)

### Community 43 - "createFight"
Cohesion: 0.32
Nodes (8): getEncounter(), createFight(), resetPresetCooldowns(), beginFight(), resetFight(), setEncounterId(), setSelectedParty(), startFight()

### Community 44 - "useSessionStore.ts"
Cohesion: 0.11
Nodes (31): stop(), setKey(), isParryKey(), getActiveMelodyCardId(), getArrangement(), getBanks(), getClearedEncounters(), getCustomChordPresets() (+23 more)

### Community 46 - "enemies.ts"
Cohesion: 0.12
Nodes (20): DEFAULT_ENCOUNTER_ID, ENCOUNTERS, getNextEncounterId(), isEncounterUnlocked(), validateEncounters(), Archetype, BassRecipe, ENEMIES (+12 more)

### Community 49 - "combat.ts"
Cohesion: 0.16
Nodes (25): allOnsetKeys(), advanceTick(), aliveEnemies(), aliveParty(), cadenceSteps(), computeNoteDamage(), DEFAULT_PARTY, defaultPerformerId() (+17 more)

### Community 50 - "combatQte.test.ts"
Cohesion: 0.23
Nodes (10): melodyMuted(), pressQteKey(), pushLog(), qteLocked(), requestChordQte(), requestPresetQte(), hitAllOnTime(), KEY (+2 more)

### Community 51 - "SessionStore"
Cohesion: 0.20
Nodes (11): PreviewLayers, EncounterDef, Arrangement, TickResult, DrumKit, Groove, PerformCursor, GamePhase (+3 more)

### Community 52 - "positions.ts"
Cohesion: 0.33
Nodes (9): moveFighter(), assignToSlot(), deckIds(), defaultSlots(), MAX_FRONT, removeToDeck(), slotOf(), PARTY (+1 more)

### Community 53 - "theory.ts"
Cohesion: 0.09
Nodes (29): TransportBar(), FIGHT_KEYS, FightKeyOpts, keyEquals(), randomFightKey(), resolveFightKey(), GenerateParryChartOpts, C_MAJOR (+21 more)

## Ambiguous Edges - Review These
- `Dynamic 2-bar versus 4-bar loop length` → `Audio-clock anchored playhead with transform-only notes`  [AMBIGUOUS]
  docs/combat-pacing-plan.md · relation: conceptually_related_to

## Knowledge Gaps
- **326 isolated node(s):** `StepHandler`, `Voices`, `previewSpy`, `ChordPickerProps`, `ROMAN_PALETTE_MAJOR` (+321 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 367 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Dynamic 2-bar versus 4-bar loop length` and `Audio-clock anchored playhead with transform-only notes`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `vitest` connect `cn` to `arrangement.ts`, `parryChart.ts`, `qte.ts`, `units.ts`, `groove.ts`, `storage.ts`, `package.json`, `useSessionStore.ts`, `enemies.ts`, `vite.config.ts`, `combat.ts`, `combatQte.test.ts`, `positions.ts`, `theory.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `StepHandler`, `Voices`, `previewSpy` to the rest of the system?**
  _326 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.05199761478831246 - nodes in this community are weakly interconnected._
- **Why does `useSessionStore` connect `useSessionStore.ts` to `cn`, `session.ts`, `arrangement.ts`, `parryChart.ts`, `preview.ts`, `cloneGroove`, `createFight`, `combat.ts`, `theory.ts`, `loadout.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Should `session.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08599290780141844 - nodes in this community are weakly interconnected._
- **Why does `react` connect `cn` to `arrangement.ts`, `parryChart.ts`, `preview.ts`, `package.json`, `progress.tsx`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._