import { describe, expect, it } from "vitest"
import { INSTRUMENTS } from "../data/enemies"
import { KITS } from "../data/kits"

const OSCS = ["sine", "triangle", "sawtooth", "square"]

describe("instrument timbres", () => {
  it("gives every instrument a complete source x voice recipe", () => {
    expect(Object.keys(INSTRUMENTS).length).toBeGreaterThan(0)
    for (const def of Object.values(INSTRUMENTS)) {
      for (const voice of [def.timbre.lead, def.timbre.pad]) {
        expect(OSCS).toContain(voice.oscillator)
        for (const t of [voice.envelope.attack, voice.envelope.decay, voice.envelope.release]) {
          expect(t).toBeGreaterThanOrEqual(0)
          expect(t).toBeLessThanOrEqual(3)
        }
        expect(voice.envelope.sustain).toBeGreaterThanOrEqual(0)
        expect(voice.envelope.sustain).toBeLessThanOrEqual(1)
        expect(voice.volume).toBeLessThanOrEqual(0)
        expect(voice.reverbSend).toBeGreaterThanOrEqual(0)
        expect(voice.reverbSend).toBeLessThanOrEqual(1)
      }
      expect(OSCS).toContain(def.timbre.bass.oscillator)
      expect(def.timbre.bass.cutoff).toBeGreaterThan(0)
      expect(def.timbre.bass.volume).toBeLessThanOrEqual(0)
    }
  })

  it("voices leads distinctly per instrument", () => {
    const leads = Object.values(INSTRUMENTS).map((d) => d.timbre.lead.oscillator)
    expect(new Set(leads).size).toBe(leads.length)
  })

  it("ships drum kits with finite timbres and sane effects", () => {
    expect(KITS.length).toBeGreaterThanOrEqual(5)
    for (const kit of KITS) {
      const nums = [
        ...Object.values(kit.timbre.kick),
        ...Object.values(kit.timbre.snare),
        ...Object.values(kit.timbre.hat),
        kit.timbre.perc.harmonicity,
        kit.timbre.perc.resonance,
        kit.timbre.perc.decay,
        kit.timbre.perc.volume,
      ]
      for (const t of nums) expect(Number.isFinite(t)).toBe(true)
      expect(kit.timbre.kick.volume).toBeLessThanOrEqual(0)
      expect(kit.effect.cadence).toBeGreaterThan(0)
      expect(kit.effect.parryWindow).toBeGreaterThanOrEqual(-2)
      expect(kit.effect.parryWindow).toBeLessThanOrEqual(2)
    }
  })
})
