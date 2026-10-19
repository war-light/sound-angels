import { useState, useId } from "react"
import { useSessionStore } from "@/state/useSessionStore"
import { scoreProgression, pitchClassOfMidi, romanToChord, type Key } from "@/game/theory"
import { chordEffectFor } from "@/data/chords"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { playChordChange } from "@/audio/sfx"

const ROMAN_PALETTE_MAJOR = ["I", "ii", "iii", "IV", "V", "V7", "vi", "vii°", "i", "iv", "VI", "VII"]
const ROMAN_PALETTE_MINOR = ["i", "ii°", "III", "iv", "v", "V", "V7", "VI", "VII", "vii°", "I", "IV"]

interface CustomChordBuilderProps {
  /** Called after a progression is applied (used to close the mid-fight dialog). */
  onApplied?: () => void
}

/** Ten-tick readout for a 0..100 quality metric (no inline widths). */
function MetricBar({ value }: { value: number }) {
  const filled = Math.round(Math.max(0, Math.min(100, value)) / 10)
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={cn("h-1.5 flex-1 rounded-full", i < filled ? "bg-primary" : "bg-muted/40")}
        />
      ))}
    </div>
  )
}

export function CustomChordBuilder({ onApplied }: CustomChordBuilderProps) {
  const fightKey = useSessionStore((s) => s.fight.key)
  const arrangementChords = useSessionStore((s) => s.arrangement.chords)
  const setChords = useSessionStore((s) => s.setChords)
  const saveCustomPreset = useSessionStore((s) => s.saveCustomChordPreset)
  const playing = useSessionStore((s) => s.playing)
  const chartOpen = useSessionStore((s) => s.fight.activeQte != null)
  const requestChordChart = useSessionStore((s) => s.requestChordChart)

  const [bars, setBars] = useState<string[]>([...arrangementChords])
  const [activeBar, setActiveBar] = useState<number>(0)
  const [presetName, setPresetName] = useState("")
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const presetInputId = useId()

  const isMinor = /minor|aeolian|dorian|phrygian/i.test(fightKey.scale)
  const palette = isMinor ? ROMAN_PALETTE_MINOR : ROMAN_PALETTE_MAJOR
  const busy = playing && chartOpen

  const score = scoreProgression(fightKey, bars)
  const effect = chordEffectFor(fightKey, bars)

  const handleSelectRoman = (roman: string) => {
    const next = [...bars]
    next[activeBar] = roman
    setBars(next)
    // Advance to next bar automatically for fast composition
    setActiveBar((activeBar + 1) % bars.length)
  }

  const handleApply = () => {
    if (busy) return
    playChordChange()
    if (playing) {
      requestChordChart(bars)
    } else {
      setChords(bars)
    }
    setSavedMessage("Applied to current arrangement!")
    setTimeout(() => setSavedMessage(null), 2500)
    onApplied?.()
  }

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault()
    const name = presetName.trim()
    if (!name) return
    saveCustomPreset(name, bars)
    setPresetName("")
    setSavedMessage(`Saved "${name}" to your progressions!`)
    setTimeout(() => setSavedMessage(null), 2500)
  }

  const getChordNotes = (key: Key, roman: string): string => {
    try {
      const midis = romanToChord(key, roman)
      return midis.map(pitchClassOfMidi).join(" · ")
    } catch {
      return "—"
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card/80 p-4 text-foreground shadow-sm backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <span>Harmonic Forge</span>
            <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-mono uppercase text-primary">
              Custom Crafting
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Arrange {bars.length} Roman numerals in {fightKey.tonic} {fightKey.scale}. High craft scores unlock battle blessings.
          </p>
        </div>
      </div>

      {/* Bar Slot Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {bars.map((roman, idx) => {
          const isSelected = activeBar === idx
          const notes = getChordNotes(fightKey, roman)
          return (
            <Button
              key={`bar-${idx}`}
              type="button"
              variant={isSelected ? "default" : "outline"}
              aria-pressed={isSelected}
              onClick={() => setActiveBar(idx)}
              className={cn(
                "relative h-auto flex-col items-center gap-1 whitespace-normal px-3 py-3 text-center",
                isSelected ? "ring-1 ring-primary" : "border-border/70 bg-card/60",
              )}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider opacity-70">
                Bar {idx + 1}
              </span>
              <span className="font-mono text-xl font-bold tracking-tight">{roman}</span>
              <span className="font-mono text-[11px] opacity-80">{notes}</span>
            </Button>
          )
        })}
      </div>

      {/* Roman Numeral Selector Palette */}
      <div className="space-y-1.5 rounded-lg border border-border/40 bg-muted/20 p-2.5">
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span>Choose chord for Bar {activeBar + 1}:</span>
          <span className="font-mono text-[10px] uppercase">
            Current: {bars[activeBar]} ({getChordNotes(fightKey, bars[activeBar])})
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {palette.map((r) => {
            const isCurrent = bars[activeBar] === r
            return (
              <Button
                key={r}
                variant={isCurrent ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelectRoman(r)}
                className="h-7 min-w-9 px-2.5 font-mono text-xs font-semibold"
              >
                {r}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Live Scoring & Combat Blessing Preview */}
      <div className="grid gap-3 rounded-lg border border-border/60 bg-card p-3 sm:grid-cols-2">
        {/* Quality Metrics */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Harmonic Quality
            </span>
            <span
              className={cn(
                "rounded border px-2 py-0.5 font-mono text-[11px] font-bold uppercase",
                score.tier === "gold" && "border-amber-500/30 bg-amber-500/20 text-amber-400",
                score.tier === "silver" && "border-slate-400/30 bg-slate-300/20 text-slate-200",
                score.tier === "bronze" && "border-orange-700/30 bg-orange-700/20 text-orange-400",
              )}
            >
              {score.tier} Tier ({score.total}/100)
            </span>
          </div>

          {/* Metric Bars */}
          <div className="space-y-1 font-mono text-[10px]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Voice Leading (Parsimony):</span>
                <span className="font-semibold">{score.voiceLeading}/100</span>
              </div>
              <MetricBar value={score.voiceLeading} />
            </div>
            <div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground">Diatonic Scale Fit:</span>
                <span className="font-semibold">{score.diatonicFit}/100</span>
              </div>
              <MetricBar value={score.diatonicFit} />
            </div>
            <div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground">Harmonic Cadence (Syntax):</span>
                <span className="font-semibold">{score.syntax}/100</span>
              </div>
              <MetricBar value={score.syntax} />
            </div>
          </div>
        </div>

        {/* Combat Blessing */}
        <div className="flex flex-col justify-between space-y-2 border-t border-border/40 pt-2 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Combat Blessing
            </span>
            <p className="text-xs font-medium leading-relaxed text-foreground">{effect.label}</p>
          </div>

          <div className="flex flex-wrap gap-2 font-mono text-[10px]">
            <span className={cn("rounded px-1.5 py-0.5", effect.regen > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-muted/30 text-muted-foreground")}>
              +{effect.regen} HP Regen
            </span>
            <span className={cn("rounded px-1.5 py-0.5", effect.ward > 0 ? "bg-cyan-500/20 text-cyan-400" : "bg-muted/30 text-muted-foreground")}>
              +{effect.ward} Shield Ward
            </span>
            <span className={cn("rounded px-1.5 py-0.5", effect.bonusDamage > 0 ? "bg-amber-500/20 text-amber-400" : "bg-muted/30 text-muted-foreground")}>
              +{effect.bonusDamage} Attack Dmg
            </span>
          </div>
        </div>
      </div>

      {/* Actions and Save Preset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <form onSubmit={handleSavePreset} className="flex items-center gap-2">
          <label htmlFor={presetInputId} className="sr-only">Progression Name</label>
          <input
            id={presetInputId}
            type="text"
            placeholder="Name your progression…"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="h-8 w-36 rounded border border-border/70 bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-44"
          />
          <Button type="submit" variant="outline" size="sm" className="h-8 text-xs font-semibold">
            Save Progression
          </Button>
        </form>

        <div className="flex items-center gap-2">
          {savedMessage && (
            <span className="text-xs font-semibold text-emerald-400 animate-in fade-in">{savedMessage}</span>
          )}
          <Button
            size="sm"
            disabled={busy}
            onClick={handleApply}
            className="h-8 bg-primary px-4 font-bold text-primary-foreground hover:bg-primary/90"
          >
            {playing ? "Perform Swap Chart ⚔" : "Apply Progression"}
          </Button>
        </div>
      </div>
    </div>
  )
}
