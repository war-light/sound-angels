# sound-angels

A Dark Room-like browser game where music is combat. Text, buttons, and step grids as DOM elements.

## Stack

| Layer       | Choice                          | Why                                                        |
| ----------- | ------------------------------- | ---------------------------------------------------------- |
| Build       | Vite                            | Fast dev server, static output, no SSR needed              |
| UI          | React + Tailwind v4 + shadcn    | Dark Room look: text, buttons, step grids                  |
| State       | Zustand                         | UI/meta state (resources, unlocks, loadout)                |
| Audio       | Tone.js                         | Transport, scheduling, built-in synths/drums, no samples   |
| Theory      | Vendored tables in `src/game/theory.ts` | Minimal degrees/romans/transpose with zero deps; Tonal.js dropped (all published lines ship a broken `main` entry — re-adopt when fixed) |
| Persistence | localStorage versioned JSON     | Music model is serializable, no backend at first           |
| Tests       | Vitest                          | Combat sim is pure TS, tested without audio                |
| Hosting     | Cloudflare Pages / Vercel / itch.io | Any static host works                                  |

Live music and combat state stays outside React (`src/audio/`). UI/meta state in Zustand (`src/state/`).

## Scripts

- `pnpm dev` — dev server
- `pnpm build` — typecheck + static build to `dist/`
- `pnpm preview` — preview production build
- `pnpm test` — Vitest run
- `pnpm test:watch` — Vitest watch
- `pnpm lint` — Oxlint

## Layout

```
src/
  components/ui/  # shadcn
  lib/utils.ts    # cn()
  state/          # zustand stores
  audio/          # Tone.js engine (outside React)
  game/           # pure TS combat + music model
  persistence/    # versioned localStorage saves
  test/setup.ts
```

## Save format

`localStorage["sound-angels-save"]` = `{ version: 1, state: ... }`.
