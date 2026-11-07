import { useRef, useState } from "react"
import { useSessionStore } from "@/state/useSessionStore"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CardPreviewButton } from "@/components/CardPreviewButton"
import { setGroove, withMelody } from "@/game/arrangement"

/**
 * In-combat card bar: the grooves and melodies carried into the fight. Picks
 * are queued and swap in on the next loop boundary, so the pulse never breaks.
 * The live loop can also be snapshotted into a new custom card mid-fight.
 */
export function LoadoutBar() {
  const arrangement = useSessionStore((s) => s.arrangement)
  const loadout = useSessionStore((s) => s.loadout)
  const grooveChoices = useSessionStore((s) => s.grooveChoices)
  const melodyCards = useSessionStore((s) => s.melodyCards)
  const activeMelodyCardId = useSessionStore((s) => s.activeMelodyCardId)
  const pendingGrooveId = useSessionStore((s) => s.pendingGrooveId)
  const pendingMelodyId = useSessionStore((s) => s.pendingMelodyId)
  const selectGrooveCard = useSessionStore((s) => s.selectGrooveCard)
  const selectMelodyCard = useSessionStore((s) => s.selectMelodyCard)
  const saveCustomMelodyCard = useSessionStore((s) => s.saveCustomMelodyCard)
  const playing = useSessionStore((s) => s.playing)

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

  const grooves = loadout.grooves
    .map((id) => grooveChoices.find((g) => g.id === id))
    .filter((g): g is NonNullable<typeof g> => g != null)
  const melodies = loadout.melodies
    .map((id) => melodyCards.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c != null)

  const equippedGrooveId = arrangement.groove.id

  return (
    <section aria-label="Card loadout" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground text-xs tracking-widest uppercase">rigs</span>
        {grooves.map((g) => {
          const equipped = equippedGrooveId === g.id
          const pending = pendingGrooveId === g.id
          return (
            <div
              key={g.id}
              className={cn(
                "flex items-center gap-1 rounded border px-2 py-1 text-xs",
                equipped
                  ? "border-primary bg-primary/10"
                  : pending
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/60 bg-background/50",
              )}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[11px]"
                onClick={() => selectGrooveCard(g.id)}
                title={g.blurb}>
                {g.name}
                {pending ? " · next loop" : ""}
              </Button>
              <CardPreviewButton
                id={`groove:${g.id}`}
                arrangement={setGroove(arrangement, g)}
                layers="drums"
                disabled={playing}
              />
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground text-xs tracking-widest uppercase">melodies</span>
        {!saving ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[11px]"
            onClick={() => setSaving(true)}
            title="Snapshot the live loop into a new card">
            + Save loop
          </Button>
        ) : (
          <span className="flex items-center gap-1">
            <input
              ref={inputRef}
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
              placeholder="Card name…"
              aria-label="card name"
              autoFocus
              className="border-border bg-background h-6 w-36 rounded border px-2 text-xs"
            />
            <Button type="button" size="sm" className="h-6 px-2 text-[11px]" onClick={save}>
              Save
            </Button>
          </span>
        )}
        {melodies.map((c) => {
          const active = activeMelodyCardId === c.id
          const pending = pendingMelodyId === c.id
          return (
            <div
              key={c.id}
              className={cn(
                "flex items-center gap-1 rounded border px-2 py-1 text-xs",
                active
                  ? "border-primary bg-primary/10"
                  : pending
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/60 bg-background/50",
              )}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[11px]"
                onClick={() => selectMelodyCard(c.id)}
                title={c.description}>
                {c.name}
                {pending ? " · next loop" : ""}
              </Button>
              <CardPreviewButton
                id={`melody:${c.id}`}
                arrangement={withMelody(arrangement, c.tracks, c.chords)}
                layers="melody"
                disabled={playing}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
