// Stage combat: pick a clip -> it joins on the next loop -> it hits every bar.
// The hichord colors each bar: tonic mends, subdominant drives, dominant
// builds tension that a tonic resolves into a big hit.
// Pure + deterministic given rng. 1 step = one 16th; bars resolve on step 0.
import type { EnemyProfile } from "@/data/enemies"
import { STAGE_COMBOS, getStageClip, type StageCombo } from "@/data/stageClips"
import type { LogEntry } from "./combat"
import {
  ROLES,
  STAGE_LOOP_STEPS,
  STAGE_STEPS_PER_BAR,
  TONIC,
  chordFunction,
  chordLabel,
  sameChord,
  type ChordPick,
  type Role,
  type StageClip,
} from "./stageMusic"
import type { HarmonicFunction, Key } from "./theory"
import {
  addShield,
  applyBuff,
  buffDamageTaken,
  damageThroughShield,
  healFighter,
  isDown,
  tickBuffs,
  type Fighter,
} from "./units"

export type Rng = () => number

/** Loops of grace before any foe may strike. */
export const INTRO_LOOPS = 1
/** Foe strike = baseAttack x this. */
export const STRIKE_SCALE = 4
export const MAX_TENSION = 4
/** Each tension stack adds this much to the resolving bar's damage. */
export const RESOLVE_PER_STACK = 0.5
/** Holding one chord this many bars goes stale. */
export const STALE_AFTER_BARS = 3
export const STALE_MULT = 0.75
export const TONIC_SUPPORT_MULT = 1.5
export const SUBDOMINANT_DAMAGE_MULT = 1.25
const MAX_LOG = 30

export interface BarReport {
  /** Global bar index. */
  bar: number
  chord: string
  fn: HarmonicFunction
  target: string | null
  damage: number
  shield: number
  heal: number
  /** Damage multiplier applied this bar (chord x combos x stale). */
  mult: number
  /** Tension stacks cashed in by a resolution (0 = none). */
  resolved: number
  stale: boolean
  combos: string[]
}

export interface StageStats {
  damage: number
  resolutions: number
  bestMult: number
}

export interface StageState {
  /** Last processed global step. -1 before the first downbeat. */
  step: number
  key: Key
  party: Fighter[]
  enemies: Fighter[]
  enemyProfiles: Record<string, EnemyProfile>
  /** The clip playing in each role. */
  active: Record<Role, string | null>
  /** Changes waiting for the next loop: a clip id, or null to drop the role. */
  queued: Partial<Record<Role, string | null>>
  /** Chord sounding this bar. */
  chord: ChordPick
  /** Chord waiting for the next bar line. */
  pendingChord: ChordPick | null
  /** Consecutive bars on the current chord. */
  heldBars: number
  tension: number
  /** Combo ids found so far this fight. */
  discovered: string[]
  lastBar: BarReport | null
  stats: StageStats
  over: "player" | "enemy" | null
  log: LogEntry[]
}

export function createStage(init: {
  key: Key
  party: Fighter[]
  enemies: Fighter[]
  enemyProfiles: Record<string, EnemyProfile>
  active?: Partial<Record<Role, string | null>>
}): StageState {
  const active = Object.fromEntries(ROLES.map((r) => [r, null])) as Record<Role, string | null>
  Object.assign(active, init.active ?? { breaks: "breaks:halftime" })
  return {
    step: -1,
    key: { ...init.key },
    party: init.party.map((f) => ({ ...f, buffs: [...f.buffs] })),
    enemies: init.enemies.map((f) => ({ ...f, buffs: [...f.buffs] })),
    enemyProfiles: { ...init.enemyProfiles },
    active,
    queued: {},
    chord: { ...TONIC },
    pendingChord: null,
    heldBars: 0,
    tension: 0,
    discovered: [],
    lastBar: null,
    stats: { damage: 0, resolutions: 0, bestMult: 1 },
    over: null,
    log: [{ tick: 0, text: "The room hums. Pick your sounds; they join on the next loop." }],
  }
}

function pushLog(log: LogEntry[], tick: number, text: string): LogEntry[] {
  const next = [...log, { tick, text }]
  return next.length > MAX_LOG ? next.slice(next.length - MAX_LOG) : next
}

// ---------------------------------------------------------------------------
// Player input
// ---------------------------------------------------------------------------

export type ClipStatus = "idle" | "active" | "joining" | "leaving"

export function clipStatus(state: StageState, id: string): ClipStatus {
  const clip = getStageClip(id)
  if (!clip) return "idle"
  const playing = state.active[clip.role] === id
  const queued = state.queued[clip.role]
  if (queued === undefined) return playing ? "active" : "idle"
  if (queued === id) return "joining"
  return playing ? "leaving" : "idle"
}

/**
 * Tap a clip. Idle -> joins next loop. Playing -> leaves next loop.
 * Tapping a pending change again cancels it. One clip per role.
 */
export function toggleClip(state: StageState, id: string): StageState {
  const clip = getStageClip(id)
  if (!clip || state.over) return state
  const role = clip.role
  const queued = { ...state.queued }
  const pending = queued[role]
  if (pending !== undefined && (pending === id || state.active[role] === id)) {
    delete queued[role]
  } else if (state.active[role] === id) {
    queued[role] = null
  } else {
    queued[role] = id
  }
  return { ...state, queued }
}

/** Press a hichord chord. It lands on the next bar line. */
export function pressChord(state: StageState, pick: ChordPick): StageState {
  if (state.over || pick.degree < 1 || pick.degree > 7) return state
  const pendingChord = sameChord(pick, state.chord) ? null : { ...pick }
  return { ...state, pendingChord }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function activeClips(state: StageState): StageClip[] {
  return ROLES.flatMap((r) => {
    const id = state.active[r]
    const clip = id ? getStageClip(id) : undefined
    return clip ? [clip] : []
  })
}

export function matchedCombos(active: Record<Role, string | null>): StageCombo[] {
  const ids = new Set(Object.values(active).filter((x): x is string => x != null))
  return STAGE_COMBOS.filter(
    (c) => c.clips.every((id) => ids.has(id)) && (c.roles ?? []).every((r) => active[r] != null),
  )
}

function strikeEvery(state: StageState, foe: Fighter): number {
  const profile = state.enemyProfiles[foe.id]
  const every = Math.max(1, profile?.parryEveryLoops ?? 3)
  const enraged = profile != null && foe.hp > 0 && foe.hp <= profile.hp * 0.25
  return enraged ? Math.max(1, Math.floor(every / 2)) : every
}

/** Does foe `i` strike at the start of `loop`? Foes are staggered by index. */
export function isStrikeLoop(loop: number, foeIndex: number, every: number): boolean {
  return loop > INTRO_LOOPS && (loop - INTRO_LOOPS + foeIndex) % every === 0
}

/** Steps until foe `i` next strikes (null when down or over). */
export function stepsUntilStrike(state: StageState, i: number): number | null {
  const foe = state.enemies[i]
  if (!foe || isDown(foe) || state.over) return null
  const every = strikeEvery(state, foe)
  const now = Math.max(0, state.step)
  const loop = Math.floor(now / STAGE_LOOP_STEPS)
  for (let k = 1; k <= every + INTRO_LOOPS + 1; k++) {
    if (isStrikeLoop(loop + k, i, every)) return (loop + k) * STAGE_LOOP_STEPS - now
  }
  return null
}

/** 0..1 wind-up toward foe `i`'s next strike (for the gauge). */
export function strikeCharge(state: StageState, i: number): number {
  const foe = state.enemies[i]
  const left = stepsUntilStrike(state, i)
  if (!foe || left == null) return 0
  const window = strikeEvery(state, foe) * STAGE_LOOP_STEPS
  return Math.max(0, Math.min(1, 1 - left / window))
}

// ---------------------------------------------------------------------------
// The clock
// ---------------------------------------------------------------------------

/** Process every step up to and including `toStep` (catches up after stalls). */
export function advanceStage(state: StageState, toStep: number, rng: Rng = Math.random): StageState {
  let s = state
  while (s.step < toStep && !s.over) s = stepOnce(s, s.step + 1, rng)
  return s
}

function stepOnce(state: StageState, g: number, rng: Rng): StageState {
  let s: StageState = { ...state, step: g }
  if (g % STAGE_STEPS_PER_BAR !== 0) return s
  if (g % STAGE_LOOP_STEPS === 0) s = startLoop(s, g, rng)
  if (s.over) return s
  s = resolveBar(s, g, rng)
  return checkOver(s, g)
}

function startLoop(state: StageState, g: number, rng: Rng): StageState {
  const loop = g / STAGE_LOOP_STEPS
  let log = state.log
  // Buffs (exposed, regen, poison) last until the loop wraps.
  const party = state.party.map((f) => {
    const r = tickBuffs(f)
    for (const e of r.events) log = pushLog(log, g, e)
    return r.fighter
  })
  let enemies = state.enemies.map((f) => {
    const r = tickBuffs(f)
    for (const e of r.events) log = pushLog(log, g, e)
    return r.fighter
  })
  // Queued picks land on the downbeat.
  const active = { ...state.active }
  for (const role of ROLES) {
    const next = state.queued[role]
    if (next === undefined) continue
    const before = active[role] ? getStageClip(active[role]!)?.name : null
    active[role] = next
    const after = next ? getStageClip(next)?.name : null
    log = pushLog(log, g, after ? `${after} joins the mix.` : `${before ?? "A sound"} drops out.`)
  }
  let s: StageState = { ...state, party, enemies, active, queued: {}, log }
  // Foes strike on the downbeat, staggered.
  enemies.forEach((foe, i) => {
    if (s.over || isDown(foe) || !isStrikeLoop(loop, i, strikeEvery(s, foe))) return
    s = strike(s, i, g, rng)
    enemies = s.enemies
  })
  return s
}

function strike(state: StageState, i: number, g: number, rng: Rng): StageState {
  const foe = state.enemies[i]
  const profile = state.enemyProfiles[foe.id]
  const targets = state.party.filter((f) => !isDown(f))
  if (!profile || targets.length === 0) return state
  const target = targets[Math.floor(rng() * targets.length)]
  const enraged = foe.hp <= profile.hp * 0.25
  const dmg = Math.round(profile.baseAttack * STRIKE_SCALE * (enraged ? 1.5 : 1))
  const hit = damageThroughShield(target, dmg)
  const party = state.party.map((f) => (f.id === target.id ? hit.fighter : f))
  const blocked = hit.shielded > 0 ? ` (${hit.shielded} blocked)` : ""
  let log = pushLog(state.log, g, `${foe.name} strikes ${target.name} for ${dmg}${blocked}.`)
  let active = state.active
  if (profile.trackWipe) {
    const lit = ROLES.filter((r) => r !== "breaks" && active[r] != null)
    if (lit.length > 0) {
      const role = lit[Math.floor(rng() * lit.length)]
      log = pushLog(log, g, `${foe.name} erases your ${getStageClip(active[role]!)?.name ?? role}.`)
      active = { ...active, [role]: null }
    }
  }
  return { ...state, party, active, log }
}

function resolveBar(state: StageState, g: number, rng: Rng): StageState {
  const bar = g / STAGE_STEPS_PER_BAR
  const chord = state.pendingChord ?? state.chord
  const heldBars = sameChord(chord, state.chord) ? state.heldBars + 1 : 1
  const fn = chordFunction(state.key, chord)

  // Harmony -> multipliers. Sus and dominants wind up; a plain tonic releases.
  let tension = state.tension
  let resolved = 0
  let damageMult = 1
  let supportMult = 1
  if (chord.mod === "sus") {
    tension = Math.min(MAX_TENSION, tension + 1)
  } else if (fn === "D") {
    tension = Math.min(MAX_TENSION, tension + (chord.mod === "seventh" ? 2 : 1))
  } else if (fn === "T") {
    supportMult *= TONIC_SUPPORT_MULT
    if (tension > 0) {
      resolved = tension
      damageMult *= 1 + RESOLVE_PER_STACK * tension
      tension = 0
    }
  } else {
    damageMult *= SUBDOMINANT_DAMAGE_MULT
  }
  const stale = heldBars >= STALE_AFTER_BARS
  if (stale) {
    damageMult *= STALE_MULT
    supportMult *= STALE_MULT
  }

  // Combos: authored sets the player finds by ear.
  const combos = matchedCombos(state.active)
  let log = state.log
  const discovered = [...state.discovered]
  for (const c of combos) {
    damageMult *= c.damageMult ?? 1
    if (!discovered.includes(c.id)) {
      discovered.push(c.id)
      log = pushLog(log, g, `✦ Combo discovered: ${c.name}! ${c.blurb}`)
    }
  }

  // Sum the clips' per-bar effects.
  const target = state.enemies.find((f) => !isDown(f)) ?? null
  const profile = target ? state.enemyProfiles[target.id] : undefined
  let rawDamage = 0
  let shield = 0
  let heal = 0
  let expose = 0
  for (const clip of activeClips(state)) {
    const fx = clip.effect
    // Swarms slip past slow sounds and get shredded by fast ones.
    const swarm = profile?.archetype === "horde" ? (clip.role === "bass" || clip.role === "harmony" ? 0.5 : 1.25) : 1
    rawDamage += (fx.damage ?? 0) * swarm
    shield += fx.shield ?? 0
    heal += fx.heal ?? 0
    expose += fx.expose ?? 0
  }
  for (const c of combos) {
    rawDamage += c.bonus?.damage ?? 0
    shield += c.bonus?.shield ?? 0
    heal += c.bonus?.heal ?? 0
    expose += c.bonus?.expose ?? 0
  }
  shield = Math.round(shield * supportMult)
  heal = Math.round(heal * supportMult)

  let enemies = state.enemies
  let party = state.party
  let damage = 0
  if (target && rawDamage > 0) {
    damage = Math.round(rawDamage * damageMult * buffDamageTaken(target))
    const landed = damageThroughShield(target, damage)
    let hit = landed.fighter
    if (expose > 0 && !isDown(hit)) hit = applyBuff(hit, { id: "exposed", power: expose, ticksLeft: 1 })
    enemies = enemies.map((f) => (f.id === target.id ? hit : f))
    // Mirrors bounce whatever lands while the harmony is still unresolved.
    if (profile?.reflect && (fn === "D" || chord.mod === "sus") && damage > 0) {
      const alive = party.filter((f) => !isDown(f))
      if (alive.length > 0) {
        const victim = alive[Math.floor(rng() * alive.length)]
        const back = Math.round(damage * 0.5)
        party = party.map((f) => (f.id === victim.id ? damageThroughShield(f, back).fighter : f))
        log = pushLog(log, g, `${target.name} reflects ${back} of the unresolved tension onto ${victim.name}.`)
      }
    }
  }
  if (shield > 0 || heal > 0) {
    party = party.map((f) => (isDown(f) ? f : addShield(healFighter(f, heal), shield)))
  }

  const label = chordLabel(state.key, chord)
  if (damage > 0 || shield > 0 || heal > 0) {
    const parts: string[] = []
    if (damage > 0 && target) parts.push(`${damage} to ${target.name}`)
    if (shield > 0) parts.push(`+${shield} shield`)
    if (heal > 0) parts.push(`+${heal} hp`)
    const tag = resolved > 0 ? ` resolves x${damageMult.toFixed(2)}` : stale ? " (stale)" : ""
    log = pushLog(log, g, `Bar ${bar + 1} · ${label}${tag}: ${parts.join(", ")}.`)
  }

  const lastBar: BarReport = {
    bar,
    chord: label,
    fn,
    target: target?.name ?? null,
    damage,
    shield,
    heal,
    mult: Math.round(damageMult * 100) / 100,
    resolved,
    stale,
    combos: combos.map((c) => c.name),
  }
  return {
    ...state,
    party,
    enemies,
    chord,
    pendingChord: null,
    heldBars,
    tension,
    discovered,
    lastBar,
    stats: {
      damage: state.stats.damage + damage,
      resolutions: state.stats.resolutions + (resolved > 0 ? 1 : 0),
      bestMult: Math.max(state.stats.bestMult, lastBar.mult),
    },
    log,
  }
}

function checkOver(state: StageState, g: number): StageState {
  if (state.enemies.every(isDown)) {
    return { ...state, over: "player", log: pushLog(state.log, g, "The discord is quieted. You stand victorious.") }
  }
  if (state.party.every(isDown)) {
    return { ...state, over: "enemy", log: pushLog(state.log, g, "The hum fades. You fall.") }
  }
  return state
}
