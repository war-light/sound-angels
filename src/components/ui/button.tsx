import * as React from "react"

import { cn } from "@/lib/utils"

const VARIANTS: Record<string, string> = {
  default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  outline:
    "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
  secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
}

const SIZES: Record<string, string> = {
  default: "h-8 px-3 text-sm",
  sm: "h-7 px-2.5 text-xs",
  lg: "h-10 px-5 text-base",
  icon: "h-8 w-8 p-0",
}

const BASE =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-[3px]"

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"button"> & {
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
}) {
  return <button data-slot="button" className={cn(BASE, SIZES[size], VARIANTS[variant], className)} {...props} />
}

export { Button }
