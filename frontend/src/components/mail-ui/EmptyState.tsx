import { Mail } from "lucide-react"

export function EmptyState({
  title,
  description,
  shortcutHint
}: {
  title: string
  description?: string
  shortcutHint?: string
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-8 text-center shadow-soft">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-bg)] text-[var(--accent-primary)]">
        <Mail size={20} />
      </div>
      <div>
        <p className="text-lg font-semibold text-[var(--text-primary)]">{title}</p>
        {description ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p> : null}
      </div>
      {shortcutHint ? (
        <div className="rounded-full border border-[var(--border-color)] px-3 py-1 text-xs text-[var(--text-secondary)]">
          {shortcutHint}
        </div>
      ) : null}
    </div>
  )
}
