import { create } from "zustand"

export interface Loadout {
  scale: string
  weapon: string
}

interface GameState {
  resources: Record<string, number>
  unlocks: string[]
  loadout: Loadout
  addResource: (key: string, amount: number) => void
  unlock: (id: string) => void
  setLoadout: (loadout: Partial<Loadout>) => void
}

export const useGameStore = create<GameState>((set) => ({
  resources: { echo: 0 },
  unlocks: [],
  loadout: { scale: "C minor", weapon: "pulse" },
  addResource: (key, amount) =>
    set((s) => ({ resources: { ...s.resources, [key]: (s.resources[key] ?? 0) + amount } })),
  unlock: (id) => set((s) => (s.unlocks.includes(id) ? s : { unlocks: [...s.unlocks, id] })),
  setLoadout: (loadout) => set((s) => ({ loadout: { ...s.loadout, ...loadout } })),
}))
