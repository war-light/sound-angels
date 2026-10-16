// Loop arrangement model: music as relative, serializable data.
// Melodies live in per-attacker-slot tracks as NoteEvents (degree + length);
// chords are Roman numerals. Absolute MIDI is resolved only via
// snapshotStep() at the audio boundary.
import { DEFAULT_KEY, degreeToMidi, type Key, romanToChord } from "./theory"

export const STEPS_PER_BAR = 16
export const DEFAULT_BARS = 2
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
  /** Per-voice drum grids: [bar][step] hits. */
  drums: {
    kick: boolean[][]
    snare: boolean[][]
    hat: boolean[][]
  }
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
  const bass = grid<number | null>(bars, steps, null)
  for (let b = 0; b < bars; b++) {
    for (const s of [0, 4, 8, 12]) bass[b][s] = 1
  }
  const kick = grid(bars, steps, false)
  const snare = grid(bars, steps, false)
  const hat = grid(bars, steps, false)
  for (let b = 0; b < bars; b++) {
    for (let s = 0; s < steps; s++) {
      if (s % 4 === 0) kick[b][s] = true
      if (s === 4 || s === 12) snare[b][s] = true
      if (s % 2 === 0) hat[b][s] = true
    }
  }
  return {
    bpm: 90,
    bars,
    stepsPerBar: steps,
    key: { ...DEFAULT_KEY },
    chords: ["i", "VI"],
    tracks,
    bass,
    drums: { kick, snare, hat },
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

export function toggleDrumStep(
  arr: Arrangement,
  voice: keyof Arrangement["drums"],
  bar: number,
  step: number,
): Arrangement {
  checkPos(arr, bar, step)
  const voiceGrid = arr.drums[voice].map((row, b) =>
    b === bar ? row.map((v, s) => (s === step ? !v : v)) : [...row],
  )
  return { ...arr, drums: { ...arr.drums, [voice]: voiceGrid } }
}

export function setBarChord(arr: Arrangement, bar: number, roman: string): Arrangement {
  if (bar < 0 || bar >= arr.bars) throw new Error(`Bar out of range: ${bar}`)
  const chords = arr.chords.map((c, b) => (b === bar ? roman : c))
  return { ...arr, chords }
}

/** Replace the whole progression (preset picker). Cycles/truncates to fit bars. */
export function setChords(arr: Arrangement, romans: string[]): Arrangement {
  if (romans.length === 0) throw new Error("A progression needs at least one chord")
  const chords = Array.from({ length: arr.bars }, (_, b) => romans[b % romans.length])
  return { ...arr, chords }
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

/** Resolved absolute-pitch view of one step. Consumed by the audio renderer. */
export interface StepSnapshot {
  bar: number
  step: number
  chord: number[]
  melodies: MelodyVoice[]
  bass: number | null
  kick: boolean
  snare: boolean
  hat: boolean
}

/** Resolve a single step to absolute MIDI. The only place degrees become pitches. */
export function snapshotStep(arr: Arrangement, bar: number, step: number): StepSnapshot {
  checkPos(arr, bar, step)
  const key = arr.key
  const roman = arr.chords[bar] ?? "i"
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
  return {
    bar,
    step,
    chord,
    melodies,
    bass: bassDeg == null ? null : degreeToMidi(key, bassDeg, 2),
    kick: arr.drums.kick[bar][step] ?? false,
    snare: arr.drums.snare[bar][step] ?? false,
    hat: arr.drums.hat[bar][step] ?? false,
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
