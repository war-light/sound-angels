// Zustand mirror of the engine session + transport controls.
// Thin view layer: all rules live in src/game, all sound in src/audio.
import { create } from "zustand"
import { auditionEnd, auditionStart } from "@/audio/perform"
import {
  configurePlayer,
  setBpm as playerSetBpm,
  start as playerStart,
  stop as playerStop,
} from "@/audio/player"
import {
  locateStep,
  loopLength,
  setBarChord,
  setBpm,
  setChords,
  setKey,
  toggleDrumStep,
  toggleNoteEvent,
  type Arrangement,
  type NoteEvent,
} from "@/game/arrangement"
import {
  getArrangement,
  getClearedEncounters,
  getCustomChordPresets,
  getEncounterId,
  getFight,
  getGamePhase,
  getMelodyBank,
  getPresets,
  getSelectedParty,
  handleStep,
  loadMelodyTemplate,
  moveFighter,
  mutateArrangement,
  pressChartKey,
  recallMelodyPreset,
  requestChordChart,
  requestPresetChart,
  requestTemplateChart,
  cancelChart,
  resetEncounterProgression,
  resetFight,
  saveCustomChordPreset,
  saveMelodyPreset,
  saveToMelodyBank,
  deleteFromMelodyBank,
  setEncounterId,
  setGamePhase,
  setSelectedParty,
  startFight,
  toMenu,
  toPrep,
  type StartFightOpts,
  subscribe,
  unlockAllEncounters,
} from "@/game/session"
import { beatDegreeFor } from "@/game/qte"
import { beatInstrument, defaultPerformerId, hasLiveAttacker, keeperInstrument, laneAttacker, performSlot } from "@/game/combat"
import {
  cursorDegree,
  HOME_CURSOR,
  moveCursor,
  pressToLen,
  stepMs,
  type PerformCursor,
  type PerformKey,
} from "@/game/perform"
import type { SlotId } from "@/game/positions"
import { degreeToMidi, romanToChord } from "@/game/theory"
import type { PresetStore } from "@/game/presets"
import type { AtbState } from "@/game/combat"
import type { Key } from "@/game/theory"
import type { GamePhase } from "@/game/phase"
import { ENCOUNTERS, type EncounterDef } from "@/data/encounters"
import type { MelodyBank, MelodyTemplate } from "@/game/melodyBank"
import { ROSTER, type CharacterDef } from "@/data/roster"
import type { ChordPreset } from "@/data/chords"

configurePlayer({
  arrangement: getArrangement,
  chordVoice: () => keeperInstrument(getFight()),
  /** Lane i sounds only while front[i] holds a living attacker (else muted). */
  melodyVoice: (slot) => {
    const fight = getFight()
    const attacker = laneAttacker(fight, fight.party, slot)
    return attacker ? (attacker.instrument ?? "strings") : null
  },
  /** Beat seat colors drums + bass with its keeper's instrument, if seated. */
  beatVoice: () => beatInstrument(getFight()),
  onStep: (global) => {
    handleStep()
    useSessionStore.setState({ globalStep: global })
  },
})

interface SessionStore {
  arrangement: Arrangement
  fight: AtbState
  presets: PresetStore
  melodyBank: MelodyBank
  gamePhase: GamePhase
  currentEncounterId: string
  encounters: EncounterDef[]
  clearedEncounterIds: string[]
  selectedPartyIds: string[]
  customChordPresets: ChordPreset[]
  roster: CharacterDef[]
  globalStep: number
  playing: boolean
  starting: boolean
  /** Key picked for the next combat. Null = roll a random pool key. */
  nextKey: Key | null
  /** Live performance cursor + active performer (WASD). */
  cursor: PerformCursor
  performerId: string | null
  togglePlay: (opts?: StartFightOpts) => Promise<void>
  toggleNote: (slot: number, bar: number, step: number, event: NoteEvent | null) => void
  toggleDrum: (voice: "kick" | "snare" | "hat", bar: number, step: number) => void
  setChord: (bar: number, roman: string) => void
  setChords: (romans: string[]) => void
  setBpm: (bpm: number) => void
  setKey: (key: Key) => void
  setRandomKey: () => void
  reset: (opts?: StartFightOpts) => void
  setGamePhase: (phase: GamePhase) => void
  toMenu: () => void
  toPrep: () => void
  selectEncounter: (encounterId: string, force?: boolean) => boolean
  unlockAllEncounters: () => void
  resetEncounterProgression: () => void
  setSelectedParty: (characterIds: string[]) => void
  saveCustomChordPreset: (name: string, romans: string[]) => ChordPreset
  saveToMelodyBank: (name: string, description?: string) => MelodyTemplate
  deleteFromMelodyBank: (id: string) => void
  loadMelodyTemplate: (id: string) => boolean
  castMelodyTemplate: (id: string) => boolean
  moveFighter: (fighterId: string, slot: SlotId | null) => void
  setPerformer: (fighterId: string) => void
  cyclePerformer: () => void
  performDown: (key: PerformKey) => void
  performUp: (key: PerformKey) => void
  saveMelodyPreset: (name: string) => void
  recallMelodyPreset: (hash: string) => boolean
  requestChordChart: (romans: string[]) => boolean
  requestPresetChart: (hash: string) => boolean
  cancelChart: () => void
  /** Drop any half-held WASD presses (lost keyup, blur, stop). */
  releaseAllKeys: () => void
}

// Press start times + the degree each held key will record + where it landed.
const pressStart: Partial<Record<PerformKey, number>> = {}
const pressDegree: Partial<Record<PerformKey, number>> = {}
const pressCell: Partial<Record<PerformKey, { slot: number; bar: number; step: number }>> = {}
/** Running tap count for the beat-keeper arpeggio mapper (always in-chord). */
let beatTaps = 0

/** Forget half-held presses without writing anything. Safe when idle. */
function clearHeldKeys(): void {
  for (const k of Object.keys(pressStart) as PerformKey[]) delete pressStart[k]
  for (const k of Object.keys(pressDegree) as PerformKey[]) delete pressDegree[k]
  for (const k of Object.keys(pressCell) as PerformKey[]) delete pressCell[k]
  auditionEnd()
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  arrangement: getArrangement(),
  fight: getFight(),
  presets: getPresets(),
  melodyBank: getMelodyBank(),
  gamePhase: getGamePhase(),
  currentEncounterId: getEncounterId(),
  encounters: ENCOUNTERS,
  clearedEncounterIds: getClearedEncounters(),
  selectedPartyIds: getSelectedParty(),
  customChordPresets: getCustomChordPresets(),
  roster: ROSTER,
  globalStep: 0,
  playing: false,
  starting: false,
  nextKey: null,
  cursor: HOME_CURSOR,
  performerId: defaultPerformerId(getFight()),

  togglePlay: async (opts) => {
    const { playing, starting, nextKey } = get()
    if (starting) return
    if (playing) {
      playerStop()
      clearHeldKeys()
      set({ playing: false, gamePhase: "prep" })
      return
    }
    set({ starting: true })
    try {
      // Every combat rolls its key: explicit param > picked next key > random.
      startFight({ ...opts, key: opts?.key ?? nextKey ?? undefined })
      set({
        arrangement: getArrangement(),
        fight: getFight(),
        presets: getPresets(),
        melodyBank: getMelodyBank(),
        gamePhase: getGamePhase(),
        currentEncounterId: getEncounterId(),
        globalStep: 0,
        cursor: HOME_CURSOR,
        performerId: defaultPerformerId(getFight()),
      })
      await playerStart()
      playerSetBpm(getArrangement().bpm)
      set({ playing: true })
    } finally {
      set({ starting: false })
    }
  },

  toggleNote: (slot, bar, step, event) =>
    mutateArrangement((a) => toggleNoteEvent(a, slot, bar, step, event)),

  toggleDrum: (voice, bar, step) =>
    mutateArrangement((a) => toggleDrumStep(a, voice, bar, step)),

  setChord: (bar, roman) => mutateArrangement((a) => setBarChord(a, bar, roman)),

  // Pre-fight picks apply instantly; mid-fight swaps open a chart instead.
  setChords: (romans) => {
    if (get().playing) {
      requestChordChart(romans)
      return
    }
    mutateArrangement((a) => setChords(a, romans))
  },

  setBpm: (bpm) => {
    mutateArrangement((a) => setBpm(a, bpm))
    playerSetBpm(get().arrangement.bpm)
  },

  setKey: (key) => {
    mutateArrangement((a) => setKey(a, key))
    set({ nextKey: { ...key } })
  },

  setRandomKey: () => set({ nextKey: null }),

  reset: (opts) => {
    playerStop()
    clearHeldKeys()
    const { nextKey } = get()
    resetFight({ ...opts, key: opts?.key ?? nextKey ?? undefined })
    set({
      playing: false,
      gamePhase: "prep",
      globalStep: 0,
      cursor: HOME_CURSOR,
      performerId: defaultPerformerId(getFight()),
    })
  },

  setGamePhase: (phase) => {
    setGamePhase(phase)
    set({ gamePhase: getGamePhase() })
  },

  toMenu: () => {
    toMenu()
    set({ gamePhase: getGamePhase() })
  },

  toPrep: () => {
    toPrep()
    set({ gamePhase: getGamePhase() })
  },

  selectEncounter: (encounterId, force = false) => {
    const ok = setEncounterId(encounterId, force)
    if (!ok) return false
    const { nextKey, selectedPartyIds } = get()
    resetFight({ encounterId, key: nextKey ?? undefined, partyCharacterIds: selectedPartyIds })
    set({
      currentEncounterId: getEncounterId(),
      fight: getFight(),
      arrangement: getArrangement(),
      gamePhase: "prep",
      performerId: defaultPerformerId(getFight()),
    })
    return true
  },

  unlockAllEncounters: () => {
    unlockAllEncounters()
    set({ clearedEncounterIds: getClearedEncounters() })
  },

  resetEncounterProgression: () => {
    resetEncounterProgression()
    set({
      clearedEncounterIds: getClearedEncounters(),
      currentEncounterId: getEncounterId(),
      fight: getFight(),
      performerId: defaultPerformerId(getFight()),
    })
  },

  setSelectedParty: (characterIds) => {
    setSelectedParty(characterIds)
    set({
      selectedPartyIds: getSelectedParty(),
      fight: getFight(),
      performerId: defaultPerformerId(getFight()),
    })
  },

  saveCustomChordPreset: (name, romans) => {
    const p = saveCustomChordPreset(name, romans)
    set({ customChordPresets: getCustomChordPresets() })
    return p
  },

  saveToMelodyBank: (name, description) => {
    const tpl = saveToMelodyBank(name, description)
    set({ melodyBank: getMelodyBank() })
    return tpl
  },

  deleteFromMelodyBank: (id) => {
    deleteFromMelodyBank(id)
    set({ melodyBank: getMelodyBank() })
  },

  loadMelodyTemplate: (id) => {
    const ok = loadMelodyTemplate(id)
    if (ok) {
      set({ arrangement: getArrangement(), fight: getFight() })
    }
    return ok
  },

  castMelodyTemplate: (id) => {
    return requestTemplateChart(id)
  },

  moveFighter: (fighterId, slot) => {
    moveFighter(fighterId, slot)
    // The lead must stay placed: front attackers or the beat keeper hold it,
    // otherwise the new front lead takes over so WASD never plays the void.
    const { fight, performerId } = get()
    const placed = [...fight.slots.front, ...(fight.slots.beat ? [fight.slots.beat] : [])]
    if (performerId == null || !placed.includes(performerId)) {
      const beatFirst = fight.slots.beat && performerId === fight.slots.beat ? performerId : null
      set({ performerId: beatFirst ?? defaultPerformerId(fight) })
    }
  },

  setPerformer: (fighterId) => set({ performerId: fighterId }),

  cyclePerformer: () => {
    const { fight, performerId } = get()
    // Tab walks front attackers, then the beat keeper (arpeggio voice).
    const line = [...fight.slots.front, ...(fight.slots.beat ? [fight.slots.beat] : [])]
    const full = line.length > 0 ? line : fight.party.map((f) => f.id)
    if (full.length === 0) return
    const i = full.indexOf(performerId ?? "")
    set({ performerId: full[(i + 1) % full.length] })
  },

  performDown: (key) => {
    const { playing, fight, cursor, performerId, arrangement, globalStep } = get()
    if (!playing || pressStart[key] != null || fight.over) return
    // An open chart eats every WASD press: chord/preset charts lock the
    // loop, parry charts score the block. Nothing is recorded while open.
    if (fight.activeQte) {
      pressChartKey(key)
      return
    }
    // Beat-keeper path: WASD maps an always-in-chord arpeggio into the bass
    // grid (keys never leave the key). Works with any seated instrument.
    const beatId = fight.slots.beat
    if (performerId != null && beatId != null && performerId === beatId) {
      const keeper = fight.party.find((f) => f.id === beatId)
      if (!keeper || keeper.hp <= 0) return
      const { bar, step } = locateStep(arrangement, globalStep % loopLength(arrangement))
      const roman = arrangement.chords[bar] ?? "i"
      let chordMidi: number[]
      try {
        chordMidi = romanToChord(fight.key, roman)
      } catch {
        chordMidi = romanToChord(fight.key, "i")
      }
      const degree = beatDegreeFor(fight.key, chordMidi, beatTaps)
      beatTaps += 1
      pressStart[key] = performance.now()
      pressDegree[key] = degree
      pressCell[key] = { slot: -1, bar, step }
      mutateArrangement((a) => ({
        ...a,
        bass: a.bass.map((row, b) => (b === bar ? row.map((v, s) => (s === step ? degree : v)) : [...row])),
      }))
      auditionStart(degreeToMidi(fight.key, degree, 2), keeper.instrument ?? "strings")
      return
    }
    // No living attacker, no performance: keys rest silent with nobody placed.
    if (!hasLiveAttacker(fight)) return
    const next = moveCursor(cursor, key)
    const degree = cursorDegree(next)
    pressStart[key] = performance.now()
    pressDegree[key] = degree
    // The note lands NOW, at the press-time playhead, starting short. The
    // release refines its held length in the same cell.
    const slot = performSlot(fight, performerId)
    const { bar, step } = locateStep(arrangement, globalStep % loopLength(arrangement))
    pressCell[key] = { slot, bar, step }
    mutateArrangement((a) => toggleNoteEvent(a, slot, bar, step, { degree, len: 1 }))
    set({ cursor: next })
    const performer = fight.party.find((f) => f.id === performerId)
    auditionStart(degreeToMidi(fight.key, degree, 5), performer?.instrument ?? "strings")
  },

  performUp: (key) => {
    const started = pressStart[key]
    const degree = pressDegree[key]
    const cell = pressCell[key]
    delete pressStart[key]
    delete pressDegree[key]
    delete pressCell[key]
    auditionEnd()
    if (started == null || degree == null || cell == null) return
    const { arrangement, fight } = get()
    // Beat holds stay short taps (arpeggio steps, not held melody notes).
    if (cell.slot === -1) return
    if (!hasLiveAttacker(fight)) return
    const len = pressToLen(performance.now() - started, stepMs(arrangement.bpm))
    mutateArrangement((a) => toggleNoteEvent(a, cell.slot, cell.bar, cell.step, { degree, len }))
  },

  saveMelodyPreset: (name) => saveMelodyPreset(name),

  recallMelodyPreset: (hash) => {
    // Mid-fight recalls go through the chart; pre-fight restores instantly.
    if (get().playing) return requestPresetChart(hash)
    return recallMelodyPreset(hash)
  },

  requestChordChart: (romans) => requestChordChart(romans),

  requestPresetChart: (hash) => requestPresetChart(hash),

  cancelChart: () => cancelChart(),

  releaseAllKeys: () => {
    clearHeldKeys()
  },
}))

// Mirror engine emissions into React.
subscribe(() => {
  useSessionStore.setState({
    arrangement: getArrangement(),
    fight: getFight(),
    presets: getPresets(),
    melodyBank: getMelodyBank(),
    gamePhase: getGamePhase(),
    currentEncounterId: getEncounterId(),
    clearedEncounterIds: getClearedEncounters(),
    selectedPartyIds: getSelectedParty(),
    customChordPresets: getCustomChordPresets(),
  })
})
