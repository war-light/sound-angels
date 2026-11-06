// Bridge: converts MarkovMelodyGenerator output into an Arrangement track grid
// so the existing audio/preview pipeline can play it without any new audio code.
// Pure game model — no Tone.js, no React, no DOM.
import { ATTACK_SLOTS, STEPS_PER_BAR, type Arrangement, type NoteEvent } from "./arrangement"
import { MarkovMelodyGenerator, type MelodyNote, type MelodyStyle } from "./melodyGenerator"

/**
 * Build a fresh track grid (all slots × bars × steps) populated from a flat
 * list of MelodyNote onsets.  Notes beyond the arrangement's bar count are
 * silently dropped; notes that share a step land on consecutive slots (overflow
 * is dropped).
 */
function notesToTracks(
  notes: MelodyNote[],
  bars: number,
  stepsPerBar: number,
): (NoteEvent | null)[][][] {
  // [slot][bar][step] — null everywhere to start
  const tracks: (NoteEvent | null)[][][] = Array.from({ length: ATTACK_SLOTS }, () =>
    Array.from({ length: bars }, () => Array<NoteEvent | null>(stepsPerBar).fill(null)),
  )

  for (const n of notes) {
    if (n.bar >= bars || n.step >= stepsPerBar) continue
    // Find the first slot that hasn't already placed a note at this cell.
    for (let slot = 0; slot < ATTACK_SLOTS; slot++) {
      if (tracks[slot][n.bar][n.step] === null) {
        tracks[slot][n.bar][n.step] = { degree: n.degree, len: n.len }
        break
      }
    }
  }

  return tracks
}

/**
 * Run the Markov melody generator over the arrangement's current key and chord
 * progression and return a new Arrangement with the generated notes on slot 0.
 * The rest of the arrangement (groove, BPM, bass, key) is preserved verbatim
 * so the preview sounds exactly like the live loop minus the old melody.
 */
export function arrangementWithGeneratedMelody(
  arr: Arrangement,
  style: MelodyStyle = "pop-balanced",
): Arrangement {
  const bars = arr.bars
  const steps = arr.stepsPerBar ?? STEPS_PER_BAR

  const gen = new MarkovMelodyGenerator(style)
  const notes: MelodyNote[] = gen.generate(arr.chords, arr.key)

  const tracks = notesToTracks(notes, bars, steps)

  return { ...arr, tracks }
}
