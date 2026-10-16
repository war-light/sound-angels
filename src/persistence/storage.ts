// LocalStorage persistence for encounter progression, selected party, custom chords, and tutorial flags.
// Pure TS, fully guarded against SSR, jsdom, and private browsing exceptions.
import type { ChordPreset } from "@/data/chords"

const KEYS = {
  CLEARED_ENCOUNTERS: "sound_angels_cleared_encounters",
  SELECTED_PARTY: "sound_angels_selected_party",
  CUSTOM_CHORDS: "sound_angels_custom_chords",
  TUTORIAL_SEEN: "sound_angels_tutorial_seen",
} as const

function isStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  } catch {
    return false
  }
}

export function loadClearedEncounters(): string[] | null {
  if (!isStorageAvailable()) return null
  try {
    const raw = window.localStorage.getItem(KEYS.CLEARED_ENCOUNTERS)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveClearedEncounters(ids: string[]): void {
  if (!isStorageAvailable()) return
  try {
    window.localStorage.setItem(KEYS.CLEARED_ENCOUNTERS, JSON.stringify(ids))
  } catch {
    // Graceful no-op
  }
}

export function loadSelectedParty(): string[] | null {
  if (!isStorageAvailable()) return null
  try {
    const raw = window.localStorage.getItem(KEYS.SELECTED_PARTY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length === 3 ? parsed : null
  } catch {
    return null
  }
}

export function saveSelectedParty(ids: string[]): void {
  if (!isStorageAvailable()) return
  try {
    window.localStorage.setItem(KEYS.SELECTED_PARTY, JSON.stringify(ids))
  } catch {
    // Graceful no-op
  }
}

export function loadCustomChords(): ChordPreset[] | null {
  if (!isStorageAvailable()) return null
  try {
    const raw = window.localStorage.getItem(KEYS.CUSTOM_CHORDS)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveCustomChords(presets: ChordPreset[]): void {
  if (!isStorageAvailable()) return
  try {
    window.localStorage.setItem(KEYS.CUSTOM_CHORDS, JSON.stringify(presets))
  } catch {
    // Graceful no-op
  }
}

export function loadTutorialSeen(): boolean {
  if (!isStorageAvailable()) return false
  try {
    return window.localStorage.getItem(KEYS.TUTORIAL_SEEN) === "true"
  } catch {
    return false
  }
}

export function saveTutorialSeen(seen: boolean): void {
  if (!isStorageAvailable()) return
  try {
    window.localStorage.setItem(KEYS.TUTORIAL_SEEN, seen ? "true" : "false")
  } catch {
    // Graceful no-op
  }
}

export function clearAllPersistedData(): void {
  if (!isStorageAvailable()) return
  try {
    for (const k of Object.values(KEYS)) {
      window.localStorage.removeItem(k)
    }
  } catch {
    // Graceful no-op
  }
}

