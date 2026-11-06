// Stage renderer: plays the active clips through one pooled voice per role.
// Reads engine snapshots, never writes combat state. Frequency allocation
// happens here, once per role: each voice owns a filtered band of the mix.
import * as Tone from "tone"
import { midiToNote } from "@/game/theory"
import { STAGE_BPM, STAGE_LOOP_STEPS, renderStep, type StepNote } from "@/game/stageMusic"
import { activeClips, type StageState } from "@/game/stageCombat"
import { STAGE_KIT } from "@/data/stageClips"
import { ensureAudio, getMaster } from "./context"
import { applyDrumKit, initVoices, triggerDrums } from "./synths"

interface StageVoices {
  reese: Tone.MonoSynth
  sub: Tone.Synth
  pad: Tone.PolySynth
  lead: Tone.PolySynth
  counter: Tone.PolySynth
}

let voices: StageVoices | null = null
let provider: () => StageState | null = () => null
/** Runs the engine for step g. Called in the scheduler so audio and rules agree. */
let advance: (g: number) => void = () => {}
/** UI-only callback, fired on the animation frame of step g. */
let draw: (g: number) => void = () => {}
let repeatId: number | null = null
let playing = false
let counter = 0

/** Single wiring site: the session store calls this once at module load. */
export function configureStage(cfg: {
  state: () => StageState | null
  advance: (g: number) => void
  draw: (g: number) => void
}): void {
  provider = cfg.state
  advance = cfg.advance
  draw = cfg.draw
}

function initStageVoices(): StageVoices {
  if (voices) return voices
  const master = getMaster()
  const reverb = new Tone.Reverb({ decay: 3.5, wet: 1 })
  reverb.connect(master)
  const send = (amount: number) => {
    const g = new Tone.Gain(amount)
    g.connect(reverb)
    return g
  }

  // Bass: detuned reese through a resonant low-pass, plus a clean sine sub.
  const reese = new Tone.MonoSynth({
    oscillator: { type: "fatsawtooth", count: 3, spread: 22 },
    filter: { type: "lowpass", rolloff: -24, Q: 2.5 },
    filterEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.35, release: 0.2, baseFrequency: 70, octaves: 3 },
    envelope: { attack: 0.005, decay: 0.2, sustain: 0.85, release: 0.12 },
  })
  reese.volume.value = -17
  const grit = new Tone.Distortion({ distortion: 0.3, wet: 0.35 })
  reese.chain(grit, master)
  const sub = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.005, decay: 0.1, sustain: 1, release: 0.1 },
  })
  sub.volume.value = -9
  sub.connect(master)

  // Harmony: orchestral saw ensemble, carved to the mids.
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsawtooth", count: 3, spread: 18 },
    envelope: { attack: 0.06, decay: 0.4, sustain: 0.6, release: 0.5 },
  })
  pad.volume.value = -23
  const padLow = new Tone.Filter(220, "highpass")
  const padHigh = new Tone.Filter(2600, "lowpass")
  pad.chain(padLow, padHigh, master)
  padHigh.connect(send(0.35))

  // Lead: chip square, highs only, with a dotted-eighth echo.
  const lead = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "square" },
    envelope: { attack: 0.004, decay: 0.12, sustain: 0.5, release: 0.08 },
  })
  lead.volume.value = -24
  const leadBand = new Tone.Filter(500, "highpass")
  const echo = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.28, wet: 0.22 })
  lead.chain(leadBand, echo, master)
  echo.connect(send(0.15))

  // Counter: soft triangle pluck between the pad and the lead.
  const counterSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.002, decay: 0.3, sustain: 0.15, release: 0.3 },
  })
  counterSynth.volume.value = -14
  const counterBand = new Tone.Filter(320, "highpass")
  counterSynth.chain(counterBand, master)
  counterBand.connect(send(0.4))

  voices = { reese, sub, pad, lead, counter: counterSynth }
  return voices
}

function playNote(v: StageVoices, n: StepNote, time: number, stepDur: number): void {
  const dur = Math.max(0.05, n.len * stepDur * 0.92)
  const names = n.midis.map(midiToNote)
  switch (n.role) {
    case "bass":
      v.reese.triggerAttackRelease(names[0], dur, time, n.vel)
      v.sub.triggerAttackRelease(names[0], dur, time, n.vel)
      return
    case "harmony":
      v.pad.triggerAttackRelease(names, dur, time, n.vel)
      return
    case "lead":
      v.lead.triggerAttackRelease(names, dur, time, n.vel)
      return
    case "counter":
      v.counter.triggerAttackRelease(names, dur, time, n.vel)
  }
}

export async function startStage(): Promise<void> {
  if (playing) return
  await ensureAudio()
  await initVoices()
  const v = initStageVoices()
  const transport = Tone.getTransport()
  transport.bpm.value = STAGE_BPM
  transport.swing = 0
  counter = 0
  const stepDur = 60 / STAGE_BPM / 4
  if (repeatId == null) {
    repeatId = transport.scheduleRepeat((time) => {
      const g = counter
      counter += 1
      // Rules first, then sound: queued clips and chords committed on this
      // step are exactly what plays on it.
      advance(g)
      const st = provider()
      if (st && !st.over) {
        applyDrumKit(STAGE_KIT)
        const out = renderStep(activeClips(st), st.key, st.chord, g % STAGE_LOOP_STEPS)
        if (out.drums) triggerDrums(out.drums, time, stepDur, STAGE_KIT)
        for (const n of out.notes) playNote(v, n, time, stepDur)
      }
      Tone.getDraw().schedule(() => draw(g), time)
    }, "16n")
  }
  transport.start()
  playing = true
}

export function stopStage(): void {
  const transport = Tone.getTransport()
  if (repeatId != null) {
    transport.clear(repeatId)
    repeatId = null
  }
  counter = 0
  if (!playing) return
  transport.stop()
  playing = false
}
