// One-loop audition for cards and the loop sequencer (PREP, STUDIO, combat).
// Browser-only Tone.js. Mutually exclusive: starting a preview silences the
// previous one, and the loop plays through exactly once before clearing.
import * as Tone from "tone"
import {
  locateStep,
  loopLength,
  snapshotStep,
  type Arrangement,
  type StepSnapshot,
} from "@/game/arrangement"
import { midiToNote } from "@/game/theory"
import { ensureAudio } from "./context"
import { getVoices, hasVoices, initVoices, instrumentVoices, type Voices } from "./synths"

/** Auditions sing through the neutral voice — no party is seated in PREP. */
const PREVIEW_VOICE = "strings"

let activeId: string | null = null
let repeatId: number | null = null
let endTimer: number | null = null
/** Bumped on every start/stop so a superseded start can abandon its await. */
let generation = 0

function triggerPreviewAt(time: number, snap: StepSnapshot, stepDur: number, v: Voices): void {
  const drumAt = time + snap.swingDelay * stepDur
  if (snap.kick) v.kick.triggerAttackRelease("C1", "8n", drumAt)
  if (snap.snare) v.snare.triggerAttackRelease("16n", drumAt)
  if (snap.hat) v.hat.triggerAttackRelease("32n", drumAt + 0.001)
  if (snap.bass != null) {
    instrumentVoices(PREVIEW_VOICE).bass.triggerAttackRelease(midiToNote(snap.bass), "8n", time)
  }
  const lead = instrumentVoices(PREVIEW_VOICE).lead
  snap.melodies.forEach((m) => {
    lead.triggerAttackRelease(
      midiToNote(m.midi),
      Math.max(0.06, m.len * stepDur * 0.9),
      time + m.slot * 0.004,
    )
  })
  if (snap.step === 0 && snap.chord.length > 0) {
    instrumentVoices(PREVIEW_VOICE).pad.triggerAttackRelease(snap.chord.map(midiToNote), "1m", time, 0.8)
  }
}

export function getPreviewId(): string | null {
  return activeId
}

/** Silence the running preview (if any) and release the transport. */
export function stopPreview(): void {
  generation += 1
  if (typeof window === "undefined") {
    activeId = null
    return
  }
  if (endTimer != null) {
    window.clearTimeout(endTimer)
    endTimer = null
  }
  const transport = Tone.getTransport()
  if (repeatId != null) {
    transport.clear(repeatId)
    repeatId = null
  }
  if (activeId != null) {
    transport.stop()
    transport.position = 0
  }
  activeId = null
}

/**
 * Play `arr` once from the top. `onEnd` fires when the loop finishes (or is
 * replaced), so the caller can drop its "playing" state. A second call while
 * one is running replaces it — only one preview ever sounds.
 */
export async function startPreview(
  id: string,
  arr: Arrangement,
  onEnd: () => void,
): Promise<void> {
  if (typeof window === "undefined") return
  stopPreview()
  const gen = generation
  await ensureAudio()
  await initVoices()
  if (gen !== generation || !hasVoices()) return

  const total = loopLength(arr)
  if (total <= 0) return

  const v = getVoices()
  const bpm = Math.min(160, Math.max(50, Math.round(arr.bpm)))
  const stepDur = 60 / bpm / 4
  const transport = Tone.getTransport()
  transport.stop()
  transport.position = 0
  transport.bpm.value = bpm

  activeId = id
  let g = 0
  repeatId = transport.scheduleRepeat((time) => {
    if (g >= total) return
    const { bar, step } = locateStep(arr, g)
    triggerPreviewAt(time, snapshotStep(arr, bar, step), stepDur, v)
    g += 1
  }, "16n")
  transport.start()
  endTimer = window.setTimeout(() => {
    stopPreview()
    onEnd()
  }, total * stepDur * 1000 + 250)
}
