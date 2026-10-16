import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TutorialModalProps {
  isOpen: boolean
  onClose: () => void
}

interface TutorialStep {
  title: string
  badge: string
  icon: string
  summary: string
  bullets: { label: string; text: string }[]
  tip: string
}

const STEPS: TutorialStep[] = [
  {
    title: "Singing on the Beat",
    badge: "Combat Rhythm",
    icon: "🎵",
    summary: "Music is your weapon in the dark room. The loop station sweeps 16 beats at your set tempo.",
    bullets: [
      { label: "WASD Audition", text: "Press W, A, S, D in combat to record melody notes at the live playhead position." },
      { label: "Staccato vs Sustain", text: "Tap briefly for short 16th bursts (hits agile swarmers); hold down for heavy sustained strikes (crushes tanks)." },
      { label: "Potency Decay", text: "Recorded melodies loop automatically. Their potency fades x0.75 each loop wrap down to 0.25." },
    ],
    tip: "Keep an active attacker seated in the front row to deal continuous loop damage.",
  },
  {
    title: "Harmonic Chords & Blessings",
    badge: "Hymn Crafting",
    icon: "✦",
    summary: "The back-row chord keeper grounds your ensemble with harmonic progressions that bless the party.",
    bullets: [
      { label: "Hymn Wheel", text: "Choose from ancient 4-bar progressions like Sunfall, Ascension, or Lament." },
      { label: "Harmonic Forge", text: "Craft your own custom progression by arranging Roman numerals (I, IV, V, vi, etc.)." },
      { label: "Tier Blessings", text: "Gold Tier (score >= 75) grants HP Regen, Shield Ward, and Bonus Damage each loop wrap. Silver Tier grants Shield Ward." },
    ],
    tip: "Good voice-leading and cadential flow (Tonic -> Subdominant -> Dominant) produce Gold tier blessings.",
  },
  {
    title: "ATB Gauges & Parry QTE",
    badge: "Defense & Timing",
    icon: "⚔",
    summary: "Enemies attack rhythmically on musical periods. Time your defenses to turn the tide.",
    bullets: [
      { label: "Parry Alert", text: "At each loop's end a foe may gather: a ~5s ZXCV highway opens with taps and long holds. Block with Z/X/C/V — WASD keeps singing." },
      { label: "Hold Notes", text: "Press at the head, keep holding to the tail. Letting go early scores a bad; unreleased holds complete themselves." },
      { label: "Parry Damage Negation", text: "Scoring Perfect hits completely parries enemy damage down to chip scratches." },
    ],
    tip: "Song charts (chord swaps, bottled loops) still lock WASD — but parries never interrupt them; the strike waits a loop.",
  },
  {
    title: "Party Roles & Roster",
    badge: "Ensemble Formation",
    icon: "👥",
    summary: "Assign your 3 chosen heroes to tactical seats to maximize their elemental traits and strengths.",
    bullets: [
      { label: "Front · Attackers", text: "Fills the 3 battle lanes. Each attacker strikes enemies with their instrument timbre (Violin, Piano, Trumpet)." },
      { label: "Back · Chords", text: "Fighter voices the harmonic stabs and channels the loop blessing to the party." },
      { label: "Back · Beat", text: "Colors the rhythm drums and allows playing chord-fitting bass arpeggios." },
    ],
    tip: "Visit the Voices Roster in preparation to choose heroes tailored to enemy weaknesses.",
  },
]

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  if (!isOpen) return null

  const step = STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === STEPS.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Field Guide: How to Play"
    >
      <div className="w-full max-w-xl flex flex-col rounded-xl border border-border/80 bg-card shadow-2xl text-foreground overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 p-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl p-1.5 rounded-lg bg-background border border-border/40">
              {step.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">{step.title}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary uppercase">
                  {step.badge}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                Guide {currentStep + 1} of {STEPS.length}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            ✕
          </Button>
        </div>

        {/* Step dots navigation */}
        <div className="flex items-center justify-center gap-2 pt-3 pb-1">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentStep(i)}
              className={cn(
                "h-2 rounded-full transition-all cursor-pointer",
                currentStep === i ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
              )}
              aria-label={`Jump to Guide page ${i + 1}`}
            />
          ))}
        </div>

        {/* Body content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {step.summary}
          </p>

          <div className="space-y-2.5 bg-muted/20 border border-border/40 p-3.5 rounded-lg">
            {step.bullets.map((b, idx) => (
              <div key={idx} className="text-xs flex flex-col gap-0.5">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="text-primary text-[10px]">◆</span>
                  <span>{b.label}</span>
                </span>
                <span className="text-muted-foreground pl-3 text-[11px] leading-relaxed">
                  {b.text}
                </span>
              </div>
            ))}
          </div>

          {/* Tactical Note */}
          <div className="text-[11px] bg-primary/10 border border-primary/25 rounded-md px-3 py-2 flex items-center gap-2 text-primary-foreground/90">
            <span className="text-sm shrink-0">💡</span>
            <span><strong>Tactical Insight:</strong> {step.tip}</span>
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between border-t border-border/60 p-4 bg-muted/20">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={isFirst}
            className="text-xs"
          >
            ← Previous
          </Button>

          {isLast ? (
            <Button
              size="default"
              onClick={onClose}
              className="px-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
            >
              Enter the Chamber ⚔
            </Button>
          ) : (
            <Button
              size="default"
              onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="px-5 font-bold"
            >
              Next Concept →
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

