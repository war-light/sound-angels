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
      expect(screen.getByText(/A faint hum/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Listen to the Hum/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Step into the Chamber/i })).toBeInTheDocument()
    })

    it("transitions to prep when Step into the Chamber is clicked", () => {
      render(<MenuScreen />)
      fireEvent.click(screen.getByRole("button", { name: /Step into the Chamber/i }))
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

