import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { CardPreviewButton } from "@/components/CardPreviewButton"
import { GroovePicker } from "@/components/GroovePicker"
import { MelodyCardBar } from "@/components/MelodyCardBar"
import { useSessionStore } from "@/state/useSessionStore"
import { getArrangement } from "@/game/session"

const previewSpy = vi.fn()
/** The layers arg each audition was handed, keyed by preview id. */
const layersOf = (call: number) => previewSpy.mock.calls[call]?.[2] as string | undefined

beforeEach(() => {
  useSessionStore.getState().reset()
  previewSpy.mockClear()
  useSessionStore.setState({ togglePreview: previewSpy })
})

describe("preview layering", () => {
  it("scopes a ready-made rig audition to that rig's drums", () => {
    render(<GroovePicker />)
    fireEvent.click(screen.getAllByRole("button", { name: /preview loop/i })[0])
    expect(previewSpy).toHaveBeenCalledTimes(1)
    expect(layersOf(0)).toBe("drums")
  })

  it("scopes a melody card audition to its voices and chords", () => {
    render(<MelodyCardBar />)
    fireEvent.click(screen.getAllByRole("button", { name: /preview loop/i })[0])
    expect(layersOf(0)).toBe("melody")
  })

  it("still auditions the whole loop for the sequencer", () => {
    render(<CardPreviewButton id="sequencer" arrangement={getArrangement()} layers="all" />)
    fireEvent.click(screen.getByRole("button", { name: /preview loop/i }))
    expect(layersOf(0)).toBe("all")
  })
})
