# Graph Report - sound-angels  (2026-11-06)

## Corpus Check
- 228 files · ~325,748 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 4, .css 1)

## Summary
- 1151 nodes · 3349 edges · 64 communities (45 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ca7108a8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useSessionStore
- positions.ts
- melodyBank.ts
- preview.ts
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
- stageCombat.ts
- groove.ts
- MelodyCardBar.tsx
- storage.ts
- createFight
- useSessionStore.ts
- progress.tsx
- enemies.ts
- combat.ts
- combatQte.test.ts
- Key
- keys.ts
- theory.ts
- phase.ts
- arrangement.ts
- stageMusic.ts
- stageClips.ts
- stageClips.lint.test.ts
- StepGrid.tsx
- isDown
- sessionPhase.test.ts
- presets.ts
- VoiceBar.tsx

## God Nodes (most connected - your core abstractions)
1. `useSessionStore` - 148 edges
2. `cn()` - 52 edges
3. `Button()` - 45 edges
4. `vitest` - 39 edges
5. `advanceTick()` - 35 edges
6. `emit()` - 35 edges
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
- `getGrooveChoices()` --indirect_call--> `cloneGroove()`  [INFERRED]
  src/game/session.ts → src/game/groove.ts
- `getGrooveBottles()` --indirect_call--> `cloneGroove()`  [INFERRED]
  src/game/session.ts → src/game/groove.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Music loop station as combat damage engine** — docs_mechanics_loop_station, docs_mechanics_atb_system, agents_concept_melody_lanes_potency [EXTRACTED 0.75]
- **V1 menu prep combat result game flow** — docs_v1_plan_gamephase_state_machine, docs_v1_plan_screen_flow, docs_v1_plan_encounter_system [INFERRED 0.75]
- **Rhythmic QTE call-and-response system** — docs_combat_pacing_plan_parry_call_response, docs_qte_redesign_highway_always_visible, docs_mechanics_ddr_qte_panel [INFERRED 0.85]

## Communities (64 total, 19 thin omitted)

### Community 0 - "useSessionStore"
Cohesion: 0.06
Nodes (84): react, @testing-library/react, vitest, App(), phaseForOverlay(), CardPreviewButton(), previewSpy, AuraSummary() (+76 more)

### Community 1 - "positions.ts"
Cohesion: 0.23
Nodes (12): moveFighter(), assignToSlot(), deckIds(), defaultSlots(), MAX_FRONT, removeToDeck(), SlotId, slotOf() (+4 more)

### Community 2 - "melodyBank.ts"
Cohesion: 0.19
Nodes (20): DEFAULT_BARS, cloneTemplate(), cloneTracks(), createDawnAnthem(), createDefaultMelodyBank(), createSolemnGround(), createStaccatoFlight(), deleteTemplate() (+12 more)

### Community 3 - "preview.ts"
Cohesion: 0.08
Nodes (57): tone, ensureAudio(), getMaster(), auditionBlip(), auditionEnd(), auditionNote(), auditionStart(), chordVoice() (+49 more)

### Community 4 - "parryChart.ts"
Cohesion: 0.13
Nodes (25): buildAntecedentCell(), CellNote, DEFAULT_PARRY_PARAMS, DEFAULT_SLOTS, degreeToParryLane(), developConsequentCell(), extractPlayerCell(), generateParryChart() (+17 more)

### Community 5 - "qte.ts"
Cohesion: 0.12
Nodes (26): releaseQteKey(), chartFromMelody(), chartFromPattern(), chartKeys(), createQte(), degreeToPerformKey(), fitChartToWindow(), harmonicChart() (+18 more)

### Community 6 - "QtePanel.tsx"
Cohesion: 0.09
Nodes (34): ActiveHighway(), LaneConfig, LANES, PARRY_LANES, QtePanel(), ratingMeta(), ReceptorProps, ReceptorRow (+26 more)

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
Nodes (20): name, private, type, version, clsx, jsdom, lucide-react, oxlint (+12 more)

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
Nodes (30): getRigPreset(), tweakGrooveKnobs(), melodyMuted(), tweakGroove(), createDefaultLoadout(), Loadout, MAX_GROOVE_CARDS, MAX_MELODY_CARDS (+22 more)

### Community 22 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 23 - "Hero Image (stacked isometric platforms)"
Cohesion: 0.50
Nodes (4): Two stacked rounded-square platforms in isometric view, dashed connectors, Hero Image (stacked isometric platforms), Minimal dark 3D style, black faces with purple metallic edge, Unreferenced static asset, no import found in src, likely landing hero visual

### Community 39 - "stageCombat.ts"
Cohesion: 0.10
Nodes (29): EnemyProfile, getStageClip(), LogEntry, activeClips(), advanceStage(), BarReport, clipStatus, INTRO_LOOPS (+21 more)

### Community 40 - "groove.ts"
Cohesion: 0.06
Nodes (73): firstStep(), BANKS, BankSpec, BROKEN, defaultBank(), getBank(), HALFTIME, makeBank() (+65 more)

### Community 41 - "MelodyCardBar.tsx"
Cohesion: 0.13
Nodes (19): MelodyCardBar(), withMelody(), ARPEGGIO_DEGREE_TRANSITIONS, findDegreeForPitchClass(), getDiatonicDirection(), MarkovMelodyGenerator, MelodyNote, MelodyStyle (+11 more)

### Community 42 - "storage.ts"
Cohesion: 0.24
Nodes (17): applyPendingSwaps(), handleStep(), clearAllPersistedData(), isStorageAvailable(), KEYS, loadCardLoadout(), loadClearedEncounters(), loadCustomChords() (+9 more)

### Community 43 - "createFight"
Cohesion: 0.27
Nodes (11): getEncounter(), createFight(), resetPresetCooldowns(), beginFight(), resetAll(), resetFight(), setEncounterId(), setSelectedParty() (+3 more)

### Community 44 - "useSessionStore.ts"
Cohesion: 0.08
Nodes (41): selectLoadoutId(), toggleLoadoutId(), advanceStageTo(), cancelChart(), deleteGrooveBottle(), deleteMelodyCard(), emit(), getActiveMelodyCardId() (+33 more)

### Community 46 - "enemies.ts"
Cohesion: 0.12
Nodes (19): DEFAULT_ENCOUNTER_ID, EncounterDef, ENCOUNTERS, getNextEncounterId(), validateEncounters(), Archetype, BassRecipe, ENEMIES (+11 more)

### Community 49 - "combat.ts"
Cohesion: 0.11
Nodes (33): allOnsetKeys(), onsetKeysOf(), setKey(), advanceTick(), aliveEnemies(), aliveParty(), cadenceSteps(), computeNoteDamage() (+25 more)

### Community 50 - "combatQte.test.ts"
Cohesion: 0.19
Nodes (12): cancelQte(), pressQteKey(), pushLog(), qteLocked(), requestChordQte(), requestPresetQte(), Rng, hitAllOnTime() (+4 more)

### Community 51 - "Key"
Cohesion: 0.21
Nodes (14): PreviewLayers, Arrangement, NoteEvent, AtbState, TickResult, Groove, MelodyTemplate, GenerateParryChartOpts (+6 more)

### Community 52 - "keys.ts"
Cohesion: 0.38
Nodes (6): TransportBar(), FIGHT_KEYS, FightKeyOpts, keyEquals(), randomFightKey(), resolveFightKey()

### Community 53 - "theory.ts"
Cohesion: 0.12
Nodes (24): chordPool(), chordPcs(), C_MAJOR, C_MINOR, DEFAULT_KEY, diatonicFitScore(), FLAT_TO_SHARP, isMinorScale() (+16 more)

### Community 54 - "phase.ts"
Cohesion: 0.25
Nodes (3): ALL_GAME_PHASES, GamePhase, VALID_TRANSITIONS

### Community 55 - "arrangement.ts"
Cohesion: 0.17
Nodes (19): defaultRig(), ATTACK_SLOTS, checkPos(), checkSlot(), clearTracks(), createDefaultArrangement(), emptyTracks(), fitProgression() (+11 more)

### Community 56 - "stageMusic.ts"
Cohesion: 0.19
Nodes (19): ClipSteps, BreaksClip, chordTones(), ClipBase, DrumHit, eventPitches(), FULL, isMinorKey() (+11 more)

### Community 57 - "stageClips.ts"
Cohesion: 0.15
Nodes (17): describeEffect(), ROLE_STYLE, STATUS_TEXT, breaks(), BY_ID, pitched(), STAGE_CLIPS, STAGE_KIT (+9 more)

### Community 58 - "stageClips.lint.test.ts"
Cohesion: 0.13
Nodes (16): clipsForRole(), allMixes(), breakClips, inBar(), isStrong(), KEYS, ornamentSteps(), PICKS (+8 more)

### Community 59 - "StepGrid.tsx"
Cohesion: 0.29
Nodes (14): coverage(), StepGrid(), onsetKey(), STEPS_PER_BAR, performSlot(), advanceSeqCursor(), clampSeqCursor(), digitToDegree() (+6 more)

### Community 60 - "isDown"
Cohesion: 0.26
Nodes (14): StageFoes(), Vitals(), STAGE_COMBOS, checkOver(), isStrikeLoop(), pushLog(), startLoop(), stepOnce() (+6 more)

### Community 61 - "sessionPhase.test.ts"
Cohesion: 0.16
Nodes (13): getArrangement(), getEncounterId(), getFight(), getGamePhase(), getMelodyBank(), loadMelodyTemplate(), requestTemplateChart(), saveToMelodyBank() (+5 more)

### Community 62 - "presets.ts"
Cohesion: 0.32
Nodes (10): hashMelodySet(), cloneTracks(), cooldownFor(), deletePreset(), isOnCooldown(), PresetStore, readyPresets(), recallPreset() (+2 more)

### Community 63 - "VoiceBar.tsx"
Cohesion: 0.60
Nodes (4): useTypingFocus(), VoiceBar(), countOnsets(), hasLiveAttacker()

## Ambiguous Edges - Review These
- `Dynamic 2-bar versus 4-bar loop length` → `Audio-clock anchored playhead with transform-only notes`  [AMBIGUOUS]
  docs/combat-pacing-plan.md · relation: conceptually_related_to

## Knowledge Gaps
- **359 isolated node(s):** `StageVoices`, `ResultOverlayProps`, `DEGREES`, `MODS`, `FN_STYLE` (+354 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 403 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Dynamic 2-bar versus 4-bar loop length` and `Audio-clock anchored playhead with transform-only notes`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `useSessionStore` connect `useSessionStore` to `positions.ts`, `preview.ts`, `QtePanel.tsx`, `groove.ts`, `MelodyCardBar.tsx`, `createFight`, `useSessionStore.ts`, `combat.ts`, `keys.ts`, `session.ts`, `arrangement.ts`, `stageMusic.ts`, `stageClips.ts`, `StepGrid.tsx`, `isDown`, `sessionPhase.test.ts`, `VoiceBar.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `StageVoices`, `ResultOverlayProps`, `DEGREES` to the rest of the system?**
  _359 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useSessionStore` be split into smaller, more focused modules?**
  _Cohesion score 0.060825396825396824 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `useSessionStore` to `positions.ts`, `melodyBank.ts`, `preview.ts`, `parryChart.ts`, `qte.ts`, `QtePanel.tsx`, `package.json`, `vite.config.ts`, `stageCombat.ts`, `groove.ts`, `MelodyCardBar.tsx`, `storage.ts`, `enemies.ts`, `combat.ts`, `combatQte.test.ts`, `keys.ts`, `theory.ts`, `arrangement.ts`, `stageClips.lint.test.ts`, `StepGrid.tsx`, `sessionPhase.test.ts`, `presets.ts`, `VoiceBar.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `preview.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08344988344988345 - nodes in this community are weakly interconnected._
- **Why does `react` connect `useSessionStore` to `QtePanel.tsx`, `MelodyCardBar.tsx`, `package.json`, `progress.tsx`, `StepGrid.tsx`, `VoiceBar.tsx`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._