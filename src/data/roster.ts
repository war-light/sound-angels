// Named character roster with distinct stats, instruments, elements, and traits.
// Pure data, JSON-serializable.

export interface CharacterDef {
  id: string
  name: string
  title: string
  instrument: "strings" | "piano" | "brass"
  element: "keen" | "bright" | "heavy"
  avatar: string
  role: "striker" | "support" | "defender"
  hp: number
  shield: number
  maxShield: number
  trait: string
  lore: string
}

export const ROSTER: CharacterDef[] = [
  // --- Strings ---
  {
    id: "lyra",
    name: "Lyra",
    title: "The Staccato Blade",
    instrument: "strings",
    element: "keen",
    avatar: "🎻",
    role: "striker",
    hp: 36,
    shield: 0,
    maxShield: 12,
    trait: "Swift Bow: high agility with lingering venom on struck foes.",
    lore: "Her violin weaves needle-sharp lines through the gloom, never faltering.",
  },
  {
    id: "cael",
    name: "Cael",
    title: "The Resonant Anchor",
    instrument: "strings",
    element: "heavy",
    avatar: "🪕",
    role: "defender",
    hp: 44,
    shield: 8,
    maxShield: 18,
    trait: "Deep Cellist: sturdy fortitude with heavy root resonance.",
    lore: "Sub-bass strings that absorb discord and steady the party's foundation.",
  },

  // --- Piano ---
  {
    id: "aria",
    name: "Aria",
    title: "The Harmonic Light",
    instrument: "piano",
    element: "bright",
    avatar: "🎹",
    role: "striker",
    hp: 36,
    shield: 0,
    maxShield: 12,
    trait: "Radiant Hammer: 30% critical chance dealing 2.0x critical damage.",
    lore: "Pure harmonic brilliance struck upon ivory keys that blind lurking shadows.",
  },
  {
    id: "bram",
    name: "Bram",
    title: "The Hearth Keeper",
    instrument: "piano",
    element: "keen",
    avatar: "🎼",
    role: "support",
    hp: 40,
    shield: 6,
    maxShield: 16,
    trait: "Sustained Hearth: warm felt damping that nurtures endurance.",
    lore: "An upright piano whose soft notes remind weary souls of a safe haven.",
  },

  // --- Brass ---
  {
    id: "ignis",
    name: "Ignis",
    title: "The Solar Flare",
    instrument: "brass",
    element: "bright",
    avatar: "🎺",
    role: "striker",
    hp: 36,
    shield: 0,
    maxShield: 12,
    trait: "Blazing Fanfare: heavy 5-base attacks that pierce enemy barriers.",
    lore: "A golden trumpet sounding clarion calls that shatter crystal mirrors.",
  },
  {
    id: "vesper",
    name: "Vesper",
    title: "The Iron Horn",
    instrument: "brass",
    element: "heavy",
    avatar: "📯",
    role: "defender",
    hp: 42,
    shield: 10,
    maxShield: 18,
    trait: "Iron Bulwark: enters combat protected by a heavy defensive ward.",
    lore: "A deep hunting horn whose bellowing resonance deflects incoming assault.",
  },
]

export const DEFAULT_PARTY_ROSTER: string[] = ["lyra", "aria", "ignis"]

export function getCharacter(id: string): CharacterDef | undefined {
  return ROSTER.find((c) => c.id === id)
}

