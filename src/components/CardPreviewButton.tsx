import { Button } from "@/components/ui/button"
import { useSessionStore } from "@/state/useSessionStore"
import type { Arrangement } from "@/game/arrangement"

/**
 * One-loop audition button shared by groove cards, melody cards and the loop
 * sequencer. Clicking plays the loop once; clicking again (or another card)
 * stops it — only one preview ever sounds.
 */
export function CardPreviewButton({
  id,
  arrangement,
  disabled,
  label,
}: {
  id: string
  arrangement: Arrangement
  disabled?: boolean
  label?: string
}) {
  const previewId = useSessionStore((s) => s.previewId)
  const togglePreview = useSessionStore((s) => s.togglePreview)
  const sounding = previewId === id

  return (
    <Button
      type="button"
      variant={sounding ? "default" : "outline"}
      size="sm"
      disabled={disabled}
      aria-label={sounding ? "Stop preview" : "Preview loop"}
      title={sounding ? "Stop preview" : "Listen once through"}
      onClick={(e) => {
        e.stopPropagation()
        togglePreview(id, arrangement)
      }}
      className="h-6 gap-1 px-2 text-[11px]">
      <span aria-hidden>{sounding ? "❚❚" : "▶"}</span>
      {label && <span>{label}</span>}
    </Button>
  )
}
