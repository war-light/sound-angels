// Curated multi-enemy encounter templates of escalating difficulty.
import { ENEMIES } from "./enemies"

export interface EncounterDef {
  id: string
  name: string
  description: string
  enemyIds: string[]
  recommendedBpm?: number
  tip?: string
}

export const ENCOUNTERS: EncounterDef[] = [
  {
    id: "echo-solo",
    name: "A Lone Voice",
    description: "An Echo wanders the dark hall, testing your basic melody timing.",
    enemyIds: ["echo"],
    recommendedBpm: 90,
    tip: "Sing melodies with WASD on the beat. Piano deals heavy critical strikes against Echo.",
  },
  {
    id: "mite-swarm",
    name: "The Skittering Swarm",
    description: "Two swift Mites swarm ahead. Their swift gauges punish slow play, and they dodge sustained attacks.",
    enemyIds: ["mite", "mite"],
    recommendedBpm: 95,
    tip: "Use short 16th-note bursts. Mites dodge 45% of long sustained notes.",
  },
  {
    id: "shield-and-mirror",
    name: "Resonant Wall",
    description: "A heavily armored Carapace tank flanked by a deceptive Mirror that reflects non-chord notes.",
    enemyIds: ["carapace", "mirror"],
    recommendedBpm: 85,
    tip: "Brass hits hard against Carapace. Stay strictly in-chord to avoid Mirror's reflection.",
  },
  {
    id: "dust-and-shadows",
    name: "The Dust Weaver",
    description: "A Dust Moth ready to wipe your melody tracks clean, protected by a nimble Mite.",
    enemyIds: ["mite", "moth"],
    recommendedBpm: 90,
    tip: "String instruments inflict poison on Dust Moth. Re-sing melodies quickly if wiped.",
  },
  {
    id: "discordant-choir",
    name: "The Discordant Choir",
    description: "A full trial of harmony: Carapace, Mirror, and Dust Moth united in discordant cacophony.",
    enemyIds: ["carapace", "mirror", "moth"],
    recommendedBpm: 100,
    tip: "Balance short staccato hits for the swarm with heavy sustained notes for the tank.",
  },
]

export const DEFAULT_ENCOUNTER_ID = "echo-solo"

export function getEncounter(id: string): EncounterDef | undefined {
  return ENCOUNTERS.find((e) => e.id === id)
}

/** Validate that all encounters reference existing enemy profiles. */
export function validateEncounters(): boolean {
  for (const enc of ENCOUNTERS) {
    if (enc.enemyIds.length === 0) return false
    for (const eid of enc.enemyIds) {
      if (!ENEMIES[eid]) return false
    }
  }
  return true
}

/** Check whether an encounter is unlocked based on list of cleared encounters. */
export function isEncounterUnlocked(clearedIds: string[], encounterId: string): boolean {
  const idx = ENCOUNTERS.findIndex((e) => e.id === encounterId)
  if (idx <= 0) return true
  const prev = ENCOUNTERS[idx - 1]
  return clearedIds.includes(prev.id)
}

/** Get the next encounter ID in linear progression, or null if on the last encounter. */
export function getNextEncounterId(encounterId: string): string | null {
  const idx = ENCOUNTERS.findIndex((e) => e.id === encounterId)
  if (idx >= 0 && idx < ENCOUNTERS.length - 1) {
    return ENCOUNTERS[idx + 1].id
  }
  return null
}


