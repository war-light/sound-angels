import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ATTACK_SLOTS, STEPS_PER_BAR, type NoteEvent } from "@/game/arrangement"
import { useSessionStore } from "@/state/useSessionStore"

const DEGREES = [1, 2, 3, 4, 5, 6, 7]
const LENGTHS = [1, 2, 4, 8]
const ROMANS = ["i", "VI", "III", "VII", "iv", "V", "V7"]

const DRUM_ROWS = [
  { voice: "kick", label: "kck" },
  { voice: "snare", label: "snr" },
  { voice: "hat", label: "hat" },
] as const

/** Steps covered by a held note starting at each onset (for span shading). */
function coverage(row: (NoteEvent | null)[]): boolean[] {
  const covered = Array(row.length).fill(false) as boolean[]
  row.forEach((e, s) => {
    if (e == null) return
    for (let k = 0; k < e.len && s + k < row.length; k++) covered[s + k] = true
  })
  return covered
}

export function StepGrid() {
  const arrangement = useSessionStore((s) => s.arrangement)
  const globalStep = useSessionStore((s) => s.globalStep)
  const playing = useSessionStore((s) => s.playing)
  const toggleNote = useSessionStore((s) => s.toggleNote)
  const toggleDrum = useSessionStore((s) => s.toggleDrum)
  const setChord = useSessionStore((s) => s.setChord)
  const [slot, setSlot] = useState(0)
  const [degree, setDegree] = useState(1)
  const [len, setLen] = useState(1)

  const activeGlobal = playing ? globalStep % (arrangement.bars * STEPS_PER_BAR) : -1

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-muted-foreground mr-1 text-xs tracking-widest uppercase">
          voice
        </span>
        {Array.from({ length: ATTACK_SLOTS }, (_, sl) => (
          <Button
            key={sl}
            size="sm"
            variant={slot === sl ? "default" : "ghost"}
            onClick={() => setSlot(sl)}
            aria-pressed={slot === sl}
          >
            {sl + 1}
          </Button>
        ))}
        <span className="text-muted-foreground mr-1 ml-3 text-xs tracking-widest uppercase">
          note
        </span>
        {DEGREES.map((d) => (
          <Button
            key={d}
            size="sm"
            variant={degree === d ? "default" : "ghost"}
            onClick={() => setDegree(d)}
            aria-pressed={degree === d}
          >
            {d}
          </Button>
        ))}
        <span className="text-muted-foreground mr-1 ml-3 text-xs tracking-widest uppercase">
          hold
        </span>
        {LENGTHS.map((l) => (
          <Button
            key={l}
            size="sm"
            variant={len === l ? "default" : "ghost"}
            onClick={() => setLen(l)}
            aria-pressed={len === l}
            title={l >= 4 ? "long note: hits hard, easy to evade" : "short note"}
          >
            {l}
          </Button>
        ))}
      </div>

      {arrangement.tracks.map((track, sl) => (
        <div key={sl} className={cn("flex flex-col gap-1", sl !== slot && "opacity-60")}>
          {track.map((row, bar) => {
            const covered = coverage(row)
            return (
              <div key={bar} className="flex items-center gap-1">
                <button
                  onClick={() => setSlot(sl)}
                  className="w-10 shrink-0 text-left text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground"
                  title={`edit voice ${sl + 1}`}
                >
                  v{sl + 1}·{bar + 1}
                </button>
                <div className="grid flex-1 grid-cols-16 gap-0.5">
                  {row.map((v, step) => {
                    const g = bar * STEPS_PER_BAR + step
                    const isPlayhead = g === activeGlobal
                    return (
                      <button
                        key={step}
                        onClick={() =>
                          toggleNote(sl, bar, step, v == null ? { degree, len } : null)
                        }
                        title={`voice ${sl + 1} bar ${bar + 1} step ${step + 1}${v != null ? `: degree ${v.degree} x${v.len}` : ""}`}
                        className={cn(
                          "h-6 rounded-[3px] border font-mono text-[10px] transition-colors",
                          v != null
                            ? "border-primary bg-primary text-primary-foreground"
                            : covered[step]
                              ? "border-primary/40 bg-primary/20"
                              : "border-border bg-transparent text-muted-foreground hover:bg-accent",
                          step % 4 === 0 && v == null && !covered[step] && "border-muted-foreground/50",
                          isPlayhead && "outline-ring outline-2 outline-offset-1",
                        )}
                      >
                        {v != null ? (v.len > 1 ? `${v.degree}·${v.len}` : v.degree) : ""}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {sl === arrangement.tracks.length - 1 && (
            <div className="flex items-center gap-1 pl-11">
              {arrangement.chords.map((chord, bar) => (
                <div key={bar} className="flex flex-1 items-center gap-0.5">
                  {ROMANS.map((r) => (
                    <Button
                      key={r}
                      size="sm"
                      variant={chord === r ? "secondary" : "ghost"}
                      onClick={() => setChord(bar, r)}
                      className="h-6 flex-1 px-1 text-[11px]"
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-col gap-1">
        {DRUM_ROWS.map(({ voice, label }) => (
          <div key={voice} className="flex items-center gap-1">
            <span className="text-muted-foreground w-10 shrink-0 text-xs tracking-widest uppercase">
              {label}
            </span>
            <div className="grid flex-1 grid-cols-16 gap-0.5">
              {Array.from({ length: arrangement.bars * STEPS_PER_BAR }, (_, g) => {
                const bar = Math.floor(g / STEPS_PER_BAR)
                const step = g % STEPS_PER_BAR
                const on = arrangement.drums[voice][bar][step]
                return (
                  <button
                    key={g}
                    onClick={() => toggleDrum(voice, bar, step)}
                    title={`${voice} bar ${bar + 1} step ${step + 1}`}
                    className={cn(
                      "h-4 rounded-[3px] border",
                      on
                        ? "border-primary bg-primary/70"
                        : "border-border bg-transparent hover:bg-accent",
                      g === activeGlobal && "outline-ring outline-2 outline-offset-1",
                    )}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
