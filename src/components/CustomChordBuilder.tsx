import { useState, useId } from "react"
import { useSessionStore } from "@/state/useSessionStore"
import { scoreProgression, pitchClassOfMidi, romanToChord, type Key } from "@/game/theory"
import { chordEffectFor, CHORD_PRESETS } from "@/data/chords"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { playChordChange } from "@/audio/sfx"

const ROMAN_PALETTE_MAJOR = ["I", "ii", "iii", "IV", "V", "V7", "vi", "vii°", "i", "iv", "VI", "VII"]
const ROMAN_PALETTE_MINOR = ["i", "ii°", "III", "iv", "v", "V", "V7", "VI", "VII", "vii°", "I", "IV"]

export function CustomChordBuilder() {
  const fightKey = useSessionStore((s) => s.fight.key)
  const arrangementChords = useSessionStore((s) => s.arrangement.chords)
  const setChords = useSessionStore((s) => s.setChords)
  const saveCustomPreset = useSessionStore((s) => s.saveCustomChordPreset)
  const playing = useSessionStore((s) => s.playing)
  const requestChordChart = useSessionStore((s) => s.requestChordChart)

  const [bars, setBars] = useState<string[]>([...arrangementChords])
  const [activeBar, setActiveBar] = useState<number>(0)
  const [presetName, setPresetName] = useState("")
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const presetInputId = useId()

  const isMinor = /minor|aeolian|dorian|phrygian/i.test(fightKey.scale)
  const palette = isMinor ? ROMAN_PALETTE_MINOR : ROMAN_PALETTE_MAJOR

  const score = scoreProgression(fightKey, bars)
  const effect = chordEffectFor(fightKey, bars)

  const handleSelectRoman = (roman: string) => {
    const next = [...bars]
    next[activeBar] = roman
    setBars(next)
    // Advance to next bar automatically for fast composition
    setActiveBar((activeBar + 1) % 4)
  }

  const handleApply = () => {
    playChordChange()
    if (playing) {
      requestChordChart(bars)
    } else {
      setChords(bars)
    }
    setSavedMessage("Applied to current arrangement!")
    setTimeout(() => setSavedMessage(null), 2500)
  }

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault()
    const name = presetName.trim()
    if (!name) return
    saveCustomPreset(name, bars)
    setPresetName("")
    setSavedMessage(`Saved "${name}" to Hymns!`)
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
    <div className="flex flex-col gap-4 p-4 rounded-xl border border-border/80 bg-card/80 backdrop-blur-sm shadow-sm text-foreground">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
        <div>
          <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
            <span>Harmonic Forge</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 uppercase">
              Custom Crafting
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Arrange 4 Roman numerals in {fightKey.tonic} {fightKey.scale}. High craft scores unlock battle blessings.
          </p>
        </div>

        {/* Quick template load */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground uppercase font-mono mr-1">Base:</span>
          {CHORD_PRESETS.slice(0, 4).map((p) => (
            <Button
              key={p.name}
              variant="outline"
              size="sm"
              onClick={() => setBars([...p.romans])}
              className="h-6 text-[10px] px-2"
              title={p.romans.join(" – ")}
            >
              {p.name}
            </Button>
          ))}
        </div>
      </div>

      {/* 4-Bar Slot Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {bars.map((roman, idx) => {
          const isSelected = activeBar === idx
          const notes = getChordNotes(fightKey, roman)
          return (
            <button
              key={`bar-${idx}`}
              type="button"
              onClick={() => setActiveBar(idx)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all cursor-pointer relative",
                isSelected
                  ? "border-primary bg-primary/10 shadow-[0_0_12px_rgba(var(--primary),0.2)] ring-1 ring-primary"
                  : "border-border/70 bg-card/60 hover:border-border hover:bg-card",
              )}
            >
              <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider mb-1">
                Bar {idx + 1}
              </span>
              <span className="text-xl font-bold font-mono tracking-tight text-foreground">{roman}</span>
              <span className="text-[11px] font-mono text-muted-foreground mt-1">{notes}</span>
              {isSelected && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Roman Numeral Selector Palette */}
      <div className="space-y-1.5 bg-muted/20 p-2.5 rounded-lg border border-border/40">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
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
                className="h-7 text-xs font-mono font-semibold px-2.5 min-w-9"
              >
                {r}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Live Scoring & Combat Blessing Preview */}
      <div className="grid sm:grid-cols-2 gap-3 p-3 rounded-lg bg-card border border-border/60">
        {/* Quality Metrics */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
              Harmonic Quality
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded font-mono font-bold text-[11px] uppercase",
                score.tier === "gold" && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                score.tier === "silver" && "bg-slate-300/20 text-slate-200 border border-slate-400/30",
                score.tier === "bronze" && "bg-orange-700/20 text-orange-400 border border-orange-700/30",
              )}
            >
              {score.tier} Tier ({score.total}/100)
            </span>
          </div>

          {/* Metric Bars */}
          <div className="space-y-1 font-mono text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Voice Leading (Parsimony):</span>
              <span className="font-semibold">{score.voiceLeading}/100</span>
            </div>
            <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${score.voiceLeading}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-muted-foreground">Diatonic Scale Fit:</span>
              <span className="font-semibold">{score.diatonicFit}/100</span>
            </div>
            <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${score.diatonicFit}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-muted-foreground">Harmonic Cadence (Syntax):</span>
              <span className="font-semibold">{score.syntax}/100</span>
            </div>
            <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${score.syntax}%` }}
              />
            </div>
          </div>
        </div>

        {/* Combat Blessing */}
        <div className="flex flex-col justify-between border-t sm:border-t-0 sm:border-l border-border/40 pt-2 sm:pt-0 sm:pl-3 space-y-2">
          <div>
            <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1">
              Combat Blessing
            </span>
            <p className="text-xs leading-relaxed text-foreground font-medium">
              {effect.label}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-[10px] font-mono">
            <span className={cn("px-1.5 py-0.5 rounded", effect.regen > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-muted/30 text-muted-foreground")}>
              +{effect.regen} HP Regen
            </span>
            <span className={cn("px-1.5 py-0.5 rounded", effect.ward > 0 ? "bg-cyan-500/20 text-cyan-400" : "bg-muted/30 text-muted-foreground")}>
              +{effect.ward} Shield Ward
            </span>
            <span className={cn("px-1.5 py-0.5 rounded", effect.bonusDamage > 0 ? "bg-amber-500/20 text-amber-400" : "bg-muted/30 text-muted-foreground")}>
              +{effect.bonusDamage} Attack Dmg
            </span>
          </div>
        </div>
      </div>

      {/* Actions and Save Preset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <form onSubmit={handleSavePreset} className="flex items-center gap-2">
          <label htmlFor={presetInputId} className="sr-only">Hymn Name</label>
          <input
            id={presetInputId}
            type="text"
            placeholder="Name your hymn…"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="h-8 px-2.5 text-xs rounded border border-border/70 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-36 sm:w-44"
          />
          <Button type="submit" variant="outline" size="sm" className="h-8 text-xs font-semibold">
            Save Hymn
          </Button>
        </form>

        <div className="flex items-center gap-2">
          {savedMessage && (
            <span className="text-xs font-semibold text-emerald-400 animate-in fade-in">
              {savedMessage}
            </span>
          )}
          <Button
            size="sm"
            onClick={handleApply}
            className="h-8 px-4 font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {playing ? "Perform Swap Chart ⚔" : "Apply Progression"}
          </Button>
        </div>
      </div>
    </div>
  )
}

