// Card loadout: the grooves and melodies the player brings into a fight.
// Pure game model — ids only, resolved against the card banks at use time.
//
//   Prep    — pick 1..4 groove cards and 1..6 melody cards.
//   Combat  — swap between equipped cards; the swap lands at the loop boundary.
import { DEFAULT_GROOVE_ID } from "./groove"
import { DEFAULT_MELODY_CARD_ID } from "./melodyBank"

export const MAX_GROOVE_CARDS = 4
export const MAX_MELODY_CARDS = 6

export interface Loadout {
  /** Equipped groove card ids. */
  grooves: string[]
  /** Equipped melody card ids. */
  melodies: string[]
}

export function createDefaultLoadout(): Loadout {
  return { grooves: [DEFAULT_GROOVE_ID], melodies: [DEFAULT_MELODY_CARD_ID] }
}

/** Add/remove a card id, respecting the bag's cap and its one-card floor. */
export function toggleLoadoutId(ids: string[], id: string, max: number): string[] {
  if (ids.includes(id)) {
    if (ids.length <= 1) return ids
    return ids.filter((x) => x !== id)
  }
  if (ids.length >= max) return ids
  return [...ids, id]
}

/**
 * Auto-select `next`, dropping `prev` first when the bag is full. Used by
 * copy-on-write: forking a preset swaps the fork in for the preset.
 */
export function selectLoadoutId(
  ids: string[],
  next: string,
  prev: string | null,
  max: number,
): string[] {
  if (ids.includes(next)) return ids
  const without = prev ? ids.filter((x) => x !== prev) : ids
  if (without.length < max) return [...without, next]
  return [...without.slice(0, max - 1), next]
}

/**
 * Drop ids that no longer resolve against the live banks. Each bag keeps at
 * least one card, falling back to the default when everything was pruned.
 */
export function sanitizeLoadout(
  loadout: Loadout,
  knownGrooves: string[],
  knownMelodies: string[],
): Loadout {
  const grooves = loadout.grooves.filter((id) => knownGrooves.includes(id)).slice(0, MAX_GROOVE_CARDS)
  const melodies = loadout.melodies.filter((id) => knownMelodies.includes(id)).slice(0, MAX_MELODY_CARDS)
  return {
    grooves: grooves.length > 0 ? grooves : [DEFAULT_GROOVE_ID],
    melodies: melodies.length > 0 ? melodies : [DEFAULT_MELODY_CARD_ID],
  }
}

/** Parse a persisted loadout. Returns null for anything malformed. */
export function parseLoadout(raw: unknown): Loadout | null {
  if (typeof raw !== "object" || raw == null) return null
  const o = raw as Partial<Loadout>
  if (!Array.isArray(o.grooves) || !Array.isArray(o.melodies)) return null
  const ids = (v: unknown[]) => v.filter((x): x is string => typeof x === "string")
  return { grooves: ids(o.grooves), melodies: ids(o.melodies) }
}
