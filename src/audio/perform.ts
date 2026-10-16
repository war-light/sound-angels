// Live WASD audition through the active performer's own lead voice. No-ops
// until the transport has started (voices pooled). Recording into the loop
// is handled by the session store; this module only makes sound.
import { midiToNote } from "@/game/theory"
import { getVoices, hasVoices, instrumentVoices } from "./synths"

export function auditionStart(midi: number, instrument?: string | null): void {
  if (!hasVoices()) return
  instrumentVoices(instrument ?? null).lead.triggerAttack(midiToNote(midi))
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
