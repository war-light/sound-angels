// Pure TypeScript combat model — no audio, no React. Covered by Vitest.
export interface Combatant {
  hp: number
  attack: number
}

export function simulateHit(attacker: Combatant, defender: Combatant): Combatant {
  return { ...defender, hp: Math.max(0, defender.hp - attacker.attack) }
}
