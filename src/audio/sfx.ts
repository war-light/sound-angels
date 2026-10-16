// Atmospheric sound design and sound effects using Tone.js pooled synths.
// Browser-only; guarded against uninitialized audio or headless test environments.
import * as Tone from "tone"
import { getVoices, hasVoices } from "./synths"

/** Safe wrapper that checks if Web Audio is active before triggering sound. */
function safeTrigger(fn: () => void): void {
  try {
    if (typeof window === "undefined" || !hasVoices()) return
    fn()
  } catch {
    // Graceful no-op in test environments or before audio activation
  }
}

/** Triumphant ascending arpeggio on loop quiet or victory. */
export function playVictoryJingle(): void {
  safeTrigger(() => {
    const v = getVoices()
    const now = Tone.now()
    const lead = v.instruments.piano.lead
    // Uplifting major arpeggio
    const notes = ["C5", "E5", "G5", "C6", "E6"]
    notes.forEach((note, i) => {
      lead.triggerAttackRelease(note, "16n", now + i * 0.09, 0.7)
    })
  })
}

/** Descending minor cadence when party is silenced. */
export function playDefeatSting(): void {
  safeTrigger(() => {
    const v = getVoices()
    const now = Tone.now()
    const pad = v.instruments.strings.pad
    pad.triggerAttackRelease(["C3", "Eb3", "Ab3"], "2n", now, 0.6)
    v.kick.triggerAttackRelease("C1", "4n", now, 0.7)
  })
}

/** Crisp percussive or chime feedback on QTE hit. */
export function playQteHit(rating: "perfect" | "good" = "good"): void {
  safeTrigger(() => {
    const v = getVoices()
    const now = Tone.now()
    if (rating === "perfect") {
      v.instruments.piano.lead.triggerAttackRelease("E6", "32n", now, 0.8)
      v.instruments.strings.lead.triggerAttackRelease("B5", "32n", now + 0.03, 0.6)
    } else {
      v.instruments.piano.lead.triggerAttackRelease("C6", "32n", now, 0.6)
    }
  })
}

/** Low muted thud on QTE miss or parry fumble. */
export function playQteMiss(): void {
  safeTrigger(() => {
    const v = getVoices()
    const now = Tone.now()
    v.snare.triggerAttackRelease("32n", now, 0.4)
  })
}

/** Shimmering strum when new harmonic chord takes effect. */
export function playChordChange(): void {
  safeTrigger(() => {
    const v = getVoices()
    const now = Tone.now()
    const pad = v.instruments.strings.pad
    pad.triggerAttackRelease(["C4", "G4", "C5"], "8n", now, 0.4)
  })
}

/** Soft tactile click for UI buttons. */
export function playUiClick(): void {
  safeTrigger(() => {
    const v = getVoices()
    const now = Tone.now()
    v.hat.triggerAttackRelease("64n", now, 0.25)
  })
}

