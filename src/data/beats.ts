// The beat library: 5 rhythmic archetype banks x 4 voices x 4 complexity
// tiers = 80 clips. Each pad is one voice's full 16-step bar; the player picks
// one clip per column. Named rigs are curated picks (switch at the next loop).
//
// Notation: X accent · x hit · g ghost · r roll · R accent roll · - rest
import {
  DEFAULT_BANK_ID,
  DRUM_VOICES,
  cloneGroove,
  createRig,
  parsePattern,
  type Bank,
  type Clip,
  type ClipTier,
  type DrumVoice,
  type Groove,
} from "@/game/groove"
import { defaultKit, getKit } from "./kits"

type Rows = Record<DrumVoice, string>

interface BankSpec {
  id: string
  name: string
  archetype: string
  bpmHint: number
  swing?: number
  focus: string
  genres: string[]
  defaultPicks: Record<DrumVoice, ClipTier>
  rows: [Rows, Rows, Rows, Rows]
}

function makeBank(spec: BankSpec): Bank {
  const clips = {} as Record<DrumVoice, Clip[]>
  for (const voice of DRUM_VOICES) {
    clips[voice] = spec.rows.map((row, tier) => ({
      id: `${spec.id}:${voice}:${tier}`,
      voice,
      tier: tier as ClipTier,
      steps: parsePattern(row[voice]),
    }))
  }
  return {
    id: spec.id,
    name: spec.name,
    archetype: spec.archetype,
    bpmHint: spec.bpmHint,
    swing: spec.swing ?? 0,
    focus: spec.focus,
    genres: spec.genres,
    clips,
    defaultPicks: spec.defaultPicks,
  }
}

/** Bank 1 — Straight Pulse. Four-on-floor, backbeat claps, offbeat hats. */
const STRAIGHT = makeBank({
  id: "straight",
  name: "Straight Pulse",
  archetype: "4/4",
  bpmHint: 124,
  focus: "Kick on every quarter, claps on 2 and 4, hats on the offbeats.",
  genres: ["House", "Techno", "Disco", "Synthwave", "EDM", "Pop"],
  defaultPicks: { kick: 1, snare: 1, hat: 2, perc: 1 },
  rows: [
    { kick: "X---X---X---X---", snare: "------------X---", hat: "----X-------X---", perc: "----------------" },
    { kick: "X---X---X---X--x", snare: "----X-------X---", hat: "--x---x---x---x-", perc: "----x-------x---" },
    { kick: "X---X---X-x-X-x-", snare: "--x-X---x---X--x", hat: "-x-x-x-x-x-x-x-x", perc: "x-x-x-x-x-x-x-x-" },
    { kick: "X--xX---X-x-X--x", snare: "----X-x---x-X-xr", hat: "XxXxXxXxXxXxXxXx", perc: "X-xxx-x-X-xxx-xr" },
  ],
})

/** Bank 2 — Halftime / Boom-Bap. Kick on 1, delayed syncopation, snare on 3. */
const HALFTIME = makeBank({
  id: "halftime",
  name: "Halftime / Boom-Bap",
  archetype: "Halftime",
  bpmHint: 90,
  focus: "Kick on the one, a delayed pocket, and a hard snare on the three.",
  genres: ["Boom-Bap", "Lo-Fi", "90s Hip-Hop", "Modern R&B"],
  defaultPicks: { kick: 1, snare: 1, hat: 1, perc: 1 },
  rows: [
    { kick: "X-----------x---", snare: "--------X-------", hat: "x---x---x---x---", perc: "----------------" },
    { kick: "X-----x-----X---", snare: "----g---X---g---", hat: "x-x-x-x-x-x-x-x-", perc: "--------g-------" },
    { kick: "X---x---x---X--x", snare: "----x---X--gx-g-", hat: "x-xxx-x-x-xxx-x-", perc: "----g---g---x---" },
    { kick: "X--x--x-x-x-X-xx", snare: "--g-x-g-X-g-x-gx", hat: "xgxxgxxxgxxgxxxx", perc: "--x-gx--x-gx--xr" },
  ],
})

/** Bank 3 — Trap / Drill. Sparse lows, rolling hats, clap on the three. */
const TRAP = makeBank({
  id: "trap",
  name: "Trap / Drill",
  archetype: "Trap",
  bpmHint: 144,
  focus: "Sparse low kicks under rolling 16ths and a snappy clap on the three.",
  genres: ["Trap", "UK Drill", "Contemporary Urban Pop"],
  defaultPicks: { kick: 1, snare: 1, hat: 2, perc: 1 },
  rows: [
    { kick: "X-----------X---", snare: "--------X-------", hat: "x---x---x---x---", perc: "----------------" },
    { kick: "X-----x-X---x---", snare: "--------X---g---", hat: "x-x-x-x-x-x-x-x-", perc: "--------x-------" },
    { kick: "X--x--x-X-x-x---", snare: "----g---X-g-x---", hat: "xxxx-xx-xxxx-xxr", perc: "--------x-x-----" },
    { kick: "X-x-xx-X-xx-xx--", snare: "--g-x-g-X-g-x-xx", hat: "xr-xr-xxrx-xr-xx", perc: "--x---x-x-x---xx" },
  ],
})

/** Bank 4 — Tresillo / Syncopated. 3+3+2 pulse, snares on the "and". */
const TRESILLO = makeBank({
  id: "tresillo",
  name: "Tresillo / Syncopated",
  archetype: "3-3-2",
  bpmHint: 102,
  focus: "Dotted three-against-two pulse with snares landing off the grid.",
  genres: ["Reggaeton", "Dancehall", "Afrobeat", "Amapiano", "Baile Funk"],
  defaultPicks: { kick: 0, snare: 1, hat: 2, perc: 1 },
  rows: [
    { kick: "X-----X-----X---", snare: "--------X-------", hat: "x---x---x---x---", perc: "----------------" },
    { kick: "X-----X---X-----", snare: "------X-------X-", hat: "x-x-x-x-x-x-x-x-", perc: "x-x-x-x-x-x-x-x-" },
    { kick: "X--X--X---X--X--", snare: "------X---g---Xg", hat: "x-xx-xx-x-xx-xxx", perc: "xx-xxx-xxx-xxx-x" },
    { kick: "X-xX--X-x-X--X-x", snare: "--g---X-g-x---Xr", hat: "xx-x-xxx-x-xxxxr", perc: "XxxrXxxrXxxrXxxr" },
  ],
})

/** Bank 5 — Broken / Breakbeat. Ghost snares, offbeat kicks, shuffle hats. */
const BROKEN = makeBank({
  id: "broken",
  name: "Broken / Breakbeat",
  archetype: "Breakbeat",
  bpmHint: 152,
  swing: 0.35,
  focus: "Rolling ghost snares, syncopated kicks and a limping hat shuffle.",
  genres: ["Drum & Bass", "Jungle", "Breakbeat", "2-Step UK Garage", "Funk"],
  defaultPicks: { kick: 2, snare: 2, hat: 1, perc: 1 },
  rows: [
    { kick: "X-----------X---", snare: "----X-------X---", hat: "x---x---x---x---", perc: "----------------" },
    { kick: "X-----X-x-----x-", snare: "----X-------X--g", hat: "-x-x-x-x-x-x-x-x", perc: "--------x-------" },
    { kick: "X-x-X---x-X-x---", snare: "----X-g-x---X-gx", hat: "x-xx-xxx-xx-xxx-", perc: "--x---x---x---x-" },
    { kick: "X-x-X-x-x-X-x-x-", snare: "--g-X-g-x-g-X-gr", hat: "xxxrxx-xxrxxx-xx", perc: "--xr-x--xr-x--xr" },
  ],
})

export const BANKS: readonly Bank[] = [STRAIGHT, HALFTIME, TRAP, TRESILLO, BROKEN]

export function getBank(id: string): Bank | undefined {
  return BANKS.find((b) => b.id === id)
}

export function defaultBank(): Bank {
  return getBank(DEFAULT_BANK_ID) ?? BANKS[0]
}

// ---------------------------------------------------------------------------
// Curated rigs: named pad selections, three per bank.
// ---------------------------------------------------------------------------

interface RigSpec {
  bank: Bank
  id: string
  name: string
  blurb: string
  picks: Record<DrumVoice, ClipTier>
  kitId: string
}

function preset(spec: RigSpec): Groove {
  const kit = getKit(spec.kitId) ?? defaultKit()
  return createRig(spec.bank, spec.picks, kit, {
    id: spec.id,
    name: spec.name,
    blurb: spec.blurb,
    source: "card",
  })
}

export const RIG_PRESETS: readonly Groove[] = [
  preset({ bank: STRAIGHT, id: "straight:four-on-the-floor", name: "Four on the Floor", blurb: "Clean rooms, clean kicks. The default pulse.", picks: { kick: 1, snare: 1, hat: 2, perc: 1 }, kitId: "clean-room" }),
  preset({ bank: STRAIGHT, id: "straight:warehouse", name: "Warehouse", blurb: "Sixteenth hats and a shove on the 'and'.", picks: { kick: 1, snare: 0, hat: 3, perc: 2 }, kitId: "studio-driver" }),
  preset({ bank: STRAIGHT, id: "straight:disco-lift", name: "Disco Lift", blurb: "Open hats, pickup claps, congas on the tail.", picks: { kick: 1, snare: 2, hat: 2, perc: 2 }, kitId: "dub-echo" }),

  preset({ bank: HALFTIME, id: "halftime:boom-bap-core", name: "Boom Bap Core", blurb: "One and three, ghosts between. Dust included.", picks: { kick: 1, snare: 1, hat: 1, perc: 1 }, kitId: "lofi-dirt" }),
  preset({ bank: HALFTIME, id: "halftime:dusty-pocket", name: "Dusty Pocket", blurb: "Late kicks, lazy hat, rimshot answering.", picks: { kick: 2, snare: 2, hat: 0, perc: 2 }, kitId: "lofi-dirt" }),
  preset({ bank: HALFTIME, id: "halftime:slow-grind", name: "Slow Grind", blurb: "Busy ghosts and a dragging kit. Wide windows.", picks: { kick: 3, snare: 3, hat: 2, perc: 3 }, kitId: "halftime-hull" }),

  preset({ bank: TRAP, id: "trap:trap-roll", name: "Trap Roll", blurb: "Sparse lows, rolling hats, clap on three.", picks: { kick: 1, snare: 1, hat: 2, perc: 0 }, kitId: "studio-driver" }),
  preset({ bank: TRAP, id: "trap:drill-slide", name: "Drill Slide", blurb: "Sliding kick placement and 32nd hat stutters.", picks: { kick: 2, snare: 3, hat: 1, perc: 1 }, kitId: "syncopator" }),
  preset({ bank: TRAP, id: "trap:stutter-hat", name: "Stutter Hat", blurb: "Maximum hat motion over a broken low end.", picks: { kick: 3, snare: 2, hat: 3, perc: 2 }, kitId: "syncopator" }),

  preset({ bank: TRESILLO, id: "tresillo:dembow", name: "Dembow", blurb: "Three against two. The snare answers off the grid.", picks: { kick: 0, snare: 1, hat: 2, perc: 1 }, kitId: "dub-echo" }),
  preset({ bank: TRESILLO, id: "tresillo:amapiano-log", name: "Amapiano Log", blurb: "Log-drum sixteenths under a dotted kick.", picks: { kick: 2, snare: 2, hat: 3, perc: 3 }, kitId: "dub-echo" }),
  preset({ bank: TRESILLO, id: "tresillo:baile-stomp", name: "Baile Stomp", blurb: "Accented tresillo and shaker pressure.", picks: { kick: 3, snare: 2, hat: 1, perc: 3 }, kitId: "studio-driver" }),

  preset({ bank: BROKEN, id: "broken:amen-chops", name: "Amen Chops", blurb: "Offbeat kicks and rolling ghost snares.", picks: { kick: 2, snare: 2, hat: 1, perc: 0 }, kitId: "studio-driver" }),
  preset({ bank: BROKEN, id: "broken:jungle-roll", name: "Jungle Roll", blurb: "Maximum breakbeat motion with hat rolls.", picks: { kick: 3, snare: 3, hat: 3, perc: 2 }, kitId: "syncopator" }),
  preset({ bank: BROKEN, id: "broken:2-step-shuffle", name: "2-Step Shuffle", blurb: "Limping hats over a garage skip.", picks: { kick: 1, snare: 1, hat: 2, perc: 1 }, kitId: "lofi-dirt" }),
] as const

export function getRigPreset(id: string): Groove | undefined {
  return RIG_PRESETS.find((r) => r.id === id)
}

export function rigsForBank(bankId: string): Groove[] {
  return RIG_PRESETS.filter((r) => r.bankId === bankId).map(cloneGroove)
}

/** The rig a fresh session starts on. */
export function defaultRig(): Groove {
  return cloneGroove(RIG_PRESETS[0])
}
