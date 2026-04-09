"use client"

import { Search } from "lucide-react"
import { copy } from "@/lib/copy"

/**
 * Props for the inline mail search input.
 */
export interface MailListSearchProps {
  value: string
  onChange: (value: string) => void
}

export function MailListSearch({ value, onChange }: MailListSearchProps) {
  return (
    <label className="relative block">
      <span className="sr-only">{copy.list.searchPlaceholder}</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <input
        aria-label={copy.list.searchPlaceholder}
        className="focus-ring h-11 w-full rounded-xl border border-border bg-surface px-11 text-base text-text-primary placeholder:text-text-muted dark:border-white/10 dark:bg-[#1c1c1c] dark:text-white"
        placeholder={copy.list.searchPlaceholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
