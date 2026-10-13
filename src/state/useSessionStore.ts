// Zustand mirror of the engine session + transport controls.
// Thin view layer: all rules live in src/game, all sound in src/audio.
import { create } from "zustand"
import { auditionEnd, auditionStart } from "@/audio/perform"
import {
  setArrangementProvider,
  setBpm as playerSetBpm,
  setChordVoiceProvider,
  setStepHandler,
  start as playerStart,
  stop as playerStop,
} from "@/audio/player"
import {
  locateStep,
  loopLength,
  setBarChord,
  setBpm,
  setKey,
  toggleDrumStep,
  toggleNoteEvent,
  type Arrangement,
  type NoteEvent,
} from "@/game/arrangement"
import {
  getArrangement,
  getFight,
  handleStep,
  moveFighter,
  mutateArrangement,
  playerStrike,
  resetFight,
  subscribe,
} from "@/game/session"
import { chordInstrument } from "@/game/combat"
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
import { degreeToMidi } from "@/game/theory"
import type { AtbState } from "@/game/combat"
import type { Key } from "@/game/theory"

setArrangementProvider(getArrangement)
setChordVoiceProvider(() => chordInstrument(getFight()))
setStepHandler((global) => {
  handleStep()
  useSessionStore.setState({ globalStep: global })
})

interface SessionStore {
  arrangement: Arrangement
  fight: AtbState
  globalStep: number
  playing: boolean
  starting: boolean
  /** Live performance cursor + active performer (WASD). */
  cursor: PerformCursor
  performerId: string | null
  togglePlay: () => Promise<void>
  toggleNote: (slot: number, bar: number, step: number, event: NoteEvent | null) => void
  toggleDrum: (voice: "kick" | "snare" | "hat", bar: number, step: number) => void
  setChord: (bar: number, roman: string) => void
  setBpm: (bpm: number) => void
  setKey: (key: Key) => void
  doStrike: () => void
  reset: () => void
  moveFighter: (fighterId: string, slot: SlotId | null) => void
  setPerformer: (fighterId: string) => void
  cyclePerformer: () => void
  performDown: (key: PerformKey) => void
  performUp: (key: PerformKey) => void
}

// Press start times + the degree each held key will record.
const pressStart: Partial<Record<PerformKey, number>> = {}
const pressDegree: Partial<Record<PerformKey, number>> = {}

export const useSessionStore = create<SessionStore>((set, get) => ({
  arrangement: getArrangement(),
  fight: getFight(),
  globalStep: 0,
  playing: false,
  starting: false,
  cursor: HOME_CURSOR,
  performerId: null,

  togglePlay: async () => {
    const { playing, starting, arrangement } = get()
    if (starting) return
    if (playing) {
      playerStop()
      set({ playing: false })
      return
    }
    set({ starting: true })
    try {
      await playerStart()
      playerSetBpm(arrangement.bpm)
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

  setBpm: (bpm) => {
    mutateArrangement((a) => setBpm(a, bpm))
    playerSetBpm(get().arrangement.bpm)
  },

  setKey: (key) => mutateArrangement((a) => setKey(a, key)),

  doStrike: () => playerStrike(),

  reset: () => {
    playerStop()
    resetFight()
    set({ playing: false, globalStep: 0, cursor: HOME_CURSOR, performerId: null })
  },

  moveFighter: (fighterId, slot) => moveFighter(fighterId, slot),

  setPerformer: (fighterId) => set({ performerId: fighterId }),

  cyclePerformer: () => {
    const { fight, performerId } = get()
    const front = fight.slots.front.length > 0 ? fight.slots.front : fight.party.map((f) => f.id)
    if (front.length === 0) return
    const i = front.indexOf(performerId ?? "")
    set({ performerId: front[(i + 1) % front.length] })
  },

  performDown: (key) => {
    const { playing, fight, cursor } = get()
    if (!playing || pressStart[key] != null) return
    const next = moveCursor(cursor, key)
    const degree = cursorDegree(next)
    pressStart[key] = performance.now()
    pressDegree[key] = degree
    set({ cursor: next })
    auditionStart(degreeToMidi(fight.key, degree, 5))
  },

  performUp: (key) => {
    const started = pressStart[key]
    const degree = pressDegree[key]
    delete pressStart[key]
    delete pressDegree[key]
    auditionEnd()
    if (started == null || degree == null) return
    const { arrangement, fight, performerId, globalStep } = get()
    const len = pressToLen(performance.now() - started, stepMs(arrangement.bpm))
    const idx = fight.party.findIndex((f) => f.id === performerId)
    const slot = idx >= 0 ? idx % 3 : 0
    const { bar, step } = locateStep(arrangement, globalStep % loopLength(arrangement))
    mutateArrangement((a) => toggleNoteEvent(a, slot, bar, step, { degree, len }))
  },
}))

// Mirror engine emissions into React.
subscribe(() => {
  useSessionStore.setState({
    arrangement: getArrangement(),
    fight: getFight(),
  })
})
