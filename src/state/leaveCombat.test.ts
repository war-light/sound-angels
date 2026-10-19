import { beforeEach, describe, expect, it, vi } from "vitest"
import { useSessionStore } from "./useSessionStore"
import { stop as playerStop } from "@/audio/player"

vi.mock("@/audio/player", () => ({
  configurePlayer: vi.fn(),
  start: vi.fn(async () => {}),
  stop: vi.fn(),
  setBpm: vi.fn(),
}))

describe("leaving combat", () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
    vi.mocked(playerStop).mockClear()
  })

  it("halts the transport when Next Encounter advances to prep", () => {
    useSessionStore.setState({ playing: true, gamePhase: "victory" })
    const state = useSessionStore.getState()
    const next = state.encounters[1]

    // ResultOverlay does both: pick the trial, then return to prep.
    state.selectEncounter(next.id, true)
    state.toPrep()

    expect(playerStop).toHaveBeenCalled()
    expect(useSessionStore.getState().playing).toBe(false)
    expect(useSessionStore.getState().gamePhase).toBe("prep")
  })

  it("halts the transport when returning to preparation mid-fight loop", () => {
    useSessionStore.setState({ playing: true, gamePhase: "victory" })

    useSessionStore.getState().toPrep()

    expect(playerStop).toHaveBeenCalled()
    expect(useSessionStore.getState().playing).toBe(false)
    expect(useSessionStore.getState().gamePhase).toBe("prep")
  })

  it("halts the transport when heading back to the title", () => {
    useSessionStore.setState({ playing: true, gamePhase: "victory" })

    useSessionStore.getState().toMenu()

    expect(playerStop).toHaveBeenCalled()
    expect(useSessionStore.getState().playing).toBe(false)
    expect(useSessionStore.getState().gamePhase).toBe("menu")
  })
})
