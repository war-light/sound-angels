import { describe, expect, it } from "vitest"
import { BANKS, RIG_PRESETS, defaultRig, getBank } from "@/data/beats"
import { KITS, defaultKit, getKit } from "@/data/kits"
import {
  CLIP_TIERS,
  DEFAULT_BANK_ID,
  DEFAULT_KIT_ID,
  DRUM_VOICES,
  GROOVE_STEPS,
  MAX_SWING,
  applyKit,
  bottleGroove,
  clampSwing,
  clampTier,
  cloneGroove,
  countGrooveHits,
  createRig,
  describeGrooveEffect,
  emptyCell,
  formatPattern,
  grooveHit,
  grooveHitRoll,
  grooveHitVel,
  isSilent,
  parseGroove,
  parsePattern,
  resolveCell,
  swingDelaySteps,
  tweakGroove,
  withBank,
  withPick,
  type ClipSteps,
} from "./groove"

/** Hits + roll sub-hits: how much the clip actually sounds. */
function effectiveHits(cell: ClipSteps): number {
  let n = 0
  for (const h of cell) {
    if (h != null) n += 1 + (h.roll ?? 0)
  }
  return n
}

describe("notation", () => {
  it("round-trips every shipped clip", () => {
    for (const bank of BANKS) {
      for (const voice of DRUM_VOICES) {
        for (const clip of bank.clips[voice]) {
          expect(clip.steps.length).toBe(GROOVE_STEPS)
          expect(parsePattern(formatPattern(clip.steps))).toEqual(clip.steps)
        }
      }
    }
  })

  it("rejects bad lengths and glyphs", () => {
    expect(() => parsePattern("X---")).toThrow()
    expect(() => parsePattern("X---X---X---X--Z")).toThrow()
  })

  it("treats R as an accented roll", () => {
    const steps = parsePattern("R---------------")
    expect(steps[0]).toEqual({ vel: 1, roll: 1 })
    expect(formatPattern(steps)).toBe("R---------------")
  })
})

describe("banks", () => {
  it("ships five banks of 4 voices x 4 tiers", () => {
    expect(BANKS.map((b) => b.id)).toEqual([
      "straight",
      "halftime",
      "trap",
      "tresillo",
      "broken",
    ])
    for (const bank of BANKS) {
      expect(bank.genres.length).toBeGreaterThan(0)
      expect(bank.bpmHint).toBeGreaterThan(60)
      for (const voice of DRUM_VOICES) {
        expect(bank.clips[voice].length).toBe(4)
        bank.clips[voice].forEach((clip, tier) => {
          expect(clip.tier).toBe(tier)
          expect(clip.voice).toBe(voice)
          expect(clip.id).toBe(`${bank.id}:${voice}:${tier}`)
        })
      }
      expect(clampTier(bank.defaultPicks.kick)).toBe(bank.defaultPicks.kick)
    }
    expect(getBank("nope")).toBeUndefined()
  })

  it("orders each voice's tiers from sparse to complex", () => {
    for (const bank of BANKS) {
      for (const voice of DRUM_VOICES) {
        const counts = bank.clips[voice].map((c) => effectiveHits(c.steps))
        for (let i = 1; i < counts.length; i++) {
          expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1])
        }
        expect(counts[3]).toBeGreaterThan(counts[0])
      }
    }
  })

  it("keeps all four tiers of a voice distinct", () => {
    for (const bank of BANKS) {
      for (const voice of DRUM_VOICES) {
        const shapes = bank.clips[voice].map((c) => formatPattern(c.steps))
        expect(new Set(shapes).size).toBe(4)
      }
    }
  })

  it("lines up the tier labels with the four rows", () => {
    expect(CLIP_TIERS.length).toBe(4)
    expect(CLIP_TIERS).toEqual(["Sparse", "Steady", "Driving", "Complex"])
  })
})

describe("rigs", () => {
  it("resolves picks into one 16-step column per voice", () => {
    const bank = getBank("trap")!
    const cell = resolveCell(bank, { kick: 2, snare: 1, hat: 3, perc: 0 })
    for (const voice of DRUM_VOICES) {
      expect(cell[voice].length).toBe(GROOVE_STEPS)
    }
    expect(cell.kick).toEqual(bank.clips.kick[2].steps)
    // Copies, not aliases: editing the cell never touches the bank.
    cell.kick[0] = null
    expect(bank.clips.kick[2].steps[0]).not.toBeNull()
  })

  it("builds a rig from a bank + picks + kit", () => {
    const bank = getBank("broken")!
    const kit = getKit("syncopator")!
    const rig = createRig(bank, { kick: 3, snare: 2, hat: 1, perc: 0 }, kit, {
      id: "test",
      name: "Test",
      source: "card",
    })
    expect(rig.bankId).toBe("broken")
    expect(rig.kitId).toBe("syncopator")
    expect(rig.effect).toEqual(kit.effect)
    expect(rig.swing).toBe(bank.swing)
    expect(countGrooveHits(rig)).toBeGreaterThan(0)
  })

  it("withPick swaps one column and marks the rig hand-built", () => {
    const bank = getBank("straight")!
    const rig = defaultRig()
    const next = withPick(rig, "hat", 0, bank)
    expect(next.picks.hat).toBe(0)
    expect(next.cell.hat).toEqual(bank.clips.hat[0].steps)
    expect(next.source).toBe("custom")
    expect(rig.picks.hat).toBe(2)
  })

  it("withBank pages banks and brings the bank's pads + feel", () => {
    const bank = getBank("broken")!
    const next = withBank(defaultRig(), bank, defaultKit())
    expect(next.bankId).toBe("broken")
    expect(next.picks).toEqual(bank.defaultPicks)
    expect(next.swing).toBe(bank.swing)
  })

  it("applyKit swaps timbre + effect without touching the pattern", () => {
    const rig = defaultRig()
    const next = applyKit(rig, getKit("halftime-hull")!)
    expect(next.kitId).toBe("halftime-hull")
    expect(next.effect.cadence).toBe(0.8)
    expect(next.cell).toEqual(rig.cell)
  })

  it("clones deeply so edits never leak", () => {
    const rig = defaultRig()
    const copy = cloneGroove(rig)
    copy.cell.kick[0] = { vel: 0.1 }
    copy.picks.kick = 3
    expect(rig.cell.kick[0]?.vel).not.toBe(0.1)
    expect(rig.picks.kick).not.toBe(3)
  })
})

describe("reads", () => {
  it("reports velocity, roll and silence per step", () => {
    const bank = getBank("trap")!
    const rig = createRig(bank, { kick: 1, snare: 1, hat: 3, perc: 0 }, defaultKit())
    const hat = bank.clips.hat[3].steps
    const rollStep = hat.findIndex((h) => h?.roll)
    expect(rollStep).toBeGreaterThanOrEqual(0)
    expect(grooveHitRoll(rig, "hat", rollStep)).toBe(1)
    expect(grooveHitVel(rig, "hat", rollStep)).toBeGreaterThan(0)
    expect(grooveHit(rig, "hat", rollStep)).toBe(true)
    expect(grooveHitVel(rig, "hat", 99)).toBe(0)
  })

  it("flags a rig with every column resting", () => {
    const bank = getBank("straight")!
    const cell = emptyCell()
    const silent = { ...defaultRig(), cell }
    expect(isSilent(silent)).toBe(true)
    expect(countGrooveHits(silent)).toBe(0)
    expect(isSilent(createRig(bank, bank.defaultPicks, defaultKit()))).toBe(false)
  })

  it("lags only odd 16ths, scaled by the swing knob", () => {
    expect(swingDelaySteps(0, 0.6)).toBe(0)
    expect(swingDelaySteps(1, 0.6)).toBeCloseTo(0.3)
    expect(swingDelaySteps(2, 0.6)).toBe(0)
    expect(swingDelaySteps(3, 0)).toBe(0)
  })

  it("clamps the swing knob and edits immutably", () => {
    expect(clampSwing(9)).toBe(MAX_SWING)
    expect(clampSwing(-1)).toBe(0)
    const rig = defaultRig()
    expect(tweakGroove(rig, { swing: 9 }).swing).toBe(MAX_SWING)
    expect(rig.swing).toBe(0)
  })

  it("describes the kit's effect, and says so when there is none", () => {
    expect(describeGrooveEffect(createRig(getBank("straight")!, getBank("straight")!.defaultPicks, getKit(DEFAULT_KIT_ID)!))).toBe("Even pulse, no sway")
    const driven = applyKit(defaultRig(), getKit("studio-driver")!)
    expect(describeGrooveEffect(driven)).toContain("Foes close in sooner")
    const half = applyKit(defaultRig(), getKit("halftime-hull")!)
    expect(describeGrooveEffect(half)).toContain("Foes strike later")
    expect(describeGrooveEffect(half)).toContain("Wide parry window")
    expect(describeGrooveEffect(half)).toContain("Duller crits")
  })
})

describe("curated presets", () => {
  it("ships three rigs per bank with unique ids", () => {
    expect(RIG_PRESETS.length).toBe(15)
    const ids = RIG_PRESETS.map((r) => r.id)
    expect(new Set(ids).size).toBe(15)
    for (const bank of BANKS) {
      expect(RIG_PRESETS.filter((r) => r.bankId === bank.id).length).toBe(3)
    }
  })

  it("gives every preset a sounding pattern and a real kit", () => {
    for (const rig of RIG_PRESETS) {
      expect(countGrooveHits(rig)).toBeGreaterThanOrEqual(4)
      expect(getKit(rig.kitId)).toBeDefined()
      expect(getBank(rig.bankId)).toBeDefined()
      expect(rig.source).toBe("card")
    }
  })

  it("starts a fresh session on the default bank", () => {
    const rig = defaultRig()
    expect(rig.bankId).toBe(DEFAULT_BANK_ID)
    expect(rig.kitId).toBe(DEFAULT_KIT_ID)
    expect(countGrooveHits(rig)).toBeGreaterThan(4)
  })

  it("ships kits with finite timbres", () => {
    expect(KITS.length).toBeGreaterThanOrEqual(5)
    expect(defaultKit().id).toBe(DEFAULT_KIT_ID)
    expect(getKit("nope")).toBeUndefined()
  })
})

describe("bottling", () => {
  it("stamps a fresh id, marks it a bottle, and trims the name", () => {
    const b = bottleGroove(defaultRig(), "  My Rig  ")
    expect(b.source).toBe("bottle")
    expect(b.name).toBe("My Rig")
    expect(b.id).not.toBe(defaultRig().id)
    expect(b.cell).toEqual(defaultRig().cell)
  })

  it("falls back to a default name for a blank bottle", () => {
    expect(bottleGroove(defaultRig(), "   ").name).toBe("Untitled rig")
  })
})

describe("parseGroove", () => {
  it("round-trips a real rig through JSON", () => {
    const rig = getKit("dub-echo") ? applyKit(RIG_PRESETS[3], getKit("dub-echo")!) : defaultRig()
    expect(parseGroove(JSON.parse(JSON.stringify(rig)))).toEqual(rig)
  })

  it("migrates a legacy 3-voice offset cell", () => {
    const legacy = {
      id: "steady",
      name: "Steady",
      blurb: "old card",
      source: "card",
      cell: {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hat: [0, 2, 4, 6, 8, 10, 12, 14],
      },
      effect: { cadence: 1.2, critBonus: 0.1, parryWindow: 0 },
      swing: 99,
      density: 0.5,
    }
    const parsed = parseGroove(legacy)!
    expect(parsed.cell.kick[0]).toEqual({ vel: 0.8 })
    expect(parsed.cell.kick[1]).toBeNull()
    expect(parsed.cell.perc.every((s) => s === null)).toBe(true)
    expect(parsed.bankId).toBe(DEFAULT_BANK_ID)
    expect(parsed.kitId).toBe(DEFAULT_KIT_ID)
    expect(parsed.effect.cadence).toBe(1.2)
    expect(parsed.swing).toBe(MAX_SWING)
    expect(parsed.picks).toEqual({ kick: 0, snare: 0, hat: 0, perc: 0 })
  })

  it("returns null for malformed blobs", () => {
    expect(parseGroove(null)).toBeNull()
    expect(parseGroove({})).toBeNull()
    expect(parseGroove({ id: "x", name: "x" })).toBeNull()
    expect(parseGroove({ id: "x", name: "x", cell: { kick: [99] } })).toBeNull()
    expect(
      parseGroove({ id: "x", name: "x", cell: { kick: [null, null] } }),
    ).toBeNull()
  })

  it("clamps bad picks and marks unknown sources as custom", () => {
    const parsed = parseGroove({
      id: "x",
      name: "x",
      cell: { kick: [], snare: [], hat: [], perc: [] },
      picks: { kick: 9, snare: -1, hat: "nope", perc: 2 },
      source: "weird",
      effect: { cadence: "loud" },
    })!
    expect(parsed.source).toBe("custom")
    expect(parsed.picks).toEqual({ kick: 3, snare: 0, hat: 0, perc: 2 })
    expect(parsed.effect.cadence).toBe(1)
  })
})
