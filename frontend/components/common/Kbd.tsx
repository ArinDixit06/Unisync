import { cn } from "@/lib/utils"

/**
 * Props for keyboard shortcut chips.
 */
export interface KbdProps {
  keys: string
  className?: string
}

export function Kbd({ keys, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex min-w-10 items-center justify-center rounded-md border border-border bg-surface-raised px-2 py-1 text-sm font-medium text-text-secondary dark:border-white/10 dark:bg-[#1c1c1c] dark:text-text-muted",
        className
      )}
    >
      {keys}
    </kbd>
  )
}
