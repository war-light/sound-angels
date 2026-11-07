import { useState } from "react"
import { CHORD_PRESETS, chordEffectFor, type ChordPreset } from "@/data/chords"
import { pitchClassOfMidi, romanToChord, type Key } from "@/game/theory"
import { useSessionStore } from "@/state/useSessionStore"
import { CustomChordBuilder } from "@/components/CustomChordBuilder"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChordPickerProps {
  /** Called after a progression is picked (used to close the mid-fight dialog). */
  onApplied?: () => void
}

/** Short absolute label for one chord, e.g. "Am", "G7" root, "Bdim". */
function chordLabel(key: Key, roman: string): string {
  try {
    const m = romanToChord(key, roman)
    const root = pitchClassOfMidi(m[0])
    const third = (((m[1] - m[0]) % 12) + 12) % 12
    const fifth = (((m[2] - m[0]) % 12) + 12) % 12
    if (fifth === 8) return `${root}aug`
    if (fifth === 6) return `${root}dim`
    if (third === 3) return `${root}m`
    return root
  } catch {
    return "—"
  }
}

function voicingOf(key: Key, romans: string[]): string {
  return romans.map((r) => chordLabel(key, r)).join(" – ")
}

/** True when the live arrangement already loops this progression. */
function matchesLive(live: string[], romans: string[]): boolean {
  if (live.length === 0 || romans.length === 0) return false
  return live.every((c, b) => c === romans[b % romans.length])
}

function AuraSummary({ regen, ward, bonusDamage }: { regen: number; ward: number; bonusDamage: number }) {
  const parts: string[] = []
  if (regen > 0) parts.push(`+${regen} regen`)
  if (ward > 0) parts.push(`+${ward} ward`)
  if (bonusDamage > 0) parts.push(`+${bonusDamage} dmg`)
  return <>{parts.length > 0 ? parts.join(" · ") : "no blessing"}</>
}

/**
 * Chord-progression workstation: one-click cards for popular progressions
 * (built-in and saved customs) with the Harmonic Forge below for free
 * crafting. Pre-fight picks apply instantly; mid-fight they open a chart
 * and mute the soloists until the new progression lands on the next bar.
 */
export function ChordPicker({ onApplied }: ChordPickerProps) {
  const [forgeOpen, setForgeOpen] = useState(false)
  const arrangement = useSessionStore((s) => s.arrangement)
  const fightKey = useSessionStore((s) => s.fight.key)
  const playing = useSessionStore((s) => s.playing)
  const chartOpen = useSessionStore((s) => s.fight.activeQte != null)
  const setChords = useSessionStore((s) => s.setChords)
  const customPresets = useSessionStore((s) => s.customChordPresets)

  const busy = playing && chartOpen
  const live = chordEffectFor(fightKey, arrangement.chords)

  const pick = (romans: string[]) => {
    if (busy) return
    setChords(romans)
    onApplied?.()
  }

  const card = (preset: ChordPreset, custom: boolean) => {
    const selected = matchesLive(arrangement.chords, preset.romans)
    const effect = chordEffectFor(fightKey, preset.romans)
    const tierTone =
      effect.tier === "gold"
        ? "text-amber-400 border-amber-500/40"
        : effect.tier === "silver"
          ? "text-slate-200 border-slate-400/40"
          : "text-orange-400 border-orange-700/40"
    return (
      <Button
        key={`${custom ? "custom" : "builtin"}-${preset.name}`}
        type="button"
        variant={selected ? "default" : "outline"}
        aria-pressed={selected}
        disabled={busy}
        onClick={() => pick(preset.romans)}
        className={cn(
          "h-auto w-full flex-col items-start gap-1 whitespace-normal px-3 py-2.5 text-left",
        )}
      >
        <span className="flex w-full items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold">
            {preset.name}
            {custom && (
              <span
                className={cn(
                  "rounded-full border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider",
                  selected ? "border-primary-foreground/40" : "border-primary/40 text-primary",
                )}
              >
                Custom
              </span>
            )}
          </span>
          <span className={cn("shrink-0 rounded border px-1.5 text-[10px] font-mono uppercase", tierTone)}>
            {effect.tier} {effect.total}
          </span>
        </span>
        <span className="font-mono text-sm font-semibold">{preset.romans.join(" – ")}</span>
        <span className="text-muted-foreground text-[11px]">{voicingOf(fightKey, preset.romans)}</span>
        <span className="text-muted-foreground text-[10px]">
          <AuraSummary regen={effect.regen} ward={effect.ward} bonusDamage={effect.bonusDamage} />
          {preset.description ? ` · ${preset.description}` : ""}
        </span>
      </Button>
    )
  }

  return (
    <section aria-label="chord progressions" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-mono text-muted-foreground">
          Active: <strong className="text-foreground">{arrangement.chords.join(" – ")}</strong> (
          {live.tier} {live.total})
        </span>
        <span className="text-muted-foreground text-[11px]" aria-live="polite">
          {playing
            ? busy
              ? "a chart is open — finish it before swapping"
              : "mid-fight: picks open a chart, soloists mute until the next bar"
            : "pre-fight: picks are free"}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {CHORD_PRESETS.map((p) => card(p, false))}
        {customPresets.map((p) => card(p, true))}
      </div>

      <div className="border-t border-border/50 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={forgeOpen}
          onClick={() => setForgeOpen((o) => !o)}
          className="text-xs font-semibold"
        >
          {forgeOpen ? "▾" : "▸"} Harmonic Forge — craft your own
        </Button>
        {forgeOpen && (
          <div className="pt-3">
            <CustomChordBuilder onApplied={onApplied} />
          </div>
        )}
      </div>
    </section>
  )
}
