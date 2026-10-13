import { useSessionStore } from "@/state/useSessionStore"

export function FoePanel() {
  const fight = useSessionStore((s) => s.fight)

  return (
    <section className="border-border flex flex-col gap-2 rounded-md border p-4">
      <p className="text-muted-foreground text-xs tracking-widest uppercase">foes</p>
      {fight.enemies.map((f, i) => {
        const profile = fight.enemyProfiles[f.id]
        const gauge = fight.gauges[i] ?? 0
        return (
          <div key={f.id} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between text-xs">
              <span>
                {f.name}{" "}
                <span className="text-muted-foreground font-mono">
                  {f.hp}{f.shield > 0 ? `+${f.shield}` : ""}
                </span>
              </span>
              <span className="text-muted-foreground font-mono text-[10px]">
                {profile.archetype}
                {profile.reflect ? ` · reflects ${profile.reflect}` : ""}
                {profile.trackWipe ? " · erases tracks" : ""}
                {f.buffs.length > 0 && (
                  <> · {f.buffs.map((b) => (b.id === "poison" ? "☠" : b.id === "regen" ? "+" : b.id === "exposed" ? "!" : "◈")).join("")}</>
                )}
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-destructive h-full rounded-full"
                style={{ width: `${(f.hp / f.max) * 100}%` }}
              />
            </div>
            <div className="bg-muted h-1 overflow-hidden rounded-full">
              <div className="bg-muted-foreground h-full rounded-full" style={{ width: `${gauge}%` }} />
            </div>
          </div>
        )
      })}
    </section>
  )
}
