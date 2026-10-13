import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { deckIds, slotOf } from "@/game/positions"
import type { SlotId } from "@/game/positions"
import type { Fighter } from "@/game/units"
import { useSessionStore } from "@/state/useSessionStore"

function buffGlyphs(f: Fighter): string {
  return f.buffs
    .map((b) => (b.id === "poison" ? "☠" : b.id === "regen" ? "+" : b.id === "exposed" ? "!" : "◈"))
    .join("")
}

function Card({
  f,
  role,
  selected,
  performing,
  onClick,
  onLead,
}: {
  f: Fighter
  role: string
  selected: boolean
  performing: boolean
  onClick: () => void
  onLead: () => void
}) {
  return (
    <div
      className={cn(
        "border-border flex flex-col gap-1 rounded-md border p-2",
        selected && "border-primary",
        performing && "bg-accent",
      )}
    >
      <button onClick={onClick} className="flex items-baseline justify-between text-left" title="select to move">
        <span className="text-xs font-medium">
          {f.name} {performing && <span aria-label="performing">♪</span>}
        </span>
        <span className="text-muted-foreground font-mono text-[10px]">
          {f.instrument} · {role}
        </span>
      </button>
      <div className="flex items-center gap-1">
        <div className="bg-muted relative h-1.5 flex-1 overflow-hidden rounded-full">
          <div className="bg-primary h-full" style={{ width: `${(f.hp / f.max) * 100}%` }} />
          {f.shield > 0 && (
            <div
              className="absolute inset-y-0 left-0 bg-cyan-300/70"
              style={{ width: `${Math.min(100, (f.shield / f.max) * 100)}%` }}
            />
          )}
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {f.hp}{f.shield > 0 ? `+${f.shield}` : ""}{buffGlyphs(f)}
        </span>
      </div>
      <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={onLead}>
        {performing ? "leading" : "take the lead"}
      </Button>
    </div>
  )
}

/**
 * Party corner: deck + back row (chord/beat) + front row (attackers).
 * Click a card to select, click a slot to place; selected cards can go
 * back to the deck. Click-click keeps it touch- and keyboard-friendly.
 */
export function PartyCorner() {
  const fight = useSessionStore((s) => s.fight)
  const moveFighter = useSessionStore((s) => s.moveFighter)
  const performerId = useSessionStore((s) => s.performerId)
  const setPerformer = useSessionStore((s) => s.setPerformer)
  const [selected, setSelected] = useState<string | null>(null)

  const byId = new Map(fight.party.map((f) => [f.id, f]))
  const deck = deckIds(fight.party.map((f) => f.id), fight.slots)
  const place = (slot: SlotId | null) => {
    if (selected) {
      moveFighter(selected, slot)
      setSelected(null)
    }
  }

  const slotRow = (label: string, slot: SlotId, ids: (string | null)[]) => (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => selected && ids.length === 1 && place(slot)}
        className={cn(
          "text-muted-foreground text-left text-[10px] tracking-widest uppercase",
          selected && ids.length === 1 && "text-foreground underline",
        )}
        title={selected ? `place ${selected} here` : label}
      >
        {label}
      </button>
      {ids.map((id) =>
        id && byId.get(id) ? (
          <Card
            key={id}
            f={byId.get(id)!}
            role={slotOf(fight.slots, id) ?? slot}
            selected={selected === id}
            performing={performerId === id || (performerId == null && slot === "front" && fight.slots.front[0] === id)}
            onClick={() => setSelected(selected === id ? null : id)}
            onLead={() => setPerformer(id)}
          />
        ) : (
          <div
            key={`${slot}-empty`}
            className={cn(
              "border-border rounded-md border border-dashed p-2 text-center text-[11px] text-muted-foreground",
              selected && "border-primary text-foreground",
            )}
          >
            {selected ? "place here" : "empty"}
          </div>
        ),
      )}
    </div>
  )

  return (
    <section aria-label="party" className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs tracking-widest uppercase">party</p>
      {slotRow("back · chords", "chord", [fight.slots.chord])}
      {slotRow("back · beat", "beat", [fight.slots.beat])}
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground text-[10px] tracking-widest uppercase">
          front · attackers
        </span>
        {fight.slots.front.map((id) =>
          byId.get(id) ? (
            <Card
              key={id}
              f={byId.get(id)!}
              role="front"
              selected={selected === id}
              performing={performerId === id || (performerId == null && fight.slots.front[0] === id)}
              onClick={() => setSelected(selected === id ? null : id)}
              onLead={() => setPerformer(id)}
            />
          ) : null,
        )}
        {selected && (
          <Button size="sm" variant="outline" onClick={() => place("front")}>
            send {byId.get(selected)?.name ?? selected} to the front
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground text-[10px] tracking-widest uppercase">deck</span>
        {deck.length === 0 && (
          <p className="text-muted-foreground text-[11px]">everyone is placed.</p>
        )}
        {deck.map((id) =>
          byId.get(id) ? (
            <Card
              key={id}
              f={byId.get(id)!}
              role="deck"
              selected={selected === id}
              performing={false}
              onClick={() => setSelected(selected === id ? null : id)}
              onLead={() => setPerformer(id)}
            />
          ) : null,
        )}
        {selected && slotOf(fight.slots, selected) && (
          <Button size="sm" variant="outline" onClick={() => place(null)}>
            back to deck
          </Button>
        )}
      </div>
    </section>
  )
}
