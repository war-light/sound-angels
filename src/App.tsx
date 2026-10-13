import { CenterStage } from "@/components/CenterStage"
import { FoePanel } from "@/components/FoePanel"
import { PartyCorner } from "@/components/PartyCorner"
import { TransportBar } from "@/components/TransportBar"
import { useWasd } from "@/hooks/useWasd"
import { useGameStore } from "@/state/useGameStore"

export default function App() {
  const echoes = useGameStore((s) => s.resources.echo ?? 0)
  useWasd()

  return (
    <div className="dark bg-background text-foreground min-h-svh">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-xs tracking-widest uppercase">
              sound-angels
            </p>
            <h1 className="text-2xl font-semibold">A dark room. A faint hum.</h1>
            <p className="text-muted-foreground text-xs">Echoes: {echoes}</p>
          </div>
          <TransportBar />
        </header>

        <main className="grid flex-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)_260px]">
          <PartyCorner />
          <CenterStage />
          <div className="flex flex-col gap-4">
            <FoePanel />
          </div>
        </main>
      </div>
    </div>
  )
}
