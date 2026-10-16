// Zustand mirror of the engine session + transport controls.
// Thin view layer: all rules live in src/game, all sound in src/audio.
import { create } from "zustand"
import { auditionBlip, auditionEnd, auditionStart } from "@/audio/perform"
import { playQteHit } from "@/audio/sfx"
import { startPreview as startPreviewAudio, stopPreview as stopPreviewAudio } from "@/audio/preview"
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
  toggleNoteEvent,
  type Arrangement,
  type NoteEvent,
} from "@/game/arrangement"
import {
  deleteGrooveBottle,
  deleteMelodyCard,
  fireFill,
  getActiveMelodyCardId,
  getArrangement,
  getClearedEncounters,
  getCustomChordPresets,
  getEncounterId,
  getFight,
  getFrontPerformerId,
  getGamePhase,
  getGrooveBottles,
  getGrooveChoices,
  getLoadout,
  getMelodyCards,
  getPendingGrooveId,
  getPendingMelodyId,
  getSelectedParty,
  handleStep,
  moveFighter,
  mutateArrangement,
  mutateMelody,
  pressChartKey,
  requestChordChart,
  pressParryKey,
  releaseParryKey,
  cancelChart,
  resetEncounterProgression,
  resetFight,
  saveCustomChordPreset,
  saveCustomMelodyCard,
  saveGrooveBottle,
  selectGrooveCard,
  selectMelodyCard,
  setEncounterId,
  setGamePhase,
  setSelectedParty,
  startFight,
  toMenu,
  toPrep,
  toStudio,
  toggleEquippedGrooveStep,
  toggleLoadoutGroove,
  toggleLoadoutMelody,
  tweakEquippedGroove,
  type StartFightOpts,
  subscribe,
  unlockAllEncounters,
} from "@/game/session"
import type { Groove, GrooveVoice } from "@/game/groove"
import { beatDegreeFor } from "@/game/qte"
import { beatInstrument, defaultPerformerId, hasLiveAttacker, keeperInstrument, laneAttacker, performSlot } from "@/game/combat"
import {
  cursorDegree,
  HOME_CURSOR,
  isParryKey,
  moveCursor,
  pressToLen,
  stepMs,
  type PerformCursor,
  type PerformKey,
  type QteKey,
} from "@/game/perform"
import type { SlotId } from "@/game/positions"
import { degreeToMidi, romanToChord } from "@/game/theory"
import type { AtbState } from "@/game/combat"
import type { Key } from "@/game/theory"
import type { GamePhase } from "@/game/phase"
import { ENCOUNTERS, type EncounterDef } from "@/data/encounters"
import type { Loadout } from "@/game/loadout"
import type { MelodyTemplate } from "@/game/melodyBank"
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
  /** Every melody card in the bank, presets first. */
  melodyCards: MelodyTemplate[]
  /** The card brought into the fight: 1..4 grooves + 1..6 melodies. */
  loadout: Loadout
  /** Card currently loaded in the grid (null = an unsaved loop). */
  activeMelodyCardId: string | null
  /** Mid-combat picks waiting for the next loop boundary. */
  pendingGrooveId: string | null
  pendingMelodyId: string | null
  /** Bottled grooves built in the Studio. */
  grooveBottles: Groove[]
  /** Everything equippable: the five cards, then bottles. */
  grooveChoices: Groove[]
  /** Id of the one-loop audition currently sounding (null = silent). */
  previewId: string | null
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
  /** Pick: equip a groove card (queued to the loop boundary in combat). */
  selectGrooveCard: (id: string) => boolean
  /** Pick: load a melody card (queued to the loop boundary in combat). */
  selectMelodyCard: (id: string) => boolean
  /** Bag: add/remove a groove card (1..4). */
  toggleLoadoutGroove: (id: string) => void
  /** Bag: add/remove a melody card (1..6). */
  toggleLoadoutMelody: (id: string) => void
  /** Snapshot the live loop as a custom card, bag it, and select it. */
  saveCustomMelodyCard: (name: string, description?: string) => MelodyTemplate | null
  deleteMelodyCard: (id: string) => void
  /** Audition a loop once. Clicking the sounding id stops it. */
  togglePreview: (id: string, arrangement: Arrangement) => void
  stopPreview: () => void
  /** Tweak: swing / density knobs on the equipped groove. */
  tweakGroove: (knobs: { swing?: number; density?: number }) => void
  /** Compose: flip one step of the equipped groove (Studio). */
  toggleGrooveStep: (voice: GrooveVoice, step: number) => void
  /** Compose → bottle: save the equipped groove under a name. */
  saveGrooveBottle: (name: string) => Groove
  deleteGrooveBottle: (id: string) => void
  /** Combat: slam the kit (burst + wider parry window) when off cooldown. */
  fireFill: () => boolean
  setChord: (bar: number, roman: string) => void
  setChords: (romans: string[]) => void
  setBpm: (bpm: number) => void
  setKey: (key: Key) => void
  setRandomKey: () => void
  reset: (opts?: StartFightOpts) => void
  setGamePhase: (phase: GamePhase) => void
  toMenu: () => void
  toPrep: () => void
  toStudio: () => void
  selectEncounter: (encounterId: string, force?: boolean) => boolean
  unlockAllEncounters: () => void
  resetEncounterProgression: () => void
  setSelectedParty: (characterIds: string[]) => void
  saveCustomChordPreset: (name: string, romans: string[]) => ChordPreset
  moveFighter: (fighterId: string, slot: SlotId | null) => void
  setPerformer: (fighterId: string) => void
  /** C.1 — Select the front-row performer at position 0/1/2 (number keys 1/2/3). */
  selectPerformerByIndex: (index: number) => void
  cyclePerformer: () => void
  performDown: (key: QteKey) => void
  performUp: (key: QteKey) => void
  requestChordChart: (romans: string[]) => boolean
  cancelChart: () => void
  /** Drop any half-held WASD presses (lost keyup, blur, stop). */
  releaseAllKeys: () => void
}

// Press start times + the degree each held key will record + where it landed.
// ZXCV parry presses only mark the key (repeat guard); holds live in QTE state.
const pressStart: Partial<Record<QteKey, number>> = {}
const pressDegree: Partial<Record<PerformKey, number>> = {}
const pressCell: Partial<Record<PerformKey, { slot: number; bar: number; step: number }>> = {}
/** Running tap count for the beat-keeper arpeggio mapper (always in-chord). */
let beatTaps = 0

/** Forget half-held presses without writing anything. Safe when idle. */
function clearHeldKeys(): void {
  for (const k of Object.keys(pressStart) as QteKey[]) delete pressStart[k]
  for (const k of Object.keys(pressDegree) as PerformKey[]) delete pressDegree[k]
  for (const k of Object.keys(pressCell) as PerformKey[]) delete pressCell[k]
  auditionEnd()
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  arrangement: getArrangement(),
  fight: getFight(),
  melodyCards: getMelodyCards(),
  loadout: getLoadout(),
  activeMelodyCardId: getActiveMelodyCardId(),
  pendingGrooveId: getPendingGrooveId(),
  pendingMelodyId: getPendingMelodyId(),
  grooveBottles: getGrooveBottles(),
  grooveChoices: getGrooveChoices(),
  previewId: null,
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
        melodyCards: getMelodyCards(),
        loadout: getLoadout(),
        activeMelodyCardId: getActiveMelodyCardId(),
        pendingGrooveId: getPendingGrooveId(),
        pendingMelodyId: getPendingMelodyId(),
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
    mutateMelody((a) => toggleNoteEvent(a, slot, bar, step, event)),

  selectGrooveCard: (id) => {
    const ok = selectGrooveCard(id)
    if (ok) {
      set({ arrangement: getArrangement(), pendingGrooveId: getPendingGrooveId() })
    }
    return ok
  },

  selectMelodyCard: (id) => {
    const ok = selectMelodyCard(id)
    if (ok) {
      set({
        arrangement: getArrangement(),
        fight: getFight(),
        activeMelodyCardId: getActiveMelodyCardId(),
        pendingMelodyId: getPendingMelodyId(),
        melodyCards: getMelodyCards(),
        loadout: getLoadout(),
      })
    }
    return ok
  },

  toggleLoadoutGroove: (id) => {
    toggleLoadoutGroove(id)
    set({ loadout: getLoadout() })
  },

  toggleLoadoutMelody: (id) => {
    toggleLoadoutMelody(id)
    set({ loadout: getLoadout() })
  },

  saveCustomMelodyCard: (name, description) => {
    const tpl = saveCustomMelodyCard(name, description)
    set({
      melodyCards: getMelodyCards(),
      loadout: getLoadout(),
      activeMelodyCardId: getActiveMelodyCardId(),
    })
    return tpl
  },

  deleteMelodyCard: (id) => {
    deleteMelodyCard(id)
    set({
      melodyCards: getMelodyCards(),
      loadout: getLoadout(),
      activeMelodyCardId: getActiveMelodyCardId(),
    })
  },

  togglePreview: (id, arrangement) => {
    // One audition at a time: clicking the sounding card stops it, clicking
    // another hands the transport over (the old loop never finishes).
    if (get().previewId === id) {
      stopPreviewAudio()
      set({ previewId: null })
      return
    }
    set({ previewId: id })
    void startPreviewAudio(id, arrangement, () => {
      if (get().previewId === id) set({ previewId: null })
    })
  },

  stopPreview: () => {
    stopPreviewAudio()
    set({ previewId: null })
  },

  tweakGroove: (knobs) => {
    tweakEquippedGroove(knobs)
    set({ arrangement: getArrangement() })
  },

  toggleGrooveStep: (voice, step) => {
    toggleEquippedGrooveStep(voice, step)
    set({ arrangement: getArrangement() })
  },

  saveGrooveBottle: (name) => {
    const bottle = saveGrooveBottle(name)
    set({
      arrangement: getArrangement(),
      grooveBottles: getGrooveBottles(),
      grooveChoices: getGrooveChoices(),
      loadout: getLoadout(),
    })
    return bottle
  },

  deleteGrooveBottle: (id) => {
    deleteGrooveBottle(id)
    set({
      grooveBottles: getGrooveBottles(),
      grooveChoices: getGrooveChoices(),
      loadout: getLoadout(),
    })
  },

  fireFill: () => {
    const fired = fireFill()
    if (fired) set({ fight: getFight(), gamePhase: getGamePhase() })
    return fired
  },

  setChord: (bar, roman) => mutateMelody((a) => setBarChord(a, bar, roman)),

  // Pre-fight picks apply instantly; mid-fight swaps open a chart instead.
  setChords: (romans) => {
    if (get().playing) {
      requestChordChart(romans)
      return
    }
    mutateMelody((a) => setChords(a, romans))
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

  toStudio: () => {
    toStudio()
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

  selectPerformerByIndex: (index) => {
    const id = getFrontPerformerId(index)
    if (id != null) set({ performerId: id })
  },

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
    // Parry charts live on ZXCV: score the block (holds drone while held).
    // WASD falls through to loop recording — singing never stops to block.
    if (fight.activeQte?.kind === "parry") {
      if (isParryKey(key)) {
        pressStart[key] = performance.now()
        const hit = pressParryKey(key)
        if (hit && hit.rating !== "miss") {
          const live = get().fight
          const degree = hit.degree ?? 1
          const instrument = beatInstrument(live) ?? live.party.find((f) => f.id === live.slots.front[0])?.instrument ?? null
          try {
            auditionStart(degreeToMidi(live.key, degree, 4), instrument ?? "strings")
          } catch {
            // Out-of-range degree: still splash the rating SFX below.
          }
          playQteHit(hit.rating === "sick" ? "sick" : hit.rating === "bad" ? "bad" : "good")
        }
        return
      }
    } else if (fight.activeQte) {
      // An open song chart eats WASD presses: chord/preset charts lock the
      // loop. Nothing is recorded while open. ZXCV has no song meaning.
      if (isParryKey(key)) return
      // Successful rhythmic hits sound the pitch on the back-beat keeper.
      const hit = pressChartKey(key)
      if (hit && hit.rating !== "miss") {
        const live = get().fight
        const degree = hit.degree ?? 1
        const instrument = beatInstrument(live) ?? live.party.find((f) => f.id === live.slots.front[0])?.instrument ?? null
        try {
          auditionBlip(degreeToMidi(live.key, degree, 4), instrument)
        } catch {
          // Out-of-range degree: still splash the rating SFX below.
        }
        playQteHit(hit.rating === "sick" ? "sick" : hit.rating === "bad" ? "bad" : "good")
      }
      return
    }
    // Beat-keeper path: WASD maps an always-in-chord arpeggio into the bass
    // grid (keys never leave the key). Works with any seated instrument.
    // ZXCV never records (parry presses returned above).
    if (isParryKey(key)) return
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
    // Parry releases score open holds (early = bad). Blur clears silently
    // via releaseAllKeys; unreleased holds auto-complete at their tails.
    if (isParryKey(key)) {
      if (pressStart[key] == null) return
      delete pressStart[key]
      auditionEnd()
      const hit = releaseParryKey(key)
      if (hit && hit.rating !== "miss") {
        playQteHit(hit.rating === "sick" ? "sick" : hit.rating === "bad" ? "bad" : "good")
      }
      return
    }
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

  requestChordChart: (romans) => requestChordChart(romans),

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
    melodyCards: getMelodyCards(),
    loadout: getLoadout(),
    activeMelodyCardId: getActiveMelodyCardId(),
    pendingGrooveId: getPendingGrooveId(),
    pendingMelodyId: getPendingMelodyId(),
    grooveBottles: getGrooveBottles(),
    grooveChoices: getGrooveChoices(),
    gamePhase: getGamePhase(),
    currentEncounterId: getEncounterId(),
    clearedEncounterIds: getClearedEncounters(),
    selectedPartyIds: getSelectedParty(),
    customChordPresets: getCustomChordPresets(),
  })
})
