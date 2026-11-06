// The stage clip library: 5 roles x 3 clips, plus authored combos.
// House style: 170 bpm halftime, broken breaks, reese bass, orchestral
// harmony, chip lead. Notation lives in game/stageMusic.ts (pitched) and
// game/groove.ts (drums). Every clip must pass stageClips.lint.test.ts.
import type { DrumTimbre } from "@/game/groove"
import {
  parseDrums,
  parsePitched,
  type BreaksClip,
  type ClipEffect,
  type PitchedClip,
  type PitchedRole,
  type Role,
  type StageClip,
} from "@/game/stageMusic"

function breaks(
  id: string,
  name: string,
  blurb: string,
  effect: ClipEffect,
  rows: { kick: string[]; snare: string[]; hat: string[]; perc: string[] },
): BreaksClip {
  return { id: `breaks:${id}`, role: "breaks", name, blurb, effect, drums: parseDrums(rows) }
}

function pitched(
  role: PitchedRole,
  id: string,
  name: string,
  blurb: string,
  effect: ClipEffect,
  bars: string[],
): PitchedClip {
  return { id: `${role}:${id}`, role, name, blurb, effect, events: parsePitched(bars) }
}

export const STAGE_CLIPS: StageClip[] = [
  // --- Breaks: the pulse. Snare accents only on 4 / 8 / 12 (bass ducks them).
  breaks("halftime", "Halftime Stomp", "Heavy and patient. Room to breathe.", { damage: 2 }, {
    kick: ["X.........x.....", "X.........x.....", "X.........x.....", "X.........x..x.."],
    snare: ["........X.......", "........X.......", "........X.......", "........X.....g."],
    hat: ["x.g.x.g.x.g.x.g."],
    perc: ["................", "..............x.", "................", "......x.......x."],
  }),
  breaks("twostep", "Two-Step", "The classic roller. Ghost snares keep it moving.", { damage: 3 }, {
    kick: ["X.........X.....", "X.........X.....", "X.........X.....", "X.x.......X....."],
    snare: ["....X..g.g..X...", "....X..g....X..g", "....X..g.g..X...", "....X..g..g.Xgrr"],
    hat: ["x.x.x.x.x.x.x.x.", "x.x.x.x.x.x.x.x.", "x.x.x.x.x.x.x.x.", "x.x.x.x.x.xxx.x."],
    perc: ["................", "..........x.....", "................", "................"],
  }),
  breaks("fracture", "Fracture", "Broken and twitchy, then a hole you fall into.", { damage: 4 }, {
    kick: ["X..x......X.....", "X......x..x.....", "X..x......X..x..", "X.....x........."],
    snare: ["....X.g.....X..g", "..g.X.......X.g.", "....X.g..g..X..r", "....X..........."],
    hat: ["x.xgx.xgx.xgx.xg", "x.xgx.xgx.xgx.xg", "x.xgx.xgx.xgx.xg", "x.xgx.xg........"],
    perc: ["...........x....", ".x.........x....", "...........x..x.", "...............X"],
  }),

  // --- Bass: root-anchored, never starts on a snare accent.
  pitched("bass", "sub", "Sub Pressure", "Long roots you feel more than hear.", { damage: 3 }, [
    "0-------..0-----",
    "0-------..0-----",
    "0-------..0-----",
    "0-------..2-..3-",
  ]),
  pitched("bass", "reese", "Reese Crawl", "Detuned growl that drags its feet.", { damage: 3, expose: 10 }, [
    "0-----.0-.2-----",
    "0-----.0.d0-----",
  ]),
  pitched("bass", "wobble", "Glitch Wobble", "Stuttering sixteenths around the root.", { damage: 2, expose: 15 }, [
    "0.0..3.0..0..2.0",
    "0.0..3.0.u0..2.0",
  ]),

  // --- Harmony: the chord itself. The only role that voices the seventh.
  pitched("harmony", "choir", "Choir Pad", "A held chord that wraps the party.", { shield: 2 }, [
    "X---------------",
  ]),
  pitched("harmony", "stabs", "Brass Stabs", "Short orchestral hits on the off-beat.", { damage: 1, shield: 1 }, [
    "X-.....X-.......",
    "X-.....X-....X-.",
  ]),
  pitched("harmony", "arp", "Glass Arp", "Strings climbing the chord in eighths.", { heal: 1, shield: 1 }, [
    "0.1.2.3.4.3.2.1.",
    "0.1.2.3.4.3.2.1.",
    "0.1.2.3.4.3.2.1.",
    "0.1.2.3.4.......",
  ]),

  // --- Lead: the call. Bars 1 and 3, pickups into 2 and 4.
  pitched("lead", "anthem", "Hero's Call", "A bold rising theme. Undertale energy.", { damage: 3 }, [
    "0--2--3-----2-1-",
    "............1u2-",
    "3--2--1---d0----",
    "............0-2-",
  ]),
  pitched("lead", "chip", "Chip Cascade", "Fast square-wave runs that tumble down.", { damage: 4 }, [
    "4d3.2d1.0.1.2-3-",
    "............2u3-",
    "3.2.1.0d0...2-1-",
    "............0-1-",
  ]),
  pitched("lead", "lament", "Lament", "Long, aching tones. Soothes as it cuts.", { damage: 1, heal: 2 }, [
    "3-------2-------",
    "............1---",
    "2-------1---0---",
    "............0---",
  ]),

  // --- Counter: the answer. Bars 2 and 4, clear before the lead's pickup.
  // Chord tones only: it shares the harmony's register, so a passing tone
  // would grind a semitone against the pad (the linter proves it).
  pitched("counter", "answer", "Answer", "A gentle reply that mends.", { heal: 2 }, [
    "................",
    "0.1.2---1-0-....",
    "................",
    "2.1.0-----1-....",
  ]),
  pitched("counter", "pluck", "Echo Pluck", "Dotted plucks that find the cracks.", { damage: 1, expose: 20 }, [
    "................",
    ".0..1..2..1.....",
    "................",
    ".2..1..0..1.....",
  ]),
  pitched("counter", "bells", "Bell Tower", "Falling bells that ring out a ward.", { shield: 2, heal: 1 }, [
    "................",
    "3---2---1---....",
    "................",
    "2---1---0---....",
  ]),
]

export interface StageCombo {
  id: string
  name: string
  blurb: string
  /** Every clip id that must be playing. */
  clips: string[]
  /** Every role that must be filled (any clip). */
  roles?: Role[]
  /** Multiplies the bar's damage. */
  damageMult?: number
  /** Extra effect added on top of the clips. */
  bonus?: ClipEffect
}

/** Hidden sets the player discovers by ear. */
export const STAGE_COMBOS: StageCombo[] = [
  {
    id: "battle-anthem",
    name: "Battle Anthem",
    blurb: "Two-Step, Reese Crawl and Hero's Call lock together.",
    clips: ["breaks:twostep", "bass:reese", "lead:anthem"],
    damageMult: 1.3,
  },
  {
    id: "glitch-storm",
    name: "Glitch Storm",
    blurb: "Fracture, Glitch Wobble and Chip Cascade short-circuit the foe.",
    clips: ["breaks:fracture", "bass:wobble", "lead:chip"],
    damageMult: 1.5,
  },
  {
    id: "requiem",
    name: "Requiem",
    blurb: "Choir, Lament and Bell Tower: a hymn that heals.",
    clips: ["harmony:choir", "lead:lament", "counter:bells"],
    bonus: { heal: 2 },
  },
  {
    id: "full-ensemble",
    name: "Full Ensemble",
    blurb: "Every role on stage at once.",
    clips: [],
    roles: ["breaks", "bass", "harmony", "lead", "counter"],
    damageMult: 1.2,
  },
]

/** A punchier, tighter kit for the stage breaks. */
export const STAGE_KIT: DrumTimbre = {
  kick: { pitchDecay: 0.05, octaves: 7, decay: 0.45, volume: -5 },
  snare: { decay: 0.2, volume: -9 },
  hat: { decay: 0.035, volume: -19 },
  perc: { note: "D5", harmonicity: 5.1, resonance: 4200, decay: 0.08, volume: -22 },
}

const BY_ID = new Map(STAGE_CLIPS.map((c) => [c.id, c]))

export function getStageClip(id: string): StageClip | undefined {
  return BY_ID.get(id)
}

export function clipsForRole(role: Role): StageClip[] {
  return STAGE_CLIPS.filter((c) => c.role === role)
}
