import { useEffect } from "react"
import { useSessionStore } from "@/state/useSessionStore"
import { scoreProgression } from "@/game/theory"
import { chordEffectFor } from "@/data/chords"
import { Button } from "@/components/ui/button"
import { playVictoryJingle, playDefeatSting } from "@/audio/sfx"

interface ResultOverlayProps {
  phase: "victory" | "defeat"
}

export function ResultOverlay({ phase }: ResultOverlayProps) {
  const fight = useSessionStore((s) => s.fight)
  const arrangement = useSessionStore((s) => s.arrangement)
  const encounters = useSessionStore((s) => s.encounters)
  const currentEncounterId = useSessionStore((s) => s.currentEncounterId)
  const selectEncounter = useSessionStore((s) => s.selectEncounter)
  const toPrep = useSessionStore((s) => s.toPrep)
  const togglePlay = useSessionStore((s) => s.togglePlay)
  const reset = useSessionStore((s) => s.reset)

  const isVictory = phase === "victory"

  useEffect(() => {
    if (isVictory) {
      playVictoryJingle()
    } else {
      playDefeatSting()
    }
  }, [isVictory])
  const currentIdx = encounters.findIndex((e) => e.id === currentEncounterId)
  const encounter = encounters[currentIdx >= 0 ? currentIdx : 0]
  const hasNext = currentIdx >= 0 && currentIdx < encounters.length - 1
  const nextEncounter = hasNext ? encounters[currentIdx + 1] : null

  const progressionScore = scoreProgression(fight.key, arrangement.chords)
  const chordEffect = chordEffectFor(fight.key, arrangement.chords)

  const handleNextEncounter = () => {
    if (nextEncounter) {
      selectEncounter(nextEncounter.id)
    }
    toPrep()
  }

  const handleRetry = async () => {
    reset()
    await togglePlay()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-lg rounded-xl border p-6 shadow-2xl text-center space-y-5 bg-card ${
          isVictory ? "border-emerald-500/40 shadow-emerald-500/10" : "border-rose-500/40 shadow-rose-500/10"
        }`}
      >
        {/* Banner Title */}
        <div className="space-y-1.5">
          <span
            className={`text-xs font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
              isVictory
                ? !hasNext
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400"
                : "bg-rose-500/20 text-rose-400"
            }`}
          >
            {isVictory ? (!hasNext ? "✦ Grand Maestro ✦" : "Trial Overcome") : "Party Silenced"}
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight">
            {isVictory
              ? !hasNext
                ? "The Dark Room is Harmonized"
                : "The Discord is Quieted"
              : "The Hum Fades"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {encounter ? encounter.name : "Combat Arena"} · Key of {fight.key.tonic} {fight.key.scale}
          </p>
        </div>

        {/* Stats & Summary */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/20 border border-border/50 text-left text-xs font-mono">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase">Combat Duration</span>
            <span className="text-foreground font-semibold">{fight.tick} ticks ({Math.round(fight.tick / 16)} bars)</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase">Progression Tier</span>
            <span className="text-primary font-semibold uppercase">{progressionScore.tier} ({progressionScore.total}/100)</span>
          </div>
          <div className="col-span-2 pt-1 border-t border-border/30">
            <span className="text-muted-foreground block text-[10px] uppercase">Progression Blessing</span>
            <span className="text-foreground text-[11px] font-sans">{chordEffect.label}</span>
          </div>
        </div>

        {/* Tactical Feedback */}
        {!isVictory && encounter?.tip && (
          <div className="text-xs text-left p-3 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
            <span className="font-semibold block">Tactical Tip:</span>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">{encounter.tip}</p>
          </div>
        )}

        {isVictory && hasNext && (
          <p className="text-xs text-muted-foreground">
            Up Next: <strong className="text-foreground">{nextEncounter?.name}</strong>
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isVictory && hasNext ? (
            <Button
              size="lg"
              onClick={handleNextEncounter}
              className="w-full sm:w-auto font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Next Encounter →
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleRetry}
              className="w-full sm:w-auto font-semibold"
            >
              Try Again ↻
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            onClick={toPrep}
            className="w-full sm:w-auto"
          >
            Return to Preparation
          </Button>
        </div>
      </div>
    </div>
  )
}

