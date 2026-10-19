// Session singleton: engine state (arrangement + fight) lives outside React.
// Pure game layer — no Tone.js, no React. UI mirrors it via subscribe().
import {
  createDefaultArrangement,
  loopLength,
  setGroove,
  tweakGrooveKnobs,
  withMelody,
  type Arrangement,
} from "./arrangement"
import {
  applyKit,
  bottleGroove,
  cloneGroove,
  parseGroove,
  tweakGroove,
  withBank,
  withPick,
  type Bank,
  type DrumKit,
  type DrumVoice,
  type Groove,
} from "./groove"
import { BANKS, RIG_PRESETS, defaultRig, getBank, getRigPreset } from "@/data/beats"
import { KITS, defaultKit, getKit } from "@/data/kits"
import {
  advanceTick,
  cancelQte,
  createFight,
  melodyMuted,
  moveFighter as moveFighterInFight,
  pressQteKey as pressQteInFight,
  releaseQteKey as releaseQteInFight,
  reconcilePotency,
  refreshPotency,
  requestChordQte as requestChordInFight,
  requestPresetQte as requestPresetInFight,
  type AtbState,
} from "./combat"
import {
  recallPreset,
  resetPresetCooldowns,
  savePreset,
  type PresetStore,
} from "./presets"
import type { Key } from "./theory"
import type { SlotId } from "./positions"
import { DEFAULT_ENCOUNTER_ID, ENCOUNTERS, getEncounter, isEncounterUnlocked } from "@/data/encounters"
import { DEFAULT_PARTY_ROSTER } from "@/data/roster"
import type { ChordPreset } from "@/data/chords"
import type { GamePhase } from "./phase"
import {
  createDefaultMelodyBank,
  deleteTemplate,
  getTemplate,
  isPresetMelodyCard,
  listMelodyCards,
  saveTemplate,
  updateTemplate,
  type MelodyBank,
  type MelodyTemplate,
} from "./melodyBank"
import {
  createDefaultLoadout,
  MAX_GROOVE_CARDS,
  MAX_MELODY_CARDS,
  parseLoadout,
  sanitizeLoadout,
  selectLoadoutId,
  toggleLoadoutId,
  type Loadout,
} from "./loadout"
import {
  clearAllPersistedData,
  loadCardLoadout,
  loadClearedEncounters,
  loadCustomChords,
  loadEquippedGroove,
  loadGrooveBottles,
  loadSelectedParty,
  saveCardLoadout,
  saveClearedEncounters,
  saveCustomChords,
  saveEquippedGroove,
  saveGrooveBottles,
  saveSelectedParty,
} from "@/persistence/storage"

/** The equipped groove survives reloads; malformed blobs fall back to Steady. */
const storedGroove = parseGroove(loadEquippedGroove())
let arrangement: Arrangement = createDefaultArrangement()
if (storedGroove) arrangement = setGroove(arrangement, storedGroove)
/** Bottled grooves built in the Studio. Equip them like any card. */
let grooveBottles: Groove[] = (loadGrooveBottles() ?? [])
  .map((raw) => parseGroove(raw))
  .filter((g): g is Groove => g != null)
/** Current encounter definition ID. */
let currentEncounterId: string = DEFAULT_ENCOUNTER_ID
/** Cleared encounter IDs tracking linear progression. */
let clearedEncounterIds: string[] = loadClearedEncounters() ?? []
/** Selected characters forming the 3-member party. */
let selectedPartyCharacterIds: string[] = loadSelectedParty() ?? [...DEFAULT_PARTY_ROSTER]
/** Custom crafted chord progressions. */
let customChordPresets: ChordPreset[] = loadCustomChords() ?? []
/** The fight key snapshots the arrangement key at (re)start and stays locked. */
let fight: AtbState = createFight({
  key: arrangement.key,
  enemyIds: getEncounter(currentEncounterId)?.enemyIds,
  partyCharacterIds: selectedPartyCharacterIds,
})
/** Saved melody sets (hash-keyed, tombstoned on delete, never truly removed). */
let presets: PresetStore = {}
/** Persistent pre-fight melody templates bank. */
let melodyBank: MelodyBank = createDefaultMelodyBank()
/** Every rig the player can equip right now: the presets, then the bottles. */
function knownGrooveIds(): string[] {
  return [...RIG_PRESETS.map((g) => g.id), ...grooveBottles.map((g) => g.id)]
}
/** The cards brought into a fight: 1..4 grooves + 1..6 melodies. */
let loadout: Loadout = sanitizeLoadout(
  parseLoadout(loadCardLoadout()) ?? createDefaultLoadout(),
  knownGrooveIds(),
  Object.keys(melodyBank),
)
/** The melody card currently loaded in the grid. Null = an unsaved loop. */
let activeMelodyCardId: string | null = null
/** Mid-combat picks waiting for the next loop boundary. */
let pendingGroove: Groove | null = null
let pendingMelodyId: string | null = null
/** Game state machine phase: menu -> prep -> studio -> combat -> victory / defeat. */
let gamePhase: GamePhase = "menu"

type Listener = () => void
const listeners = new Set<Listener>()

function emit(): void {
  for (const fn of listeners) fn()
}

export function getArrangement(): Arrangement {
  return arrangement
}

export function getFight(): AtbState {
  return fight
}

/** True while a chord swap mutes the soloist lanes (engine + audio both read this). */
export function getMelodyMuted(): boolean {
  return melodyMuted(fight)
}

export function getPresets(): PresetStore {
  return presets
}

export function getMelodyBank(): MelodyBank {
  return melodyBank
}

/** Every rig the player can equip: the curated presets, then bottled builds. */
export function getGrooveChoices(): Groove[] {
  return [...RIG_PRESETS.map(cloneGroove), ...getGrooveBottles()]
}

export function getGrooveBottles(): Groove[] {
  return grooveBottles.map(cloneGroove)
}

/** Resolve a rig id against the curated presets, then the bottled builds. */
export function getGrooveById(id: string): Groove | undefined {
  const found = getRigPreset(id) ?? grooveBottles.find((g) => g.id === id)
  return found ? cloneGroove(found) : undefined
}

/** The five rhythmic archetype banks the matrix pages through. */
export function getBanks(): Bank[] {
  return [...BANKS]
}

/** Every drum kit. Kits are a free choice, like the swing knob. */
export function getKits(): DrumKit[] {
  return [...KITS]
}

/** The rig queued for the next loop boundary, if any. */
export function getPendingGroove(): Groove | null {
  return pendingGroove ? cloneGroove(pendingGroove) : null
}

/** The equipped card bag: 1..4 grooves + 1..6 melodies. */
export function getLoadout(): Loadout {
  return { grooves: [...loadout.grooves], melodies: [...loadout.melodies] }
}

/** Every melody card in the bank, presets first then custom. */
export function getMelodyCards(): MelodyTemplate[] {
  return listMelodyCards(melodyBank)
}

/** The card currently sitting in the grid. Null = an unsaved custom loop. */
export function getActiveMelodyCardId(): string | null {
  return activeMelodyCardId
}

export function getPendingGrooveId(): string | null {
  return pendingGroove?.id ?? null
}

export function getPendingMelodyId(): string | null {
  return pendingMelodyId
}

/** PREP: add/remove a groove card from the bag (cap 4, floor 1). */
export function toggleLoadoutGroove(id: string): void {
  loadout = { ...loadout, grooves: toggleLoadoutId(loadout.grooves, id, MAX_GROOVE_CARDS) }
  saveCardLoadout(loadout)
  emit()
}

/** PREP: add/remove a melody card from the bag (cap 6, floor 1). */
export function toggleLoadoutMelody(id: string): void {
  loadout = { ...loadout, melodies: toggleLoadoutId(loadout.melodies, id, MAX_MELODY_CARDS) }
  saveCardLoadout(loadout)
  emit()
}

/** Equip a groove in place (PREP/STUDIO only) and persist the choice. */
export function equipGrooveNow(groove: Groove): void {
  arrangement = setGroove(arrangement, groove)
  saveEquippedGroove(arrangement.groove)
  emit()
}

/**
 * Equip a rig now (PREP/STUDIO), or queue it for the next loop boundary in
 * combat so the pulse never breaks mid-phrase.
 */
function queueOrEquip(rig: Groove): void {
  if (gamePhase === "combat") {
    pendingGroove = cloneGroove(rig)
    emit()
    return
  }
  pendingGroove = null
  equipGrooveNow(rig)
}

/** The rig the next edit builds on: the queued one, else the equipped one. */
function rigUnderEdit(): Groove {
  return pendingGroove ?? arrangement.groove
}

/**
 * Pick a whole rig (preset or bottle). PREP equips it at once; in combat the
 * pick is queued and lands on the next loop boundary.
 */
export function selectGrooveCard(id: string): boolean {
  const groove = getGrooveById(id)
  if (!groove) return false
  queueOrEquip(groove)
  return true
}

/** Tap one pad: swap that voice's clip (Sparse/Steady/Driving/Complex). */
export function selectPad(voice: DrumVoice, tier: number): void {
  const base = rigUnderEdit()
  const bank = getBank(base.bankId) ?? BANKS[0]
  queueOrEquip(withPick(base, voice, tier, bank))
}

/** Switch bank pages: the new bank's default pads and feel come with it. */
export function selectBank(id: string): boolean {
  const bank = getBank(id)
  if (!bank) return false
  const base = rigUnderEdit()
  queueOrEquip(withBank(base, bank, getKit(base.kitId) ?? defaultKit()))
  return true
}

/** Change drum kit: timbre and combat effect swap together. */
export function selectKit(id: string): boolean {
  const kit = getKit(id)
  if (!kit) return false
  queueOrEquip(applyKit(rigUnderEdit(), kit))
  return true
}

/** Tweak knob edit (swing) on the rig. Queues in combat like any pick. */
export function tweakEquippedGroove(knobs: { swing?: number }): void {
  if (gamePhase === "combat") {
    pendingGroove = tweakGroove(rigUnderEdit(), knobs)
    emit()
    return
  }
  pendingGroove = null
  arrangement = tweakGrooveKnobs(arrangement, knobs)
  saveEquippedGroove(arrangement.groove)
  emit()
}

/** Compose → bottle: save the equipped groove under a name, equip and bag it. */
export function saveGrooveBottle(name: string): Groove {
  const bottle = bottleGroove(arrangement.groove, name)
  grooveBottles = [...grooveBottles, bottle]
  saveGrooveBottles(grooveBottles)
  loadout = {
    ...loadout,
    grooves: selectLoadoutId(loadout.grooves, bottle.id, null, MAX_GROOVE_CARDS),
  }
  saveCardLoadout(loadout)
  arrangement = setGroove(arrangement, bottle)
  saveEquippedGroove(arrangement.groove)
  emit()
  return bottle
}

export function deleteGrooveBottle(id: string): void {
  grooveBottles = grooveBottles.filter((g) => g.id !== id)
  saveGrooveBottles(grooveBottles)
  loadout = {
    ...loadout,
    grooves:
      loadout.grooves.length > 1
        ? loadout.grooves.filter((x) => x !== id)
        : loadout.grooves,
  }
  saveCardLoadout(loadout)
  emit()
}

export function getGamePhase(): GamePhase {
  return gamePhase
}

export function setGamePhase(phase: GamePhase): void {
  if (gamePhase === phase) return
  gamePhase = phase
  emit()
}

export function toMenu(): void {
  setGamePhase("menu")
}

export function toPrep(): void {
  setGamePhase("prep")
}

/** Compose: the Studio step sequencer lives outside combat. */
export function toStudio(): void {
  setGamePhase("studio")
}

export function getEncounterId(): string {
  return currentEncounterId
}

export function setEncounterId(id: string, force = false): boolean {
  if (!force && !isEncounterUnlocked(clearedEncounterIds, id)) return false
  currentEncounterId = id
  if (gamePhase === "prep" || gamePhase === "menu") {
    const enc = getEncounter(id)
    fight = createFight({
      key: arrangement.key,
      enemyIds: enc?.enemyIds,
      partyCharacterIds: selectedPartyCharacterIds,
    })
  }
  emit()
  return true
}

export function getClearedEncounters(): string[] {
  return [...clearedEncounterIds]
}

export function isCurrentEncounterUnlocked(id: string): boolean {
  return isEncounterUnlocked(clearedEncounterIds, id)
}

export function unlockAllEncounters(): void {
  clearedEncounterIds = ENCOUNTERS.map((e) => e.id)
  saveClearedEncounters(clearedEncounterIds)
  emit()
}

export function resetEncounterProgression(): void {
  clearedEncounterIds = []
  currentEncounterId = DEFAULT_ENCOUNTER_ID
  grooveBottles = []
  loadout = createDefaultLoadout()
  activeMelodyCardId = null
  arrangement = setGroove(arrangement, defaultRig())
  pendingGroove = null
  clearAllPersistedData()
  emit()
}

export function getSelectedParty(): string[] {
  return [...selectedPartyCharacterIds]
}

export function setSelectedParty(characterIds: string[]): void {
  selectedPartyCharacterIds = [...characterIds]
  saveSelectedParty(selectedPartyCharacterIds)
  if (gamePhase === "prep" || gamePhase === "menu") {
    const enc = getEncounter(currentEncounterId)
    fight = createFight({
      key: arrangement.key,
      enemyIds: enc?.enemyIds,
      partyCharacterIds: selectedPartyCharacterIds,
    })
  }
  emit()
}

export function getCustomChordPresets(): ChordPreset[] {
  return customChordPresets
}

export function saveCustomChordPreset(name: string, romans: string[]): ChordPreset {
  const cleanName = name.trim() || `Custom ${customChordPresets.length + 1}`
  const preset: ChordPreset = {
    name: cleanName,
    romans: [...romans],
    example: romans.join("–"),
  }
  customChordPresets = [...customChordPresets.filter((p) => p.name !== cleanName), preset]
  saveCustomChords(customChordPresets)
  emit()
  return preset
}

export function mutateArrangement(fn: (a: Arrangement) => Arrangement): void {
  arrangement = fn(arrangement)
  emit()
}

/**
 * Called once per scheduled 16th step (via Tone.Draw in the audio player).
 * Applies enemy track-wipes to the arrangement as well as the fight.
 * Transitions gamePhase to victory/defeat when fight.over resolves.
 */
export function handleStep(): void {
  if (fight.over) return
  // Mid-combat card picks wait for the top of the loop so the phrase never
  // breaks: the swap is applied just before the new loop's first step.
  if ((pendingGroove || pendingMelodyId) && (fight.tick + 1) % loopLength(arrangement) === 0) {
    applyPendingSwaps()
  }
  const r = advanceTick(fight, arrangement)
  fight = r.state
  if (r.arrangement !== arrangement) arrangement = r.arrangement
  if (fight.over === "player") {
    if (!clearedEncounterIds.includes(currentEncounterId)) {
      clearedEncounterIds = [...clearedEncounterIds, currentEncounterId]
      saveClearedEncounters(clearedEncounterIds)
    }
    gamePhase = "victory"
  } else if (fight.over === "enemy") {
    gamePhase = "defeat"
  }
  emit()
}

/** Deck <-> position move. No-op for unknown fighters. */
export function moveFighter(fighterId: string, slot: SlotId | null): void {
  const next = moveFighterInFight(fight, fighterId, slot)
  if (next !== fight) {
    fight = next
    emit()
  }
}

export interface StartFightOpts {
  /** Fixed key for scripted combat events. Omit to roll a random pool key. */
  key?: Key
  enemyIds?: string[]
  encounterId?: string
  partyCharacterIds?: string[]
  rng?: () => number
}

function beginFight(opts: StartFightOpts = {}): void {
  if (opts.encounterId) {
    currentEncounterId = opts.encounterId
  }
  if (opts.partyCharacterIds) {
    selectedPartyCharacterIds = [...opts.partyCharacterIds]
  }
  const enc = getEncounter(currentEncounterId)
  const enemyIds = opts.enemyIds ?? enc?.enemyIds ?? ["echo"]

  fight = createFight({
    ...opts,
    enemyIds,
    partyCharacterIds: selectedPartyCharacterIds,
  })
  presets = resetPresetCooldowns(presets)
  // Card picks never carry over between fights.
  pendingGroove = null
  pendingMelodyId = null
  // The arrangement follows the fight so the grid, chords and audio
  // preview all sound in the locked combat key.
  arrangement = { ...arrangement, key: { ...fight.key } }
  fight = { ...fight, potency: reconcilePotency(fight.potency, arrangement) }
  gamePhase = "combat"
  emit()
}

/** Start (or restart) a combat. Random key unless `key` is given. */
export function startFight(opts: StartFightOpts = {}): void {
  beginFight(opts)
}

export function resetFight(opts: StartFightOpts = {}): void {
  beginFight(opts)
}

/**
 * C.1 — Number key performer selection.
 * Returns the fighter ID at front-row position `index` (0-based), or null
 * if the slot is empty.  Used by the 1/2/3 keybindings in useWasd.
 */
export function getFrontPerformerId(index: number): string | null {
  return fight.slots.front[index] ?? null
}

/** Save the current melody set as a named preset (duplicate sets share cooldown). */
export function saveMelodyPreset(name: string): void {
  const clean = name.trim()
  if (!clean) return
  presets = savePreset(presets, clean, arrangement, fight.tick).store
  emit()
}

/**
 * Run back a cooled-down preset: restores its tracks + chords and sings them
 * at full strength. Returns false when the preset is missing, deleted, or
 * still cooling down.
 */
export function recallMelodyPreset(hash: string): boolean {
  const found = recallPreset(presets, hash, fight.tick)
  if (!found) return false
  if (found.tracks.length !== arrangement.tracks.length) return false
  arrangement = { ...arrangement, tracks: found.tracks, chords: found.chords }
  fight = { ...fight, potency: refreshPotency(arrangement) }
  emit()
  return true
}

/** Save current arrangement to the persistent melody card bank. */
export function saveToMelodyBank(name: string, description?: string): MelodyTemplate {
  const res = saveTemplate(melodyBank, {
    name,
    description,
    tracks: arrangement.tracks,
    chords: arrangement.chords,
  })
  melodyBank = res.bank
  emit()
  return res.template
}

/** Delete a melody card by ID (drops it from the bag too). */
export function deleteMelodyCard(id: string): void {
  if (!melodyBank[id]) return
  melodyBank = deleteTemplate(melodyBank, id)
  if (loadout.melodies.includes(id)) {
    const rest = loadout.melodies.filter((x) => x !== id)
    loadout = { ...loadout, melodies: rest.length > 0 ? rest : [Object.keys(melodyBank)[0]] }
  }
  if (activeMelodyCardId === id) activeMelodyCardId = null
  saveCardLoadout(loadout)
  emit()
}

/**
 * Snapshot the live loop as a new custom card, bag it, and make it active.
 * This is how a loop sung mid-combat survives the fight.
 */
export function saveCustomMelodyCard(name: string, description?: string): MelodyTemplate | null {
  const clean = name.trim()
  if (!clean) return null
  const res = saveTemplate(melodyBank, {
    name: clean,
    description: description ?? "Saved from the live loop.",
    tracks: arrangement.tracks,
    chords: arrangement.chords,
    tags: ["custom"],
  })
  melodyBank = res.bank
  activeMelodyCardId = res.template.id
  loadout = {
    ...loadout,
    melodies: selectLoadoutId(loadout.melodies, res.template.id, null, MAX_MELODY_CARDS),
  }
  saveCardLoadout(loadout)
  emit()
  return res.template
}

/**
 * Copy-on-write: keep the active card in step with the grid. A preset card
 * is never edited in place — the moment it changes, a custom fork is born
 * and quietly takes its place in the bag.
 */
function syncActiveMelodyCard(): void {
  const id = activeMelodyCardId
  if (id == null) return
  const existing = getTemplate(melodyBank, id)
  if (!existing) {
    activeMelodyCardId = null
    return
  }
  if (isPresetMelodyCard(id)) {
    const res = saveTemplate(melodyBank, {
      name: `${existing.name} (edit)`,
      description: "Forked from a preset the moment you changed it.",
      tracks: arrangement.tracks,
      chords: arrangement.chords,
      tags: ["custom"],
    })
    melodyBank = res.bank
    activeMelodyCardId = res.template.id
    loadout = {
      ...loadout,
      melodies: selectLoadoutId(loadout.melodies, res.template.id, id, MAX_MELODY_CARDS),
    }
  } else {
    melodyBank = updateTemplate(melodyBank, id, {
      tracks: arrangement.tracks,
      chords: arrangement.chords,
    })
  }
  saveCardLoadout(loadout)
}

/** Arrangement edit that also keeps the active melody card in sync (PREP). */
export function mutateMelody(fn: (a: Arrangement) => Arrangement): void {
  arrangement = fn(arrangement)
  if (gamePhase !== "combat") syncActiveMelodyCard()
  emit()
}

/**
 * Load a melody card into the grid. PREP loads it at once; in combat the
 * pick is queued and swaps in on the next loop boundary.
 */
export function selectMelodyCard(id: string): boolean {
  const tpl = getTemplate(melodyBank, id)
  if (!tpl) return false
  if (tpl.tracks.length !== arrangement.tracks.length) return false
  if (gamePhase === "combat") {
    pendingMelodyId = id
    emit()
    return true
  }
  pendingMelodyId = null
  arrangement = withMelody(arrangement, tpl.tracks, tpl.chords)
  activeMelodyCardId = tpl.id
  fight = { ...fight, potency: reconcilePotency(fight.potency, arrangement) }
  emit()
  return true
}

/** Load a template from the melody bank directly into the arrangement grid. */
export function loadMelodyTemplate(id: string): boolean {
  return selectMelodyCard(id)
}

/**
 * Apply any queued mid-combat picks. Called at the loop boundary so a swap
 * always starts on a downbeat.
 */
function applyPendingSwaps(): void {
  if (pendingGroove) {
    arrangement = setGroove(arrangement, pendingGroove)
    saveEquippedGroove(arrangement.groove)
    pendingGroove = null
  }
  if (pendingMelodyId) {
    const tpl = getTemplate(melodyBank, pendingMelodyId)
    if (tpl && tpl.tracks.length === arrangement.tracks.length) {
      arrangement = withMelody(arrangement, tpl.tracks, tpl.chords)
      activeMelodyCardId = tpl.id
      fight = { ...fight, potency: refreshPotency(arrangement) }
    }
    pendingMelodyId = null
  }
}

/**
 * Cast a template from the melody bank during combat via QTE chart.
 * Opens a 16-tick chart carrying the template tracks + chords.
 */
export function requestTemplateChart(id: string): boolean {
  const tpl = getTemplate(melodyBank, id)
  if (!tpl) return false
  if (tpl.tracks.length !== arrangement.tracks.length) return false
  const next = requestPresetInFight(fight, {
    hash: tpl.id,
    tracks: tpl.tracks,
    chords: tpl.chords,
  })
  if (next === fight) return false
  fight = next
  emit()
  return true
}

/**
 * Mid-fight chord swap via QTE: opens a 16-tick chart carrying the new
 * progression. While open, WASD scores the chart (no loop recording).
 * Returns false when busy (another chart open) or the fight is over.
 */
export function requestChordChart(romans: string[]): boolean {
  const next = requestChordInFight(fight, romans)
  if (next === fight) return false
  fight = next
  emit()
  return true
}

/**
 * Mid-fight preset recall via QTE: opens a 16-tick chart carrying the
 * bottled snapshot. Returns false when missing/deleted, cooling down, busy,
 * or the track count no longer fits the stage.
 */
export function requestPresetChart(hash: string): boolean {
  const found = recallPreset(presets, hash, fight.tick)
  if (!found) return false
  if (found.tracks.length !== arrangement.tracks.length) return false
  const next = requestPresetInFight(
    fight,
    { hash, tracks: found.tracks, chords: found.chords },
  )
  if (next === fight) return false
  fight = next
  emit()
  return true
}

/** Score one WASD press against an open song chart (chord/preset only). */
export function pressChartKey(key: "w" | "a" | "s" | "d"): { rating: string; degree?: number } | null {
  if (fight.activeQte?.kind === "parry") return null
  return scoreQtePress(pressQteInFight(fight, key))
}

/** Score one ZXCV press against an open parry chart (holds included). */
export function pressParryKey(key: "z" | "x" | "c" | "v"): { rating: string; degree?: number } | null {
  if (fight.activeQte?.kind !== "parry") return null
  return scoreQtePress(pressQteInFight(fight, key))
}

/** Score one ZXCV release against open parry holds (early = bad). */
export function releaseParryKey(key: "z" | "x" | "c" | "v"): { rating: string; degree?: number } | null {
  if (fight.activeQte?.kind !== "parry") return null
  const before = fight.activeQte?.lastRating
  const next = releaseQteInFight(fight, key)
  if (next !== fight) {
    fight = next
    emit()
    const after = fight.activeQte?.lastRating
    if (after && after !== before && after.rating !== "miss") {
      return { rating: after.rating, degree: after.degree }
    }
  }
  return null
}

function scoreQtePress(next: AtbState): { rating: string; degree?: number } | null {
  const before = fight.activeQte?.lastRating
  if (next !== fight) {
    fight = next
    emit()
    const after = fight.activeQte?.lastRating
    if (after && after !== before && after.rating !== "miss") {
      return { rating: after.rating, degree: after.degree }
    }
  }
  return null
}

/** Abandon the open chart. */
export function cancelChart(reason?: string): void {
  const next = cancelQte(fight, reason)
  if (next !== fight) {
    fight = next
    emit()
  }
}

export function resetAll(): void {
  arrangement = createDefaultArrangement()
  grooveBottles = []
  currentEncounterId = DEFAULT_ENCOUNTER_ID
  fight = createFight({
    key: arrangement.key,
    enemyIds: getEncounter(currentEncounterId)?.enemyIds,
  })
  presets = {}
  melodyBank = createDefaultMelodyBank()
  loadout = createDefaultLoadout()
  activeMelodyCardId = null
  arrangement = setGroove(arrangement, defaultRig())
  pendingGroove = null
  pendingMelodyId = null
  gamePhase = "prep"
  emit()
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
