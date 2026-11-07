import { describe, expect, it } from "vitest"
import { chordEffectFor } from "../data/chords"
import {
  createDefaultArrangement,
  clearTracks,
  setChords,
  toggleNoteEvent,
} from "./arrangement"
import {
  advanceTick,
  createFight,
  type Rng,
} from "./combat"
import { recallPreset, savePreset } from "./presets"
import type { Key } from "./theory"
import { ENEMIES } from "../data/enemies"

const C_MAJOR: Key = { tonic: "C", scale: "major", octave: 4 }
const GOLD = ["I", "V", "vi", "IV"]
const SILVER = ["V", "IV", "V", "IV"]

function seq(vals: number[]): Rng {
  let i = 0
  return () => vals[i++ % vals.length]
}

const arr = () => createDefaultArrangement()

describe("chordEffectFor", () => {
  it("blesses gold (regen + ward + bonus) and steadies silver (ward only)", () => {
    const gold = chordEffectFor(C_MAJOR, GOLD)
    expect(gold.tier).toBe("gold")
    expect([gold.regen, gold.ward, gold.bonusDamage]).toEqual([1, 1, 1])
    const silver = chordEffectFor(C_MAJOR, SILVER)
    expect(silver.tier).toBe("silver")
    expect([silver.regen, silver.ward, silver.bonusDamage]).toEqual([0, 1, 0])
  })
})

describe("setChords", () => {
  it("fits presets to the bar count by cycling or truncating", () => {
    expect(setChords(arr(), GOLD).chords).toEqual(["I", "V", "vi", "IV"])
    expect(setChords(arr(), ["i"]).chords).toEqual(["i", "i", "i", "i"])
    expect(() => setChords(arr(), [])).toThrow()
  })
})

describe("chord blessing in combat", () => {
  it("mends and wards the party on each loop wrap (gold)", () => {
    let s = createFight({ key: C_MAJOR })
    s = {
      ...s,
      party: s.party.map((p) => ({ ...p, hp: 10 })),
      enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })),
    }
    let a = setChords(arr(), GOLD)
    for (let i = 0; i < 64; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    // Echo struck once for 3; regen +1 x3 and ward +1 x3 softened it.
    const total = s.party.reduce((n, f) => n + f.hp, 0)
    expect(total).toBeGreaterThan(30 - 3)
    expect(s.party.reduce((n, f) => n + f.shield, 0)).toBeGreaterThan(0)
    expect(s.log.some((l) => l.text.includes("golden"))).toBe(true)
  })

  it("adds bonus damage as the loop replays (gold)", () => {
    const fresh = (chords: string[]) => {
      let s = createFight({ key: C_MAJOR })
      s = { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })) }
      let a = setChords(arr(), chords)
      for (let i = 0; i < 16; i++) {
        const r = advanceTick(s, a, seq([0.99, 0.99, 0.99]))
        s = r.state
        a = r.arrangement
      }
      return { s, a }
    }
    const g = fresh(GOLD)
    const goldHp = g.s.enemies[0].hp
    const v = fresh(SILVER)
    const silverHp = v.s.enemies[0].hp
    expect(goldHp).toBeLessThan(silverHp)
  })
})

describe("melody fade", () => {
  it("dulls old loops and hits softer until new songs are sung", () => {
    // One onset replayed on demand: same step, fresh vs faded potency.
    const solo = toggleNoteEvent(clearTracks(arr()), 0, 0, 1, { degree: 1, len: 1 })
    const hitOnce = (potency: Record<string, number>) => {
      const s = { ...createFight({ key: C_MAJOR }), tick: 0, potency }
      return advanceTick(s, solo, seq([0.99, 0.99, 0.99]))
    }
    const fresh = hitOnce({})
    const freshHp = fresh.state.enemies[0].hp
    expect(freshHp).toBeLessThan(ENEMIES.echo.hp)
    // One full loop passes: potency 1 -> 0.75.
    let s = fresh.state
    let a = fresh.arrangement
    for (let i = 0; i < 64; i++) {
      const r = advanceTick(s, a, seq([0.99, 0.99, 0.99]))
      s = r.state
      a = r.arrangement
    }
    expect(s.log.some((l) => l.text.includes("fade"))).toBe(true)
    const faded = hitOnce(s.potency)
    expect(faded.state.enemies[0].hp).toBeGreaterThan(freshHp - 5)
    expect(faded.state.log.some((l) => l.text.includes("fading"))).toBe(true)
  })

  it("fresh recordings enter at full strength", () => {
    let s = createFight({ key: C_MAJOR })
    s = { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })) }
    const a = setChords(arr(), SILVER)
    for (let i = 0; i < 128; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
    }
    // Everything seeded has faded to the floor by now.
    expect(Math.max(...Object.values(s.potency))).toBeLessThan(1)
  })
})

describe("preset recall", () => {
  it("runs back a cooled-down set and blocks early recalls", () => {
    const a0 = setChords(arr(), SILVER)
    const { store, entry } = savePreset({}, "opener", a0, 0)
    expect(recallPreset(store, entry.hash, 0)).toBeNull()
    const back = recallPreset(store, entry.hash, entry.cooldownUntilTick)
    expect(back).not.toBeNull()
    expect(back!.tracks).toEqual(a0.tracks)
    expect(back!.chords).toEqual(a0.chords)
  })

  it("recalls clone, so the stored snapshot stays pristine", () => {
    const a0 = arr()
    const { store, entry } = savePreset({}, "opener", a0, 0)
    const back = recallPreset(store, entry.hash, entry.cooldownUntilTick)!
    back.tracks[0][0][0] = null
    expect(store[entry.hash].tracks[0][0][0]).not.toBeNull()
  })
})
