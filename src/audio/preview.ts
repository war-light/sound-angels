// One-loop audition for cards and the loop sequencer (PREP, STUDIO, combat).
// Browser-only Tone.js. Mutually exclusive: starting a preview silences the
// previous one, and the loop plays through exactly once before clearing.
import * as Tone from "tone"
import {
  locateStep,
  loopLength,
  snapshotStep,
  type Arrangement,
  type DrumHitSnapshot,
  type StepSnapshot,
} from "@/game/arrangement"
import { midiToNote } from "@/game/theory"
import { getKit } from "@/data/kits"
import type { DrumVoice } from "@/game/groove"
import { ensureAudio } from "./context"
import { applyDrumKit, hasVoices, initVoices, instrumentVoices, triggerDrums } from "./synths"

/** Auditions sing through the neutral voice — no party is seated in PREP. */
const PREVIEW_VOICE = "strings"

/**
 * What an audition sounds. A card plays only the layers it owns: a rig is its
 * drums (pattern + kit), a melody card is its singers and chords. "all" is the
 * whole loop, for the sequencer's own preview.
 */
export type PreviewLayers = "all" | "drums" | "melody"

let activeId: string | null = null
let repeatId: number | null = null
let endTimer: number | null = null
/** Bumped on every start/stop so a superseded start can abandon its await. */
let generation = 0

function silentDrums(): Record<DrumVoice, DrumHitSnapshot> {
  const rest: DrumHitSnapshot = { vel: 0, roll: 0 }
  return { kick: rest, snare: rest, hat: rest, perc: rest }
}

/**
 * Reduce one step to the layers an audition owns. A rig is drums only (its kit
 * and pattern — no singers, no chord pad stab), a melody card is its voices and
 * chords over a resting kit, and the sequencer's own preview is the whole loop.
 */
export function auditionStep(snap: StepSnapshot, layers: PreviewLayers): StepSnapshot {
  if (layers === "all") return snap
  if (layers === "drums") return { ...snap, melodies: [], bass: null, chord: [] }
  return {
    ...snap,
    drums: silentDrums(),
    kick: false,
    snare: false,
    hat: false,
    perc: false,
  }
}

function triggerPreviewAt(time: number, snap: StepSnapshot, stepDur: number): void {
  const kit = getKit(snap.kitId)
  applyDrumKit(kit?.timbre ?? null)
  const drumAt = time + snap.swingDelay * stepDur
  triggerDrums(snap.drums, drumAt, stepDur, kit?.timbre ?? null)
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
  layers: PreviewLayers = "all",
): Promise<void> {
  if (typeof window === "undefined") return
  stopPreview()
  const gen = generation
  await ensureAudio()
  await initVoices()
  if (gen !== generation || !hasVoices()) return

  const total = loopLength(arr)
  if (total <= 0) return

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
    triggerPreviewAt(time, auditionStep(snapshotStep(arr, bar, step), layers), stepDur)
    g += 1
  }, "16n")
  transport.start()
  endTimer = window.setTimeout(() => {
    stopPreview()
    onEnd()
  }, total * stepDur * 1000 + 250)
}
