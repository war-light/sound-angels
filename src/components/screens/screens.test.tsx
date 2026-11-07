import { beforeEach, describe, expect, it } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { useSessionStore } from "@/state/useSessionStore"
import App from "@/App"
import { MenuScreen } from "./MenuScreen"
import { PrepScreen } from "./PrepScreen"
import { CombatScreen } from "./CombatScreen"
import { ResultOverlay } from "./ResultOverlay"

describe("Screen flow and UI state machine", () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
    useSessionStore.getState().toMenu()
  })

  describe("MenuScreen", () => {
    it("renders title text and start actions", () => {
      render(<MenuScreen />)
      expect(screen.getByText(/A dark room/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Preview/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /^Start$/i })).toBeInTheDocument()
    })

    it("transitions to prep when Start is clicked", () => {
      render(<MenuScreen />)
      fireEvent.click(screen.getByRole("button", { name: /^Start$/i }))
      expect(useSessionStore.getState().gamePhase).toBe("prep")
    })
  })

  describe("PrepScreen", () => {
    it("renders preparation tools and engage combat button", () => {
      render(<PrepScreen />)
      expect(screen.getByText(/Battle Preparation/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Engage Combat/i })).toBeInTheDocument()
      expect(screen.getByText(/Harmonic Progression/i)).toBeInTheDocument()
      expect(screen.getByText(/Battle Loop Sequencer/i)).toBeInTheDocument()
    })

    it("allows navigating back to title", () => {
      useSessionStore.getState().toPrep()
      render(<PrepScreen />)
      fireEvent.click(screen.getByRole("button", { name: /← Title/i }))
      expect(useSessionStore.getState().gamePhase).toBe("menu")
    })
  })

  describe("CombatScreen", () => {
    it("renders combat arena and halt button", () => {
      render(<CombatScreen />)
      expect(screen.getByText(/Key:/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Halt \/ Retreat/i })).toBeInTheDocument()
    })

    it("offers mid-fight modulation in classic mode", () => {
      useSessionStore.setState({ combatMode: "classic" })
      render(<CombatScreen />)
      fireEvent.click(screen.getByRole("button", { name: /Modulate/i }))
      expect(screen.getByText(/Modulate the harmony/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Pop Axis/i })).toBeInTheDocument()
    })
  })

  describe("Stage combat", () => {
    beforeEach(() => {
      useSessionStore.setState({ combatMode: "stage" })
    })

    it("renders the sound board and the hichord", () => {
      render(<CombatScreen />)
      expect(screen.getByRole("region", { name: /Sound board/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Hero's Call/i })).toBeInTheDocument()
      expect(screen.getAllByRole("button", { name: /^Chord / })).toHaveLength(7)
    })

    it("queues a tapped clip for the next loop", () => {
      render(<CombatScreen />)
      fireEvent.click(screen.getByRole("button", { name: /Sub Pressure/i }))
      expect(useSessionStore.getState().stage.queued.bass).toBe("bass:sub")
      expect(screen.getByText(/joins next loop/i)).toBeInTheDocument()
    })

    it("modifiers relabel the chords", () => {
      render(<CombatScreen />)
      fireEvent.click(screen.getByRole("button", { name: /7th/ }))
      expect(useSessionStore.getState().chordMod).toBe("seventh")
      expect(screen.getByRole("button", { name: /^Chord V7$/ })).toBeInTheDocument()
    })
  })

  describe("ResultOverlay", () => {
    it("renders victory details and next encounter button", () => {
      render(<ResultOverlay phase="victory" />)
      expect(screen.getByText(/The Discord is Quieted/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Next Encounter/i })).toBeInTheDocument()
    })

    it("renders defeat details and try again button", () => {
      render(<ResultOverlay phase="defeat" />)
      expect(screen.getByText(/The Hum Fades/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument()
    })

    it("halts the transport when Next Encounter leaves for prep", () => {
      useSessionStore.setState({ playing: true, gamePhase: "victory" })
      render(<ResultOverlay phase="victory" />)

      fireEvent.click(screen.getByRole("button", { name: /Next Encounter/i }))

      expect(useSessionStore.getState().playing).toBe(false)
      expect(useSessionStore.getState().gamePhase).toBe("prep")
    })

    it("halts the transport when returning to preparation", () => {
      useSessionStore.setState({ playing: true, gamePhase: "victory" })
      render(<ResultOverlay phase="victory" />)

      fireEvent.click(screen.getByRole("button", { name: /Return to Preparation/i }))

      expect(useSessionStore.getState().playing).toBe(false)
      expect(useSessionStore.getState().gamePhase).toBe("prep")
    })
  })

  describe("App screen router integration", () => {
    it("renders MenuScreen initially when phase is menu", () => {
      useSessionStore.getState().toMenu()
      render(<App />)
      expect(screen.getByText(/A dark room/i)).toBeInTheDocument()
    })

    it("switches to PrepScreen when phase changes to prep", () => {
      useSessionStore.getState().toPrep()
      render(<App />)
      expect(screen.getByText(/Battle Preparation/i)).toBeInTheDocument()
    })

    it("switches to CombatScreen when phase is combat", () => {
      useSessionStore.setState({ gamePhase: "combat" })
      render(<App />)
      expect(screen.getByRole("button", { name: /Halt \/ Retreat/i })).toBeInTheDocument()
    })

    it("displays ResultOverlay on victory", () => {
      useSessionStore.setState({ gamePhase: "victory" })
      render(<App />)
      expect(screen.getByText(/The Discord is Quieted/i)).toBeInTheDocument()
    })
  })
})

