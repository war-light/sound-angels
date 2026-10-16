import { describe, expect, it } from "vitest"
import { createDefaultArrangement, clearTracks, countOnsets, setKey, toggleNoteEvent } from "./arrangement"
import {
  aliveEnemies,
  aliveParty,
  computeNoteDamage,
  createFight,
  advanceTick,
  defaultPerformerId,
  fillCharge,
  fillReady,
  fireFill,
  hasLiveAttacker,
  keeperInstrument,
  laneAttacker,
  moveFighter,
  performSlot,
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
  it("loops the replay: passing melodies hit foes with no button", () => {
    let s = createFight({ key: KEY })
    let a = arr()
    for (let i = 0; i < 4; i++) {
      const r = advanceTick(s, a, seq([0.99, 0.99, 0.99]))
      s = r.state
      a = r.arrangement
    }
    expect(s.tick).toBe(4)
    expect(s.enemies[0].hp).toBeLessThan(ENEMIES.echo.hp)
    expect(s.log.some((l) => l.text.includes("hits"))).toBe(true)
  })

  it("sounds in the locked fight key without clobbering the arrangement key", () => {
    const s = createFight({ key: KEY })
    const drifted = setKey(arr(), { tonic: "D", scale: "minor", octave: 4 })
    const r = advanceTick(s, drifted)
    expect(r.arrangement.key.tonic).toBe("D")
    expect(r.state.key.tonic).toBe("C")
  })

  it("rolls a random pool key when no key is given", () => {
    const a = createFight({ rng: () => 0.99 })
    const b = createFight({ rng: () => 0.99 })
    expect(a.key).toEqual(b.key)
    expect(["C", "D", "E", "A"]).toContain(a.key.tonic)
  })

  it("honors an explicit key for scripted combat events", () => {
    const s = createFight({ key: { tonic: "E", scale: "minor", octave: 4 } })
    expect(s.key).toEqual({ tonic: "E", scale: "minor", octave: 4 })
  })

  it("strikes on the loop-boundary schedule (echo every 3 loops)", () => {
    let s = createFight({ key: KEY })
    // Bypass intro grace period so scheduling starts at the first boundary.
    s = { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })), introLoopsLeft: 0 }
    const hpBefore = s.party.reduce((n, f) => n + f.hp + f.shield, 0)
    let a = arr()
    // No chart before the first loop end.
    for (let i = 0; i < 31; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    expect(s.activeQte).toBeNull()
    // Loop end: parry chart opens, strike scheduled one loop out.
    const r32 = advanceTick(s, a, seq([0.5]))
    s = r32.state
    a = r32.arrangement
    expect(s.activeQte?.kind).toBe("parry")
    expect(s.parrySchedule?.strikeTick).toBe(64)
    // Ride to the strike without playing: the unblocked blow lands.
    for (let i = 0; i < 32; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    const total = s.party.reduce((n, f) => n + f.hp, 0)
    expect(total).toBeLessThan(hpBefore)
    expect(s.log.some((l) => l.text.includes("strikes"))).toBe(true)
    expect(s.gauges[0]).toBe(0)
    expect(s.parrySchedule).toBeNull()
  })

  it("drives multiple enemies on their own cadences", () => {
    let s = createFight({ key: KEY, enemyIds: ["echo", "mite"] })
    // Bypass intro grace period so scheduling starts at the first boundary.
    s = { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })), introLoopsLeft: 0 }
    let a = arr()
    for (let i = 0; i < 32; i++) {
      const r = advanceTick(s, a, seq([0.1]))
      s = r.state
      a = r.arrangement
    }
    // First boundary: echo opens the chart (stable order on the cadence tie).
    expect(s.activeQte?.kind).toBe("parry")
    expect(s.parrySchedule?.foeId).toBe("echo-0")
    expect(s.parrySchedule?.strikeTick).toBe(64)
    // Ride through the echo strike to the next boundary: mite is due
    // (every 2 loops) while echo recharges (every 3).
    for (let i = 0; i < 64; i++) {
      const r = advanceTick(s, a, seq([0.1]))
      s = r.state
      a = r.arrangement
    }
    expect(s.tick).toBe(96)
    expect(s.activeQte?.kind).toBe("parry")
    expect(s.parrySchedule?.foeId).toBe("mite-1")
    expect(s.parrySchedule?.strikeTick).toBe(128)
    expect(s.log.some((l) => l.text.includes("Echo") && l.text.includes("strikes"))).toBe(true)
  })

  it("track-wipe enemies erase all melody tracks", () => {
    let s = createFight({ key: KEY, enemyIds: ["moth"] })
    // Bypass intro; the moth (every 3 loops) charts at 32, strikes at 64.
    s = { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })), introLoopsLeft: 0 }
    let a = arr()
    expect(countOnsets(a)).toBeGreaterThan(0)
    for (let i = 0; i < 70; i++) {
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
    // Empty loop: no melody damage, so the hp drop is the poison alone.
    let a = clearTracks(arr())
    for (let i = 0; i < 32; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    expect(s.enemies[0].hp).toBe(ENEMIES.echo.hp - 2)
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
    expect(keeperInstrument(s)).toBe("strings")
  })

  it("moveFighter re-seats and reports unknown ids as no-ops", () => {
    let s = createFight({ key: KEY })
    s = moveFighter(s, "voice-0", "beat")
    expect(s.slots.beat).toBe("voice-0")
    expect(s.slots.chord).toBe(null)
    expect(keeperInstrument(s)).toBe(null)
    expect(s.log.some((l) => l.text.includes("beat"))).toBe(true)
    const same = moveFighter(s, "ghost", "front")
    expect(same).toBe(s)
  })

  it("always defaults to a placed attacker (front lead, else first party member)", () => {
    // Fresh fight: voice-1 leads the front row.
    expect(defaultPerformerId(createFight({ key: KEY }))).toBe("voice-1")
    // Lead benched: the next front attacker takes over.
    let s = moveFighter(createFight({ key: KEY }), "voice-1", null)
    expect(defaultPerformerId(s)).toBe("voice-2")
    // Empty front row: falls back to the first party member.
    s = moveFighter(s, "voice-2", null)
    expect(defaultPerformerId(s)).toBe("voice-0")
  })

  it("binds lane i to front[i], not to party indexes", () => {
    const s = createFight({ key: KEY }) // front: voice-1, voice-2
    expect(laneAttacker(s, s.party, 0)?.id).toBe("voice-1")
    expect(laneAttacker(s, s.party, 1)?.id).toBe("voice-2")
    expect(laneAttacker(s, s.party, 2)).toBeUndefined()
    expect(performSlot(s, "voice-1")).toBe(0)
    expect(performSlot(s, "voice-2")).toBe(1)
    // The chord-keeper is no one's lane: records fall back to the lead lane.
    expect(performSlot(s, "voice-0")).toBe(0)
    expect(performSlot(s, null)).toBe(0)
  })

  it("mutes lanes with no placed attacker (notes kept, nothing hits)", () => {
    let s = createFight({ key: KEY })
    s = moveFighter(s, "voice-1", null)
    s = moveFighter(s, "voice-2", null)
    s = moveFighter(s, "voice-0", "front") // front: voice-0 only
    // Single onset on the unbound lane 1, hit on the very first tick.
    const solo = toggleNoteEvent(clearTracks(arr()), 1, 0, 1, { degree: 1, len: 1 })
    const r = advanceTick({ ...s, tick: 0 }, solo, seq([0.5, 0.99, 0.99]))
    expect(r.state.enemies[0].hp).toBe(ENEMIES.echo.hp)
    expect(r.state.log.some((l) => l.text.includes("hits"))).toBe(false)
  })

  it("stays silent with an empty front row", () => {
    let s = createFight({ key: KEY })
    s = moveFighter(s, "voice-0", null)
    s = moveFighter(s, "voice-1", null)
    s = moveFighter(s, "voice-2", null)
    const solo = toggleNoteEvent(clearTracks(arr()), 0, 0, 1, { degree: 1, len: 1 })
    const r = advanceTick({ ...s, tick: 0 }, solo, seq([0.5, 0.99, 0.99]))
    expect(r.state.enemies[0].hp).toBe(ENEMIES.echo.hp)
  })

  it("gates the chord pad on a living keeper", () => {
    const s = createFight({ key: KEY }) // voice-0 (strings) keeps the chords
    expect(keeperInstrument(s)).toBe("strings")
    expect(keeperInstrument(moveFighter(s, "voice-0", null))).toBeNull()
    const fallen = {
      ...s,
      party: s.party.map((f) => (f.id === "voice-0" ? { ...f, hp: 0 } : f)),
    }
    expect(keeperInstrument(fallen)).toBeNull()
  })

  it("detects whether any placed attacker still stands", () => {
    const s = createFight({ key: KEY })
    expect(hasLiveAttacker(s)).toBe(true)
    const benched = moveFighter(moveFighter(s, "voice-1", null), "voice-2", null)
    expect(hasLiveAttacker(benched)).toBe(false)
    const fallen = {
      ...s,
      party: s.party.map((f) => (f.id.startsWith("voice-") && s.slots.front.includes(f.id) ? { ...f, hp: 0 } : f)),
    }
    expect(hasLiveAttacker(fallen)).toBe(false)
  })

  it("beat-keeper wards the party on each loop wrap", () => {
    let s = createFight({ key: KEY })
    s = moveFighter(s, "voice-2", "beat")
    s = { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })) }
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

describe("loop damage", () => {
  it("hits passing melodies without any button press", () => {
    let s = createFight({ key: KEY })
    const a = arr()
    const r = advanceTick({ ...s, tick: 1 }, a, seq([0.99, 0.99, 0.99]))
    // Tick 2 lands on a seeded slot-0 onset: piano through the lead lane.
    expect(r.state.enemies[0].hp).toBeLessThan(ENEMIES.echo.hp)
    // Default seats: voice-0 holds chords, so slot-0 melodies hit
    // through voice-1 (piano) — no poison.
    expect(r.state.enemies[0].buffs).toEqual([])
  })

  it("hits through moved front members (violins poison)", () => {
    let s = createFight({ key: KEY })
    // Seat only voice-0 (strings) up front: slot-0 melodies hit via violins.
    s = moveFighter(s, "voice-1", null)
    s = moveFighter(s, "voice-2", null)
    s = moveFighter(s, "voice-0", "front")
    const a = arr()
    const r = advanceTick({ ...s, tick: 1 }, a, seq([0.99, 0.99, 0.99]))
    expect(r.state.enemies[0].hp).toBeLessThan(ENEMIES.echo.hp)
    expect(r.state.enemies[0].buffs.some((b) => b.id === "poison")).toBe(true)
  })

  it("can win the fight by replay alone", () => {
    let s = createFight({ key: KEY })
    s = { ...s, enemies: [{ ...s.enemies[0], hp: 1 }] }
    const a = arr()
    const r = advanceTick({ ...s, tick: 1 }, a, seq([0.99, 0.99, 0.99]))
    expect(r.state.enemies[0].hp).toBe(0)
    expect(r.state.over).toBe("player")
    expect(aliveEnemies(r.state).length).toBe(0)
  })

  it("randomizes targets across the pack", () => {
    const s = createFight({ key: KEY, enemyIds: ["echo", "echo"] })
    // One onset replayed on demand: reset the tick each pass.
    const solo = toggleNoteEvent(clearTracks(arr()), 0, 0, 1, { degree: 1, len: 1 })
    const seen = new Set<string>()
    for (let k = 0; k < 20; k++) {
      const r = advanceTick(
        { ...s, tick: 0, enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })) },
        solo, seq([k % 2 === 0 ? 0.1 : 0.9, 0.99, 0.99]),
      )
      const hurt = r.state.enemies.find((e) => e.hp < 9999)
      if (hurt) seen.add(hurt.id)
    }
    expect(seen.size).toBe(2)
    expect(aliveParty(s).length).toBe(3)
  })

  it("freezes enemy gauges during the intro grace period (Phase A.2)", () => {
    let s = createFight({ key: KEY })
    expect(s.introLoopsLeft).toBe(2)
    let a = arr()
    // Run for 1 full loop (32 steps) — still in intro phase
    for (let i = 0; i < 32; i++) {
      const r = advanceTick(s, a, seq([0.99, 0.99, 0.99]))
      s = r.state
      a = r.arrangement
    }
    expect(s.introLoopsLeft).toBe(1)
    expect(s.gauges[0]).toBe(0)

    // Run for second loop (32 steps) — transitions out of intro
    for (let i = 0; i < 32; i++) {
      const r = advanceTick(s, a, seq([0.99, 0.99, 0.99]))
      s = r.state
      a = r.arrangement
    }
    expect(s.introLoopsLeft).toBe(0)
    expect(s.log.some((l) => l.text.includes("silence breaks"))).toBe(true)

    // On subsequent ticks, gauges now fill
    const r = advanceTick(s, a, seq([0.99, 0.99, 0.99]))
    expect(r.state.gauges[0]).toBeGreaterThan(0)
  })

  it("enforces attackCooldownLoops after a scheduled strike (Phase A.1)", () => {
    let s = createFight({ key: KEY, enemyIds: ["echo"] })
    s = {
      ...s,
      introLoopsLeft: 0,
      parrySchedule: { foeId: "echo-0", strikeTick: 1 },
    }
    let a = arr()
    const r = advanceTick(s, a, seq([0.5]))
    // Echo cooldown is 1 loop: 1 * 32 = 32 steps of frozen gauge.
    expect(r.state.cooldownLeft[0]).toBe(32)
    expect(r.state.gauges[0]).toBe(0)
    expect(r.state.parrySchedule).toBeNull()

    // Next tick decrements cooldown while keeping gauge at 0
    const r2 = advanceTick(r.state, r.arrangement, seq([0.5]))
    expect(r2.state.cooldownLeft[0]).toBe(31)
    expect(r2.state.gauges[0]).toBe(0)
  })

  it("triggers enrage and halves cooldown when enemy HP drops below 25% (Phase D.1)", () => {
    let s = createFight({ key: KEY, enemyIds: ["carapace"] })
    // Carapace (1250 hp) just below 25%: enraged.
    s = {
      ...s,
      introLoopsLeft: 0,
      parrySchedule: { foeId: "carapace-0", strikeTick: 1 },
      enemies: [{ ...s.enemies[0], hp: 100 }],
    }
    let a = arr()
    const r = advanceTick(s, a, seq([0.5]))
    // Normal cooldown = 2 loops * 32 = 64. Enraged halves to 1 loop = 32.
    expect(r.state.cooldownLeft[0]).toBe(32)
  })
})

describe("fill (the kit slam)", () => {
  it("hits every living foe flat and starts the loop-based cooldown", () => {
    const s = createFight({ key: KEY, enemyIds: ["echo", "mite"] })
    const before = s.enemies.map((e) => e.hp)
    const after = fireFill(s, arr())
    expect(after.enemies.map((e) => e.hp)).toEqual(before.map((hp) => hp - 6))
    // 2 loops * 32 steps.
    expect(after.fillCooldownLeft).toBe(64)
    expect(fillReady(s)).toBe(true)
    expect(fillReady(after)).toBe(false)
  })

  it("is a no-op while cooling, with no living foes, or once the fight is over", () => {
    const s = createFight({ key: KEY, enemyIds: ["echo"] })
    const cooling = { ...s, fillCooldownLeft: 5 }
    expect(fireFill(cooling, arr())).toBe(cooling)
    const dead = { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 0 })) }
    expect(fireFill(dead, arr())).toBe(dead)
    const over = { ...s, over: "player" as const }
    expect(fireFill(over, arr())).toBe(over)
  })

  it("wins the fight when the burst finishes the pack", () => {
    const s = createFight({ key: KEY, enemyIds: ["echo"] })
    const nearly = { ...s, enemies: [{ ...s.enemies[0], hp: 3 }] }
    const after = fireFill(nearly, arr())
    expect(after.over).toBe("player")
    expect(aliveEnemies(after).length).toBe(0)
  })

  it("widens an already-open parry chart and reports full drain", () => {
    let s = createFight({ key: KEY, enemyIds: ["echo"] })
    s = { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 9999 })), introLoopsLeft: 0 }
    let a = arr()
    for (let i = 0; i < 32; i++) {
      const r = advanceTick(s, a, seq([0.5]))
      s = r.state
      a = r.arrangement
    }
    expect(s.activeQte?.kind).toBe("parry")
    const before = s.activeQte!.notes.map((n) => n.note.window)
    const after = fireFill(s, a)
    expect(after.activeQte!.notes.map((n) => n.note.window)).toEqual(
      before.map((w) => w + 2),
    )
    // Just fired: the meter reads empty.
    expect(fillCharge(after, a)).toBe(0)
  })
})
