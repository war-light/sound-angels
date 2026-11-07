import { beforeEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { PartyCorner } from "@/components/PartyCorner"
import { useSessionStore } from "@/state/useSessionStore"

function mockDrop(labelText: string, fighterId: string): void {
  const label = screen.getByText(labelText, { exact: true })
  const zone = label.parentElement!
  fireEvent.drop(zone, {
    dataTransfer: {
      getData: () => fighterId,
      setData: () => {},
      effectAllowed: "move",
      dropEffect: "move",
    },
  } as unknown as DataTransfer)
}

beforeEach(() => {
  useSessionStore.getState().reset()
})

describe("PartyCorner drag and drop", () => {
  it("drags a chord keeper to the front row", () => {
    render(<PartyCorner />)
    mockDrop("attackers", "voice-0")
    const fight = useSessionStore.getState().fight
    expect(fight.slots.front).toContain("voice-0")
    expect(fight.slots.chord).toBeNull()
  })

  it("benches a card by dragging it to the deck", () => {
    render(<PartyCorner />)
    mockDrop("deck", "voice-1")
    const fight = useSessionStore.getState().fight
    expect(fight.slots.front).not.toContain("voice-1")
  })

  it("ignores drops with unknown fighter ids", () => {
    render(<PartyCorner />)
    const before = useSessionStore.getState().fight.slots
    mockDrop("attackers", "ghost")
    expect(useSessionStore.getState().fight.slots).toEqual(before)
  })

  it("always shows three fixed front seats, empty or filled", () => {
    render(<PartyCorner />)
    // Default front holds two attackers: exactly one fixed seat stays empty.
    expect(screen.getAllByText("attackers")).toHaveLength(1)
    mockDrop("attackers", "voice-0")
    expect(screen.queryByText("attackers")).toBeNull()
  })
})
