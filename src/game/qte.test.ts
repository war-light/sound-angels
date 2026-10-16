import { describe, expect, it } from "vitest"
import {
  beatDegreeFor,
  chartFromMelody,
  chartFromPattern,
  chartKeys,
  createQte,
  degreeToPerformKey,
  fitChartToWindow,
  harmonicChart,
  isQteComplete,
  isQteExpired,
  missOverdueNotes,
  parryDamage,
  patternMotif,
  pressQte,
  qteSuccessRate,
  releaseQte,
} from "./qte"
import { degreeToMidi, romanToChord, type Key } from "./theory"
import type { NoteEvent } from "./arrangement"

const KEY: Key = { tonic: "C", scale: "minor", octave: 4 }

function seq(vals: number[]): () => number {
  let i = 0
  return () => vals[i++ % vals.length]
}

describe("qte charts", () => {
  it("builds deterministic pattern charts", () => {
    const a = chartFromPattern("ostinato", 4, seq([0.5]))
    const b = chartFromPattern("ostinato", 4, seq([0.5]))
    expect(a).toEqual(b)
    expect(a).toHaveLength(4)
  })

  it("scores hits in order, misses otherwise", () => {
    let q = createQte({ kind: "parry", sequence: ["w", "a"], startedTick: 0, deadlineTick: 8 })
    q = pressQte(q, "s")
    expect(q.hits).toBe(0)
    expect(q.misses).toBe(1)
    q = pressQte(q, "w")
    q = pressQte(q, "a")
    expect(isQteComplete(q)).toBe(true)
    expect(qteSuccessRate(q)).toBe(1)
  })

  it("expires at the deadline when incomplete", () => {
    const q = createQte({ kind: "chord", sequence: ["w"], startedTick: 0, deadlineTick: 4 })
    expect(isQteExpired(q, 3)).toBe(false)
    expect(isQteExpired(q, 4)).toBe(true)
  })
})

describe("parryDamage", () => {
  it("deals full base with no chart (pre-QTE balance preserved)", () => {
    expect(parryDamage(3, 0.3, null)).toBe(3)
  })

  it("lands on the chip floor on a perfect, full on a whiff", () => {
    let q = createQte({ kind: "parry", sequence: ["w", "s"], startedTick: 0, deadlineTick: 8 })
    q = pressQte(pressQte(q, "w"), "s")
    expect(parryDamage(4, 0.25, q)).toBe(1)
    const cold = createQte({ kind: "parry", sequence: ["w", "s"], startedTick: 0, deadlineTick: 8 })
    expect(parryDamage(4, 0.25, cold)).toBe(4)
  })
})

describe("beatDegreeFor", () => {
  it("always lands on a chord tone", () => {
    const chord = romanToChord(KEY, "i")
    const pcs = new Set(chord.map((m) => ((m % 12) + 12) % 12))
    for (let n = 0; n < 12; n++) {
      const degree = beatDegreeFor(KEY, chord, n)
      const pc = ((degreeToMidi(KEY, degree, 4) % 12) + 12) % 12
      expect(pcs.has(pc)).toBe(true)
    }
  })
})

describe("degreeToPerformKey (Phase B)", () => {
  it("maps root (1) to s, lower-mid (2-3) to a, upper-mid (4-5) to w, high (6-7) to d", () => {
    expect(degreeToPerformKey(1)).toBe("s")
    expect(degreeToPerformKey(2)).toBe("a")
    expect(degreeToPerformKey(3)).toBe("a")
    expect(degreeToPerformKey(4)).toBe("w")
    expect(degreeToPerformKey(5)).toBe("w")
    expect(degreeToPerformKey(6)).toBe("d")
    expect(degreeToPerformKey(7)).toBe("d")
  })

  it("wraps degrees above 7 back to 1–7", () => {
    expect(degreeToPerformKey(8)).toBe("s")  // 8 → 1 → s
    expect(degreeToPerformKey(9)).toBe("a")  // 9 → 2 → a
  })
})

describe("chartFromMelody (Phase B.3)", () => {
  it("derives a chart from melody onset data", () => {
    // Two-bar, one-track arrangement with onsets at steps 0 (degree 1) and 4 (degree 5).
    const note = (d: number): NoteEvent => ({ degree: d, len: 1 })
    const track: (NoteEvent | null)[][] = [
      [note(1), null, null, null, note(5), null, null, null, null, null, null, null, null, null, null, null],
      Array(16).fill(null),
    ]
    const tracks = [track]
    const chart = chartFromMelody(tracks, 8)
    expect(chart.notes).toHaveLength(2)
    expect(chart.notes[0]).toMatchObject({ key: "s", stepOffset: 0, window: 2, degree: 1 })
    expect(chart.notes[1]).toMatchObject({ key: "w", stepOffset: 4, window: 2, degree: 5 })
    expect(chart.lengthSteps).toBe(32)
  })

  it("respects maxNotes cap", () => {
    const note = (d: number): NoteEvent => ({ degree: d, len: 1 })
    const row: (NoteEvent | null)[] = Array.from({ length: 16 }, (_, i) => (i % 2 === 0 ? note(1) : null))
    const chart = chartFromMelody([[row, row]], 3)
    expect(chart.notes).toHaveLength(3)
  })

  it("returns empty chart for empty tracks", () => {
    const empty: (NoteEvent | null)[][] = [Array(16).fill(null)]
    const chart = chartFromMelody([empty], 8)
    expect(chart.notes).toHaveLength(0)
  })
})

describe("harmonicChart (Phase B.4)", () => {
  it("encodes same-chord as s (neutral), step-up as w, leap-up as d, leap-down as a", () => {
    // i → i: same → s; i → V (up 4 steps): leap-up → d; V → i (down 4 steps): leap-down → a
    const chart = harmonicChart(["i", "i", "V", "i"], 16)
    expect(chart.notes).toHaveLength(4)
    expect(chart.notes[0].key).toBe("s") // first note: always same as prev (no delta)
    expect(chart.notes[1].key).toBe("s") // i→i: same
    expect(chart.notes[2].key).toBe("d") // i→V: +4 leap up
    expect(chart.notes[3].key).toBe("a") // V→i: -4 leap down
  })

  it("places notes at bar offsets", () => {
    const chart = harmonicChart(["i", "VI"], 16)
    expect(chart.notes[0].stepOffset).toBe(0)
    expect(chart.notes[1].stepOffset).toBe(16)
    expect(chart.lengthSteps).toBe(32)
  })
})

describe("chartKeys", () => {
  it("extracts the flat key sequence from a QteChart", () => {
    const chart = harmonicChart(["i", "V"], 16)
    const keys = chartKeys(chart)
    expect(keys).toHaveLength(2)
    expect(keys.every((k) => ["w", "a", "s", "d"].includes(k))).toBe(true)
  })
})

describe("timed hit evaluation (FNF highway)", () => {
  it("rates exact-tick hits sick, ±1 good, ±2 bad", () => {
    const mk = (offset: number) =>
      createQte({
        kind: "parry",
        chart: { notes: [{ id: "s-0-0", key: "s", stepOffset: offset, window: 2, holdSteps: 0, degree: 1 }], lengthSteps: 8 },
        startedTick: 10,
        deadlineTick: 18,
      })
    expect(pressQte(mk(4), "s", 14).lastRating?.rating).toBe("sick")
    expect(pressQte(mk(4), "s", 15).lastRating?.rating).toBe("good")
    expect(pressQte(mk(4), "s", 16).lastRating?.rating).toBe("bad")
  })

  it("ignores ghost taps between notes, penalizes wrong keys on active notes", () => {
    const q = createQte({
      kind: "parry",
      chart: { notes: [{ id: "s-4-0", key: "s", stepOffset: 4, window: 2, holdSteps: 0, degree: 1 }], lengthSteps: 8 },
      startedTick: 0,
      deadlineTick: 8,
    })
    // Far from the note: ghost tap ignored, no miss, no combo break.
    const ghost = pressQte(q, "w", 0)
    expect(ghost.misses).toBe(0)
    expect(ghost.lastRating).toBeUndefined()
    // On the note's step with the wrong lane: miss + combo reset.
    const wrong = pressQte(q, "w", 4)
    expect(wrong.misses).toBe(1)
    expect(wrong.lastRating?.rating).toBe("miss")
  })

  it("auto-misses overdue notes and weights parry damage by rating", () => {
    let q = createQte({
      kind: "parry",
      chart: {
        notes: [
          { id: "s-0-0", key: "s", stepOffset: 0, window: 1, holdSteps: 0, degree: 1 },
          { id: "d-4-1", key: "d", stepOffset: 4, window: 1, holdSteps: 0, degree: 6 },
        ],
        lengthSteps: 8,
      },
      startedTick: 0,
      deadlineTick: 8,
    })
    q = pressQte(q, "s", 0) // sick
    q = missOverdueNotes(q, 6) // second note window passed (4+1)
    expect(q.misses).toBe(1)
    expect(q.combo).toBe(0)
    expect(qteSuccessRate(q)).toBeCloseTo(0.5)
    expect(parryDamage(4, 0.25, q)).toBe(3) // 4 * (0.25 + 0.75*0.5) = 2.5 -> 3
  })

  it("fits motif charts inside short parry windows", () => {
    const motif = patternMotif("ostinato")
    const fitted = fitChartToWindow(motif, 8)
    expect(fitted.notes).toHaveLength(motif.notes.length)
    for (const n of fitted.notes) {
      expect(n.stepOffset).toBeGreaterThanOrEqual(0)
      expect(n.stepOffset).toBeLessThan(8)
    }
  })
})

describe("hold notes (ZXCV parry)", () => {
  const holdChart = () =>
    createQte({
      kind: "parry",
      chart: {
        notes: [{ id: "z-4-0", key: "z", stepOffset: 4, window: 2, holdSteps: 4, degree: 2 }],
        lengthSteps: 16,
      },
      startedTick: 0,
      deadlineTick: 16,
    })

  it("opens a hold on the head tap and completes it at the tail", () => {
    let q = holdChart()
    q = pressQte(q, "z", 4) // sick head
    expect(q.hits).toBe(0) // scored at the tail, not the head
    expect(q.notes[0].holdPhase).toBe("holding")
    expect(q.lastRating?.rating).toBe("sick")
    q = releaseQte(q, "z", 8) // tail = 4 + 4
    expect(q.hits).toBe(1)
    expect(q.combo).toBe(1)
    expect(q.notes[0].status).toBe("hit")
    expect(isQteComplete(q)).toBe(true)
  })

  it("scores early releases as bad with a broken combo", () => {
    let q = holdChart()
    q = pressQte(q, "z", 4)
    q = releaseQte(q, "z", 5) // tail window opens at 8 - 2 = 6
    expect(q.hits).toBe(1)
    expect(q.combo).toBe(0)
    expect(q.notes[0].rating).toBe("bad")
    expect(qteSuccessRate(q)).toBeCloseTo(0.4)
  })

  it("auto-completes unreleased holds at the tail", () => {
    let q = holdChart()
    q = pressQte(q, "z", 4)
    q = missOverdueNotes(q, 8)
    expect(q.hits).toBe(1)
    expect(q.combo).toBe(1)
    expect(q.notes[0].status).toBe("hit")
  })

  it("misses untouched hold heads like taps", () => {
    let q = holdChart()
    q = missOverdueNotes(q, 7) // head 4 + window 2
    expect(q.misses).toBe(1)
    expect(q.notes[0].status).toBe("miss")
  })

  it("ignores extra taps while holding", () => {
    let q = holdChart()
    q = pressQte(q, "z", 4)
    const again = pressQte(q, "z", 5)
    expect(again.misses).toBe(0)
    expect(again.hits).toBe(0)
  })
})
