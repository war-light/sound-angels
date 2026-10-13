// Pure TypeScript combat model — no audio, no React. Covered by Vitest.
export interface Combatant {
  hp: number
  attack: number
}

export function simulateHit(attacker: Combatant, defender: Combatant): Combatant {
  return { ...defender, hp: Math.max(0, defender.hp - attacker.attack) }
}

// --- ATB combat synchronized to the musical loop (1 tick = 1 16th step). ---

import { ENEMIES, INSTRUMENTS, type EnemyProfile } from "../data/enemies"
import {
  clearTracks,
  locateStep,
  loopLength,
  snapshotStep,
  type Arrangement,
} from "./arrangement"
import { tensionOf, type Key } from "./theory"
import { assignToSlot, defaultSlots, removeToDeck, type SlotId, type Slots } from "./positions"
import {
  applyBuff,
  buffDamageTaken,
  damageThroughShield,
  isDown,
  makeFighter,
  tickBuffs,
  type Fighter,
} from "./units"

export { ENEMIES }

export interface LogEntry {
  tick: number
  text: string
}

export interface AtbState {
  tick: number
  /** Key locked at fight start. No mid-fight modulation (Phase 3 QTE re-opens it). */
  key: Key
  party: Fighter[]
  enemies: Fighter[]
  /** Per-enemy ATB gauges (0..100), parallel to `enemies`. */
  gauges: number[]
  enemyProfiles: Record<string, EnemyProfile>
  /** Deck <-> position assignment (chord/beat back row, attackers front). */
  slots: Slots
  /** Shared party loop-energy gauge (0..100). Spends on resolve. */
  voiceGauge: number
  /** Tension of the most recent melody step (drives damage + counters). */
  lastTension: number
  over: "player" | "enemy" | null
  log: LogEntry[]
}

export type Rng = () => number

const MAX_LOG = 30
const VOICE_PERIOD = 16 // full voice gauge in one bar
const COUNTER_THRESHOLD = 0.5
const COUNTER_BONUS = 2
const LONG_LEN = 4 // len >= 4 counts as a long note
const LONG_CAP = 8
const REFLECT_FRACTION = 0.5

const DEFAULT_PARTY: { name: string; instrument: string }[] = [
  { name: "First voice", instrument: "strings" },
  { name: "Second voice", instrument: "piano" },
  { name: "Third voice", instrument: "brass" },
]

export function createFight(opts: {
  key: Key
  enemyIds?: string[]
  partyInstruments?: string[]
}): AtbState {
  const enemyIds = opts.enemyIds ?? ["echo"]
  if (enemyIds.length === 0) throw new Error("A fight needs at least one enemy")
  const enemies: Fighter[] = []
  const enemyProfiles: Record<string, EnemyProfile> = {}
  enemyIds.forEach((eid, i) => {
    const profile = ENEMIES[eid]
    if (!profile) throw new Error(`Unknown enemy: ${eid}`)
    const fighter = makeFighter({
      id: `${profile.id}-${i}`,
      side: "foe",
      name: enemyIds.length > 1 ? `${profile.name} ${i + 1}` : profile.name,
      hp: profile.hp,
      shield: profile.shield ?? 0,
    })
    enemies.push(fighter)
    enemyProfiles[fighter.id] = profile
  })
  const instruments = opts.partyInstruments ?? DEFAULT_PARTY.map((p) => p.instrument)
  const party = DEFAULT_PARTY.map((slot, i) => {
    const def = INSTRUMENTS[instruments[i] ?? "strings"]
    return makeFighter({
      id: `voice-${i}`,
      side: "party",
      name: slot.name,
      hp: 20,
      shield: 0,
      instrument: def.id,
      element: def.element,
    })
  })
  // Party shields start empty but have headroom for ward effects.
  party.forEach((f) => {
    f.maxShield = 6
  })
  const first = ENEMIES[enemyIds[0]]
  const partyIds = party.map((p) => p.id)
  return {
    tick: 0,
    key: { ...opts.key },
    party,
    enemies,
    gauges: enemies.map(() => 0),
    enemyProfiles,
    slots: defaultSlots(partyIds),
    voiceGauge: 0,
    lastTension: 0,
    over: null,
    log: [{ tick: 0, text: `${first.name} stirs in the dark. Resolve on the beat.` }],
  }
}

function pushLog(state: AtbState, text: string): LogEntry[] {
  const next = [...state.log, { tick: state.tick, text }]
  return next.length > MAX_LOG ? next.slice(next.length - MAX_LOG) : next
}

export function aliveParty(state: AtbState): Fighter[] {
  return state.party.filter((f) => !isDown(f))
}

export function aliveEnemies(state: AtbState): Fighter[] {
  return state.enemies.filter((f) => !isDown(f))
}

/** Move a party member between deck and positions. */
export function moveFighter(state: AtbState, fighterId: string, slot: SlotId | null): AtbState {
  const fighter = state.party.find((f) => f.id === fighterId)
  if (!fighter) return state
  const slots = slot == null ? removeToDeck(state.slots, fighterId) : assignToSlot(state.slots, fighterId, slot)
  return { ...state, slots, log: pushLog(state, slot == null ? `${fighter.name} steps back to the deck.` : `${fighter.name} takes the ${slot}.`) }
}

/** Instrument voicing the bar-start chord stabs (chord-slot member). */
export function chordInstrument(state: AtbState): string | null {
  if (!state.slots.chord) return null
  return state.party.find((f) => f.id === state.slots.chord)?.instrument ?? null
}

function pickRandom<T>(rng: Rng, items: T[]): T {
  return items[Math.floor(rng() * items.length)]
}

// --- Note damage ---

export interface NoteHit {
  damage: number
  evaded: boolean
  crit: boolean
  /** Damage bounced back at the attacker (reflect variants). */
  reflected: number
}

function evadeChance(archetype: EnemyProfile["archetype"], len: number): number {
  const long = len >= LONG_LEN
  if (archetype === "horde") return long ? 0.45 : 0.1
  if (archetype === "tank") return long ? 0.1 : 0.05
  return long ? 0.1 : 0.05
}

/**
 * Resolve one melody onset against one enemy. Seeded rng keeps tests
 * deterministic; defaults to Math.random live.
 */
export function computeNoteDamage(
  note: { len: number; instrument: string; element: string; chordTone: boolean },
  enemy: Fighter,
  profile: EnemyProfile,
  rng: Rng = Math.random,
): NoteHit {
  if (rng() < evadeChance(profile.archetype, note.len)) {
    return { damage: 0, evaded: true, crit: false, reflected: 0 }
  }
  const def = INSTRUMENTS[note.instrument] ?? INSTRUMENTS.strings
  const crit = rng() < def.critChance
  let mult = note.len >= LONG_LEN ? Math.min(note.len, LONG_CAP) : 1
  if (profile.weaknesses.instruments.includes(note.instrument)) mult *= 1.5
  if (profile.weaknesses.elements.includes(note.element)) mult *= 1.5
  if (profile.resists.instruments.includes(note.instrument)) mult *= 0.5
  if (profile.resists.elements.includes(note.element)) mult *= 0.5
  mult *= buffDamageTaken(enemy)
  if (crit) mult *= def.critMult
  const damage = Math.max(0, Math.round(def.base * mult))
  let reflected = 0
  if (profile.reflect === "nonchord" && !note.chordTone) reflected = damage * REFLECT_FRACTION
  else if (profile.reflect === "long" && note.len >= LONG_LEN) reflected = damage * REFLECT_FRACTION
  else if (profile.reflect === "short" && note.len < LONG_LEN) reflected = damage * REFLECT_FRACTION
  return { damage, evaded: false, crit, reflected: Math.round(reflected) }
}

// --- Tick + resolve ---

export interface TickResult {
  state: AtbState
  arrangement: Arrangement
}

/**
 * Advance one 16th-step tick: fill voice + enemy gauges, track tension of any
 * melody onsets, fire ready enemies (track-wipe mutates the arrangement),
 * tick buffs on each loop wrap. Pure + deterministic given rng.
 */
export function advanceTick(
  state: AtbState,
  arrangement: Arrangement,
  rng: Rng = Math.random,
): TickResult {
  if (state.over) return { state, arrangement }
  const tick = state.tick + 1
  const withKey = { ...arrangement, key: state.key }
  const { bar, step } = locateStep(withKey, tick)
  const snap = snapshotStep(withKey, bar, step)

  let lastTension = state.lastTension
  if (snap.melodies.length > 0) {
    lastTension = tensionOf(
      snap.melodies.map((m) => m.midi),
      snap.chord,
    )
  }

  let party = state.party
  let enemies = state.enemies
  let voiceGauge = Math.min(100, state.voiceGauge + 100 / VOICE_PERIOD)
  let gauges = state.gauges.map((g, i) => {
    const profile = state.enemyProfiles[state.enemies[i].id]
    return Math.min(100, g + 100 / profile.gaugePeriod)
  })
  let over: AtbState["over"] = null
  let log = state.log
  let nextArr = withKey

  const s = (extra: Partial<AtbState> = {}): AtbState => ({
    ...state, tick, party, enemies, gauges, voiceGauge, lastTension, over, log, ...extra,
  })

  // Loop wrap: buffs tick once per loop; the beat-keeper wards the party.
  if (tick % loopLength(withKey) === 0) {
    const lines: string[] = []
    const keeper = state.slots.beat ? party.find((f) => f.id === state.slots.beat) : undefined
    if (keeper && !isDown(keeper)) {
      party = party.map((f) =>
        isDown(f) ? f : { ...f, shield: Math.min(f.maxShield, f.shield + 1) },
      )
      lines.push(`${keeper.name} keeps the beat: the party is warded.`)
    }
    party = party.map((f) => {
      const r = tickBuffs(f)
      lines.push(...r.events)
      return r.fighter
    })
    enemies = enemies.map((f) => {
      const r = tickBuffs(f)
      lines.push(...r.events)
      return r.fighter
    })
    for (const line of lines) log = pushLog({ ...s(), log }, line)
  }

  state.enemies.forEach((foe, i) => {
    if (over || isDown(foe) || gauges[i] < 100) return
    const profile = state.enemyProfiles[foe.id]
    gauges = gauges.map((g, j) => (j === i ? 0 : g))
    if (tick % 8 === 0) {
      log = pushLog(s({ gauges, log }), `${foe.name} answers in ${profile.pattern} (bar ${bar + 1}).`)
    }
    if (profile.trackWipe) {
      nextArr = clearTracks(nextArr)
      log = pushLog(s({ gauges, log }), `${foe.name} erases your melodies. Sing them again.`)
    }
    const targets = party.filter((f) => !isDown(f))
    if (targets.length === 0) return
    const target = pickRandom(rng, targets)
    const bonus = lastTension > COUNTER_THRESHOLD ? COUNTER_BONUS : 0
    const dmg = Math.round((profile.baseAttack + bonus) * profile.chipFraction)
    const hit = damageThroughShield(target, dmg)
    party = party.map((f) => (f.id === target.id ? hit.fighter : f))
    log = pushLog(
      s({ party, gauges, log }),
      bonus > 0
        ? `${foe.name} punishes the dissonance on ${target.name} for ${dmg}.`
        : `${foe.name} strikes ${target.name} for ${dmg}.`,
    )
    if (party.every(isDown)) {
      over = "enemy"
      log = pushLog(s({ party, gauges, log }), "The hum fades. You fall.")
    }
  })

  return { state: s({ party, enemies, gauges, voiceGauge, over, log }), arrangement: nextArr }
}

/**
 * Party resolution: spend a full voice gauge to resolve every melody onset on
 * the current step against random alive enemies. No-op (same state) when the
 * fight is over, the gauge is not ready, or no enemy stands.
 */
export function strike(
  state: AtbState,
  arrangement: Arrangement,
  rng: Rng = Math.random,
): { state: AtbState; arrangement: Arrangement } {
  if (state.over || state.voiceGauge < 100 || aliveEnemies(state).length === 0) {
    return { state, arrangement }
  }
  const withKey = { ...arrangement, key: state.key }
  const { bar, step } = locateStep(withKey, state.tick)
  const snap = snapshotStep(withKey, bar, step)

  let party = state.party
  let enemies = state.enemies
  let log = state.log
  let over: AtbState["over"] = null
  const s = (extra: Partial<AtbState> = {}): AtbState => ({
    ...state, party, enemies, voiceGauge: 0, over, log, ...extra,
  })

  if (snap.melodies.length === 0) {
    log = pushLog(state, "The voice breaks on silence. Nothing resolves.")
    return { state: s({ log }), arrangement }
  }

  snap.melodies.forEach((voice) => {
    if (over) return
    const foes = enemies.filter((f) => !isDown(f))
    if (foes.length === 0) return
    const target = pickRandom(rng, foes)
    const profile = state.enemyProfiles[target.id]
    // Melody track slots resolve through the front row (fallback: whole party).
    const front = state.slots.front
      .map((id) => party.find((f) => f.id === id))
      .filter((f): f is Fighter => !!f && !isDown(f))
    const attackers = front.length > 0 ? front : party.filter((f) => !isDown(f))
    if (attackers.length === 0) return
    const attacker = attackers[voice.slot % attackers.length]
    const def = INSTRUMENTS[attacker.instrument ?? "strings"]
    const hit = computeNoteDamage(
      {
        len: voice.len,
        instrument: attacker.instrument ?? "strings",
        element: attacker.element ?? def.element,
        chordTone: voice.chordTone,
      },
      target,
      profile,
      rng,
    )
    if (hit.evaded) {
      log = pushLog(s({ log }), `${target.name} evades the ${voice.len >= LONG_LEN ? "long" : "short"} note.`)
      return
    }
    const landed = damageThroughShield(target, hit.damage)
    enemies = enemies.map((f) => (f.id === target.id ? landed.fighter : f))
    let line = `${attacker.name} resolves on ${target.name} for ${hit.damage}${hit.crit ? " (crit!)" : ""}.`
    if (def.onHitBuff && !isDown(landed.fighter)) {
      enemies = enemies.map((f) =>
        f.id === target.id
          ? applyBuff(f, { id: def.onHitBuff!.id, power: def.onHitBuff!.power, ticksLeft: def.onHitBuff!.ticks })
          : f,
      )
      line += ` ${target.name} is ${def.onHitBuff.id === "poison" ? "poisoned" : "exposed"}.`
    }
    if (hit.reflected > 0) {
      const back = damageThroughShield(attacker, hit.reflected)
      party = party.map((f) => (f.id === attacker.id ? back.fighter : f))
      line += ` Mirror answers: ${hit.reflected} reflected.`
    }
    log = pushLog(s({ party, enemies, log }), line)
    if (enemies.every(isDown)) {
      over = "player"
      log = pushLog(s({ party, enemies, log }), "Dissonance dissolves into harmony. You remain.")
    } else if (party.every(isDown)) {
      over = "enemy"
      log = pushLog(s({ party, enemies, log }), "The reflection consumes you.")
    }
  })

  return { state: s({ party, enemies, over, log }), arrangement }
}
