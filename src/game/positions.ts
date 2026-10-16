// Deck <-> position assignment. Pure TypeScript, JSON-serializable.
// Chord + beat hold the back row; attackers hold the front. Deck membership
// is derived (party members in no slot), never stored, so it cannot desync.
export type SlotId = "chord" | "beat" | "front"

import { ATTACK_SLOTS } from "./arrangement"

export interface Slots {
  chord: string | null
  beat: string | null
  front: string[]
}

export const MAX_FRONT = ATTACK_SLOTS

export function defaultSlots(partyIds: string[]): Slots {
  return {
    chord: partyIds[0] ?? null,
    beat: null,
    front: partyIds.slice(1, 1 + MAX_FRONT),
  }
}

/** Ids of party members currently sitting in the deck (unassigned). */
export function deckIds(partyIds: string[], slots: Slots): string[] {
  const placed = new Set<string>([...(slots.chord ? [slots.chord] : []), ...(slots.beat ? [slots.beat] : []), ...slots.front])
  return partyIds.filter((id) => !placed.has(id))
}

function without(slots: Slots, id: string): Slots {
  return {
    chord: slots.chord === id ? null : slots.chord,
    beat: slots.beat === id ? null : slots.beat,
    front: slots.front.filter((f) => f !== id),
  }
}

/** Place a fighter into a slot (moves them out of any current slot). */
export function assignToSlot(slots: Slots, fighterId: string, slot: SlotId): Slots {
  const cleared = without(slots, fighterId)
  if (slot === "front") {
    return { ...cleared, front: [...cleared.front.slice(-(MAX_FRONT - 1)), fighterId] }
  }
  return { ...cleared, [slot]: fighterId }
}

/** Send a fighter back to the deck. */
export function removeToDeck(slots: Slots, fighterId: string): Slots {
  return without(slots, fighterId)
}

/** Which slot (if any) holds the fighter. */
export function slotOf(slots: Slots, fighterId: string): SlotId | null {
  if (slots.chord === fighterId) return "chord"
  if (slots.beat === fighterId) return "beat"
  if (slots.front.includes(fighterId)) return "front"
  return null
}
