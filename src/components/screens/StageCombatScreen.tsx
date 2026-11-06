import { CombatLog } from "@/components/CombatLog"
import { Hichord } from "@/components/stage/Hichord"
import { LoopStrip } from "@/components/stage/LoopStrip"
import { StageBoard } from "@/components/stage/StageBoard"
import { StageFoes, StageParty } from "@/components/stage/StageCombatants"
import { Button } from "@/components/ui/button"
import { STAGE_BPM } from "@/game/stageMusic"
import { useSessionStore } from "@/state/useSessionStore"

/** Clip-queue combat: pick sounds, steer the harmony, let the loop fight. */
export function StageCombatScreen() {
  const stage = useSessionStore((s) => s.stage)
  const togglePlay = useSessionStore((s) => s.togglePlay)
  const encounters = useSessionStore((s) => s.encounters)
  const currentEncounterId = useSessionStore((s) => s.currentEncounterId)
  const encounter = encounters.find((e) => e.id === currentEncounterId)

  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 animate-in fade-in duration-300 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{encounter ? encounter.name : "Combat Arena"}</h1>
          <p className="font-mono text-xs text-muted-foreground">
            Key: <span className="font-semibold text-primary">{stage.key.tonic} {stage.key.scale}</span> · {STAGE_BPM} bpm
            halftime · pads join on the next loop, chords on the next bar
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => togglePlay()}
          className="text-xs text-muted-foreground hover:border-destructive hover:text-destructive">
          Halt / Retreat ✕
        </Button>
      </header>

      <main className="grid flex-1 items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)_240px]">
        <section aria-label="Foes and log" className="flex flex-col gap-4">
          <StageFoes />
          <div className="max-h-56 overflow-y-auto rounded-md border border-border/80 bg-muted/10 p-3">
            <CombatLog entries={stage.log} />
          </div>
        </section>

        <section aria-label="Stage" className="flex min-w-0 flex-col gap-4">
          <LoopStrip />
          <StageBoard />
          <Hichord />
        </section>

        <StageParty />
      </main>
    </div>
  )
}
