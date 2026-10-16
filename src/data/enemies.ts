// Static enemy + instrument balance data. Pure data, no logic.
import type { ParryMotifParams } from "../game/parryChart"

export type Archetype = "horde" | "tank" | "balanced"
export type ReflectMode = "nonchord" | "long" | "short"

export interface EnemyProfile {
  id: string
  name: string
  hp: number
  shield?: number
  /** Steps per full gauge (32 = one 2-bar loop). */
  gaugePeriod: number
  /**
   * Loops of silence after an attack before the gauge starts refilling.
   * 0 = legacy "every loop" behaviour. 2–3 = balanced, 1 = horde, 3–4 = tank.
   */
  attackCooldownLoops: number
  /**
   * Parry cadence: a loop-boundary strike every N loops (post-intro).
   * Horde presses often, tanks rarely — all customizable per enemy.
   */
  parryEveryLoops: number
  /** Per-enemy motif tuning layered over the pattern base (density, holds…). */
  parry?: Partial<ParryMotifParams>
  baseAttack: number
  archetype: Archetype
  weaknesses: { instruments: string[]; elements: string[] }
  resists: { instruments: string[]; elements: string[] }
  /** Bounce matching player notes back for 50% (Phase 1 constant). */
  reflect?: ReflectMode
  /** On its turn, wipes all player melody tracks. */
  trackWipe?: boolean
  /** Fraction of attack dealt when the hit is parried/blocked (QTE Phase 3 lowers it). */
  chipFraction: number
  /** Flavor for the call-and-response log. */
  pattern: string
}

export const ENEMIES: Record<string, EnemyProfile> = {
  echo: {
    id: "echo",
    name: "Echo",
    hp: 700,
    gaugePeriod: 32,
    attackCooldownLoops: 1,
    parryEveryLoops: 3,
    parry: { density: 5, holdRatio: 0.3 },
    baseAttack: 3,
    archetype: "balanced",
    weaknesses: { instruments: ["piano"], elements: [] },
    resists: { instruments: [], elements: [] },
    chipFraction: 0.25,
    pattern: "retrograde",
  },
  mite: {
    id: "mite",
    name: "Mite",
    hp: 480,
    gaugePeriod: 24,
    attackCooldownLoops: 1,
    parryEveryLoops: 2,
    parry: { density: 7, minGapMs: 450 },
    baseAttack: 2,
    archetype: "horde",
    weaknesses: { instruments: [], elements: ["bright"] },
    resists: { instruments: ["strings"], elements: [] },
    chipFraction: 0.25,
    pattern: "swarm",
  },
  carapace: {
    id: "carapace",
    name: "Carapace",
    hp: 1250,
    shield: 350,
    gaugePeriod: 48,
    attackCooldownLoops: 2,
    parryEveryLoops: 4,
    parry: { density: 4, holdRatio: 0.35, holdLenBeats: [2, 3] },
    baseAttack: 5,
    archetype: "tank",
    weaknesses: { instruments: ["brass"], elements: [] },
    resists: { instruments: ["piano"], elements: ["bright"] },
    chipFraction: 0.4,
    pattern: "ostinato",
  },
  mirror: {
    id: "mirror",
    name: "Mirror",
    hp: 950,
    shield: 200,
    gaugePeriod: 32,
    attackCooldownLoops: 1,
    parryEveryLoops: 3,
    baseAttack: 3,
    archetype: "balanced",
    weaknesses: { instruments: [], elements: [] },
    resists: { instruments: [], elements: [] },
    reflect: "nonchord",
    chipFraction: 0.3,
    pattern: "inversion",
  },
  moth: {
    id: "moth",
    name: "Dust Moth",
    hp: 1100,
    shield: 250,
    gaugePeriod: 40,
    attackCooldownLoops: 1,
    parryEveryLoops: 3,
    parry: { density: 6, bursts: true },
    baseAttack: 4,
    archetype: "balanced",
    weaknesses: { instruments: ["strings"], elements: [] },
    resists: { instruments: [], elements: [] },
    trackWipe: true,
    chipFraction: 0.35,
    pattern: "erasure",
  },
}

export interface InstrumentDef {
  id: string
  name: string
  element: string
  /** Base damage per note onset. Long notes multiply by len (capped). */
  base: number
  /** Crit chance 0..1 and multiplier (piano: high crit per spec example). */
  critChance: number
  critMult: number
  /** Buff applied on hit, if any (violin: slow poison per spec example). */
  onHitBuff?: { id: "poison" | "exposed"; power: number; ticks: number }
  /** How this instrument sounds in every source (lead/pad/bass/kit). */
  timbre: InstrumentTimbre
}

/** Serializable voice recipe: oscillator + envelope + mix. No Tone objects. */
export interface VoiceRecipe {
  oscillator: "sine" | "triangle" | "sawtooth" | "square"
  envelope: { attack: number; decay: number; sustain: number; release: number }
  volume: number
  /** 0..1 send into the shared reverb. */
  reverbSend: number
}

/** Bass recipe: oscillator through a lowpass + envelope. */
export interface BassRecipe {
  oscillator: "sine" | "triangle" | "sawtooth" | "square"
  cutoff: number
  envelope: { attack: number; decay: number; sustain: number; release: number }
  volume: number
}

/** Drum-kit coloration applied live when this instrument holds the beat seat. */
export interface KitRecipe {
  kickPitchDecay: number
  kickOctaves: number
  kickDecay: number
  kickVolume: number
  snareDecay: number
  snareVolume: number
  hatDecay: number
  hatVolume: number
}

export interface InstrumentTimbre {
  /** Melody-lane voice. */
  lead: VoiceRecipe
  /** Chord-pad voice (whole-note stabs). */
  pad: VoiceRecipe
  /** Beat-source bass voice. */
  bass: BassRecipe
  /** Beat-source drum coloration. */
  kit: KitRecipe
}

/** Neutral kit: the room's own pulse when the beat seat is empty. */
export const NEUTRAL_KIT: KitRecipe = {
  kickPitchDecay: 0.04,
  kickOctaves: 6,
  kickDecay: 0.35,
  kickVolume: -8,
  snareDecay: 0.17,
  snareVolume: -14,
  hatDecay: 0.05,
  hatVolume: -20,
}

/** Starter roster stub — full unlockable characters + deck land in Phase 2. */
export const INSTRUMENTS: Record<string, InstrumentDef> = {
  strings: {
    id: "strings", name: "Violins", element: "keen",
    base: 3, critChance: 0.1, critMult: 1.5,
    onHitBuff: { id: "poison", power: 1, ticks: 3 },
    timbre: {
      lead: {
        oscillator: "triangle",
        envelope: { attack: 0.08, decay: 0.3, sustain: 0.8, release: 0.6 },
        volume: -10, reverbSend: 0.35,
      },
      pad: {
        oscillator: "triangle",
        envelope: { attack: 0.12, decay: 0.6, sustain: 0.5, release: 1.8 },
        volume: -16, reverbSend: 0.35,
      },
      bass: {
        oscillator: "sine", cutoff: 300,
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 },
        volume: -6,
      },
      kit: {
        kickPitchDecay: 0.04, kickOctaves: 5, kickDecay: 0.3, kickVolume: -10,
        snareDecay: 0.12, snareVolume: -16, hatDecay: 0.04, hatVolume: -22,
      },
    },
  },
  piano: {
    id: "piano", name: "Piano", element: "bright",
    base: 3, critChance: 0.3, critMult: 2,
    timbre: {
      lead: {
        oscillator: "sine",
        envelope: { attack: 0.005, decay: 0.25, sustain: 0.1, release: 0.4 },
        volume: -9, reverbSend: 0.15,
      },
      pad: {
        oscillator: "sine",
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 1.4 },
        volume: -15, reverbSend: 0.2,
      },
      bass: {
        oscillator: "triangle", cutoff: 500,
        envelope: { attack: 0.005, decay: 0.25, sustain: 0.2, release: 0.3 },
        volume: -7,
      },
      kit: {
        kickPitchDecay: 0.03, kickOctaves: 7, kickDecay: 0.28, kickVolume: -8,
        snareDecay: 0.2, snareVolume: -13, hatDecay: 0.06, hatVolume: -19,
      },
    },
  },
  brass: {
    id: "brass", name: "Brass", element: "heavy",
    base: 5, critChance: 0.05, critMult: 1.5,
    timbre: {
      lead: {
        oscillator: "sawtooth",
        envelope: { attack: 0.06, decay: 0.2, sustain: 0.9, release: 0.3 },
        volume: -13, reverbSend: 0.1,
      },
      pad: {
        oscillator: "sawtooth",
        envelope: { attack: 0.08, decay: 0.4, sustain: 0.7, release: 1.2 },
        volume: -18, reverbSend: 0.12,
      },
      bass: {
        oscillator: "sawtooth", cutoff: 220,
        envelope: { attack: 0.02, decay: 0.25, sustain: 0.7, release: 0.35 },
        volume: -9,
      },
      kit: {
        kickPitchDecay: 0.06, kickOctaves: 4, kickDecay: 0.45, kickVolume: -6,
        snareDecay: 0.14, snareVolume: -14, hatDecay: 0.03, hatVolume: -21,
      },
    },
  },
}
