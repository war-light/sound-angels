// Game state machine phases: menu -> prep <-> studio -> combat -> victory / defeat.
// Pure game model — no React, no Tone.js. Erasable syntax only (no TS enums).

export type GamePhase = "menu" | "prep" | "combat" | "victory" | "defeat" | "studio"

export const ALL_GAME_PHASES: readonly GamePhase[] = [
  "menu",
  "prep",
  "combat",
  "victory",
  "defeat",
  "studio",
] as const

export function isGamePhase(val: unknown): val is GamePhase {
  return typeof val === "string" && ALL_GAME_PHASES.includes(val as GamePhase)
}

export function isCombatActive(phase: GamePhase): boolean {
  return phase === "combat"
}

export function canFreelyEditArrangement(phase: GamePhase): boolean {
  return phase === "prep" || phase === "menu" || phase === "studio"
}

const VALID_TRANSITIONS: Record<GamePhase, readonly GamePhase[]> = {
  menu: ["prep", "combat", "studio"],
  prep: ["menu", "combat", "studio"],
  combat: ["victory", "defeat", "prep", "menu"],
  victory: ["prep", "menu", "combat"],
  defeat: ["prep", "menu", "combat"],
  studio: ["prep", "menu"],
}

export function isValidTransition(from: GamePhase, to: GamePhase): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

