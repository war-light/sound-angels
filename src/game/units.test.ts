import { describe, expect, it } from "vitest"
import {
  addShield,
  applyBuff,
  buffDamageTaken,
  damageThroughShield,
  healFighter,
  isDown,
  makeFighter,
  tickBuffs,
} from "./units"

describe("damageThroughShield", () => {
  it("shield absorbs first, overflow hits HP", () => {
    const f = makeFighter({ id: "a", side: "party", name: "A", hp: 20, shield: 5 })
    const r = damageThroughShield(f, 8)
    expect(r.shielded).toBe(5)
    expect(r.toHp).toBe(3)
    expect(r.fighter.shield).toBe(0)
    expect(r.fighter.hp).toBe(17)
  })

  it("clamps at zero and never heals via damage", () => {
    const f = makeFighter({ id: "a", side: "foe", name: "A", hp: 3 })
    const r = damageThroughShield(f, 99)
    expect(r.fighter.hp).toBe(0)
    expect(isDown(r.fighter)).toBe(true)
    expect(damageThroughShield(f, -5).fighter.hp).toBe(3)
  })

  it("is immutable", () => {
    const f = makeFighter({ id: "a", side: "party", name: "A", hp: 20, shield: 5 })
    damageThroughShield(f, 3)
    expect(f.shield).toBe(5)
    expect(f.hp).toBe(20)
  })
})

describe("heal / shield", () => {
  it("heal caps at max and ignores the fallen", () => {
    const f = { ...makeFighter({ id: "a", side: "party", name: "A", hp: 20 }), hp: 18 }
    expect(healFighter(f, 5).hp).toBe(20)
    const dead = { ...f, hp: 0 }
    expect(healFighter(dead, 5).hp).toBe(0)
  })

  it("shield caps at maxShield", () => {
    const f = makeFighter({ id: "a", side: "party", name: "A", hp: 20, shield: 2 })
    expect(addShield(f, 99).shield).toBe(f.maxShield)
  })
})

describe("buffs", () => {
  it("same id refreshes duration, takes max power", () => {
    let f = makeFighter({ id: "a", side: "foe", name: "A", hp: 20 })
    f = applyBuff(f, { id: "poison", power: 2, ticksLeft: 3 })
    f = applyBuff(f, { id: "poison", power: 5, ticksLeft: 2 })
    expect(f.buffs).toEqual([{ id: "poison", power: 5, ticksLeft: 3 }])
  })

  it("ticksLeft <= 0 clears the buff", () => {
    let f = makeFighter({ id: "a", side: "foe", name: "A", hp: 20 })
    f = applyBuff(f, { id: "poison", power: 2, ticksLeft: 3 })
    f = applyBuff(f, { id: "poison", power: 2, ticksLeft: 0 })
    expect(f.buffs).toEqual([])
  })

  it("poison bypasses shield straight to HP; regen heals", () => {
    let f = makeFighter({ id: "a", side: "foe", name: "A", hp: 20, shield: 10 })
    f = applyBuff(f, { id: "poison", power: 3, ticksLeft: 2 })
    const t1 = tickBuffs(f)
    expect(t1.fighter.hp).toBe(17)
    expect(t1.fighter.shield).toBe(10)
    expect(t1.events.length).toBe(1)
    const t2 = tickBuffs({ ...t1.fighter, hp: 10 })
    const withRegen = applyBuff(t2.fighter, { id: "regen", power: 4, ticksLeft: 1 })
    const t3 = tickBuffs(withRegen)
    // poison 3 then regen 4: 7 -> 11, both buffs expire
    expect(t3.fighter.hp).toBe(11)
    expect(t3.fighter.buffs).toEqual([])
  })

  it("exposed/warded modify damage taken", () => {
    let f = makeFighter({ id: "a", side: "foe", name: "A", hp: 20 })
    expect(buffDamageTaken(f)).toBe(1)
    f = applyBuff(f, { id: "exposed", power: 50, ticksLeft: 2 })
    expect(buffDamageTaken(f)).toBe(1.5)
    f = applyBuff(f, { id: "warded", power: 20, ticksLeft: 2 })
    expect(buffDamageTaken(f)).toBeCloseTo(1.2, 10)
  })

  it("serializes to JSON", () => {
    const f = applyBuff(makeFighter({ id: "a", side: "foe", name: "A", hp: 20 }), {
      id: "poison", power: 1, ticksLeft: 2,
    })
    expect(JSON.parse(JSON.stringify(f))).toEqual(f)
  })
})
