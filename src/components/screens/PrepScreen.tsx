import { useState } from "react"
import { useSessionStore } from "@/state/useSessionStore"
import { EncounterBanner } from "@/components/EncounterBanner"
import { MelodyBankBar } from "@/components/MelodyBankBar"
import { PhaseStrip } from "@/components/PhaseStrip"
import { ChordPicker } from "@/components/ChordPicker"
import { StepGrid } from "@/components/StepGrid"
import { PartyCorner } from "@/components/PartyCorner"
import { FIGHT_KEYS, keyEquals } from "@/game/keys"
import { Button } from "@/components/ui/button"
import { TutorialModal } from "@/components/TutorialModal"
import { loadTutorialSeen, saveTutorialSeen } from "@/persistence/storage"

export function PrepScreen() {
  const toMenu = useSessionStore((s) => s.toMenu)
  const togglePlay = useSessionStore((s) => s.togglePlay)
  const starting = useSessionStore((s) => s.starting)
  const bpm = useSessionStore((s) => s.arrangement.bpm)
  const key = useSessionStore((s) => s.arrangement.key)
  const nextKey = useSessionStore((s) => s.nextKey)
  const setBpm = useSessionStore((s) => s.setBpm)
  const setKey = useSessionStore((s) => s.setKey)
  const setRandomKey = useSessionStore((s) => s.setRandomKey)

  const [guideOpen, setGuideOpen] = useState<boolean>(() => !loadTutorialSeen())

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={toMenu} className="text-muted-foreground hover:text-foreground">
            ← Title
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Battle Preparation</h1>
            <p className="text-xs text-muted-foreground">Harmonize chords, arrange looped melodies, and seat your voices.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGuideOpen(true)}
            className="text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
          >
            <span>Guide</span>
            <span>📖</span>
          </Button>

          <Button
            size="lg"
            onClick={() => togglePlay()}
            disabled={starting}
            className="font-bold tracking-wide shadow-md bg-primary hover:bg-primary/90 text-primary-foreground px-6"
          >
            {starting ? "Tuning Instruments…" : "Engage Combat ⚔"}
          </Button>
        </div>
      </header>

      {/* Selected Encounter Trial Banner */}
      <EncounterBanner />

      {/* Main 2-Column Workstation */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Left Column: Music Composer & Chords */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Audio Tuning Strip (Key + BPM) */}
          <div className="border border-border/70 rounded-lg p-3 bg-card/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Key:</span>
              <div className="flex flex-wrap items-center gap-1">
                {FIGHT_KEYS.map((k) => {
                  const active = keyEquals(nextKey ?? key, k)
                  return (
                    <Button
                      key={`${k.tonic}-${k.scale}`}
                      variant={active ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs px-2.5"
                      onClick={() => setKey({ tonic: k.tonic, scale: k.scale, octave: 4 })}
                    >
                      {k.tonic} {k.scale}
                    </Button>
                  )
                })}
                <Button
                  variant={nextKey == null ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={setRandomKey}
                  title="Randomize key for next combat"
                >
                  ⚄ Random
                </Button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-mono uppercase text-muted-foreground">
              <span>Tempo: {bpm} bpm</span>
              <input
                type="range"
                min={60}
                max={140}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-24 accent-primary"
              />
            </label>
          </div>

          {/* Harmonic Progression */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Harmonic Progression</span>
              <span className="text-[11px] text-muted-foreground">Pre-fight picks apply free</span>
            </div>
            <PhaseStrip />
            <ChordPicker />
          </div>

          {/* Melody Templates Bank */}
          <MelodyBankBar />

          {/* Loop Sequencer Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Battle Loop Sequencer</span>
              <span className="text-[11px] text-muted-foreground">Click to place notes · WASD to sing live</span>
            </div>
            <StepGrid />
          </div>
        </div>

        {/* Right Column: Party Positions */}
        <div className="flex flex-col gap-4">
          <div className="border border-border/80 rounded-lg p-3 bg-card/60 backdrop-blur">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Party Formation</h3>
            <PartyCorner />
          </div>

          {/* Tactical Roles Guide */}
          <div className="border border-border/60 rounded-lg p-3 text-xs space-y-2 bg-muted/10 text-muted-foreground">
            <span className="font-semibold text-foreground block">Position Roles</span>
            <p><strong>Back · Chords:</strong> Plays harmonic pad stabs at each bar start. Buffs/wards party.</p>
            <p><strong>Back · Beat:</strong> Colors rhythm kit & plays chord-fitting bass arpeggio with WASD.</p>
            <p><strong>Front · Attackers:</strong> Up to 3 melody tracks recorded in the loop station that strike enemies every loop.</p>
          </div>
        </div>
      </div>

      <TutorialModal
        isOpen={guideOpen}
        onClose={() => {
          setGuideOpen(false)
          saveTutorialSeen(true)
        }}
      />
    </div>
  )
}

