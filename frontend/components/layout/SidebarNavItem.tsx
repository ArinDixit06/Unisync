"use client"

import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/common/Badge"
import { Tooltip } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * Props for an individual sidebar navigation row.
 */
export interface SidebarNavItemProps {
  icon: LucideIcon
  label: string
  active?: boolean
  collapsed?: boolean
  badgeCount?: number
  urgentBadge?: boolean
  onClick: () => void
}

export function SidebarNavItem({
  icon: Icon,
  label,
  active = false,
  collapsed = false,
  badgeCount,
  urgentBadge = false,
  onClick
}: SidebarNavItemProps) {
  const content = (
    <button
      aria-current={active ? "page" : undefined}
      aria-label={label}
      className={cn(
        "focus-ring flex h-11 w-full items-center rounded-lg px-3 text-left transition-colors",
        active
          ? "bg-sidebar-active-bg text-sidebar-text-active"
          : "text-sidebar-text hover:bg-white/5 hover:text-white"
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed ? (
        <>
          <span className="ml-3 flex-1 truncate text-sm font-medium">{label}</span>
          {typeof badgeCount === "number" ? <Badge value={badgeCount} urgent={urgentBadge} /> : null}
        </>
      ) : null}
    </button>
  )

  return collapsed ? <Tooltip content={label}>{content}</Tooltip> : content
}
