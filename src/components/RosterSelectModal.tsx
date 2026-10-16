import { useState } from "react"
import { useSessionStore } from "@/state/useSessionStore"
import { ROSTER, type CharacterDef } from "@/data/roster"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RosterSelectModalProps {
  isOpen: boolean
  onClose: () => void
}

const ELEMENT_BADGE: Record<string, { label: string; class: string }> = {
  keen: { label: "Keen", class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  bright: { label: "Bright", class: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  heavy: { label: "Heavy", class: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" },
}

export function RosterSelectModal({ isOpen, onClose }: RosterSelectModalProps) {
  const selectedPartyIds = useSessionStore((s) => s.selectedPartyIds)
  const setSelectedParty = useSessionStore((s) => s.setSelectedParty)

  const [activeSlot, setActiveSlot] = useState<number>(0)
  const [stagedParty, setStagedParty] = useState<string[]>([...selectedPartyIds])
  const [filterInstrument, setFilterInstrument] = useState<string>("all")

  if (!isOpen) return null

  const handleSelectCharacter = (char: CharacterDef) => {
    const next = [...stagedParty]
    // If character is already elsewhere in party, swap them
    const existingIndex = next.indexOf(char.id)
    if (existingIndex >= 0 && existingIndex !== activeSlot) {
      next[existingIndex] = next[activeSlot]
    }
    next[activeSlot] = char.id
    setStagedParty(next)
    // Advance slot to make full team assembly swift
    setActiveSlot((activeSlot + 1) % 3)
  }

  const handleConfirm = () => {
    setSelectedParty(stagedParty)
    onClose()
  }

  const filteredRoster = filterInstrument === "all"
    ? ROSTER
    : ROSTER.filter((c) => c.instrument === filterInstrument)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Character Roster Selection"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-border/80 bg-card shadow-2xl text-foreground overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 p-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <span>Assemble Your Voices</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/20 text-primary">
                3 Members
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Select 3 singers for your active battle ensemble. Each voice carries unique instruments, elements, and passives.
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
            ✕
          </Button>
        </div>

        {/* Active 3 Party Formation Tray */}
        <div className="bg-muted/30 border-b border-border/40 p-4 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
            Active Combat Ensemble (Click slot to replace):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stagedParty.map((cid, idx) => {
              const char = ROSTER.find((c) => c.id === cid)
              const isSlotActive = activeSlot === idx

              return (
                <button
                  key={`slot-${idx}`}
                  type="button"
                  onClick={() => setActiveSlot(idx)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer relative",
                    isSlotActive
                      ? "border-primary bg-primary/15 shadow-[0_0_12px_rgba(var(--primary),0.2)] ring-1 ring-primary"
                      : "border-border/70 bg-card hover:border-border",
                  )}
                >
                  <span className="text-2xl p-1.5 rounded-lg bg-background/80 border border-border/40 shrink-0">
                    {char?.avatar ?? "🎵"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-muted-foreground block uppercase">
                      Voice {idx + 1}
                    </span>
                    <span className="text-sm font-bold truncate block">{char?.name ?? "Unknown"}</span>
                    <span className="text-[10px] text-muted-foreground truncate block font-mono">
                      {char?.instrument} · HP {char?.hp}
                    </span>
                  </div>
                  {isSlotActive && (
                    <span className="text-[10px] font-mono text-primary font-bold shrink-0">
                      EDITING
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Instrument Filter Bar */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1 border-b border-border/30">
          <span className="text-xs font-mono uppercase text-muted-foreground mr-1">Filter:</span>
          {["all", "strings", "piano", "brass"].map((inst) => (
            <Button
              key={inst}
              variant={filterInstrument === inst ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterInstrument(inst)}
              className="h-7 text-xs font-medium capitalize px-2.5"
            >
              {inst === "all" ? "All Instruments" : inst}
            </Button>
          ))}
        </div>

        {/* Character Card Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredRoster.map((char) => {
            const isAssigned = stagedParty.includes(char.id)
            const isAssignedToActiveSlot = stagedParty[activeSlot] === char.id
            const elem = ELEMENT_BADGE[char.element]

            return (
              <div
                key={char.id}
                onClick={() => handleSelectCharacter(char)}
                className={cn(
                  "flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none space-y-3",
                  isAssignedToActiveSlot
                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                    : isAssigned
                      ? "border-border/80 bg-muted/20 opacity-80"
                      : "border-border/60 bg-card hover:border-border hover:bg-card/90",
                )}
              >
                {/* Top card row */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1.5 rounded-lg bg-background border border-border/40 shrink-0">
                        {char.avatar}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm leading-snug">{char.name}</h4>
                        <span className="text-[11px] text-muted-foreground block">{char.title}</span>
                      </div>
                    </div>
                  </div>

                  {/* Element & Instrument Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize bg-muted/40 border border-border/40">
                      {char.instrument}
                    </span>
                    {elem && (
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono border", elem.class)}>
                        {elem.label}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize bg-muted/40 text-muted-foreground">
                      {char.role}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs font-mono pt-1 text-muted-foreground">
                    <span>HP: <strong className="text-foreground">{char.hp}</strong></span>
                    <span>Max Shield: <strong className="text-foreground">{char.maxShield}</strong></span>
                    {char.shield > 0 && (
                      <span>Start Shield: <strong className="text-foreground">{char.shield}</strong></span>
                    )}
                  </div>

                  {/* Trait & Lore */}
                  <div className="space-y-1 pt-1.5 border-t border-border/30 text-xs">
                    <p className="text-[11px] font-medium text-foreground/90 leading-tight">
                      ✦ {char.trait}
                    </p>
                    <p className="text-[10px] text-muted-foreground italic leading-tight">
                      "{char.lore}"
                    </p>
                  </div>
                </div>

                {/* Bottom Card Action */}
                <Button
                  size="sm"
                  variant={isAssignedToActiveSlot ? "default" : isAssigned ? "outline" : "secondary"}
                  className="w-full h-7 text-xs font-semibold mt-2"
                >
                  {isAssignedToActiveSlot
                    ? `Selected for Voice ${activeSlot + 1} ✓`
                    : isAssigned
                      ? "Swap to Current Slot"
                      : `Assign to Voice ${activeSlot + 1}`}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 p-4 bg-muted/20">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="default"
            onClick={handleConfirm}
            className="px-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
          >
            Confirm Formation ⚔
          </Button>
        </div>
      </div>
    </div>
  )
}

