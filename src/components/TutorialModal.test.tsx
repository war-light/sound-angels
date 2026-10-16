import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TutorialModal } from "./TutorialModal"

describe("TutorialModal component", () => {
  const onClose = vi.fn()

  it("does not render when closed", () => {
    render(<TutorialModal isOpen={false} onClose={onClose} />)
    expect(screen.queryByText(/Singing on the Beat/i)).toBeNull()
  })

  it("renders first concept step when open", () => {
    render(<TutorialModal isOpen={true} onClose={onClose} />)
    expect(screen.getByText(/Singing on the Beat/i)).toBeInTheDocument()
    expect(screen.getByText(/WASD Audition/i)).toBeInTheDocument()
    expect(screen.getByText(/Guide 1 of 4/i)).toBeInTheDocument()
  })

  it("advances through steps with Next Concept button", () => {
    render(<TutorialModal isOpen={true} onClose={onClose} />)

    const nextBtn = screen.getByRole("button", { name: /Next Concept/i })
    fireEvent.click(nextBtn)

    expect(screen.getByText(/Harmonic Chords & Blessings/i)).toBeInTheDocument()
    expect(screen.getByText(/Guide 2 of 4/i)).toBeInTheDocument()

    // Step 3
    fireEvent.click(screen.getByRole("button", { name: /Next Concept/i }))
    expect(screen.getByText(/ATB Gauges & Parry QTE/i)).toBeInTheDocument()

    // Step 4
    fireEvent.click(screen.getByRole("button", { name: /Next Concept/i }))
    expect(screen.getByText(/Party Roles & Roster/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Enter the Chamber/i })).toBeInTheDocument()
  })

  it("calls onClose when finishing the guide or clicking close", () => {
    render(<TutorialModal isOpen={true} onClose={onClose} />)

    const closeBtn = screen.getByRole("button", { name: "✕" })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })
})

