import type { ReactNode } from "react"

/**
 * Props for reusable empty states.
 */
export interface EmptyStateProps {
  title: string
  description: string
  icon: ReactNode
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-surface-raised px-6 text-center dark:border-white/10 dark:bg-[#1c1c1c]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">{icon}</div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-text-primary dark:text-white">{title}</h2>
        <p className="max-w-sm text-base text-text-secondary dark:text-text-muted">{description}</p>
      </div>
    </div>
  )
}
