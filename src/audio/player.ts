// Tone.Transport bridge: schedules 16th steps from engine arrangement snapshots.
// Reads engine data, never writes combat state. Combat ticks flow out via onStep.
import * as Tone from "tone"
import {
  locateStep,
  snapshotStep,
  type Arrangement,
  type StepSnapshot,
} from "@/game/arrangement"
import { midiToNote } from "@/game/theory"
import { ensureAudio } from "./context"
import { getVoices, initVoices } from "./synths"

export type StepHandler = (global: number, snap: StepSnapshot) => void

let provider: () => Arrangement | null = () => null
let chordVoice: () => string | null = () => null
let handler: StepHandler | null = null
let playing = false
let stepCounter = 0
let repeatId: number | null = null

export function setArrangementProvider(p: () => Arrangement | null): void {
  provider = p
}

/** Who voices the bar-start chord stabs (chord-slot member's instrument). */
export function setChordVoiceProvider(p: () => string | null): void {
  chordVoice = p
}

export function setStepHandler(h: StepHandler | null): void {
  handler = h
}

export function isPlaying(): boolean {
  return playing
}

export function currentStep(): number {
  return stepCounter
}

export function setBpm(bpm: number): void {
  Tone.getTransport().bpm.value = Math.min(160, Math.max(50, Math.round(bpm)))
}

function triggerAt(time: number, snap: StepSnapshot, bpm: number): void {
  const v = getVoices()
  const stepDur = 60 / Math.max(50, bpm) / 4 // seconds per 16th
  if (snap.kick) v.kick.triggerAttackRelease("C1", "8n", time)
  if (snap.snare) v.snare.triggerAttackRelease("16n", time)
  if (snap.hat) v.hat.triggerAttackRelease("32n", time + 0.001)
  if (snap.bass != null) {
    v.bass.triggerAttackRelease(midiToNote(snap.bass), "8n", time)
  }
  // One pooled lead voice per melody slot, staggered by milliseconds so
  // stacked onsets stay distinct. Long notes hold for len steps.
  snap.melodies.forEach((m, i) => {
    const at = time + i * 0.004
    v.lead.triggerAttackRelease(midiToNote(m.midi), Math.max(0.06, m.len * stepDur * 0.9), at)
  })
  if (snap.step === 0 && snap.chord.length > 0) {
    // Back-row voicing: the chord-keeper's instrument shifts the stab register.
    const shift = chordVoice() === "piano" ? 12 : chordVoice() === "brass" ? -12 : 0
    v.chords.triggerAttackRelease(snap.chord.map((m) => midiToNote(m + shift)), "1m", time, 0.8)
  }
}

export async function start(): Promise<void> {
  if (playing) return
  await ensureAudio()
  await initVoices()
  const arr = provider()
  if (arr) setBpm(arr.bpm)
  const transport = Tone.getTransport()
  transport.swing = 0
  if (repeatId == null) {
    repeatId = transport.scheduleRepeat((time) => {
      const arrNow = provider()
      if (!arrNow) return
      const g = stepCounter
      const { bar, step } = locateStep(arrNow, g)
      const snap = snapshotStep(arrNow, bar, step)
      // Audio events fire inside the callback for sample-accurate timing;
      // UI/combat updates go through Draw so they stay on the animation frame.
      triggerAt(time, snap, arrNow.bpm)
      const h = handler
      Tone.getDraw().schedule(() => h?.(g, snap), time)
      stepCounter += 1
    }, "16n")
  }
  transport.start()
  playing = true
}

export function stop(): void {
  if (!playing) return
  Tone.getTransport().stop()
  playing = false
}

/** Reset the loop position to the top (keeps voices pooled). */
export function rewind(): void {
  stepCounter = 0
}
