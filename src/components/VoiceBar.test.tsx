import { beforeEach, describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { VoiceBar } from "@/components/VoiceBar"
import { useSessionStore } from "@/state/useSessionStore"

beforeEach(() => {
  useSessionStore.getState().reset()
})

describe("VoiceBar blocked-key hints", () => {
  it("says to press play when stopped", () => {
    useSessionStore.setState({ playing: false })
    render(<VoiceBar />)
    expect(screen.getByRole("status").textContent).toMatch(/press play/i)
  })

  it("says to seat a voice when nobody can sing", () => {
    useSessionStore.setState({ playing: true })
    const s = useSessionStore.getState()
    s.moveFighter("voice-1", null)
    s.moveFighter("voice-2", null)
    render(<VoiceBar />)
    expect(screen.getByRole("status").textContent).toMatch(/no living attacker/i)
  })

  it("reports the singing loop when keys work", () => {
    useSessionStore.setState({ playing: true })
    render(<VoiceBar />)
    expect(screen.getByRole("status").textContent).toMatch(/loop singing/i)
  })
})
