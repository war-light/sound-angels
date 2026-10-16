import { useEffect } from "react"
import { useSessionStore } from "@/state/useSessionStore"
import type { PerformKey } from "@/game/perform"

const KEYS = new Set(["w", "a", "s", "d"])

/**
 * WASD relative-motion performance. Key down moves the cursor + auditions;
 * key up records the held note into the loop at the playhead. Tab cycles the
 * active front performer. Ignores repeats and text inputs. Half-held presses
 * are dropped when the window loses focus (lost keyups never trap a key).
 */
export function useWasd(): void {
  useEffect(() => {
    const isTyping = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      return t != null && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
    }
    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTyping(e)) return
      const k = e.key.toLowerCase()
      if (k === "tab") {
        e.preventDefault()
        useSessionStore.getState().cyclePerformer()
        return
      }
      if (!KEYS.has(k)) return
      e.preventDefault()
      useSessionStore.getState().performDown(k as PerformKey)
    }
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (!KEYS.has(k)) return
      useSessionStore.getState().performUp(k as PerformKey)
    }
    const blurred = () => {
      useSessionStore.getState().releaseAllKeys()
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    window.addEventListener("blur", blurred)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
      window.removeEventListener("blur", blurred)
    }
  }, [])
}
