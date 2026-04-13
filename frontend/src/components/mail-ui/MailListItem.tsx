import { formatDistanceToNow } from "date-fns"
import { Star, AlertTriangle, Archive, Trash2, MailOpen } from "lucide-react"

export interface MailListItemData {
  id: string
  sender_name?: string
  sender_email: string
  subject?: string
  preview_snippet?: string
  received_at: string
  is_read: boolean
  is_starred?: boolean
  risk_level?: string
  priority_level?: string
  category?: string
  provider?: string
  account_email?: string
  processing_status?: string
}

export function MailListItem({
  email,
  selected,
  onSelect,
  onArchive,
  onDelete,
  onToggleRead,
  onToggleStar,
  onSelectToggle,
  multiSelected,
  showPreviewText = true
}: {
  email: MailListItemData
  selected: boolean
  onSelect: () => void
  onArchive: () => void
  onDelete: () => void
  onToggleRead: () => void
  onToggleStar?: () => void
  onSelectToggle?: () => void
  multiSelected?: boolean
  showPreviewText?: boolean
}) {
  const timeAgo = formatDistanceToNow(new Date(email.received_at), { addSuffix: true })
  const initials = (email.sender_name || email.sender_email || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={`group flex items-center gap-4 rounded-2xl border border-transparent px-4 py-3 transition ${
        selected
          ? "border-[var(--accent-primary)] bg-[var(--accent-bg)] shadow-soft"
          : "hover:border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
      } ${email.is_read ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]"} `}
      onClick={onSelect}
      role="listitem"
      aria-selected={selected}
    >
      <input
        type="checkbox"
        checked={multiSelected}
        onChange={(event) => {
          event.stopPropagation()
          onSelectToggle?.()
        }}
        className="h-4 w-4 rounded border-[var(--border-color)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
        aria-label="Select email"
      />
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--avatar-bg)] text-xs font-semibold text-[var(--avatar-text)]">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <p className={`truncate text-sm ${email.is_read ? "font-medium" : "font-semibold"}`}>
            {email.sender_name || email.sender_email}
          </p>
          <span className="text-xs text-[var(--text-muted)]">{timeAgo}</span>
        </div>
        <p className={`truncate text-sm ${email.is_read ? "font-medium" : "font-semibold"}`}>
          {email.subject || "(No subject)"}
        </p>
        {showPreviewText ? <p className="truncate text-xs text-[var(--text-secondary)]">{email.preview_snippet}</p> : null}
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          {email.category ? (
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] px-2 py-0.5">
              {email.category}
            </span>
          ) : null}
          {email.provider ? <span className="rounded-full border border-[var(--border-color)] px-2 py-0.5">{email.provider}</span> : null}
          {email.processing_status && email.processing_status !== "done" ? (
            <span className="rounded-full border border-[var(--tag-promotional-text)] bg-[var(--tag-promotional-bg)] px-2 py-0.5 text-[var(--tag-promotional-text)]">
              Analyzing
            </span>
          ) : null}
          {email.account_email ? <span>{email.account_email}</span> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {email.risk_level ? (
          <span className="flex items-center gap-1 rounded-full border border-[var(--tag-highrisk-text)] bg-[var(--tag-highrisk-bg)] px-2 py-0.5 text-xs text-[var(--tag-highrisk-text)]">
            <AlertTriangle size={12} /> {email.risk_level}
          </span>
        ) : null}
        {email.is_starred ? (
          <span className="flex items-center gap-1 rounded-full border border-[var(--tag-promotional-text)] bg-[var(--tag-promotional-bg)] px-2 py-0.5 text-xs text-[var(--tag-promotional-text)]">
            <Star size={12} /> starred
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggleRead()
          }}
          className="rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label={email.is_read ? "Mark unread" : "Mark read"}
        >
          <MailOpen size={14} />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onArchive()
          }}
          className="rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label="Archive"
        >
          <Archive size={14} />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          className="rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] hover:text-[var(--tag-highrisk-text)]"
          aria-label="Delete"
        >
          <Trash2 size={14} />
        </button>
        {onToggleStar ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onToggleStar()
            }}
            className="rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] hover:text-[var(--tag-promotional-text)]"
            aria-label={email.is_starred ? "Unstar" : "Star"}
          >
            <Star size={14} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
