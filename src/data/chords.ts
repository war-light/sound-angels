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
  /** One-line flavour for the picker cards. */
  description?: string
}

export const CHORD_PRESETS: ChordPreset[] = [
  { name: "Pop Axis", romans: ["I", "V", "vi", "IV"], example: "C–G–Am–F", description: "The four-chord pop loop." },
  { name: "Four Chords", romans: ["vi", "IV", "I", "V"], example: "Am–F–C–G", description: "The same axis, rotated to the minor." },
  { name: "Doo-Wop", romans: ["I", "vi", "IV", "V"], example: "C–Am–F–G", description: "The 50s progression." },
  { name: "Jazz Cadence", romans: ["ii", "V7", "I", "I"], example: "Dm–G7–C–C", description: "Two-five-one, the jazz resolution." },
  { name: "Folk Cadence", romans: ["I", "IV", "V", "I"], example: "C–F–G–C", description: "The plain song cadence." },
  { name: "Rock Cadence", romans: ["I", "V", "IV", "I"], example: "C–G–F–C", description: "Big-chorus rock turnaround." },
  { name: "Pop Ballad", romans: ["I", "IV", "vi", "V"], example: "C–F–Am–G", description: "Wistful lift before the resolve." },
  { name: "Epic Minor", romans: ["i", "VI", "III", "VII"], example: "Cm–Ab–Eb–Bb", description: "Cinematic minor climb." },
  { name: "Andalusian", romans: ["i", "VII", "VI", "V"], example: "Cm–Bb–Ab–G", description: "The descending flamenco line." },
  { name: "Minor Cadence", romans: ["i", "iv", "V", "i"], example: "Cm–Fm–G–Cm", description: "Classical minor resolution." },
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
