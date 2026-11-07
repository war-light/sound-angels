// Live WASD audition through the active performer's own lead voice. No-ops
// until the transport has started (voices pooled). Recording into the loop
// is handled by the session store; this module only makes sound.
import { midiToNote } from "@/game/theory"
import { getVoices, hasVoices, initVoices, instrumentVoices } from "./synths"

export function auditionStart(midi: number, instrument?: string | null): void {
  if (!hasVoices()) return
  instrumentVoices(instrument ?? null).lead.triggerAttack(midiToNote(midi))
}

/** Short non-destructive blip (QTE hits): never cuts held audition notes. */
export function auditionBlip(midi: number, instrument?: string | null, duration = "16n"): void {
  if (typeof window === "undefined" || !hasVoices()) return
  try {
    instrumentVoices(instrument ?? null).lead.triggerAttackRelease(midiToNote(midi), duration)
  } catch {
    // Safe no-op before audio activation or in headless tests.
  }
}

export function auditionEnd(): void {
  if (!hasVoices()) return
  // Release every lead: the performer may have switched mid-hold.
  for (const id of Object.keys(getVoices().instruments)) {
    try {
      instrumentVoices(id).lead.releaseAll()
    } catch {
      // Already released (overlapping key-ups); safe to ignore.
    }
  }
}

/**
 * Sound one sequencer note on the lane's instrument. The first key press is
 * itself a user gesture, so this may lazily start the audio graph; it no-ops
 * silently before activation and in headless tests (jsdom).
 */
export function auditionNote(midi: number, instrument?: string | null): void {
  if (typeof window === "undefined") return
  initVoices()
    .then(() => auditionBlip(midi, instrument))
    .catch(() => {
      // Audio unavailable: stay silent rather than break note entry.
    })
}
