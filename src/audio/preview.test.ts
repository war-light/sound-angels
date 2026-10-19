import { describe, expect, it } from "vitest"
import { auditionStep } from "@/audio/preview"
import { createDefaultArrangement, snapshotStep, type StepSnapshot } from "@/game/arrangement"
import { DRUM_VOICES } from "@/game/groove"

/** Step 0 of the default loop: a melody onset, the "i" chord and a kick. */
function firstStep(): StepSnapshot {
  return snapshotStep(createDefaultArrangement(), 0, 0)
}

describe("auditionStep", () => {
  it("passes the whole loop through for a sequencer preview", () => {
    const snap = firstStep()
    expect(auditionStep(snap, "all")).toBe(snap)
  })

  it("sounds a rig as its kit, with no singers, bass or chord stab", () => {
    const base = firstStep()
    const snap = auditionStep(base, "drums")
    expect(snap.kitId).toBe(base.kitId)
    expect(snap.drums.kick.vel).toBeGreaterThan(0)
    // The bug: a rig audition used to carry the loop's melody + pad stab.
    expect(snap.melodies).toEqual([])
    expect(snap.bass).toBeNull()
    expect(snap.chord).toEqual([])
  })

  it("sounds a melody card as its voices and chords over a resting kit", () => {
    const base = firstStep()
    const snap = auditionStep(base, "melody")
    expect(snap.melodies.length).toBeGreaterThan(0)
    expect(snap.chord.length).toBeGreaterThan(0)
    for (const voice of DRUM_VOICES) {
      expect(snap.drums[voice].vel).toBe(0)
      expect(snap[voice]).toBe(false)
    }
  })
})
