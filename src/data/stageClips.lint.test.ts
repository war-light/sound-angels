// Mix linter: proves every clip combination is safe in every key and chord,
// so new clips never need to be auditioned against each other by hand.
// A failure names the clip, the rule, and where it broke.
import { describe, expect, it } from "vitest"
import { FIGHT_KEYS } from "@/game/keys"
import type { Key } from "@/game/theory"
import {
  CHORD_MODS,
  PITCHED_ROLES,
  ROLES,
  ROLE_SPECS,
  STAGE_BARS,
  STAGE_LOOP_STEPS,
  STAGE_STEPS_PER_BAR,
  chordTones,
  eventPitches,
  pc,
  type BreaksClip,
  type ChordPick,
  type PitchedClip,
  type PitchedEvent,
  type Role,
  type StageClip,
} from "@/game/stageMusic"
import { STAGE_CLIPS, STAGE_COMBOS, clipsForRole, getStageClip } from "./stageClips"

const KEYS: Key[] = [...FIGHT_KEYS, { tonic: "F", scale: "major", octave: 4 }, { tonic: "B", scale: "minor", octave: 4 }]
const PICKS: ChordPick[] = [1, 2, 3, 4, 5, 6, 7].flatMap((degree) => CHORD_MODS.map((mod) => ({ degree, mod })))
/** Most simultaneous pitched onsets any mix may produce on one step. */
const MAX_PITCHED_ONSETS = 3

const pitchedClips = STAGE_CLIPS.filter((c): c is PitchedClip => c.role !== "breaks")
const breakClips = STAGE_CLIPS.filter((c): c is BreaksClip => c.role === "breaks")

const inBar = (step: number) => step % STAGE_STEPS_PER_BAR
const barOf = (step: number) => Math.floor(step / STAGE_STEPS_PER_BAR)
const isStrong = (step: number) => inBar(step) % 4 === 0

/** Steps (0..63) on which an event is sounding. */
function span(ev: PitchedEvent): number[] {
  return Array.from({ length: ev.len }, (_, i) => ev.step + i)
}

function ornamentSteps(clip: PitchedClip): Set<number> {
  return new Set(clip.events.filter((e) => e.kind === "orn").flatMap(span))
}

function soundingSteps(clip: PitchedClip): Set<number> {
  return new Set(clip.events.flatMap(span))
}

function onsetSteps(clip: StageClip): number[] {
  if (clip.role !== "breaks") return clip.events.map((e) => e.step)
  const out: number[] = []
  for (let s = 0; s < STAGE_LOOP_STEPS; s++) {
    if (Object.values(clip.drums).some((steps) => (steps[s]?.vel ?? 0) > 0)) out.push(s)
  }
  return out
}

/** Every mix: one clip or silence per role. */
function* allMixes(): Generator<StageClip[]> {
  const options: (StageClip | null)[][] = ROLES.map((r) => [null, ...clipsForRole(r)])
  const pick = (i: number, acc: StageClip[]): StageClip[][] =>
    i === options.length ? [acc] : options[i].flatMap((c) => pick(i + 1, c ? [...acc, c] : acc))
  yield* pick(0, [])
}

describe("stage clip library", () => {
  it("has unique ids and three clips per role", () => {
    expect(new Set(STAGE_CLIPS.map((c) => c.id)).size).toBe(STAGE_CLIPS.length)
    for (const role of ROLES) expect(clipsForRole(role)).toHaveLength(3)
  })

  it("combos only reference real clips", () => {
    for (const combo of STAGE_COMBOS) {
      for (const id of combo.clips) expect(getStageClip(id), `${combo.id} -> ${id}`).toBeDefined()
    }
  })

  it("breaks cover the whole loop", () => {
    for (const clip of breakClips) {
      for (const steps of Object.values(clip.drums)) expect(steps).toHaveLength(STAGE_LOOP_STEPS)
    }
  })
})

describe.each(pitchedClips.map((c) => [c.id, c] as const))("clip %s", (_, clip) => {
  const spec = ROLE_SPECS[clip.role]

  it("keeps every note inside its bar (chord changes are always safe)", () => {
    for (const ev of clip.events) {
      expect(inBar(ev.step) + ev.len, `step ${ev.step}`).toBeLessThanOrEqual(STAGE_STEPS_PER_BAR)
    }
  })

  it("stays inside its role's rhythmic window", () => {
    for (const ev of clip.events) {
      const [from, to] = spec.windows[barOf(ev.step)]
      expect(inBar(ev.step) >= from && inBar(ev.step) + ev.len <= to, `step ${ev.step} outside [${from},${to})`).toBe(true)
      expect(spec.blockedSteps, `onset on blocked step ${ev.step}`).not.toContain(inBar(ev.step))
    }
  })

  it("only ornaments on weak 16ths, briefly, resolving to a chord tone", () => {
    for (const ev of clip.events) {
      if (ev.kind !== "orn") continue
      expect(isStrong(ev.step), `ornament on a beat at ${ev.step}`).toBe(false)
      expect(ev.len, `long ornament at ${ev.step}`).toBe(1)
      const next = clip.events.find((e) => e.step > ev.step)
      const resolves = next != null && next.kind !== "orn" && next.step - ev.step <= 2 && barOf(next.step) === barOf(ev.step)
      expect(resolves, `ornament at ${ev.step} never resolves`).toBe(true)
    }
  })

  it("stays in its register and on chord tones on every beat, in every key and chord", () => {
    for (const key of KEYS) {
      for (const pick of PICKS) {
        const chordPcs = new Set(chordTones(key, pick).map(pc))
        for (const ev of clip.events) {
          for (const midi of eventPitches(clip.role, ev, key, pick)) {
            const where = `${key.tonic} ${key.scale} deg ${pick.degree}/${pick.mod} step ${ev.step}`
            expect(midi, `too low: ${where}`).toBeGreaterThanOrEqual(spec.floor - 2)
            expect(midi, `too high: ${where}`).toBeLessThanOrEqual(spec.ceiling)
            if (clip.role !== "bass") expect(midi, `only bass owns the low end: ${where}`).toBeGreaterThanOrEqual(48)
            if (span(ev).some(isStrong)) expect(chordPcs.has(pc(midi)), `non-chord tone on a beat: ${where}`).toBe(true)
          }
        }
      }
    }
  })
})

describe("clip pairings", () => {
  const pairs = pitchedClips.flatMap((a, i) =>
    pitchedClips.slice(i + 1).filter((b) => b.role !== a.role).map((b) => [`${a.id} + ${b.id}`, a, b] as const),
  )

  it.each(pairs)("%s never stack ornaments", (_, a, b) => {
    const ornA = ornamentSteps(a)
    const clash = [...ornamentSteps(b)].filter((s) => ornA.has(s))
    expect(clash).toEqual([])
  })

  it.each(pairs)("%s never grind a semitone against an ornament", (_, a, b) => {
    for (const key of KEYS) {
      for (const pick of PICKS) {
        for (const [orn, other] of [[a, b], [b, a]] as const) {
          for (const ev of orn.events) {
            if (ev.kind !== "orn") continue
            const [o] = eventPitches(orn.role, ev, key, pick)
            const against = other.events
              .filter((e) => span(e).includes(ev.step))
              .flatMap((e) => eventPitches(other.role, e, key, pick))
            const grind = against.filter((m) => Math.abs(m - o) === 1)
            expect(grind, `${orn.id} step ${ev.step} in ${key.tonic} ${key.scale} deg ${pick.degree}/${pick.mod}`).toEqual([])
          }
        }
      }
    }
  })

  it("lead and counter never sound at the same time", () => {
    for (const lead of clipsForRole("lead") as PitchedClip[]) {
      for (const counter of clipsForRole("counter") as PitchedClip[]) {
        const busy = soundingSteps(lead)
        expect([...soundingSteps(counter)].filter((s) => busy.has(s)), `${lead.id} + ${counter.id}`).toEqual([])
      }
    }
  })

  it("bass never lands on a snare accent", () => {
    for (const bass of clipsForRole("bass") as PitchedClip[]) {
      for (const brk of breakClips) {
        const accents = brk.drums.snare.flatMap((h, s) => ((h?.vel ?? 0) >= 1 ? [s] : []))
        const hits = bass.events.map((e) => e.step).filter((s) => accents.includes(s))
        expect(hits, `${bass.id} + ${brk.id}`).toEqual([])
      }
    }
  })
})

describe("every mix", () => {
  it(`leaves space: at most ${MAX_PITCHED_ONSETS} pitched onsets on any step`, () => {
    let mixes = 0
    for (const mix of allMixes()) {
      mixes += 1
      const counts = new Array<number>(STAGE_LOOP_STEPS).fill(0)
      for (const clip of mix) {
        if (clip.role === "breaks") continue
        for (const s of new Set(onsetSteps(clip))) counts[s] += 1
      }
      const worst = Math.max(...counts)
      expect(worst, mix.map((c) => c.id).join(" + ")).toBeLessThanOrEqual(MAX_PITCHED_ONSETS)
    }
    expect(mixes).toBe(4 ** ROLES.length)
  })

  it("only the bass role sits below the low-end line", () => {
    const low = PITCHED_ROLES.filter((r: Role) => r !== "bass").map((r) => ROLE_SPECS[r as Exclude<Role, "breaks">].floor - 2)
    for (const floor of low) expect(floor).toBeGreaterThanOrEqual(48)
    expect(STAGE_BARS * STAGE_STEPS_PER_BAR).toBe(STAGE_LOOP_STEPS)
  })
})
