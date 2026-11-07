import { Meter } from "@/components/Meter"
import { STAGE_BARS, STAGE_LOOP_STEPS, STAGE_STEPS_PER_BAR, chordLabel } from "@/game/stageMusic"
import { cn } from "@/lib/utils"
import { useSessionStore } from "@/state/useSessionStore"

/** Loop playhead (4 bars) + what the last bar did. */
export function LoopStrip() {
  const step = useSessionStore((s) => s.globalStep)
  const stage = useSessionStore((s) => s.stage)
  const loopStep = Math.max(0, step) % STAGE_LOOP_STEPS
  const loop = Math.floor(Math.max(0, step) / STAGE_LOOP_STEPS) + 1
  const report = stage.lastBar
  const pending = stage.pendingChord ? chordLabel(stage.key, stage.pendingChord) : null
  const queued = Object.keys(stage.queued).length

  return (
    <section aria-label="Loop" className="flex flex-col gap-2 rounded-lg border border-border/70 bg-card/40 p-3">
      <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
        <span>
          Loop {loop} · now <span className="font-semibold text-foreground">{chordLabel(stage.key, stage.chord)}</span>
          {pending && <span className="text-primary"> → {pending} next bar</span>}
        </span>
        {queued > 0 && <span className="text-primary">{queued} change{queued > 1 ? "s" : ""} on the next loop</span>}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: STAGE_BARS }, (_, b) => {
          const fill = Math.min(1, Math.max(0, (loopStep - b * STAGE_STEPS_PER_BAR + 1) / STAGE_STEPS_PER_BAR))
          return <Meter key={b} value={fill * 100} barClass="bg-primary/70" className="h-1.5" />
        })}
      </div>
      {report && (
        <p className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-muted-foreground">Bar {report.bar + 1}</span>
          <span className="font-semibold">{report.chord}</span>
          {report.damage > 0 && <span className="text-rose-300">⚔ {report.damage}</span>}
          {report.shield > 0 && <span className="text-sky-300">🛡 +{report.shield}</span>}
          {report.heal > 0 && <span className="text-emerald-300">✚ +{report.heal}</span>}
          <span className={cn(report.mult > 1 ? "text-amber-300" : "text-muted-foreground")}>×{report.mult}</span>
          {report.resolved > 0 && (
            <span className="rounded bg-amber-500/20 px-1.5 font-bold text-amber-300">RESOLVED</span>
          )}
          {report.stale && <span className="rounded bg-muted px-1.5 text-muted-foreground">stale chord</span>}
          {report.combos.map((c) => (
            <span key={c} className="rounded bg-primary/20 px-1.5 text-primary">✦ {c}</span>
          ))}
        </p>
      )}
    </section>
  )
}
