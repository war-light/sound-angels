// Melody-set presets with cooldowns + hash-based duplicate detection.
// Deleting a preset and recreating the identical set does NOT bypass the
// cooldown: entries are keyed by content hash and tombstoned, never removed.
import type { Arrangement } from "./arrangement"
import { countOnsets, hashMelodySet } from "./arrangement"

export interface PresetEntry {
  name: string
  hash: string
  cooldownUntilTick: number
  deleted: boolean
}

export type PresetStore = Record<string, PresetEntry>

/** Cooldown in ticks: 2 loops + 1 per 8 onsets. */
export function cooldownFor(arr: Arrangement): number {
  const loop = arr.bars * arr.stepsPerBar
  return loop * 2 + Math.ceil(countOnsets(arr) / 8)
}

export function hashArrangement(arr: Arrangement): string {
  return hashMelodySet(arr.tracks, arr.chords)
}

/**
 * Save the current melody set as a preset. An identical set (same hash,
 * even renamed or previously deleted) shares the existing cooldown entry.
 */
export function savePreset(
  store: PresetStore,
  name: string,
  arr: Arrangement,
  nowTick: number,
): { store: PresetStore; entry: PresetEntry; fresh: boolean } {
  const hash = hashArrangement(arr)
  const prev = store[hash]
  if (prev) {
    const entry: PresetEntry = { ...prev, name, deleted: false }
    return { store: { ...store, [hash]: entry }, entry, fresh: false }
  }
  const entry: PresetEntry = {
    name,
    hash,
    cooldownUntilTick: nowTick + cooldownFor(arr),
    deleted: false,
  }
  return { store: { ...store, [hash]: entry }, entry, fresh: true }
}

/** Delete by name. The hash entry is tombstoned so recreates keep cooldown. */
export function deletePreset(store: PresetStore, name: string): PresetStore {
  const next: PresetStore = {}
  for (const [hash, e] of Object.entries(store)) {
    next[hash] = e.name === name ? { ...e, deleted: true } : e
  }
  return next
}

/** Live (non-deleted) presets whose cooldown has elapsed. */
export function readyPresets(store: PresetStore, nowTick: number): PresetEntry[] {
  return Object.values(store).filter((e) => !e.deleted && e.cooldownUntilTick <= nowTick)
}

export function isOnCooldown(store: PresetStore, arr: Arrangement, nowTick: number): boolean {
  const e = store[hashArrangement(arr)]
  return !!e && e.cooldownUntilTick > nowTick
}
