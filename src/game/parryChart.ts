// Generative parry charts: cell-based 1–2 loop ZXCV musical motifs.
// Pure game logic (no audio, no React). Everything is seeded via `rng`
// so combat stays deterministic in tests.
//
// All generation, contours, and transformations operate in physical
// lane space: 0 = Z (low/root), 1 = X (mid-low), 2 = C (mid-high), 3 = V (high).
// Pitches and chord consonance are evaluated dynamically at runtime.
import { stepMs, type ParryKey } from "./perform"
import { DEFAULT_KEY, degreeToMidi, romanToChord, type Key } from "./theory"
import type { QteChart, QteNote } from "./qte"
import type { NoteEvent } from "./arrangement"

/** Lane order left→right on the highway (0=z, 1=x, 2=c, 3=v). */
export const PARRY_LANES: ParryKey[] = ["z", "x", "c", "v"]

export function laneToParryKey(lane: number): ParryKey {
  const clamped = Math.max(0, Math.min(3, Math.round(lane)))
  return PARRY_LANES[clamped] ?? "z"
}

export function parryKeyToLane(key: ParryKey): number {
  const idx = PARRY_LANES.indexOf(key)
  return idx >= 0 ? idx : 0
}

/**
 * Scale degree → ZXCV lane.
 * Low/Root (1) → Z (lane 0)
 * Lower-mid (2–3) → X (lane 1)
 * Upper-mid (4–5) → C (lane 2)
 * High/Leap (6–7+) → V (lane 3)
 */
export function degreeToParryLane(degree: number): ParryKey {
  if (degree >= 8) return "v"
  const norm = (((Math.round(degree) - 1) % 7) + 7) % 7 + 1
  if (norm === 1) return "z"
  if (norm <= 3) return "x"
  if (norm <= 5) return "c"
  return "v"
}

/**
 * Tunables shaping one enemy's parry motif. Stored per pattern with an
 * optional per-enemy override (see EnemyProfile.parry).
 */
export interface ParryMotifParams {
  /** Target note count per loop (before clamping to the span). */
  density: number
  /** Minimum wall-clock gap between note heads. */
  minGapMs: number
  /** Fraction of notes converted to holds (0..1). */
  holdRatio: number
  /** Hold length range, in quarter-note beats. */
  holdLenBeats: [number, number]
  /** Lane pick weights (default 1). */
  laneBias: Partial<Record<ParryKey, number>>
  /** When true, same-lane double taps are allowed (swarm bursts). */
  bursts: boolean
  /** Melodic contour of the lane walk. */
  contour: "up" | "down" | "arc" | "mixed"
}

export const DEFAULT_PARRY_PARAMS: ParryMotifParams = {
  density: 5,
  minGapMs: 600,
  holdRatio: 0.2,
  holdLenBeats: [1, 2],
  laneBias: {},
  bursts: false,
  contour: "mixed",
}

/** Per-pattern character. Enemies point at these by `pattern`. */
export const PARRY_MOTIFS: Record<string, ParryMotifParams> = {
  // Horde rush: dense bursts, few holds.
  swarm: {
    density: 6,
    minGapMs: 400,
    holdRatio: 0.1,
    holdLenBeats: [1, 1],
    laneBias: { v: 1.4, c: 1.2 },
    bursts: true,
    contour: "mixed",
  },
  // Tank march: steady quarters, long arcs held.
  ostinato: {
    density: 4,
    minGapMs: 650,
    holdRatio: 0.3,
    holdLenBeats: [1, 2],
    laneBias: {},
    bursts: false,
    contour: "down",
  },
  // Mirror descent: arch contour, mirrored in response.
  inversion: {
    density: 5,
    minGapMs: 550,
    holdRatio: 0.2,
    holdLenBeats: [1, 2],
    laneBias: {},
    bursts: false,
    contour: "arc",
  },
  // Moth erasure: restless syncopated motion.
  erasure: {
    density: 5,
    minGapMs: 500,
    holdRatio: 0.2,
    holdLenBeats: [1, 2],
    laneBias: {},
    bursts: false,
    contour: "mixed",
  },
  // Echo ascent: rising contour, mirrors player's phrase.
  retrograde: {
    density: 4,
    minGapMs: 550,
    holdRatio: 0.25,
    holdLenBeats: [1, 2],
    laneBias: { c: 1.2 },
    bursts: false,
    contour: "up",
  },
}

/** Resolve an enemy's motif params: pattern base + per-enemy overrides. */
export function parryParamsFor(pattern: string, override?: Partial<ParryMotifParams>): ParryMotifParams {
  const base = PARRY_MOTIFS[pattern] ?? DEFAULT_PARRY_PARAMS
  return {
    ...base,
    ...(override ?? {}),
    holdLenBeats: override?.holdLenBeats ?? base.holdLenBeats,
    laneBias: { ...base.laneBias, ...(override?.laneBias ?? {}) },
  }
}

export interface GenerateParryChartOpts {
  params: ParryMotifParams
  /** Chart span in steps (alert → strike, ~1–2 loops). */
  spanSteps: number
  bpm: number
  rng?: () => number
  /** Opening scale degree for the contour walk (legacy; maps to variant). */
  startDegree?: number
  /** Fight key (locked at createFight). Defaults to C minor. */
  key?: Key
  /** One Roman numeral per arrangement bar, e.g. ["i", "VI"]. Tiled cyclically. */
  chords?: string[]
  /** Steps per bar (default 16). */
  stepsPerBar?: number
  /** Enemy pattern name: selects the slot grid + bar development. */
  pattern?: string
  /** Per-strike variant: creates musical variation on the signature riff. */
  variant?: number
  /** Arrangement bar the chart starts on (loop-boundary schedules use 0). */
  startBar?: number
  /** Player's recorded melody tracks (used by Echo to mirror the player's music). */
  playerTracks?: (NoteEvent | null)[][][]
  /** Window bonus applied from groove effect. */
  windowBonus?: number
}

/** 1-bar rhythmic candidate slot grids in steps (16-step bar). */
export const PARRY_SLOT_TEMPLATES: Record<string, number[]> = {
  // Tank march: steady quarters.
  ostinato: [0, 4, 8, 12],
  // Horde rush: 8th burst pairs.
  swarm: [0, 2, 8, 10],
  // Mirror: syncopated quarters / 8ths.
  inversion: [0, 4, 8, 12],
  // Moth erasure: syncopated off-beats.
  erasure: [0, 6, 10],
  // Echo: tresillo groove (3+3+2 eighths).
  retrograde: [0, 6, 12],
}

const DEFAULT_SLOTS = [0, 4, 8, 12]

/** Rough chord root scale degree for a roman numeral. */
export function romanRoot(roman: string): number {
  const base = roman.replace(/[^ivxIVX]/g, "").toUpperCase()
  const map: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7,
  }
  return map[base] ?? 1
}

/**
 * Dynamic Runtime Reharmonization:
 * Derives the scale degree for a physical lane (0..3) given the active bar chord.
 * Lane 0 = Chord Root
 * Lane 1 = Chord Third
 * Lane 2 = Chord Fifth
 * Lane 3 = Chord Octave / Seventh
 */
export function laneToChordDegree(lane: number, chordRoman: string, key: Key = DEFAULT_KEY): number {
  const pool = chordPool(key, chordRoman)
  const l = Math.max(0, Math.min(3, Math.round(lane)))
  const poolIdx = Math.min(pool.length - 1, Math.round((l * (pool.length - 1)) / 3))
  return pool[poolIdx] ?? romanRoot(chordRoman)
}

/** Degrees 1..15 whose pitch class sits in the bar chord (tonic fallback). */
function chordPool(key: Key, roman: string): number[] {
  let pcs: Set<number>
  try {
    pcs = new Set(romanToChord(key, roman).map((m) => ((m % 12) + 12) % 12))
  } catch {
    return [1, 3, 5, 8]
  }
  const pool: number[] = []
  for (let degree = 1; degree <= 15; degree++) {
    const pc = ((degreeToMidi(key, degree, 4) % 12) + 12) % 12
    if (pcs.has(pc)) pool.push(degree)
  }
  return pool.length > 0 ? pool : [1, 3, 5, 8]
}

/** A single note inside an antecedent or consequent cell. */
interface CellNote {
  slot: number
  lane: number // 0..3
  holdSteps: number
}

/**
 * Extract player melody onsets to allow Echo to literally echo the player's music.
 */
function extractPlayerCell(tracks: (NoteEvent | null)[][][]): CellNote[] | null {
  if (!tracks || tracks.length === 0) return null
  const onsets: { step: number; lane: number }[] = []
  // Find onsets from the latest bar with recorded events
  const bars = tracks[0]?.length ?? 0
  const stepsPerBar = tracks[0]?.[0]?.length ?? 16
  for (let b = bars - 1; b >= 0; b--) {
    for (let s = 0; s < stepsPerBar; s++) {
      for (const track of tracks) {
        const ev = track[b]?.[s]
        if (ev) {
          const lane = parryKeyToLane(degreeToParryLane(ev.degree))
          onsets.push({ step: s, lane })
          break
        }
      }
    }
    if (onsets.length >= 2) break
  }
  if (onsets.length < 2) return null
  return onsets.slice(0, 4).map((o) => ({ slot: o.step, lane: o.lane, holdSteps: 0 }))
}

/**
 * Build the Antecedent (Bar 1) core cell.
 * Features 3 to 5 notes ending open on an unstable lane (1 or 2).
 */
function buildAntecedentCell(
  pattern: string,
  template: number[],
  contour: "up" | "down" | "arc" | "mixed",
  variant: number,
  playerTracks?: (NoteEvent | null)[][][],
): CellNote[] {
  if (pattern === "retrograde" && playerTracks) {
    const playerCell = extractPlayerCell(playerTracks)
    if (playerCell && playerCell.length >= 2) {
      // Ensure the antecedent ends open
      const last = playerCell[playerCell.length - 1]
      if (last.lane === 0 || last.lane === 3) {
        last.lane = 1
      }
      return playerCell
    }
  }

  // Pick 3-4 slots from the template
  const slots = template.length <= 4 ? [...template] : template.slice(0, 4)
  const n = slots.length

  // Generate lane walk matching the contour
  const lanes: number[] = []
  for (let i = 0; i < n; i++) {
    const isLast = i === n - 1
    if (isLast) {
      // Open ending: lane 1 or 2 (tension / antecedent)
      lanes.push((variant % 2 === 0) ? 1 : 2)
      continue
    }

    let l = 0
    switch (contour) {
      case "down":
        l = Math.max(0, 3 - i + (variant % 2))
        break
      case "up":
        l = Math.min(3, i + (variant % 2))
        break
      case "arc":
        // 0 -> 2 -> 3 -> 1
        l = i === 0 ? 0 : i === 1 ? 2 : 3
        break
      case "mixed":
      default:
        // alternating
        l = i % 2 === 0 ? (variant % 2 === 0 ? 0 : 2) : 3
        break
    }
    lanes.push(Math.max(0, Math.min(3, l)))
  }

  return slots.map((slot, i) => ({
    slot,
    lane: lanes[i] ?? 0,
    holdSteps: 0,
  }))
}

/**
 * Develop the Consequent (Bar 2) cell from the Antecedent.
 * Applies exact motivic transformations (retrograde, inversion, sequence, or repetition),
 * ending closed on a stable arrival lane (0 or 3).
 */
function developConsequentCell(
  antecedent: CellNote[],
  pattern: string,
  variant: number,
): CellNote[] {
  let transformed: CellNote[]

  switch (pattern) {
    case "retrograde": {
      // Temporal reverse of onsets and lanes
      const reversed = [...antecedent].reverse()
      transformed = reversed.map((note, i) => {
        // Reflect slot across the 16-step bar:
        const origSlot = antecedent[antecedent.length - 1 - i]?.slot ?? 0
        const slot = Math.max(0, Math.min(14, 16 - (origSlot + 4)))
        return {
          slot,
          lane: note.lane,
          holdSteps: note.holdSteps,
        }
      }).sort((a, b) => a.slot - b.slot)
      break
    }
    case "inversion": {
      // Exact mirror around mid-point: l' = 3 - l
      transformed = antecedent.map((note) => ({
        ...note,
        lane: 3 - note.lane,
      }))
      break
    }
    case "erasure": {
      // Step climb / sequence up
      transformed = antecedent.map((note) => ({
        ...note,
        lane: (note.lane + 1) % 4,
      }))
      break
    }
    case "swarm": {
      // Sequence with variant
      transformed = antecedent.map((note) => ({
        ...note,
        lane: (note.lane + (variant % 2 === 0 ? 1 : 2)) % 4,
      }))
      break
    }
    case "ostinato":
    default: {
      // Repetition
      transformed = antecedent.map((note) => ({ ...note }))
      break
    }
  }

  // Consequent Closed Ending: final note resolves to lane 0 (root) or 3 (climax)
  if (pattern !== "retrograde" && transformed.length > 0) {
    const last = transformed[transformed.length - 1]
    last.lane = variant % 3 === 0 ? 3 : 0 // Cadence resolution
  }

  return transformed
}

/**
 * Generate a full-span parry chart using the cell-based Antecedent -> Consequent model.
 *
 * 1. Build 3-5 note core cell in lane space (0..3).
 * 2. Bar 1 = Antecedent (open ending).
 * 3. Bar 2 = Consequent (transformed, closed resolution).
 * 4. Tiled cleanly across span with constraint-guided placement and beat-snapped holds.
 */
export function generateParryChart(opts: GenerateParryChartOpts): QteChart {
  const { params, spanSteps, bpm } = opts
  const rng = opts.rng ?? Math.random
  const span = Math.max(1, Math.round(spanSteps))
  const key = opts.key ?? { ...DEFAULT_KEY }
  const chords = opts.chords && opts.chords.length > 0 ? [...opts.chords] : ["i"]
  const stepsPerBar = Math.max(4, Math.round(opts.stepsPerBar ?? 16))
  const pattern = opts.pattern ?? "ostinato"
  const startBar = opts.startBar ?? 0
  const variant = opts.variant ?? (opts.startDegree != null
    ? Math.abs(Math.round(opts.startDegree)) % 3
    : Math.floor(rng() * 3) % 3)

  // Degenerate small spans (<= 4 steps): single tap on chord root
  if (span <= 4) {
    const roman = chords[startBar % chords.length] ?? "i"
    const degree = romanRoot(roman)
    const lane = degreeToParryLane(degree)
    return {
      notes: [{ id: `${lane}-0-0`, key: lane, stepOffset: 0, window: 2, holdSteps: 0, degree }],
      lengthSteps: span,
    }
  }

  const rawTemplate = [...(PARRY_SLOT_TEMPLATES[pattern] ?? DEFAULT_SLOTS)].sort((a, b) => a - b)
  // Scale template to stepsPerBar if needed
  const scale = stepsPerBar / 16
  const template = rawTemplate
    .map((s) => Math.min(stepsPerBar - 2, Math.round((s * scale) / 2) * 2))
    .filter((s, i, arr) => s >= 0 && s < stepsPerBar && arr.indexOf(s) === i)
    .sort((a, b) => a - b)

  // Step 1: Build Antecedent & Consequent cells in lane space (0..3)
  const antecedent = buildAntecedentCell(
    pattern,
    template.length > 0 ? template : [0, 4, 8, 12],
    params.contour,
    variant,
    opts.playerTracks,
  )

  const consequent = developConsequentCell(antecedent, pattern, variant)

  // Timing constraint calculations
  const stepTime = stepMs(bpm)
  const minGap = Math.max(2, Math.ceil(params.minGapMs / stepTime))
  const floor = params.bursts ? 2 : minGap

  // Step 2: Lay down phrases across bars
  const numBars = Math.max(1, Math.ceil(span / stepsPerBar))
  interface RawHit {
    offset: number
    lane: number
    bar: number
    barStart: boolean
  }
  const hits: RawHit[] = []

  for (let b = 0; b < numBars; b++) {
    const isConsequent = b % 2 === 1
    const cell = isConsequent ? consequent : antecedent

    for (const note of cell) {
      const offset = b * stepsPerBar + note.slot
      if (offset >= span) continue
      hits.push({
        offset,
        lane: note.lane,
        bar: b,
        barStart: note.slot === 0,
      })
    }
  }

  // Ensure at least downbeats survive if empty
  if (hits.length === 0) {
    for (let b = 0; b < numBars; b++) {
      const offset = b * stepsPerBar
      if (offset < span) {
        hits.push({ offset, lane: 0, bar: b, barStart: true })
      }
    }
  }

  // Step 3: Enforce generation constraints (gap floor and same-lane repeat recovery)
  hits.sort((a, b) => a.offset - b.offset)
  const filtered: RawHit[] = []
  for (let i = 0; i < hits.length; i++) {
    const cand = hits[i]
    if (filtered.length === 0) {
      filtered.push(cand)
      continue
    }
    const prev = filtered[filtered.length - 1]
    const gap = cand.offset - prev.offset
    // Same lane requires extra recovery unless bursts are enabled
    const requiredGap = cand.lane === prev.lane && !params.bursts ? Math.max(floor, 4) : floor
    if (gap >= requiredGap) {
      filtered.push(cand)
    }
  }

  // Ensure minimum note count (at least 3 notes across full span if span >= 16)
  if (filtered.length < 3 && span >= 16) {
    const mid = Math.round(stepsPerBar / 2)
    for (let b = 0; b < numBars && filtered.length < 3; b++) {
      const offset = b * stepsPerBar + mid
      if (offset < span && !filtered.some((h) => Math.abs(h.offset - offset) < floor)) {
        filtered.push({ offset, lane: 1, bar: b, barStart: false })
      }
    }
    filtered.sort((a, b) => a.offset - b.offset)
  }

  // Step 4: Beat-snapped holds on downbeats
  const barStarts = filtered.filter((h) => h.barStart)
  const holdCount = Math.min(
    barStarts.length,
    Math.round(filtered.length * Math.min(0.5, Math.max(0, params.holdRatio))),
  )
  const holdOffsets = new Set<number>()
  if (holdCount > 0 && barStarts.length > 0) {
    // Pick hold seats (downbeats)
    for (let i = 0; i < holdCount; i++) {
      holdOffsets.add(barStarts[i].offset)
    }
  }

  const [loBeats, hiBeats] = params.holdLenBeats
  const holdLengths = new Map<number, number>()
  for (const offset of holdOffsets) {
    const beats = loBeats + Math.floor(rng() * (hiBeats - loBeats + 1))
    holdLengths.set(offset, Math.max(4, beats * 4))
  }

  // Clear overlapping notes covered by holds with 2-step clearance
  const finalHits: RawHit[] = []
  const activeHolds = new Map<number, number>()

  for (let i = 0; i < filtered.length; i++) {
    const hit = filtered[i]
    // Check if covered by any prior hold
    let covered = false
    for (const [hOffset, hLen] of activeHolds) {
      if (hit.offset > hOffset && hit.offset < hOffset + hLen + 2) {
        covered = true
        break
      }
    }
    if (covered) continue

    if (holdOffsets.has(hit.offset)) {
      const desired = holdLengths.get(hit.offset) ?? 4
      const nextHit = filtered[i + 1]
      const room = nextHit ? nextHit.offset - hit.offset - 2 : span - hit.offset
      if (room >= 4) {
        const clampedLen = Math.min(desired, Math.floor(room / 4) * 4)
        activeHolds.set(hit.offset, clampedLen)
      }
    }
    finalHits.push(hit)
  }

  // Step 5: Convert to QteNote with runtime degree derivation
  const notes: QteNote[] = finalHits.map((h, i) => {
    let keyLane = laneToParryKey(h.lane)
    const absoluteBar = startBar + h.bar
    const roman = chords[((absoluteBar % chords.length) + chords.length) % chords.length] ?? "i"

    // Dynamic chord tone derivation:
    // When note is a hold on downbeat: chord root.
    // Otherwise: derived directly from lane + active chord.
    const holdSteps = activeHolds.get(h.offset) ?? 0
    const degree = holdSteps > 0 && h.barStart
      ? romanRoot(roman)
      : laneToChordDegree(h.lane, roman, key)

    return {
      id: `${keyLane}-${h.offset}-${i}`,
      key: keyLane,
      stepOffset: h.offset,
      window: Math.max(1, (params.bursts ? 1 : 2) + (opts.windowBonus ?? 0)),
      holdSteps,
      degree,
    }
  })

  return { notes, lengthSteps: span }
}
