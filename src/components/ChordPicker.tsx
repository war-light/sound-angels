import { useState } from "react"
import { chordEffectFor } from "@/data/chords"
import { useSessionStore } from "@/state/useSessionStore"
import { ChordWheel } from "@/components/ChordWheel"
import { CustomChordBuilder } from "@/components/CustomChordBuilder"
import { Button } from "@/components/ui/button"

/**
 * Chord-progression workstation with two modes:
 * 1. Hymn Wheel: pre-made progression presets arranged in a ring.
 * 2. Harmonic Forge: free-form 4-bar progression builder with real-time scoring.
 */
export function ChordPicker() {
  const [tab, setTab] = useState<"wheel" | "forge">("wheel")
  const arrangement = useSessionStore((s) => s.arrangement)
  const fightKey = useSessionStore((s) => s.fight.key)

  const live = chordEffectFor(fightKey, arrangement.chords)

  return (
    <section aria-label="chord progressions" className="flex flex-col gap-3">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-muted/40 border border-border/40">
          <Button
            variant={tab === "wheel" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("wheel")}
            className="h-7 text-xs font-semibold px-3"
          >
            Hymn Wheel
          </Button>
          <Button
            variant={tab === "forge" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("forge")}
            className="h-7 text-xs font-semibold px-3 gap-1"
          >
            <span>Harmonic Forge</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/20 text-primary-foreground font-mono">
              Craft
            </span>
          </Button>
        </div>

        <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
          Active: <strong className="text-foreground">{arrangement.chords.join(" – ")}</strong> ({live.tier})
        </span>
      </div>

      {/* Tab Content */}
      {tab === "wheel" ? (
        <div className="flex flex-col gap-2">
          <ChordWheel />
          <p className="text-muted-foreground text-xs text-center" aria-live="polite">
            {live.tier} {live.total} — {live.label}
          </p>
        </div>
      ) : (
        <CustomChordBuilder />
      )}
    </section>
  )
}
