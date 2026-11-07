// Stage music model: fixed-length, chord-relative clips that are safe in any
// combination (Incredibox-style). Pure TS — no Tone.js, no React, no DOM.
//
// The rules that make every mix work live here, once:
//   - Time:      one tempo, one loop length (4 bars x 16 steps) for every clip.
//   - Harmony:   pitched clips store chord-tone ladder indices, never pitches.
//                The hichord picks the chord; every clip re-voices itself.
//   - Register:  each role owns a pitch band (ROLE_SPECS). Only bass goes low.
//   - Space:     each role owns a rhythmic window (lead = call, counter = answer).
//   - Changes:   notes never cross a bar line, so a chord change is always safe.
//
// `src/data/stageClips.lint.test.ts` checks the shipped clips against all of
// this for every key, chord and clip pairing.
import { DRUM_VOICES, parsePattern, type ClipSteps, type DrumVoice } from "./groove"
import { degreeToMidi, romanFunction, type HarmonicFunction, type Key } from "./theory"

export const STAGE_BPM = 170
export const STAGE_BARS = 4
export const STAGE_STEPS_PER_BAR = 16
export const STAGE_LOOP_STEPS = STAGE_BARS * STAGE_STEPS_PER_BAR

export const ROLES = ["breaks", "bass", "harmony", "lead", "counter"] as const
export type Role = (typeof ROLES)[number]
export type PitchedRole = Exclude<Role, "breaks">
export const PITCHED_ROLES: readonly PitchedRole[] = ["bass", "harmony", "lead", "counter"]

export interface RoleSpec {
  label: string
  /** "root": ladder starts on the chord root. "floor": on the lowest chord tone >= floor. */
  anchor: "root" | "floor"
  /** Lowest ladder pitch (MIDI). Ornaments may dip 2 semitones below. */
  floor: number
  /** Highest pitch the role may ever sound (MIDI). */
  ceiling: number
  /** In-bar steps where the role may never start a note (bass ducks the snare). */
  blockedSteps: number[]
  /** Per bar of the loop: the [from, to) in-bar steps notes may sound in. */
  windows: [number, number][]
}

const FULL: [number, number][] = [[0, 16], [0, 16], [0, 16], [0, 16]]

export const ROLE_SPECS: Record<PitchedRole, RoleSpec> = {
  bass: { label: "Bass", anchor: "root", floor: 29, ceiling: 52, blockedSteps: [4, 8, 12], windows: FULL },
  harmony: { label: "Harmony", anchor: "floor", floor: 53, ceiling: 79, blockedSteps: [], windows: FULL },
  // Call: bars 1 and 3, plus a pickup into the answer bars.
  lead: { label: "Lead", anchor: "floor", floor: 72, ceiling: 96, blockedSteps: [], windows: [[0, 16], [12, 16], [0, 16], [12, 16]] },
  // Answer: bars 2 and 4, clearing out before the lead's pickup.
  counter: { label: "Counter", anchor: "floor", floor: 62, ceiling: 84, blockedSteps: [], windows: [[0, 0], [0, 12], [0, 0], [0, 12]] },
}

// ---------------------------------------------------------------------------
// Hichord: 7 diatonic chords + one modifier.
// ---------------------------------------------------------------------------

export const CHORD_MODS = ["none", "seventh", "sus", "flip"] as const
export type ChordMod = (typeof CHORD_MODS)[number]

export interface ChordPick {
  /** Scale degree 1..7. */
  degree: number
  mod: ChordMod
}

export const TONIC: ChordPick = { degree: 1, mod: "none" }

const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"]

export function pc(midi: number): number {
  return ((midi % 12) + 12) % 12
}

function isMinorKey(key: Key): boolean {
  return /minor|aeolian|dorian|phrygian/i.test(key.scale)
}

export function sameChord(a: ChordPick, b: ChordPick): boolean {
  return a.degree === b.degree && a.mod === b.mod
}

/**
 * Chord tones near octave 4: root, third (or sus 4th), fifth, plus the
 * seventh when asked. Minor keys raise the dominant's third, like theory.ts.
 * "flip" swaps major/minor and straightens a diminished fifth.
 */
export function chordTones(key: Key, pick: ChordPick): number[] {
  const d = pick.degree
  const root = degreeToMidi(key, d)
  let third = degreeToMidi(key, d + 2)
  let fifth = degreeToMidi(key, d + 4)
  if (isMinorKey(key) && d === 5) third += 1
  if (pick.mod === "flip") {
    third = third - root === 3 ? third + 1 : third - 1
    if (fifth - root === 6) fifth += 1
  }
  if (pick.mod === "sus") third = root + 5
  const tones = [root, third, fifth]
  if (pick.mod === "seventh") {
    tones.push(isMinorKey(key) && d === 5 ? root + 10 : degreeToMidi(key, d + 6))
  }
  return tones
}

/** Roman-numeral label with quality, e.g. "i", "V7", "ii°", "IVsus4". */
export function chordLabel(key: Key, pick: ChordPick): string {
  const [root, third, fifth] = chordTones(key, pick)
  const numeral = NUMERALS[pick.degree - 1] ?? "I"
  if (pick.mod === "sus") return `${numeral}sus4`
  let label = third - root === 3 ? numeral.toLowerCase() : numeral
  if (fifth - root === 6) label += "°"
  if (fifth - root === 8) label += "+"
  if (pick.mod === "seventh") label += "7"
  return label
}

/** Tonic / Subdominant / Dominant: what the chord does in the key. */
export function chordFunction(key: Key, pick: ChordPick): HarmonicFunction {
  return romanFunction(key, NUMERALS[pick.degree - 1] ?? "I")
}

function scalePitchClasses(key: Key): Set<number> {
  const out = new Set<number>()
  for (let d = 1; d <= 7; d++) out.add(pc(degreeToMidi(key, d)))
  return out
}

/** Next pitch of the key's scale above (dir 1) or below (dir -1) `midi`. */
export function scaleNeighbor(key: Key, midi: number, dir: 1 | -1): number {
  const scale = scalePitchClasses(key)
  let m = midi + dir
  while (!scale.has(pc(m))) m += dir
  return m
}

/** Every pitch from `start` upward whose pitch class is in `pcs`. */
export function ladder(pcs: number[], start: number, length = 16): number[] {
  const set = new Set(pcs.map(pc))
  const out: number[] = []
  for (let m = start; out.length < length && m < 128; m++) {
    if (set.has(pc(m))) out.push(m)
  }
  return out
}

// ---------------------------------------------------------------------------
// Clips
// ---------------------------------------------------------------------------

export type PitchedEvent =
  /** One chord tone: ladder index from the role's anchor. */
  | { kind: "tone"; step: number; len: number; vel: number; index: number }
  /** Scale neighbor of ladder tone `index` (passing / neighbor tone). */
  | { kind: "orn"; step: number; len: number; vel: number; index: number; dir: 1 | -1 }
  /** The whole chord in close position from the role's anchor. */
  | { kind: "chord"; step: number; len: number; vel: number }

/** Per-bar combat effect of a clip while it plays. */
export interface ClipEffect {
  damage?: number
  shield?: number
  heal?: number
  /** % extra damage the focused foe takes until the next loop. */
  expose?: number
}

interface ClipBase {
  id: string
  name: string
  blurb: string
  effect: ClipEffect
}

export interface BreaksClip extends ClipBase {
  role: "breaks"
  /** 64 steps per drum voice. */
  drums: Record<DrumVoice, ClipSteps>
}

export interface PitchedClip extends ClipBase {
  role: PitchedRole
  events: PitchedEvent[]
}

export type StageClip = BreaksClip | PitchedClip

/** 1, 2 or 4 bar strings tile to 4 bars. Spaces are ignored. */
function tileBars(bars: string[]): string[] {
  const clean = bars.map((b) => b.replace(/\s+/g, ""))
  if (![1, 2, 4].includes(clean.length)) {
    throw new Error(`A clip needs 1, 2 or 4 bars, got ${clean.length}`)
  }
  const out = Array.from({ length: STAGE_BARS }, (_, i) => clean[i % clean.length])
  for (const bar of out) {
    if (bar.length !== STAGE_STEPS_PER_BAR) {
      throw new Error(`A bar needs ${STAGE_STEPS_PER_BAR} steps, got ${bar.length}: "${bar}"`)
    }
  }
  return out
}

/**
 * Pitched notation, one 16-char string per bar:
 *   0-9  chord tone (ladder index)   u / d  scale step above / below the last tone
 *   X x  full chord (accent / soft)  -  hold        .  rest
 * A hold can never start a bar, so no note crosses a bar line.
 */
export function parsePitched(bars: string[]): PitchedEvent[] {
  const events: PitchedEvent[] = []
  let lastIndex: number | null = null
  tileBars(bars).forEach((bar, b) => {
    let open: PitchedEvent | null = null
    ;[...bar].forEach((ch, i) => {
      const step = b * STAGE_STEPS_PER_BAR + i
      if (ch === "-") {
        if (!open) throw new Error(`Hold with nothing to hold at bar ${b + 1}, step ${i + 1}`)
        open.len += 1
        return
      }
      open = null
      if (ch === ".") return
      let ev: PitchedEvent
      if (/[0-9]/.test(ch)) {
        lastIndex = Number(ch)
        ev = { kind: "tone", step, len: 1, vel: 0.8, index: lastIndex }
      } else if (ch === "u" || ch === "d") {
        if (lastIndex == null) throw new Error(`Ornament "${ch}" needs a tone before it`)
        ev = { kind: "orn", step, len: 1, vel: 0.6, index: lastIndex, dir: ch === "u" ? 1 : -1 }
      } else if (ch === "X" || ch === "x") {
        ev = { kind: "chord", step, len: 1, vel: ch === "X" ? 0.9 : 0.6 }
      } else {
        throw new Error(`Unknown note glyph "${ch}"`)
      }
      events.push(ev)
      open = ev
    })
  })
  return events
}

/** Drum notation (see groove.ts): one string per bar, or one bar tiled. */
export function parseDrums(rows: Record<DrumVoice, string[]>): Record<DrumVoice, ClipSteps> {
  const out = {} as Record<DrumVoice, ClipSteps>
  for (const voice of DRUM_VOICES) {
    out[voice] = tileBars(rows[voice]).flatMap((bar) => parsePattern(bar))
  }
  return out
}

// ---------------------------------------------------------------------------
// Resolution: the only place ladder indices become pitches.
// ---------------------------------------------------------------------------

function rolePitchClasses(role: PitchedRole, key: Key, pick: ChordPick): number[] {
  const tones = chordTones(key, pick)
  // Only the harmony voices the seventh; lines keep their triad shape.
  return role === "harmony" ? tones : tones.slice(0, 3)
}

function roleLadder(role: PitchedRole, key: Key, pick: ChordPick): number[] {
  const spec = ROLE_SPECS[role]
  const pcs = rolePitchClasses(role, key, pick)
  if (spec.anchor === "floor") return ladder(pcs, spec.floor)
  let start = spec.floor
  while (pc(start) !== pc(pcs[0])) start += 1
  return ladder(pcs, start)
}

/** MIDI pitches one event sounds under `pick`. */
export function eventPitches(role: PitchedRole, ev: PitchedEvent, key: Key, pick: ChordPick): number[] {
  const steps = roleLadder(role, key, pick)
  if (ev.kind === "chord") return steps.slice(0, rolePitchClasses(role, key, pick).length)
  const base = steps[ev.index]
  return ev.kind === "tone" ? [base] : [scaleNeighbor(key, base, ev.dir)]
}

export interface DrumHit {
  vel: number
  roll: number
}

export interface StepNote {
  role: PitchedRole
  midis: number[]
  /** Length in steps. */
  len: number
  vel: number
}

export interface StepRender {
  drums: Record<DrumVoice, DrumHit> | null
  notes: StepNote[]
}

/** Everything that starts on `loopStep` (0..63) for the active clips. */
export function renderStep(clips: StageClip[], key: Key, pick: ChordPick, loopStep: number): StepRender {
  let drums: Record<DrumVoice, DrumHit> | null = null
  const notes: StepNote[] = []
  for (const clip of clips) {
    if (clip.role === "breaks") {
      drums = {} as Record<DrumVoice, DrumHit>
      for (const voice of DRUM_VOICES) {
        const hit = clip.drums[voice][loopStep]
        drums[voice] = { vel: hit?.vel ?? 0, roll: hit?.roll ?? 0 }
      }
      continue
    }
    for (const ev of clip.events) {
      if (ev.step !== loopStep) continue
      notes.push({ role: clip.role, midis: eventPitches(clip.role, ev, key, pick), len: ev.len, vel: ev.vel })
    }
  }
  return { drums, notes }
}
