import { describe, expect, it } from "vitest"
import {
  beatDegreeFor,
  chartFromPattern,
  createQte,
  isQteComplete,
  isQteExpired,
  parryDamage,
  pressQte,
  qteSuccessRate,
} from "./qte"
import { degreeToMidi, romanToChord, type Key } from "./theory"

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
