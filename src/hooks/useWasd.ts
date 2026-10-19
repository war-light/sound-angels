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
 * positions (except on the prep screen, where the loop sequencer owns the
 * number row for note entry). Ignores repeats and text inputs. Half-held
 * presses are dropped when the window loses focus (lost keyups never trap).
 */
export function useWasd(): void {
  useEffect(() => {
    const isTyping = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      return t != null && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
    }
    // A modal (e.g. the mid-fight Modulate dialog) owns the keyboard.
    const inDialog = () =>
      typeof document !== "undefined" && document.querySelector('[data-slot="dialog-content"]') != null
    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTyping(e) || inDialog()) return
      const k = e.key.toLowerCase()
      if (k === "tab") {
        e.preventDefault()
        useSessionStore.getState().cyclePerformer()
        return
      }
      // C.1: number keys 1/2/3 → direct front-row performer selection.
      // The prep-screen sequencer reserves the number row, so skip it there.
      if (NUM_KEYS.has(k) && useSessionStore.getState().gamePhase !== "prep") {
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
