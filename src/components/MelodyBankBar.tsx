import { useState } from "react"
import { useSessionStore } from "@/state/useSessionStore"
import { Button } from "@/components/ui/button"

export function MelodyBankBar() {
  const melodyBank = useSessionStore((s) => s.melodyBank)
  const loadMelodyTemplate = useSessionStore((s) => s.loadMelodyTemplate)
  const saveToMelodyBank = useSessionStore((s) => s.saveToMelodyBank)
  const deleteFromMelodyBank = useSessionStore((s) => s.deleteFromMelodyBank)

  const [saving, setSaving] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [activeLoadedId, setActiveLoadedId] = useState<string | null>("dawn-anthem")

  const templates = Object.values(melodyBank)

  const handleLoad = (id: string) => {
    const ok = loadMelodyTemplate(id)
    if (ok) {
      setActiveLoadedId(id)
    }
  }

  const handleSave = () => {
    const clean = templateName.trim()
    if (!clean) return
    const created = saveToMelodyBank(clean, "Player custom arrangement")
    setActiveLoadedId(created.id)
    setTemplateName("")
    setSaving(false)
  }

  return (
    <div className="border border-border/70 rounded-lg p-3 bg-muted/10 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Melody Bank</span>
          <span className="text-[10px] text-muted-foreground font-mono">({templates.length} saved)</span>
        </div>

        {!saving ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSaving(true)}
            className="h-6 text-xs px-2"
          >
            + Save Current Loop
          </Button>
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Template name..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
                if (e.key === "Escape") setSaving(false)
              }}
              autoFocus
              className="h-6 text-xs px-2 rounded bg-background border border-border w-36 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button size="sm" onClick={handleSave} className="h-6 text-xs px-2">
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSaving(false)}
              className="h-6 text-xs px-1.5 text-muted-foreground"
            >
              ✕
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {templates.map((tpl) => {
          const isSelected = activeLoadedId === tpl.id
          const isStarter = ["dawn-anthem", "staccato-flight", "solemn-ground"].includes(tpl.id)
          return (
            <div
              key={tpl.id}
              className={`group flex items-center gap-1.5 border rounded px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 hover:border-primary/50 bg-background/50"
              }`}
              onClick={() => handleLoad(tpl.id)}
            >
              <span className="font-medium">{tpl.name}</span>
              {tpl.tags?.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground font-mono"
                >
                  {tag}
                </span>
              ))}
              {!isStarter && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteFromMelodyBank(tpl.id)
                    if (activeLoadedId === tpl.id) setActiveLoadedId(null)
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive text-[11px] ml-1 transition-opacity"
                  title="Delete template"
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

