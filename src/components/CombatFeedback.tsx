import { useEffect, useState } from "react"
import { useSessionStore } from "@/state/useSessionStore"

interface FloatingTag {
  id: string
  text: string
  type: "crit" | "hit" | "parry" | "evade" | "reflect" | "blessing" | "wipe"
}

export function CombatFeedback() {
  const log = useSessionStore((s) => s.fight.log)
  const [tags, setTags] = useState<FloatingTag[]>([])

  useEffect(() => {
    if (log.length === 0) return
    const latest = log[log.length - 1]
    const text = latest.text

    let tag: Omit<FloatingTag, "id"> | null = null

    if (text.includes("CRITICAL")) {
      tag = { text: "CRITICAL STRIKE! ⚡", type: "crit" }
    } else if (text.includes("perfect parry")) {
      tag = { text: "PERFECT PARRY! 🛡", type: "parry" }
    } else if (text.includes("blocked")) {
      tag = { text: "BLOCKED! 🛡", type: "parry" }
    } else if (text.includes("dodged")) {
      tag = { text: "EVADED! 💨", type: "evade" }
    } else if (text.includes("reflects")) {
      const match = text.match(/reflects (\d+)/)
      tag = { text: `REFLECTED -${match ? match[1] : ""} 🪞`, type: "reflect" }
    } else if (text.includes("golden progression")) {
      tag = { text: "GOLDEN BLESSING: +1 REGEN · +1 WARD ✨", type: "blessing" }
    } else if (text.includes("progression steadies")) {
      tag = { text: "CHORD WARD: +1 SHIELD 🛡", type: "blessing" }
    } else if (text.includes("erases your melodies")) {
      tag = { text: "TRACK WIPE! 🌪", type: "wipe" }
    } else {
      const match = text.match(/for (\d+)/)
      if (match) {
        tag = { text: `-${match[1]} DMG`, type: "hit" }
      }
    }

    if (tag) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
      const newTag: FloatingTag = { ...tag, id }
      const addTimer = setTimeout(() => {
        setTags((prev) => [...prev.slice(-4), newTag])
      }, 0)

      const removeTimer = setTimeout(() => {
        setTags((prev) => prev.filter((t) => t.id !== id))
      }, 1000)

      return () => {
        clearTimeout(addTimer)
        clearTimeout(removeTimer)
      }
    }
  }, [log])

  if (tags.length === 0) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-24 z-40 flex flex-col items-center gap-2 select-none"
    >
      {tags.map((t) => (
        <div
          key={t.id}
          className={`font-mono text-sm sm:text-base font-black px-3 py-1 rounded-full border shadow-lg animate-float-up ${
            t.type === "crit"
              ? "bg-amber-500/20 text-amber-300 border-amber-400 shadow-amber-500/30 scale-110"
              : t.type === "parry"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-emerald-500/30"
                : t.type === "evade"
                  ? "bg-sky-500/20 text-sky-300 border-sky-400"
                  : t.type === "reflect"
                    ? "bg-purple-500/20 text-purple-300 border-purple-400"
                    : t.type === "blessing"
                      ? "bg-amber-400/20 text-amber-200 border-amber-300 animate-pulse-gold"
                      : t.type === "wipe"
                        ? "bg-rose-950/80 text-rose-300 border-rose-500"
                        : "bg-rose-500/20 text-rose-300 border-rose-400"
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}
