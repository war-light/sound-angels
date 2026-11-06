import { Button } from "@/components/ui/button"
import { clipsForRole } from "@/data/stageClips"
import { clipStatus, type ClipStatus } from "@/game/stageCombat"
import { ROLES, type ClipEffect, type Role } from "@/game/stageMusic"
import { cn } from "@/lib/utils"
import { useSessionStore } from "@/state/useSessionStore"

const ROLE_STYLE: Record<Role, { label: string; text: string; lit: string; pending: string }> = {
  breaks: { label: "Breaks", text: "text-rose-300", lit: "border-rose-400 bg-rose-500/20", pending: "border-rose-400/70" },
  bass: { label: "Bass", text: "text-violet-300", lit: "border-violet-400 bg-violet-500/20", pending: "border-violet-400/70" },
  harmony: { label: "Harmony", text: "text-sky-300", lit: "border-sky-400 bg-sky-500/20", pending: "border-sky-400/70" },
  lead: { label: "Lead", text: "text-amber-300", lit: "border-amber-400 bg-amber-500/20", pending: "border-amber-400/70" },
  counter: { label: "Counter", text: "text-emerald-300", lit: "border-emerald-400 bg-emerald-500/20", pending: "border-emerald-400/70" },
}

const STATUS_TEXT: Record<ClipStatus, string> = {
  idle: "",
  active: "playing",
  joining: "joins next loop",
  leaving: "leaves next loop",
}

function describeEffect(fx: ClipEffect): string {
  const parts: string[] = []
  if (fx.damage) parts.push(`⚔ ${fx.damage}`)
  if (fx.shield) parts.push(`🛡 ${fx.shield}`)
  if (fx.heal) parts.push(`✚ ${fx.heal}`)
  if (fx.expose) parts.push(`◎ ${fx.expose}%`)
  return `${parts.join(" · ")} / bar`
}

/** One column per role, one pad per clip. Taps queue to the next loop. */
export function StageBoard() {
  const stage = useSessionStore((s) => s.stage)
  const toggleClip = useSessionStore((s) => s.toggleClip)

  return (
    <section aria-label="Sound board" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {ROLES.map((role) => {
        const style = ROLE_STYLE[role]
        return (
          <div key={role} className="flex flex-col gap-2">
            <h3 className={cn("text-[11px] font-semibold uppercase tracking-wider", style.text)}>{style.label}</h3>
            {clipsForRole(role).map((clip) => {
              const status = clipStatus(stage, clip.id)
              return (
                <Button
                  key={clip.id}
                  variant="outline"
                  title={clip.blurb}
                  aria-pressed={status === "active" || status === "leaving"}
                  onClick={() => toggleClip(clip.id)}
                  className={cn(
                    "h-auto flex-col items-start gap-0.5 whitespace-normal py-2 text-left",
                    status === "active" && style.lit,
                    status === "joining" && cn("animate-pulse border-dashed", style.pending),
                    status === "leaving" && cn("opacity-60 line-through", style.lit),
                  )}>
                  <span className="text-sm font-semibold leading-tight">{clip.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{describeEffect(clip.effect)}</span>
                  {status !== "idle" && (
                    <span className={cn("text-[10px] font-medium no-underline", style.text)}>{STATUS_TEXT[status]}</span>
                  )}
                </Button>
              )
            })}
          </div>
        )
      })}
    </section>
  )
}
