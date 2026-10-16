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
import { INSTRUMENTS } from "@/data/enemies"
import { ensureAudio } from "./context"
import { applyKit, getVoices, initVoices, instrumentVoices } from "./synths"

export type StepHandler = (global: number, snap: StepSnapshot) => void

let provider: () => Arrangement | null = () => null
let chordVoice: () => string | null = () => null
/** Instrument sounding a melody lane, or null when the lane is muted. */
let melodyVoice: (slot: number) => string | null = () => "strings"
/** Instrument holding the beat seat, or null when it is empty. */
let beatVoice: () => string | null = () => null
let handler: StepHandler | null = null
let playing = false
let stepCounter = 0
let repeatId: number | null = null

/** Single wiring site: the session store calls this once at module load. */
export function configurePlayer(cfg: {
  arrangement: () => Arrangement | null
  chordVoice: () => string | null
  melodyVoice: (slot: number) => string | null
  beatVoice: () => string | null
  onStep: StepHandler | null
}): void {
  provider = cfg.arrangement
  chordVoice = cfg.chordVoice
  melodyVoice = cfg.melodyVoice
  beatVoice = cfg.beatVoice
  handler = cfg.onStep
}

export function setBpm(bpm: number): void {
  Tone.getTransport().bpm.value = Math.min(160, Math.max(50, Math.round(bpm)))
}

function triggerAt(time: number, snap: StepSnapshot, bpm: number): void {
  const v = getVoices()
  const stepDur = 60 / Math.max(50, bpm) / 4 // seconds per 16th
  // Beat source: the keeper's instrument colors drums + bass, if seated.
  const beat = beatVoice()
  applyKit(beat && INSTRUMENTS[beat] ? INSTRUMENTS[beat].timbre.kit : null)
  const bassVoice = instrumentVoices(beat).bass
  if (snap.kick) v.kick.triggerAttackRelease("C1", "8n", time)
  if (snap.snare) v.snare.triggerAttackRelease("16n", time)
  if (snap.hat) v.hat.triggerAttackRelease("32n", time + 0.001)
  if (snap.bass != null) {
    bassVoice.triggerAttackRelease(midiToNote(snap.bass), "8n", time)
  }
  // Melody lanes: each onset through its attacker's own lead voice.
  // Unbound lanes (no placed attacker) are muted: their notes rest unplayed.
  snap.melodies.forEach((m, i) => {
    const inst = melodyVoice(m.slot)
    if (inst == null) return
    const at = time + i * 0.004
    instrumentVoices(inst).lead.triggerAttackRelease(
      midiToNote(m.midi), Math.max(0.06, m.len * stepDur * 0.9), at,
    )
  })
  if (snap.step === 0 && snap.chord.length > 0) {
    // Chord pad through the keeper's own pad voice. No living keeper, no pad.
    const keeper = chordVoice()
    if (keeper != null) {
      instrumentVoices(keeper).pad.triggerAttackRelease(
        snap.chord.map((m) => midiToNote(m)), "1m", time, 0.8,
      )
    }
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
  stepCounter = 0
}
