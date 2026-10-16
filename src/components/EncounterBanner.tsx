import { useSessionStore } from "@/state/useSessionStore"
import { ENEMIES } from "@/data/enemies"
import { isEncounterUnlocked } from "@/data/encounters"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function EncounterBanner() {
  const currentEncounterId = useSessionStore((s) => s.currentEncounterId)
  const selectEncounter = useSessionStore((s) => s.selectEncounter)
  const encounters = useSessionStore((s) => s.encounters)
  const clearedEncounterIds = useSessionStore((s) => s.clearedEncounterIds)
  const unlockAll = useSessionStore((s) => s.unlockAllEncounters)

  const currentIndex = encounters.findIndex((e) => e.id === currentEncounterId)
  const encounter = encounters[currentIndex >= 0 ? currentIndex : 0]

  const handleSelect = (id: string) => {
    if (isEncounterUnlocked(clearedEncounterIds, id)) {
      selectEncounter(id)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevId = encounters[currentIndex - 1].id
      if (isEncounterUnlocked(clearedEncounterIds, prevId)) {
        selectEncounter(prevId)
      }
    }
  }

  const handleNext = () => {
    if (currentIndex < encounters.length - 1) {
      const nextId = encounters[currentIndex + 1].id
      if (isEncounterUnlocked(clearedEncounterIds, nextId)) {
        selectEncounter(nextId)
      }
    }
  }

  if (!encounter) return null

  const isCurrentCleared = clearedEncounterIds.includes(encounter.id)
  const isNextUnlocked =
    currentIndex < encounters.length - 1 &&
    isEncounterUnlocked(clearedEncounterIds, encounters[currentIndex + 1].id)

  return (
    <div className="border border-border/80 bg-card/60 backdrop-blur rounded-lg p-4 space-y-3.5 shadow-sm text-foreground">
      {/* Encounter Stepper / Stage Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {encounters.map((enc, idx) => {
            const isUnlocked = isEncounterUnlocked(clearedEncounterIds, enc.id)
            const isCleared = clearedEncounterIds.includes(enc.id)
            const isActive = enc.id === currentEncounterId

            return (
              <button
                key={enc.id}
                type="button"
                onClick={() => handleSelect(enc.id)}
                disabled={!isUnlocked}
                title={!isUnlocked ? "Defeat previous encounter to challenge" : enc.name}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : isCleared
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                      : isUnlocked
                        ? "bg-muted/40 text-foreground border border-border hover:bg-muted"
                        : "bg-muted/20 text-muted-foreground/60 border border-border/30 opacity-60 cursor-not-allowed",
                )}
              >
                <span>{idx + 1}.</span>
                <span className="truncate max-w-28 sm:max-w-36">{enc.name}</span>
                {isCleared ? (
                  <span className="text-[10px] text-emerald-400 font-bold">✓</span>
                ) : !isUnlocked ? (
                  <span className="text-[10px]">🔒</span>
                ) : null}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            className="h-7 px-2 text-xs"
          >
            ← Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={!isNextUnlocked}
            className="h-7 px-2 text-xs"
          >
            Next →
          </Button>
          {clearedEncounterIds.length < encounters.length && (
            <Button
              variant="ghost"
              size="sm"
              onClick={unlockAll}
              title="Unlock all encounters for practice"
              className="h-7 text-[10px] text-muted-foreground hover:text-foreground px-2"
            >
              🔓 All
            </Button>
          )}
        </div>
      </div>

      {/* Title & Status */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">{encounter.name}</h2>
            {isCurrentCleared && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                CLEARED ✓
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{encounter.description}</p>
        </div>

        {encounter.recommendedBpm && (
          <span className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded border border-border/40">
            Recommended: {encounter.recommendedBpm} BPM
          </span>
        )}
      </div>

      {/* Enemy composition badges */}
      <div className="flex flex-wrap gap-2 pt-1">
        {encounter.enemyIds.map((eid, idx) => {
          const profile = ENEMIES[eid]
          if (!profile) return null
          return (
            <div
              key={`${eid}-${idx}`}
              className="flex items-center gap-2 border border-border/60 bg-muted/20 rounded px-2.5 py-1 text-xs"
            >
              <span className="font-semibold">{profile.name}</span>
              <span className="text-muted-foreground font-mono">HP {profile.hp}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono bg-accent/40 text-accent-foreground">
                {profile.archetype}
              </span>
              {profile.weaknesses.instruments.length > 0 && (
                <span className="text-[10px] text-primary">
                  weak: {profile.weaknesses.instruments.join(", ")}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {encounter.tip && (
        <div className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded px-2.5 py-1.5 flex items-center gap-2">
          <span className="text-sm">💡</span>
          <span>{encounter.tip}</span>
        </div>
      )}
    </div>
  )
}
