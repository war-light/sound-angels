import { beforeEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { PresetBar } from "@/components/PresetBar"
import { useSessionStore } from "@/state/useSessionStore"

beforeEach(() => {
  useSessionStore.getState().reset()
})

describe("PresetBar input hygiene", () => {
  it("Enter bottles the loop and hands WASD back (blurs)", () => {
    render(<PresetBar />)
    const input = screen.getByLabelText("preset name") as HTMLInputElement
    fireEvent.change(input, { target: { value: "opener" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(screen.getByText(/opener/)).toBeTruthy()
    expect(input.value).toBe("")
    expect(document.activeElement).not.toBe(input)
  })

  it("Escape discards the name and blurs", () => {
    render(<PresetBar />)
    const input = screen.getByLabelText("preset name") as HTMLInputElement
    input.focus()
    fireEvent.change(input, { target: { value: "scratch" } })
    fireEvent.keyDown(input, { key: "Escape" })
    expect(input.value).toBe("")
    expect(document.activeElement).not.toBe(input)
    expect(screen.queryByText(/scratch/)).toBeNull()
  })
})
