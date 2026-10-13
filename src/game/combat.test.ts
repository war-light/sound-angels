import { describe, expect, it } from "vitest"
import { simulateHit } from "./combat"

describe("simulateHit", () => {
  it("subtracts attack from hp", () => {
    expect(simulateHit({ hp: 10, attack: 3 }, { hp: 10, attack: 1 })).toEqual({
      hp: 7,
      attack: 1,
    })
  })

  it("clamps at zero", () => {
    expect(simulateHit({ hp: 10, attack: 99 }, { hp: 5, attack: 1 }).hp).toBe(0)
  })
})
