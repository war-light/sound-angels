// Pure TypeScript combat model — no audio, no React. Covered by Vitest.
// --- ATB combat synchronized to the musical loop (1 tick = 1 16th step). ---

import { ENEMIES, INSTRUMENTS, type EnemyProfile } from "../data/enemies"
import { chordEffectFor } from "../data/chords"
import { DEFAULT_PARTY_ROSTER, getCharacter } from "../data/roster"
import {
  allOnsetKeys,
  ATTACK_SLOTS,
  clearTracks,
  locateStep,
  loopLength,
  onsetKey,
  snapshotStep,
  type Arrangement,
  type NoteEvent,
} from "./arrangement"
import { tensionOf, type Key } from "./theory"
import { resolveFightKey } from "./keys"
import {
  chartFromPattern,
  createQte,
  isQteComplete,
  parryDamage,
  pressQte,
  qteSuccessRate,
  randomChart,
  type QteState,
} from "./qte"
import type { PerformKey } from "./perform"
import { assignToSlot, defaultSlots, removeToDeck, type SlotId, type Slots } from "./positions"
import {
  addShield,
  applyBuff,
  buffDamageTaken,
  damageThroughShield,
  healFighter,
  isDown,
  makeFighter,
  tickBuffs,
  type Fighter,
} from "./units"

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
  /** Active FNF-style chart. WASD scores it while open; chord/preset charts lock recording. */
  activeQte: QteState | null
  /** Tension of the most recent melody step (drives damage + counters). */
  lastTension: number
/**
 * Per-onset echo potency (0.25..1). Fresh recordings hit at full
 * strength; every loop wrap dulls old melodies until the player records
 * new ones or runs back a cooled-down preset.
 */
  potency: Record<string, number>
  over: "player" | "enemy" | null
  log: LogEntry[]
}

export type Rng = () => number

const MAX_LOG = 30
const COUNTER_THRESHOLD = 0.5
const COUNTER_BONUS = 2
const LONG_LEN = 4 // len >= 4 counts as a long note
const LONG_CAP = 8
const REFLECT_FRACTION = 0.5
/** Melody fade: potency x0.75 per loop wrap, floored so old loops still whisper. */
const FADE_MULT = 0.75
const FADE_FLOOR = 0.25

/** Fresh full-strength potency for every onset on the loop (preset recalls). */
export function refreshPotency(arr: Arrangement): Record<string, number> {
  const potency: Record<string, number> = {}
  for (const k of allOnsetKeys(arr)) potency[k] = 1
  return potency
}

/**
 * Reconcile potency with the current arrangement: new recordings enter at
 * full strength, erased notes leave the map, old notes keep their fade.
 */
export function reconcilePotency(
  potency: Record<string, number>,
  arr: Arrangement,
): Record<string, number> {
  const live = new Set(allOnsetKeys(arr))
  const next: Record<string, number> = {}
  for (const k of live) next[k] = potency[k] ?? 1
  return next
}

const DEFAULT_PARTY: { name: string; instrument: string }[] = [
  { name: "First voice", instrument: "strings" },
  { name: "Second voice", instrument: "piano" },
  { name: "Third voice", instrument: "brass" },
]

export function createFight(opts: {
  /** Fixed key for scripted combat events. Omit to roll a random pool key. */
  key?: Key
  enemyIds?: string[]
  partyInstruments?: string[]
  partyCharacterIds?: string[]
  rng?: () => number
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
  const characterIds = opts.partyCharacterIds ?? (opts.partyInstruments ? null : DEFAULT_PARTY_ROSTER)
  const party = characterIds
    ? characterIds.map((cid, i) => {
        const char = getCharacter(cid)
        if (char) {
          const def = INSTRUMENTS[char.instrument]
          return makeFighter({
            id: `voice-${i}`,
            characterId: char.id,
            side: "party",
            name: char.name,
            title: char.title,
            avatar: char.avatar,
            hp: char.hp,
            shield: char.shield,
            maxShield: char.maxShield,
            instrument: def.id,
            element: char.element,
            trait: char.trait,
          })
        }
        const def = INSTRUMENTS.strings
        return makeFighter({
          id: `voice-${i}`,
          side: "party",
          name: `Voice ${i + 1}`,
          hp: 20,
          shield: 0,
          maxShield: 10,
          instrument: def.id,
          element: def.element,
        })
      })
    : (opts.partyInstruments ?? DEFAULT_PARTY.map((p) => p.instrument)).map((inst, i) => {
        const def = INSTRUMENTS[inst] ?? INSTRUMENTS.strings
        return makeFighter({
          id: `voice-${i}`,
          side: "party",
          name: DEFAULT_PARTY[i]?.name ?? `Voice ${i + 1}`,
          hp: 20,
          shield: 0,
          maxShield: 10,
          instrument: def.id,
          element: def.element,
        })
      })
  const first = ENEMIES[enemyIds[0]]
  const partyIds = party.map((p) => p.id)
  const key = resolveFightKey({ key: opts.key, rng: opts.rng })
  return {
    tick: 0,
    key,
    party,
    enemies,
    gauges: enemies.map(() => 0),
    enemyProfiles,
    slots: defaultSlots(partyIds),
    activeQte: null,
    lastTension: 0,
    potency: {},
    over: null,
    log: [{ tick: 0, text: `${first.name} stirs in the dark. Sing on the beat.` }],
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

/** While a chord/preset chart is open, WASD belongs to it: no loop recording. */
export function qteLocked(state: AtbState): boolean {
  return state.activeQte?.kind === "chord" || state.activeQte?.kind === "preset"
}

/** Open a chord-swap chart (16-tick window). No-op when another chart is open. */
export function requestChordQte(state: AtbState, romans: string[], rng: Rng = Math.random): AtbState {
  if (state.activeQte || state.over) return state
  if (romans.length === 0) return state
  const activeQte = createQte({
    kind: "chord",
    sequence: randomChart(4, rng),
    startedTick: state.tick,
    deadlineTick: state.tick + 16,
    payload: { romans: [...romans] },
  })
  return { ...state, activeQte, log: pushLog(state, "You reach for a new hymn — match it!") }
}

/** Open a preset-recall chart (16-tick window). Carries the snapshot to restore. */
export function requestPresetQte(
  state: AtbState,
  snap: { hash: string; tracks: (NoteEvent | null)[][][]; chords: string[] },
  rng: Rng = Math.random,
): AtbState {
  if (state.activeQte || state.over) return state
  const activeQte = createQte({
    kind: "preset",
    sequence: randomChart(4, rng),
    startedTick: state.tick,
    deadlineTick: state.tick + 16,
    payload: {
      hash: snap.hash,
      presetTracks: snap.tracks.map((tr) => tr.map((row) => row.map((e) => (e ? { ...e } : null)))),
      presetChords: [...snap.chords],
    },
  })
  return { ...state, activeQte, log: pushLog(state, "You lift a bottled loop — sing it back!") }
}

/** Score one WASD press against the open chart (no-op when none). */
export function pressQteKey(state: AtbState, key: PerformKey): AtbState {
  if (!state.activeQte || state.over) return state
  return { ...state, activeQte: pressQte(state.activeQte, key) }
}

/** Abandon the open chart (expiry / manual cancel). */
export function cancelQte(state: AtbState, reason = "The chart slips away."): AtbState {
  if (!state.activeQte) return state
  return { ...state, activeQte: null, log: pushLog(state, reason) }
}

/**
 * Living chord-keeper's instrument, or null when the chord seat is empty or
 * the keeper is down. Gates the bar-start stab: no keeper, no pad.
 */
export function keeperInstrument(state: AtbState): string | null {
  if (!state.slots.chord) return null
  const keeper = state.party.find((f) => f.id === state.slots.chord)
  if (!keeper || isDown(keeper)) return null
  return keeper.instrument ?? null
}

/** Any placed front attacker still standing (gates live WASD performance). */
export function hasLiveAttacker(state: AtbState): boolean {
  return state.slots.front.some((id) => {
    const f = state.party.find((c) => c.id === id)
    return !!f && !isDown(f)
  })
}

/**
 * Living beat-keeper's instrument, or null when the beat seat is empty or
 * the keeper is down. Colors the shared drum kit + selects the bass voice.
 */
export function beatInstrument(state: AtbState): string | null {
  if (!state.slots.beat) return null
  const keeper = state.party.find((f) => f.id === state.slots.beat)
  if (!keeper || isDown(keeper)) return null
  return keeper.instrument ?? null
}

/**
 * Default active attacker: the front-row lead, else the first party member.
 * An attacker is always selected, so WASD performs immediately with no setup.
 */
export function defaultPerformerId(state: AtbState): string | null {
  return state.slots.front[0] ?? state.party[0]?.id ?? null
}

/**
 * Lane binding: attacker track lane i belongs to front[i]. Lanes are stage
 * positions, not people — benching a character mutes their lane (notes are
 * kept) and placing someone restores it.
 */
export function laneAttacker(
  state: AtbState,
  fighters: Fighter[],
  slot: number,
): Fighter | undefined {
  const id = state.slots.front[slot]
  if (!id) return undefined
  const f = fighters.find((c) => c.id === id)
  return f && !isDown(f) ? f : undefined
}

/**
 * Which lane a performer records into: their front-row position, falling
 * back to the lead lane. Never party indexes — v1/v2/v3 map to attackers.
 */
export function performSlot(state: AtbState, performerId: string | null): number {
  const front = state.slots.front.length > 0 ? state.slots.front : state.party.map((f) => f.id)
  const at = performerId ? front.indexOf(performerId) : -1
  return (at >= 0 ? at : 0) % ATTACK_SLOTS
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

// --- Tick + loop damage ---

/**
 * Resolve one melody onset of the current step against a random alive
 * enemy. Shared by the per-voice loop below.
 */
function resolveMelodyVoice(
  state: AtbState,
  withKey: Arrangement,
  bar: number,
  step: number,
  voice: { slot: number; len: number; chordTone: boolean },
  foes: Fighter[],
  rng: Rng,
): { party: Fighter[]; enemies: Fighter[]; lines: string[]; over: AtbState["over"] } {
  let party = state.party
  let enemies = state.enemies
  const lines: string[] = []
  let over: AtbState["over"] = null
  const target = pickRandom(rng, foes)
  const profile = state.enemyProfiles[target.id]
  // Melody lanes hit strictly through their bound attacker
  // (lane i = front[i]). Unbound or fallen lanes stay muted.
  const attacker = laneAttacker(state, party, voice.slot)
  if (!attacker) return { party, enemies, lines, over }
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
    lines.push(`${target.name} evades the ${voice.len >= LONG_LEN ? "long" : "short"} note.`)
    return { party, enemies, lines, over }
  }
  const onset = withKey.tracks[voice.slot]?.[bar]?.[step]
  const echo = onset ? (state.potency[onsetKey(voice.slot, bar, step, onset)] ?? 1) : 1
  const bonus = chordEffectFor(state.key, withKey.chords).bonusDamage
  const damage = Math.max(0, Math.round((hit.damage + bonus) * echo))
  const landed = damageThroughShield(target, damage)
  enemies = enemies.map((f) => (f.id === target.id ? landed.fighter : f))
  let line = `${attacker.name} hits ${target.name} for ${damage}${hit.crit ? " (crit!)" : ""}${echo < 1 ? " (fading)" : ""}.`
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
  lines.push(line)
  if (enemies.every(isDown)) {
    over = "player"
    lines.push("Dissonance dissolves into harmony. You remain.")
  } else if (party.every(isDown)) {
    over = "enemy"
    lines.push("The reflection consumes you.")
  }
  return { party, enemies, lines, over }
}

/**
 * Advance one 16th-step tick: looped melodies hit as the playhead passes,
 * enemy gauges fill, track tension of any melody onsets, fire ready enemies
 * (track-wipe mutates the arrangement), tick buffs on each loop wrap.
 * Pure + deterministic given rng.
 */

export interface TickResult {
  state: AtbState
  arrangement: Arrangement
}

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
  let potency = reconcilePotency(state.potency, withKey)
  let gauges = state.gauges.map((g, i) => {
    const profile = state.enemyProfiles[state.enemies[i].id]
    return Math.min(100, g + 100 / profile.gaugePeriod)
  })
  let over: AtbState["over"] = null
  let log = state.log
  let activeQte = state.activeQte
  // The fight key is for sounding only (snapshotStep, tension, blessings).
  // The stored arrangement keeps its own key so a locked fight never
  // clobbers the player's picked / next-fight key.
  let nextArr = arrangement

  const s = (extra: Partial<AtbState> = {}): AtbState => ({
    ...state, tick, party, enemies, gauges, lastTension, potency, over, log, activeQte, ...extra,
  })

  // Player charts resolve on the tick: completed hymns/bottles land,
  // expired ones fumble. Charts use wall-clock Math.random at spawn so the
  // seeded combat rng stream (damage/targets) stays untouched.
  if (activeQte && (activeQte.kind === "chord" || activeQte.kind === "preset")) {
    if (isQteComplete(activeQte)) {
      if (activeQte.kind === "chord" && activeQte.payload.romans) {
        const romans = activeQte.payload.romans
        const chords = Array.from({ length: nextArr.bars }, (_, b) => romans[b % romans.length])
        nextArr = { ...nextArr, chords }
        potency = reconcilePotency(potency, { ...nextArr, key: state.key })
        log = pushLog(s({ log, activeQte }), "The new hymn takes hold.")
      } else if (activeQte.kind === "preset" && activeQte.payload.presetTracks && activeQte.payload.presetChords) {
        const pt = activeQte.payload.presetTracks as (NoteEvent | null)[][][]
        const pc = activeQte.payload.presetChords as string[]
        if (pt.length === nextArr.tracks.length) {
          nextArr = { ...nextArr, tracks: pt, chords: [...pc] }
          const live: Record<string, number> = {}
          for (const k of allOnsetKeys(nextArr)) live[k] = 1
          potency = live
          log = pushLog(s({ log, activeQte }), "The bottled loop sings again at full strength.")
        } else {
          log = pushLog(s({ log, activeQte }), "The bottled loop will not fit this stage.")
        }
      }
      activeQte = null
    } else if (tick >= activeQte.deadlineTick) {
      log = pushLog(
        s({ log, activeQte }),
        activeQte.kind === "chord" ? "You fumble the hymn change." : "The bottled loop slips away.",
      )
      activeQte = null
    }
  }
  if (activeQte?.kind === "parry" && tick > activeQte.deadlineTick) {
    log = pushLog(s({ log, activeQte }), "The opening passes.")
    activeQte = null
  }

  // Parry warning: the hottest charging foe opens a chart before it strikes.
  // Busy (chord/preset) hands cannot parry — the blow lands full.
  if (!activeQte && !over) {
    const warned = state.enemies.findIndex((foe, i) => {
      if (isDown(foe) || gauges[i] >= 100 || gauges[i] < 75) return false
      return true
    })
    if (warned >= 0) {
      const foe = state.enemies[warned]
      const profile = state.enemyProfiles[foe.id]
      const rate = 100 / profile.gaugePeriod
      const ticksLeft = Math.max(2, Math.ceil((100 - gauges[warned]) / rate))
      activeQte = createQte({
        kind: "parry",
        sequence: chartFromPattern(profile.pattern, 4),
        startedTick: tick,
        deadlineTick: tick + ticksLeft,
        payload: { foeId: foe.id, chip: profile.chipFraction },
      })
      log = pushLog(s({ log, gauges, activeQte }), `${foe.name} gathers… match it!`)
    }
  }

  // Loop wrap: melodies fade, the chord blessing lands, buffs tick.
  if (tick % loopLength(withKey) === 0) {
    const lines: string[] = []
    let dulled = false
    for (const k of Object.keys(potency)) {
      const faded = Math.max(FADE_FLOOR, Math.round(potency[k] * FADE_MULT * 100) / 100)
      if (faded < potency[k]) {
        potency = { ...potency, [k]: faded }
        dulled = true
      }
    }
    if (dulled) lines.push("The loop dulls: old melodies fade. Sing new ones.")
    const effect = chordEffectFor(state.key, withKey.chords)
    if (effect.regen > 0 || effect.ward > 0) {
      party = party.map((f) => {
        if (isDown(f)) return f
        const mended = effect.regen > 0 ? healFighter(f, effect.regen) : f
        return effect.ward > 0 ? addShield(mended, effect.ward) : mended
      })
      lines.push(
        effect.tier === "gold"
          ? "The golden progression mends and wards the party."
          : "The progression steadies: the party is faintly warded.",
      )
    }
    const keeper = state.slots.beat ? party.find((f) => f.id === state.slots.beat) : undefined
    if (keeper && !isDown(keeper)) {
      party = party.map((f) => (isDown(f) ? f : addShield(f, 1)))
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

  // The loop sings: every onset under the playhead hits a random foe.
  // Silence deals nothing (and stays quiet — no log spam on empty steps).
  for (const voice of snap.melodies) {
    if (over) break
    const foes = enemies.filter((f) => !isDown(f))
    if (foes.length === 0) break
    const r = resolveMelodyVoice(
      { ...s({ party, enemies, over, log }), potency },
      withKey,
      bar,
      step,
      voice,
      foes,
      rng,
    )
    party = r.party
    enemies = r.enemies
    for (const line of r.lines) log = pushLog(s({ party, enemies, log }), line)
    if (r.over) over = r.over
  }

  state.enemies.forEach((foe, i) => {
    if (over || isDown(foe) || gauges[i] < 100) return
    const profile = state.enemyProfiles[foe.id]
    gauges = gauges.map((g, j) => (j === i ? 0 : g))
    if (tick % 8 === 0) {
      log = pushLog(s({ gauges, log, activeQte }), `${foe.name} answers in ${profile.pattern} (bar ${bar + 1}).`)
    }
    if (profile.trackWipe) {
      nextArr = clearTracks(nextArr)
      log = pushLog(s({ gauges, log, activeQte }), `${foe.name} erases your melodies. Sing them again.`)
    }
    const targets = aliveParty({ ...state, party })
    if (targets.length === 0) return
    const target = pickRandom(rng, targets)
    const bonus = lastTension > COUNTER_THRESHOLD ? COUNTER_BONUS : 0
    const full = profile.baseAttack + bonus
    const isParry = activeQte?.kind === "parry"
    const dmg = isParry
      ? parryDamage(full, profile.chipFraction, activeQte)
      : Math.round(full * profile.chipFraction)
    const rate = isParry && activeQte ? qteSuccessRate(activeQte) : 0
    const hit = damageThroughShield(target, dmg)
    party = party.map((f) => (f.id === target.id ? hit.fighter : f))
    if (isParry) {
      const verdict = rate >= 1 ? "perfect parry" : rate >= 0.5 ? "blocked" : rate > 0 ? "half-blocked" : "unblocked"
      log = pushLog(
        s({ party, gauges, log, activeQte }),
        bonus > 0
          ? `${foe.name} punishes the dissonance on ${target.name} for ${dmg} (${verdict}).`
          : `${foe.name} strikes ${target.name} for ${dmg} (${verdict}).`,
      )
      activeQte = null
    } else {
      const busy = activeQte ? " (you were busy)" : ""
      log = pushLog(
        s({ party, gauges, log, activeQte }),
        bonus > 0
          ? `${foe.name} punishes the dissonance on ${target.name} for ${dmg}${busy}.`
          : `${foe.name} strikes ${target.name} for ${dmg}${busy}.`,
      )
    }
    if (party.every(isDown)) {
      over = "enemy"
      log = pushLog(s({ party, gauges, log, activeQte }), "The hum fades. You fall.")
    }
  })

  if (!over) {
    if (enemies.every(isDown)) {
      over = "player"
      log = pushLog(s({ party, enemies, log }), "The discord is quieted. You stand victorious.")
    } else if (party.every(isDown)) {
      over = "enemy"
      log = pushLog(s({ party, enemies, log }), "The hum fades. You fall.")
    }
  }

  return { state: s({ party, enemies, gauges, over, log, activeQte }), arrangement: nextArr }
}
