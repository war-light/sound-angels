import { describe, expect, it } from "vitest"
import { createFight } from "./combat"
import {
  INTRO_LOOPS,
  advanceStage,
  clipStatus,
  createStage,
  isStrikeLoop,
  pressChord,
  stepsUntilStrike,
  toggleClip,
  type StageState,
} from "./stageCombat"
import { STAGE_LOOP_STEPS as LOOP, STAGE_STEPS_PER_BAR as BAR } from "./stageMusic"

const C_MINOR = { tonic: "C", scale: "minor", octave: 4 }
const rng = () => 0

function stage(enemyIds = ["echo"], active?: Parameters<typeof createStage>[0]["active"]): StageState {
  const fight = createFight({ key: C_MINOR, enemyIds })
  return createStage({ ...fight, active })
}

describe("clip queue", () => {
  it("joins on the next loop, not before", () => {
    let s = advanceStage(stage(), 0, rng)
    s = toggleClip(s, "bass:sub")
    expect(clipStatus(s, "bass:sub")).toBe("joining")
    s = advanceStage(s, LOOP - 1, rng)
    expect(s.active.bass).toBeNull()
    s = advanceStage(s, LOOP, rng)
    expect(s.active.bass).toBe("bass:sub")
    expect(clipStatus(s, "bass:sub")).toBe("active")
  })

  it("tapping a playing clip queues it out; tapping again cancels", () => {
    let s = stage()
    expect(clipStatus(s, "breaks:halftime")).toBe("active")
    s = toggleClip(s, "breaks:halftime")
    expect(clipStatus(s, "breaks:halftime")).toBe("leaving")
    s = toggleClip(s, "breaks:halftime")
    expect(clipStatus(s, "breaks:halftime")).toBe("active")
    s = toggleClip(s, "breaks:halftime")
    s = advanceStage(s, 0, rng)
    expect(s.active.breaks).toBeNull()
  })

  it("one clip per role: a new pick replaces the pending one", () => {
    let s = toggleClip(stage(), "lead:anthem")
    s = toggleClip(s, "lead:chip")
    expect(clipStatus(s, "lead:anthem")).toBe("idle")
    expect(clipStatus(s, "lead:chip")).toBe("joining")
  })
})

describe("hichord", () => {
  it("a chord lands on the next bar line", () => {
    let s = advanceStage(stage(), 0, rng)
    s = pressChord(s, { degree: 5, mod: "none" })
    s = advanceStage(s, BAR - 1, rng)
    expect(s.chord.degree).toBe(1)
    s = advanceStage(s, BAR, rng)
    expect(s.chord.degree).toBe(5)
    expect(s.pendingChord).toBeNull()
  })

  it("dominants build tension; a tonic cashes it in", () => {
    let s = advanceStage(stage(), 0, rng)
    s = advanceStage(pressChord(s, { degree: 5, mod: "seventh" }), BAR, rng)
    expect(s.tension).toBe(2)
    expect(s.lastBar?.fn).toBe("D")
    s = advanceStage(pressChord(s, { degree: 1, mod: "none" }), 2 * BAR, rng)
    expect(s.tension).toBe(0)
    expect(s.lastBar?.resolved).toBe(2)
    expect(s.lastBar?.mult).toBe(2)
    expect(s.stats.resolutions).toBe(1)
  })

  it("holding one chord goes stale", () => {
    const s = advanceStage(stage(), 2 * BAR, rng)
    expect(s.lastBar?.stale).toBe(true)
    expect(s.lastBar?.mult).toBe(0.75)
  })
})

describe("bar effects", () => {
  it("active clips hit the focused foe every bar", () => {
    const s0 = stage(["echo"], { breaks: "breaks:twostep", lead: "lead:chip" })
    const s = advanceStage(s0, 0, rng)
    // Twostep 3 + chip 4 on a fresh tonic bar.
    expect(s.lastBar?.damage).toBe(7)
    expect(s.enemies[0].hp).toBe(s0.enemies[0].hp - 7)
  })

  it("discovers a combo once and multiplies damage", () => {
    const s0 = stage(["echo"], { breaks: "breaks:twostep", bass: "bass:reese", lead: "lead:anthem" })
    let s = advanceStage(s0, 0, rng)
    expect(s.discovered).toEqual(["battle-anthem"])
    expect(s.lastBar?.combos).toEqual(["Battle Anthem"])
    s = advanceStage(s, BAR, rng)
    expect(s.log.filter((l) => l.text.includes("Combo discovered"))).toHaveLength(1)
  })

  it("supportive clips shield the party on a tonic", () => {
    const s = advanceStage(stage(["echo"], { harmony: "harmony:choir" }), 0, rng)
    // Choir 2 x tonic 1.5.
    expect(s.lastBar?.shield).toBe(3)
    expect(s.party.every((f) => f.shield === Math.min(f.maxShield, 3))).toBe(true)
  })
})

describe("foes", () => {
  it("never strike during the intro", () => {
    for (let loop = 0; loop <= INTRO_LOOPS; loop++) expect(isStrikeLoop(loop, 0, 1)).toBe(false)
  })

  it("strike on a loop downbeat and the gauge counts down to it", () => {
    let s = stage()
    const hpBefore = s.party.reduce((n, f) => n + f.hp + f.shield, 0)
    const wait = stepsUntilStrike(advanceStage(s, 0, rng), 0)!
    expect(wait % LOOP).toBe(0)
    s = advanceStage(s, wait, rng)
    expect(s.log.some((l) => l.text.includes("strikes"))).toBe(true)
    expect(s.party.reduce((n, f) => n + f.hp + f.shield, 0)).toBeLessThan(hpBefore)
  })

  it("a track-wiping foe erases a pitched clip", () => {
    let s = stage(["moth"], { breaks: "breaks:halftime", lead: "lead:lament" })
    const wait = stepsUntilStrike(advanceStage(s, 0, rng), 0)!
    s = advanceStage(s, wait, rng)
    expect(s.active.lead).toBeNull()
    expect(s.active.breaks).toBe("breaks:halftime")
  })

  it("the fight ends when every foe is down", () => {
    let s = stage(["echo"], { breaks: "breaks:fracture", lead: "lead:chip" })
    s = { ...s, enemies: s.enemies.map((f) => ({ ...f, hp: 1, shield: 0 })) }
    s = advanceStage(s, 0, rng)
    expect(s.over).toBe("player")
    // Nothing advances after the end.
    expect(advanceStage(s, 100, rng).step).toBe(0)
  })
})
