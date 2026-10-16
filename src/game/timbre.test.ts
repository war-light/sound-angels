import { describe, expect, it } from "vitest"
import { INSTRUMENTS, NEUTRAL_KIT } from "../data/enemies"
import { beatInstrument, createFight, moveFighter } from "./combat"
import type { Key } from "./theory"

const KEY: Key = { tonic: "C", scale: "minor", octave: 4 }
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
      for (const t of Object.values(def.timbre.kit)) {
        expect(Number.isFinite(t)).toBe(true)
      }
    }
  })

  it("voices leads distinctly per instrument", () => {
    const leads = Object.values(INSTRUMENTS).map((d) => d.timbre.lead.oscillator)
    expect(new Set(leads).size).toBe(leads.length)
  })

  it("keeps a sane neutral kit for the empty beat seat", () => {
    for (const t of Object.values(NEUTRAL_KIT)) expect(Number.isFinite(t)).toBe(true)
    expect(NEUTRAL_KIT.kickVolume).toBeLessThanOrEqual(0)
  })
})

describe("beatInstrument", () => {
  it("is null with an empty seat, else the keeper's instrument", () => {
    const s = createFight({ key: KEY }) // beat: null by default
    expect(beatInstrument(s)).toBeNull()
    const seated = moveFighter(s, "voice-2", "beat") // brass
    expect(beatInstrument(seated)).toBe("brass")
    expect(beatInstrument(moveFighter(seated, "voice-2", null))).toBeNull()
  })

  it("is null when the keeper is down", () => {
    const s = createFight({ key: KEY })
    const seated = moveFighter(s, "voice-2", "beat")
    const fallen = {
      ...seated,
      party: seated.party.map((f) => (f.id === "voice-2" ? { ...f, hp: 0 } : f)),
    }
    expect(beatInstrument(fallen)).toBeNull()
  })
})
