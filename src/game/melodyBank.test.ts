import { describe, expect, it } from "vitest"
import {
  createDefaultMelodyBank,
  deleteTemplate,
  getTemplate,
  saveTemplate,
} from "./melodyBank"
import { createDefaultArrangement } from "./arrangement"

describe("melodyBank", () => {
  it("initializes with default starter templates", () => {
    const bank = createDefaultMelodyBank()
    const keys = Object.keys(bank)
    expect(keys.length).toBeGreaterThanOrEqual(3)
    expect(bank["dawn-anthem"]).toBeDefined()
    expect(bank["staccato-flight"]).toBeDefined()
    expect(bank["solemn-ground"]).toBeDefined()
  })

  it("saves a new melody template", () => {
    const bank = createDefaultMelodyBank()
    const arr = createDefaultArrangement()
    const res = saveTemplate(bank, {
      name: "Custom Loop",
      description: "A test loop",
      tracks: arr.tracks,
      chords: arr.chords,
      tags: ["custom"],
    })

    expect(res.template.name).toBe("Custom Loop")
    expect(res.template.id).toBeDefined()
    expect(res.bank[res.template.id]).toBeDefined()
    expect(getTemplate(res.bank, res.template.id)).toEqual(res.template)
  })

  it("rejects empty template names", () => {
    const bank = createDefaultMelodyBank()
    const arr = createDefaultArrangement()
    expect(() =>
      saveTemplate(bank, {
        name: "   ",
        tracks: arr.tracks,
        chords: arr.chords,
      }),
    ).toThrow()
  })

  it("deletes a template by id", () => {
    const bank = createDefaultMelodyBank()
    const updated = deleteTemplate(bank, "dawn-anthem")
    expect(updated["dawn-anthem"]).toBeUndefined()
    expect(bank["dawn-anthem"]).toBeDefined() // immutable
  })
})

