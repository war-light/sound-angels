import { useWasd } from "@/hooks/useWasd"
import { useSessionStore } from "@/state/useSessionStore"
import { MenuScreen } from "@/components/screens/MenuScreen"
import { PrepScreen } from "@/components/screens/PrepScreen"
import { StudioScreen } from "@/components/screens/StudioScreen"
import { CombatScreen } from "@/components/screens/CombatScreen"
import { ResultOverlay } from "@/components/screens/ResultOverlay"

export default function App() {
  useWasd()
  const gamePhase = useSessionStore((s) => s.gamePhase)

  return (
    <div className="dark bg-background text-foreground min-h-svh flex flex-col font-sans">
      {gamePhase === "menu" && <MenuScreen />}
      {gamePhase === "prep" && <PrepScreen />}
      {gamePhase === "studio" && <StudioScreen />}
      {(gamePhase === "combat" || gamePhase === "victory" || gamePhase === "defeat") && (
        <CombatScreen />
      )}
      {(gamePhase === "victory" || gamePhase === "defeat") && (
        <ResultOverlay phase={phaseForOverlay(gamePhase)} />
      )}
    </div>
  )
}

function phaseForOverlay(phase: string): "victory" | "defeat" {
  return phase === "victory" ? "victory" : "defeat"
}
