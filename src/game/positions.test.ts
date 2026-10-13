import { describe, expect, it } from "vitest"
import {
  assignToSlot,
  deckIds,
  defaultSlots,
  removeToDeck,
  slotOf,
} from "./positions"

const PARTY = ["voice-0", "voice-1", "voice-2"]

describe("defaultSlots", () => {
  it("seats voice-0 at chords, the rest up front", () => {
    expect(defaultSlots(PARTY)).toEqual({
      chord: "voice-0",
      beat: null,
      front: ["voice-1", "voice-2"],
    })
    expect(deckIds(PARTY, defaultSlots(PARTY))).toEqual([])
  })
})

describe("assignToSlot", () => {
  it("moves fighters between slots, one per back-row seat", () => {
    let s = defaultSlots(PARTY)
    s = assignToSlot(s, "voice-1", "chord")
    expect(s.chord).toBe("voice-1")
    expect(s.front).toEqual(["voice-2"])
    expect(deckIds(PARTY, s)).toEqual(["voice-0"])
    expect(slotOf(s, "voice-1")).toBe("chord")
    expect(slotOf(s, "voice-0")).toBe(null)
  })

  it("caps the front row, evicting the longest-seated", () => {
    let s = assignToSlot(defaultSlots(PARTY), "voice-0", "front")
    // front was [v1, v2], adding v0 keeps the last two + newcomer
    expect(s.front).toEqual(["voice-1", "voice-2", "voice-0"].slice(-3))
    expect(s.front.length).toBeLessThanOrEqual(3)
    s = assignToSlot(s, "voice-0", "beat")
    expect(s.beat).toBe("voice-0")
    expect(s.front).not.toContain("voice-0")
  })

  it("is immutable and serializable", () => {
    const s = defaultSlots(PARTY)
    assignToSlot(s, "voice-2", "beat")
    expect(s.beat).toBe(null)
    expect(JSON.parse(JSON.stringify(s))).toEqual(s)
  })
})

describe("removeToDeck", () => {
  it("returns fighters to the deck", () => {
    const s = removeToDeck(defaultSlots(PARTY), "voice-1")
    expect(s.front).toEqual(["voice-2"])
    expect(deckIds(PARTY, s)).toEqual(["voice-1"])
  })
})
