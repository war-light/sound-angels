# Game Design Specification: Polyphonic Active Time Battle (PATB)

---

## 1. Executive Summary & Design Vision

**Title Concept:** _Polyphonic ATB_  
**Genre:** Musical Active Time Battle (ATB) / Rhythm Deckbuilder / DAW-Sequencer RPG  
**Core Hook:** Real-time musical composition _is_ your combat engine. You do not wait for static turns: harmony provides continuous buffs, lead instruments loop automated attack motifs, percussion generates rhythmic defense, and defensive phases play out on a dynamic rhythm highway.

---

## 2. Party Architecture & Role Allocation

Combatants are represented as **Musician Cards**. Before battle, the player slots characters from their deck into three functional band positions:

```
[ BACKLINE: Support ]            [ FRONTLINE: Combatants ]
┌───────────────────────────┐    ┌───────────────────────────────────┐
│ • Harmonizer (Chords)     │    │ • Soloist 1 (Lead Instrument)     │
│ • Rhythm Keeper (Groove)  │    │ • Soloist 2 (Optional Melody)     │
└───────────────────────────┘    │ • Soloist 3 (Optional Melody)     │
                                 └───────────────────────────────────┘
```

| Role                           | Capacity                                   | Functional Duty                                                   | Combat Translation                                                            |
| :----------------------------- | :----------------------------------------- | :---------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| **Harmonizer** _(Chordsmith)_  | 1 Instrument Card                          | Holds and advances the underlying Chord Progression.              | Emits ambient party-wide auras, passive buffs, and dictates note constraints. |
| **Soloists** _(Attackers)_     | 1 to 3 Instrument Cards                    | Sequence melodic loops onto active horizontal timeline lanes.     | Direct damage, element application, and status procs per note played.         |
| **Rhythm Keeper** _(Defender)_ | 1 Instrument Card _(Drums or Arpeggiator)_ | Operates the 4x4 Groove Matrix and shields the party during QTEs. | Generates active parries, damage mitigation, and timing-window bonuses.       |

---

## 3. The Four Core Pillars

```
                     ┌───────────────────────────────┐
                     │     1. HARMONIC ENGINE        │
                     │    (Diatonic Chords/Auras)    │
                     └───────────────┬───────────────┘
                                     │ Dictates Scale & Pitch
             ┌───────────────────────┴───────────────────────┐
             ▼                                               ▼
┌─────────────────────────┐                     ┌─────────────────────────┐
│   2. MELODIC SEQUENCER  │                     │    3. GROOVE MATRIX     │
│ (Attack Loops: 1-3 Inst)│                     │ (4x4 Drum/Arp Defense)  │
└────────────┬────────────┘                     └────────────┬────────────┘
             │ Executes Damage                               │ Defends / Cleanses
             └───────────────────────┬───────────────────────┘
                                     │ Transitions Into
                     ┌───────────────▼───────────────┐
                     │      4. CADENCE HIGHWAY       │
                     │  (Piano-Roll QTE / Parries)   │
                     └───────────────────────────────┘
```

---

### Pillar 1: The Harmonic Engine (Chords & Key Centers)

The Harmonic Engine runs on an unbroken musical measure loop (4 bars in 4/4 time).

- **Scale Constraint:** At the start of combat, the **Root Key** is already established (e.g., _C Major_ or _A Minor_). The player uses the Harmonizer to record a loop. Available 7 diatonic degrees (`I` through `vii°`) plus harmonic extensions/modifiers (`7th`, `sus4`, `dim`, `aug`). The game provides a set of default chord progressions for early levels that the player can just select, but advanced modes allow custom chord creation pre and mid battle.
- **Harmonic Auras:** Every instrument has a different effect when positioned as Chordsmith. Example:
  - Violin: Bleeds enemy dealing damage over time.
  - Piano: Absorbs 10% damage.
  - Guitar: Increases damage taken and damage dealt in 10%.
- **Mid-Battle Modulation:** Switching the chord progression will mute all attacking instruments. The player records a new progression. When they finish, the new progression loops and the instruments resume their attacks harmonized in the new progression. If the user picks a pre made progression (one of the default ones or one they have saved) the game will automatically adjust the instruments to match. Switches allways await to the beginning of the next bar to avoid mid bar chaos.

#### Custom Chord Crafting: Harmonic Viability Metric (HVM)

In advanced modes, players construct custom progressions. To prevent chaotic or dissonant exploits, every custom progression is evaluated through the algorithmic **Harmonic Viability Metric (HVM)**

```
Algorithm explained here
```

_Progressions with an HVM below 60 fail to activate combat auras; progressions scoring 90+ grant amplified passive buffs (Critical Rate, Shield Generation)._

---

### Pillar 2: The Melodic Sequencer (Live Attack Loops)

Each Soloist commands a horizontal step-sequencer lane running in continuous synchronization with the combat clock (e.g., a 16-step bar).

- **Input Mapping:** Soloist inputs are mapped to `QWERT`. Notes automatically snap to the valid pitch set dictated by the Harmonizer’s active chord.
- **Live Step Recording:** Pressing a directional key records a note attack at the exact timeline subdivision the cursor is crossing.
- **Dynamic Articulation:**
  - **Staccato (Short Tap):** Instant input; places a rapid single-step note.
  - **Tenuto / Fermata (Long Hold):** Holding the input spans the note across multiple subdivisions.
- **Loop Repetition & Decay:** Recorded notes automatically replay on every loop, firing attacks as the cursor passes over them. However, notes experience **Melodic Decay**:
  - Amplitude and damage drop by 25% per loop cycle.
  - By Loop 4, the track goes completely silent, forcing the player to record fresh motifs.
- **Motif Fingerprinting (Anti-Spam Hash):**  
  Whenever a melody is finished, the game generates a quantized hash of its rhythm and intervals. If a player attempts to bypass cooldowns by deleting a decaying motif and re-recording the exact same sequence, the system identifies the fingerprint, blocks execution, and imposes a **Dissonance Penalty** (temporary lock on that soloist’s lane).

---

### Pillar 3: The Groove Matrix (Percussion / Arpeggiator)

Operated by the Rhythm Keeper via a 4x4 grid:

```
[  PAD 0-1  ] [  PAD 1-1  ] [  PAD 2-1  ] [  PAD 3-1  ]
[  PAD 0-2  ] [  PAD 1-2  ] [  PAD 2-2  ] [  PAD 3-2  ]
[  PAD 0-3  ] [  PAD 1-3  ] [  PAD 2-3  ] [  PAD 3-3  ]
[  PAD 0-4  ] [  PAD 1-4  ] [  PAD 2-4  ] [  PAD 3-4  ]
```

Column 1: Kick / Foundation
Column 2: Snare / Clap / Backbeat
Column 3: Hi-Hats / Shakers / Timekeepers
Column 4: Percussion / Fills / Texture

- **Drums Instruments (Kits):** A drum instrument is a **kit** that owns only timbre and its combat effect — base, Lo-Fi Dirt, Halftime Hull, Dub Echo, etc. Kits are a free choice, like the swing feel: any kit can play any pattern, and swapping a kit never changes the pattern.
- **Banks:** The grid pages through five rhythmic archetype banks — Straight Pulse, Halftime / Boom-Bap, Trap / Drill, Tresillo / Syncopated, Broken / Breakbeat. A bank switch swaps the whole grid's clips and brings its own swing feel; the BPM never changes mid-fight.
- **Tiers (rows):** Each column is one voice and each row is a complexity tier — _Sparse, Steady, Driving, Complex_. Every pad is one voice's complete 16-step bar; tapping a pad drops that clip into its column. Exactly one pad per column is active, and every column may rest (a fully silent rig is legal).
- **Presets & Bottles:** A wide variety of presets can be picked mid-fight, default and user-made (bottled in the Studio), presented as a list under the grid. Picking one, or tapping a pad, queues the switch for the next loop boundary.

---

### Pillar 4: The Cadence Highway (Defense & Utility QTE)

A 4-lane vertical scrolling highway (DDR / _Friday Night Funkin'_ / Piano Roll style) that handles defensive parrying and macro execution.

- **Enemy Offensive Salvo:** Every $X$ loops (generally 4 to 6), an enemy initiates an attack phase.
  - Frontline melody tracks **mute** temporarily to shift focus to the defense phase.
  - The enemy casts a procedurally generated melodic arpeggio (conforming to the active harmony) that descends down the 4 lanes.
  - The player uses `WASD` to hit incoming notes:
    - **Perfect Hit:** Complete parry (0 damage taken, reflects a portion of damage back).
    - **Good Hit:** Partial block (player takes chip damage through shields).
    - **Miss:** Full unmitigated damage + party stagger (deletes active sequencer steps).
  - Salvos last between **2 to 4 bars**. Once resolved, frontline melody tracks unmute and resume their attacks.
- **Macro Presets & Modulations:** Activating pre-recorded melody cards or changing chord progressions also renders a brief highway pattern that must be cleared to successfully deploy.

---

## 4. Combat Mechanics & Calculations

### Stats & Attributes

- **Health Points (HP):** Direct vitality; depleted when shields drop.
- **Harmonic Resonance (Shields):** Absorbs incoming damage. Maintained via perfect rhythm inputs and strong progression syntax.
- **Status Cadences:**
  - _Vibrato (Poison/DoT):_ Inflicts periodic damage on the downbeat of every bar.
  - _Crescendo (Stacking Buff):_ Increases note strike power for every consecutive loop without a missed input.
  - _Dissonance (Stun/Debuff):_ Locks out sequencer lanes.

### Target Selection & Attack Dynamics

$$\text{Damage Applied} = \text{Base Instrument Damage} \times \text{Articulation Multiplier} \times \text{Harmonic Aura Multiplier}$$

- **Targeting Logic:** Individual notes fired from melody sequencers hit targets semi-randomly, weighted by attack type:
  - **Staccato Notes (Taps):** Fire low-damage, rapid-hit ticks. Targets low-HP swarm units automatically.
  - **Tenuto Notes (Holds):** Slower to trigger, high evade window for agile enemies, but packs heavy burst damage. Automatically weights toward high-armor/tank enemies.
- **Harmonic Penalties:** Playing notes outside the active chord key triggers an automatic counter-attack from enemies with the **Tonal Retaliation** trait.

---

## 5. Enemy Architecture & Encounter Design

Enemies are placed on the left side of the battlefield and act as dynamic counter-melodies:

```
[ ENEMY ARCHETYPES ]
├── SWARM / CHORUS UNITS:
│   └── High evasion against sustained Tenuto notes.
│   └── Vulnerable to rapid, multi-instrument Staccato bursts.
│
├── HARMONIC TANKS:
│   └── High raw defense; immune to light taps.
│   └── Armor cracked exclusively by sustained Tenuto holds and high-HVM cadences.
│
└── DISRUPTOR BOSSES:
    └── Reflects notes that fall outside the current chord.
    └── "Track Eraser": Erases an active soloist's sequencer loop on unblocked hits.
    └── Chip Damage: Blocks only reduce damage to 15%; requires active shields.
```

There are more not included yet

---

## 6. Combat Flow Example

1. **Phase 1: Harmonic Setup**
   Player locks in a starting progression: `[ Cmaj7 — Am7 — Dm7 — G7 ]`. The Harmonizer starts looping the harmony, applying an active attack-up aura. The battle tempo is locked at 120 BPM.
2. **Phase 2: Melody Laydown**
   - Soloist 1 (Violin) lays down short staccato attacks using `QWERQWER` on steps 1, 3, 5, and 7. The loop starts dealing rhythmic DoT to enemy swarm cards.
   - Soloist 2 (Piano) holds a tenuto note (`D`) across steps 9 through 12, dealing heavy impact damage to the elite tank enemy.
3. **Phase 3: Enemy Salvo (Cadence Highway Active)**
   At the end of loop 4, the boss initiates a 2-loops attack. Soloist audio mutes. An arpeggiated stream of notes descends down the Cadence Highway. The player hits the notes using `WASD` to deflect the assault, taking only minor chip damage to their shields.
4. **Phase 4: Resume & Recover**
   Soloists unmute. The old violin melody has decayed. The player selects a pre-recorded Violin Motif Card, clears a quick 4-note input cascade, and the sequence instantly starts playing on the loop station again.

---

## 7. UI / Screen Layout Specification

The combat screen is divided into three distinct zones:

```
┌───────────────────────────┬───────────────────────────────────┬───────────────────────────┐
│        ZONE 1: LEFT       │           ZONE 2: CENTER          │       ZONE 3: RIGHT       │
│      (Enemy Encampment)   │      (The Sequencer Console)      │      (Player Ensemble)    │
├───────────────────────────┼───────────────────────────────────┼───────────────────────────┤
│                           │      [ CHORD WHEEL & PROGRESSION] │                           │
│  [Enemy Card 1]           │      Active: [Cmaj7-Am7-Dm7-G7]   │  [Soloist 1: Violin]      │
│  HP: [||||||||||]         │                                   │  HP: [||||||||||]         │
│                           │  - - - - - - - - - - - - - - - -  │                           │
│                           │  SOLOIST 1 SEQUENCER LANE         │  [Soloist 2: Piano]       │
│  [Enemy Card 2]           │  [•][ ][•][ ][•][ ][•][ ][ ][ ]   │  HP: [||||||||||]         │
│  HP: [||||||||||]         │  - - - - - - - - - - - - - - - -  │                           │
│  Shield: [||    ]         │  SOLOIST 2 SEQUENCER LANE         │  [Soloist 3: Synth]       │
│                           │  [ ][ ][ ][ ][ ][ ][ ][•═════•]   │  HP: [||||||||||]         │
│  [Boss Card]              │  - - - - - - - - - - - - - - - -  │  - - - - - - - - - - - -  │
│  HP: [||||||||||||||||]   │  4x4 GROOVE MATRIX (Rhythm/Arp)   │  [Chordsmith: Guitar]     │
│  Shield: [||||||||  ]     │  [■][ ][ ][ ] [ ][■][ ][ ]        │                           │
│                           │  [ ][ ][■][ ] [ ][ ][ ][■]        │  [Drums: Drum v2]         │
│                           │  ═══════════════════════════════  │                           │
│                           │  CADENCE HIGHWAY (Pop-Up / QTE)   │                           │
│                           │     [W]   [A]   [S]   [D]         │                           │
│                           │      |     |     ▼     |          │                           │
└───────────────────────────┴───────────────────────────────────┴───────────────────────────┘
```

### Visual Component Breakdown

- **Zone 1 (Left - Enemy Encampment):**
  - Enemy cards are organized vertically, showing remaining HP, Harmonic Shield bars, elemental/instrument affinities, and intent indicators (upcoming attack cadence).
- **Zone 2 (Center - The Sequencer Console):**
  - **Top:** The **Chord Wheel**, showing the active key, the progression stages, and a step counter for the current measure.
  - **Mid:** The **Sequencer Stack**, showing dynamic, color-coded horizontal lanes for each active soloist. A unified playhead sweeps from left to right across all lanes in real-time.
  - **Lower-Mid:** The **Groove Matrix**, a 4x4 interactive step-pad display that tracks percussion patterns or auto-arpeggiator output.
  - **Bottom Overlay:** The **Cadence Highway**, a 4-lane vertical drop highway that expands during enemy salvos, chord modulations, and macro sequence casts.
- **Zone 3 (Right - Player Ensemble):**
  - **Frontline Cards:** Displays Soloists 1 to 3 with dynamic performance meters, equipped instrument types, and decay timers for their respective sequencers.
  - **Backline Cards:** Dedicated slots for the Harmonizer and Rhythm Keeper, monitoring active aura strengths, parry cooldowns, and defense shield levels.
