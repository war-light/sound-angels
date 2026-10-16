import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { RosterSelectModal } from "./RosterSelectModal"
import { useSessionStore } from "@/state/useSessionStore"

describe("RosterSelectModal component", () => {
  const onClose = vi.fn()

  beforeEach(() => {
    useSessionStore.getState().reset()
    onClose.mockClear()
  })

  it("does not render when closed", () => {
    render(<RosterSelectModal isOpen={false} onClose={onClose} />)
    expect(screen.queryByText(/Assemble Your Voices/i)).toBeNull()
  })

  it("renders when open and shows characters from roster", () => {
    render(<RosterSelectModal isOpen={true} onClose={onClose} />)
    expect(screen.getByText(/Assemble Your Voices/i)).toBeInTheDocument()

    // Named characters
    expect(screen.getAllByText("Lyra").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Aria").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Ignis").length).toBeGreaterThan(0)
    expect(screen.getByText("Cael")).toBeInTheDocument()
    expect(screen.getByText("Bram")).toBeInTheDocument()
    expect(screen.getByText("Vesper")).toBeInTheDocument()
  })

  it("filters roster by instrument", () => {
    render(<RosterSelectModal isOpen={true} onClose={onClose} />)

    const pianoFilter = screen.getByRole("button", { name: /^piano$/i })
    fireEvent.click(pianoFilter)

    expect(screen.getAllByText("Aria").length).toBeGreaterThan(0)
    expect(screen.getByText("Bram")).toBeInTheDocument()
    expect(screen.queryByText("Cael")).toBeNull()
  })

  it("confirms formation and updates selected party", () => {
    render(<RosterSelectModal isOpen={true} onClose={onClose} />)

    // Click Cael's title to assign Cael into the active slot
    fireEvent.click(screen.getByText("The Resonant Anchor"))

    const confirmBtn = screen.getByRole("button", { name: /Confirm Formation/i })
    fireEvent.click(confirmBtn)

    expect(onClose).toHaveBeenCalled()
    expect(useSessionStore.getState().selectedPartyIds).toContain("cael")
  })
})

