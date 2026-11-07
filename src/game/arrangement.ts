// Loop arrangement model: music as relative, serializable data.
// Melodies live in per-attacker-slot tracks as NoteEvents (degree + length);
// chords are Roman numerals. Absolute MIDI is resolved only via
// snapshotStep() at the audio boundary.
import { DEFAULT_KEY, degreeToMidi, type Key, romanToChord } from "./theory"
import {
  cloneGroove,
  grooveHitVel,
  swingDelaySteps,
  tweakGroove,
  DRUM_VOICES,
  type DrumVoice,
  type Groove,
} from "./groove"
import { defaultRig } from "@/data/beats"

export const STEPS_PER_BAR = 16
export const DEFAULT_BARS = 4
/** Attacker melody slots (stacked characters in Phase 2). */
export const ATTACK_SLOTS = 3

/** A melody onset: scale degree (1-based) held for `len` steps. */
export interface NoteEvent {
  degree: number
  /** Length in steps. 1 = short note, >= 4 = long note. */
  len: number
}

export interface Arrangement {
  bpm: number
  bars: number
  stepsPerBar: number
  key: Key
  /** One Roman numeral per bar, e.g. ["i", "VI", "III", "VII"]. */
  chords: string[]
  /** [slot][bar][step] melody onsets (null = no onset). */
  tracks: (NoteEvent | null)[][][]
  /** [bar][step] bass degrees (1-based) or null rest. */
  bass: (number | null)[][]
  /** The equipped groove. Owns the drum pattern; read-only during a fight. */
  groove: Groove
}

function grid<T>(bars: number, steps: number, fill: T): T[][] {
  return Array.from({ length: bars }, () => Array(steps).fill(fill) as T[])
}

function emptyTracks(bars: number, steps: number): (NoteEvent | null)[][][] {
  return Array.from({ length: ATTACK_SLOTS }, () => grid<NoteEvent | null>(bars, steps, null))
}

/** Default demo loop: C minor, 90bpm, i–VI, seeded melody on slot 0. */
export function createDefaultArrangement(): Arrangement {
  const bars = DEFAULT_BARS
  const steps = STEPS_PER_BAR
  const tracks = emptyTracks(bars, steps)
  const seed: (number | null)[] = [
    1, null, 3, null, 5, null, 3, null,
    4, null, 3, 2, 1, null, null, null,
  ]
  const seed2: (number | null)[] = [
    5, null, 6, null, 5, 4, 3, null,
    2, null, 1, null, null, null, 2, null,
  ]
  tracks[0][0] = seed.map((d) => (d == null ? null : { degree: d, len: 1 }))
  tracks[0][1] = seed2.map((d) => (d == null ? null : { degree: d, len: 1 }))
  // The 4-bar loop repeats the opening 2-bar phrase into its second half.
  if (bars >= 4) {
    tracks[0][2] = seed.map((d) => (d == null ? null : { degree: d, len: 1 }))
    tracks[0][3] = seed2.map((d) => (d == null ? null : { degree: d, len: 1 }))
  }
  const bass = grid<number | null>(bars, steps, null)
  return {
    bpm: 90,
    bars,
    stepsPerBar: steps,
    key: { ...DEFAULT_KEY },
    chords: fitProgression(["i", "VI"], bars),
    tracks,
    bass,
    groove: defaultRig(),
  }
}

function checkSlot(slot: number): void {
  if (slot < 0 || slot >= ATTACK_SLOTS) throw new Error(`Slot out of range: ${slot}`)
}

function checkPos(arr: Arrangement, bar: number, step: number): void {
  if (bar < 0 || bar >= arr.bars) throw new Error(`Bar out of range: ${bar}`)
  if (step < 0 || step >= arr.stepsPerBar) throw new Error(`Step out of range: ${step}`)
}

/** Immutable onset edit on one attacker track (degree, or null to clear). */
export function toggleNoteEvent(
  arr: Arrangement,
  slot: number,
  bar: number,
  step: number,
  event: NoteEvent | null,
): Arrangement {
  checkSlot(slot)
  checkPos(arr, bar, step)
  if (event != null) {
    if (!Number.isInteger(event.degree)) throw new Error(`Bad degree: ${event.degree}`)
    if (!Number.isInteger(event.len) || event.len < 1) {
      throw new Error(`Bad length: ${event.len}`)
    }
  }
  const tracks = arr.tracks.map((tr, sl) =>
    sl === slot
      ? tr.map((row, b) => (b === bar ? row.map((v, s) => (s === step ? event : v)) : [...row]))
      : tr.map((row) => [...row]),
  )
  return { ...arr, tracks }
}

/** Clear every attacker track (track-wipe enemies). */
export function clearTracks(arr: Arrangement): Arrangement {
  return { ...arr, tracks: emptyTracks(arr.bars, arr.stepsPerBar) }
}

/** Count melody onsets across all slots (cooldown scaling, log lines). */
export function countOnsets(arr: Arrangement): number {
  let n = 0
  for (const tr of arr.tracks) {
    for (const row of tr) {
      for (const e of row) if (e != null) n += 1
    }
  }
  return n
}

/** Equip a groove (rig pick or bottle recall). Stores a deep copy. */
export function setGroove(arr: Arrangement, groove: Groove): Arrangement {
  return { ...arr, groove: cloneGroove(groove) }
}

/** Swap in a melody card's tracks + chords (defensive copy). */
export function withMelody(
  arr: Arrangement,
  tracks: (NoteEvent | null)[][][],
  chords: string[],
): Arrangement {
  return {
    ...arr,
    tracks: tracks.map((tr) => tr.map((row) => row.map((e) => (e ? { ...e } : null)))),
    chords: fitProgression(chords, arr.bars),
  }
}

/** Swing knob on the equipped rig. */
export function tweakGrooveKnobs(
  arr: Arrangement,
  knobs: { swing?: number },
): Arrangement {
  return { ...arr, groove: tweakGroove(arr.groove, knobs) }
}

export function setBarChord(arr: Arrangement, bar: number, roman: string): Arrangement {
  if (bar < 0 || bar >= arr.bars) throw new Error(`Bar out of range: ${bar}`)
  const chords = arr.chords.map((c, b) => (b === bar ? roman : c))
  return { ...arr, chords }
}

/** Repeat a Roman progression across `bars` slots (one chord per bar). */
export function fitProgression(romans: string[], bars: number): string[] {
  const clean = romans.length > 0 ? romans : ["i"]
  return Array.from({ length: bars }, (_, b) => clean[b % clean.length])
}

/** Replace the whole progression (preset picker). Cycles/truncates to fit bars. */
export function setChords(arr: Arrangement, romans: string[]): Arrangement {
  if (romans.length === 0) throw new Error("A progression needs at least one chord")
  return { ...arr, chords: fitProgression(romans, arr.bars) }
}

export function setBpm(arr: Arrangement, bpm: number): Arrangement {
  const clamped = Math.min(160, Math.max(50, Math.round(bpm)))
  return { ...arr, bpm: clamped }
}

export function setKey(arr: Arrangement, key: Key): Arrangement {
  return { ...arr, key: { ...key } }
}

/** One resolved melody voice on a step. */
export interface MelodyVoice {
  slot: number
  midi: number
  len: number
  /** Whether the pitch is a chord tone (drives reflect variants + tension). */
  chordTone: boolean
}

/** One drum slot as the audio layer needs it. */
export interface DrumHitSnapshot {
  /** 0 = rest; otherwise 0..1 velocity. */
  vel: number
  /** Extra 32nd sub-hits inside this step. */
  roll: number
}

/** Resolved absolute-pitch view of one step. Consumed by the audio renderer. */
export interface StepSnapshot {
  bar: number
  step: number
  chord: number[]
  melodies: MelodyVoice[]
  bass: number | null
  /** Per-voice drum hits (velocity + roll), always one entry per voice. */
  drums: Record<DrumVoice, DrumHitSnapshot>
  /** Convenience flags for the drum pads/meter. */
  kick: boolean
  snare: boolean
  hat: boolean
  perc: boolean
  /** Timbre id the drums should be played through. */
  kitId: string
  /**
   * Swing lag for the drum voices on this step, in 16th steps. The audio
   * layer multiplies it by the step duration, so the feel holds at any bpm.
   */
  swingDelay: number
}

/** Resolve a single step to absolute MIDI. The only place degrees become pitches. */
export function snapshotStep(arr: Arrangement, bar: number, step: number): StepSnapshot {
  checkPos(arr, bar, step)
  const key = arr.key
  const roman = arr.chords.length > 0 ? arr.chords[bar % arr.chords.length] ?? "i" : "i"
  const chord = romanToChord(key, roman)
  const chordPcs = new Set(chord.map((m) => ((m % 12) + 12) % 12))
  const melodies: MelodyVoice[] = []
  arr.tracks.forEach((tr, slot) => {
    const e = tr[bar][step]
    if (e == null) return
    const midi = degreeToMidi(key, e.degree, 5)
    melodies.push({
      slot,
      midi,
      len: e.len,
      chordTone: chordPcs.has(((midi % 12) + 12) % 12),
    })
  })
  const bassDeg = arr.bass[bar][step]
  const drums = {} as Record<DrumVoice, DrumHitSnapshot>
  for (const voice of DRUM_VOICES) {
    drums[voice] = {
      vel: grooveHitVel(arr.groove, voice, step),
      roll: arr.groove.cell[voice][step]?.roll ?? 0,
    }
  }
  return {
    bar,
    step,
    chord,
    melodies,
    bass: bassDeg == null ? null : degreeToMidi(key, bassDeg, 2),
    drums,
    kick: drums.kick.vel > 0,
    snare: drums.snare.vel > 0,
    hat: drums.hat.vel > 0,
    perc: drums.perc.vel > 0,
    kitId: arr.groove.kitId,
    swingDelay: swingDelaySteps(step, arr.groove.swing),
  }
}

/** Total steps in the loop (bars * stepsPerBar). */
export function loopLength(arr: Arrangement): number {
  return arr.bars * arr.stepsPerBar
}

/** Global step index -> { bar, step }. */
export function locateStep(arr: Arrangement, global: number): { bar: number; step: number } {
  const len = loopLength(arr)
  const g = ((global % len) + len) % len
  return { bar: Math.floor(g / arr.stepsPerBar), step: g % arr.stepsPerBar }
}

/**
 * Canonical hash of a melody set + progression for preset-cooldown dedup.
 * Sorted onset tuples + chords: renames, slot no-ops, and delete-recreate
 * all map to the same hash.
 */
export function hashMelodySet(
  tracks: (NoteEvent | null)[][][],
  chords: string[],
): string {
  const parts = onsetKeysOf(tracks)
  parts.sort()
  parts.push(`chords=${chords.join(",")}`)
  const s = parts.join("|")
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(16).padStart(8, "0")
}

/**
 * Content key of one melody onset. Matches the tuple format used by
 * hashMelodySet so potency tracking and preset dedup agree on identity:
 * same slot/bar/step/degree/len = the same note.
 */
export function onsetKey(slot: number, bar: number, step: number, e: NoteEvent): string {
  return `${slot}:${bar}:${step}:${e.degree}:${e.len}`
}

function onsetKeysOf(tracks: (NoteEvent | null)[][][]): string[] {
  const keys: string[] = []
  tracks.forEach((tr, slot) => {
    tr.forEach((row, bar) => {
      row.forEach((e, step) => {
        if (e != null) keys.push(onsetKey(slot, bar, step, e))
      })
    })
  })
  return keys
}

/** Every onset key currently on the loop. */
export function allOnsetKeys(arr: Arrangement): string[] {
  return onsetKeysOf(arr.tracks)
}
