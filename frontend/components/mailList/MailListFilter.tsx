"use client"

import type { ListFilter } from "@/stores/useMailStore"
import { copy } from "@/lib/copy"
import { cn } from "@/lib/utils"

const filters: { id: ListFilter; label: string }[] = [
  { id: "all", label: copy.filters.all },
  { id: "unread", label: copy.filters.unread },
  { id: "starred", label: copy.filters.starred },
  { id: "snoozed", label: copy.filters.snoozed }
]

/**
 * Props for the list filter tab row.
 */
export interface MailListFilterProps {
  activeFilter: ListFilter
  onFilterChange: (filter: ListFilter) => void
}

export function MailListFilter({ activeFilter, onFilterChange }: MailListFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          aria-pressed={activeFilter === filter.id}
          className={cn(
            "focus-ring rounded-full px-3 py-2 text-sm font-medium transition-colors",
            activeFilter === filter.id
              ? "bg-brand text-sidebar-bg"
              : "bg-surface-raised text-text-secondary hover:bg-surface-hover hover:text-text-primary dark:bg-[#1c1c1c] dark:text-text-muted dark:hover:bg-white/10 dark:hover:text-white"
          )}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
