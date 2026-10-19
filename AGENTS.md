# AGENTS.md

Vite + React 19 + TS + Tailwind v4 + shadcn (`new-york/neutral`) + Zustand + Tone.js. Dark Room-like game where music is combat. Uses `pnpm` (`pnpm-lock.yaml`). Import alias `@/*` → `src/*` (see `vite.config.ts`, `tsconfig.app.json`).

## Commands

- `pnpm dev` — dev server; `pnpm preview` — preview `dist/`
- `pnpm build` — `tsc -b && vite build` (typecheck runs first; no standalone typecheck script)
- `pnpm test` — `vitest run`; single file: `pnpm vitest run src/game/<name>.test.ts`
- `pnpm lint` — `oxlint` (no format script)

## Architecture (do not blur)

- `src/game/` — pure TS combat + music model. No Tone.js, React, or DOM. All state JSON-serializable. Entry: `session.ts` (singleton outside React) → `combat.ts:advanceTick` (1 tick = 1 16th step).
- `src/audio/` — browser-only Tone.js renderer. Reads engine snapshots, never writes combat state. Single wiring: `configurePlayer` called once in `src/state/useSessionStore.ts`.
- `src/state/useSessionStore.ts` — thin Zustand mirror of `session.ts` via `subscribe()`; rules live in `src/game/`, sound in `src/audio/`.
- `src/components/`, `src/hooks/useWasd.ts`, `src/data/` (balance: enemies, chords, `beats.ts` drum banks, `kits.ts` drum kits), `src/lib/utils.ts` (`cn()`).
- Drum rig (`src/game/groove.ts` + `src/data/beats.ts`/`kits.ts`) — a `Bank` is a page of 16 clips (4 voices × 4 complexity tiers); a `Groove` is one clip pick per voice + `kitId` + `swing`. Kits own timbre *and* the combat `effect` (denormalized onto the rig on equip so `combat.ts` stays untouched). `perc` is the fourth voice. A clip is a 16-hit cell (`vel` + optional `roll`), not an offset list.

## Gotchas

- Theory is vendored in `src/game/theory.ts` (zero deps) — do NOT re-add Tonal.js; every published `tonal` line ships a broken `main` entry (see `theory.ts:4-9`, `README.md`).
- Music as data: engine stores scale degrees + Roman numerals; absolute MIDI/note names only at the `src/audio/player.ts` boundary (`degreeToMidi` / `romanToChord` / `midiToNote`). In minor keys V/V7 gets a raised third (`theory.ts`).
- Audio starts ONLY on user gesture via `ensureAudio()` (`src/audio/context.ts`); voices are pooled once in `src/audio/synths.ts` — never `new Synth` per note.
- Fight key is locked at `createFight`; `session.ts:beginFight` copies it onto the arrangement so grid/chords/audio preview in the combat key. Never mutate `fight.key` mid-fight.
- Melody lanes are front-row positions (`front[i]` = lane `i`): benching a fighter mutes its lane but keeps notes; potency fades `x0.75` per loop wrap, floor `0.25` (`combat.ts`).
- Drum rigs: bank/pad/kit/swing changes all queue to the next loop boundary (same pending mechanism as melody cards); a bank switch also carries its own swing. Kits are decoupled from patterns (a kit owns timbre *and* the combat effect), so drums are fully independent of party formation. `density` is gone — swing is the only tweak knob.
- Tests: Vitest + jsdom, `globals: true`, setup `src/test/setup.ts`. Combat tests use seeded `rng` — never import Tone.js in `src/game/`.
- TS is strict: `noUnusedLocals/Parameters`, `verbatimModuleSyntax` (use `import type`), `erasableSyntaxOnly` (no enums/namespaces/parameter properties).

## Hard Rules

- Never use in line styles. Use Tailwind classes or `cn()` for conditional classes. 
- If an element can be done as a Shadcn component, use Shadcn instead of raw HTML with tw classes.
- Never use `any` in TS unless strictly necessary.

## Graphify

- Check the graph before answering codebase questions and rebuild after code changes