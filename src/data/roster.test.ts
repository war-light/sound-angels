import { describe, it, expect } from "vitest"
import { ROSTER, DEFAULT_PARTY_ROSTER, getCharacter } from "./roster"
import { INSTRUMENTS } from "./enemies"

describe("roster data", () => {
  it("contains 6 valid characters across 3 instrument families", () => {
    expect(ROSTER).toHaveLength(6)

    const instruments = new Set(ROSTER.map((c) => c.instrument))
    expect(instruments).toContain("strings")
    expect(instruments).toContain("piano")
    expect(instruments).toContain("brass")

    for (const c of ROSTER) {
      expect(c.id).toBeTruthy()
      expect(c.name).toBeTruthy()
      expect(c.avatar).toBeTruthy()
      expect(c.hp).toBeGreaterThan(0)
      expect(c.maxShield).toBeGreaterThanOrEqual(c.shield)
      expect(INSTRUMENTS[c.instrument]).toBeDefined()
    }
  })

  it("resolves characters by id", () => {
    const lyra = getCharacter("lyra")
    expect(lyra?.name).toBe("Lyra")
    expect(lyra?.instrument).toBe("strings")

    const ignis = getCharacter("ignis")
    expect(ignis?.name).toBe("Ignis")
    expect(ignis?.element).toBe("bright")

    expect(getCharacter("unknown")).toBeUndefined()
  })

  it("default party has 3 members with distinct instruments", () => {
    expect(DEFAULT_PARTY_ROSTER).toHaveLength(3)
    const party = DEFAULT_PARTY_ROSTER.map((id) => getCharacter(id)!)
    expect(party.every(Boolean)).toBe(true)

    const instruments = new Set(party.map((p) => p.instrument))
    expect(instruments.size).toBe(3)
  })
})

