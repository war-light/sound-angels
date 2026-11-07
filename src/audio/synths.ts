// Pooled Tone.js voices, allocated ONCE after ensureAudio().
// Never allocate synths in the step hot path (mobile Web Audio safety).
//
// Source x instrument rule: every instrument owns a lead (melody lanes), a
// pad (chord stabs), and a bass (beat source). Drums are shared hardware
// recolored live from the equipped drum kit (see data/kits.ts).
import * as Tone from "tone"
import { INSTRUMENTS, type BassRecipe, type VoiceRecipe } from "@/data/enemies"
import { NEUTRAL_TIMBRE } from "@/data/kits"
import type { DrumTimbre, DrumVoice } from "@/game/groove"
import type { DrumHitSnapshot } from "@/game/arrangement"
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
  perc: Tone.MetalSynth
  reverb: Tone.Reverb
}

let voices: Voices | null = null
/** Kit currently dialed into the shared drums (avoids redundant sets). */
let liveKit: DrumTimbre | null = null

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

  const kit = NEUTRAL_TIMBRE
  const kick = new Tone.MembraneSynth({
    pitchDecay: kit.kick.pitchDecay,
    octaves: kit.kick.octaves,
    envelope: { attack: 0.001, decay: kit.kick.decay, sustain: 0.01, release: 0.4 },
  })
  kick.volume.value = kit.kick.volume
  kick.connect(master)

  const snare = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: kit.snare.decay, sustain: 0, release: 0.1 },
  })
  snare.volume.value = kit.snare.volume
  snare.connect(master)

  const hat = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.001, decay: kit.hat.decay, sustain: 0, release: 0.03 },
  })
  hat.volume.value = kit.hat.volume
  hat.connect(master)

  const perc = new Tone.MetalSynth({
    harmonicity: kit.perc.harmonicity,
    resonance: kit.perc.resonance,
    modulationIndex: 12,
    octaves: 1.5,
    envelope: { attack: 0.001, decay: kit.perc.decay, release: 0.02 },
  })
  perc.volume.value = kit.perc.volume
  perc.connect(master)

  voices = { instruments, kick, snare, hat, perc, reverb }
  liveKit = kit
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
 * Dial a drum kit's timbre into the shared drums. Null restores the neutral
 * room pulse. Live param sets only — no reallocation.
 */
export function applyDrumKit(kit: DrumTimbre | null): void {
  const next = kit ?? NEUTRAL_TIMBRE
  if (next === liveKit) return
  liveKit = next
  const v = getVoices()
  v.kick.pitchDecay = next.kick.pitchDecay
  v.kick.octaves = next.kick.octaves
  v.kick.envelope.decay = next.kick.decay
  v.kick.volume.value = next.kick.volume
  v.snare.envelope.decay = next.snare.decay
  v.snare.volume.value = next.snare.volume
  v.hat.envelope.decay = next.hat.decay
  v.hat.volume.value = next.hat.volume
  v.perc.harmonicity = next.perc.harmonicity
  v.perc.resonance = next.perc.resonance
  v.perc.envelope.decay = next.perc.decay
  v.perc.volume.value = next.perc.volume
}

/**
 * Fire one step of drums. Rolls schedule extra 32nd sub-hits inside the
 * step; velocity carries accents and ghosts.
 */
export function triggerDrums(
  drums: Record<DrumVoice, DrumHitSnapshot>,
  at: number,
  stepDur: number,
  kit: DrumTimbre | null,
): void {
  const v = getVoices()
  const note = (kit ?? NEUTRAL_TIMBRE).perc.note
  const fire = (hit: DrumHitSnapshot, run: (time: number, vel: number) => void) => {
    if (hit.vel <= 0) return
    run(at, hit.vel)
    for (let i = 1; i <= hit.roll; i++) {
      run(at + (stepDur * i) / (hit.roll + 1), hit.vel * 0.6)
    }
  }
  fire(drums.kick, (t, vel) => v.kick.triggerAttackRelease("C1", "8n", t, vel))
  fire(drums.snare, (t, vel) => v.snare.triggerAttackRelease("16n", t, vel))
  fire(drums.hat, (t, vel) => v.hat.triggerAttackRelease("32n", t, vel))
  fire(drums.perc, (t, vel) => v.perc.triggerAttackRelease(note, "32n", t, vel))
}

/** False before initVoices() (e.g. audition keys pressed while halted). */
export function hasVoices(): boolean {
  return voices != null
}
