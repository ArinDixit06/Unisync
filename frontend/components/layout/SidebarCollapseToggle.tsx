"use client"

import { ChevronLeft } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * Props for the sidebar collapse control.
 */
export interface SidebarCollapseToggleProps {
  collapsed: boolean
  ariaLabel: string
  onToggle: () => void
}

export function SidebarCollapseToggle({ collapsed, ariaLabel, onToggle }: SidebarCollapseToggleProps) {
  return (
    <Tooltip content={ariaLabel}>
      <button
        aria-label={ariaLabel}
        className="focus-ring absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full text-sidebar-text transition-colors hover:bg-white/5 hover:text-white"
        onClick={onToggle}
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
      </button>
    </Tooltip>
  )
}
