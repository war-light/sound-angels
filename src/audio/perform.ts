// Live WASD audition through the pooled lead voice. No-ops until the
// transport has started (voices pooled). Recording into the loop is handled
// by the session store; this module only makes sound.
import { midiToNote } from "@/game/theory"
import { getVoices, hasVoices } from "./synths"

export function auditionStart(midi: number): void {
  if (!hasVoices()) return
  getVoices().lead.triggerAttack(midiToNote(midi))
}

export function auditionEnd(): void {
  if (!hasVoices()) return
  try {
    getVoices().lead.triggerRelease()
  } catch {
    // Already released (overlapping key-ups); safe to ignore.
  }
}
