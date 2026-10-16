import { describe, expect, it } from "vitest"
import { createDefaultArrangement } from "./arrangement"
import {
  advanceTick,
  createFight,
  pressQteKey,
  qteLocked,
  requestChordQte,
  requestPresetQte,
  type Rng,
} from "./combat"
import type { Key } from "./theory"

const KEY: Key = { tonic: "C", scale: "minor", octave: 4 }

function seq(vals: number[]): Rng {
  let i = 0
  return () => vals[i++ % vals.length]
}

describe("chord charts", () => {
  it("locks recording until the chart lands or fumbles", () => {
    let s = createFight({ key: KEY })
    s = requestChordQte(s, ["I", "V"])
    expect(s.activeQte?.kind).toBe("chord")
    expect(qteLocked(s)).toBe(true)
    // Second request while busy is refused.
    expect(requestChordQte(s, ["I"])).toBe(s)
  })

  it("applies the progression on a completed chart", () => {
    let s = createFight({ key: KEY })
    let a = createDefaultArrangement()
    s = requestChordQte(s, ["I", "V"], seq([0.1]))
    const chart = s.activeQte?.sequence ?? []
    for (const k of chart) s = pressQteKey(s, k)
    const r = advanceTick(s, a, seq([0.99, 0.99, 0.99]))
    expect(r.arrangement.chords).toEqual(["I", "V"])
    expect(r.state.activeQte).toBeNull()
  })

  it("fumbles past the deadline with chords untouched", () => {
    let s = createFight({ key: KEY })
    s = { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })) }
    let a = createDefaultArrangement()
    const before = [...a.chords]
    s = requestChordQte(s, ["V", "V"], seq([0.1]))
    // Fast-forward past the 16-tick window without pressing.
    for (let i = 0; i < 17; i++) {
      const r = advanceTick(s, a, seq([0.99, 0.99, 0.99]))
      s = r.state
      a = r.arrangement
      if (!s.activeQte) break
    }
    expect(s.activeQte).toBeNull()
    expect(a.chords).toEqual(before)
  })
})

describe("parry charts", () => {
  it("warns before the strike and reduces a perfect to the chip floor", () => {
    let s = createFight({ key: KEY, enemyIds: ["echo"] })
    s = { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })) }
    let a = createDefaultArrangement()
    // Run to the warning threshold (gauge >= 75, period 32 -> tick 24).
    for (let i = 0; i < 24; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    expect(s.activeQte?.kind).toBe("parry")
    const chart = s.activeQte?.sequence ?? []
    for (const k of chart) s = pressQteKey(s, k)
    const hpBefore = s.party.reduce((n, f) => n + f.hp + f.shield, 0)
    // Run to the strike (tick 32).
    for (let i = 0; i < 8; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    expect(s.activeQte).toBeNull()
    const hpAfter = s.party.reduce((n, f) => n + f.hp + f.shield, 0)
    // Echo base 3, perfect parry at chip 0.3 -> 1 through wards.
    expect(hpBefore - hpAfter).toBeLessThanOrEqual(2)
    expect(s.log.some((l) => l.text.includes("parry") || l.text.includes("blocked"))).toBe(true)
  })

  it("preset charts carry their snapshot and sing at full strength", () => {
    let s = createFight({ key: KEY })
    const a = createDefaultArrangement()
    s = requestPresetQte(s, { hash: "abc", tracks: a.tracks, chords: ["V", "V"] }, seq([0.2]))
    expect(s.activeQte?.kind).toBe("preset")
    const chart = s.activeQte?.sequence ?? []
    for (const k of chart) s = pressQteKey(s, k)
    const r = advanceTick(s, a, seq([0.99, 0.99, 0.99]))
    expect(r.arrangement.chords).toEqual(["V", "V"])
    expect(r.state.activeQte).toBeNull()
  })
})
