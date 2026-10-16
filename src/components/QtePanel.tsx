import { memo, useEffect, useRef, useState } from "react"
import { useSessionStore } from "@/state/useSessionStore"
import { stepMs, stepsToMs, type QteKey } from "@/game/perform"
import { qteSuccessRate, type QteState } from "@/game/qte"
import { playEnemyTelegraph, playQteMiss } from "@/audio/sfx"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useQtePlayhead } from "@/hooks/useQtePlayhead"

interface LaneConfig {
  key: QteKey
  /** Glyph on the note + receptor (arrows for WASD, letters for ZXCV). */
  glyph: string
  label: string
  color: string
  bgActive: string
  borderActive: string
  textActive: string
}

const LANES: LaneConfig[] = [
  {
    key: "a",
    glyph: "←",
    label: "Left (A)",
    color: "text-purple-400",
    bgActive: "bg-purple-500/20",
    borderActive: "border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]",
    textActive: "text-purple-300",
  },
  {
    key: "w",
    glyph: "↑",
    label: "Up (W)",
    color: "text-emerald-400",
    bgActive: "bg-emerald-500/20",
    borderActive: "border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]",
    textActive: "text-emerald-300",
  },
  {
    key: "s",
    glyph: "↓",
    label: "Down (S)",
    color: "text-sky-400",
    bgActive: "bg-sky-500/20",
    borderActive: "border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]",
    textActive: "text-sky-300",
  },
  {
    key: "d",
    glyph: "→",
    label: "Right (D)",
    color: "text-rose-400",
    bgActive: "bg-rose-500/20",
    borderActive: "border-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.5)]",
    textActive: "text-rose-300",
  },
]

/** Parry lanes: ZXCV block keys with their own block colors. */
const PARRY_LANES: LaneConfig[] = [
  {
    key: "z",
    glyph: "Z",
    label: "Block (Z)",
    color: "text-amber-400",
    bgActive: "bg-amber-500/20",
    borderActive: "border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]",
    textActive: "text-amber-300",
  },
  {
    key: "x",
    glyph: "X",
    label: "Block (X)",
    color: "text-lime-400",
    bgActive: "bg-lime-500/20",
    borderActive: "border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.5)]",
    textActive: "text-lime-300",
  },
  {
    key: "c",
    glyph: "C",
    label: "Block (C)",
    color: "text-cyan-400",
    bgActive: "bg-cyan-500/20",
    borderActive: "border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]",
    textActive: "text-cyan-300",
  },
  {
    key: "v",
    glyph: "V",
    label: "Block (V)",
    color: "text-orange-400",
    bgActive: "bg-orange-500/20",
    borderActive: "border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.5)]",
    textActive: "text-orange-300",
  },
]

const HIGHWAY_H = 248
const RECEPTOR_LINE_Y = HIGHWAY_H - 32
/** Visible lookahead in wall-clock ms — identical feel at any tempo. */
const LOOKAHEAD_MS = 2500

function ratingMeta(rating: string): { text: string; className: string } {
  switch (rating) {
    case "sick":
      return { text: "SICK!", className: "text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.9)]" }
    case "good":
      return { text: "GOOD!", className: "text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" }
    case "bad":
      return { text: "BAD", className: "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" }
    default:
      return { text: "MISS!", className: "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" }
  }
}

/** Smooth falling-note highway. Owns the only 60fps state in the panel. */
function ActiveHighway({ qte, tick, bpm, lanes }: { qte: QteState; tick: number; bpm: number; lanes: LaneConfig[] }) {
  const playhead = useQtePlayhead(qte.startedTick, tick, bpm)
  const total = Math.max(1, qte.deadlineTick - qte.startedTick)
  const progress = Math.min(1, Math.max(0, playhead / total))
  const low = progress < 0.25
  const lookaheadSteps = Math.max(8, Math.ceil(LOOKAHEAD_MS / stepMs(bpm)))
  const stepPx = HIGHWAY_H / lookaheadSteps
  const secsLeft = Math.max(0, stepsToMs(total - playhead, bpm) / 1000)

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-muted/40 h-1.5 rounded-full overflow-hidden" aria-label="chart progress">
          <div
            className={cn("h-full rounded-full", low ? "bg-rose-500 animate-pulse" : "bg-emerald-400")}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {qte.kind === "parry" && (
          <span className="text-[11px] font-mono font-bold text-amber-300 tabular-nums shrink-0" aria-label="seconds to strike">
            {secsLeft.toFixed(1)}s
          </span>
        )}
      </div>
      <div
        className="grid grid-cols-4 gap-2 relative overflow-hidden rounded-lg bg-black/30 border border-border/40 h-[248px]"
        aria-label="note highway"
      >
        {lanes.map((lane) => (
          <div key={lane.key} className="relative border-x border-border/20">
            {qte.notes
              .filter((n) => n.note.key === lane.key)
              .map((n) => {
                if (n.status === "hit") return null
                const delta = n.note.stepOffset - playhead
                if (delta < -1.5 || delta > lookaheadSteps) return null
                const y = RECEPTOR_LINE_Y - 18 - delta * stepPx
                const isMiss = n.status === "miss"
                const holding = n.holdPhase === "holding"
                const inSick = Math.abs(delta) <= 0.5 && !isMiss
                const holdH = n.note.holdSteps > 0 ? n.note.holdSteps * stepPx : 0
                return (
                  <div key={n.note.id}>
                    {holdH > 0 && (
                      <div
                        aria-hidden
                        className={cn(
                          "absolute left-1/2 top-0 w-3 rounded-full will-change-transform",
                          lane.bgActive,
                          holding ? "opacity-90" : "opacity-50",
                          isMiss && "opacity-20 grayscale",
                        )}
                        style={{ transform: `translate(-50%, ${y + 18 - holdH}px)`, height: `${holdH}px` }}
                      />
                    )}
                    <div
                      aria-label={`${lane.label} note${n.note.holdSteps > 0 ? " hold" : ""}`}
                      className={cn(
                        "absolute left-1/2 top-0 flex items-center justify-center w-9 h-9 rounded-lg border-2 font-black text-lg will-change-transform",
                        lane.borderActive,
                        lane.bgActive,
                        lane.textActive,
                        isMiss && "opacity-30 grayscale",
                        inSick && "ring-2 ring-emerald-300 scale-110",
                        holding && "ring-2 ring-amber-300 scale-110",
                      )}
                      style={{ transform: `translate(-50%, ${y}px)` }}
                    >
                      {lane.glyph}
                    </div>
                  </div>
                )
              })}
          </div>
        ))}
        {/* Timing zones above the receptor line (bottom): SICK band + line. */}
        <div className="absolute left-0 right-0 h-6 bg-emerald-400/10 border-y border-emerald-400/30 pointer-events-none" style={{ top: `${RECEPTOR_LINE_Y - 24}px` }} aria-hidden />
        <div className="absolute left-0 right-0 h-0.5 bg-primary/70 pointer-events-none" style={{ top: `${RECEPTOR_LINE_Y}px` }} aria-hidden />
      </div>
      <p className="text-[10px] font-mono text-muted-foreground mt-1 text-center">
        {qte.kind === "parry"
          ? "Block with ZXCV — hold long notes to their tails!"
          : "Notes fall to the line — press at the line for SICK!"}
      </p>
    </div>
  )
}

function StandbyHighway({ threat }: { threat: string }) {
  return (
    <div>
      <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden mb-2" aria-hidden>
        <div className="h-full rounded-full bg-muted-foreground/30 w-0" />
      </div>
      <div
        className="grid grid-cols-4 gap-2 relative overflow-hidden rounded-lg bg-black/20 border border-dashed border-border/40 h-[248px]"
        aria-label="note highway standby"
      >
        {LANES.map((lane) => (
          <div key={lane.key} className="relative border-x border-border/10">
            <div className="absolute left-1/2 top-0 flex items-center justify-center w-9 h-9 rounded-lg border border-border/30 text-muted-foreground/40 font-black text-lg animate-target-pulse" style={{ transform: `translate(-50%, ${RECEPTOR_LINE_Y - 18}px)` }} aria-hidden>
              {lane.glyph}
            </div>
          </div>
        ))}
        <div className="absolute left-0 right-0 h-0.5 bg-border/50 pointer-events-none" style={{ top: `${RECEPTOR_LINE_Y}px` }} aria-hidden />
        <p className="absolute inset-x-0 text-center font-mono text-[11px] text-muted-foreground pointer-events-none" style={{ top: "96px" }}>
          {threat}
        </p>
      </div>
      <p className="text-[10px] font-mono text-muted-foreground mt-1 text-center">
        Highway live — charts drop here. WASD to sing · ZXCV to parry.
      </p>
    </div>
  )
}

interface ReceptorProps {
  qte: QteState | null
  tick: number
  lanes: LaneConfig[]
  onPress: (k: QteKey) => void
  onRelease?: (k: QteKey) => void
}

/** Bottom receptors, always mounted. Instant local press flash + engine-rating glow. */
const ReceptorRow = memo(function ReceptorRow({ qte, tick, lanes, onPress, onRelease }: ReceptorProps) {
  const [pressed, setPressed] = useState<Record<QteKey, boolean>>({
    w: false, a: false, s: false, d: false, z: false, x: false, c: false, v: false,
  })
  const timeouts = useRef<Partial<Record<QteKey, number>>>( {})

  // Keyboard press visuals only — performDown itself flows through useWasd.
  useEffect(() => {
    const keys = new Set(["w", "a", "s", "d", "z", "x", "c", "v"])
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return
      const k = e.key.toLowerCase() as QteKey
      if (!keys.has(k)) return
      setPressed((p) => ({ ...p, [k]: true }))
    }
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase() as QteKey
      if (!keys.has(k)) return
      setPressed((p) => ({ ...p, [k]: false }))
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [])

  useEffect(() => {
    const t = timeouts.current
    return () => {
      for (const k of Object.keys(t) as QteKey[]) window.clearTimeout(t[k])
    }
  }, [])

  const flash = (k: QteKey) => {
    setPressed((p) => ({ ...p, [k]: true }))
    const prev = timeouts.current[k]
    if (prev) window.clearTimeout(prev)
    timeouts.current[k] = window.setTimeout(() => {
      setPressed((p) => ({ ...p, [k]: false }))
    }, 180)
  }

  const last = qte?.lastRating
  const showJudgement = last != null && tick - last.tick <= 2
  const meta = last ? ratingMeta(last.rating) : null

  return (
    <div className="relative mt-2">
      {showJudgement && meta && qte && (
        <div
          key={`${qte.hits}-${qte.misses}`}
          className="pointer-events-none absolute -top-9 inset-x-0 flex justify-center z-20 select-none"
          aria-live="polite"
        >
          <span className={cn("font-black font-mono text-lg tracking-widest animate-float-up", meta.className)}>
            {meta.text}
            {qte.combo > 1 && <span className="text-xs text-muted-foreground"> x{qte.combo}</span>}
          </span>
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        {lanes.map((lane) => {
          const hot =
            last?.key === lane.key && tick - last.tick <= 1 && last.rating !== "miss"
          const down = pressed[lane.key]
          return (
            <button
              key={lane.key}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault()
                flash(lane.key)
                onPress(lane.key)
              }}
              onPointerUp={() => onRelease?.(lane.key)}
              onPointerLeave={() => {
                if (pressed[lane.key]) onRelease?.(lane.key)
              }}
              className={cn(
                "relative flex flex-col items-center justify-center py-2.5 rounded-lg border-2 cursor-pointer transition-[transform,background-color,border-color,box-shadow] duration-75 active:scale-90",
                hot || down
                  ? cn(lane.borderActive, lane.bgActive, down ? "scale-95" : "scale-105")
                  : "border-border/60 bg-background/50 hover:border-border hover:bg-muted/20",
              )}
              title={`Press ${lane.key.toUpperCase()} or tap`}
            >
              <span className={cn("text-2xl font-black", hot || down ? lane.color : "text-muted-foreground/60")}>
                {lane.glyph}
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground mt-0.5">
                {lane.key.toUpperCase()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
})

export function QtePanel() {
  const fight = useSessionStore((s) => s.fight)
  const bpm = useSessionStore((s) => s.arrangement.bpm)
  const cancelChart = useSessionStore((s) => s.cancelChart)
  const qte = fight.activeQte

  const prevMissesRef = useRef(0)

  // Miss SFX only (hit SFX + melodic blip fire from the store on press).
  useEffect(() => {
    if (!qte) {
      prevMissesRef.current = 0
      return
    }
    if (qte.misses > prevMissesRef.current) {
      prevMissesRef.current = qte.misses
      playQteMiss()
    }
  }, [qte?.misses, qte])

  // Audio telegraph when a parry chart opens. Deps narrowed so this runs
  // once per chart, not on every engine tick.
  const foeId = qte?.kind === "parry" ? qte.payload.foeId : undefined
  const qteKind = qte?.kind
  useEffect(() => {
    if (qteKind !== "parry") return
    const live = useSessionStore.getState().fight
    const foe = live.enemies.find((f) => f.id === foeId)
    const profile = foe ? live.enemyProfiles[foe.id] : undefined
    if (profile?.pattern) playEnemyTelegraph(profile.pattern)
  }, [qteKind, foeId])

  const press = (k: QteKey) => {
    useSessionStore.getState().performDown(k)
  }

  const release = (k: QteKey) => {
    useSessionStore.getState().performUp(k)
  }

  const isParry = qte?.kind === "parry"
  const isChord = qte?.kind === "chord"
  const label = !qte
    ? "RHYTHM HIGHWAY — STANDBY"
    : isChord
      ? "HYMN PROGRESSION SWAP"
      : isParry
        ? `PARRY — ${qte.payload.foeId?.toUpperCase() ?? "FOE"} STRIKES`
        : "BOTTLED MELODY RECALL"

  let hottest = -1
  let hottestName = ""
  fight.enemies.forEach((f, i) => {
    const g = fight.gauges[i] ?? 0
    if (g > hottest && f.hp > 0) {
      hottest = g
      hottestName = f.name
    }
  })
  const threat = fight.over
    ? "The chamber is quiet."
    : hottest >= 100
      ? `${hottestName} STRIKES NOW!`
      : hottest >= 75
        ? `${hottestName} gathering attack: ${Math.round(hottest)}%`
        : "All foes silent · charts drop here"

  const last = qte?.lastRating
  const recentMiss = last?.rating === "miss" && qte != null && fight.tick - last.tick <= 1
  const accuracy = qte ? Math.round(qteSuccessRate(qte) * 100) : null

  return (
    <section
      aria-label="quick time events"
      className={cn(
        "relative overflow-hidden rounded-xl border-2 p-4 min-h-[430px]",
        !qte && "border-dashed border-border/80 bg-muted/5",
        isParry
          ? "border-red-500/80 bg-red-950/20 shadow-[0_0_25px_rgba(239,68,68,0.35)]"
          : isChord
            ? "border-primary bg-primary/10"
            : qte
              ? "border-sky-500/70 bg-sky-950/20"
              : "",
        recentMiss && isParry && "animate-enemy-shake",
        recentMiss && !isParry && "animate-hit-flash",
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", qte ? "animate-ping" : "", isParry ? "bg-red-400" : "bg-primary")} />
            <span className="text-xs font-black tracking-wider uppercase font-mono">{label}</span>
            {qte && qte.combo > 1 && (
              <span className="text-[11px] font-mono font-extrabold text-amber-300">x{qte.combo} COMBO</span>
            )}
            {accuracy != null && qte && (
              <span className="text-[11px] font-mono font-bold text-muted-foreground">{accuracy}%</span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            {qte ? (
              <>
                Hit notes at the line with{" "}
                <strong className="text-foreground">{isParry ? "ZXCV" : "WASD"}</strong> ({qte.hits}/
                {qte.notes.length} hit
                {qte.misses > 0 && <span className="text-rose-400"> · {qte.misses} miss</span>})
                {isParry && <span> · WASD still sings</span>}
              </>
            ) : (
              <span>{threat}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {qte && !isParry && (
            <Button type="button" variant="ghost" size="sm" onClick={cancelChart} title="abandon this chart">
              abandon
            </Button>
          )}
        </div>
      </div>

      {qte ? (
        <ActiveHighway qte={qte} tick={fight.tick} bpm={bpm} lanes={isParry ? PARRY_LANES : LANES} />
      ) : (
        <StandbyHighway threat={threat} />
      )}

      <ReceptorRow
        qte={qte ?? null}
        tick={fight.tick}
        lanes={isParry ? PARRY_LANES : LANES}
        onPress={press}
        onRelease={release}
      />
    </section>
  )
}
