import { Button } from "@/components/ui/button"
import { useSessionStore } from "@/state/useSessionStore"

const KEYS = [
  { tonic: "C", scale: "minor" },
  { tonic: "D", scale: "minor" },
  { tonic: "E", scale: "minor" },
  { tonic: "A", scale: "dorian" },
] as const

export function TransportBar() {
  const playing = useSessionStore((s) => s.playing)
  const starting = useSessionStore((s) => s.starting)
  const bpm = useSessionStore((s) => s.arrangement.bpm)
  const key = useSessionStore((s) => s.arrangement.key)
  const fightKey = useSessionStore((s) => s.fight.key)
  const togglePlay = useSessionStore((s) => s.togglePlay)
  const setBpm = useSessionStore((s) => s.setBpm)
  const setKey = useSessionStore((s) => s.setKey)
  const reset = useSessionStore((s) => s.reset)

  return (
    <section className="flex flex-wrap items-center gap-3">
      <Button onClick={togglePlay} disabled={starting} size="sm">
        {starting ? "tuning…" : playing ? "halt" : "strike the hum"}
      </Button>
      <Button onClick={reset} variant="outline" size="sm">
        reset
      </Button>
      <label className="text-muted-foreground flex items-center gap-2 text-xs tracking-widest uppercase">
        {bpm} bpm
        <input
          type="range"
          min={60}
          max={140}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-28 accent-current"
          aria-label="tempo"
        />
      </label>
      <div className="flex items-center gap-1" title={playing ? `key locked at ${fightKey.tonic} ${fightKey.scale} for this fight` : "key for the next fight"}>
        {KEYS.map((k) => {
          const active = key.tonic === k.tonic && key.scale === k.scale
          return (
            <Button
              key={`${k.tonic}-${k.scale}`}
              variant={active ? "default" : "ghost"}
              size="sm"
              disabled={playing}
              onClick={() => setKey({ tonic: k.tonic, scale: k.scale, octave: 4 })}
            >
              {k.tonic} {k.scale}
            </Button>
          )
        })}
      </div>
    </section>
  )
}
