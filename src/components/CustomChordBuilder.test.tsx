import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { CustomChordBuilder } from "./CustomChordBuilder"
import { useSessionStore } from "@/state/useSessionStore"

describe("CustomChordBuilder component", () => {
  beforeEach(() => {
    useSessionStore.setState({
      arrangement: {
        ...useSessionStore.getState().arrangement,
        chords: ["I", "vi", "IV", "V"],
      },
    })
  })

  it("renders 4 bar slots with initial chords", () => {
    render(<CustomChordBuilder />)
    expect(screen.getByText("Bar 1")).toBeInTheDocument()
    expect(screen.getByText("Bar 2")).toBeInTheDocument()
    expect(screen.getByText("Bar 3")).toBeInTheDocument()
    expect(screen.getByText("Bar 4")).toBeInTheDocument()

    expect(screen.getByText("Harmonic Forge")).toBeInTheDocument()
  })

  it("displays quality metrics and tier", () => {
    render(<CustomChordBuilder />)
    expect(screen.getByText(/Harmonic Quality/i)).toBeInTheDocument()
    expect(screen.getByText(/Voice Leading/i)).toBeInTheDocument()
    expect(screen.getByText(/Diatonic Scale Fit/i)).toBeInTheDocument()
    expect(screen.getByText(/Harmonic Cadence/i)).toBeInTheDocument()
  })

  it("allows selecting a roman numeral and applying progression", () => {
    render(<CustomChordBuilder />)

    // Bar 1 is selected by default; pick "i"
    const romanButtons = screen.getAllByRole("button", { name: "i" })
    fireEvent.click(romanButtons[0])

    const applyButton = screen.getByRole("button", { name: /Apply Progression/i })
    fireEvent.click(applyButton)

    const chords = useSessionStore.getState().arrangement.chords
    expect(chords[0]).toBe("i")
  })
})

