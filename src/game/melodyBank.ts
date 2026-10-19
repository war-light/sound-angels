// Melody cards: the attackers' saved loops. A card bundles [slot][bar][step]
// tracks with a chord progression. Cards are picked into the loadout, loaded
// into the grid during PREP, and swapped mid-combat at the loop boundary.
// Pure game model — serializable, no audio, no React.
import type { NoteEvent } from "./arrangement"
import { ATTACK_SLOTS, DEFAULT_BARS, STEPS_PER_BAR } from "./arrangement"

export type MelodyCardSource = "preset" | "custom"

export interface MelodyTemplate {
  id: string
  name: string
  description?: string
  /** Preset cards ship with the game; custom cards are authored by the player. */
  source: MelodyCardSource
  /** [slot][bar][step] */
  tracks: (NoteEvent | null)[][][]
  /** One Roman numeral per bar */
  chords: string[]
  tags?: string[]
}

export type MelodyBank = Record<string, MelodyTemplate>

/** The starter melody cards every save begins with. */
export const PRESET_MELODY_CARD_IDS = [
  "dawn-anthem",
  "staccato-flight",
  "solemn-ground",
] as const

export const DEFAULT_MELODY_CARD_ID: string = PRESET_MELODY_CARD_IDS[0]

export function isPresetMelodyCard(id: string): boolean {
  return (PRESET_MELODY_CARD_IDS as readonly string[]).includes(id)
}

export function cloneTracks(tracks: (NoteEvent | null)[][][]): (NoteEvent | null)[][][] {
  return tracks.map((tr) => tr.map((row) => row.map((e) => (e ? { ...e } : null))))
}

export function cloneTemplate(tpl: MelodyTemplate): MelodyTemplate {
  return {
    ...tpl,
    tracks: cloneTracks(tpl.tracks),
    chords: [...tpl.chords],
    tags: tpl.tags ? [...tpl.tags] : undefined,
  }
}

/** Every card, presets first then custom, each a defensive copy. */
export function listMelodyCards(bank: MelodyBank): MelodyTemplate[] {
  return Object.values(bank).map(cloneTemplate)
}

function emptyTracks(slots = ATTACK_SLOTS, bars = DEFAULT_BARS, steps = STEPS_PER_BAR): (NoteEvent | null)[][][] {
  return Array.from({ length: slots }, () =>
    Array.from({ length: bars }, () => Array.from({ length: steps }, () => null)),
  )
}

/**
 * Preset cards are written as a 2-bar phrase. When the live loop is 4 bars,
 * mirror bars 0-1 into bars 2-3 so the card fills the whole loop.
 */
function mirrorSecondPhrase(tracks: (NoteEvent | null)[][][]): void {
  for (const slot of tracks) {
    if (slot.length < 4) continue
    for (let s = 0; s < slot[0].length; s++) {
      slot[2][s] = slot[0][s] ? { ...slot[0][s]! } : null
      slot[3][s] = slot[1][s] ? { ...slot[1][s]! } : null
    }
  }
}

/** Repeat a 2-chord phrase across the loop's bar count. */
function fitChords(chords: string[]): string[] {
  return Array.from({ length: DEFAULT_BARS }, (_, b) => chords[b % chords.length])
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

  mirrorSecondPhrase(tracks)

  return {
    id: "dawn-anthem",
    name: "Dawn Anthem",
    description: "A balanced diatonic motif blending strings and piano over a steady i–VI progression.",
    source: "preset",
    tracks,
    chords: fitChords(["i", "VI"]),
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

  mirrorSecondPhrase(tracks)

  return {
    id: "staccato-flight",
    name: "Staccato Flight",
    description: "Rapid short notes designed to overwhelm evasive horde enemies like Mites.",
    source: "preset",
    tracks,
    chords: fitChords(["i", "iv"]),
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

  mirrorSecondPhrase(tracks)

  return {
    id: "solemn-ground",
    name: "Solemn Ground",
    description: "Extended sustained notes that crush high-armor tank enemies like Carapace.",
    source: "preset",
    tracks,
    chords: fitChords(["i", "V"]),
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

/**
 * Snapshot tracks + chords as a card. Cards saved by the player are `custom`;
 * the preset builders above are the only `preset` authors.
 */
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
  if (!cleanName) throw new Error("Card name cannot be empty")
  const id = input.id ?? `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const template: MelodyTemplate = {
    id,
    name: cleanName,
    description: input.description,
    source: isPresetMelodyCard(id) ? "preset" : "custom",
    tracks: cloneTracks(input.tracks),
    chords: [...input.chords],
    tags: input.tags ? [...input.tags] : undefined,
  }
  return {
    bank: { ...bank, [id]: template },
    template,
  }
}

/** Overwrite a custom card's content in place (no-op for unknown ids). */
export function updateTemplate(
  bank: MelodyBank,
  id: string,
  patch: { tracks: (NoteEvent | null)[][][]; chords: string[] },
): MelodyBank {
  const tpl = bank[id]
  if (!tpl) return bank
  return {
    ...bank,
    [id]: { ...tpl, tracks: cloneTracks(patch.tracks), chords: [...patch.chords] },
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
