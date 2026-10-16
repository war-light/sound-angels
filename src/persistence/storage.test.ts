import { describe, it, expect, beforeEach } from "vitest"
import {
  clearAllPersistedData,
  loadClearedEncounters,
  loadCustomChords,
  loadSelectedParty,
  loadTutorialSeen,
  saveClearedEncounters,
  saveCustomChords,
  saveSelectedParty,
  saveTutorialSeen,
} from "./storage"

describe("storage persistence module", () => {
  beforeEach(() => {
    clearAllPersistedData()
  })

  it("handles cleared encounters persistence", () => {
    expect(loadClearedEncounters()).toBeNull()
    saveClearedEncounters(["echo-solo", "mite-swarm"])
    expect(loadClearedEncounters()).toEqual(["echo-solo", "mite-swarm"])
  })

  it("handles selected party persistence", () => {
    expect(loadSelectedParty()).toBeNull()
    saveSelectedParty(["lyra", "aria", "ignis"])
    expect(loadSelectedParty()).toEqual(["lyra", "aria", "ignis"])

    // Invalid length rejected
    saveSelectedParty(["lyra"])
    expect(loadSelectedParty()).toBeNull()
  })

  it("handles custom chord presets persistence", () => {
    expect(loadCustomChords()).toBeNull()
    const custom = [{ name: "My Hymn", romans: ["I", "IV", "V", "I"], example: "C-F-G-C" }]
    saveCustomChords(custom)
    expect(loadCustomChords()).toEqual(custom)
  })

  it("handles tutorial seen flag", () => {
    expect(loadTutorialSeen()).toBe(false)
    saveTutorialSeen(true)
    expect(loadTutorialSeen()).toBe(true)
    saveTutorialSeen(false)
    expect(loadTutorialSeen()).toBe(false)
  })

  it("clears all persisted data", () => {
    saveClearedEncounters(["echo-solo"])
    saveTutorialSeen(true)
    clearAllPersistedData()
    expect(loadClearedEncounters()).toBeNull()
    expect(loadTutorialSeen()).toBe(false)
  })
})

