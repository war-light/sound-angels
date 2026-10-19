// Drum rig as data: banks of 4x4 clips, one clip per voice per column.
//
//   Bank   — a page of 16 clips (4 voices x 4 complexity tiers).
//   Clip   — one voice's complete 16-step pattern for the bar.
//   Rig    — the player's pick of one clip per voice + a kit + a swing feel.
//   Kit    — drum timbre and the combat effect. Fully decoupled from the rig.
//
// The audio layer resolves timbres at the boundary; combat reads `effect`,
// which is denormalized from the kit when the rig is equipped.

export const DRUM_VOICES = ["kick", "snare", "hat", "perc"] as const
export type DrumVoice = (typeof DRUM_VOICES)[number]
/** Alias kept for call sites that still say "groove voice". */
export type GrooveVoice = DrumVoice

/** 16 steps in the bar every clip is written against. */
export const GROOVE_STEPS = 16
export const CLIP_TIERS = ["Sparse", "Steady", "Driving", "Complex"] as const
export type ClipTier = 0 | 1 | 2 | 3
export const MAX_SWING = 0.6

/** Model-level fallbacks. Content supplies the matching ids. */
export const DEFAULT_BANK_ID = "straight"
export const DEFAULT_KIT_ID = "clean-room"

/** One authored 16th of a clip. `vel` 0 = rest. `roll` adds 32nd sub-hits. */
export interface Hit {
  vel: number
  roll?: 0 | 1 | 2
}

export type ClipSteps = (Hit | null)[]

export interface Clip {
  /** Stable content id: `${bank}:${voice}:${tier}`. */
  id: string
  voice: DrumVoice
  tier: ClipTier
  steps: ClipSteps
}

export interface Bank {
  id: string
  name: string
  archetype: string
  bpmHint: number
  /** Feel this bank dials in when selected. */
  swing: number
  focus: string
  genres: string[]
  /** Exactly four clips per voice, ordered Sparse -> Complex. */
  clips: Record<DrumVoice, Clip[]>
  /** The pads a bank switch lands on. */
  defaultPicks: Record<DrumVoice, ClipTier>
}

/** Serializable drum timbre. No Tone objects. */
export interface DrumTimbre {
  kick: { pitchDecay: number; octaves: number; decay: number; volume: number }
  snare: { decay: number; volume: number }
  hat: { decay: number; volume: number }
  perc: { note: string; harmonicity: number; resonance: number; decay: number; volume: number }
}

export interface GrooveEffect {
  /** Enemy strike-cadence multiplier. <1 = foes strike later, >1 = sooner. */
  cadence: number
  /** Flat crit-chance bonus added to every instrument (0..1). */
  critBonus: number
  /** Extra ± steps on parry timing windows. Negative tightens them. */
  parryWindow: number
}

export interface DrumKit {
  id: string
  name: string
  blurb: string
  source: "card" | "bottle"
  timbre: DrumTimbre
  effect: GrooveEffect
}

export type GrooveSource = "card" | "bottle" | "custom"

/** 16 resolved steps per voice. */
export type GrooveCell = Record<DrumVoice, ClipSteps>

export interface Groove {
  id: string
  name: string
  blurb: string
  source: GrooveSource
  bankId: string
  /** Tier index per voice, 0..3. */
  picks: Record<DrumVoice, ClipTier>
  kitId: string
  /** Combat effect, denormalized from the kit on equip. */
  effect: GrooveEffect
  /** Resolved 16-step pattern, denormalized from the picks. */
  cell: GrooveCell
  /** Tweak knob 0..0.6 — delays every odd 16th of the drum layer. */
  swing: number
}

const NO_EFFECT: GrooveEffect = { cadence: 1, critBonus: 0, parryWindow: 0 }

// ---------------------------------------------------------------------------
// Notation: one readable line per clip.
//
//   X accent · x hit · g ghost · r roll (32nd fill) · R accent roll · - rest
// ---------------------------------------------------------------------------

const LEGEND: Record<string, Hit | null> = {
  X: { vel: 1 },
  x: { vel: 0.8 },
  g: { vel: 0.4 },
  r: { vel: 0.8, roll: 1 },
  R: { vel: 1, roll: 1 },
  "-": null,
  ".": null,
}

/** Parse a 16-character pattern string. Throws on bad length or glyphs. */
export function parsePattern(text: string): ClipSteps {
  if (text.length !== GROOVE_STEPS) {
    throw new Error(`Pattern needs ${GROOVE_STEPS} steps, got ${text.length}: "${text}"`)
  }
  return [...text].map((ch) => {
    if (!(ch in LEGEND)) throw new Error(`Unknown pattern glyph "${ch}"`)
    const hit = LEGEND[ch]
    return hit ? { ...hit } : null
  })
}

/** Render a clip back to notation (round-trips `parsePattern`). */
export function formatPattern(steps: ClipSteps): string {
  return steps
    .map((h) => {
      if (h == null || h.vel <= 0) return "-"
      if (h.roll) return h.vel >= 1 ? "R" : "r"
      if (h.vel >= 1) return "X"
      if (h.vel >= 0.7) return "x"
      return "g"
    })
    .join("")
}

// ---------------------------------------------------------------------------
// Cells + rigs
// ---------------------------------------------------------------------------

export function emptySteps(): ClipSteps {
  return Array.from({ length: GROOVE_STEPS }, () => null)
}

export function emptyCell(): GrooveCell {
  return {
    kick: emptySteps(),
    snare: emptySteps(),
    hat: emptySteps(),
    perc: emptySteps(),
  }
}

export function cloneCell(cell: GrooveCell): GrooveCell {
  const out = emptyCell()
  for (const voice of DRUM_VOICES) {
    out[voice] = cell[voice].map((h) => (h ? { ...h } : null))
  }
  return out
}

export function cloneGroove(g: Groove): Groove {
  return {
    ...g,
    picks: { ...g.picks },
    effect: { ...g.effect },
    cell: cloneCell(g.cell),
  }
}

export function clampTier(n: number): ClipTier {
  if (!Number.isFinite(n)) return 0
  return Math.min(3, Math.max(0, Math.round(n))) as ClipTier
}

export function clampSwing(value: number): number {
  return Math.min(MAX_SWING, Math.max(0, Math.round(value * 100) / 100))
}

/** Copy each picked clip into its voice's 16 slots. */
export function resolveCell(bank: Bank, picks: Record<DrumVoice, number>): GrooveCell {
  const cell = emptyCell()
  for (const voice of DRUM_VOICES) {
    const clip = bank.clips[voice][clampTier(picks[voice])]
    // A bank missing a clip leaves that column silent rather than throwing.
    cell[voice] = (clip?.steps ?? emptySteps()).map((h) => (h ? { ...h } : null))
  }
  return cell
}

export interface RigSeed {
  id?: string
  name?: string
  blurb?: string
  source?: GrooveSource
}

/** Build a rig from a bank + picks + kit. */
export function createRig(
  bank: Bank,
  picks: Record<DrumVoice, number>,
  kit: DrumKit,
  seed: RigSeed = {},
): Groove {
  const clamped = {
    kick: clampTier(picks.kick),
    snare: clampTier(picks.snare),
    hat: clampTier(picks.hat),
    perc: clampTier(picks.perc),
  }
  return {
    id: seed.id ?? `rig:${bank.id}`,
    name: seed.name ?? bank.name,
    blurb: seed.blurb ?? bank.focus,
    source: seed.source ?? "custom",
    bankId: bank.id,
    picks: clamped,
    kitId: kit.id,
    effect: { ...kit.effect },
    cell: resolveCell(bank, clamped),
    swing: clampSwing(bank.swing),
  }
}

/** Re-color + re-stat the rig without touching its pattern. */
export function applyKit(g: Groove, kit: DrumKit): Groove {
  return { ...g, kitId: kit.id, effect: { ...kit.effect } }
}

/** Swap one column's clip. Marks the rig hand-built. */
export function withPick(
  g: Groove,
  voice: DrumVoice,
  tier: number,
  bank: Bank,
): Groove {
  const picks = { ...g.picks, [voice]: clampTier(tier) }
  return {
    ...g,
    picks,
    cell: resolveCell(bank, picks),
    source: "custom",
  }
}

/** Switch banks: the new bank's default pads and feel come with it. */
export function withBank(g: Groove, bank: Bank, kit: DrumKit): Groove {
  const picks = { ...bank.defaultPicks }
  return {
    ...applyKit(g, kit),
    id: g.source === "bottle" ? g.id : `rig:${bank.id}`,
    name: bank.name,
    blurb: bank.focus,
    bankId: bank.id,
    picks,
    cell: resolveCell(bank, picks),
    swing: clampSwing(bank.swing),
    source: g.source === "bottle" ? "bottle" : "custom",
  }
}

/** Immutable knob edit. Out-of-range values clamp rather than throw. */
export function tweakGroove(g: Groove, knobs: { swing?: number }): Groove {
  return {
    ...g,
    swing: knobs.swing == null ? g.swing : clampSwing(knobs.swing),
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Velocity of the hit at `step`, 0 when the slot rests. */
export function grooveHitVel(g: Groove, voice: DrumVoice, step: number): number {
  if (step < 0 || step >= GROOVE_STEPS) return 0
  return g.cell[voice][step]?.vel ?? 0
}

/** Does the rig hit `voice` on this step? */
export function grooveHit(g: Groove, voice: DrumVoice, step: number): boolean {
  return grooveHitVel(g, voice, step) > 0
}

/** Extra 32nd sub-hits scheduled inside this step. */
export function grooveHitRoll(g: Groove, voice: DrumVoice, step: number): number {
  if (step < 0 || step >= GROOVE_STEPS) return 0
  return g.cell[voice][step]?.roll ?? 0
}

/** Total hits the rig will actually sound in one bar. */
export function countGrooveHits(g: Groove): number {
  let n = 0
  for (const voice of DRUM_VOICES) {
    for (let step = 0; step < GROOVE_STEPS; step++) {
      if (grooveHit(g, voice, step)) n += 1
    }
  }
  return n
}

/** A rig with every column resting. Legal, and audibly deliberate. */
export function isSilent(g: Groove): boolean {
  return countGrooveHits(g) === 0
}

/**
 * Swing delay for one step, in steps. The audio layer multiplies by the
 * 16th-note duration, so the feel is identical at any bpm.
 */
export function swingDelaySteps(step: number, swing: number): number {
  return step % 2 === 1 ? swing * 0.5 : 0
}

/** Short human read of a rig's effect, for cards and the battle meter. */
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

// ---------------------------------------------------------------------------
// Bottling + persistence
// ---------------------------------------------------------------------------

/** Compose -> bottle: name the current rig and hand it back as a recallable card. */
export function bottleGroove(g: Groove, name: string): Groove {
  const clean = name.trim() || "Untitled rig"
  return {
    ...cloneGroove(g),
    id: `bottle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: clean,
    source: "bottle",
  }
}

function isHit(raw: unknown): raw is Hit {
  if (typeof raw !== "object" || raw == null) return false
  const h = raw as Partial<Hit>
  return (
    typeof h.vel === "number" &&
    h.vel >= 0 &&
    h.vel <= 1 &&
    (h.roll == null || h.roll === 0 || h.roll === 1 || h.roll === 2)
  )
}

function parseSteps(raw: unknown): ClipSteps | null {
  if (!Array.isArray(raw) || raw.length !== GROOVE_STEPS) return null
  const out: ClipSteps = []
  for (const v of raw) {
    if (v == null) {
      out.push(null)
      continue
    }
    if (!isHit(v)) return null
    out.push(v.roll ? { vel: v.vel, roll: v.roll } : { vel: v.vel })
  }
  return out
}

/** Pre-matrix grooves stored hit offsets as `number[]`. */
function legacySteps(raw: unknown): ClipSteps | null {
  if (!Array.isArray(raw)) return null
  if (!raw.every((s) => Number.isInteger(s) && s >= 0 && s < GROOVE_STEPS)) return null
  const steps = emptySteps()
  for (const s of raw as number[]) steps[s] = { vel: 0.8 }
  return steps
}

function parsePicks(raw: unknown): Record<DrumVoice, ClipTier> {
  const o = (typeof raw === "object" && raw != null ? raw : {}) as Partial<
    Record<DrumVoice, unknown>
  >
  const picks = {} as Record<DrumVoice, ClipTier>
  for (const voice of DRUM_VOICES) {
    const v = o[voice]
    picks[voice] = typeof v === "number" ? clampTier(v) : 0
  }
  return picks
}

function parseEffect(raw: unknown): GrooveEffect {
  const o = (typeof raw === "object" && raw != null ? raw : {}) as Partial<GrooveEffect>
  const num = (v: unknown, fallback: number): number =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback
  return {
    cadence: num(o.cadence, NO_EFFECT.cadence),
    critBonus: num(o.critBonus, NO_EFFECT.critBonus),
    parryWindow: num(o.parryWindow, NO_EFFECT.parryWindow),
  }
}

/**
 * Parse a persisted rig. Accepts both the v2 cell (16 hits per voice) and the
 * legacy 3-voice cell (hit offsets), so old saves keep playing after reload.
 * Returns null for anything malformed.
 */
export function parseGroove(raw: unknown): Groove | null {
  if (typeof raw !== "object" || raw == null) return null
  const o = raw as Partial<Groove> & { density?: unknown }
  if (typeof o.id !== "string" || typeof o.name !== "string") return null

  const c = o.cell
  if (typeof c !== "object" || c == null) return null
  const cell = emptyCell()
  const source = c as Partial<Record<DrumVoice, unknown>>
  for (const voice of DRUM_VOICES) {
    const raw = source[voice]
    // Legacy 3-voice cells had no perc column: leave that voice silent.
    if (raw == null) {
      cell[voice] = emptySteps()
      continue
    }
    const steps = parseSteps(raw) ?? legacySteps(raw)
    if (steps == null) return null
    cell[voice] = steps
  }

  const src = o.source === "card" || o.source === "bottle" ? o.source : "custom"
  return {
    id: o.id,
    name: o.name,
    blurb: typeof o.blurb === "string" ? o.blurb : "",
    source: src,
    bankId: typeof o.bankId === "string" ? o.bankId : DEFAULT_BANK_ID,
    picks: parsePicks(o.picks),
    kitId: typeof o.kitId === "string" ? o.kitId : DEFAULT_KIT_ID,
    effect: parseEffect(o.effect),
    cell,
    swing: clampSwing(typeof o.swing === "number" ? o.swing : 0),
  }
}
