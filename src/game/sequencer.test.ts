import { describe, expect, it } from "vitest"
import {
  advanceSeqCursor,
  clampSeqCursor,
  digitToDegree,
  HOME_SEQ_CURSOR,
  moveSeqCursor,
  type SeqCursor,
} from "./sequencer"

describe("moveSeqCursor", () => {
  it("steps right and left within a bar", () => {
    expect(moveSeqCursor(HOME_SEQ_CURSOR, 1, 3, 4)).toEqual({ lane: 0, bar: 0, step: 1 })
    expect(moveSeqCursor({ lane: 0, bar: 0, step: 5 }, -1, 3, 4)).toEqual({ lane: 0, bar: 0, step: 4 })
  })

  it("wraps from the last step into the next bar", () => {
    expect(moveSeqCursor({ lane: 0, bar: 0, step: 15 }, 1, 3, 4)).toEqual({ lane: 0, bar: 1, step: 0 })
  })

  it("wraps across lanes and back to the top of the loop", () => {
    // Last cell of lane 0 -> first cell of lane 1.
    expect(moveSeqCursor({ lane: 0, bar: 3, step: 15 }, 1, 3, 4)).toEqual({ lane: 1, bar: 0, step: 0 })
    // Last cell of the final lane -> back to the very first cell.
    expect(moveSeqCursor({ lane: 2, bar: 3, step: 15 }, 1, 3, 4)).toEqual(HOME_SEQ_CURSOR)
    // Left off the top wraps to the end.
    expect(moveSeqCursor(HOME_SEQ_CURSOR, -1, 3, 4)).toEqual({ lane: 2, bar: 3, step: 15 })
  })
})

describe("advanceSeqCursor", () => {
  it("is a one-cell step right, wrapping lanes", () => {
    expect(advanceSeqCursor(HOME_SEQ_CURSOR, 3, 4)).toEqual({ lane: 0, bar: 0, step: 1 })
    expect(advanceSeqCursor({ lane: 1, bar: 3, step: 15 }, 3, 4)).toEqual({ lane: 2, bar: 0, step: 0 })
  })
})

describe("clampSeqCursor", () => {
  it("pulls an out-of-range cursor back into the grid", () => {
    const wild: SeqCursor = { lane: 9, bar: 9, step: 40 }
    expect(clampSeqCursor(wild, 2, 4)).toEqual({ lane: 1, bar: 3, step: 15 })
    expect(clampSeqCursor({ lane: -1, bar: -1, step: -1 }, 2, 4)).toEqual({ lane: 0, bar: 0, step: 0 })
  })
})

describe("digitToDegree", () => {
  it("maps 1..8 to degrees and rejects everything else", () => {
    expect(digitToDegree("1")).toBe(1)
    expect(digitToDegree("8")).toBe(8)
    expect(digitToDegree("9")).toBe(null)
    expect(digitToDegree("0")).toBe(null)
    expect(digitToDegree("w")).toBe(null)
    expect(digitToDegree("")).toBe(null)
  })
})
