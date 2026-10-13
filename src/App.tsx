import { Button } from "@/components/ui/button"
import { useGameStore } from "@/state/useGameStore"

export default function App() {
  const echoes = useGameStore((s) => s.resources.echo ?? 0)
  const addResource = useGameStore((s) => s.addResource)

  return (
    <main className="bg-background text-foreground flex min-h-svh flex-col items-center justify-center gap-6 p-8">
      <p className="text-muted-foreground text-sm tracking-widest uppercase">sound-angels</p>
      <h1 className="text-4xl font-semibold">A dark room. A faint hum.</h1>
      <p className="text-muted-foreground">Echoes: {echoes}</p>
      <div className="flex gap-3">
        <Button onClick={() => addResource("echo", 1)}>Strike a note</Button>
        <Button variant="outline">Tune</Button>
      </div>
    </main>
  )
}
