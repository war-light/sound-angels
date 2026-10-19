// Zustand mirror of the engine session + transport controls.
// Thin view layer: all rules live in src/game, all sound in src/audio.
import { create } from "zustand"
import { auditionBlip, auditionEnd, auditionStart } from "@/audio/perform"
import { playQteHit } from "@/audio/sfx"
import { startPreview as startPreviewAudio, stopPreview as stopPreviewAudio, type PreviewLayers } from "@/audio/preview"
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
  getActiveMelodyCardId,
  getArrangement,
  getClearedEncounters,
  getCustomChordPresets,
  getEncounterId,
  getFight,
  getFrontPerformerId,
  getGamePhase,
  getBanks,
  getGrooveBottles,
  getGrooveChoices,
  getKits,
  getLoadout,
  getMelodyCards,
  getMelodyMuted,
  getPendingGroove,
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
  selectBank,
  selectGrooveCard,
  selectKit,
  selectMelodyCard,
  selectPad,
  setEncounterId,
  setGamePhase,
  setSelectedParty,
  startFight,
  toMenu,
  toPrep,
  toStudio,
  toggleLoadoutGroove,
  toggleLoadoutMelody,
  tweakEquippedGroove,
  type StartFightOpts,
  subscribe,
  unlockAllEncounters,
} from "@/game/session"
import type { Bank, DrumKit, DrumVoice, Groove } from "@/game/groove"
import { defaultPerformerId, hasLiveAttacker, keeperInstrument, laneAttacker, performSlot } from "@/game/combat"
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
import { degreeToMidi } from "@/game/theory"
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
    // A chord swap mutes every soloist until the new harmony lands on the bar.
    if (getMelodyMuted()) return null
    const fight = getFight()
    const attacker = laneAttacker(fight, fight.party, slot)
    return attacker ? (attacker.instrument ?? "strings") : null
  },
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
  /** The full rig queued for the next loop boundary, if any. */
  pendingGroove: Groove | null
  /** Bottled rigs built in the Studio. */
  grooveBottles: Groove[]
  /** Everything equippable: the curated presets, then bottles. */
  grooveChoices: Groove[]
  /** The five rhythmic archetype banks the matrix pages through. */
  banks: Bank[]
  /** Every drum kit (free choice, like the swing knob). */
  kits: DrumKit[]
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
  togglePreview: (id: string, arrangement: Arrangement, layers?: PreviewLayers) => void
  stopPreview: () => void
  /** Tweak: the swing knob on the rig (queued to the loop boundary in combat). */
  tweakGroove: (knobs: { swing?: number }) => void
  /** Matrix: swap one voice's clip for another complexity tier. */
  selectPad: (voice: DrumVoice, tier: number) => void
  /** Matrix: page to another bank (pads + feel come with it). */
  selectBank: (id: string) => boolean
  /** Kit: swap drum timbre + combat effect. */
  selectKit: (id: string) => boolean
  /** Compose → bottle: save the equipped groove under a name. */
  saveGrooveBottle: (name: string) => Groove
  deleteGrooveBottle: (id: string) => void
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

/** Forget half-held presses without writing anything. Safe when idle. */
function clearHeldKeys(): void {
  for (const k of Object.keys(pressStart) as QteKey[]) delete pressStart[k]
  for (const k of Object.keys(pressDegree) as PerformKey[]) delete pressDegree[k]
  for (const k of Object.keys(pressCell) as PerformKey[]) delete pressCell[k]
  auditionEnd()
}

/**
 * Tear down anything the transport owns. Leaving the combat screens must call
 * this: the Tone repeat lives outside React, so a phase change alone leaves the
 * loop sounding in the background (and `playing` stuck true).
 */
function haltPlayback(): void {
  playerStop()
  stopPreviewAudio()
  clearHeldKeys()
  useSessionStore.setState({
    playing: false,
    starting: false,
    previewId: null,
    globalStep: 0,
  })
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  arrangement: getArrangement(),
  fight: getFight(),
  melodyCards: getMelodyCards(),
  loadout: getLoadout(),
  activeMelodyCardId: getActiveMelodyCardId(),
  pendingGrooveId: getPendingGrooveId(),
  pendingMelodyId: getPendingMelodyId(),
  pendingGroove: getPendingGroove(),
  grooveBottles: getGrooveBottles(),
  grooveChoices: getGrooveChoices(),
  banks: getBanks(),
  kits: getKits(),
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
      // An audition never survives into a fight: kill it before the loop starts.
      if (get().previewId != null) {
        stopPreviewAudio()
        set({ previewId: null })
      }
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
        pendingGroove: getPendingGroove(),
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
      set({
        arrangement: getArrangement(),
        pendingGrooveId: getPendingGrooveId(),
        pendingGroove: getPendingGroove(),
      })
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

  togglePreview: (id, arrangement, layers) => {
    // One audition at a time: clicking the sounding card stops it, clicking
    // another hands the transport over (the old loop never finishes). A live
    // fight owns the transport — an audition never cuts in mid-combat.
    if (get().playing) return
    if (get().previewId === id) {
      stopPreviewAudio()
      set({ previewId: null })
      return
    }
    set({ previewId: id })
    void startPreviewAudio(id, arrangement, () => {
      if (get().previewId === id) set({ previewId: null })
    }, layers)
  },

  stopPreview: () => {
    stopPreviewAudio()
    set({ previewId: null })
  },

  tweakGroove: (knobs) => {
    tweakEquippedGroove(knobs)
    set({ arrangement: getArrangement() })
  },

  selectPad: (voice, tier) => {
    selectPad(voice, tier)
    set({
      arrangement: getArrangement(),
      pendingGroove: getPendingGroove(),
      pendingGrooveId: getPendingGrooveId(),
    })
  },

  selectBank: (id) => {
    const ok = selectBank(id)
    if (ok) {
      set({
        arrangement: getArrangement(),
        pendingGroove: getPendingGroove(),
        pendingGrooveId: getPendingGrooveId(),
      })
    }
    return ok
  },

  selectKit: (id) => {
    const ok = selectKit(id)
    if (ok) {
      set({
        arrangement: getArrangement(),
        pendingGroove: getPendingGroove(),
        pendingGrooveId: getPendingGrooveId(),
      })
    }
    return ok
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
    haltPlayback()
    const { nextKey } = get()
    resetFight({ ...opts, key: opts?.key ?? nextKey ?? undefined })
    set({
      gamePhase: "prep",
      cursor: HOME_CURSOR,
      performerId: defaultPerformerId(getFight()),
    })
  },

  setGamePhase: (phase) => {
    setGamePhase(phase)
    set({ gamePhase: getGamePhase() })
  },

  toMenu: () => {
    haltPlayback()
    toMenu()
    set({ gamePhase: getGamePhase() })
  },

  toPrep: () => {
    haltPlayback()
    toPrep()
    set({ gamePhase: getGamePhase() })
  },

  toStudio: () => {
    haltPlayback()
    toStudio()
    set({ gamePhase: getGamePhase() })
  },

  selectEncounter: (encounterId, force = false) => {
    const ok = setEncounterId(encounterId, force)
    if (!ok) return false
    // Picking a trial always lands in prep with the transport halted, whether
    // it comes from the menu, the prep list, or the victory overlay.
    haltPlayback()
    const { nextKey, selectedPartyIds } = get()
    resetFight({ encounterId, key: nextKey ?? undefined, partyCharacterIds: selectedPartyIds })
    setGamePhase("prep")
    set({
      currentEncounterId: getEncounterId(),
      fight: getFight(),
      arrangement: getArrangement(),
      gamePhase: getGamePhase(),
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
    // The lead must stay placed: otherwise the new front lead takes over so
    // WASD never plays the void.
    const { fight, performerId } = get()
    if (performerId == null || !fight.slots.front.includes(performerId)) {
      set({ performerId: defaultPerformerId(fight) })
    }
  },

  setPerformer: (fighterId) => set({ performerId: fighterId }),

  selectPerformerByIndex: (index) => {
    const id = getFrontPerformerId(index)
    if (id != null) set({ performerId: id })
  },

  cyclePerformer: () => {
    const { fight, performerId } = get()
    // Tab walks the front attackers.
    const full = fight.slots.front.length > 0 ? fight.slots.front : fight.party.map((f) => f.id)
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
          const instrument = live.party.find((f) => f.id === live.slots.front[0])?.instrument ?? keeperInstrument(live)
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
      // Successful rhythmic hits sound the pitch on the lead attacker.
      const hit = pressChartKey(key)
      if (hit && hit.rating !== "miss") {
        const live = get().fight
        const degree = hit.degree ?? 1
        const instrument = live.party.find((f) => f.id === live.slots.front[0])?.instrument ?? keeperInstrument(live)
        try {
          auditionBlip(degreeToMidi(live.key, degree, 4), instrument)
        } catch {
          // Out-of-range degree: still splash the rating SFX below.
        }
        playQteHit(hit.rating === "sick" ? "sick" : hit.rating === "bad" ? "bad" : "good")
      }
      return
    }
    // WASD records melody notes into the active attacker's lane.
    // ZXCV never records (parry presses returned above).
    if (isParryKey(key)) return
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
    pendingGroove: getPendingGroove(),
    grooveBottles: getGrooveBottles(),
    grooveChoices: getGrooveChoices(),
    gamePhase: getGamePhase(),
    currentEncounterId: getEncounterId(),
    clearedEncounterIds: getClearedEncounters(),
    selectedPartyIds: getSelectedParty(),
    customChordPresets: getCustomChordPresets(),
  })
})
