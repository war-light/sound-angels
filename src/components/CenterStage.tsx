import { CombatLog } from "@/components/CombatLog"
import { PhaseStrip } from "@/components/PhaseStrip"
import { QtePanel } from "@/components/QtePanel"
import { StepGrid } from "@/components/StepGrid"
import { VoiceBar } from "@/components/VoiceBar"
import { cursorDegree } from "@/game/perform"
import { useSessionStore } from "@/state/useSessionStore"

/** Center column: loop, chord phase, performance readout, QTE, resolve, log. */
export function CenterStage() {
  const cursor = useSessionStore((s) => s.cursor)
  const performerId = useSessionStore((s) => s.performerId)
  const fight = useSessionStore((s) => s.fight)
  const playing = useSessionStore((s) => s.playing)

  const front = fight.slots.front.length > 0 ? fight.slots.front : fight.party.map((f) => f.id)
  const performer = fight.party.find((f) => f.id === performerId) ?? fight.party.find((f) => f.id === front[0])

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PhaseStrip />
      <StepGrid />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span aria-live="polite">
          {playing
            ? `performing ${performer?.name ?? "—"} (${performer?.instrument ?? "—"}) · degree ${cursorDegree(cursor)}`
            : "press play, then perform with WASD"}
        </span>
        <span className="font-mono text-[10px]">W/S step · A/D octave · hold = long · Tab = switch voice</span>
      </div>
      <VoiceBar />
      <QtePanel />
      <div className="border-border max-h-48 overflow-y-auto rounded-md border p-3">
        <CombatLog />
      </div>
    </div>
  )
}
