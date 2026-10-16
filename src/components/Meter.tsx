import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Shared bar meter (HP, shield base, gauges, voice). Value in 0..100. */
export function Meter({
  value,
  barClass,
  className,
  children,
}: {
  value: number
  barClass: string
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={cn("bg-muted relative overflow-hidden rounded-full", className)}>
      <div className={cn("h-full rounded-full", barClass)} style={{ width: `${value}%` }} />
      {children}
    </div>
  )
}
