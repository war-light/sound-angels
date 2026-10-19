// Pure TypeScript combat model — no audio, no React. Covered by Vitest.
// --- ATB combat synchronized to the musical loop (1 tick = 1 16th step). ---

import { ENEMIES, INSTRUMENTS, type EnemyProfile } from "../data/enemies"
import { chordEffectFor } from "../data/chords"
import { DEFAULT_PARTY_ROSTER, getCharacter } from "../data/roster"
import {
  allOnsetKeys,
  ATTACK_SLOTS,
  clearTracks,
  fitProgression,
  locateStep,
  loopLength,
  onsetKey,
  setChords,
  snapshotStep,
  type Arrangement,
  type NoteEvent,
} from "./arrangement"
import { tensionOf, type Key } from "./theory"
import { resolveFightKey } from "./keys"
import {
  chartFromMelody,
  createQte,
  harmonicChart,
  isQteComplete,
  missOverdueNotes,
  parryDamage,
  pressQte,
  qteSuccessRate,
  randomChart,
  releaseQte,
  type QteState,
} from "./qte"
import { generateParryChart, parryParamsFor } from "./parryChart"
import type { QteKey } from "./perform"
import { secondsToSteps } from "./perform"
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
  /**
   * Per-enemy cooldown counters (in steps), parallel to `enemies`.
   * When > 0, the gauge is frozen at 0 and the counter decrements by 1
   * each step. Set to `attackCooldownLoops * loopLength` after each attack.
   */
  cooldownLeft: number[]
  /**
   * Number of intro loops remaining.  While > 0 enemy gauges are frozen
   * (the "Exposition" grace period) and decrements at each loop wrap.
   */
  introLoopsLeft: number
  enemyProfiles: Record<string, EnemyProfile>
  /** Deck <-> position assignment (chord back row, attackers front). */
  slots: Slots
  /** Active chart: chord/preset (WASD, locks recording) or parry (ZXCV, sing freely). */
  activeQte: QteState | null
  /**
   * A chord swap cleared by a chart, waiting for the next bar line to land.
   * While set (or while a chord chart is open) melody lanes stay muted so the
   * ensemble records the new progression before soloists resume.
   */
  pendingChords: string[] | null
  /**
   * Loop-boundary parry schedule: the foe striking next + its strike tick.
   * Set when a parry chart opens (1–2 loops ahead), cleared on the strike.
   */
  parrySchedule: { foeId: string; strikeTick: number } | null
  /** Last strike tick per foe id — drives the per-enemy parry cadence. */
  lastParryTick: Record<string, number>
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
/** Shortest strike cadence the groove's `cadence` multiplier can produce. */
const MIN_CADENCE_STEPS = 4

/**
 * Enemy strike cadence in steps, scaled by the equipped groove. A Driving
 * groove pulls the next strike in; Half-time pushes it out. Gauge charge and
 * strike eligibility both read this, so the display never lies.
 */
function cadenceSteps(profile: EnemyProfile, loopLen: number, scale: number): number {
  return Math.max(MIN_CADENCE_STEPS, Math.round(Math.max(1, profile.parryEveryLoops) * scale * loopLen))
}

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
          hp: 36,
          shield: 0,
          maxShield: 14,
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
          hp: 36,
          shield: 0,
          maxShield: 14,
          instrument: def.id,
          element: def.element,
        })
      })
  const first = ENEMIES[enemyIds[0]]
  const partyIds = party.map((p) => p.id)
  const key = resolveFightKey({ key: opts.key, rng: opts.rng })
  const INTRO_LOOPS = 2
  return {
    tick: 0,
    key,
    party,
    enemies,
    gauges: enemies.map(() => 0),
    cooldownLeft: enemies.map(() => 0),
    introLoopsLeft: INTRO_LOOPS,
    enemyProfiles,
    slots: defaultSlots(partyIds),
    activeQte: null,
    pendingChords: null,
    parrySchedule: null,
    lastParryTick: {},
    lastTension: 0,
    potency: {},
    over: null,
    log: [{ tick: 0, text: `The room hums. ${first.name} stirs — but does not yet answer. Sing.` }],
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

/**
 * True while the ensemble is busy with a chord swap: a chord chart is open or
 * a cleared progression is waiting for the next bar line. Soloists go silent
 * (no melody damage, no lane audio) until the new harmony takes hold.
 */
export function melodyMuted(state: AtbState): boolean {
  return state.activeQte?.kind === "chord" || state.pendingChords != null
}

/** Open a chord-swap chart (one note per bar, harmonically derived). No-op when another chart is open. */
export function requestChordQte(state: AtbState, romans: string[], rng: Rng = Math.random): AtbState {
  if (state.activeQte || state.over) return state
  if (romans.length === 0) return state
  // B.4: chart encodes the harmonic motion of the progression itself.
  const chart = harmonicChart(romans)
  const deadlineTick = state.tick + Math.max(32, chart.lengthSteps)
  const activeQte =
    chart.notes.length >= 1
      ? createQte({
          kind: "chord",
          chart,
          startedTick: state.tick,
          deadlineTick,
          payload: { romans: [...romans] },
        })
      : createQte({
          kind: "chord",
          sequence: randomChart(4, rng),
          startedTick: state.tick,
          deadlineTick,
          payload: { romans: [...romans] },
        })
  return { ...state, activeQte, log: pushLog(state, "You reach for a new progression — match its motion!") }
}

/** Open a preset-recall chart (2-bar window, melody-derived). Carries the snapshot to restore. */
export function requestPresetQte(
  state: AtbState,
  snap: { hash: string; tracks: (NoteEvent | null)[][][]; chords: string[] },
  rng: Rng = Math.random,
): AtbState {
  if (state.activeQte || state.over) return state
  // B.3: chart is derived from the preset's actual melody content.
  const melodyQte = chartFromMelody(snap.tracks, 8)
  const payload = {
    hash: snap.hash,
    presetTracks: snap.tracks.map((tr) => tr.map((row) => row.map((e) => (e ? { ...e } : null)))),
    presetChords: [...snap.chords],
  }
  const deadlineTick = state.tick + Math.max(32, melodyQte.lengthSteps)
  const activeQte =
    melodyQte.notes.length >= 1
      ? createQte({
          kind: "preset",
          chart: melodyQte,
          startedTick: state.tick,
          deadlineTick,
          payload,
        })
      : createQte({
          kind: "preset",
          sequence: randomChart(4, rng),
          startedTick: state.tick,
          deadlineTick,
          payload,
        })
  return { ...state, activeQte, log: pushLog(state, "You lift a bottled loop — sing it back!") }
}

/** Score one key press against the open chart with step timing (no-op when none). */
export function pressQteKey(state: AtbState, key: QteKey, tick: number = state.tick): AtbState {
  if (!state.activeQte || state.over) return state
  const next = pressQte(state.activeQte, key, tick)
  if (next === state.activeQte) return state
  return { ...state, activeQte: next }
}

/** Score one key release against open hold notes (no-op when none). */
export function releaseQteKey(state: AtbState, key: QteKey, tick: number = state.tick): AtbState {
  if (!state.activeQte || state.over) return state
  const next = releaseQte(state.activeQte, key, tick)
  if (next === state.activeQte) return state
  return { ...state, activeQte: next }
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
  /** Groove crit bonus, added to the instrument's own crit chance. */
  critBonus = 0,
): NoteHit {
  if (rng() < evadeChance(profile.archetype, note.len)) {
    return { damage: 0, evaded: true, crit: false, reflected: 0 }
  }
  const def = INSTRUMENTS[note.instrument] ?? INSTRUMENTS.strings
  const crit = rng() < Math.max(0, Math.min(1, def.critChance + critBonus))
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
  critBonus: number,
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
    critBonus,
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
  if (target.hp > profile.hp * 0.25 && landed.fighter.hp <= profile.hp * 0.25 && !isDown(landed.fighter)) {
    lines.push(`The discord fractures — ${target.name} fights to survive!`)
  }
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
  // A progression cleared by a chart lands on the bar line, never mid-bar, so
  // the phrase never lurches. Reassigning `arrangement` up front means the
  // snapshot below, the audio layer, and the loop all switch together.
  let pendingChords = state.pendingChords
  if (pendingChords && tick % arrangement.stepsPerBar === 0) {
    arrangement = setChords(arrangement, pendingChords)
    pendingChords = null
  }
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
  // A.1 + A.2: gauges are frozen during the intro grace period and during
  // per-enemy cooldowns.  Outside these windows, gauges fill normally.
  let cooldownLeft = state.cooldownLeft.map((c) => Math.max(0, c - 1))
  let introLoopsLeft = state.introLoopsLeft
  const loopLen = loopLength(withKey)
  // The equipped groove stretches or squeezes every foe's strike cadence.
  const beatScale = withKey.groove.effect.cadence
  // Gauges are charge displays toward each foe's next scheduled strike:
  // post-attack cooldown freezes, then the bar fills across the rest of
  // the cadence cycle so 100 lands on the strike loop.
  let gauges = state.gauges.map((g, i) => {
    if (introLoopsLeft > 0) return 0       // A.2: intro freeze
    if (cooldownLeft[i] > 0) return 0      // A.1: post-attack cooldown
    if (isDown(state.enemies[i])) return g // skip dead enemies
    const foe = state.enemies[i]
    const profile = state.enemyProfiles[foe.id]
    const cadence = cadenceSteps(profile, loopLen, beatScale)
    const silence = Math.round(profile.attackCooldownLoops * loopLen * beatScale)
    const charge = Math.max(8, cadence - silence)
    return Math.min(100, g + 100 / charge)
  })
  let over: AtbState["over"] = null
  let log = state.log
  let activeQte = state.activeQte
  let parrySchedule = state.parrySchedule
  let lastParryTick = state.lastParryTick
  // FNF highway: overdue pending notes become misses each tick (combo reset).
  // The chart itself stays open until completed, deadline, or strike.
  if (activeQte) {
    activeQte = missOverdueNotes(activeQte, tick)
  }
  // The fight key is for sounding only (snapshotStep, tension, blessings).
  // The stored arrangement keeps its own key so a locked fight never
  // clobbers the player's picked / next-fight key.
  let nextArr = arrangement

  const s = (extra: Partial<AtbState> = {}): AtbState => ({
    ...state, tick, party, enemies, gauges, cooldownLeft, introLoopsLeft, lastTension, potency, over, log, activeQte, pendingChords, parrySchedule, lastParryTick, ...extra,
  })

  // Player charts resolve on the tick: completed chord swaps queue for the
  // next bar line, bottled loops land at once, expired charts fumble. Charts
  // use wall-clock Math.random at spawn so the seeded combat rng stream
  // (damage/targets) stays untouched.
  if (activeQte && (activeQte.kind === "chord" || activeQte.kind === "preset")) {
    if (isQteComplete(activeQte)) {
      if (activeQte.kind === "chord" && activeQte.payload.romans) {
        pendingChords = [...activeQte.payload.romans]
        log = pushLog(s({ log, activeQte }), "The progression is set — it lands on the next bar.")
      } else if (activeQte.kind === "preset" && activeQte.payload.presetTracks && activeQte.payload.presetChords) {
        const pt = activeQte.payload.presetTracks as (NoteEvent | null)[][][]
        const pc = activeQte.payload.presetChords as string[]
        if (pt.length === nextArr.tracks.length) {
          nextArr = { ...nextArr, tracks: pt, chords: fitProgression(pc, nextArr.bars) }
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
        activeQte.kind === "chord" ? "You fumble the progression change." : "The bottled loop slips away.",
      )
      activeQte = null
    }
  }
  if (activeQte?.kind === "parry" && tick > activeQte.deadlineTick) {
    log = pushLog(s({ log, activeQte }), "The opening passes.")
    activeQte = null
  }

  // Loop-boundary parry scheduling. Strikes land on loop ends, one foe
  // at a time, each every parryEveryLoops. The chart opens at the
  // boundary spanning ~5s wall-clock (1–2 loops), so the alert doubles as
  // the warning and never interrupts: busy hands (chord/preset) defer the
  // strike to the next boundary instead.
  if (!activeQte && !over && !parrySchedule && introLoopsLeft === 0 && tick % loopLen === 0) {
    const eligible = state.enemies.filter((foe) => {
      if (isDown(foe)) return false
      const profile = state.enemyProfiles[foe.id]
      const cadence = cadenceSteps(profile, loopLen, beatScale)
      const last = lastParryTick[foe.id] ?? -cadence
      return tick - last >= cadence
    })
    if (eligible.length > 0) {
      // Oldest striker first (round-robin across foes).
      eligible.sort((a, b) => (lastParryTick[a.id] ?? -1e9) - (lastParryTick[b.id] ?? -1e9))
      const foe = eligible[0]
      const profile = state.enemyProfiles[foe.id]
      const warningTicks = secondsToSteps(5, arrangement.bpm)
      const spanLoops = Math.min(2, Math.max(1, Math.ceil(warningTicks / loopLen)))
      const span = spanLoops * loopLen
      const chart = generateParryChart({
        params: parryParamsFor(profile.pattern, profile.parry),
        pattern: profile.pattern,
        spanSteps: span,
        bpm: arrangement.bpm,
        key: state.key,
        chords: arrangement.chords,
        stepsPerBar: arrangement.stepsPerBar,
        playerTracks: arrangement.tracks,
        variant: Math.floor(tick / loopLen),
        // Half-time widens the opening, Syncopated narrows it.
        windowBonus: withKey.groove.effect.parryWindow,
        rng,
      })
      activeQte = createQte({
        kind: "parry",
        chart,
        startedTick: tick,
        deadlineTick: tick + span,
        payload: { foeId: foe.id, chip: profile.chipFraction },
      })
      parrySchedule = { foeId: foe.id, strikeTick: tick + span }
      lastParryTick = { ...lastParryTick, [foe.id]: tick + span }
      log = pushLog(s({ log, gauges, activeQte, parrySchedule, lastParryTick }), `${foe.name} gathers… match it!`)
    }
  }

  // Loop wrap: melodies fade, the chord blessing lands, buffs tick.
  if (tick % loopLength(withKey) === 0) {
    // A.2: decrement the intro grace period counter.
    if (introLoopsLeft > 0) {
      introLoopsLeft = introLoopsLeft - 1
      if (introLoopsLeft === 0) {
        log = pushLog(s({ log, introLoopsLeft }), "The silence breaks. Discord stirs — sing to survive!")
      }
    }
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
  // During a chord swap the soloists stay muted (the ensemble records the new
  // harmony first); silence deals nothing, so no log spam on empty steps.
  const swapped = activeQte?.kind === "chord" || pendingChords != null
  for (const voice of snap.melodies) {
    if (over || swapped) break
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
      withKey.groove.effect.critBonus,
    )
    party = r.party
    enemies = r.enemies
    for (const line of r.lines) log = pushLog(s({ party, enemies, log }), line)
    if (r.over) over = r.over
  }

  state.enemies.forEach((foe, i) => {
    // Schedule-driven strikes: the telegraphed foe lands on its strike
    // tick (a loop end). Gauges are charge displays, not triggers.
    const due = parrySchedule?.foeId === foe.id && tick >= parrySchedule.strikeTick
    if (over || isDown(foe) || !due) return
    parrySchedule = null
    const profile = state.enemyProfiles[foe.id]
    gauges = gauges.map((g, j) => (j === i ? 0 : g))
    // A.1 + D.1: start post-attack cooldown (halved if enraged at <= 25% HP)
    const isEnraged = foe.hp > 0 && foe.hp <= profile.hp * 0.25
    const cooldownLoops = isEnraged
      ? Math.max(1, Math.floor(profile.attackCooldownLoops / 2))
      : profile.attackCooldownLoops
    // The groove's cadence stretches the silence too, so a fast kit leaves
    // the foe breathing harder for proportionally the same stretch.
    const cooldownSteps = Math.max(1, Math.round(cooldownLoops * loopLength(withKey) * beatScale))
    cooldownLeft = cooldownLeft.map((c, j) => (j === i ? cooldownSteps : c))
    if (tick % 8 === 0) {
      log = pushLog(s({ gauges, cooldownLeft, log, activeQte }), `${foe.name} answers in ${profile.pattern} (bar ${bar + 1}).`)
    }
    if (profile.trackWipe) {
      nextArr = clearTracks(nextArr)
      log = pushLog(s({ gauges, cooldownLeft, log, activeQte }), `${foe.name} erases your melodies. Sing them again.`)
    }
    const targets = aliveParty({ ...state, party })
    if (targets.length === 0) return
    const target = pickRandom(rng, targets)
    const bonus = lastTension > COUNTER_THRESHOLD ? COUNTER_BONUS : 0
    const baseAtk = isEnraged ? Math.round(profile.baseAttack * 1.5) : profile.baseAttack
    const full = baseAtk + bonus
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
        s({ party, gauges, cooldownLeft, log, activeQte }),
        bonus > 0
          ? `${foe.name} punishes the dissonance on ${target.name} for ${dmg} (${verdict}).`
          : `${foe.name} strikes ${target.name} for ${dmg} (${verdict}).`,
      )
      activeQte = null
    } else {
      const busy = activeQte ? " (you were busy)" : ""
      log = pushLog(
        s({ party, gauges, cooldownLeft, log, activeQte }),
        bonus > 0
          ? `${foe.name} punishes the dissonance on ${target.name} for ${dmg}${busy}.`
          : `${foe.name} strikes ${target.name} for ${dmg}${busy}.`,
      )
    }
    if (party.every(isDown)) {
      over = "enemy"
      log = pushLog(s({ party, gauges, cooldownLeft, log, activeQte }), "The hum fades. You fall.")
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

  return { state: s({ party, enemies, gauges, cooldownLeft, introLoopsLeft, over, log, activeQte }), arrangement: nextArr }
}
