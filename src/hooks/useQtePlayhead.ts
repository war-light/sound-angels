// Smooth playhead for the QTE highway (FNF-style 60fps interpolation).
// Mounts ONE rAF loop per chart (startedTick + bpm). Engine ticks arrive via
// Tone.Draw at ~6Hz; they are folded in through a ref so the loop never
// restarts mid-chart — the stutter source in the old panel.
import { useEffect, useRef, useState } from "react"
import { stepMs } from "@/game/perform"

/** Float position in steps relative to chart start (0 = first note time). */
export function useQtePlayhead(startedTick: number, tick: number, bpm: number): number {
  const [playhead, setPlayhead] = useState(() => tick - startedTick)
  const tickRef = useRef(tick)
  const timeRef = useRef(0)
  const startedRef = useRef(startedTick)
  const bpmRef = useRef(bpm)

  // Fold engine ticks in without restarting the loop.
  useEffect(() => {
    if (tick !== tickRef.current) {
      tickRef.current = tick
      timeRef.current = performance.now()
    }
  }, [tick])
  useEffect(() => {
    startedRef.current = startedTick
  }, [startedTick])
  useEffect(() => {
    bpmRef.current = bpm
  }, [bpm])

  useEffect(() => {
    timeRef.current = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const step = stepMs(bpmRef.current)
      const frac = Math.min(1, Math.max(0, (now - timeRef.current) / Math.max(1, step)))
      setPlayhead(tickRef.current - startedRef.current + frac)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedTick, bpm])

  return playhead
}
