import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ChordPicker } from "./ChordPicker"
import { useSessionStore } from "@/state/useSessionStore"

describe("ChordPicker", () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  it("applies a popular progression in one click", () => {
    render(<ChordPicker />)
    fireEvent.click(screen.getByRole("button", { name: /Pop Axis/i }))
    expect(useSessionStore.getState().arrangement.chords).toEqual(["I", "V", "vi", "IV"])
  })

  it("tags saved progressions as custom", () => {
    useSessionStore.setState({
      customChordPresets: [{ name: "My Progression", romans: ["I", "IV", "V", "I"], example: "C-F-G-C" }],
    })
    render(<ChordPicker />)
    expect(screen.getByRole("button", { name: /My Progression/i })).toBeInTheDocument()
    expect(screen.getByText("Custom")).toBeInTheDocument()
  })

  it("keeps the forge collapsed until asked", () => {
    render(<ChordPicker />)
    expect(screen.queryByText("Bar 1")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: /Harmonic Forge/i }))
    expect(screen.getByText("Bar 1")).toBeInTheDocument()
  })

  it("opens a swap chart instead of applying when the loop is playing", () => {
    useSessionStore.setState({ playing: true })
    render(<ChordPicker />)
    fireEvent.click(screen.getByRole("button", { name: /Doo-Wop/i }))
    expect(useSessionStore.getState().fight.activeQte?.kind).toBe("chord")
  })
})
