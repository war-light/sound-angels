// Pre-fight melody bank: save, load, and manage melody templates outside combat.
// Templates persist across encounters, can be loaded into the grid during PREP,
// and can be cast mid-combat as QTE charts.
import type { NoteEvent } from "./arrangement"
import { ATTACK_SLOTS, DEFAULT_BARS, STEPS_PER_BAR } from "./arrangement"

export interface MelodyTemplate {
  id: string
  name: string
  description?: string
  /** [slot][bar][step] */
  tracks: (NoteEvent | null)[][][]
  /** One Roman numeral per bar */
  chords: string[]
  tags?: string[]
}

export type MelodyBank = Record<string, MelodyTemplate>

export function cloneTracks(tracks: (NoteEvent | null)[][][]): (NoteEvent | null)[][][] {
  return tracks.map((tr) => tr.map((row) => row.map((e) => (e ? { ...e } : null))))
}

function emptyTracks(slots = ATTACK_SLOTS, bars = DEFAULT_BARS, steps = STEPS_PER_BAR): (NoteEvent | null)[][][] {
  return Array.from({ length: slots }, () =>
    Array.from({ length: bars }, () => Array.from({ length: steps }, () => null)),
  )
}

function createDawnAnthem(): MelodyTemplate {
  const tracks = emptyTracks()
  // Slot 0 (strings): melodic motif
  tracks[0][0][0] = { degree: 1, len: 4 }
  tracks[0][0][4] = { degree: 3, len: 4 }
  tracks[0][0][8] = { degree: 5, len: 4 }
  tracks[0][0][12] = { degree: 4, len: 4 }
  tracks[0][1][0] = { degree: 6, len: 8 }
  tracks[0][1][8] = { degree: 5, len: 4 }
  tracks[0][1][12] = { degree: 1, len: 4 }

  // Slot 1 (piano): rhythmic harmony
  tracks[1][0][0] = { degree: 3, len: 2 }
  tracks[1][0][4] = { degree: 5, len: 2 }
  tracks[1][0][8] = { degree: 7, len: 2 }
  tracks[1][1][0] = { degree: 1, len: 2 }
  tracks[1][1][4] = { degree: 3, len: 2 }
  tracks[1][1][8] = { degree: 5, len: 2 }

  return {
    id: "dawn-anthem",
    name: "Dawn Anthem",
    description: "A balanced diatonic motif blending strings and piano over a steady i–VI progression.",
    tracks,
    chords: ["i", "VI"],
    tags: ["balanced", "starter"],
  }
}

function createStaccatoFlight(): MelodyTemplate {
  const tracks = emptyTracks()
  // Slot 0: rapid 16th stabs
  for (let s = 0; s < 16; s += 2) {
    tracks[0][0][s] = { degree: (s % 5) + 1, len: 1 }
    tracks[0][1][s] = { degree: ((s + 2) % 5) + 1, len: 1 }
  }
  // Slot 1: counter rhythm
  for (let s = 1; s < 16; s += 4) {
    tracks[1][0][s] = { degree: 3, len: 1 }
    tracks[1][1][s] = { degree: 5, len: 1 }
  }

  return {
    id: "staccato-flight",
    name: "Staccato Flight",
    description: "Rapid short notes designed to overwhelm evasive horde enemies like Mites.",
    tracks,
    chords: ["i", "iv"],
    tags: ["burst", "anti-horde"],
  }
}

function createSolemnGround(): MelodyTemplate {
  const tracks = emptyTracks()
  // Slot 0 (strings): long sustained lines
  tracks[0][0][0] = { degree: 1, len: 8 }
  tracks[0][0][8] = { degree: 5, len: 8 }
  tracks[0][1][0] = { degree: 4, len: 8 }
  tracks[0][1][8] = { degree: 1, len: 8 }

  // Slot 2 (brass): heavy punctuations
  tracks[2][0][4] = { degree: 1, len: 4 }
  tracks[2][0][12] = { degree: 3, len: 4 }
  tracks[2][1][4] = { degree: 5, len: 4 }
  tracks[2][1][12] = { degree: 1, len: 4 }

  return {
    id: "solemn-ground",
    name: "Solemn Ground",
    description: "Extended sustained notes that crush high-armor tank enemies like Carapace.",
    tracks,
    chords: ["i", "V"],
    tags: ["sustained", "tank-buster"],
  }
}

export function createDefaultMelodyBank(): MelodyBank {
  const anthem = createDawnAnthem()
  const staccato = createStaccatoFlight()
  const solemn = createSolemnGround()
  return {
    [anthem.id]: anthem,
    [staccato.id]: staccato,
    [solemn.id]: solemn,
  }
}

export function saveTemplate(
  bank: MelodyBank,
  input: {
    id?: string
    name: string
    description?: string
    tracks: (NoteEvent | null)[][][]
    chords: string[]
    tags?: string[]
  },
): { bank: MelodyBank; template: MelodyTemplate } {
  const cleanName = input.name.trim()
  if (!cleanName) throw new Error("Template name cannot be empty")
  const id = input.id ?? `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const template: MelodyTemplate = {
    id,
    name: cleanName,
    description: input.description,
    tracks: cloneTracks(input.tracks),
    chords: [...input.chords],
    tags: input.tags ? [...input.tags] : undefined,
  }
  return {
    bank: { ...bank, [id]: template },
    template,
  }
}

export function deleteTemplate(bank: MelodyBank, id: string): MelodyBank {
  if (!bank[id]) return bank
  const next = { ...bank }
  delete next[id]
  return next
}

export function getTemplate(bank: MelodyBank, id: string): MelodyTemplate | undefined {
  return bank[id]
}

