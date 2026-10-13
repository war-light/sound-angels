// Session singleton: engine state (arrangement + fight) lives outside React.
// Pure game layer — no Tone.js, no React. UI mirrors it via subscribe().
import {
  createDefaultArrangement,
  type Arrangement,
} from "./arrangement"
import {
  advanceTick,
  createFight,
  moveFighter as moveFighterInFight,
  strike,
  type AtbState,
} from "./combat"
import type { SlotId } from "./positions"

let arrangement: Arrangement = createDefaultArrangement()
/** The fight key snapshots the arrangement key at (re)start and stays locked. */
let fight: AtbState = createFight({ key: arrangement.key })

type Listener = () => void
const listeners = new Set<Listener>()

function emit(): void {
  for (const fn of listeners) fn()
}

export function getArrangement(): Arrangement {
  return arrangement
}

export function getFight(): AtbState {
  return fight
}

export function updateArrangement(next: Arrangement): void {
  arrangement = next
  emit()
}

export function mutateArrangement(fn: (a: Arrangement) => Arrangement): void {
  arrangement = fn(arrangement)
  emit()
}

/**
 * Called once per scheduled 16th step (via Tone.Draw in the audio player).
 * Applies enemy track-wipes to the arrangement as well as the fight.
 * Note: Draw pauses in background tabs, so the fight can lag the audio
 * there. Acceptable for the demo; the loop keeps playing.
 */
export function handleStep(): void {
  if (fight.over) return
  const r = advanceTick(fight, arrangement)
  fight = r.state
  if (r.arrangement !== arrangement) arrangement = r.arrangement
  emit()
}

export function playerStrike(): void {
  const r = strike(fight, arrangement)
  if (r.state !== fight) {
    fight = r.state
    arrangement = r.arrangement
    emit()
  }
}

/** Deck <-> position move. No-op for unknown fighters. */
export function moveFighter(fighterId: string, slot: SlotId | null): void {
  const next = moveFighterInFight(fight, fighterId, slot)
  if (next !== fight) {
    fight = next
    emit()
  }
}

export function resetFight(): void {
  fight = createFight({ key: arrangement.key })
  emit()
}

export function resetAll(): void {
  arrangement = createDefaultArrangement()
  fight = createFight({ key: arrangement.key })
  emit()
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
