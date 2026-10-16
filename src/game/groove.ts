// Drum layer as data: a groove is the pattern plus the two knobs and the
// gameplay effect it carries. Pure game model — serializable, no audio.
//
//   Pick    — equip one of GROOVE_CARDS before a battle.
//   Tweak   — swing (feel) + density (how much off-beat detail survives).
//   Compose — the Studio edits `cell` freely, then bottles it with a name.
//
// The audio layer resolves swing timing; combat reads `effect`.

export const GROOVE_VOICES = ["kick", "snare", "hat"] as const
export type GrooveVoice = (typeof GROOVE_VOICES)[number]

/** 16 steps in the bar every cell is written against. */
export const GROOVE_STEPS = 16
export const MAX_SWING = 0.6

/** Hit positions per voice, as 16th-step offsets inside one bar. */
export type GrooveCell = Record<GrooveVoice, number[]>

/**
 * What the groove does to the fight. All three numbers are small on purpose:
 * the card flavors a fight, it does not decide it.
 */
export interface GrooveEffect {
  /** Enemy strike-cadence multiplier. <1 = foes strike later, >1 = sooner. */
  cadence: number
  /** Flat crit-chance bonus added to every instrument (0..1). */
  critBonus: number
  /** Extra ± steps on parry timing windows. Negative tightens them. */
  parryWindow: number
}

export type GrooveSource = "card" | "bottle" | "custom"

export interface Groove {
  id: string
  name: string
  blurb: string
  source: GrooveSource
  cell: GrooveCell
  effect: GrooveEffect
  /** Tweak knob 0..0.6 — delays every odd 16th of the drum layer. */
  swing: number
  /** Tweak knob 0..1 — drops off-beat detail as it falls. */
  density: number
}

const NO_EFFECT: GrooveEffect = { cadence: 1, critBonus: 0, parryWindow: 0 }

function cell(kick: number[], snare: number[], hat: number[]): GrooveCell {
  return { kick, snare, hat }
}

function card(
  id: string,
  name: string,
  blurb: string,
  c: GrooveCell,
  effect: Partial<GrooveEffect> = {},
  swing = 0,
): Groove {
  return {
    id,
    name,
    blurb,
    source: "card",
    cell: c,
    effect: { ...NO_EFFECT, ...effect },
    swing,
    density: 1,
  }
}

/** The five cards. Index 0 is the default every fight starts on. */
export const GROOVE_CARDS: readonly Groove[] = [
  card(
    "steady",
    "Steady",
    "Even quarters, plain backbeat. Nothing moves faster than you.",
    cell([0, 4, 8, 12], [4, 12], [0, 2, 4, 6, 8, 10, 12, 14]),
  ),
  card(
    "driving",
    "Driving",
    "Sixteenths on the hat, a kick shove on the 'and'. Foes close in sooner.",
    cell([0, 4, 8, 12, 10], [4, 12], [0, 1, 2, 3, 4, 6, 8, 10, 12, 14, 15]),
    { cadence: 1.2, critBonus: 0.1 },
  ),
  card(
    "half-time",
    "Half-time",
    "Half the pulse at half the push. Wide parry windows, duller steel.",
    cell([0, 10], [8], [0, 4, 8, 12]),
    { cadence: 0.8, critBonus: -0.05, parryWindow: 1 },
  ),
  card(
    "shuffle",
    "Shuffle",
    "Limping off-beats. The kit lags the grid, and so does your blade.",
    cell([0, 4, 8, 12], [4, 12], [0, 2, 4, 6, 8, 10, 12, 14]),
    { cadence: 1, critBonus: 0.08, parryWindow: 1 },
    0.35,
  ),
  card(
    "syncopated",
    "Syncopated",
    "Hits land where you don't expect them. Sharp, and hard to hold.",
    cell([0, 3, 6, 10, 13], [4, 12], [1, 2, 5, 7, 9, 11, 14]),
    { cadence: 1.15, critBonus: 0.15, parryWindow: -1 },
  ),
] as const

export const DEFAULT_GROOVE_ID = "steady"

export function emptyCell(): GrooveCell {
  return { kick: [], snare: [], hat: [] }
}

export function cloneGroove(g: Groove): Groove {
  return {
    ...g,
    cell: {
      kick: [...g.cell.kick],
      snare: [...g.cell.snare],
      hat: [...g.cell.hat],
    },
    effect: { ...g.effect },
  }
}

export function getGrooveCard(id: string): Groove | undefined {
  const found = GROOVE_CARDS.find((g) => g.id === id)
  return found ? cloneGroove(found) : undefined
}

/** A fresh copy of the default card (Steady). */
export function defaultGroove(): Groove {
  return getGrooveCard(DEFAULT_GROOVE_ID) ?? cloneGroove(GROOVE_CARDS[0])
}

export function clampSwing(value: number): number {
  return Math.min(MAX_SWING, Math.max(0, Math.round(value * 100) / 100))
}

export function clampDensity(value: number): number {
  return Math.min(1, Math.max(0, Math.round(value * 100) / 100))
}

/** Immutable knob edit. Out-of-range values clamp rather than throw. */
export function tweakGroove(
  g: Groove,
  knobs: { swing?: number; density?: number },
): Groove {
  return {
    ...g,
    swing: knobs.swing == null ? g.swing : clampSwing(knobs.swing),
    density: knobs.density == null ? g.density : clampDensity(knobs.density),
  }
}

/** Immutable cell edit: flip one step of one voice on/off. */
export function toggleCellStep(
  g: Groove,
  voice: GrooveVoice,
  step: number,
): Groove {
  if (!Number.isInteger(step) || step < 0 || step >= GROOVE_STEPS) {
    throw new Error(`Step out of range: ${step}`)
  }
  const offsets = g.cell[voice]
  const next = offsets.includes(step)
    ? offsets.filter((s) => s !== step)
    : [...offsets, step].sort((a, b) => a - b)
  return { ...g, cell: { ...g.cell, [voice]: next } }
}

/**
 * Density knob: how much off-beat detail survives. Quarter notes are the
 * floor — a groove without a pulse is not a groove — 8ths survive past 0.4
 * and 16ths need 0.75.
 */
export function keepsHit(step: number, density: number): boolean {
  if (step % 4 === 0) return true
  if (density >= 0.75) return true
  if (density >= 0.4) return step % 2 === 0
  return false
}

/** Does the equipped groove hit `voice` on this step? (density applied) */
export function grooveHit(g: Groove, voice: GrooveVoice, step: number): boolean {
  return g.cell[voice].includes(step) && keepsHit(step, g.density)
}

/**
 * Swing delay for one step, in steps. The audio layer multiplies by the
 * 16th-note duration, so the feel is identical at any bpm.
 */
export function swingDelaySteps(step: number, swing: number): number {
  return step % 2 === 1 ? swing * 0.5 : 0
}

/** Total hits the groove will actually sound in one bar (density applied). */
export function countGrooveHits(g: Groove): number {
  let n = 0
  for (const voice of GROOVE_VOICES) {
    for (let step = 0; step < GROOVE_STEPS; step++) {
      if (grooveHit(g, voice, step)) n += 1
    }
  }
  return n
}

/**
 * Compose → bottle: name the current groove and hand it back with a fresh id
 * and `source: "bottle"`, so it equips like any card.
 */
export function bottleGroove(g: Groove, name: string): Groove {
  const clean = name.trim() || "Untitled groove"
  return {
    ...cloneGroove(g),
    id: `bottle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: clean,
    source: "bottle",
  }
}

/** Rebuild a groove held by one of the five cards, by id, refreshed. */
export function isCardGroove(id: string): boolean {
  return GROOVE_CARDS.some((g) => g.id === id)
}

/** Short human read of a groove's effect, for cards and the battle meter. */
export function describeGrooveEffect(g: Groove): string {
  const parts: string[] = []
  if (g.effect.cadence > 1) parts.push("Foes close in sooner")
  else if (g.effect.cadence < 1) parts.push("Foes strike later")
  if (g.effect.critBonus > 0) parts.push("Sharper crits")
  else if (g.effect.critBonus < 0) parts.push("Duller crits")
  if (g.effect.parryWindow > 0) parts.push("Wide parry window")
  else if (g.effect.parryWindow < 0) parts.push("Tight parry window")
  return parts.length > 0 ? parts.join(" · ") : "Even pulse, no sway"
}

/** Parse a persisted groove. Returns null for anything malformed. */
export function parseGroove(raw: unknown): Groove | null {
  if (typeof raw !== "object" || raw == null) return null
  const o = raw as Partial<Groove>
  if (typeof o.id !== "string" || typeof o.name !== "string") return null
  const c = o.cell
  if (typeof c !== "object" || c == null) return null
  const cell: GrooveCell = emptyCell()
  for (const voice of GROOVE_VOICES) {
    const offsets = (c as GrooveCell)[voice]
    if (!Array.isArray(offsets)) return null
    if (!offsets.every((s) => Number.isInteger(s) && s >= 0 && s < GROOVE_STEPS)) return null
    cell[voice] = [...offsets].sort((a, b) => a - b)
  }
  const effect = { ...NO_EFFECT, ...(o.effect ?? {}) }
  return {
    id: o.id,
    name: o.name,
    blurb: typeof o.blurb === "string" ? o.blurb : "",
    source: o.source === "card" || o.source === "bottle" ? o.source : "custom",
    cell,
    effect,
    swing: clampSwing(typeof o.swing === "number" ? o.swing : 0),
    density: clampDensity(typeof o.density === "number" ? o.density : 1),
  }
}
