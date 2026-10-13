// Live music / combat state lives outside React. Tone.js Transport + scheduling goes here.
import * as Tone from "tone"

let started = false

export async function ensureAudio(): Promise<void> {
  if (!started) {
    await Tone.start()
    started = true
  }
}

export function playPulse(): void {
  const synth = new Tone.MembraneSynth().toDestination()
  synth.triggerAttackRelease("C2", "8n")
}
