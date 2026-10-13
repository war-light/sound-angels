import { describe, expect, it } from "vitest"
import {
  DEFAULT_KEY,
  degreeToMidi,
  midiToNote,
  pitchClassOfMidi,
  romanToChord,
  tensionOf,
  transposeKey,
  transposeKeySemitones,
} from "./theory"

describe("degreeToMidi", () => {
  it("maps 1/3/5 in C minor to C/Eb/G", () => {
    expect(midiToNote(degreeToMidi(DEFAULT_KEY, 1))).toBe("C4")
    // Vendored tables use sharps; Eb normalizes to D#.
    expect(pitchClassOfMidi(degreeToMidi(DEFAULT_KEY, 3))).toBe("D#")
    expect(midiToNote(degreeToMidi(DEFAULT_KEY, 5))).toBe("G4")
  })

  it("wraps past the octave (degree 8 = tonic up)", () => {
    expect(degreeToMidi(DEFAULT_KEY, 8) - degreeToMidi(DEFAULT_KEY, 1)).toBe(12)
  })

  it("transposes whole-key: +2 semitones moves C minor to D minor", () => {
    const d = transposeKeySemitones(DEFAULT_KEY, 2)
    expect(d.tonic).toBe("D")
    expect(degreeToMidi(d, 1)).toBe(degreeToMidi(DEFAULT_KEY, 1) + 2)
  })

  it("transposeKey keeps scale and moves tonic", () => {
    const moved = transposeKey(DEFAULT_KEY, "5P")
    expect(moved.tonic).toBe("G")
    expect(moved.scale).toBe("minor")
  })
})

describe("romanToChord", () => {
  it("builds i / VI / III / VII in C minor (pitch classes)", () => {
    const pcs = (r: string) => romanToChord(DEFAULT_KEY, r).map(pitchClassOfMidi)
    expect(pcs("i")).toEqual(["C", "D#", "G"])
    expect(pcs("VI")).toEqual(["G#", "C", "D#"])
    expect(pcs("III")).toEqual(["D#", "G", "A#"])
    expect(pcs("VII")).toEqual(["A#", "D", "F"])
  })

  it("raises the dominant third in minor (V has B natural)", () => {
    expect(romanToChord(DEFAULT_KEY, "V").map(pitchClassOfMidi)).toEqual([
      "G", "B", "D",
    ])
  })

  it("V7 adds a minor seventh (F)", () => {
    expect(romanToChord(DEFAULT_KEY, "V7").map(pitchClassOfMidi)).toEqual([
      "G", "B", "D", "F",
    ])
  })
})

describe("tensionOf", () => {
  it("is 0 for chord tones, >0 for dissonance, 0 for empty", () => {
    const chord = romanToChord(DEFAULT_KEY, "i")
    expect(tensionOf(chord, chord)).toBe(0)
    expect(tensionOf([], chord)).toBe(0)
    const clash = tensionOf([degreeToMidi(DEFAULT_KEY, 2)], chord)
    expect(clash).toBeGreaterThan(0)
    expect(clash).toBeLessThanOrEqual(1)
  })
})
