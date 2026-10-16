import { describe, expect, it } from "vitest"
import { createDefaultArrangement } from "./arrangement"
import {
  advanceTick,
  createFight,
  pressQteKey,
  qteLocked,
  requestChordQte,
  requestPresetQte,
  type AtbState,
  type Rng,
} from "./combat"
import type { Arrangement } from "./arrangement"
import type { Key } from "./theory"

const KEY: Key = { tonic: "C", scale: "minor", octave: 4 }

function seq(vals: number[]): Rng {
  let i = 0
  return () => vals[i++ % vals.length]
}

/** Hit every chart note exactly on its step (sick timing). */
function hitAllOnTime(s: AtbState): AtbState {
  const qte = s.activeQte
  if (!qte) return s
  for (const n of [...qte.chart.notes].sort((a, b) => a.stepOffset - b.stepOffset)) {
    s = pressQteKey(s, n.key, qte.startedTick + n.stepOffset)
  }
  return s
}

/** Fast-forward to each note's step, pressing on arrival (real playhead). */
function playAllOnTime(
  s: AtbState,
  a: Arrangement,
  rng: Rng,
): { s: AtbState; a: Arrangement } {
  const qte = s.activeQte
  if (!qte) return { s, a }
  for (const n of [...qte.chart.notes].sort((x, y) => x.stepOffset - y.stepOffset)) {
    const target = qte.startedTick + n.stepOffset
    while (s.tick < target && s.activeQte) {
      const r = advanceTick(s, a, rng)
      s = r.state
      a = r.arrangement
    }
    if (s.activeQte) s = pressQteKey(s, n.key)
  }
  return { s, a }
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
    s = { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })) }
    let a = createDefaultArrangement()
    s = requestChordQte(s, ["I", "V"], seq([0.1]))
    s = hitAllOnTime(s)
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
    // Fast-forward past the 32-tick window (2 bars) without pressing.
    for (let i = 0; i < 33; i++) {
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
  it("opens on the loop boundary with a 5s wall-clock chart and strikes on schedule", () => {
    let s = createFight({ key: KEY, enemyIds: ["echo"] })
    // Bypass intro grace period so scheduling starts at the first boundary.
    s = { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })), introLoopsLeft: 0 }
    let a = createDefaultArrangement()
    // Run to the first loop end (32 steps, 2-bar loop).
    for (let i = 0; i < 32; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    expect(s.activeQte?.kind).toBe("parry")
    // 5s at 90bpm ~= 30 steps -> a single 32-step loop span, strike at 64.
    expect(s.parrySchedule?.strikeTick).toBe(64)
    expect(s.activeQte?.deadlineTick).toBe(64)
    // ZXCV lanes only.
    const keys = new Set(s.activeQte?.notes.map((n) => n.note.key))
    for (const k of keys) expect(["z", "x", "c", "v"]).toContain(k)
    // At least 3 notes in the chart (holds or taps depending on seed).
    expect((s.activeQte?.notes.length ?? 0)).toBeGreaterThanOrEqual(3)
    // Play every note, then ride into the strike.
    const played = playAllOnTime(s, a, seq([0.5]))
    s = played.s
    a = played.a
    const hpBefore = s.party.reduce((n, f) => n + f.hp + f.shield, 0)
    for (let i = 0; i < 40 && (s.activeQte || s.parrySchedule); i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    expect(s.activeQte).toBeNull()
    expect(s.parrySchedule).toBeNull()
    const hpAfter = s.party.reduce((n, f) => n + f.hp + f.shield, 0)
    // Echo base 3, perfect parry at chip 0.3 -> 1 through wards.
    expect(hpBefore - hpAfter).toBeLessThanOrEqual(2)
    expect(s.log.some((l) => l.text.includes("parry") || l.text.includes("blocked"))).toBe(true)
  })

  it("defers the strike a loop when hands are busy with a song chart", () => {
    let s = createFight({ key: KEY, enemyIds: ["echo"] })
    s = { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })), introLoopsLeft: 0 }
    let a = createDefaultArrangement()
    // Reach into the loop, then open a song chart still live at loop end.
    for (let i = 0; i < 10; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    s = requestChordQte(s, ["I", "V"], seq([0.1]))
    expect(s.activeQte?.kind).toBe("chord")
    // Run past the first loop end: busy hands never get interrupted.
    for (let i = 0; i < 22; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    expect(s.tick).toBe(32)
    expect(s.activeQte?.kind).toBe("chord")
    expect(s.parrySchedule).toBeNull()
  })

  it("preset charts carry their snapshot and sing at full strength", () => {
    let s = createFight({ key: KEY })
    s = { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })) }
    const a = createDefaultArrangement()
    s = requestPresetQte(s, { hash: "abc", tracks: a.tracks, chords: ["V", "V"] }, seq([0.2]))
    expect(s.activeQte?.kind).toBe("preset")
    s = hitAllOnTime(s)
    const r = advanceTick(s, a, seq([0.99, 0.99, 0.99]))
    expect(r.arrangement.chords).toEqual(["V", "V"])
    expect(r.state.activeQte).toBeNull()
  })
})
