import { describe, expect, it } from "vitest"
import { FIGHT_KEYS, keyEquals, randomFightKey, resolveFightKey } from "./keys"

describe("fight key pool", () => {
  it("exposes all playable possibilities", () => {
    expect(FIGHT_KEYS.map((k) => `${k.tonic} ${k.scale}`)).toEqual([
      "C minor",
      "D minor",
      "E minor",
      "A dorian",
    ])
  })

  it("resolves an explicit key for scripted combat events", () => {
    const fixed = { tonic: "E", scale: "minor", octave: 4 }
    expect(resolveFightKey({ key: fixed })).toEqual(fixed)
  })

  it("rolls deterministically given an rng", () => {
    expect(randomFightKey(() => 0)).toEqual(FIGHT_KEYS[0])
    expect(randomFightKey(() => 0.99)).toEqual(FIGHT_KEYS[FIGHT_KEYS.length - 1])
  })

  it("compares keys case-insensitively on scale", () => {
    expect(keyEquals({ tonic: "A", scale: "dorian" }, { tonic: "A", scale: "Dorian" })).toBe(true)
    expect(keyEquals({ tonic: "C", scale: "minor" }, { tonic: "D", scale: "minor" })).toBe(false)
  })
})
