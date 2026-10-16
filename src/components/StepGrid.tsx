import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { STEPS_PER_BAR, onsetKey, type NoteEvent } from "@/game/arrangement"
import { useSessionStore } from "@/state/useSessionStore"

const DEGREES = [1, 2, 3, 4, 5, 6, 7]
const LENGTHS = [1, 2, 4, 8]
const ROMANS = ["i", "VI", "III", "VII", "iv", "V", "V7"]

const DRUM_ROWS = [
  { voice: "kick", label: "Kick" },
  { voice: "snare", label: "Snare" },
  { voice: "hat", label: "Hi-Hat" },
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
  const fight = useSessionStore((s) => s.fight)
  const globalStep = useSessionStore((s) => s.globalStep)
  const playing = useSessionStore((s) => s.playing)
  const toggleNote = useSessionStore((s) => s.toggleNote)
  const toggleDrum = useSessionStore((s) => s.toggleDrum)
  const setChord = useSessionStore((s) => s.setChord)
  const [slot, setSlot] = useState(0)
  const [degree, setDegree] = useState(1)
  const [len, setLen] = useState(1)

  const front = fight.slots.front
  const byId = new Map(fight.party.map((f) => [f.id, f]))
  const activeLane = Math.min(slot, Math.max(0, front.length - 1))

  const totalSteps = arrangement.bars * STEPS_PER_BAR
  const activeGlobal = playing ? globalStep % totalSteps : -1

  return (
    <section aria-label="Step sequencer" className="flex flex-col gap-3.5 border border-border/80 rounded-xl p-3.5 bg-card/60 backdrop-blur-sm">
      {/* Voice & Tooling Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase font-mono mr-1">
            Voice:
          </span>
          {front.map((id, lane) => {
            const attacker = byId.get(id)
            return (
              <Button
                key={id}
                size="sm"
                variant={activeLane === lane ? "default" : "outline"}
                onClick={() => setSlot(lane)}
                aria-pressed={activeLane === lane}
                className="h-7 text-xs px-2.5"
                title={attacker ? `${attacker.name} (${attacker.instrument ?? "—"})` : `lane ${lane + 1}`}
              >
                {attacker?.name ?? `Lane ${lane + 1}`}
              </Button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Note Degree Picker */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase font-mono mr-1">
              Degree:
            </span>
            {DEGREES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDegree(d)}
                aria-pressed={degree === d}
                className={`w-6 h-6 rounded border font-mono text-xs font-bold transition-all ${
                  degree === d
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border/60 hover:border-border text-muted-foreground bg-background"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Hold Length Picker */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase font-mono mr-1">
              Hold:
            </span>
            {LENGTHS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLen(l)}
                aria-pressed={len === l}
                className={`px-2 h-6 rounded border font-mono text-xs font-bold transition-all ${
                  len === l
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border/60 hover:border-border text-muted-foreground bg-background"
                }`}
                title={l >= 4 ? "Long note: High damage, higher enemy evasion" : "Short note: Swift staccato"}
              >
                {l}t
              </button>
            ))}
          </div>
        </div>
      </div>

      {front.length === 0 && (
        <p className="text-muted-foreground text-xs font-mono py-2">
          No attackers placed — seat voices in the front row to activate melody tracks.
        </p>
      )}

      {/* Melody Tracks Grid */}
      <div className="space-y-3">
        {front.map((id, lane) => {
          const attacker = byId.get(id)
          const track = arrangement.tracks[lane]
          if (!attacker || !track) return null

          return (
            <div
              key={id}
              className={cn(
                "rounded-lg border p-2 transition-all space-y-2",
                lane === activeLane ? "border-primary/50 bg-primary/5" : "border-border/40 bg-muted/5 opacity-70",
              )}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {attacker.name} <span className="text-muted-foreground font-normal">({attacker.instrument})</span>
                </span>
                <span className="text-[10px] text-muted-foreground">Lane {lane + 1}</span>
              </div>

              {track.map((row, bar) => {
                const covered = coverage(row)
                return (
                  <div key={bar} className="flex items-center gap-2">
                    <span className="w-12 shrink-0 text-left font-mono text-[10px] text-muted-foreground font-semibold">
                      Bar {bar + 1}
                    </span>

                    <div className="grid flex-1 grid-cols-16 gap-1">
                      {row.map((v, step) => {
                        const g = bar * STEPS_PER_BAR + step
                        const isPlayhead = g === activeGlobal
                        const isQuarter = step % 4 === 0

                        // Potency calculation for note
                        let opacityClass = "opacity-100"
                        if (v != null) {
                          const k = onsetKey(lane, bar, step, v)
                          const pot = fight.potency[k] ?? 1
                          if (pot <= 0.3) opacityClass = "opacity-50"
                          else if (pot <= 0.6) opacityClass = "opacity-75"
                        }

                        return (
                          <button
                            key={step}
                            type="button"
                            onClick={() =>
                              toggleNote(lane, bar, step, v == null ? { degree, len } : null)
                            }
                            title={`${attacker.name} Bar ${bar + 1} Step ${step + 1}${
                              v != null ? `: Degree ${v.degree} (hold ${v.len}t)` : ""
                            }`}
                            className={cn(
                              "h-7 rounded border font-mono text-[10px] font-bold transition-all relative flex items-center justify-center cursor-pointer",
                              v != null
                                ? `border-primary bg-primary text-primary-foreground shadow-sm ${opacityClass}`
                                : covered[step]
                                  ? "border-primary/40 bg-primary/20 text-primary-foreground/70"
                                  : isQuarter
                                    ? "border-border bg-background/80 hover:bg-muted"
                                    : "border-border/40 bg-background/40 hover:bg-muted/50",
                              isPlayhead && "ring-2 ring-primary ring-offset-1 ring-offset-background scale-105 z-10",
                              isPlayhead && v != null && "animate-target-pulse shadow-[0_0_12px_rgba(var(--primary),0.8)]",
                            )}
                          >
                            {v != null ? (v.len > 1 ? `${v.degree}·${v.len}` : v.degree) : ""}
                            {isPlayhead && (
                              <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Per-bar Chords Row under last attacker */}
              {lane === front.length - 1 && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="w-12 shrink-0 text-left font-mono text-[10px] text-muted-foreground uppercase font-semibold">
                      Chords
                    </span>
                    <div className="flex flex-1 gap-2">
                      {arrangement.chords.map((chord, bar) => (
                        <div key={bar} className="flex flex-1 items-center gap-1 border border-border/60 rounded px-1.5 py-1 bg-background/60">
                          <span className="text-[10px] font-mono text-muted-foreground mr-1">B{bar + 1}:</span>
                          <div className="flex flex-1 gap-0.5">
                            {ROMANS.map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setChord(bar, r)}
                                className={`flex-1 h-5 rounded text-[10px] font-mono font-bold transition-colors ${
                                  chord === r
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted"
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Drum Tracks Section */}
      <div className="border border-border/60 rounded-lg p-2.5 bg-muted/10 space-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-mono block">
          Rhythm Section (Drums)
        </span>

        {DRUM_ROWS.map(({ voice, label }) => (
          <div key={voice} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-left font-mono text-[10px] text-muted-foreground font-semibold">
              {label}
            </span>
            <div className="grid flex-1 grid-cols-16 gap-1">
              {Array.from({ length: STEPS_PER_BAR }, (_, step) => {
                const bar = 0 // show current bar or active bar based on activeGlobal
                const currentBar = activeGlobal >= 0 ? Math.floor(activeGlobal / STEPS_PER_BAR) : bar
                const on = arrangement.drums[voice][currentBar]?.[step] ?? false
                const isPlayhead = (currentBar * STEPS_PER_BAR + step) === activeGlobal
                const isQuarter = step % 4 === 0

                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => toggleDrum(voice, currentBar, step)}
                    title={`${voice} Step ${step + 1}`}
                    className={cn(
                      "h-4 rounded border transition-all cursor-pointer",
                      on
                        ? "border-primary bg-primary/80 shadow-xs"
                        : isQuarter
                          ? "border-border bg-background"
                          : "border-border/40 bg-background/40 hover:bg-muted",
                      isPlayhead && "ring-1 ring-primary scale-105 z-10",
                      isPlayhead && on && "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]",
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
