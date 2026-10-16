import { Button } from "@/components/ui/button"
import { CHORD_PRESETS, chordEffectFor } from "@/data/chords"
import { useSessionStore } from "@/state/useSessionStore"

/**
 * Chord wheel: premade progressions arranged in a ring. Pressing one
 * pre-fight applies it instantly; mid-fight it opens a match-it chart
 * (the loop keeps running while your WASD belongs to the chart).
 */
export function ChordWheel() {
  const arrangement = useSessionStore((s) => s.arrangement)
  const fightKey = useSessionStore((s) => s.fight.key)
  const playing = useSessionStore((s) => s.playing)
  const qteKind = useSessionStore((s) => s.fight.activeQte?.kind)
  const setChords = useSessionStore((s) => s.setChords)

  const n = CHORD_PRESETS.length
  const radius = 92

  return (
    <section aria-label="chord wheel" className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground text-xs tracking-widest uppercase">
          hymn wheel
        </span>
        <span className="text-muted-foreground font-mono text-[10px]">
          {playing
            ? qteKind === "chord"
              ? "chart open — match it"
              : "mid-fight: swaps need a chart"
            : "pre-fight: picks are free"}
        </span>
      </div>
      <div className="relative mx-auto h-56 w-56" role="group" aria-label="chord progressions">
        <div className="border-border absolute top-1/2 left-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border text-center">
          <span className="font-mono text-[11px]">{arrangement.chords.join(" ")}</span>
          <span className="text-muted-foreground font-mono text-[9px]">
            {chordEffectFor(fightKey, arrangement.chords).tier}
          </span>
        </div>
        {CHORD_PRESETS.map((p, i) => {
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          const score = chordEffectFor(fightKey, p.romans)
          const selected = arrangement.chords.every((c, b) => c === p.romans[b % p.romans.length])
          return (
            <div
              key={p.name}
              className="absolute top-1/2 left-1/2"
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
            >
              <Button
                variant={selected ? "default" : "ghost"}
                onClick={() => setChords(p.romans)}
                title={`${p.example} · ${p.romans.join(" ")} · ${score.tier} ${score.total}`}
                className="h-7 min-w-20 text-[11px]"
              >
                {p.name}·{score.tier[0]}
              </Button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
