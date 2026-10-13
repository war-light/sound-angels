// WASD relative-motion performance model. Pure TypeScript.
// W/S walk scale degrees, A/D shift octave. Always in-key by construction:
// the cursor is a degree, resolved through the fight key at record time.
export type PerformKey = "w" | "a" | "s" | "d"

export interface PerformCursor {
  /** Scale degree 1..7 within the current octave. */
  degree: number
  /** Octave offset from the arrangement reference (-1..+1). */
  octave: number
}

export const HOME_CURSOR: PerformCursor = { degree: 1, octave: 0 }
export const MIN_DEGREE = 1
export const MAX_DEGREE = 7
export const MIN_OCTAVE = -1
export const MAX_OCTAVE = 1

/** One key press moves the cursor (clamped). */
export function moveCursor(c: PerformCursor, key: PerformKey): PerformCursor {
  switch (key) {
    case "w":
      if (c.degree < MAX_DEGREE) return { ...c, degree: c.degree + 1 }
      if (c.octave < MAX_OCTAVE) return { degree: MIN_DEGREE, octave: c.octave + 1 }
      return c
    case "s":
      if (c.degree > MIN_DEGREE) return { ...c, degree: c.degree - 1 }
      if (c.octave > MIN_OCTAVE) return { degree: MAX_DEGREE, octave: c.octave - 1 }
      return c
    case "d":
      return { ...c, octave: Math.min(MAX_OCTAVE, c.octave + 1) }
    case "a":
      return { ...c, octave: Math.max(MIN_OCTAVE, c.octave - 1) }
  }
}

/** Cursor -> absolute scale degree across octaves (1-based, for degreeToMidi). */
export function cursorDegree(c: PerformCursor): number {
  return c.degree + c.octave * 7
}

/** Press duration (ms) + step length (ms) -> held note length in steps (1/2/4/8). */
export function pressToLen(pressMs: number, stepMs: number): number {
  const steps = Math.max(1, Math.round(pressMs / Math.max(1, stepMs)))
  if (steps >= 8) return 8
  if (steps >= 4) return 4
  if (steps >= 2) return 2
  return 1
}

/** Quantize a keypress timestamp to the nearest loop step index. */
export function quantizeStep(elapsedMs: number, stepMs: number, loopSteps: number): number {
  if (loopSteps <= 0) throw new Error(`Bad loop length: ${loopSteps}`)
  const q = Math.round(elapsedMs / Math.max(1, stepMs)) % loopSteps
  return (q + loopSteps) % loopSteps
}

/** 16th-step length in ms at a tempo. */
export function stepMs(bpm: number): number {
  return 60000 / Math.min(160, Math.max(50, bpm)) / 4
}
