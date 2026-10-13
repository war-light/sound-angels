import { describe, expect, it } from "vitest"
import { createDefaultArrangement, countOnsets, setKey } from "./arrangement"
import {
  aliveEnemies,
  aliveParty,
  chordInstrument,
  computeNoteDamage,
  createFight,
  advanceTick,
  moveFighter,
  strike,
  type Rng,
} from "./combat"
import { ENEMIES } from "../data/enemies"
import type { Key } from "./theory"

const KEY: Key = { tonic: "C", scale: "minor", octave: 4 }

/** Deterministic rng from a repeating sequence. */
function seq(vals: number[]): Rng {
  let i = 0
  return () => vals[i++ % vals.length]
}

const arr = () => createDefaultArrangement()

describe("createFight", () => {
  it("locks the key and fields a party of three vs. the pack", () => {
    const s = createFight({ key: KEY, enemyIds: ["echo", "mite"] })
    expect(s.key).toEqual(KEY)
    expect(s.party.length).toBe(3)
    expect(s.enemies.length).toBe(2)
    expect(s.gauges).toEqual([0, 0])
    expect(Object.keys(s.enemyProfiles).sort()).toEqual(
      s.enemies.map((e) => e.id).sort(),
    )
    expect(s.voiceGauge).toBe(0)
    expect(s.over).toBe(null)
  })

  it("rejects unknown enemies and empty packs", () => {
    expect(() => createFight({ key: KEY, enemyIds: ["nope"] })).toThrow()
    expect(() => createFight({ key: KEY, enemyIds: [] })).toThrow()
  })

  it("serializes to JSON", () => {
    const s = createFight({ key: KEY })
    expect(JSON.parse(JSON.stringify(s))).toEqual(s)
  })
})

describe("advanceTick", () => {
  it("fills the voice gauge in 16 ticks", () => {
    let s = createFight({ key: KEY })
    for (let i = 0; i < 16; i++) s = advanceTick(s, arr()).state
    expect(s.tick).toBe(16)
    expect(s.voiceGauge).toBe(100)
  })

  it("overrides the arrangement key with the locked fight key", () => {
    const s = createFight({ key: KEY })
    const drifted = setKey(arr(), { tonic: "D", scale: "minor", octave: 4 })
    const r = advanceTick(s, drifted)
    expect(r.arrangement.key.tonic).toBe("C")
  })

  it("fires the echo counter after a full loop", () => {
    let s = createFight({ key: KEY })
    let a = arr()
    for (let i = 0; i < 32; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    const total = s.party.reduce((n, f) => n + f.hp, 0)
    expect(total).toBe(60 - ENEMIES.echo.baseAttack)
    expect(s.gauges[0]).toBe(0)
  })

  it("drives multiple enemies on their own periods", () => {
    let s = createFight({ key: KEY, enemyIds: ["echo", "mite"] })
    let a = arr()
    for (let i = 0; i < 24; i++) {
      const r = advanceTick(s, a, seq([0.1]))
      s = r.state
      a = r.arrangement
    }
    // Mite (period 24) acted; echo (period 32) has not.
    // Tick 24 lands on dissonant degree 2, so the mite also earns the +2
    // dissonance bonus: 60 - (2 + 2) = 56.
    const total = s.party.reduce((n, f) => n + f.hp, 0)
    expect(total).toBe(56)
    expect(s.gauges[1]).toBe(0)
    expect(s.gauges[0]).toBeGreaterThan(0)
  })

  it("track-wipe enemies erase all melody tracks", () => {
    let s = createFight({ key: KEY, enemyIds: ["moth"] })
    let a = arr()
    expect(countOnsets(a)).toBeGreaterThan(0)
    for (let i = 0; i < 40; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    expect(countOnsets(a)).toBe(0)
    expect(s.log.some((l) => l.text.includes("erases"))).toBe(true)
  })

  it("ticks poison on each loop wrap", () => {
    let s = createFight({ key: KEY })
    s = {
      ...s,
      enemies: [{ ...s.enemies[0], buffs: [{ id: "poison", power: 2, ticksLeft: 5 }] }],
    }
    let a = arr()
    for (let i = 0; i < 32; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    expect(s.enemies[0].hp).toBe(30 - 2)
  })

  it("is a no-op once the fight is over", () => {
    const s = { ...createFight({ key: KEY }), over: "player" as const }
    const a = arr()
    expect(advanceTick(s, a).state).toBe(s)
  })
})

describe("positions in combat", () => {
  it("defaults voice-0 to chords and voices stabs with strings", () => {
    const s = createFight({ key: KEY })
    expect(s.slots.chord).toBe("voice-0")
    expect(chordInstrument(s)).toBe("strings")
  })

  it("moveFighter re-seats and reports unknown ids as no-ops", () => {
    let s = createFight({ key: KEY })
    s = moveFighter(s, "voice-0", "beat")
    expect(s.slots.beat).toBe("voice-0")
    expect(s.slots.chord).toBe(null)
    expect(chordInstrument(s)).toBe(null)
    expect(s.log.some((l) => l.text.includes("beat"))).toBe(true)
    const same = moveFighter(s, "ghost", "front")
    expect(same).toBe(s)
  })

  it("beat-keeper wards the party on each loop wrap", () => {
    let s = createFight({ key: KEY })
    s = moveFighter(s, "voice-2", "beat")
    let a = arr()
    for (let i = 0; i < 32; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    // Echo deals 3 through wards; keeper added +1 shield per wrap (1 wrap).
    // Shields absorb first: party took 3 total, distributed by ward.
    const total = s.party.reduce((n, f) => n + f.hp, 0)
    expect(total).toBeGreaterThan(60 - 3)
    expect(s.log.some((l) => l.text.includes("warded"))).toBe(true)
  })
})

describe("computeNoteDamage", () => {
  const foe = () => createFight({ key: KEY }).enemies[0]

  it("applies weakness x1.5 (piano vs echo) and resist x0.5", () => {
    const echo = foe()
    const profile = ENEMIES.echo
    const weak = computeNoteDamage(
      { len: 1, instrument: "piano", element: "bright", chordTone: true },
      echo, profile, seq([0.99, 0.99]),
    )
    expect(weak.evaded).toBe(false)
    expect(weak.damage).toBe(Math.round(3 * 1.5))
    const resist = computeNoteDamage(
      { len: 1, instrument: "piano", element: "bright", chordTone: true },
      echo, ENEMIES.carapace, seq([0.99, 0.99]),
    )
    // Carapace resists piano + bright: 3 * 0.5 * 0.5 = 0.75 -> 1
    expect(resist.damage).toBe(1)
  })

  it("scales long notes by length (capped)", () => {
    const echo = foe()
    const hit = computeNoteDamage(
      { len: 4, instrument: "brass", element: "heavy", chordTone: true },
      echo, ENEMIES.echo, seq([0.99, 0.99]),
    )
    expect(hit.damage).toBe(5 * 4)
  })

  it("evades per archetype: hordes dodge longs, tanks shrug shorts", () => {
    const echo = foe()
    const hordeLong = computeNoteDamage(
      { len: 4, instrument: "brass", element: "heavy", chordTone: true },
      echo, ENEMIES.mite, seq([0.4, 0.99]),
    )
    expect(hordeLong.evaded).toBe(true)
    const hordeShort = computeNoteDamage(
      { len: 1, instrument: "brass", element: "heavy", chordTone: true },
      echo, ENEMIES.mite, seq([0.4, 0.99]),
    )
    expect(hordeShort.evaded).toBe(false)
    const tankLong = computeNoteDamage(
      { len: 4, instrument: "brass", element: "heavy", chordTone: true },
      echo, ENEMIES.carapace, seq([0.4, 0.99]),
    )
    // Carapace resists nothing here (brass is its weakness): 5*4*1.5 = 30
    expect(tankLong.evaded).toBe(false)
    expect(tankLong.damage).toBe(30)
  })

  it("reflects matching notes back at 50% (mirror, non-chord)", () => {
    const echo = foe()
    const hit = computeNoteDamage(
      { len: 1, instrument: "strings", element: "keen", chordTone: false },
      echo, ENEMIES.mirror, seq([0.99, 0.99]),
    )
    expect(hit.damage).toBe(3)
    expect(hit.reflected).toBe(2) // round(3 * 0.5)
    const consonant = computeNoteDamage(
      { len: 1, instrument: "strings", element: "keen", chordTone: true },
      echo, ENEMIES.mirror, seq([0.99, 0.99]),
    )
    expect(consonant.reflected).toBe(0)
  })
})

describe("strike", () => {
  it("needs a full voice gauge (same ref = no-op)", () => {
    const s = createFight({ key: KEY })
    expect(strike(s, arr()).state).toBe(s)
  })

  it("resolves the step's melodies, resets the gauge, poisons via violins", () => {
    let s = createFight({ key: KEY })
    let a = arr()
    for (let i = 0; i < 16; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    const r = strike(s, a, seq([0.5, 0.99, 0.99]))
    expect(r.state.enemies[0].hp).toBeLessThan(30)
    expect(r.state.voiceGauge).toBe(0)
    // Default seats: voice-0 holds chords, so slot-0 melodies resolve
    // through voice-1 (piano) — no poison.
    expect(r.state.enemies[0].buffs).toEqual([])
  })

  it("resolves through moved front members (violins poison)", () => {
    let s = createFight({ key: KEY })
    // Seat only voice-0 (strings) up front: slot-0 melodies resolve via violins.
    s = moveFighter(s, "voice-1", null)
    s = moveFighter(s, "voice-2", null)
    s = moveFighter(s, "voice-0", "front")
    let a = arr()
    for (let i = 0; i < 16; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    const r = strike(s, a, seq([0.5, 0.99, 0.99]))
    expect(r.state.enemies[0].buffs.some((b) => b.id === "poison")).toBe(true)
  })

  it("can win the fight", () => {
    let s = createFight({ key: KEY })
    s = { ...s, enemies: [{ ...s.enemies[0], hp: 1 }] }
    let a = arr()
    for (let i = 0; i < 16; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    const r = strike(s, a, seq([0.5, 0.99, 0.99]))
    expect(r.state.enemies[0].hp).toBe(0)
    expect(r.state.over).toBe("player")
    expect(aliveEnemies(r.state).length).toBe(0)
  })

  it("randomizes targets across the pack", () => {
    let s = createFight({ key: KEY, enemyIds: ["echo", "echo"] })
    let a = arr()
    for (let i = 0; i < 16; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    // 200 strikes with alternating target rolls hit both enemies.
    const seen = new Set<string>()
    for (let k = 0; k < 200; k++) {
      const r = strike(
        { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })) },
        a, seq([k % 2 === 0 ? 0.1 : 0.9, 0.99, 0.99]),
      )
      const hurt = r.state.enemies.find((e) => e.hp < 9999)
      if (hurt) seen.add(hurt.id)
    }
    expect(seen.size).toBe(2)
    expect(aliveParty(s).length).toBe(3)
  })
})
