// Static enemy + instrument balance data. Pure data, no logic.
export type Archetype = "horde" | "tank" | "balanced"
export type ReflectMode = "nonchord" | "long" | "short"

export interface EnemyProfile {
  id: string
  name: string
  hp: number
  shield?: number
  /** Steps per full gauge (32 = one 2-bar loop). */
  gaugePeriod: number
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
    hp: 30,
    gaugePeriod: 32,
    baseAttack: 3,
    archetype: "balanced",
    weaknesses: { instruments: ["piano"], elements: [] },
    resists: { instruments: [], elements: [] },
    chipFraction: 1,
    pattern: "retrograde",
  },
  mite: {
    id: "mite",
    name: "Mite",
    hp: 12,
    gaugePeriod: 24,
    baseAttack: 2,
    archetype: "horde",
    weaknesses: { instruments: [], elements: ["bright"] },
    resists: { instruments: ["strings"], elements: [] },
    chipFraction: 1,
    pattern: "swarm",
  },
  carapace: {
    id: "carapace",
    name: "Carapace",
    hp: 55,
    shield: 8,
    gaugePeriod: 48,
    baseAttack: 5,
    archetype: "tank",
    weaknesses: { instruments: ["brass"], elements: [] },
    resists: { instruments: ["piano"], elements: ["bright"] },
    chipFraction: 1,
    pattern: "ostinato",
  },
  mirror: {
    id: "mirror",
    name: "Mirror",
    hp: 26,
    gaugePeriod: 32,
    baseAttack: 3,
    archetype: "balanced",
    weaknesses: { instruments: [], elements: [] },
    resists: { instruments: [], elements: [] },
    reflect: "nonchord",
    chipFraction: 1,
    pattern: "inversion",
  },
  moth: {
    id: "moth",
    name: "Dust Moth",
    hp: 22,
    gaugePeriod: 40,
    baseAttack: 4,
    archetype: "balanced",
    weaknesses: { instruments: ["strings"], elements: [] },
    resists: { instruments: [], elements: [] },
    trackWipe: true,
    chipFraction: 1,
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
}

/** Starter roster stub — full unlockable characters + deck land in Phase 2. */
export const INSTRUMENTS: Record<string, InstrumentDef> = {
  strings: {
    id: "strings", name: "Violins", element: "keen",
    base: 3, critChance: 0.1, critMult: 1.5,
    onHitBuff: { id: "poison", power: 1, ticks: 3 },
  },
  piano: {
    id: "piano", name: "Piano", element: "bright",
    base: 3, critChance: 0.3, critMult: 2,
  },
  brass: {
    id: "brass", name: "Brass", element: "heavy",
    base: 5, critChance: 0.05, critMult: 1.5,
  },
}
