import { describe, expect, it } from "vitest"
import {
  cursorDegree,
  HOME_CURSOR,
  moveCursor,
  pressToLen,
  stepMs,
} from "./perform"

describe("moveCursor", () => {
  it("walks degrees with W/S", () => {
    expect(moveCursor(HOME_CURSOR, "w")).toEqual({ degree: 2, octave: 0 })
    expect(moveCursor({ degree: 3, octave: 0 }, "s")).toEqual({ degree: 2, octave: 0 })
  })

  it("rolls over the octave at the edges", () => {
    expect(moveCursor({ degree: 7, octave: 0 }, "w")).toEqual({ degree: 1, octave: 1 })
    expect(moveCursor({ degree: 1, octave: 0 }, "s")).toEqual({ degree: 7, octave: -1 })
  })

  it("clamps at the outer limits", () => {
    expect(moveCursor({ degree: 7, octave: 1 }, "w")).toEqual({ degree: 7, octave: 1 })
    expect(moveCursor({ degree: 1, octave: -1 }, "s")).toEqual({ degree: 1, octave: -1 })
    expect(moveCursor(HOME_CURSOR, "a")).toEqual({ degree: 1, octave: -1 })
    expect(moveCursor(HOME_CURSOR, "d")).toEqual({ degree: 1, octave: 1 })
  })
})

describe("cursorDegree", () => {
  it("maps across octaves for degreeToMidi", () => {
    expect(cursorDegree(HOME_CURSOR)).toBe(1)
    expect(cursorDegree({ degree: 1, octave: 1 })).toBe(8)
    expect(cursorDegree({ degree: 7, octave: -1 })).toBe(0)
  })
})

describe("pressToLen", () => {
  it("buckets holds into 1/2/4/8 steps", () => {
    expect(pressToLen(50, 100)).toBe(1)
    expect(pressToLen(190, 100)).toBe(2)
    expect(pressToLen(430, 100)).toBe(4)
    expect(pressToLen(2000, 100)).toBe(8)
  })
})

describe("stepMs", () => {
  it("is a 16th at 90bpm and clamps tempo", () => {
    expect(stepMs(90)).toBeCloseTo(166.67, 1)
    expect(stepMs(5)).toBe(stepMs(50))
  })
})
