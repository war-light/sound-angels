// Drum kits: timbre + combat effect, fully decoupled from the pattern.
// A kit can play any bank and any pad selection.
import type { DrumKit, DrumTimbre, GrooveEffect } from "@/game/groove"
import { DEFAULT_KIT_ID } from "@/game/groove"

/** The room's own pulse. Every kit starts from this and overrides pieces. */
export const NEUTRAL_TIMBRE: DrumTimbre = {
  kick: { pitchDecay: 0.04, octaves: 6, decay: 0.35, volume: -8 },
  snare: { decay: 0.17, volume: -14 },
  hat: { decay: 0.05, volume: -20 },
  perc: { note: "C4", harmonicity: 4, resonance: 3000, decay: 0.12, volume: -20 },
}

const NO_EFFECT: GrooveEffect = { cadence: 1, critBonus: 0, parryWindow: 0 }

function kit(
  id: string,
  name: string,
  blurb: string,
  timbre: Partial<DrumTimbre>,
  effect: Partial<GrooveEffect> = {},
): DrumKit {
  return {
    id,
    name,
    blurb,
    source: "card",
    timbre: {
      kick: { ...NEUTRAL_TIMBRE.kick, ...timbre.kick },
      snare: { ...NEUTRAL_TIMBRE.snare, ...timbre.snare },
      hat: { ...NEUTRAL_TIMBRE.hat, ...timbre.hat },
      perc: { ...NEUTRAL_TIMBRE.perc, ...timbre.perc },
    },
    effect: { ...NO_EFFECT, ...effect },
  }
}

/**
 * Six kits. The first five carry the effects of the old groove cards so the
 * encounter tuning keeps its meaning; Dub Echo is the new long-tail kit.
 */
export const KITS: readonly DrumKit[] = [
  kit("clean-room", "Clean Room", "Neutral room pulse. Nothing pushes, nothing pulls.", {}),
  kit(
    "studio-driver",
    "Studio Driver",
    "Tight and forward: the kit drags every foe a little closer.",
    { kick: { pitchDecay: 0.02, octaves: 7, decay: 0.25, volume: -7 }, snare: { decay: 0.2, volume: -13 }, hat: { decay: 0.04, volume: -18 }, perc: { note: "D4", harmonicity: 5, resonance: 4200, decay: 0.08, volume: -18 } },
    { cadence: 1.2, critBonus: 0.1 },
  ),
  kit(
    "halftime-hull",
    "Halftime Hull",
    "Half the pulse at half the push. Wide parry windows, duller steel.",
    { kick: { pitchDecay: 0.08, octaves: 4, decay: 0.55, volume: -5 }, snare: { decay: 0.26, volume: -12 }, hat: { decay: 0.09, volume: -24 }, perc: { note: "A2", harmonicity: 3, resonance: 1800, decay: 0.35, volume: -14 } },
    { cadence: 0.8, critBonus: -0.05, parryWindow: 1 },
  ),
  kit(
    "lofi-dirt",
    "Lo-Fi Dirt",
    "Dust on the heads, grit on the blade. Slightly wider openings.",
    { kick: { pitchDecay: 0.05, octaves: 5, decay: 0.4, volume: -6 }, snare: { decay: 0.22, volume: -15 }, hat: { decay: 0.11, volume: -26 }, perc: { note: "G3", harmonicity: 2.5, resonance: 2200, decay: 0.2, volume: -17 } },
    { critBonus: 0.08, parryWindow: 1 },
  ),
  kit(
    "syncopator",
    "Syncopator",
    "Sharp, unforgiving, and quick to close. Hits harder, blocks tighter.",
    { kick: { pitchDecay: 0.03, octaves: 7, decay: 0.28, volume: -6 }, snare: { decay: 0.1, volume: -14 }, hat: { decay: 0.03, volume: -17 }, perc: { note: "E5", harmonicity: 6, resonance: 6200, decay: 0.06, volume: -16 } },
    { cadence: 1.15, critBonus: 0.15, parryWindow: -1 },
  ),
  kit(
    "dub-echo",
    "Dub Echo",
    "Long tails and delayed hits. The room answers after you do.",
    { kick: { pitchDecay: 0.06, octaves: 4, decay: 0.6, volume: -7 }, snare: { decay: 0.3, volume: -16 }, hat: { decay: 0.14, volume: -25 }, perc: { note: "C3", harmonicity: 3.5, resonance: 2400, decay: 0.4, volume: -12 } },
    { cadence: 0.9, parryWindow: 1 },
  ),
] as const

export function getKit(id: string): DrumKit | undefined {
  return KITS.find((k) => k.id === id)
}

/** The neutral kit, by id, always present. */
export function defaultKit(): DrumKit {
  return getKit(DEFAULT_KIT_ID) ?? KITS[0]
}
