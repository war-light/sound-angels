import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useSessionStore } from "./useSessionStore"

beforeEach(() => {
  useSessionStore.getState().reset()
  useSessionStore.setState({ playing: true, globalStep: 0 })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("record at keypress", () => {
  it("writes the onset on keydown and refines its length on keyup", () => {
    const store = useSessionStore.getState()
    let now = 1000
    vi.spyOn(performance, "now").mockImplementation(() => now)
    store.performDown("w")
    // Default lead voice-1 records lane 0; W walks degree 1 -> 2, starting short.
    expect(useSessionStore.getState().arrangement.tracks[0][0][0]).toEqual({ degree: 2, len: 1 })
    now += 500 // ~3 sixteenths at 90bpm -> held len 2
    store.performUp("w")
    expect(useSessionStore.getState().arrangement.tracks[0][0][0]).toEqual({ degree: 2, len: 2 })
  })

  it("quantizes the cell from the press-time step, not the release step", () => {
    const store = useSessionStore.getState()
    useSessionStore.setState({ globalStep: 5 })
    store.performDown("w")
    expect(useSessionStore.getState().arrangement.tracks[0][0][5]).toEqual({ degree: 2, len: 1 })
    // The loop runs on while held; the release must not move the note.
    useSessionStore.setState({ globalStep: 9 })
    store.performUp("w")
    expect(useSessionStore.getState().arrangement.tracks[0][0][5]).toEqual({ degree: 2, len: 1 })
    // Seeded degree-4 onset at step 8 untouched.
    expect(useSessionStore.getState().arrangement.tracks[0][0][8]).toEqual({ degree: 4, len: 1 })
  })

  it("ignores releases with no matching press", () => {
    const store = useSessionStore.getState()
    const before = useSessionStore.getState().arrangement
    store.performUp("a")
    expect(useSessionStore.getState().arrangement).toBe(before)
  })

  it("routes WASD into the open chart instead of the loop", () => {
    const store = useSessionStore.getState()
    expect(store.requestChordChart(["I", "V"])).toBe(true)
    const chart = useSessionStore.getState().fight.activeQte?.sequence ?? []
    expect(chart.length).toBeGreaterThan(0)
    const before = useSessionStore.getState().arrangement.tracks[0][0][0]
    // A wrong key scores a miss; the loop cell is untouched.
    const wrong = (["w", "a", "s", "d"] as const).find((k) => k !== chart[0]) ?? "w"
    store.performDown(wrong)
    expect(useSessionStore.getState().fight.activeQte?.misses).toBe(1)
    expect(useSessionStore.getState().arrangement.tracks[0][0][0]).toEqual(before)
    // The expected key scores a hit.
    store.performDown(chart[0])
    expect(useSessionStore.getState().fight.activeQte?.hits).toBe(1)
    expect(useSessionStore.getState().arrangement.tracks[0][0][0]).toEqual(before)
  })

  it("recovers when a keyup is lost (releaseAllKeys drops half-held presses)", () => {
    const store = useSessionStore.getState()
    store.performDown("w")
    expect(useSessionStore.getState().arrangement.tracks[0][0][0]).toEqual({ degree: 2, len: 1 })
    // The keyup never arrives (alt-tab mid-press); the key would trap.
    store.releaseAllKeys()
    // The next press records fresh instead of being swallowed as a repeat.
    useSessionStore.setState({ globalStep: 4 })
    store.performDown("w")
    expect(useSessionStore.getState().arrangement.tracks[0][0][4]).toEqual({ degree: 3, len: 1 })
    store.releaseAllKeys()
  })
})
