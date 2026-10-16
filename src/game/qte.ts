// Pure QTE model: FNF-style WASD charts for chord swaps, preset recalls,
// and enemy parries. No audio, no React. All state JSON-serializable.
import { degreeToMidi, type Key } from "./theory"
import type { PerformKey } from "./perform"

export type QteKind = "chord" | "preset" | "parry"

export interface QtePayload {
  /** Chord swap: romans to apply on success. */
  romans?: string[]
  /** Preset recall: content hash to restore on success. */
  hash?: string
  /** Preset snapshot applied on success (tracks + chords). */
  presetTracks?: (import("./arrangement").NoteEvent | null)[][][]
  presetChords?: string[]
  /** Parry: attacking foe + full damage before reduction. */
  foeId?: string
  baseDmg?: number
  chip?: number
}

export interface QteState {
  kind: QteKind
  sequence: PerformKey[]
  /** Next expected index in `sequence`. */
  index: number
  hits: number
  misses: number
  startedTick: number
  deadlineTick: number
  payload: QtePayload
}

const KEYS: PerformKey[] = ["w", "a", "s", "d"]

/** Build a chart from an enemy call-and-response pattern (deterministic w/ rng). */
export function chartFromPattern(pattern: string, length: number, rng: () => number = Math.random): PerformKey[] {
  const out: PerformKey[] = []
  // Pattern seeds the rotation so inversion/retrograde feel distinct.
  let offset = 0
  for (const c of pattern) offset = (offset + c.charCodeAt(0)) % 4
  for (let i = 0; i < length; i++) {
    if (pattern === "swarm") {
      out.push(KEYS[Math.floor(rng() * 4) % 4])
    } else if (pattern === "ostinato") {
      out.push(KEYS[(i * 2 + offset) % 4])
    } else if (pattern === "inversion") {
      out.push(KEYS[(offset - i + 8) % 4])
    } else if (pattern === "erasure") {
      out.push(KEYS[(i + offset) % 4])
    } else {
      // retrograde + fallback: pseudo-random walk.
      out.push(KEYS[Math.floor(rng() * 4) % 4])
    }
  }
  return out
}

/** Random chart for player-triggered QTEs (chord swaps, preset recalls). */
export function randomChart(length: number, rng: () => number = Math.random): PerformKey[] {
  return Array.from({ length }, () => KEYS[Math.floor(rng() * 4) % 4])
}

export function createQte(opts: {
  kind: QteKind
  sequence: PerformKey[]
  startedTick: number
  deadlineTick: number
  payload?: QtePayload
}): QteState {
  if (opts.sequence.length === 0) throw new Error("A QTE needs at least one prompt")
  if (opts.deadlineTick <= opts.startedTick) throw new Error("QTE deadline must be after start")
  return {
    kind: opts.kind,
    sequence: [...opts.sequence],
    index: 0,
    hits: 0,
    misses: 0,
    startedTick: opts.startedTick,
    deadlineTick: opts.deadlineTick,
    payload: { ...(opts.payload ?? {}) },
  }
}

/** Score one WASD press against the chart. Correct -> advance; wrong -> miss. */
export function pressQte(qte: QteState, key: PerformKey): QteState {
  if (qte.index >= qte.sequence.length) return qte
  if (key === qte.sequence[qte.index]) {
    return { ...qte, index: qte.index + 1, hits: qte.hits + 1 }
  }
  return { ...qte, misses: qte.misses + 1 }
}

export function isQteComplete(qte: QteState): boolean {
  return qte.index >= qte.sequence.length
}

export function isQteExpired(qte: QteState, tick: number): boolean {
  return tick >= qte.deadlineTick && !isQteComplete(qte)
}

/** 0..1 fraction of the chart hit (for damage scaling + success checks). */
export function qteSuccessRate(qte: QteState): number {
  if (qte.sequence.length === 0) return 0
  return qte.hits / qte.sequence.length
}

/**
 * Parry damage: perfect play lands on the chip floor, ignoring it deals full
 * base. No QTE (or zero prompts) -> full base, preserving pre-QTE balance.
 */
export function parryDamage(base: number, chip: number, qte: QteState | null): number {
  if (!qte || qte.sequence.length === 0) return Math.max(0, Math.round(base))
  const rate = qteSuccessRate(qte)
  const mult = chip + (1 - chip) * (1 - rate)
  return Math.max(0, Math.round(base * mult))
}

/**
 * Beat-keeper mapping: WASD never leaves the key. Cycle through scale degrees
 * whose pitch class sits inside the current chord (tonic triad fallback).
 * `pressCount` is the running tap count so each key maps an arpeggio step
 * that always fits the base chord.
 */
export function beatDegreeFor(key: Key, chordMidi: number[], pressCount: number): number {
  const pcs = new Set(chordMidi.map((m) => ((m % 12) + 12) % 12))
  const fitting: number[] = []
  for (let degree = 1; degree <= 15; degree++) {
    const pc = ((degreeToMidi(key, degree, 4) % 12) + 12) % 12
    if (pcs.has(pc)) fitting.push(degree)
  }
  const pool = fitting.length > 0 ? fitting : [1, 3, 5, 8]
  return pool[((pressCount % pool.length) + pool.length) % pool.length]
}
