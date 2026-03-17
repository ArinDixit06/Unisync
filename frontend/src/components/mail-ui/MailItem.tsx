import { Archive, MailOpen, Trash2 } from "lucide-react"

export function MailItem({
  sender,
  subject,
  preview,
  time,
  priority,
  unread,
  checked,
  selected,
  onToggleSelect,
  onClick,
  onArchive,
  onDelete,
  onToggleRead
}: {
  sender: string
  subject: string
  preview: string
  time: string
  priority?: "high" | "medium" | "low" | string | null
  unread?: boolean
  checked?: boolean
  selected?: boolean
  onToggleSelect?: () => void
  onClick?: () => void
  onArchive?: () => void
  onDelete?: () => void
  onToggleRead?: () => void
}) {
  const initials = sender
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const priorityStyles =
    priority === "high"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : priority === "medium"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : priority === "low"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : "bg-gray-50 text-gray-600 border-gray-200"

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      className={`group flex w-full items-start gap-3 rounded-xl px-4 py-3 transition duration-150 hover:bg-gray-50 ${
        selected ? "bg-blue-50" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          event.stopPropagation()
          onToggleSelect?.()
        }}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        aria-label="Select email"
      />
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-semibold text-gray-900">{sender}</span>
          <span className="shrink-0 text-xs text-gray-400">{time}</span>
        </div>
        <div className="truncate text-sm font-medium text-gray-700">{subject}</div>
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 truncate text-xs text-gray-500">{preview}</span>
          {priority ? (
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityStyles}`}
            >
              {priority}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-1 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggleRead?.()
          }}
          className="rounded-full border border-gray-200 p-2 text-gray-500 hover:border-blue-300 hover:text-blue-600"
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
          className="rounded-full border border-gray-200 p-2 text-gray-500 hover:border-blue-300 hover:text-blue-600"
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
          className="rounded-full border border-gray-200 p-2 text-gray-500 hover:border-rose-300 hover:text-rose-600"
          aria-label="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
