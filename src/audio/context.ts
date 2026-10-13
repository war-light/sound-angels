// AudioContext lifecycle + master bus. Browser-only (Tone.js).
// The context starts ONLY on explicit user gesture via ensureAudio().
import * as Tone from "tone"

let started = false
let master: Tone.Gain | null = null
let limiter: Tone.Limiter | null = null

export async function ensureAudio(): Promise<void> {
  if (!started) {
    await Tone.start()
    master = new Tone.Gain(0.8)
    limiter = new Tone.Limiter(-2)
    master.chain(limiter, Tone.getDestination())
    started = true
  }
}

export function isAudioReady(): boolean {
  return started
}

/** Master bus for all pooled voices. Throws if audio not started. */
export function getMaster(): Tone.Gain {
  if (!master) throw new Error("Audio not started: call ensureAudio() on user gesture first")
  return master
}

/** 0..1 UI volume -> decibels on the destination. */
export function setVolume(value: number): void {
  const clamped = Math.min(1, Math.max(0, value))
  Tone.getDestination().volume.value = clamped <= 0 ? -Infinity : -30 + clamped * 36
}
