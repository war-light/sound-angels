// Prep-screen loop editor cursor. Pure TypeScript, no React/DOM/Tone.
// The cursor walks one attacker lane's cells (bar-major, step-minor) as a
// single linear index, so a note entry always lands on "the next cell" and
// wraps through every lane back to the top of the loop.
import { STEPS_PER_BAR } from "./arrangement"

/** One editable cell: a lane (front-row position), bar, and 16th step. */
export interface SeqCursor {
  lane: number
  bar: number
  step: number
}

export const HOME_SEQ_CURSOR: SeqCursor = { lane: 0, bar: 0, step: 0 }

function perLane(bars: number): number {
  return Math.max(1, bars) * STEPS_PER_BAR
}

/** Linear index of a cursor across the whole lanes x bars x steps grid. */
function toIndex(c: SeqCursor, bars: number): number {
  return (c.lane * Math.max(1, bars) + c.bar) * STEPS_PER_BAR + c.step
}

function fromIndex(index: number, lanes: number, bars: number): SeqCursor {
  const laneLen = perLane(bars)
  const total = Math.max(1, lanes) * laneLen
  const g = ((index % total) + total) % total
  const lane = Math.floor(g / laneLen)
  const rem = g % laneLen
  return { lane, bar: Math.floor(rem / STEPS_PER_BAR), step: rem % STEPS_PER_BAR }
}

/** Move `dir` cells (negative = left), wrapping across lanes and bars. */
export function moveSeqCursor(c: SeqCursor, dir: number, lanes: number, bars: number): SeqCursor {
  return fromIndex(toIndex(c, bars) + dir, lanes, bars)
}

/** Advance one cell after writing a note or skipping with Space. */
export function advanceSeqCursor(c: SeqCursor, lanes: number, bars: number): SeqCursor {
  return moveSeqCursor(c, 1, lanes, bars)
}

/** Clamp a cursor into range (e.g. after the loop or party shrinks). */
export function clampSeqCursor(c: SeqCursor, lanes: number, bars: number): SeqCursor {
  const maxLane = Math.max(0, Math.max(1, lanes) - 1)
  const maxBar = Math.max(0, Math.max(1, bars) - 1)
  return {
    lane: Math.min(Math.max(0, c.lane), maxLane),
    bar: Math.min(Math.max(0, c.bar), maxBar),
    step: Math.min(Math.max(0, c.step), STEPS_PER_BAR - 1),
  }
}

/**
 * A digit key "1".."8" as its scale degree. 8 is the octave of 1, matching
 * the A-natural-minor reference table (A B C D E F G A). Null = not a note key.
 */
export function digitToDegree(key: string): number | null {
  const n = Number(key)
  return Number.isInteger(n) && n >= 1 && n <= 8 ? n : null
}
