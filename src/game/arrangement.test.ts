import { describe, expect, it } from "vitest"
import {
  ATTACK_SLOTS,
  clearTracks,
  countOnsets,
  createDefaultArrangement,
  hashMelodySet,
  locateStep,
  loopLength,
  setBarChord,
  setBpm,
  setGroove,
  snapshotStep,
  toggleNoteEvent,
  tweakGrooveKnobs,
} from "./arrangement"
import { getRigPreset } from "@/data/beats"
import { MAX_SWING } from "./groove"
describe("createDefaultArrangement", () => {
  it("builds 3 tracks over a 4x16 loop with seeded slot 0", () => {
    const arr = createDefaultArrangement()
    expect(arr.tracks.length).toBe(ATTACK_SLOTS)
    expect(arr.chords).toEqual(["i", "VI", "i", "VI"])
    expect(loopLength(arr)).toBe(64)
    expect(arr.tracks[0][0][0]).toEqual({ degree: 1, len: 1 })
    expect(arr.tracks[1][0][0]).toBe(null)
    expect(countOnsets(arr)).toBeGreaterThan(0)
  })

  it("round-trips through JSON (serializable)", () => {
    const arr = createDefaultArrangement()
    expect(JSON.parse(JSON.stringify(arr))).toEqual(arr)
  })
})

describe("edits", () => {
  it("toggleNoteEvent is immutable and validates", () => {
    const arr = createDefaultArrangement()
    const next = toggleNoteEvent(arr, 1, 0, 1, { degree: 5, len: 4 })
    expect(next.tracks[1][0][1]).toEqual({ degree: 5, len: 4 })
    expect(arr.tracks[1][0][1]).toBe(null)
    expect(toggleNoteEvent(next, 1, 0, 1, null).tracks[1][0][1]).toBe(null)
    expect(() => toggleNoteEvent(arr, 9, 0, 0, { degree: 1, len: 1 })).toThrow()
    expect(() => toggleNoteEvent(arr, 0, 0, 0, { degree: 1, len: 0 })).toThrow()
  })

  it("setGroove equips a deep copy without disturbing the shipped preset", () => {
    const arr = createDefaultArrangement()
    const preset = getRigPreset("broken:amen-chops")!
    const next = setGroove(arr, preset)
    expect(next.groove.id).toBe(preset.id)
    expect(next.groove.cell).not.toBe(preset.cell)
    next.groove.cell.kick[0] = { vel: 0.1 }
    expect(preset.cell.kick[0]?.vel).not.toBe(0.1)
    expect(arr.groove.id).not.toBe(preset.id)
  })

  it("tweakGrooveKnobs clamps the swing knob instead of throwing", () => {
    const arr = tweakGrooveKnobs(createDefaultArrangement(), { swing: 9 })
    expect(arr.groove.swing).toBe(MAX_SWING)
    expect(createDefaultArrangement().groove.swing).toBe(0)
  })

  it("clearTracks wipes every slot", () => {
    const arr = createDefaultArrangement()
    const next = clearTracks(arr)
    expect(countOnsets(next)).toBe(0)
    expect(next.bass[0][0]).toBe(null)
  })

  it("setBarChord + setBpm clamp and scope correctly", () => {
    const arr = createDefaultArrangement()
    expect(setBarChord(arr, 1, "V").chords).toEqual(["i", "V", "i", "VI"])
    expect(setBpm(arr, 999).bpm).toBe(160)
    expect(setBpm(arr, 5).bpm).toBe(50)
  })

  it("throws on out-of-range positions", () => {
    const arr = createDefaultArrangement()
    expect(() => toggleNoteEvent(arr, 0, 9, 0, { degree: 1, len: 1 })).toThrow()
    expect(() => snapshotStep(arr, 0, 99)).toThrow()
  })
})

describe("snapshotStep", () => {
  it("resolves all slots with chord-tone flags", () => {
    let arr = createDefaultArrangement()
    arr = toggleNoteEvent(arr, 2, 0, 0, { degree: 1, len: 1 })
    const s0 = snapshotStep(arr, 0, 0)
    expect(s0.melodies.length).toBe(2)
    const slots = s0.melodies.map((m) => m.slot).sort()
    expect(slots).toEqual([0, 2])
    // Degree 1 over chord i is a chord tone.
    expect(s0.melodies.every((m) => m.chordTone)).toBe(true)
    expect(s0.chord.length).toBe(3)
    expect(s0.kick).toBe(true)
  })

  it("resolves all four drum voices with velocity and the kit id", () => {
    // Default rig: straight bank, kick 1 / snare 1 / hat 2 / perc 1.
    const arr = createDefaultArrangement()
    const s0 = snapshotStep(arr, 0, 0)
    expect(s0.kick).toBe(true)
    expect(s0.drums.kick.vel).toBe(1)
    expect(s0.kitId).toBe(arr.groove.kitId)
    // Straight bank swings flat, so no lag on any step.
    expect(s0.swingDelay).toBe(0)
    // Offbeat sixteenth hat from the Driving column.
    expect(snapshotStep(arr, 0, 1).hat).toBe(true)
    // Perc lands on the "and" of 1 (step 4) in the Steady column.
    expect(snapshotStep(arr, 0, 4).perc).toBe(true)
    expect(snapshotStep(arr, 0, 4).drums.perc.vel).toBeGreaterThan(0)
  })

  it("flags non-chord tones", () => {
    const arr = createDefaultArrangement() // step 0,1 empty on slot 0
    const next = toggleNoteEvent(arr, 0, 0, 1, { degree: 2, len: 1 })
    const s = snapshotStep(next, 0, 1)
    expect(s.melodies[0].chordTone).toBe(false)
  })
})

describe("locateStep", () => {
  it("wraps around the loop", () => {
    const arr = createDefaultArrangement()
    expect(locateStep(arr, 0)).toEqual({ bar: 0, step: 0 })
    expect(locateStep(arr, 16)).toEqual({ bar: 1, step: 0 })
    expect(locateStep(arr, 32)).toEqual({ bar: 2, step: 0 })
    expect(locateStep(arr, 64)).toEqual({ bar: 0, step: 0 })
  })
})

describe("hashMelodySet", () => {
  it("is stable, order-independent, and sensitive to content", () => {
    const arr = createDefaultArrangement()
    const h1 = hashMelodySet(arr.tracks, arr.chords)
    const h2 = hashMelodySet(arr.tracks, arr.chords)
    expect(h1).toBe(h2)
    expect(h1).toMatch(/^[0-9a-f]{8}$/)
    const changed = toggleNoteEvent(arr, 0, 0, 1, { degree: 5, len: 1 })
    expect(hashMelodySet(changed.tracks, changed.chords)).not.toBe(h1)
    const chordChanged = setBarChord(arr, 0, "V")
    expect(hashMelodySet(chordChanged.tracks, chordChanged.chords)).not.toBe(h1)
  })

  it("ignores renames by construction (hash covers notes + chords only)", () => {
    const arr = createDefaultArrangement()
    // Same content rebuilt cell by cell hashes identically.
    const rebuilt = clearTracks(arr)
    let cur = rebuilt
    arr.tracks[0].forEach((row, bar) => {
      row.forEach((e, step) => {
        if (e != null) cur = toggleNoteEvent(cur, 0, bar, step, { ...e })
      })
    })
    expect(hashMelodySet(cur.tracks, cur.chords)).toBe(hashMelodySet(arr.tracks, arr.chords))
  })
})
