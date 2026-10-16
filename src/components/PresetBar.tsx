import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { countOnsets } from "@/game/arrangement"
import { useSessionStore } from "@/state/useSessionStore"

/**
 * Melody-set presets: bottle the current loop, run it back once the
 * cooldown ends. Identical sets share one cooldown; deleting and remaking
 * the same set does not reset it.
 */
export function PresetBar() {
  const arrangement = useSessionStore((s) => s.arrangement)
  const fight = useSessionStore((s) => s.fight)
  const playing = useSessionStore((s) => s.playing)
  const presets = useSessionStore((s) => s.presets)
  const saveMelodyPreset = useSessionStore((s) => s.saveMelodyPreset)
  const recallMelodyPreset = useSessionStore((s) => s.recallMelodyPreset)
  const [name, setName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const entries = Object.values(presets).filter((e) => !e.deleted)
  const faded = Object.values(fight.potency).filter((p) => p < 1).length

  const canBottle = name.trim() !== "" && countOnsets(arrangement) > 0
  const bottle = () => {
    if (!canBottle) return
    saveMelodyPreset(name)
    setName("")
    // Hand WASD back to the loop: a focused input swallows every note key.
    inputRef.current?.blur()
  }

  return (
    <section aria-label="melody presets" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs tracking-widest uppercase">
          bottles
        </span>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") bottle()
            else if (e.key === "Escape") {
              setName("")
              inputRef.current?.blur()
            }
          }}
          placeholder="name this loop…"
          aria-label="preset name"
          className="border-border bg-background h-7 rounded-md border px-2 text-xs"
        />
        <Button
          
          variant="outline"
          className="h-7 text-[11px]"
          disabled={!canBottle}
          onClick={bottle}
          title="bottle the current melodies (starts a cooldown)"
        >
          bottle it
        </Button>
        {faded > 0 && (
          <span className="text-muted-foreground font-mono text-[10px]">
            {faded} {faded === 1 ? "voice fading" : "voices fading"}
          </span>
        )}
      </div>
      {entries.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {entries.map((e) => {
            const remaining = e.cooldownUntilTick - fight.tick
            const ready = remaining <= 0
            const chartOpen = fight.activeQte != null
            return (
              <Button
                key={e.hash}
                
                variant="ghost"
                className="h-6 text-[11px]"
                disabled={!ready || !!fight.over}
                onClick={() => recallMelodyPreset(e.hash)}
                title={
                  ready
                    ? playing
                      ? chartOpen
                        ? "a chart is already open"
                        : "run it back — opens a match-it chart"
                      : "run it back at full strength"
                    : `cooling down · ${remaining} ticks`
                }
              >
                {e.name} {ready ? (playing ? "♪?" : "↻") : `· ${remaining}`}
              </Button>
            )
          })}
        </div>
      )}
    </section>
  )
}
