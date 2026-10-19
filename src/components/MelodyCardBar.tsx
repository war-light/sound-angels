import { useRef, useState } from "react"
import { useSessionStore } from "@/state/useSessionStore"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CardPreviewButton } from "@/components/CardPreviewButton"
import { withMelody } from "@/game/arrangement"
import { MAX_MELODY_CARDS } from "@/game/loadout"
import type { MelodyTemplate } from "@/game/melodyBank"

/**
 * The attackers' melody cards: pick one into the grid, bag the ones to carry
 * into combat, audition a card once, and snapshot the live loop as a new card.
 */
export function MelodyCardBar() {
  const arrangement = useSessionStore((s) => s.arrangement)
  const cards = useSessionStore((s) => s.melodyCards)
  const loadout = useSessionStore((s) => s.loadout)
  const activeMelodyCardId = useSessionStore((s) => s.activeMelodyCardId)
  const pendingMelodyId = useSessionStore((s) => s.pendingMelodyId)
  const selectMelodyCard = useSessionStore((s) => s.selectMelodyCard)
  const toggleLoadoutMelody = useSessionStore((s) => s.toggleLoadoutMelody)
  const saveCustomMelodyCard = useSessionStore((s) => s.saveCustomMelodyCard)
  const deleteMelodyCard = useSessionStore((s) => s.deleteMelodyCard)

  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const save = () => {
    const clean = name.trim()
    if (!clean) return
    saveCustomMelodyCard(clean)
    setName("")
    setSaving(false)
    // Hand WASD back to the loop: a focused input swallows every note key.
    inputRef.current?.blur()
  }

  const previewArrangement = (card: MelodyTemplate) =>
    withMelody(arrangement, card.tracks, card.chords)

  return (
    <div className="border border-border/70 rounded-lg p-3 bg-muted/10 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Melody Cards
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            · Bag {loadout.melodies.length}/{MAX_MELODY_CARDS}
          </span>
        </div>

        {!saving ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSaving(true)}
            className="h-6 text-xs px-2">
            + Save Current Loop
          </Button>
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              placeholder="Card name…"
              aria-label="card name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save()
                if (e.key === "Escape") {
                  setName("")
                  setSaving(false)
                  inputRef.current?.blur()
                }
              }}
              autoFocus
              className="h-6 text-xs px-2 rounded bg-background border border-border w-36 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button size="sm" onClick={save} className="h-6 text-xs px-2">
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setName("")
                setSaving(false)
              }}
              className="h-6 text-xs px-1.5 text-muted-foreground">
              ✕
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {cards.map((card) => {
          const active = activeMelodyCardId === card.id
          const pending = pendingMelodyId === card.id
          const bagged = loadout.melodies.includes(card.id)
          return (
            <div
              key={card.id}
              className={cn(
                "group flex flex-col gap-1.5 rounded border px-2.5 py-1.5 text-xs transition-colors",
                active
                  ? "border-primary bg-primary/10"
                  : pending
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/60 hover:border-primary/50 bg-background/50",
              )}>
              <span className="flex items-center gap-1.5">
                <span className="font-medium">{card.name}</span>
                {card.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] px-1 rounded bg-muted text-muted-foreground font-mono">
                    {tag}
                  </span>
                ))}
                {pending && (
                  <span className="text-[9px] font-mono uppercase text-primary">next loop</span>
                )}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => selectMelodyCard(card.id)}
                  title="Load this card into the loop grid">
                  {active ? "Loaded" : "Load"}
                </Button>
                <CardPreviewButton
                  id={`melody:${card.id}`}
                  arrangement={previewArrangement(card)}
                  layers="melody"
                />
                <Button
                  type="button"
                  variant={bagged ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => toggleLoadoutMelody(card.id)}
                  title="Carry this card into combat">
                  {bagged ? "In bag ✓" : "+ Bag"}
                </Button>
                {card.source === "custom" && (
                  <button
                    type="button"
                    onClick={() => deleteMelodyCard(card.id)}
                    className="text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    title="Delete card">
                    ✕
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
