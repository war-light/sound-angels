// Pooled Tone.js voices, allocated ONCE after ensureAudio().
// Never allocate synths in the step hot path (mobile Web Audio safety).
import * as Tone from "tone"
import { ensureAudio, getMaster } from "./context"

export interface Voices {
  bass: Tone.MonoSynth
  lead: Tone.Synth
  chords: Tone.PolySynth
  kick: Tone.MembraneSynth
  snare: Tone.NoiseSynth
  hat: Tone.NoiseSynth
  reverb: Tone.Reverb
}

let voices: Voices | null = null

export async function initVoices(): Promise<Voices> {
  if (voices) return voices
  await ensureAudio()
  const master = getMaster()

  const reverb = new Tone.Reverb({ decay: 4, wet: 1 })
  const verbGain = new Tone.Gain(0.25)
  verbGain.chain(reverb, master)

  const bass = new Tone.MonoSynth({
    oscillator: { type: "sine" },
    filter: { Q: 1, type: "lowpass", rolloff: -12 },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 },
    filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3, baseFrequency: 120, octaves: 2 },
  })
  bass.volume.value = -6
  bass.connect(master)

  const lead = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.4 },
  })
  lead.volume.value = -10
  lead.connect(master)
  lead.connect(verbGain)

  const chords = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.02, decay: 0.4, sustain: 0.3, release: 1.2 },
  })
  chords.volume.value = -16
  chords.connect(master)
  chords.connect(verbGain)

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.04,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.4 },
  })
  kick.volume.value = -8
  kick.connect(master)

  const snare = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.17, sustain: 0, release: 0.1 },
  })
  snare.volume.value = -14
  snare.connect(master)

  const hat = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 },
  })
  hat.volume.value = -20
  hat.connect(master)

  voices = { bass, lead, chords, kick, snare, hat, reverb }
  return voices
}

export function getVoices(): Voices {
  if (!voices) throw new Error("Voices not initialized: call initVoices() first")
  return voices
}

/** False before initVoices() (e.g. audition keys pressed while halted). */
export function hasVoices(): boolean {
  return voices != null
}
