import { Button } from "@/components/ui/button"
import { FIGHT_KEYS, keyEquals } from "@/game/keys"
import { useSessionStore } from "@/state/useSessionStore"

export function TransportBar() {
  const playing = useSessionStore((s) => s.playing)
  const starting = useSessionStore((s) => s.starting)
  const bpm = useSessionStore((s) => s.arrangement.bpm)
  const key = useSessionStore((s) => s.arrangement.key)
  const fightKey = useSessionStore((s) => s.fight.key)
  const nextKey = useSessionStore((s) => s.nextKey)
  const togglePlay = useSessionStore((s) => s.togglePlay)
  const setBpm = useSessionStore((s) => s.setBpm)
  const setKey = useSessionStore((s) => s.setKey)
  const setRandomKey = useSessionStore((s) => s.setRandomKey)
  const reset = useSessionStore((s) => s.reset)

  return (
    <section className="flex flex-wrap items-center gap-3">
      <Button onClick={() => togglePlay()} disabled={starting} >
        {starting ? "tuning…" : playing ? "halt" : "strike the hum"}
      </Button>
      <Button onClick={() => reset()} variant="outline" >
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
      <div
        className="flex items-center gap-1"
        title={
          playing
            ? `key locked at ${fightKey.tonic} ${fightKey.scale} for this fight`
            : nextKey == null
              ? "random key for the next fight (all possibilities below)"
              : `key for the next fight: ${nextKey.tonic} ${nextKey.scale}`
        }
      >
        {FIGHT_KEYS.map((k) => {
          // While fighting, the locked combat key is the truth.
          // While stopped, highlight the picked next key (or the preview).
          const shown = playing ? fightKey : (nextKey ?? key)
          const active = keyEquals(shown, k)
          return (
            <Button
              key={`${k.tonic}-${k.scale}`}
              variant={active ? "default" : "ghost"}
              
              disabled={playing}
              onClick={() => setKey({ tonic: k.tonic, scale: k.scale, octave: 4 })}
            >
              {k.tonic} {k.scale}
            </Button>
          )
        })}
        <Button
          variant={playing ? "ghost" : nextKey == null ? "default" : "ghost"}
          
          disabled={playing}
          title="roll a random key for the next fight"
          onClick={setRandomKey}
        >
          ⚄ random
        </Button>
      </div>
    </section>
  )
}
