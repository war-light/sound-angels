import { describe, expect, it } from "vitest"
import {
  diatonicFitScore,
  romanFunction,
  scoreProgression,
  syntaxScore,
  voiceLeadingScore,
  type Key,
} from "./theory"

const C_MAJOR: Key = { tonic: "C", scale: "major", octave: 4 }
const C_MINOR: Key = { tonic: "C", scale: "minor", octave: 4 }

describe("romanFunction", () => {
  it("labels T/SD/D in major and minor", () => {
    expect(romanFunction(C_MAJOR, "I")).toBe("T")
    expect(romanFunction(C_MAJOR, "IV")).toBe("SD")
    expect(romanFunction(C_MAJOR, "V")).toBe("D")
    expect(romanFunction(C_MINOR, "i")).toBe("T")
    expect(romanFunction(C_MINOR, "iv")).toBe("SD")
    expect(romanFunction(C_MINOR, "V")).toBe("D")
  })
})

describe("scoreProgression", () => {
  it("rates the canonical I–V–vi–IV as gold", () => {
    const s = scoreProgression(C_MAJOR, ["I", "V", "vi", "IV"])
    expect(s.tier).toBe("gold")
    expect(s.diatonicFit).toBe(100)
    expect(s.syntax).toBeGreaterThan(60)
  })

  it("rates i–VI–III–VII and i–iv–V–i as gold", () => {
    expect(scoreProgression(C_MINOR, ["i", "VI", "III", "VII"]).tier).toBe("gold")
    expect(scoreProgression(C_MINOR, ["i", "iv", "V", "i"]).tier).toBe("gold")
  })

  it("punishes retrograde/static loops below gold", () => {
    const bad = scoreProgression(C_MAJOR, ["IV", "V", "IV", "V"])
    expect(bad.tier).not.toBe("gold")
    expect(bad.syntax).toBeLessThan(
      scoreProgression(C_MAJOR, ["I", "V", "vi", "IV"]).syntax,
    )
    const good = scoreProgression(C_MAJOR, ["I", "V", "vi", "IV"])
    expect(good.total).toBeGreaterThan(bad.total + 10)
  })

  it("is transposition-invariant (same romans, any key)", () => {
    const a = scoreProgression(C_MAJOR, ["I", "V", "vi", "IV"])
    const b = scoreProgression({ tonic: "F#", scale: "major", octave: 3 }, ["I", "V", "vi", "IV"])
    expect(b).toEqual({ ...a })
  })

  it("weights 40/30/30", () => {
    const s = scoreProgression(C_MAJOR, ["I", "V", "vi", "IV"])
    expect(s.total).toBe(Math.round(s.voiceLeading * 0.4 + s.diatonicFit * 0.3 + s.syntax * 0.3))
  })
})

describe("voiceLeadingScore", () => {
  it("is 100 for static or single chords, 0 for wildly leaping ones", () => {
    expect(voiceLeadingScore([[60, 64, 67]])).toBe(100)
    expect(voiceLeadingScore([[60, 64, 67], [60, 64, 67]])).toBe(100)
    // Tritone-plus leaps everywhere.
    expect(voiceLeadingScore([[60], [66], [60], [66]])).toBeLessThan(60)
  })
})

describe("diatonicFitScore", () => {
  it("penalizes chromatic tones and unanchorable sets", () => {
    const diatonic = [[60, 64, 67], [65, 69, 72]] // C + F in C major
    expect(diatonicFitScore(C_MAJOR, diatonic)).toBe(100)
    const chromatic = [[60, 61, 62], [63, 64, 65]]
    expect(diatonicFitScore(C_MAJOR, chromatic)).toBeLessThan(70)
  })
})

describe("syntaxScore", () => {
  it("rewards authentic flow, punishes retrogression", () => {
    expect(syntaxScore(C_MAJOR, ["I", "IV", "V", "I"])).toBeGreaterThan(
      syntaxScore(C_MAJOR, ["V", "IV", "V", "IV"]),
    )
  })
})
