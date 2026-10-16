import { describe, expect, it } from "vitest"
import {
  ENCOUNTERS,
  getEncounter,
  validateEncounters,
  DEFAULT_ENCOUNTER_ID,
  isEncounterUnlocked,
  getNextEncounterId,
} from "./encounters"
import { ENEMIES } from "./enemies"

describe("encounters data", () => {
  it("validates all encounter definitions reference valid enemy IDs", () => {
    expect(validateEncounters()).toBe(true)
  })

  it("contains at least 5 curated encounters of escalating variety", () => {
    expect(ENCOUNTERS.length).toBeGreaterThanOrEqual(5)
  })

  it("has a valid default encounter", () => {
    const def = getEncounter(DEFAULT_ENCOUNTER_ID)
    expect(def).toBeDefined()
    expect(def?.enemyIds.length).toBeGreaterThan(0)
  })

  it("supports multi-enemy compositions", () => {
    const multi = ENCOUNTERS.filter((e) => e.enemyIds.length > 1)
    expect(multi.length).toBeGreaterThanOrEqual(3)
    for (const enc of multi) {
      for (const eid of enc.enemyIds) {
        expect(ENEMIES[eid]).toBeDefined()
      }
    }
  })

  it("handles linear unlock progression correctly", () => {
    // First encounter is always unlocked
    expect(isEncounterUnlocked([], "echo-solo")).toBe(true)
    // Subsequent encounters locked without prerequisites
    expect(isEncounterUnlocked([], "mite-swarm")).toBe(false)
    expect(isEncounterUnlocked([], "discordant-choir")).toBe(false)

    // Clearing first encounter unlocks second
    expect(isEncounterUnlocked(["echo-solo"], "mite-swarm")).toBe(true)
    expect(isEncounterUnlocked(["echo-solo"], "shield-and-mirror")).toBe(false)

    // Sequential clearing
    expect(isEncounterUnlocked(["echo-solo", "mite-swarm"], "shield-and-mirror")).toBe(true)
  })

  it("resolves next encounter ID in chain", () => {
    expect(getNextEncounterId("echo-solo")).toBe("mite-swarm")
    expect(getNextEncounterId("mite-swarm")).toBe("shield-and-mirror")
    expect(getNextEncounterId("discordant-choir")).toBeNull()
  })
})
