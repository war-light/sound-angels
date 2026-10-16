// Shared fighter model for party members and enemies.
// Health / Shield / Buffs. Pure TypeScript, JSON-serializable.
export type BuffId = "poison" | "regen" | "exposed" | "warded"

export interface Buff {
  id: BuffId
  /** Damage per tick (poison) or heal per tick (regen), or % modifier (exposed/warded). */
  power: number
  ticksLeft: number
}

export interface Fighter {
  id: string
  side: "party" | "foe"
  name: string
  hp: number
  max: number
  shield: number
  maxShield: number
  buffs: Buff[]
  /** Attacker identity tags for weakness/resistance checks. */
  instrument?: string
  element?: string
  characterId?: string
  avatar?: string
  title?: string
  trait?: string
}

export function makeFighter(init: {
  id: string
  side: "party" | "foe"
  name: string
  hp: number
  shield?: number
  maxShield?: number
  instrument?: string
  element?: string
  characterId?: string
  avatar?: string
  title?: string
  trait?: string
}): Fighter {
  return {
    id: init.id,
    side: init.side,
    name: init.name,
    hp: init.hp,
    max: init.hp,
    shield: init.shield ?? 0,
    maxShield: init.maxShield ?? Math.max(init.shield ?? 0, 0),
    buffs: [],
    instrument: init.instrument,
    element: init.element,
    characterId: init.characterId,
    avatar: init.avatar,
    title: init.title,
    trait: init.trait,
  }
}

export function isDown(f: Fighter): boolean {
  return f.hp <= 0
}

/**
 * Apply raw damage: shield absorbs first, overflow hits HP. Clamps at 0.
 * Returns the updated fighter plus how much each layer absorbed (for the log).
 */
export function damageThroughShield(
  f: Fighter,
  amount: number,
): { fighter: Fighter; shielded: number; toHp: number } {
  const dmg = Math.max(0, Math.round(amount))
  const shielded = Math.min(f.shield, dmg)
  const toHp = dmg - shielded
  return {
    fighter: { ...f, shield: f.shield - shielded, hp: Math.max(0, f.hp - toHp) },
    shielded,
    toHp,
  }
}

export function healFighter(f: Fighter, amount: number): Fighter {
  if (isDown(f)) return f
  return { ...f, hp: Math.min(f.max, f.hp + Math.max(0, Math.round(amount))) }
}

export function addShield(f: Fighter, amount: number): Fighter {
  return { ...f, shield: Math.min(f.maxShield, f.shield + Math.max(0, Math.round(amount))) }
}

/**
 * Add a buff. Same id refreshes duration and takes max power (no infinite stacking).
 * Ticks <= 0 clears that buff id.
 */
export function applyBuff(f: Fighter, buff: Buff): Fighter {
  if (buff.ticksLeft <= 0) {
    return { ...f, buffs: f.buffs.filter((b) => b.id !== buff.id) }
  }
  const rest = f.buffs.filter((b) => b.id !== buff.id)
  const prev = f.buffs.find((b) => b.id === buff.id)
  return {
    ...f,
    buffs: [
      ...rest,
      {
        id: buff.id,
        power: Math.max(buff.power, prev?.power ?? 0),
        ticksLeft: Math.max(buff.ticksLeft, prev?.ticksLeft ?? 0),
      },
    ],
  }
}

/**
 * Tick all buffs once (called per loop wrap, not per step).
 * Poison bypasses shield straight to HP; regen heals HP. Exposed/warded are
 * passive multipliers consumed by the damage calc — ticking only counts them down.
 */
export function tickBuffs(f: Fighter): { fighter: Fighter; events: string[] } {
  let cur: Fighter = { ...f }
  const events: string[] = []
  for (const b of f.buffs) {
    if (b.id === "poison" && cur.hp > 0) {
      cur = { ...cur, hp: Math.max(0, cur.hp - b.power) }
      events.push(`${cur.name} suffers ${b.power} poison.`)
    } else if (b.id === "regen" && cur.hp > 0) {
      const before = cur.hp
      cur = healFighter(cur, b.power)
      if (cur.hp !== before) events.push(`${cur.name} recovers ${cur.hp - before}.`)
    }
  }
  const buffs = cur.buffs
    .map((b) => ({ ...b, ticksLeft: b.ticksLeft - 1 }))
    .filter((b) => b.ticksLeft > 0)
  cur = { ...cur, buffs }
  return { fighter: cur, events }
}

/** Compact status glyphs for buffs (poison ☠, regen +, exposed !, other ◈). */
export function buffGlyphs(f: Fighter): string {
  return f.buffs
    .map((b) => (b.id === "poison" ? "☠" : b.id === "regen" ? "+" : b.id === "exposed" ? "!" : "◈"))
    .join("")
}

/** Multiplicative damage-taken modifier from exposed (+%) / warded (-%). */
export function buffDamageTaken(f: Fighter): number {
  let mult = 1
  for (const b of f.buffs) {
    if (b.id === "exposed") mult *= 1 + b.power / 100
    if (b.id === "warded") mult *= Math.max(0.1, 1 - b.power / 100)
  }
  return mult
}
