import { Archive, MailOpen, Star, Trash2 } from "lucide-react"

export function MailItem({
  sender,
  subject,
  preview,
  time,
  priority,
  category,
  sourceLabel,
  accountEmail,
  unread,
  checked,
  selected,
  starred,
  onToggleSelect,
  onClick,
  onArchive,
  onDelete,
  onToggleRead,
  onToggleStar,
  showPreviewText = true
}: {
  sender: string
  subject: string
  preview: string
  time: string
  priority?: "high" | "medium" | "low" | string | null
  category?: string | null
  sourceLabel?: string | null
  accountEmail?: string | null
  unread?: boolean
  checked?: boolean
  selected?: boolean
  starred?: boolean
  onToggleSelect?: () => void
  onClick?: () => void
  onArchive?: () => void
  onDelete?: () => void
  onToggleRead?: () => void
  onToggleStar?: () => void
  showPreviewText?: boolean
}) {
  const isStarred = Boolean(starred)
  const initials = sender
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const priorityStyles =
    priority === "high"
      ? "bg-[var(--tag-highrisk-bg)] text-[var(--tag-highrisk-text)] border-[var(--tag-highrisk-text)]"
      : priority === "medium"
      ? "bg-[var(--tag-promotional-bg)] text-[var(--tag-promotional-text)] border-[var(--tag-promotional-text)]"
      : priority === "low"
      ? "bg-[var(--tag-transactional-bg)] text-[var(--tag-transactional-text)] border-[var(--tag-transactional-text)]"
      : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-color)]"

  const categoryLabel =
    category === "primary"
      ? { label: "Transactional", className: "bg-[var(--tag-transactional-bg)] text-[var(--tag-transactional-text)]" }
      : category === "updates" || category === "forums" || category === "social"
      ? { label: "Newsletter", className: "bg-[var(--tag-newsletter-bg)] text-[var(--tag-newsletter-text)]" }
      : category === "promotions"
      ? { label: "Promotional", className: "bg-[var(--tag-promotional-bg)] text-[var(--tag-promotional-text)]" }
      : priority === "high"
      ? { label: "High Risk", className: "bg-[var(--tag-highrisk-bg)] text-[var(--tag-highrisk-text)]" }
      : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      className={`group grid w-full min-w-0 grid-cols-[auto_auto_minmax(140px,220px)_minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-[var(--border-color)] px-4 py-3 transition duration-150 hover:bg-[var(--bg-hover)] ${
        selected ? "bg-[var(--bg-selected)]" : "bg-[var(--bg-main)]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          event.stopPropagation()
          onToggleSelect?.()
        }}
        className="mt-1 h-4 w-4 rounded border-[var(--border-color)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
        aria-label="Select email"
      />
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--avatar-bg)] text-xs font-semibold text-[var(--avatar-text)]">
        {initials}
      </div>
      <div className="min-w-0">
        <span className="flex items-center gap-2 truncate text-sm font-semibold text-[var(--text-primary)]">
          {!unread ? null : <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--dot-unread)]" aria-hidden="true" />}
          <span className="truncate">{sender}</span>
        </span>
      </div>
      <div className="min-w-0 flex items-center gap-2">
        <span className="truncate text-sm font-medium text-[var(--text-primary)]">{subject}</span>
        {showPreviewText && preview ? <span className="min-w-0 truncate text-sm text-[var(--text-secondary)]">- {preview}</span> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 justify-self-end">
        {sourceLabel ? (
          <span className="hidden max-w-[180px] shrink-0 items-center gap-2 truncate rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)] xl:inline-flex">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--avatar-text)]" />
            <span className="truncate">{sourceLabel}</span>
          </span>
        ) : null}
        {categoryLabel ? (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${categoryLabel.className}`}
          >
            {categoryLabel.label}
          </span>
        ) : null}
        {priority ? (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityStyles}`}
          >
            {priority}
          </span>
        ) : null}
        <span className="shrink-0 text-xs text-[var(--text-muted)]">{time}</span>
      </div>
      <div className="mt-1 flex items-center gap-1 justify-self-end">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggleStar?.()
          }}
          className={`rounded-full border p-2 transition ${
            isStarred
              ? "border-[var(--tag-promotional-text)] text-[var(--tag-promotional-text)] hover:brightness-95"
              : "border-[var(--border-color)] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)]"
          }`}
          aria-label={isStarred ? "Unstar" : "Star"}
          aria-pressed={isStarred}
        >
          <Star size={14} className={isStarred ? "fill-current" : ""} />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggleRead?.()
          }}
          className="rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[var(--text-primary)]"
          aria-label={unread ? "Mark read" : "Mark unread"}
        >
          <MailOpen size={14} />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onArchive?.()
          }}
          className="rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[var(--text-primary)]"
          aria-label="Archive"
        >
          <Archive size={14} />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete?.()
          }}
          className="rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[var(--tag-highrisk-text)]"
          aria-label="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
