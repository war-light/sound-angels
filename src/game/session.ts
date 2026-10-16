// Session singleton: engine state (arrangement + fight) lives outside React.
// Pure game layer — no Tone.js, no React. UI mirrors it via subscribe().
import {
  createDefaultArrangement,
  type Arrangement,
} from "./arrangement"
import {
  advanceTick,
  cancelQte,
  createFight,
  moveFighter as moveFighterInFight,
  pressQteKey as pressQteInFight,
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
  saveTemplate,
  type MelodyBank,
  type MelodyTemplate,
} from "./melodyBank"
import {
  clearAllPersistedData,
  loadClearedEncounters,
  loadCustomChords,
  loadSelectedParty,
  saveClearedEncounters,
  saveCustomChords,
  saveSelectedParty,
} from "@/persistence/storage"

let arrangement: Arrangement = createDefaultArrangement()
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
/** Game state machine phase: menu -> prep -> combat -> victory / defeat. */
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

export function getPresets(): PresetStore {
  return presets
}

export function getMelodyBank(): MelodyBank {
  return melodyBank
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

/** Save current arrangement to the persistent pre-fight melody bank. */
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

/** Delete a template from the melody bank by ID. */
export function deleteFromMelodyBank(id: string): void {
  melodyBank = deleteTemplate(melodyBank, id)
  emit()
}

/**
 * Load a template from the melody bank directly into the arrangement grid.
 * Clones tracks and chords, updates arrangement, and reconciles potency.
 */
export function loadMelodyTemplate(id: string): boolean {
  const tpl = getTemplate(melodyBank, id)
  if (!tpl) return false
  if (tpl.tracks.length !== arrangement.tracks.length) return false
  arrangement = {
    ...arrangement,
    tracks: tpl.tracks.map((tr) => tr.map((row) => row.map((e) => (e ? { ...e } : null)))),
    chords: [...tpl.chords],
  }
  fight = { ...fight, potency: reconcilePotency(fight.potency, arrangement) }
  emit()
  return true
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

/** Score one WASD press against the open chart. No-op when none is open. */
export function pressChartKey(key: "w" | "a" | "s" | "d"): void {
  const next = pressQteInFight(fight, key)
  if (next !== fight) {
    fight = next
    emit()
  }
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
  currentEncounterId = DEFAULT_ENCOUNTER_ID
  fight = createFight({
    key: arrangement.key,
    enemyIds: getEncounter(currentEncounterId)?.enemyIds,
  })
  presets = {}
  melodyBank = createDefaultMelodyBank()
  gamePhase = "prep"
  emit()
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
