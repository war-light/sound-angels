import { Meter } from "@/components/Meter"
import { STAGE_COMBOS } from "@/data/stageClips"
import { stepsUntilStrike, strikeCharge } from "@/game/stageCombat"
import { STAGE_STEPS_PER_BAR } from "@/game/stageMusic"
import { isDown, type Fighter } from "@/game/units"
import { cn } from "@/lib/utils"
import { useSessionStore } from "@/state/useSessionStore"

function Vitals({ f }: { f: Fighter }) {
  return (
    <>
      <Meter value={(f.hp / f.max) * 100} barClass="bg-rose-500" className="h-2" />
      <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>
          {f.hp}/{f.max} hp
        </span>
        {f.shield > 0 && <span className="text-sky-300">🛡 {f.shield}</span>}
      </div>
    </>
  )
}

export function StageFoes() {
  const stage = useSessionStore((s) => s.stage)
  return (
    <section aria-label="Enemies" className="flex flex-col gap-3">
      {stage.enemies.map((foe, i) => {
        const dead = isDown(foe)
        const charge = strikeCharge(stage, i)
        const left = stepsUntilStrike(stage, i)
        const exposed = foe.buffs.find((b) => b.id === "exposed")
        return (
          <div
            key={foe.id}
            className={cn(
              "flex flex-col gap-1.5 rounded-xl border border-border/70 bg-card/60 p-3",
              dead && "opacity-40 grayscale",
              !dead && charge >= 0.75 && "border-rose-500 bg-rose-950/20",
            )}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{foe.name}</h3>
              {exposed && <span className="font-mono text-[10px] text-amber-300">◎ exposed {exposed.power}%</span>}
              {dead && <span className="font-mono text-[10px] text-rose-300">DOWN</span>}
            </div>
            <Vitals f={foe} />
            {!dead && left != null && (
              <>
                <Meter value={charge * 100} barClass="bg-amber-500" className="h-1.5" />
                <span className="font-mono text-[10px] text-muted-foreground">
                  strikes in {Math.ceil(left / STAGE_STEPS_PER_BAR)} bars
                </span>
              </>
            )}
          </div>
        )
      })}
    </section>
  )
}

export function StageParty() {
  const party = useSessionStore((s) => s.stage.party)
  const discovered = useSessionStore((s) => s.stage.discovered)
  return (
    <section aria-label="Party" className="flex flex-col gap-3">
      {party.map((f) => (
        <div
          key={f.id}
          className={cn("flex flex-col gap-1.5 rounded-xl border border-border/70 bg-card/60 p-3", isDown(f) && "opacity-40 grayscale")}>
          <h3 className="text-sm font-bold">
            {f.avatar} {f.name}
          </h3>
          <Vitals f={f} />
        </div>
      ))}
      <div className="rounded-xl border border-border/70 bg-card/40 p-3">
        <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Combos {discovered.length}/{STAGE_COMBOS.length}
        </h3>
        <ul className="flex flex-col gap-1 text-xs">
          {STAGE_COMBOS.map((c) => (
            <li key={c.id} className={discovered.includes(c.id) ? "text-primary" : "text-muted-foreground/60"}>
              {discovered.includes(c.id) ? `✦ ${c.name}` : "? ? ?"}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
