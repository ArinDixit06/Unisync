import { cn } from "@/lib/utils"

/**
 * Props for compact count badges.
 */
export interface BadgeProps {
  value: number
  urgent?: boolean
}

export function Badge({ value, urgent = false }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-6 items-center justify-center rounded-full px-2 py-1 text-xs font-semibold",
        urgent ? "bg-red-500 text-white" : "bg-white/10 text-sidebar-text"
      )}
    >
      {value}
    </span>
  )
}
