// Pure music-theory helpers, self-contained (zero runtime dependencies).
// No Tone.js, no React, no DOM. All inputs/outputs are JSON-serializable.
//
// NOTE: the stack lists Tonal.js for theory, but every published `tonal`
// release line ships a broken package entry (`main: dist/index.js` does not
// exist), which breaks Vitest externalization and `tsc` alike. For the
// minimal-theory scope (degrees + romans + transpose) a small vendored table
// is more durable. The exported API mirrors the Tonal-backed design so Tonal
// can be dropped back in when its packaging is fixed.

export interface Key {
  /** Pitch class, e.g. "C", "Eb", "F#" */
  tonic: string
  /** Scale name: major/ionian, minor/aeolian, dorian, phrygian, mixolydian, lydian */
  scale: string
  /** Reference octave for degree 1. Defaults to 4. */
  octave?: number
}

export const DEFAULT_KEY: Key = { tonic: "C", scale: "minor", octave: 4 }

const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#",
  "E#": "F", "B#": "C", Fb: "E", Cb: "B",
}

/** Semitone offsets for one octave of each supported scale. */
const SCALE_STEPS: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  ionian: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
}

function refOctave(key: Key): number {
  return key.octave ?? 4
}

/** Normalize a pitch class to sharps, e.g. "Eb" -> "D#". */
function normalizePitchClass(pc: string): string {
  const clean = pc.trim().replace(/s$/, "#").replace(/b$/, "b")
  if (SHARPS.includes(clean)) return clean
  const mapped = FLAT_TO_SHARP[clean]
  if (mapped) return mapped
  // Bare letter like "e" / minor-key lowercase tonic.
  const upper = clean.charAt(0).toUpperCase() + clean.slice(1)
  if (SHARPS.includes(upper)) return upper
  const remapped = FLAT_TO_SHARP[upper]
  if (remapped) return remapped
  throw new Error(`Unknown pitch class: ${pc}`)
}

function scaleSteps(scale: string): number[] {
  const steps = SCALE_STEPS[scale.trim().toLowerCase()]
  if (!steps) throw new Error(`Unknown scale: ${scale}`)
  return steps
}

function tonicMidi(key: Key, octave?: number): number {
  const pc = normalizePitchClass(key.tonic)
  const chroma = SHARPS.indexOf(pc)
  return (octave ?? refOctave(key) + 1) * 12 + chroma
}

/** MIDI number -> pitch class, e.g. 63 -> "D#". */
export function pitchClassOfMidi(midi: number): string {
  return SHARPS[((midi % 12) + 12) % 12]
}

/** MIDI number -> scientific note name, e.g. 60 -> "C4". */
export function midiToNote(midi: number): string {
  return `${pitchClassOfMidi(midi)}${Math.floor(midi / 12) - 1}`
}

/**
 * Scale degree (1-based, may exceed 7 or be <= 0) -> MIDI number.
 * Diatonic: wraps through octaves. Degree 0 and negatives count down.
 */
export function degreeToMidi(key: Key, degree: number, octave?: number): number {
  const steps = scaleSteps(key.scale)
  const base = tonicMidi(key, octave == null ? undefined : octave + 1)
  const idx = degree - 1
  const len = steps.length
  const octaves = Math.floor(idx / len)
  const inner = ((idx % len) + len) % len
  return base + octaves * 12 + steps[inner]
}

const ROMAN_DEGREE: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7,
}

function parseRoman(roman: string): { degree: number; seven: boolean } {
  const clean = roman.trim().replace(/°|dim/gi, "")
  const upper = clean.toUpperCase()
  const seven = /7$/.test(upper)
  const numeral = upper.replace(/7$/, "")
  const degree = ROMAN_DEGREE[numeral]
  if (!degree) throw new Error(`Unknown roman numeral: ${roman}`)
  return { degree, seven }
}

function isMinorScale(scale: string): boolean {
  return /minor|aeolian|dorian|phrygian/i.test(scale)
}

/**
 * Roman numeral (e.g. "i", "VI", "V7") -> MIDI chord tones in the given key.
 * Diatonic triads stacked in thirds; in minor, V/V7 get a raised (major) third
 * so the dominant actually pulls. Returns 3-4 ascending MIDIs near octave 4.
 */
export function romanToChord(key: Key, roman: string): number[] {
  const { degree, seven } = parseRoman(roman)
  const minor = isMinorScale(key.scale)
  const root = degreeToMidi(key, degree)
  let third = degreeToMidi(key, degree + 2)
  const fifth = degreeToMidi(key, degree + 4)
  // Raised leading tone for the dominant in minor keys.
  if (minor && degree === 5) {
    third += 1
  }
  const chord = [root, third, fifth]
  if (seven) {
    // Dominant seventh wants a minor seventh above root.
    chord.push(minor && degree === 5 ? root + 10 : degreeToMidi(key, degree + 6))
  }
  return chord
}

/** Pitch-class set of a key's scale (0..11, C=0). */
function scalePitchClasses(key: Key): Set<number> {
  const steps = scaleSteps(key.scale)
  const tonic = SHARPS.indexOf(normalizePitchClass(key.tonic))
  return new Set(steps.map((s) => (tonic + s) % 12))
}

export type HarmonicFunction = "T" | "SD" | "D"

/** Roman numeral -> harmonic function (Tonic / Subdominant / Dominant). */
export function romanFunction(key: Key, roman: string): HarmonicFunction {
  const { degree } = parseRoman(roman)
  if (isMinorScale(key.scale)) {
    if (degree === 1 || degree === 3) return "T"
    if (degree === 5 || degree === 7) return "D"
    return "SD"
  }
  if (degree === 1 || degree === 3 || degree === 6) return "T"
  if (degree === 5 || degree === 7) return "D"
  return "SD"
}

// --- Chord-progression quality scoring (crafting framework; no gameplay effects yet). ---

export interface ProgressionScore {
  total: number
  voiceLeading: number
  diatonicFit: number
  syntax: number
  tier: "gold" | "silver" | "bronze"
}

function pcDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 12
  return Math.min(d, 12 - d)
}

/**
 * Voice-leading parsimony: for each chord tone, the nearest pitch-class
 * distance to any tone of the previous chord. Lower movement = smoother.
 * Score 0..100 (0 avg semitones -> 100, >= 4 avg -> 0).
 */
export function voiceLeadingScore(chords: number[][]): number {
  if (chords.length < 2) return 100
  let cost = 0
  let voices = 0
  for (let i = 1; i < chords.length; i++) {
    const prev = chords[i - 1].map((m) => ((m % 12) + 12) % 12)
    for (const m of chords[i]) {
      const pc = ((m % 12) + 12) % 12
      cost += Math.min(...prev.map((p) => pcDistance(pc, p)))
      voices += 1
    }
  }
  const avg = cost / Math.max(1, voices)
  return Math.max(0, Math.round(100 - avg * 25))
}

/**
 * Diatonic fit: mean fraction of chord tones inside the key scale (0..100),
 * minus 20 when no tonic x major/minor anchor holds >= 80% of all tones.
 */
export function diatonicFitScore(key: Key, chords: number[][]): number {
  if (chords.length === 0) return 100
  const scale = scalePitchClasses(key)
  const inScale = (m: number) => scale.has(((m % 12) + 12) % 12) ? 1 : 0
  const mean =
    chords.reduce((acc, ch) => acc + ch.reduce((a, m) => a + inScale(m), 0) / Math.max(1, ch.length), 0) /
    chords.length
  const all = chords.flat().map((m) => ((m % 12) + 12) % 12)
  let anchored = false
  for (let t = 0; t < 12 && !anchored; t++) {
    for (const s of ["major", "minor"]) {
      const pcs = scalePitchClasses({ tonic: SHARPS[t], scale: s })
      const fit = all.filter((p) => pcs.has(p)).length / Math.max(1, all.length)
      if (fit >= 0.8) {
        anchored = true
        break
      }
    }
  }
  return Math.max(0, Math.round(mean * 100 - (anchored ? 0 : 20)))
}

const TRANSITION_POINTS: Record<string, number> = {
  "T->SD": 2, "SD->D": 2, "D->T": 3, "T->D": 1, "SD->T": 1,
  "T->T": 0.5, "D->SD": -2, "SD->SD": -1, "D->D": -1,
}

/**
 * Harmonic syntax: rewards T->SD->D->T flow and final tonic resolution,
 * punishes dominant-to-subdominant retrogression and static loops.
 */
export function syntaxScore(key: Key, romans: string[]): number {
  if (romans.length === 0) return 100
  const fns = romans.map((r) => romanFunction(key, r))
  let raw = 0
  for (let i = 1; i < fns.length; i++) {
    raw += TRANSITION_POINTS[`${fns[i - 1]}->${fns[i]}`] ?? 0
  }
  if (fns[0] === "T") raw += 1
  if (fns[fns.length - 1] === "T") raw += 2
  const n = Math.max(1, fns.length - 1)
  // raw ranges roughly [-2n, +3n+3]; normalize to 0..100.
  return Math.max(0, Math.min(100, Math.round((100 * (raw + 2 * n)) / (5 * n + 3))))
}

/** Weighted 40/30/30 blend with effect-unlock tiers (effects land in Phase 3). */
export function scoreProgression(key: Key, romans: string[]): ProgressionScore {
  const chords = romans.map((r) => romanToChord(key, r))
  const voiceLeading = voiceLeadingScore(chords)
  const diatonicFit = diatonicFitScore(key, chords)
  const syntax = syntaxScore(key, romans)
  const total = Math.round(voiceLeading * 0.4 + diatonicFit * 0.3 + syntax * 0.3)
  const tier = total >= 75 ? "gold" : total >= 50 ? "silver" : "bronze"
  return { total, voiceLeading, diatonicFit, syntax, tier }
}
/**
 * 0..1 dissonance of melody notes against a chord.
 * Empty melody -> 0. Non-chord tones count 1, semitone clashes add 0.5 each.
 */
export function tensionOf(melodyMidi: number[], chordMidi: number[]): number {
  if (melodyMidi.length === 0 || chordMidi.length === 0) return 0
  const chordPcs = new Set(chordMidi.map((m) => ((m % 12) + 12) % 12))
  let score = 0
  for (const m of melodyMidi) {
    const chroma = ((m % 12) + 12) % 12
    if (!chordPcs.has(chroma)) score += 1
    for (const c of chordMidi) {
      const dist = Math.abs(m - c) % 12
      if (dist === 1 || dist === 11) {
        score += 0.5
        break
      }
    }
  }
  return Math.min(1, score / (melodyMidi.length * 1.5))
}
