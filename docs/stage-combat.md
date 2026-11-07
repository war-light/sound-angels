# Stage combat: handoff notes

Status as of 2026-11-06. Nothing is committed yet.

## Why

The step-sequencer fight (live WASD melody recording, QTE/parry charts, melody
cards) was too complex to be worth it. The replacement is closer to Incredibox:

- The player picks from a fixed set of clips. A clip is a whole
  melody, bassline or beat, not a single note.
- Each pick joins (or leaves) at the start of the **next loop**. Nothing on a
  timeline can be edited.
- A **hichord** (7 diatonic chords + one modifier) is how the player
  experiments. It's easy, it never sounds wrong, and every clip re-voices
  itself to fit the chord.
- One house style, polished: **170 bpm halftime, broken breaks, reese bass,
  orchestral harmony, chip/Undertale lead**.

## How every mix stays safe

The trick is to write each clip within a few rules, so any combination works
without authoring every combination by hand. The rules live in
`src/game/stageMusic.ts`:

| Concern | Rule |
|---|---|
| Time | One tempo (170), one loop length (4 bars × 16 steps) for every clip. |
| Harmony | Pitched clips store **chord-tone ladder indices**, never pitches. Ornaments (scale neighbors) only on weak 16ths, length 1, and must resolve within 2 steps. |
| Chord changes | Notes never cross a bar line (the parser rejects it), so changing chord on a bar line is always safe. |
| Register | Each role owns a pitch range (`ROLE_SPECS`). Only bass goes below MIDI 48. |
| Space / interlock | Lead = call (bars 1 and 3, plus pickups at steps 12–15 of bars 2 and 4). Counter = answer (bars 2 and 4, steps 0–11). Bass never starts on steps 4/8/12, so it stays clear of the snare. |
| Frequency | Each role has its own synth and filter band in `src/audio/stage.ts`. |

The **mix linter** `src/data/stageClips.lint.test.ts` checks all of this for
6 keys × 28 chords, every clip pair, and all 1,024 mixes. On its first run it
caught counter-melody ornaments grinding a semitone against the harmony pad,
so counter clips now use chord tones only. **Run it after any clip edit.**

## Clip notation

Pitched clips have one 16-char string per bar. A clip can be 1, 2 or 4 bars;
shorter ones repeat to fill 4.

```
0-9  chord-tone ladder index      u / d  scale step above / below the last tone
X x  full chord (accent / soft)   -      hold       .  rest
```

Drums use the `groove.ts` notation: `X` accent, `x` hit, `g` ghost, `r`/`R`
roll, `-`/`.` rest. Snare accents (`X`) belong only on in-bar steps 4/8/12,
because that's what the bass ducks.

How ladder indices become pitches:

- Bass: the ladder starts on the chord root.
- Every other role: it starts on the lowest chord tone at or above the role's floor.

So the voice leading stays smooth automatically.

## Combat rules (`src/game/stageCombat.ts`)

- 1 step = one 16th. A bar resolves on its first step, and a loop starts every 64 steps.
- **Loop start:** tick buffs → apply queued clips → staggered foe strikes.
- **Each bar:** every active clip applies its `effect` (damage / shield / heal / expose).
- **Hichord multipliers:**
  - Tonic: support ×1.5.
  - Subdominant: damage ×1.25.
  - Dominant: +1 tension (+2 with a 7th).
  - sus4: +1 tension.
  - Plain tonic with tension: damage × (1 + 0.5 × tension), then tension resets. Max tension is 4.
  - Same chord for ≥3 bars → **stale**, everything ×0.75.
- **Combos** (`STAGE_COMBOS`): Battle Anthem, Glitch Storm, Requiem and Full
  Ensemble. Each is logged once when discovered and multiplies damage or adds an effect.
- **Foes:** one intro loop of grace. After that each foe strikes every
  `parryEveryLoops` loops for `baseAttack × 4`, strikes twice as often once
  enraged (≤25% HP), and foes are staggered by index.
  - `trackWipe` (Dust Moth) erases a random pitched clip.
  - `reflect` (Mirror) bounces 50% of damage landed on dominant/sus bars.
  - Horde (Mite) takes ×0.5 from bass/harmony and ×1.25 from breaks/lead.
- `advanceStage` catches up if steps were skipped.

## Wiring

- `session.ts`:
  - `stage` singleton, rebuilt from `fight` in `beginFight` and `resetAll`.
  - `toggleStageClip`, `pressStageChord`, `advanceStageTo`. `advanceStageTo` settles victory or defeat.
- `useSessionStore.ts`:
  - `combatMode: "stage" | "classic"` (default stage), plus `stage`, `chordMod`, `toggleChordMod`, `pressChord`, `toggleClip`.
  - `configureStage` is wired there, once.
- `src/audio/stage.ts`: the scheduler runs the engine **before** it renders each step, so
  whatever was committed on that step is exactly what plays. UI playhead
  updates go through `Tone.Draw`.
- UI:
  - `src/components/stage/`: `StageBoard`, `Hichord`, `LoopStrip`, `StageCombatants`.
  - `screens/StageCombatScreen.tsx`. `CombatScreen` routes by `combatMode`.
  - Prep has a **Mode: Stage / Classic** toggle.
  - `ResultOverlay` shows stage stats.
- Keys in stage combat: **1–7** chords, **Q/W/E** = 7th / sus4 / flip toggles.

## Files

New: `src/game/stageMusic.ts`, `src/game/stageCombat.ts` (+ test),
`src/data/stageClips.ts` (+ lint test), `src/audio/stage.ts`,
`src/components/stage/*`, `src/components/screens/StageCombatScreen.tsx`.

Edited: `session.ts`, `useSessionStore.ts`, `useWasd.ts`, `CombatScreen.tsx`,
`PrepScreen.tsx`, `ResultOverlay.tsx`, `CombatLog.tsx`, `screens.test.tsx`.

Untouched (uncommitted work from before): `MelodyCardBar.tsx`, `combat.ts`,
`parryChart.*`, `melodyGenerator.ts`, `melodyToArrangement.ts`.

Verified: `pnpm build` and `pnpm test` pass (455 tests), and `pnpm lint` is clean for the new files.
**Not verified: how it actually sounds.**

## Next steps

1. **Listen** (`pnpm dev` → Prep → Mode: Stage → Engage). Note which clips, sounds,
   mix balance or game feel are off.
2. Tune the sound: synth settings and levels in `src/audio/stage.ts`, the drum kit in
   `STAGE_KIT`. The snare will be thin. Probably move breaks/FX to samples, and
   bass/harmony/lead to `Tone.Sampler` so they stay chord-relative.
3. Balance: clip `effect` numbers in `stageClips.ts`, and the constants at the top of
   `stageCombat.ts`. Target is about 1–2 minutes per encounter.
4. Content: prototype new clips in a DAW first. Add them to `stageClips.ts`, then run
   the linter. Use `melodyGenerator.ts` offline to generate candidates, never
   at runtime.
5. Once stage mode sounds good, remove the classic path (StepGrid, QTE/parry,
   melody cards, WASD recording, Studio sequencer, the Prep melody sequencer) and
   update the encounter tips that mention WASD. Confirm first, because it deletes the
   uncommitted work listed above.
6. Commit, so the post-commit hook refreshes the graphify graph.

Open design ideas, not built: momentary (held) hichord modifiers, keyboard
shortcuts for clip pads, linking party members to roles (a downed character
mutes their instrument), letting the player pick which foe to focus.
