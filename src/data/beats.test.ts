import { describe, expect, it } from "vitest"
import {
  BANKS,
  RIG_PRESETS,
  defaultBank,
  defaultRig,
  getBank,
  getRigPreset,
  rigsForBank,
} from "./beats"
import { DRUM_VOICES, countGrooveHits, formatPattern, type ClipSteps } from "@/game/groove"
import { getKit } from "./kits"

describe("beat library", () => {
  it("authors 5 banks x 4 voices x 4 tiers = 80 distinct clips", () => {
    const ids = new Set<string>()
    let clips = 0
    for (const bank of BANKS) {
      for (const voice of DRUM_VOICES) {
        for (const clip of bank.clips[voice]) {
          ids.add(clip.id)
          clips += 1
        }
      }
    }
    expect(clips).toBe(80)
    expect(ids.size).toBe(80)
  })

  it("gives every bank a name, archetype, bpm hint and genres", () => {
    for (const bank of BANKS) {
      expect(bank.name.length).toBeGreaterThan(0)
      expect(bank.archetype.length).toBeGreaterThan(0)
      expect(bank.bpmHint).toBeGreaterThanOrEqual(60)
      expect(bank.bpmHint).toBeLessThanOrEqual(180)
      expect(bank.genres.length).toBeGreaterThan(0)
      expect(bank.genres.every((g) => g.length > 0)).toBe(true)
    }
  })

  it("keeps each voice's four tiers distinct and every top tier sounding", () => {
    const hits = (steps: ClipSteps) => steps.reduce((n, h) => (h ? n + 1 : n), 0)
    for (const bank of BANKS) {
      for (const voice of DRUM_VOICES) {
        const shapes = bank.clips[voice].map((c) => formatPattern(c.steps))
        expect(new Set(shapes).size).toBe(4)
        // Sparse columns may legitimately rest; the Complex tier never does.
        expect(hits(bank.clips[voice][3].steps)).toBeGreaterThan(0)
      }
    }
  })

  it("resolves ids and falls back to the straight bank", () => {
    expect(getBank("broken")?.name).toContain("Break")
    expect(getBank("nope")).toBeUndefined()
    expect(defaultBank().id).toBe(BANKS[0].id)
    expect(getRigPreset("trap:trap-roll")?.bankId).toBe("trap")
    expect(getRigPreset("nope")).toBeUndefined()
  })
})

describe("curated rigs", () => {
  it("ships three rigs per bank that actually sound", () => {
    for (const bank of BANKS) {
      const rigs = rigsForBank(bank.id)
      expect(rigs.length).toBe(3)
      for (const rig of rigs) {
        expect(rig.bankId).toBe(bank.id)
        expect(countGrooveHits(rig)).toBeGreaterThanOrEqual(4)
        expect(getKit(rig.kitId)).toBeDefined()
      }
    }
  })

  it("hands out clones so callers can't corrupt the presets", () => {
    const [first] = rigsForBank("straight")
    first.cell.kick[0] = null
    expect(RIG_PRESETS.find((r) => r.id === first.id)!.cell.kick[0]).not.toBeNull()
  })

  it("starts a session on a sounding straight-bank rig", () => {
    const rig = defaultRig()
    expect(rig.bankId).toBe("straight")
    expect(countGrooveHits(rig)).toBeGreaterThan(4)
    // defaultRig returns a copy, not the shared preset object.
    rig.cell.snare[4] = null
    expect(getRigPreset(rig.id)!.cell.snare[4]).not.toBe(null)
  })
})
