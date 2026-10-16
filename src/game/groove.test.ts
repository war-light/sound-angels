import { describe, expect, it } from "vitest"
import {
  GROOVE_CARDS,
  GROOVE_STEPS,
  MAX_SWING,
  bottleGroove,
  clampDensity,
  clampSwing,
  countGrooveHits,
  defaultGroove,
  describeGrooveEffect,
  getGrooveCard,
  grooveHit,
  keepsHit,
  parseGroove,
  swingDelaySteps,
  toggleCellStep,
  tweakGroove,
} from "./groove"

describe("groove cards", () => {
  it("ships the five cards with Steady as the default", () => {
    expect(GROOVE_CARDS.map((g) => g.id)).toEqual([
      "steady",
      "driving",
      "half-time",
      "shuffle",
      "syncopated",
    ])
    expect(defaultGroove().id).toBe("steady")
    expect(defaultGroove().source).toBe("card")
  })

  it("hands out fresh copies so edits never touch the shipped cards", () => {
    const a = getGrooveCard("steady")!
    a.cell.kick.push(99)
    expect(getGrooveCard("steady")!.cell.kick).not.toContain(99)
    expect(getGrooveCard("nope")).toBeUndefined()
  })
})

describe("density (keepsHit)", () => {
  it("keeps quarter notes as the floor no matter how thin", () => {
    expect(keepsHit(0, 0)).toBe(true)
    expect(keepsHit(8, 0)).toBe(true)
  })

  it("drops 8ths and 16ths as density falls", () => {
    expect(keepsHit(2, 0.9)).toBe(true) // 16th survives only at full density
    expect(keepsHit(2, 0.5)).toBe(true) // 8th survives mid
    expect(keepsHit(1, 0.5)).toBe(false) // odd 16th culled mid
    expect(keepsHit(2, 0)).toBe(false) // 8th culled at zero
  })
})

describe("grooveHit", () => {
  it("only sounds cell hits that survive density", () => {
    const g = defaultGroove() // Steady: hat on every 8th
    expect(grooveHit(g, "hat", 2)).toBe(true)
    const thin = tweakGroove(g, { density: 0 })
    expect(grooveHit(thin, "hat", 2)).toBe(false)
    expect(grooveHit(thin, "kick", 0)).toBe(true)
    expect(grooveHit(g, "snare", 1)).toBe(false) // never written
  })
})

describe("swingDelaySteps", () => {
  it("lags only odd 16ths, scaled by the swing knob", () => {
    expect(swingDelaySteps(0, 0.6)).toBe(0)
    expect(swingDelaySteps(1, 0.6)).toBeCloseTo(0.3)
    expect(swingDelaySteps(2, 0.6)).toBe(0)
    expect(swingDelaySteps(3, 0)).toBe(0)
  })
})

describe("clamp + tweak", () => {
  it("clamps knobs to their ranges", () => {
    expect(clampSwing(9)).toBe(MAX_SWING)
    expect(clampSwing(-1)).toBe(0)
    expect(clampDensity(2)).toBe(1)
    expect(clampDensity(-0.5)).toBe(0)
  })

  it("tweakGroove edits immutably and clamps", () => {
    const g = defaultGroove()
    const t = tweakGroove(g, { swing: 9 })
    expect(t.swing).toBe(MAX_SWING)
    expect(g.swing).toBe(0)
  })
})

describe("toggleCellStep", () => {
  it("flips one voice step on then off, keeping offsets sorted", () => {
    const g = defaultGroove()
    const on = toggleCellStep(g, "kick", 2)
    expect(on.cell.kick).toEqual([0, 2, 4, 8, 12])
    expect(toggleCellStep(on, "kick", 2).cell.kick).toEqual([0, 4, 8, 12])
  })

  it("rejects out-of-range steps", () => {
    expect(() => toggleCellStep(defaultGroove(), "kick", GROOVE_STEPS)).toThrow()
    expect(() => toggleCellStep(defaultGroove(), "snare", -1)).toThrow()
  })
})

describe("countGrooveHits", () => {
  it("counts only surviving hits", () => {
    const g = defaultGroove()
    const full = countGrooveHits(g)
    const thin = countGrooveHits(tweakGroove(g, { density: 0 }))
    expect(full).toBeGreaterThan(thin)
    expect(thin).toBe(10) // quarters only: kick 4 + snare 2 + hat 4
  })
})

describe("bottleGroove", () => {
  it("stamps a fresh id, marks it a bottle, and trims the name", () => {
    const b = bottleGroove(defaultGroove(), "  My Groove  ")
    expect(b.source).toBe("bottle")
    expect(b.name).toBe("My Groove")
    expect(b.id).not.toBe("steady")
    expect(b.cell).toEqual(defaultGroove().cell)
  })

  it("falls back to a default name for a blank bottle", () => {
    expect(bottleGroove(defaultGroove(), "   ").name).toBe("Untitled groove")
  })
})

describe("describeGrooveEffect", () => {
  it("reads the effect's sway, and says so when there is none", () => {
    expect(describeGrooveEffect(defaultGroove())).toBe("Even pulse, no sway")
    expect(describeGrooveEffect(getGrooveCard("driving")!)).toContain("Foes close in sooner")
    const half = describeGrooveEffect(getGrooveCard("half-time")!)
    expect(half).toContain("Foes strike later")
    expect(half).toContain("Wide parry window")
    expect(half).toContain("Duller crits")
  })
})

describe("parseGroove", () => {
  it("round-trips a real groove through JSON", () => {
    const g = getGrooveCard("shuffle")!
    expect(parseGroove(JSON.parse(JSON.stringify(g)))).toEqual(g)
  })

  it("returns null for malformed blobs", () => {
    expect(parseGroove(null)).toBeNull()
    expect(parseGroove({})).toBeNull()
    expect(parseGroove({ id: "x", name: "x" })).toBeNull()
    expect(
      parseGroove({ id: "x", name: "x", cell: { kick: [99], snare: [], hat: [] } }),
    ).toBeNull()
  })

  it("clamps out-of-range knobs and marks unknown sources as custom", () => {
    const parsed = parseGroove({
      id: "x",
      name: "x",
      cell: { kick: [], snare: [], hat: [] },
      swing: 99,
      density: 99,
      source: "weird",
    })!
    expect(parsed.swing).toBe(MAX_SWING)
    expect(parsed.density).toBe(1)
    expect(parsed.source).toBe("custom")
  })
})
