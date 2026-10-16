import { cn } from "@/lib/utils"
import { scoreProgression } from "@/game/theory"
import { chordEffectFor } from "@/data/chords"
import { useSessionStore } from "@/state/useSessionStore"

/** Chord progression strip with live bar phase highlighting and tier-reactive loop aura. */
export function PhaseStrip() {
  const arrangement = useSessionStore((s) => s.arrangement)
  const fightKey = useSessionStore((s) => s.fight.key)
  const globalStep = useSessionStore((s) => s.globalStep)
  const playing = useSessionStore((s) => s.playing)

  const loopSteps = arrangement.bars * arrangement.stepsPerBar
  const currentStepInLoop = globalStep % loopSteps
  const currentBar = playing ? Math.floor(currentStepInLoop / arrangement.stepsPerBar) : -1
  const isLoopWrap = playing && currentStepInLoop === 0

  const score = scoreProgression(fightKey, arrangement.chords)
  const effect = chordEffectFor(fightKey, arrangement.chords)

  const isGold = score.tier === "gold"
  const isSilver = score.tier === "silver"

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center gap-2.5 p-2 rounded-lg border transition-all",
        isGold
          ? "border-amber-500/50 bg-amber-950/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
          : isSilver
            ? "border-slate-400/40 bg-slate-900/10"
            : "border-border/60 bg-muted/10",
        isLoopWrap && isGold && "animate-pulse-gold",
      )}
    >
      {/* Bars Strip */}
      <div className="grid flex-1 grid-flow-col gap-1.5 w-full" role="status" aria-label="chord progression phase">
        {arrangement.chords.map((roman, bar) => {
          const isActive = bar === currentBar
          return (
            <div
              key={bar}
              className={cn(
                "relative rounded-md border px-3 py-1.5 text-center font-mono text-sm font-bold transition-all",
                isActive
                  ? isGold
                    ? "border-amber-400 bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-102"
                    : "border-primary bg-primary text-primary-foreground shadow-sm scale-102"
                  : "border-border/60 text-muted-foreground bg-background/50",
              )}
              title={`Bar ${bar + 1}: ${roman}`}
            >
              <span>{roman}</span>
              {isActive && (
                <span className="absolute -top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary-foreground animate-ping" />
              )}
            </div>
          )
        })}
      </div>

      {/* Tier & Effect Tag */}
      <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
        <span
          className={cn(
            "px-2 py-0.5 rounded font-black uppercase text-[10px] tracking-wider",
            isGold
              ? "bg-amber-400/20 text-amber-300 border border-amber-400/50"
              : isSilver
                ? "bg-slate-300/20 text-slate-200 border border-slate-400/40"
                : "bg-muted text-muted-foreground",
          )}
          title={`Craft score ${score.total}/100 (Voice-leading: ${score.voiceLeading} · Diatonic Fit: ${score.diatonicFit} · Syntax Flow: ${score.syntax})`}
        >
          {score.tier} · {score.total}
        </span>

        <span className="text-[10px] text-muted-foreground hidden sm:inline" title={effect.label}>
          {isGold ? "+1 Regen · +1 Ward · +1 Dmg" : isSilver ? "+1 Ward" : "No Blessing"}
        </span>
      </div>
    </div>
  )
}
