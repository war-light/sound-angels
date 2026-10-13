import { describe, expect, it } from "vitest"
import { createDefaultArrangement, toggleNoteEvent } from "./arrangement"
import {
  deletePreset,
  isOnCooldown,
  readyPresets,
  savePreset,
  type PresetStore,
} from "./presets"

describe("savePreset", () => {
  it("creates a fresh entry with a future cooldown", () => {
    const arr = createDefaultArrangement()
    const { store, entry, fresh } = savePreset({}, "opener", arr, 0)
    expect(fresh).toBe(true)
    expect(entry.name).toBe("opener")
    expect(entry.cooldownUntilTick).toBeGreaterThan(0)
    expect(isOnCooldown(store, arr, 0)).toBe(true)
    expect(readyPresets(store, 0)).toEqual([])
    expect(readyPresets(store, entry.cooldownUntilTick)).toEqual([
      { ...entry },
    ])
  })

  it("identical set under a new name shares the cooldown (not fresh)", () => {
    const arr = createDefaultArrangement()
    const first = savePreset({}, "opener", arr, 0)
    const second = savePreset(first.store, "opener-copy", arr, 10)
    expect(second.fresh).toBe(false)
    expect(second.entry.cooldownUntilTick).toBe(first.entry.cooldownUntilTick)
    expect(second.entry.name).toBe("opener-copy")
  })

  it("delete + recreate does not bypass the cooldown", () => {
    const arr = createDefaultArrangement()
    const first = savePreset({}, "opener", arr, 0)
    const deleted = deletePreset(first.store, "opener")
    expect(readyPresets(deleted, 99999)).toEqual([])
    const again = savePreset(deleted, "opener-v2", arr, 5)
    expect(again.fresh).toBe(false)
    expect(again.entry.cooldownUntilTick).toBe(first.entry.cooldownUntilTick)
    expect(isOnCooldown(again.store, arr, 5)).toBe(true)
  })

  it("a changed set is a new preset with its own cooldown", () => {
    const arr = createDefaultArrangement()
    const first = savePreset({}, "opener", arr, 0)
    const changed = toggleNoteEvent(arr, 0, 0, 1, { degree: 7, len: 2 })
    const second = savePreset(first.store, "twist", changed, 0)
    expect(second.fresh).toBe(true)
    expect(Object.keys(second.store).length).toBe(2)
  })

  it("serializes to JSON", () => {
    const arr = createDefaultArrangement()
    const { store }: { store: PresetStore } = savePreset({}, "opener", arr, 0)
    expect(JSON.parse(JSON.stringify(store))).toEqual(store)
  })
})
