# Graph Report - sound-angels  (2026-10-19)

## Corpus Check
- 215 files · ~312,777 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 4, .css 1)

## Summary
- 986 nodes · 2781 edges · 55 communities (36 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fde39871`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- emit
- melodyBank.ts
- arrangement.ts
- parryChart.ts
- qte.ts
- QtePanel.tsx
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
- session.ts
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
- selectBank
- storage.ts
- createFight
- useSessionStore.ts
- progress.tsx
- encounters.ts
- combat.ts
- combatQte.test.ts
- Key
- keys.ts
- theory.ts
- phase.ts

## God Nodes (most connected - your core abstractions)
1. `useSessionStore` - 131 edges
2. `cn()` - 43 edges
3. `Button()` - 39 edges
4. `vitest` - 37 edges
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
- `FightKeyOpts` --references--> `Key`  [EXTRACTED]
  src/game/keys.ts → src/game/theory.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Music loop station as combat damage engine** — docs_mechanics_loop_station, docs_mechanics_atb_system, agents_concept_melody_lanes_potency [EXTRACTED 0.75]
- **V1 menu prep combat result game flow** — docs_v1_plan_gamephase_state_machine, docs_v1_plan_screen_flow, docs_v1_plan_encounter_system [INFERRED 0.75]
- **Rhythmic QTE call-and-response system** — docs_combat_pacing_plan_parry_call_response, docs_qte_redesign_highway_always_visible, docs_mechanics_ddr_qte_panel [INFERRED 0.85]

## Communities (55 total, 19 thin omitted)

### Community 0 - "cn"
Cohesion: 0.06
Nodes (71): react, react-dom, App(), phaseForOverlay(), CardPreviewButton(), previewSpy, CombatFeedback(), FloatingTag (+63 more)

### Community 1 - "emit"
Cohesion: 0.14
Nodes (20): bottleGroove(), selectLoadoutId(), toggleLoadoutId(), deleteTemplate(), cancelChart(), deleteGrooveBottle(), deleteMelodyCard(), emit() (+12 more)

### Community 2 - "melodyBank.ts"
Cohesion: 0.16
Nodes (23): DEFAULT_BARS, cloneTemplate(), cloneTracks(), createDawnAnthem(), createDefaultMelodyBank(), createSolemnGround(), createStaccatoFlight(), emptyTracks() (+15 more)

### Community 3 - "arrangement.ts"
Cohesion: 0.05
Nodes (77): tone, ensureAudio(), getMaster(), auditionBlip(), auditionEnd(), auditionNote(), auditionStart(), chordVoice() (+69 more)

### Community 4 - "parryChart.ts"
Cohesion: 0.08
Nodes (41): coverage(), StepGrid(), EnemyProfile, onsetKey(), STEPS_PER_BAR, performSlot(), buildAntecedentCell(), CellNote (+33 more)

### Community 5 - "qte.ts"
Cohesion: 0.12
Nodes (28): requestChordQte(), requestPresetQte(), chartFromMelody(), chartFromPattern(), chartKeys(), createQte(), degreeToPerformKey(), fitChartToWindow() (+20 more)

### Community 6 - "QtePanel.tsx"
Cohesion: 0.11
Nodes (34): playChordChange(), playDefeatSting(), playDrumHit(), playEnemyTelegraph(), playQteHit(), playQteMiss(), playUiClick(), playVictoryJingle() (+26 more)

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

### Community 21 - "session.ts"
Cohesion: 0.09
Nodes (34): defaultRig(), getRigPreset(), setGroove(), melodyMuted(), refreshPotency(), releaseQteKey(), cloneGroove(), createDefaultLoadout() (+26 more)

### Community 22 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 23 - "Hero Image (stacked isometric platforms)"
Cohesion: 0.50
Nodes (4): Two stacked rounded-square platforms in isometric view, dashed connectors, Hero Image (stacked isometric platforms), Minimal dark 3D style, black faces with purple metallic edge, Unreferenced static asset, no import found in src, likely landing hero visual

### Community 39 - "units.ts"
Cohesion: 0.24
Nodes (10): computeNoteDamage(), evadeChance(), addShield(), applyBuff(), Buff, buffDamageTaken(), BuffId, healFighter() (+2 more)

### Community 40 - "groove.ts"
Cohesion: 0.07
Nodes (56): BANKS, BankSpec, BROKEN, defaultBank(), getBank(), HALFTIME, makeBank(), preset() (+48 more)

### Community 41 - "selectBank"
Cohesion: 0.38
Nodes (7): equipGrooveNow(), queueOrEquip(), rigUnderEdit(), selectBank(), selectKit(), selectPad(), tweakEquippedGroove()

### Community 42 - "storage.ts"
Cohesion: 0.26
Nodes (16): clearAllPersistedData(), isStorageAvailable(), KEYS, loadCardLoadout(), loadClearedEncounters(), loadCustomChords(), loadEquippedGroove(), loadGrooveBottles() (+8 more)

### Community 43 - "createFight"
Cohesion: 0.32
Nodes (8): getEncounter(), createFight(), resetPresetCooldowns(), beginFight(), resetFight(), setEncounterId(), setSelectedParty(), startFight()

### Community 44 - "useSessionStore.ts"
Cohesion: 0.10
Nodes (39): stop(), setKey(), DrumKit, cursorDegree(), HOME_CURSOR, isParryKey(), moveCursor(), pressToLen() (+31 more)

### Community 46 - "encounters.ts"
Cohesion: 0.43
Nodes (6): DEFAULT_ENCOUNTER_ID, EncounterDef, ENCOUNTERS, getNextEncounterId(), validateEncounters(), ENEMIES

### Community 49 - "combat.ts"
Cohesion: 0.16
Nodes (26): allOnsetKeys(), fitProgression(), setChords(), advanceTick(), aliveEnemies(), aliveParty(), cadenceSteps(), cancelQte() (+18 more)

### Community 50 - "combatQte.test.ts"
Cohesion: 0.32
Nodes (6): pressQteKey(), qteLocked(), Rng, hitAllOnTime(), KEY, playAllOnTime()

### Community 51 - "Key"
Cohesion: 0.13
Nodes (20): PreviewLayers, CharacterDef, DEFAULT_PARTY_ROSTER, getCharacter(), ROSTER, Arrangement, NoteEvent, AtbState (+12 more)

### Community 52 - "keys.ts"
Cohesion: 0.38
Nodes (6): TransportBar(), FIGHT_KEYS, FightKeyOpts, keyEquals(), randomFightKey(), resolveFightKey()

### Community 53 - "theory.ts"
Cohesion: 0.08
Nodes (42): @testing-library/react, vitest, AuraSummary(), chordLabel(), ChordPicker(), ChordPickerProps, matchesLive(), voicingOf() (+34 more)

### Community 54 - "phase.ts"
Cohesion: 0.25
Nodes (3): ALL_GAME_PHASES, GamePhase, VALID_TRANSITIONS

## Ambiguous Edges - Review These
- `Dynamic 2-bar versus 4-bar loop length` → `Audio-clock anchored playhead with transform-only notes`  [AMBIGUOUS]
  docs/combat-pacing-plan.md · relation: conceptually_related_to

## Knowledge Gaps
- **326 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `fs` (+321 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 367 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Dynamic 2-bar versus 4-bar loop length` and `Audio-clock anchored playhead with transform-only notes`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `vitest` connect `theory.ts` to `cn`, `melodyBank.ts`, `arrangement.ts`, `parryChart.ts`, `qte.ts`, `units.ts`, `groove.ts`, `storage.ts`, `package.json`, `useSessionStore.ts`, `encounters.ts`, `vite.config.ts`, `combat.ts`, `combatQte.test.ts`, `Key`, `keys.ts`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _326 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.06142643764002987 - nodes in this community are weakly interconnected._
- **Why does `useSessionStore` connect `useSessionStore.ts` to `cn`, `emit`, `melodyBank.ts`, `arrangement.ts`, `parryChart.ts`, `QtePanel.tsx`, `selectBank`, `createFight`, `combat.ts`, `keys.ts`, `theory.ts`, `session.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `emit` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._
- **Why does `react` connect `cn` to `arrangement.ts`, `parryChart.ts`, `QtePanel.tsx`, `package.json`, `progress.tsx`, `theory.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._