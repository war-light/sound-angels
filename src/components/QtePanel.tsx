import { useState, useEffect, useRef } from "react"
import { useSessionStore } from "@/state/useSessionStore"
import type { PerformKey } from "@/game/perform"
import { playQteHit, playQteMiss } from "@/audio/sfx"

interface LaneConfig {
  key: PerformKey
  arrow: string
  label: string
  color: string
  bgActive: string
  borderActive: string
  textActive: string
}

const LANES: LaneConfig[] = [
  {
    key: "a",
    arrow: "←",
    label: "Left (A)",
    color: "text-purple-400",
    bgActive: "bg-purple-500/20",
    borderActive: "border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]",
    textActive: "text-purple-300",
  },
  {
    key: "w",
    arrow: "↑",
    label: "Up (W)",
    color: "text-emerald-400",
    bgActive: "bg-emerald-500/20",
    borderActive: "border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]",
    textActive: "text-emerald-300",
  },
  {
    key: "s",
    arrow: "↓",
    label: "Down (S)",
    color: "text-sky-400",
    bgActive: "bg-sky-500/20",
    borderActive: "border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]",
    textActive: "text-sky-300",
  },
  {
    key: "d",
    arrow: "→",
    label: "Right (D)",
    color: "text-rose-400",
    bgActive: "bg-rose-500/20",
    borderActive: "border-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.5)]",
    textActive: "text-rose-300",
  },
]

export function QtePanel() {
  const fight = useSessionStore((s) => s.fight)
  const cancelChart = useSessionStore((s) => s.cancelChart)
  const qte = fight.activeQte

  const [lastFeedback, setLastFeedback] = useState<string | null>(null)
  const prevHitsRef = useRef(0)
  const prevMissesRef = useRef(0)

  // Track hit / miss feedback
  useEffect(() => {
    if (!qte) {
      prevHitsRef.current = 0
      prevMissesRef.current = 0
      return
    }

    if (qte.hits > prevHitsRef.current) {
      prevHitsRef.current = qte.hits
      playQteHit("perfect")
      const t = setTimeout(() => setLastFeedback("PERFECT!"), 0)
      const clear = setTimeout(() => setLastFeedback(null), 600)
      return () => {
        clearTimeout(t)
        clearTimeout(clear)
      }
    }

    if (qte.misses > prevMissesRef.current) {
      prevMissesRef.current = qte.misses
      playQteMiss()
      const t = setTimeout(() => setLastFeedback("MISS!"), 0)
      const clear = setTimeout(() => setLastFeedback(null), 600)
      return () => {
        clearTimeout(t)
        clearTimeout(clear)
      }
    }
  }, [qte?.hits, qte?.misses, qte])

  const press = (k: PerformKey) => {
    useSessionStore.getState().performDown(k)
  }

  if (qte) {
    const totalTicks = Math.max(1, qte.deadlineTick - qte.startedTick)
    const remaining = Math.max(0, qte.deadlineTick - fight.tick)
    const timeProgress = Math.min(100, Math.max(0, (remaining / totalTicks) * 100))

    const isParry = qte.kind === "parry"
    const isChord = qte.kind === "chord"
    const label = isChord
      ? "HYMN PROGRESSION SWAP"
      : isParry
        ? `ENEMY ATTACK PARRY — ${qte.payload.foeId?.toUpperCase() ?? "FOE"}`
        : "BOTTLED MELODY RECALL"

    const currentKey = qte.sequence[qte.index]

    return (
      <section
        aria-label="quick time events"
        className={`relative overflow-hidden rounded-xl border-2 p-4 transition-all ${
          isParry
            ? "border-amber-500/80 bg-amber-950/20 shadow-[0_0_25px_rgba(245,158,11,0.25)]"
            : isChord
              ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.2)]"
              : "border-sky-500/70 bg-sky-950/20"
        }`}
      >
        {/* Rating feedback toast */}
        {lastFeedback && (
          <div className="absolute top-3 right-4 font-black font-mono text-base tracking-widest animate-float-up pointer-events-none select-none z-20">
            <span
              className={
                lastFeedback === "PERFECT!"
                  ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                  : "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]"
              }
            >
              {lastFeedback}
            </span>
          </div>
        )}

        {/* Top Header & Countdown */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-ping ${isParry ? "bg-amber-400" : "bg-primary"}`} />
              <span className="text-xs font-black tracking-wider uppercase font-mono">
                {label}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              Match sequence with <strong className="text-foreground">WASD</strong> ({qte.hits}/{qte.sequence.length} hit
              {qte.misses > 0 && <span className="text-rose-400"> · {qte.misses} miss</span>})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-muted-foreground">
              {remaining}t left
            </span>
            {!isParry && (
              <button
                type="button"
                onClick={cancelChart}
                className="text-muted-foreground hover:text-foreground font-mono text-xs underline px-1 py-0.5"
                title="abandon this chart"
              >
                abandon
              </button>
            )}
          </div>
        </div>

        {/* Time Remaining Bar */}
        <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full transition-all duration-100 ease-linear rounded-full ${
              timeProgress > 50 ? "bg-emerald-400" : timeProgress > 25 ? "bg-amber-400" : "bg-rose-500 animate-pulse"
            }`}
            style={{ width: `${timeProgress}%` }}
          />
        </div>

        {/* DDR / FNF 4-Lane Arrow Highway */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {LANES.map((lane) => {
            const isTarget = currentKey === lane.key
            return (
              <button
                key={lane.key}
                type="button"
                onClick={() => press(lane.key)}
                className={`relative flex flex-col items-center justify-center py-3.5 rounded-lg border-2 transition-all cursor-pointer ${
                  isTarget
                    ? `${lane.borderActive} ${lane.bgActive} scale-105 animate-target-pulse`
                    : "border-border/60 bg-background/50 hover:border-border hover:bg-muted/20"
                }`}
                title={`Press ${lane.key.toUpperCase()} or click`}
              >
                <span className={`text-2xl font-black ${isTarget ? lane.color : "text-muted-foreground/60"}`}>
                  {lane.arrow}
                </span>
                <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground mt-0.5">
                  {lane.key.toUpperCase()}
                </span>
                {isTarget && (
                  <span className="absolute -bottom-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-extrabold bg-primary text-primary-foreground tracking-tighter">
                    HIT
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Visual Sequence Chain */}
        <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-black/30 border border-border/40">
          <span className="text-[10px] uppercase font-mono text-muted-foreground mr-1">Rhythm:</span>
          {qte.sequence.map((k, i) => {
            const lane = LANES.find((l) => l.key === k)
            const isCompleted = i < qte.index
            const isCurrent = i === qte.index
            return (
              <div
                key={i}
                className={`flex items-center justify-center w-7 h-7 rounded border font-mono text-xs font-bold transition-all ${
                  isCompleted
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                    : isCurrent
                      ? "border-primary bg-primary text-primary-foreground scale-110 shadow-md font-black"
                      : "border-border/50 text-muted-foreground/40 bg-background/30"
                }`}
              >
                {isCompleted ? "✓" : lane?.arrow ?? k.toUpperCase()}
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  // Standby / Threat Radar Mode
  let hottest = -1
  let hottestName = ""
  fight.enemies.forEach((f, i) => {
    const g = fight.gauges[i] ?? 0
    if (g > hottest && f.hp > 0) {
      hottest = g
      hottestName = f.name
    }
  })

  return (
    <section
      aria-label="quick time events"
      className="border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-dashed p-3.5 bg-muted/5 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="grid grid-cols-4 gap-1.5 shrink-0" aria-hidden>
          {LANES.map((lane) => (
            <div
              key={lane.key}
              className="w-8 h-8 rounded border border-border/60 flex items-center justify-center text-xs font-mono font-bold bg-background/50 text-muted-foreground"
            >
              <span>{lane.arrow}</span>
            </div>
          ))}
        </div>

        <div className="space-y-0.5">
          <span className="text-xs font-semibold block text-foreground">
            Rhythm Action Highway (Standby)
          </span>
          <p className="text-[11px] text-muted-foreground font-mono">
            {fight.over ? (
              "The chamber is quiet."
            ) : hottest >= 100 ? (
              <span className="text-rose-400 font-bold animate-pulse">{hottestName} STRIKES NOW!</span>
            ) : hottest >= 75 ? (
              <span className="text-amber-400 font-semibold">{hottestName} gathering attack: {Math.round(hottest)}%</span>
            ) : (
              <span>All foes silent · Keep loop singing with WASD</span>
            )}
          </p>
        </div>
      </div>

      <div className="text-[11px] font-mono text-muted-foreground self-end sm:self-center shrink-0">
        WASD to Sing & Parry
      </div>
    </section>
  )
}
