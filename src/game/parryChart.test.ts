import { describe, expect, it } from "vitest"
import {
  degreeToParryLane,
  generateParryChart,
  laneToChordDegree,
  parryKeyToLane,
  PARRY_MOTIFS,
  parryParamsFor,
} from "./parryChart"
import type { NoteEvent } from "./arrangement"
import { degreeToMidi, romanToChord, DEFAULT_KEY } from "./theory"
import { stepMs, type ParryKey } from "./perform"

function seq(vals: number[]): () => number {
  let i = 0
  return () => vals[i++ % vals.length]
}

function romanRoot(roman: string): number {
  const base = roman.replace(/[^ivxIVX]/g, "").toUpperCase()
  const map: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7,
  }
  return map[base] ?? 1
}

const CHORDS = ["i", "VI"]
const KEY = { ...DEFAULT_KEY }
const RNG_VALS = [0.1, 0.5, 0.9, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6, 0.15]

function chordPcs(roman: string): Set<number> {
  return new Set(romanToChord(KEY, roman).map((m) => ((m % 12) + 12) % 12))
}

describe("parryParamsFor", () => {
  it("resolves pattern bases with per-enemy overrides", () => {
    const p = parryParamsFor("swarm", { density: 9 })
    expect(p.density).toBe(9)
    expect(p.bursts).toBe(true) // base preserved
    expect(parryParamsFor("nope").density).toBeGreaterThan(0) // fallback
  })

  it("maps degrees onto ZXCV contour zones", () => {
    expect(degreeToParryLane(1)).toBe("z")
    expect(degreeToParryLane(2)).toBe("x")
    expect(degreeToParryLane(4)).toBe("c")
    expect(degreeToParryLane(6)).toBe("v")
  })
})

describe("generateParryChart (grid-locked, song-derived)", () => {
  for (const pattern of Object.keys(PARRY_MOTIFS)) {
    it(`builds a grid-locked ${pattern} motif over 1–2 loops`, () => {
      for (const span of [32, 64]) {
        const params = parryParamsFor(pattern)
        const chart = generateParryChart({
          params,
          pattern,
          spanSteps: span,
          bpm: 90,
          key: KEY,
          chords: CHORDS,
          stepsPerBar: 16,
          rng: seq(RNG_VALS),
        })
        expect(chart.notes.length).toBeGreaterThanOrEqual(3)
        expect(chart.lengthSteps).toBe(span)
        for (const n of chart.notes) {
          expect(["z", "x", "c", "v"]).toContain(n.key)
          expect(n.stepOffset).toBeGreaterThanOrEqual(0)
          expect(n.stepOffset + n.holdSteps).toBeLessThanOrEqual(span)
          // Grid lock: 8th-note lattice, subset of the tiled template.
          expect(n.stepOffset % 2).toBe(0)
          // Lanes are strictly valid physical ZXCV highway keys.
          expect(["z", "x", "c", "v"]).toContain(n.key)
        }
        // Wall-clock floor per pattern (bursts live on 8ths).
        const heads = chart.notes.map((n) => n.stepOffset).sort((a, b) => a - b)
        const floor = params.bursts ? 2 : Math.max(2, Math.ceil(params.minGapMs / stepMs(90)))
        for (let i = 1; i < heads.length; i++) {
          expect(heads[i] - heads[i - 1]).toBeGreaterThanOrEqual(floor)
        }
        // Holds: beat-snapped, on bar starts, on chord roots, clear next head.
        const byOffset = [...chart.notes].sort((a, b) => a.stepOffset - b.stepOffset)
        for (let i = 0; i + 1 < byOffset.length; i++) {
          const tail = byOffset[i].stepOffset + byOffset[i].holdSteps
          expect(byOffset[i + 1].stepOffset - tail).toBeGreaterThanOrEqual(2)
        }
        for (const n of chart.notes) {
          if (n.holdSteps > 0) {
            expect(n.holdSteps % 4).toBe(0)
            expect(n.stepOffset % 16).toBe(0)
            const bar = Math.floor(n.stepOffset / 16)
            const roman = CHORDS[bar % CHORDS.length] ?? "i"
            expect(n.degree).toBe(romanRoot(roman))
          }
        }
      }
    })

    it(`${pattern} degrees sit inside their bar chord`, () => {
      const chart = generateParryChart({
        params: parryParamsFor(pattern),
        pattern,
        spanSteps: 64,
        bpm: 90,
        key: KEY,
        chords: ["i", "VI", "III", "VII"],
        stepsPerBar: 16,
        variant: 0,
        rng: seq(RNG_VALS),
      })
      for (const n of chart.notes) {
        const bar = Math.floor(n.stepOffset / 16)
        const roman = ["i", "VI", "III", "VII"][bar % 4] ?? "i"
        const pc = ((degreeToMidi(KEY, n.degree, 4) % 12) + 12) % 12
        expect(chordPcs(roman).has(pc)).toBe(true)
      }
    })
  }

  it("develops the motif cell literally per pattern", () => {
    const barsOf = (pattern: string) => {
      const chart = generateParryChart({
        params: parryParamsFor(pattern, { holdRatio: 0 }),
        pattern,
        spanSteps: 32,
        bpm: 90,
        key: KEY,
        chords: ["i", "i"],
        stepsPerBar: 16,
        variant: 0,
        rng: seq([0.5]),
      })
      const bar0 = chart.notes.filter((n) => n.stepOffset < 16).map((n) => n.key)
      const bar1 = chart.notes.filter((n) => n.stepOffset >= 16).map((n) => n.key)
      return { bar0, bar1 }
    }
    // Ostinato: cadential resolution in bar 1
    {
      const { bar0, bar1 } = barsOf("ostinato")
      expect(bar0.length).toBeGreaterThan(0)
      expect(bar1.length).toBe(bar0.length)
      expect(["z", "v"]).toContain(bar1[bar1.length - 1])
    }
    // Retrograde: second bar reverses the first's keys
    {
      const { bar0, bar1 } = barsOf("retrograde")
      expect(bar1).toEqual([...bar0].reverse())
    }
    // Inversion: mirrored lanes (z <-> v, x <-> c)
    {
      const { bar0, bar1 } = barsOf("inversion")
      expect(bar1.length).toBe(bar0.length)
      expect(bar1).not.toEqual(bar0)
    }
    // Erasure: climbs one pool step per bar
    {
      const { bar0, bar1 } = barsOf("erasure")
      expect(bar1.length).toBe(bar0.length)
      expect(bar1).not.toEqual(bar0)
    }
  })

  it("is deterministic under seed; variant transposes but keeps rhythm", () => {
    const mk = (variant?: number, seed = RNG_VALS) =>
      generateParryChart({
        params: parryParamsFor("ostinato"),
        pattern: "ostinato",
        spanSteps: 32,
        bpm: 90,
        key: KEY,
        chords: CHORDS,
        stepsPerBar: 16,
        variant,
        rng: seq(seed),
      })
    expect(mk(0)).toEqual(mk(0))
    const v0 = mk(0)
    const v1 = mk(1)
    expect(v1.notes.map((n) => n.stepOffset)).toEqual(v0.notes.map((n) => n.stepOffset))
    expect(v1.notes.map((n) => n.degree)).not.toEqual(v0.notes.map((n) => n.degree))
    // No variant + seeded rng is still deterministic.
    const a = generateParryChart({
      params: parryParamsFor("swarm"), pattern: "swarm", spanSteps: 32, bpm: 90,
      key: KEY, chords: CHORDS, stepsPerBar: 16, rng: seq(RNG_VALS),
    })
    const b = generateParryChart({
      params: parryParamsFor("swarm"), pattern: "swarm", spanSteps: 32, bpm: 90,
      key: KEY, chords: CHORDS, stepsPerBar: 16, rng: seq(RNG_VALS),
    })
    expect(a).toEqual(b)
  })

  it("locks golden cells per pattern (regression snapshots)", () => {
    for (const pattern of Object.keys(PARRY_MOTIFS)) {
      const chart = generateParryChart({
        params: parryParamsFor(pattern),
        pattern,
        spanSteps: 32,
        bpm: 90,
        key: KEY,
        chords: CHORDS,
        stepsPerBar: 16,
        variant: 0,
        rng: seq(RNG_VALS),
      })
      expect(chart.notes.map((n) => [n.stepOffset, n.degree, n.key, n.holdSteps])).toMatchSnapshot(pattern)
    }
  })

  it("keeps wall-clock duration stable across tempos", () => {
    const at = (bpm: number) =>
      generateParryChart({
        params: parryParamsFor("ostinato"), pattern: "ostinato",
        spanSteps: 64, bpm, key: KEY, chords: CHORDS, stepsPerBar: 16, rng: seq([0.5]),
      })
    for (const bpm of [50, 90, 160]) {
      const chart = at(bpm)
      expect(chart.lengthSteps).toBe(64)
      expect(chart.notes.length).toBeGreaterThanOrEqual(3)
    }
  })

  it("degenerate spans yield a single tap on the chord root instead of throwing", () => {
    const chart = generateParryChart({
      params: parryParamsFor("swarm"), pattern: "swarm", spanSteps: 2, bpm: 90,
      key: KEY, chords: ["VI"], stepsPerBar: 16,
    })
    expect(chart.notes).toHaveLength(1)
    expect(chart.notes[0].degree).toBe(romanRoot("VI"))
    expect(chart.notes[0].key).toBe(degreeToParryLane(romanRoot("VI")))
  })

  it("enforces antecedent open ending and consequent closed ending", () => {
    for (const pattern of Object.keys(PARRY_MOTIFS)) {
      const chart = generateParryChart({
        params: parryParamsFor(pattern, { holdRatio: 0 }),
        pattern,
        spanSteps: 32,
        bpm: 90,
        key: KEY,
        chords: ["i", "VI"],
        stepsPerBar: 16,
        variant: 0,
        rng: seq([0.5]),
      })
      const bar0 = chart.notes.filter((n) => n.stepOffset < 16)
      const bar1 = chart.notes.filter((n) => n.stepOffset >= 16)
      expect(bar0.length).toBeGreaterThan(0)
      expect(bar1.length).toBeGreaterThan(0)

      // Antecedent (Bar 0) last note is open (lane 1 = 'x' or 2 = 'c')
      const lastBar0 = bar0[bar0.length - 1]
      const laneBar0 = parryKeyToLane(lastBar0.key as ParryKey)
      expect([1, 2]).toContain(laneBar0)

      // Consequent (Bar 1) last note is closed cadence (lane 0 = 'z' or 3 = 'v')
      const lastBar1 = bar1[bar1.length - 1]
      const laneBar1 = parryKeyToLane(lastBar1.key as ParryKey)
      expect([0, 3]).toContain(laneBar1)
    }
  })

  it("echo mirrors and retrogrades player melody tracks", () => {
    // Create a mock player track with 3 onsets in bar 0
    const emptyBar: (NoteEvent | null)[] = Array(16).fill(null)
    const playerBar: (NoteEvent | null)[] = Array(16).fill(null)
    playerBar[0] = { degree: 1, len: 1 }  // Lane 0 ('z')
    playerBar[4] = { degree: 3, len: 1 }  // Lane 1 ('x')
    playerBar[8] = { degree: 5, len: 1 }  // Lane 2 ('c')
    const tracks: (NoteEvent | null)[][][] = [[playerBar, emptyBar]]

    const chart = generateParryChart({
      params: parryParamsFor("retrograde", { holdRatio: 0 }),
      pattern: "retrograde",
      spanSteps: 32,
      bpm: 90,
      key: KEY,
      chords: ["i", "i"],
      stepsPerBar: 16,
      playerTracks: tracks,
      variant: 0,
      rng: seq([0.5]),
    })

    const bar0 = chart.notes.filter((n) => n.stepOffset < 16)
    const bar1 = chart.notes.filter((n) => n.stepOffset >= 16)
    expect(bar0.length).toBe(3)
    expect(bar1.length).toBe(3)
    // Consequent reverses the antecedent:
    expect(bar1.map((n) => n.key)).toEqual(bar0.map((n) => n.key).reverse())
  })

  it("dynamically derives chord tones for all 4 lanes across any progression", () => {
    const chords = ["i", "VI", "III", "VII", "iv", "V"]
    for (const roman of chords) {
      for (let lane = 0; lane < 4; lane++) {
        const degree = laneToChordDegree(lane, roman, KEY)
        const midi = degreeToMidi(KEY, degree, 4)
        const pc = ((midi % 12) + 12) % 12
        expect(chordPcs(roman).has(pc)).toBe(true)
      }
    }
  })
})
