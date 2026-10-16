import { useEffect } from "react"
import { useSessionStore } from "@/state/useSessionStore"
import type { QteKey } from "@/game/perform"

const KEYS = new Set(["w", "a", "s", "d"])
const PARRY_KEYS = new Set(["z", "x", "c", "v"])
const NUM_KEYS = new Set(["1", "2", "3"])

/**
 * WASD relative-motion performance + ZXCV parry lanes. Key down moves the
 * cursor + auditions (WASD) or scores the parry chart (ZXCV); key up
 * records the held note into the loop (WASD) or scores a hold tail (ZXCV).
 * Tab cycles the active front performer. 1/2/3 directly select front-row
 * positions. Ignores repeats and text inputs. Half-held presses are dropped
 * when the window loses focus (lost keyups never trap a key).
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
      // C.1: number keys 1/2/3 → direct front-row performer selection.
      if (NUM_KEYS.has(k)) {
        e.preventDefault()
        useSessionStore.getState().selectPerformerByIndex(parseInt(k) - 1)
        return
      }
      if (!KEYS.has(k) && !PARRY_KEYS.has(k)) return
      e.preventDefault()
      useSessionStore.getState().performDown(k as QteKey)
    }
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (!KEYS.has(k) && !PARRY_KEYS.has(k)) return
      useSessionStore.getState().performUp(k as QteKey)
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
