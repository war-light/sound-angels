import { useSessionStore } from "@/state/useSessionStore"
import { FoePanel } from "@/components/FoePanel"
import { PartyCorner } from "@/components/PartyCorner"
import { PhaseStrip } from "@/components/PhaseStrip"
import { PresetBar } from "@/components/PresetBar"
import { QtePanel } from "@/components/QtePanel"
import { StepGrid } from "@/components/StepGrid"
import { VoiceBar } from "@/components/VoiceBar"
import { CombatLog } from "@/components/CombatLog"
import { CombatFeedback } from "@/components/CombatFeedback"
import { Button } from "@/components/ui/button"

export function CombatScreen() {
  const fight = useSessionStore((s) => s.fight)
  const bpm = useSessionStore((s) => s.arrangement.bpm)
  const togglePlay = useSessionStore((s) => s.togglePlay)
  const encounters = useSessionStore((s) => s.encounters)
  const currentEncounterId = useSessionStore((s) => s.currentEncounterId)

  const encounter = encounters.find((e) => e.id === currentEncounterId)

  return (
    <div className="relative flex flex-col gap-4 p-4 sm:p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      <CombatFeedback />
      {/* Combat Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {encounter ? encounter.name : "Combat Arena"}
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Key: <span className="text-primary font-semibold">{fight.key.tonic} {fight.key.scale}</span> (locked) · Tempo: {bpm} bpm · Tick: {fight.tick}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => togglePlay()}
            className="text-xs text-muted-foreground hover:text-destructive hover:border-destructive"
          >
            Halt / Retreat ✕
          </Button>
        </div>
      </header>

      {/* 3-Column Combat Stage */}
      <main className="grid flex-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)_260px]">
        {/* Left: Enemies */}
        <section aria-label="Enemies">
          <FoePanel />
        </section>

        {/* Center: Harmonic Loop & Action QTE */}
        <section aria-label="Melody Loop and Performance" className="flex min-w-0 flex-col gap-4">
          <PhaseStrip />
          <StepGrid />
          <VoiceBar />
          <PresetBar />
          <QtePanel />
          <div className="border border-border/80 max-h-44 overflow-y-auto rounded-md p-3 bg-muted/10 font-mono text-xs">
            <CombatLog />
          </div>
        </section>

        {/* Right: Party Cards */}
        <section aria-label="Party Formation">
          <PartyCorner />
        </section>
      </main>
    </div>
  )
}

