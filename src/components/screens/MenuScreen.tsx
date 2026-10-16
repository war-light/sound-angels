import { useState } from "react"
import { useSessionStore } from "@/state/useSessionStore"
import { initVoices } from "@/audio/synths"
import { auditionEnd, auditionStart } from "@/audio/perform"
import { degreeToMidi } from "@/game/theory"
import { Button } from "@/components/ui/button"
import { TutorialModal } from "@/components/TutorialModal"
import { isEncounterUnlocked } from "@/data/encounters"

export function MenuScreen() {
  const toPrep = useSessionStore((s) => s.toPrep)
  const arrangement = useSessionStore((s) => s.arrangement)
  const currentEncounterId = useSessionStore((s) => s.currentEncounterId)
  const selectEncounter = useSessionStore((s) => s.selectEncounter)
  const encounters = useSessionStore((s) => s.encounters)
  const clearedEncounterIds = useSessionStore((s) => s.clearedEncounterIds)

  const [audioAwake, setAudioAwake] = useState(false)
  const [activeNote, setActiveNote] = useState<string | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)

  const handleWakeAudio = async () => {
    try {
      await initVoices()
      setAudioAwake(true)
    } catch (err) {
      console.error("Audio initialization error:", err)
    }
  }

  const handleAudition = (degree: number, label: string) => {
    if (!audioAwake) return
    setActiveNote(label)
    const midi = degreeToMidi(arrangement.key, degree, 4)
    auditionStart(midi, "strings")
    setTimeout(() => {
      auditionEnd()
      setActiveNote(null)
    }, 280)
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-xl flex flex-col items-center gap-6 animate-in fade-in duration-700">
        <div className="space-y-2">
          <p className="text-xs tracking-widest uppercase text-muted-foreground">Antigravity Sound Chamber</p>
          <h1 className="text-4xl font-light tracking-tight sm:text-5xl">
            A dark room. <br />
            <span className="font-semibold text-primary">A faint hum.</span>
          </h1>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          In the quiet between worlds, music is your weapon and harmonies are your shield.
          Assemble your voices, sculpt the loop, and silence the discord.
        </p>

        {/* Audio Awaken / Sound Preview */}
        {!audioAwake ? (
          <div className="pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={handleWakeAudio}
              className="border-primary/40 hover:border-primary text-sm tracking-wide"
            >
              <span className="animate-pulse mr-2 text-primary">●</span> Listen to the Hum
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Enables Web Audio for interactive preview & combat</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 pt-1 border border-border/60 rounded-lg p-4 bg-muted/20 w-full">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Tone Room Active — Test Harmony</span>
            <div className="flex gap-2">
              {[
                { key: "W", degree: 1, name: "Tonic" },
                { key: "A", degree: 3, name: "Mediant" },
                { key: "S", degree: 5, name: "Dominant" },
                { key: "D", degree: 7, name: "Leading" },
              ].map((n) => (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => handleAudition(n.degree, n.name)}
                  className={`w-14 h-14 rounded-md border text-sm font-mono flex flex-col items-center justify-center transition-all ${
                    activeNote === n.name
                      ? "border-primary bg-primary/20 text-primary scale-95"
                      : "border-border hover:border-primary/60 bg-background"
                  }`}
                >
                  <span className="font-bold">{n.key}</span>
                  <span className="text-[10px] text-muted-foreground">{n.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Encounter Selection Preview */}
        <div className="w-full max-w-md text-left border border-border rounded-lg p-3 bg-muted/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>TARGET TRIAL</span>
            <span>{encounters.length} Encounters</span>
          </div>
          <select
            value={currentEncounterId}
            onChange={(e) => selectEncounter(e.target.value)}
            className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {encounters.map((enc, idx) => {
              const unlocked = isEncounterUnlocked(clearedEncounterIds, enc.id)
              return (
                <option key={enc.id} value={enc.id} disabled={!unlocked}>
                  {idx + 1}. {enc.name} {!unlocked ? "(Locked 🔒)" : `(${enc.enemyIds.join(" + ")})`}
                </option>
              )
            })}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2.5 w-full max-w-xs">
          <Button
            size="lg"
            onClick={() => {
              if (!audioAwake) void handleWakeAudio()
              toPrep()
            }}
            className="w-full font-semibold tracking-wide text-base shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Step into the Chamber
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setGuideOpen(true)}
            className="w-full text-xs text-muted-foreground hover:text-foreground font-medium"
          >
            Field Guide: How to Play 📖
          </Button>
        </div>
      </div>

      <TutorialModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  )
}
