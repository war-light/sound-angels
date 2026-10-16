// Static chord-progression presets + tier-gated combat effects.
// Presets are Roman patterns (key-agnostic); absolute names in `example`
// are voiced in C major for reference. Effects derive from the
// scoreProgression tier so only good-sounding progressions matter.
import { scoreProgression, type Key } from "../game/theory"

export interface ChordPreset {
  name: string
  romans: string[]
  /** Reference voicing, e.g. "C–Am–F–G" in C major. */
  example: string
}

export const CHORD_PRESETS: ChordPreset[] = [
  { name: "Sunfall", romans: ["I", "vi", "IV", "V"], example: "C–Am–F–G" },
  { name: "Ascension", romans: ["I", "IV", "V", "vi"], example: "C–F–G–Am" },
  { name: "Resolve", romans: ["I", "IV", "vi", "V"], example: "C–F–Am–G" },
  { name: "Dirge", romans: ["vi", "IV", "I", "V"], example: "Am–F–C–G" },
  { name: "Warden", romans: ["vi", "vi", "IV", "V"], example: "Am–Am–F–G" },
  { name: "Lament", romans: ["i", "VI", "III", "VII"], example: "Cm–Ab–Eb–Bb" },
  { name: "Oath", romans: ["i", "iv", "V", "i"], example: "Cm–Fm–G–Cm" },
]

export interface ChordEffect {
  tier: "gold" | "silver" | "bronze"
  total: number
  /** HP restored to each living party member per loop wrap. */
  regen: number
  /** Shield granted to each living party member per loop wrap. */
  ward: number
  /** Flat damage added to every resolved melody onset. */
  bonusDamage: number
  label: string
}

/**
 * Tier-gated statics: gold progressions mend + ward the party and strike
 * true; silver wards; bronze is flavor only. Pure + deterministic.
 */
export function chordEffectFor(key: Key, romans: string[]): ChordEffect {
  const s = scoreProgression(key, romans)
  if (s.tier === "gold") {
    return {
      tier: s.tier, total: s.total, regen: 1, ward: 1, bonusDamage: 1,
      label: "the progression holds: the party mends and strikes true.",
    }
  }
  if (s.tier === "silver") {
    return {
      tier: s.tier, total: s.total, regen: 0, ward: 1, bonusDamage: 0,
      label: "the progression steadies: the party is faintly warded.",
    }
  }
  return {
    tier: s.tier, total: s.total, regen: 0, ward: 0, bonusDamage: 0,
    label: "the progression wavers: no blessing takes hold.",
  }
}
