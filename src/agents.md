# AGENTS.md — Development Guidelines & Architecture

## 1. Project Overview

A music-theory-driven idle/ATB combat browser game built with **Vite + React + TypeScript**.

- **Combat & Loops:** ATB-style combat synchronized with a musical loop transport. Actions modify harmony, melody, and rhythm.
- **Enemies:** Call-and-response entities executing deterministic musical patterns (retrograde, inversions, dissonances, syncopations).
- **Audio & Theory:** Sound synthesis handled via **Tone.js**; music theory logic handled via **Tonal.js** (`@tonaljs/tonal`).

---

## 2. Hard Invariants & Golden Rules

1. **Strict Three-Layer Separation:**
   - **`src/engine`** must remain 100% pure TypeScript. It may import `@tonaljs/tonal` for theory, but **NEVER** Tone.js, React, or browser DOM APIs.
   - **`src/audio`** is purely a renderer. It reads data models from `src/engine` and interfaces with Tone.js. It never writes combat rules or mutates engine state directly.
   - **`src/ui`** renders React components and dispatches user actions into the engine. UI state lives in Zustand; engine state lives outside React.

2. **Headless & Serializable by Design:**
   - The entire combat simulation, music arrangement model, and progression **must be 100% runnable in headless unit tests** (Vitest in Node/jsdom).
   - All game state, arrangement patterns, and combat states must be serializable to plain JSON. No instances of classes with internal cyclic audio refs.

3. **Music as Data (Relative, Not Absolute):**
   - Store melody lines as **scale degrees** (e.g., `1, 3, 5, 7`) and chords as **Roman numerals / functions** (e.g., `I`, `vi`, `IV`, `V7`).
   - Do **NOT** hardcode MIDI numbers or absolute note names (like `'C4'`) in combat/engine logic. Absolute pitches are only resolved at the boundary when rendering through Tonal/Tone.
   - Modulations (changing key or mode) must transpose the entire composition mathematically without breaking voice leading.

4. **Audio Lifecycle & Web Audio Safety:**
   - Tone.js audio context starts **only** upon explicit user gesture (`Tone.start()`). Never initialize or start audio automatically on page load.
   - Do **not** allocate new `Tone.Synth` instances on every step/note. Synths must be pooled or pre-allocated to avoid memory leaks and mobile Web Audio thread crashes.

---

## 3. Directory Layout & Module Responsibilities

```text
src/
├── engine/              # PURE TypeScript. Zero DOM/Tone.js dependencies.
│   ├── theory/          # Tonal.js wrappers (scales, Roman numerals, tension math)
│   ├── arrangement/     # Loop data models (tracks, bars, steps, quantization)
│   ├── combat/          # ATB loop, resolution burst math, enemy counters
│   └── idle/            # Offline progress, resource generation, vocabulary unlocks
├── audio/               # Tone.js bridge (browser-only)
│   ├── context.ts       # AudioContext activation, master bus, volume control
│   ├── synths.ts        # Synth presets, drum voice pools, effects chain
│   ├── transport.ts     # Tone.Transport sync, step scheduling
│   └── player.ts        # Translates engine arrangement snapshots to Tone events
├── ui/                  # React + Tailwind
│   ├── components/      # Step sequencer grid, chord picker, ATB lane
│   ├── hooks/           # Subscriptions to engine ticks, audio status
│   └── stores/          # Zustand stores for UI menus, unlocked vocabulary, settings
├── data/                # Static balance data
│   ├── enemies.ts       # Enemy profiles, patterns (Echo, Mirror, Tritone, etc.)
│   ├── scales.ts        # Mode definitions, unlock progression
│   └── chords.ts        # Functional chord groupings (Tonic, Predominant, Dominant)
└── types/               # Shared domain interfaces
```
