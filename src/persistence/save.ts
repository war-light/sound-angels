// Versioned JSON saves in localStorage. Music model must stay serializable.
export const SAVE_KEY = "sound-angels-save"
export const SAVE_VERSION = 1

export interface SaveData {
  version: number
  state: unknown
}

export function saveGame(state: unknown): void {
  const data: SaveData = { version: SAVE_VERSION, state }
  localStorage.setItem(SAVE_KEY, JSON.stringify(data))
}

export function loadGame(): SaveData | null {
  const raw = localStorage.getItem(SAVE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SaveData
    if (parsed.version !== SAVE_VERSION) return null
    return parsed
  } catch {
    return null
  }
}
