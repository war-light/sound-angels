import { Button } from "@/components/ui/button"
import { useSessionStore } from "@/state/useSessionStore"

/** Shared party loop-energy gauge + resolve. Lives in the center stage. */
export function VoiceBar() {
  const fight = useSessionStore((s) => s.fight)
  const doStrike = useSessionStore((s) => s.doStrike)
  const ready = fight.voiceGauge >= 100 && !fight.over

  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground w-20 shrink-0 text-xs tracking-widest uppercase">
        voice {Math.round(fight.voiceGauge)}
      </span>
      <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${fight.voiceGauge}%` }} />
      </div>
      <Button onClick={doStrike} disabled={!ready} size="sm">
        {fight.over === "player"
          ? "foes silenced"
          : fight.over === "enemy"
            ? "fallen"
            : ready
              ? "resolve!"
              : "gathering…"}
      </Button>
    </div>
  )
}
