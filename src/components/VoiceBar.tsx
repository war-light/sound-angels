import { useEffect, useState } from "react"
import { countOnsets } from "@/game/arrangement"
import { hasLiveAttacker } from "@/game/combat"
import { useSessionStore } from "@/state/useSessionStore"

/** True while the keyboard focus sits inside a text input (WASD captured). */
function useTypingFocus(): boolean {
  const [typing, setTyping] = useState(
    () =>
      typeof document !== "undefined" &&
      (document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"),
  )
  useEffect(() => {
    const sync = () => {
      const el = document.activeElement as HTMLElement | null
      setTyping(el != null && (el.tagName === "INPUT" || el.tagName === "TEXTAREA"))
    }
    window.addEventListener("focusin", sync)
    window.addEventListener("focusout", sync)
    return () => {
      window.removeEventListener("focusin", sync)
      window.removeEventListener("focusout", sync)
    }
  }, [])
  return typing
}

/**
 * Read-only loop status that also says WHY wasd is dead: stopped transport,
 * captured input focus, open chart, or nobody left to sing through.
 */
export function VoiceBar() {
  const fight = useSessionStore((s) => s.fight)
  const arrangement = useSessionStore((s) => s.arrangement)
  const playing = useSessionStore((s) => s.playing)
  const typing = useTypingFocus()

  const voices = countOnsets(arrangement)
  const faded = Object.values(fight.potency).filter((p) => p < 1).length

  let status: string
  if (fight.over === "player") {
    status = "foes silenced"
  } else if (fight.over === "enemy") {
    status = "fallen"
  } else if (!playing) {
    status = "stopped — press play to sing with WASD"
  } else if (typing) {
    status = "keys captured by the input — click out to sing"
  } else if (fight.activeQte?.kind === "chord" || fight.activeQte?.kind === "preset") {
    status = "chart open — WASD belongs to the chart"
  } else if (!hasLiveAttacker(fight)) {
    status = "no living attacker — seat a voice up front"
  } else if (voices === 0) {
    status = "the loop is silent — sing with WASD"
  } else if (faded > 0) {
    status = `loop singing · ${voices} voices · ${faded} fading`
  } else {
    status = `loop singing · ${voices} voices`
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground text-xs tracking-widest uppercase">
        voices
      </span>
      <span className="font-mono text-xs text-muted-foreground" role="status">
        {status}
      </span>
    </div>
  )
}
