// Pooled Tone.js voices, allocated ONCE after ensureAudio().
// Never allocate synths in the step hot path (mobile Web Audio safety).
//
// Source x instrument rule: every instrument owns a lead (melody lanes), a
// pad (chord stabs), and a bass (beat source). Drums are shared hardware
// recolored live via each instrument's kit recipe when it holds the beat.
import * as Tone from "tone"
import { INSTRUMENTS, NEUTRAL_KIT, type BassRecipe, type KitRecipe, type VoiceRecipe } from "@/data/enemies"
import { ensureAudio, getMaster } from "./context"

export interface InstrumentVoices {
  lead: Tone.PolySynth
  pad: Tone.PolySynth
  bass: Tone.MonoSynth
}

export interface Voices {
  instruments: Record<string, InstrumentVoices>
  kick: Tone.MembraneSynth
  snare: Tone.NoiseSynth
  hat: Tone.NoiseSynth
  reverb: Tone.Reverb
}

let voices: Voices | null = null
/** Kit currently dialed into the shared drums (avoids redundant sets). */
let liveKit: KitRecipe | null = null

function makeLead(recipe: VoiceRecipe, verbGain: Tone.Gain, master: Tone.Gain): Tone.PolySynth {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: recipe.oscillator },
    envelope: { ...recipe.envelope },
  })
  synth.volume.value = recipe.volume
  synth.connect(master)
  const send = new Tone.Gain(recipe.reverbSend)
  synth.connect(send)
  send.connect(verbGain)
  return synth
}

function makeBass(recipe: BassRecipe, master: Tone.Gain): Tone.MonoSynth {
  const bass = new Tone.MonoSynth({
    oscillator: { type: recipe.oscillator },
    filter: { Q: 1, type: "lowpass", rolloff: -12 },
    envelope: { ...recipe.envelope },
    filterEnvelope: {
      attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3,
      baseFrequency: recipe.cutoff, octaves: 2,
    },
  })
  bass.volume.value = recipe.volume
  bass.connect(master)
  return bass
}

export async function initVoices(): Promise<Voices> {
  if (voices) return voices
  await ensureAudio()
  const master = getMaster()

  const reverb = new Tone.Reverb({ decay: 4, wet: 1 })
  const verbGain = new Tone.Gain(0.25)
  verbGain.chain(reverb, master)

  const instruments: Record<string, InstrumentVoices> = {}
  for (const def of Object.values(INSTRUMENTS)) {
    instruments[def.id] = {
      lead: makeLead(def.timbre.lead, verbGain, master),
      pad: makeLead(def.timbre.pad, verbGain, master),
      bass: makeBass(def.timbre.bass, master),
    }
  }

  const kick = new Tone.MembraneSynth({
    pitchDecay: NEUTRAL_KIT.kickPitchDecay,
    octaves: NEUTRAL_KIT.kickOctaves,
    envelope: { attack: 0.001, decay: NEUTRAL_KIT.kickDecay, sustain: 0.01, release: 0.4 },
  })
  kick.volume.value = NEUTRAL_KIT.kickVolume
  kick.connect(master)

  const snare = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: NEUTRAL_KIT.snareDecay, sustain: 0, release: 0.1 },
  })
  snare.volume.value = NEUTRAL_KIT.snareVolume
  snare.connect(master)

  const hat = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.001, decay: NEUTRAL_KIT.hatDecay, sustain: 0, release: 0.03 },
  })
  hat.volume.value = NEUTRAL_KIT.hatVolume
  hat.connect(master)

  voices = { instruments, kick, snare, hat, reverb }
  liveKit = NEUTRAL_KIT
  return voices
}

export function getVoices(): Voices {
  if (!voices) throw new Error("Voices not initialized: call initVoices() first")
  return voices
}

/** The pooled voices for an instrument (unknown ids fall back to strings). */
export function instrumentVoices(id: string | null): InstrumentVoices {
  const v = getVoices()
  if (id && v.instruments[id]) return v.instruments[id]
  return v.instruments.strings
}

/**
 * Dial an instrument's kit recipe into the shared drums. Null restores the
 * neutral room pulse. Live param sets only — no reallocation.
 */
export function applyKit(kit: KitRecipe | null): void {
  const next = kit ?? NEUTRAL_KIT
  if (next === liveKit) return
  liveKit = next
  const v = getVoices()
  v.kick.pitchDecay = next.kickPitchDecay
  v.kick.octaves = next.kickOctaves
  v.kick.envelope.decay = next.kickDecay
  v.kick.volume.value = next.kickVolume
  v.snare.envelope.decay = next.snareDecay
  v.snare.volume.value = next.snareVolume
  v.hat.envelope.decay = next.hatDecay
  v.hat.volume.value = next.hatVolume
}

/** False before initVoices() (e.g. audition keys pressed while halted). */
export function hasVoices(): boolean {
  return voices != null
}
