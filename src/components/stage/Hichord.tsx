import { Button } from "@/components/ui/button"
import { MAX_TENSION, RESOLVE_PER_STACK } from "@/game/stageCombat"
import { chordFunction, chordLabel, type ChordMod } from "@/game/stageMusic"
import type { HarmonicFunction } from "@/game/theory"
import { cn } from "@/lib/utils"
import { useSessionStore } from "@/state/useSessionStore"

const DEGREES = [1, 2, 3, 4, 5, 6, 7]

const MODS: { mod: ChordMod; label: string; key: string }[] = [
  { mod: "seventh", label: "7th", key: "Q" },
  { mod: "sus", label: "sus4", key: "W" },
  { mod: "flip", label: "flip", key: "E" },
]

const FN_STYLE: Record<HarmonicFunction, { name: string; text: string; lit: string }> = {
  T: { name: "Tonic", text: "text-emerald-300", lit: "border-emerald-400 bg-emerald-500/20" },
  SD: { name: "Sub", text: "text-sky-300", lit: "border-sky-400 bg-sky-500/20" },
  D: { name: "Dominant", text: "text-amber-300", lit: "border-amber-400 bg-amber-500/20" },
}

/** Seven diatonic chords + one modifier. Every press lands on the next bar. */
export function Hichord() {
  const stage = useSessionStore((s) => s.stage)
  const chordMod = useSessionStore((s) => s.chordMod)
  const pressChord = useSessionStore((s) => s.pressChord)
  const toggleChordMod = useSessionStore((s) => s.toggleChordMod)
  const tension = stage.tension

  return (
    <section aria-label="Hichord" className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hichord</h3>
        <div className="flex items-center gap-1.5">
          {MODS.map(({ mod, label, key }) => (
            <Button
              key={mod}
              size="sm"
              variant="outline"
              aria-pressed={chordMod === mod}
              onClick={() => toggleChordMod(mod)}
              className={cn("font-mono", chordMod === mod && "border-primary bg-primary/20")}>
              {label} <kbd className="text-[9px] text-muted-foreground">{key}</kbd>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DEGREES.map((degree) => {
          const pick = { degree, mod: chordMod }
          const fn = chordFunction(stage.key, pick)
          const style = FN_STYLE[fn]
          const sounding = stage.chord.degree === degree
          const pending = stage.pendingChord?.degree === degree
          return (
            <Button
              key={degree}
              variant="outline"
              aria-label={`Chord ${chordLabel(stage.key, pick)}`}
              onClick={() => pressChord(degree)}
              className={cn(
                "h-auto flex-col gap-0.5 px-1 py-2",
                sounding && style.lit,
                pending && cn("animate-pulse border-dashed", style.lit),
              )}>
              <span className="text-base font-bold leading-none">{chordLabel(stage.key, pick)}</span>
              <span className={cn("text-[9px] uppercase", style.text)}>{style.name}</span>
              <kbd className="text-[9px] text-muted-foreground">{degree}</kbd>
            </Button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5" aria-label={`Tension ${tension} of ${MAX_TENSION}`}>
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">Tension</span>
          {Array.from({ length: MAX_TENSION }, (_, i) => (
            <span
              key={i}
              className={cn("h-2.5 w-2.5 rounded-full border border-amber-400/60", i < tension && "bg-amber-400")}
            />
          ))}
          {tension > 0 && (
            <span className="text-amber-300">
              resolve on a tonic for ×{(1 + RESOLVE_PER_STACK * tension).toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-muted-foreground">
          <span className="text-emerald-300">Tonic</span> mends ·{" "}
          <span className="text-sky-300">Sub</span> drives ·{" "}
          <span className="text-amber-300">Dominant</span> winds up
        </p>
      </div>
    </section>
  )
}
