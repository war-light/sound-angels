import { useEffect, useRef } from "react"
import { useSessionStore } from "@/state/useSessionStore"

export function CombatLog() {
  const log = useSessionStore((s) => s.fight.log)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === "function") {
      bottomRef.current.scrollIntoView({ block: "end" })
    }
  }, [log.length])

  return (
    <section
      role="log"
      aria-live="polite"
      aria-label="combat log"
      className="flex flex-col gap-1 font-mono text-xs"
    >
      {log.map((entry, i) => (
        <p key={`${entry.tick}-${i}`} className="text-muted-foreground">
          <span className="opacity-60">[{entry.tick}]</span> {entry.text}
        </p>
      ))}
      <div ref={bottomRef} />
    </section>
  )
}
