// Combat key pool: every fight runs in one of these keys.
// A fight either rolls a random key or takes an explicit override
// (e.g. a scripted combat event / boss with a fixed key).
import type { Key } from "./theory"

/** All playable combat keys. Single source of truth for the UI. */
export const FIGHT_KEYS: Key[] = [
  { tonic: "C", scale: "minor", octave: 4 },
  { tonic: "D", scale: "minor", octave: 4 },
  { tonic: "E", scale: "minor", octave: 4 },
  { tonic: "A", scale: "dorian", octave: 4 },
]

export function keyEquals(a: Key, b: Key): boolean {
  return a.tonic === b.tonic && a.scale.toLowerCase() === b.scale.toLowerCase()
}

export function keyLabel(key: Key): string {
  return `${key.tonic} ${key.scale}`
}

/** Pick a random key from the pool. Inject rng for deterministic tests. */
export function randomFightKey(rng: () => number = Math.random): Key {
  const pick = FIGHT_KEYS[Math.floor(rng() * FIGHT_KEYS.length) % FIGHT_KEYS.length]
  return { ...pick }
}

export interface FightKeyOpts {
  /** Explicit key for scripted combat events. Omit for a random roll. */
  key?: Key
  rng?: () => number
}

/** Resolve the key for a new fight: explicit override wins, else random. */
export function resolveFightKey(opts: FightKeyOpts = {}): Key {
  if (opts.key) return { ...opts.key }
  return randomFightKey(opts.rng)
}
