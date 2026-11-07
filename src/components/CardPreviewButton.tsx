import { Button } from "@/components/ui/button"
import { useSessionStore } from "@/state/useSessionStore"
import type { PreviewLayers } from "@/audio/preview"
import type { Arrangement } from "@/game/arrangement"

/**
 * One-loop audition button shared by groove cards, melody cards and the loop
 * sequencer. `layers` scopes the audition to the card's own layers, so a rig
 * preview never drags the melodies (or the live loop) along. Clicking plays
 * the loop once; clicking again (or another card) stops it — only one preview
 * ever sounds.
 */
export function CardPreviewButton({
  id,
  arrangement,
  layers = "all",
  disabled,
  label,
}: {
  id: string
  arrangement: Arrangement
  layers?: PreviewLayers
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
        togglePreview(id, arrangement, layers)
      }}
      className="h-6 gap-1 px-2 text-[11px]">
      <span aria-hidden>{sounding ? "❚❚" : "▶"}</span>
      {label && <span>{label}</span>}
    </Button>
  )
}
