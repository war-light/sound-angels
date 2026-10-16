import { beforeEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { MelodyCardBar } from "@/components/MelodyCardBar"
import { useSessionStore } from "@/state/useSessionStore"

beforeEach(() => {
  useSessionStore.getState().reset()
})

describe("MelodyCardBar save flow", () => {
  it("Enter saves the live loop as a new card", () => {
    render(<MelodyCardBar />)
    fireEvent.click(screen.getByText("+ Save Current Loop"))
    const input = screen.getByLabelText("card name") as HTMLInputElement
    fireEvent.change(input, { target: { value: "opener" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(screen.getByText("opener")).toBeTruthy()
    expect(useSessionStore.getState().melodyCards.some((c) => c.name === "opener")).toBe(true)
  })

  it("Escape discards the pending card name", () => {
    render(<MelodyCardBar />)
    fireEvent.click(screen.getByText("+ Save Current Loop"))
    const input = screen.getByLabelText("card name") as HTMLInputElement
    fireEvent.change(input, { target: { value: "scratch" } })
    fireEvent.keyDown(input, { key: "Escape" })
    expect(screen.queryByText("scratch")).toBeNull()
    expect(useSessionStore.getState().melodyCards.some((c) => c.name === "scratch")).toBe(false)
  })
})
