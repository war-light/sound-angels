import { cn } from "@/lib/utils"
import { scoreProgression } from "@/game/theory"
import { useSessionStore } from "@/state/useSessionStore"

/** Chord progression strip with the live bar phase highlighted on the playhead. */
export function PhaseStrip() {
  const arrangement = useSessionStore((s) => s.arrangement)
  const fightKey = useSessionStore((s) => s.fight.key)
  const globalStep = useSessionStore((s) => s.globalStep)
  const playing = useSessionStore((s) => s.playing)

  const currentBar = playing
    ? Math.floor((globalStep % (arrangement.bars * arrangement.stepsPerBar)) / arrangement.stepsPerBar)
    : -1
  const score = scoreProgression(fightKey, arrangement.chords)

  return (
    <div className="flex items-center gap-2">
      <div className="grid flex-1 grid-flow-col gap-1" role="status" aria-label="chord progression phase">
        {arrangement.chords.map((roman, bar) => (
          <div
            key={bar}
            className={cn(
              "rounded-sm border px-2 py-1 text-center font-mono text-sm",
              bar === currentBar
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground",
            )}
            title={`bar ${bar + 1}: ${roman}`}
          >
            {roman}
          </div>
        ))}
      </div>
      <span
        className="font-mono text-[10px] text-muted-foreground"
        title={`craft score ${score.total} (voice ${score.voiceLeading} / fit ${score.diatonicFit} / flow ${score.syntax})`}
      >
        {score.tier} {score.total}
      </span>
    </div>
  )
}
