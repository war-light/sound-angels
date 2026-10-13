import { useSessionStore } from "@/state/useSessionStore"

/**
 * QTE panel placeholder. Sized and docked where the Phase-3 rhythm-match
 * lane mounts; read-only until then (derives enemy charge from gauges).
 */
export function QtePanel() {
  const fight = useSessionStore((s) => s.fight)

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
      className="border-border flex items-center justify-between gap-3 rounded-md border border-dashed p-3"
    >
      <div className="flex items-center gap-3">
        <div className="grid grid-cols-4 gap-1" aria-hidden>
          {["W", "A", "S", "D"].map((k) => (
            <kbd key={k} className="border-border rounded border px-2 py-1 font-mono text-xs text-muted-foreground">
              {k}
            </kbd>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">
          {fight.over
            ? "the hall is still."
            : hottest >= 100
              ? `${hottestName} strikes!`
              : hottest >= 50
                ? `${hottestName} gathers… ${Math.round(hottest)}%`
                : "the enemy is silent."}
        </p>
      </div>
      <p className="text-muted-foreground font-mono text-[10px]">qte · phase 3</p>
    </section>
  )
}
