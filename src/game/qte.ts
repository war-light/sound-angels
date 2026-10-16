// Pure QTE model: FNF-style WASD charts for chord swaps, preset recalls,
// and ZXCV parry charts with tap + hold notes. No audio, no React.
// All state JSON-serializable.
import { degreeToMidi, type Key } from "./theory"
import type { NoteEvent } from "./arrangement"
import type { PerformKey, QteKey } from "./perform"

export type QteKind = "chord" | "preset" | "parry"

export interface QtePayload {
  /** Chord swap: romans to apply on success. */
  romans?: string[]
  /** Preset recall: content hash to restore on success. */
  hash?: string
  /** Preset snapshot applied on success (tracks + chords). */
  presetTracks?: (NoteEvent | null)[][][]
  presetChords?: string[]
  /** Parry: attacking foe + full damage before reduction. */
  foeId?: string
  baseDmg?: number
  chip?: number
}

/**
 * A single note within a rhythmic QTE chart.
 * `stepOffset` is when the player must press (relative to chart start);
 * `window` is the ± tolerance in steps. `degree` sounds on hit.
 * `holdSteps` extends the note into a hold: 0 = tap, >0 = keep the key
 * down until `stepOffset + holdSteps` (tail auto-completes; letting go
 * early scores a bad).
 */
export interface QteNote {
  id: string
  key: QteKey
  /** Step offset from chart start (0-based). Determines WHEN to press. */
  stepOffset: number
  /** Timing window in steps (±tolerance). Default 2 (±333 ms at 90 BPM). */
  window: number
  /** Scale degree to sound on hit (1-7+, wraps octaves). */
  degree: number
  /** Hold length in steps past the head. 0 = tap note. */
  holdSteps: number
}

/** A full rhythmic chart: ordered notes with per-note timing. */
export interface QteChart {
  notes: QteNote[]
  /** Total length of the chart in steps. */
  lengthSteps: number
}

export type QteRating = "sick" | "good" | "bad" | "miss"

export interface QteNoteState {
  note: QteNote
  status: "pending" | "hit" | "miss"
  rating?: QteRating
  hitTick?: number
  /**
   * Hold phase: `holding` between a scored head tap and the tail.
   * Taps stay `idle`. Rating stashes the head rating while holding.
   */
  holdPhase: "idle" | "holding" | "done"
  holdStartTick?: number
}

export interface QteState {
  kind: QteKind
  /** Legacy flat key sequence (derived from chart, kept for compat). */
  sequence: QteKey[]
  /** Next expected index in `sequence` (legacy; mirrors hit count). */
  index: number
  chart: QteChart
  notes: QteNoteState[]
  combo: number
  maxCombo: number
  hits: number
  misses: number
  startedTick: number
  deadlineTick: number
  payload: QtePayload
  lastRating?: { rating: QteRating; key: QteKey; tick: number; degree?: number }
}

const KEYS: PerformKey[] = ["w", "a", "s", "d"]

/**
 * Map a scale degree (1–7, wrapping) to a WASD perform key.
 *
 * The mapping mirrors the plan's "degree contour → direction" scheme:
 *   1 → s (root / neutral low)
 *   2–3 → a (lower-mid motion)
 *   4–5 → w (upper-mid motion)
 *   6–7 → d (high / leap up)
 *
 * Degrees above 7 are wrapped so the mapping stays coherent across octaves.
 */
export function degreeToPerformKey(degree: number): PerformKey {
  const d = ((degree - 1) % 7) + 1 // normalise to 1–7
  if (d === 1) return "s"
  if (d <= 3) return "a"
  if (d <= 5) return "w"
  return "d"
}

/** Representative degree for a WASD key (inverse of degreeToPerformKey). */
export function keyToDegree(key: PerformKey): number {
  switch (key) {
    case "s":
      return 1
    case "a":
      return 2
    case "w":
      return 4
    case "d":
      return 6
  }
}

/**
 * Representative degree for any chart key. Parry lanes mirror the WASD
 * contour (x low, z lower-mid, c upper-mid, v high) so generated parry
 * charts still sing in-key.
 */
export function qteKeyToDegree(key: QteKey): number {
  switch (key) {
    case "s":
    case "x":
      return 1
    case "a":
    case "z":
      return 2
    case "w":
    case "c":
      return 4
    case "d":
    case "v":
      return 6
  }
}

/** Rating weight for parry/score scaling: sick 1.0, good 0.75, bad 0.4. */
export function ratingWeight(r: QteRating): number {
  switch (r) {
    case "sick":
      return 1
    case "good":
      return 0.75
    case "bad":
      return 0.4
    case "miss":
      return 0
  }
}

function noteId(key: QteKey, stepOffset: number, i: number): string {
  return `${key}-${stepOffset}-${i}`
}

/**
 * Derive a rhythmic QTE chart from the actual melody content of a preset.
 * Collects onsets in playback order (bar-major, then step), converts their
 * scale degrees to WASD directions, and places them at the same rhythmic
 * positions they occupy in the loop.  The QTE literally *is* the melody.
 */
export function chartFromMelody(
  tracks: (NoteEvent | null)[][][],
  maxNotes = 8,
): QteChart {
  const stepsPerBar = tracks[0]?.[0]?.length ?? 16
  const onsets: { stepOffset: number; degree: number }[] = []
  const bars = tracks[0]?.length ?? 0
  for (let bar = 0; bar < bars; bar++) {
    for (let step = 0; step < stepsPerBar; step++) {
      for (const track of tracks) {
        const e = track[bar]?.[step]
        if (e) onsets.push({ stepOffset: bar * stepsPerBar + step, degree: e.degree })
      }
    }
  }
  const taken = onsets.slice(0, maxNotes)
  return {
    notes: taken.map((o, i) => ({
      id: noteId(degreeToPerformKey(o.degree), o.stepOffset, i),
      key: degreeToPerformKey(o.degree),
      stepOffset: o.stepOffset,
      window: 2,
      holdSteps: 0,
      degree: o.degree,
    })),
    lengthSteps: bars * stepsPerBar,
  }
}

/**
 * Build a chord-swap chart representing the harmonic movement of a chord
 * progression.  Root motion maps to WASD directional gestures:
 *   step up   → w  |  step down → s
 *   leap up   → d  |  leap down → a
 *
 * One note is placed per bar at step 0 of each bar. Degree = chord root.
 */
export function harmonicChart(romans: string[], stepsPerBar = 16): QteChart {
  // Convert roman numerals to a rough root scale degree.
  function romanRoot(r: string): number {
    const base = r.replace(/[^ivxIVX]/g, "").toUpperCase()
    const map: Record<string, number> = {
      I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7,
    }
    return map[base] ?? 1
  }
  const notes: QteNote[] = []
  for (let b = 0; b < romans.length; b++) {
    const curr = romanRoot(romans[b])
    const prev = b === 0 ? romanRoot(romans[0]) : romanRoot(romans[b - 1])
    const delta = curr - prev
    let key: PerformKey
    if (delta === 0) key = "s" // same chord → neutral
    else if (delta > 0 && delta <= 2) key = "w"  // step up
    else if (delta > 2) key = "d"                // leap up
    else if (delta >= -2) key = "s"              // step down
    else key = "a"                               // leap down
    notes.push({
      id: noteId(key, b * stepsPerBar, b),
      key,
      stepOffset: b * stepsPerBar,
      window: 2,
      holdSteps: 0,
      degree: curr,
    })
  }
  return { notes, lengthSteps: romans.length * stepsPerBar }
}

/** Rhythmic motif definitions matching enemy attack patterns (Phase B.2). */
export const PATTERN_MOTIFS: Record<string, QteChart> = {
  ostinato: {
    notes: [
      { id: "w-0-0", key: "w", stepOffset: 0, window: 2, holdSteps: 0, degree: 5 },
      { id: "a-4-1", key: "a", stepOffset: 4, window: 2, holdSteps: 0, degree: 3 },
      { id: "s-8-2", key: "s", stepOffset: 8, window: 2, holdSteps: 0, degree: 1 },
      { id: "d-12-3", key: "d", stepOffset: 12, window: 2, holdSteps: 0, degree: 6 },
    ],
    lengthSteps: 16,
  },
  swarm: {
    notes: [
      { id: "d-0-0", key: "d", stepOffset: 0, window: 1, holdSteps: 0, degree: 6 },
      { id: "w-2-1", key: "w", stepOffset: 2, window: 1, holdSteps: 0, degree: 5 },
      { id: "a-6-2", key: "a", stepOffset: 6, window: 1, holdSteps: 0, degree: 2 },
      { id: "s-8-3", key: "s", stepOffset: 8, window: 1, holdSteps: 0, degree: 1 },
      { id: "d-10-4", key: "d", stepOffset: 10, window: 1, holdSteps: 0, degree: 7 },
      { id: "w-14-5", key: "w", stepOffset: 14, window: 1, holdSteps: 0, degree: 4 },
    ],
    lengthSteps: 16,
  },
  inversion: {
    notes: [
      { id: "d-0-0", key: "d", stepOffset: 0, window: 2, holdSteps: 0, degree: 6 },
      { id: "w-4-1", key: "w", stepOffset: 4, window: 2, holdSteps: 0, degree: 4 },
      { id: "a-8-2", key: "a", stepOffset: 8, window: 2, holdSteps: 0, degree: 3 },
      { id: "s-12-3", key: "s", stepOffset: 12, window: 2, holdSteps: 0, degree: 1 },
    ],
    lengthSteps: 16,
  },
  erasure: {
    notes: [
      { id: "a-0-0", key: "a", stepOffset: 0, window: 2, holdSteps: 0, degree: 2 },
      { id: "s-4-1", key: "s", stepOffset: 4, window: 2, holdSteps: 0, degree: 1 },
      { id: "d-8-2", key: "d", stepOffset: 8, window: 2, holdSteps: 0, degree: 6 },
      { id: "w-12-3", key: "w", stepOffset: 12, window: 2, holdSteps: 0, degree: 5 },
    ],
    lengthSteps: 16,
  },
  retrograde: {
    notes: [
      { id: "s-0-0", key: "s", stepOffset: 0, window: 2, holdSteps: 0, degree: 1 },
      { id: "a-4-1", key: "a", stepOffset: 4, window: 2, holdSteps: 0, degree: 2 },
      { id: "w-8-2", key: "w", stepOffset: 8, window: 2, holdSteps: 0, degree: 4 },
      { id: "d-12-3", key: "d", stepOffset: 12, window: 2, holdSteps: 0, degree: 6 },
    ],
    lengthSteps: 16,
  },
}

/** Get the rhythmic motif chart for an enemy pattern (Phase B.2). */
export function patternMotif(pattern: string): QteChart {
  const found = PATTERN_MOTIFS[pattern]
  if (found) {
    return {
      lengthSteps: found.lengthSteps,
      notes: found.notes.map((n) => ({ ...n })),
    }
  }
  return {
    notes: [
      { id: "w-0-0", key: "w", stepOffset: 0, window: 2, holdSteps: 0, degree: 4 },
      { id: "a-4-1", key: "a", stepOffset: 4, window: 2, holdSteps: 0, degree: 2 },
      { id: "s-8-2", key: "s", stepOffset: 8, window: 2, holdSteps: 0, degree: 1 },
      { id: "d-12-3", key: "d", stepOffset: 12, window: 2, holdSteps: 0, degree: 6 },
    ],
    lengthSteps: 16,
  }
}

/**
 * Rescale a motif chart to fit inside an available tick window.
 * Notes are spread evenly across [0, ticksAvailable-1] preserving order,
 * so short parry warnings still get a singable highway.
 */
export function fitChartToWindow(chart: QteChart, ticksAvailable: number): QteChart {
  const n = chart.notes.length
  if (n === 0 || ticksAvailable <= 0) return { notes: [], lengthSteps: Math.max(1, ticksAvailable) }
  const span = Math.max(1, ticksAvailable)
  if (n === 1) {
    const only = chart.notes[0]
    return {
      notes: [{ ...only, id: noteId(only.key, 0, 0), stepOffset: 0 }],
      lengthSteps: span,
    }
  }
  const notes = chart.notes.map((note, i) => ({
    ...note,
    id: noteId(note.key, Math.round((i * (span - 1)) / (n - 1)), i),
    stepOffset: Math.round((i * (span - 1)) / (n - 1)),
  }))
  return { notes, lengthSteps: span }
}

/** Extract the flat key sequence from a QteChart (for the legacy QteState.sequence field). */
export function chartKeys(chart: QteChart): QteKey[] {
  return chart.notes.map((n) => n.key)
}

/** Build a chart from an enemy call-and-response pattern (deterministic w/ rng). */
export function chartFromPattern(pattern: string, length?: number, _rng: () => number = Math.random): QteKey[] {
  const motif = PATTERN_MOTIFS[pattern]
  if (motif) {
    const keys = motif.notes.map((n) => n.key)
    if (length == null || keys.length === length) return [...keys]
    if (keys.length > length) return keys.slice(0, length)
    const out = [...keys]
    while (out.length < length) {
      out.push(keys[out.length % keys.length])
    }
    return out
  }
  const out: PerformKey[] = []
  let offset = 0
  for (const c of pattern) offset = (offset + c.charCodeAt(0)) % 4
  const targetLen = length ?? 4
  for (let i = 0; i < targetLen; i++) {
    out.push(KEYS[(i + offset) % 4])
  }
  return out
}

/** Random chart for player-triggered QTEs (chord swaps, preset recalls). */
export function randomChart(length: number, rng: () => number = Math.random): PerformKey[] {
  return Array.from({ length }, () => KEYS[Math.floor(rng() * 4) % 4])
}

function synthChartFromSequence(
  sequence: QteKey[],
  startedTick: number,
  deadlineTick: number,
): QteChart {
  const span = Math.max(1, deadlineTick - startedTick)
  const notes: QteNote[] = sequence.map((key, i) => {
    const stepOffset = sequence.length === 1 ? 0 : Math.round((i * (span - 1)) / (sequence.length - 1))
    return { id: noteId(key, stepOffset, i), key, stepOffset, window: 2, holdSteps: 0, degree: qteKeyToDegree(key) }
  })
  return { notes, lengthSteps: span }
}

export function createQte(opts: {
  kind: QteKind
  sequence?: QteKey[]
  chart?: QteChart
  startedTick: number
  deadlineTick: number
  payload?: QtePayload
}): QteState {
  if (opts.deadlineTick <= opts.startedTick) throw new Error("QTE deadline must be after start")
  let chart: QteChart
  if (opts.chart) {
    if (opts.chart.notes.length === 0) throw new Error("A QTE needs at least one prompt")
    chart = { lengthSteps: opts.chart.lengthSteps, notes: opts.chart.notes.map((n) => ({ ...n })) }
  } else if (opts.sequence) {
    if (opts.sequence.length === 0) throw new Error("A QTE needs at least one prompt")
    chart = synthChartFromSequence(opts.sequence, opts.startedTick, opts.deadlineTick)
  } else {
    throw new Error("A QTE needs a chart or sequence")
  }
  return {
    kind: opts.kind,
    sequence: chartKeys(chart),
    index: 0,
    chart,
    notes: chart.notes.map((note) => ({ note: { ...note }, status: "pending" as const, holdPhase: "idle" as const })),
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    startedTick: opts.startedTick,
    deadlineTick: opts.deadlineTick,
    payload: { ...(opts.payload ?? {}) },
  }
}

function rateForDelta(absDelta: number): QteRating {
  if (absDelta <= 0.5) return "sick"
  if (absDelta <= 1) return "good"
  return "bad"
}

/**
 * Score one key press against the chart with step-timed evaluation.
 * - With `currentTick`: hits the earliest pending head for `key` within
 *   its window (|Δ| ≤ window). Hold heads open a hold (scored at the
 *   tail); taps score immediately. Ghost taps (no head in window) are
 *   ignored unless another lane is currently hittable (FNF strict).
 * - Without `currentTick` (legacy/tests): hits the next pending note in
 *   chart order when keys match; wrong keys count a miss without consuming.
 */
export function pressQte(qte: QteState, key: QteKey, currentTick?: number): QteState {
  const pending = qte.notes.some((n) => n.status === "pending")
  if (!pending) return qte
  if (currentTick == null) {
    const idx = qte.notes.findIndex((n) => n.status === "pending")
    if (idx < 0) return qte
    const target = qte.notes[idx]
    if (key === target.note.key) {
      const hitTick = qte.startedTick + target.note.stepOffset
      const notes = qte.notes.map((n, i) =>
        i === idx
          ? { ...n, status: "hit" as const, rating: "sick" as const, hitTick, holdPhase: "done" as const }
          : n,
      )
      const combo = qte.combo + 1
      return {
        ...qte,
        notes,
        index: qte.index + 1,
        hits: qte.hits + 1,
        combo,
        maxCombo: Math.max(qte.maxCombo, combo),
        lastRating: { rating: "sick", key, tick: hitTick, degree: target.note.degree },
      }
    }
    return {
      ...qte,
      misses: qte.misses + 1,
      combo: 0,
      lastRating: { rating: "miss", key, tick: qte.startedTick, degree: target.note.degree },
    }
  }
  let best = -1
  let bestAbs = Number.POSITIVE_INFINITY
  let bestOffset = Number.POSITIVE_INFINITY
  qte.notes.forEach((n, i) => {
    if (n.status !== "pending" || n.holdPhase !== "idle" || n.note.key !== key) return
    const targetTick = qte.startedTick + n.note.stepOffset
    const abs = Math.abs(currentTick - targetTick)
    if (abs <= n.note.window && (abs < bestAbs || (abs === bestAbs && n.note.stepOffset < bestOffset))) {
      best = i
      bestAbs = abs
      bestOffset = n.note.stepOffset
    }
  })
  if (best >= 0) {
    const rating = rateForDelta(bestAbs)
    const hitNote = qte.notes[best]
    // Hold heads open a hold: the hit lands at the tail. Show the head
    // rating immediately, score on release/auto-complete.
    if (hitNote.note.holdSteps > 0) {
      const notes = qte.notes.map((n, i) =>
        i === best
          ? { ...n, rating, hitTick: currentTick, holdPhase: "holding" as const, holdStartTick: currentTick }
          : n,
      )
      return {
        ...qte,
        notes,
        lastRating: { rating, key, tick: currentTick, degree: hitNote.note.degree },
      }
    }
    const notes = qte.notes.map((n, i) =>
      i === best
        ? { ...n, status: "hit" as const, rating, hitTick: currentTick, holdPhase: "done" as const }
        : n,
    )
    const combo = qte.combo + 1
    return {
      ...qte,
      notes,
      index: qte.index + 1,
      hits: qte.hits + 1,
      combo,
      maxCombo: Math.max(qte.maxCombo, combo),
      lastRating: { rating, key, tick: currentTick, degree: hitNote.note.degree },
    }
  }
  // No head for this key in window: if a head of any lane is currently
  // hittable, the mistimed press breaks combo (FNF strict); otherwise it's
  // a harmless ghost tap between notes and is ignored. Open holds never
  // punish extra taps.
  const anyHittable = qte.notes.some((n) => {
    if (n.status !== "pending" || n.holdPhase !== "idle") return false
    return Math.abs(currentTick - (qte.startedTick + n.note.stepOffset)) <= n.note.window
  })
  if (!anyHittable) return qte
  return {
    ...qte,
    misses: qte.misses + 1,
    combo: 0,
    lastRating: { rating: "miss", key, tick: currentTick },
  }
}

/**
 * Score one key release against open holds. Releasing at/after the tail
 * window completes the note at its head rating; letting go early scores a
 * bad (the note counts, but the combo breaks). Releases with no open hold
 * on that lane are ignored.
 */
export function releaseQte(qte: QteState, key: QteKey, currentTick: number): QteState {
  let best = -1
  let bestOffset = Number.POSITIVE_INFINITY
  qte.notes.forEach((n, i) => {
    if (n.status !== "pending" || n.holdPhase !== "holding" || n.note.key !== key) return
    if (n.note.stepOffset < bestOffset) {
      best = i
      bestOffset = n.note.stepOffset
    }
  })
  if (best < 0) return qte
  const held = qte.notes[best]
  const tailTick = qte.startedTick + held.note.stepOffset + held.note.holdSteps
  // Released inside (or past) the tail window: hold complete at head rating.
  if (currentTick >= tailTick - held.note.window) {
    const rating = held.rating ?? "sick"
    const notes = qte.notes.map((n, i) =>
      i === best ? { ...n, status: "hit" as const, holdPhase: "done" as const, hitTick: currentTick } : n,
    )
    const combo = qte.combo + 1
    return {
      ...qte,
      notes,
      index: qte.index + 1,
      hits: qte.hits + 1,
      combo,
      maxCombo: Math.max(qte.maxCombo, combo),
      lastRating: { rating, key, tick: currentTick, degree: held.note.degree },
    }
  }
  // Early release: the note counts, but only as a bad with a broken combo.
  const notes = qte.notes.map((n, i) =>
    i === best
      ? { ...n, status: "hit" as const, rating: "bad" as const, holdPhase: "done" as const, hitTick: currentTick }
      : n,
  )
  return {
    ...qte,
    notes,
    index: qte.index + 1,
    hits: qte.hits + 1,
    combo: 0,
    lastRating: { rating: "bad", key, tick: currentTick, degree: held.note.degree },
  }
}

/**
 * Advance hold tails + mark overdue heads as misses (called from
 * advanceTick). Holds still open at their tail auto-complete at the head
 * rating — the finger only matters when it lets go early.
 */
export function missOverdueNotes(qte: QteState, tick: number): QteState {
  let changed = false
  let hits = qte.hits
  let misses = qte.misses
  let combo = qte.combo
  let maxCombo = qte.maxCombo
  let index = qte.index
  let lastRating = qte.lastRating
  const notes = qte.notes.map((n) => {
    if (n.status !== "pending") return n
    if (n.holdPhase === "holding") {
      const tailTick = qte.startedTick + n.note.stepOffset + n.note.holdSteps
      if (tick >= tailTick) {
        changed = true
        hits += 1
        combo += 1
        maxCombo = Math.max(maxCombo, combo)
        index += 1
        const rating = n.rating ?? "sick"
        lastRating = { rating, key: n.note.key, tick, degree: n.note.degree }
        return { ...n, status: "hit" as const, holdPhase: "done" as const, hitTick: tick }
      }
      return n
    }
    const targetTick = qte.startedTick + n.note.stepOffset
    if (tick - targetTick > n.note.window) {
      changed = true
      misses += 1
      combo = 0
      lastRating = { rating: "miss" as const, key: n.note.key, tick, degree: n.note.degree }
      return { ...n, status: "miss" as const, rating: "miss" as const, hitTick: tick }
    }
    return n
  })
  if (!changed) return qte
  return { ...qte, notes, hits, misses, combo, maxCombo, index, lastRating }
}

export function isQteComplete(qte: QteState): boolean {
  if (qte.notes.length > 0) return qte.notes.every((n) => n.status === "hit")
  return qte.index >= qte.sequence.length
}

export function isQteExpired(qte: QteState, tick: number): boolean {
  return tick >= qte.deadlineTick && !isQteComplete(qte)
}

/** Weighted fraction of the chart hit (sick 1.0, good 0.75, bad 0.4). */
export function qteSuccessRate(qte: QteState): number {
  const total = qte.notes.length > 0 ? qte.notes.length : qte.sequence.length
  if (total === 0) return 0
  if (qte.notes.length === 0) return qte.hits / total
  let scored = 0
  for (const n of qte.notes) {
    if (n.status !== "hit") continue
    scored += ratingWeight(n.rating ?? "sick")
  }
  return scored / total
}

/**
 * Parry damage: perfect play lands on the chip floor, ignoring it deals full
 * base. No QTE (or zero prompts) -> full base, preserving pre-QTE balance.
 */
export function parryDamage(base: number, chip: number, qte: QteState | null): number {
  const total = qte ? (qte.notes.length > 0 ? qte.notes.length : qte.sequence.length) : 0
  if (!qte || total === 0) return Math.max(0, Math.round(base))
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
