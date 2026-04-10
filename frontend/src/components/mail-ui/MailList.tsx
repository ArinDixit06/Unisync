import { useEffect, useMemo, useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Filter } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { MailItem } from "./MailItem"
import { MailListItemData } from "./MailListItem"

export function MailList({
  emails,
  selectedEmailId,
  activeFilter,
  onFilterChange,
  onSelect,
  onArchive,
  onDelete,
  onToggleRead,
  hasMore = false,
  loadingMore = false,
  onLoadMore
}: {
  emails: MailListItemData[]
  selectedEmailId: string | null
  activeFilter: "all" | "unread" | "starred" | "high_risk" | "snoozed" | "sent" | "drafts" | "trash"
  onFilterChange: (
    filter: "all" | "unread" | "starred" | "high_risk" | "snoozed" | "sent" | "drafts" | "trash"
  ) => void
  onSelect: (email: MailListItemData) => void
  onArchive: (emailId: string) => void
  onDelete: (emailId: string) => void
  onToggleRead: (email: MailListItemData) => void
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}) {
  const listRef = useRef<HTMLDivElement | null>(null)
  const [multiSelect, setMultiSelect] = useState<Record<string, boolean>>({})

  const rowVirtualizer = useVirtualizer({
    count: emails.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 76,
    overscan: 8
  })

  const selectedIndex = useMemo(
    () => (selectedEmailId ? emails.findIndex((email) => email.id === selectedEmailId) : -1),
    [emails, selectedEmailId]
  )

  useEffect(() => {
    if (!hasMore || loadingMore || !onLoadMore || !listRef.current) return
    const { clientHeight, scrollHeight } = listRef.current
    if (scrollHeight <= clientHeight + 24) {
      onLoadMore()
    }
  }, [emails.length, hasMore, loadingMore, onLoadMore])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
    if (event.key === "j" || event.key === "ArrowDown") {
      event.preventDefault()
      const nextIndex = Math.min(emails.length - 1, Math.max(0, selectedIndex + 1))
      if (emails[nextIndex]) {
        onSelect(emails[nextIndex])
        rowVirtualizer.scrollToIndex(nextIndex, { align: "center" })
      }
    }
    if (event.key === "k" || event.key === "ArrowUp") {
      event.preventDefault()
      const nextIndex = Math.max(0, selectedIndex - 1)
      if (emails[nextIndex]) {
        onSelect(emails[nextIndex])
        rowVirtualizer.scrollToIndex(nextIndex, { align: "center" })
      }
    }
    if (event.key === "Enter" && selectedIndex >= 0) {
      event.preventDefault()
      onSelect(emails[selectedIndex])
    }
  }

  const filterOptions: Array<{ id: typeof activeFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "starred", label: "Starred" },
    { id: "snoozed", label: "Snoozed" },
    { id: "sent", label: "Sent" },
    { id: "drafts", label: "Drafts" },
    { id: "trash", label: "Trash" },
    { id: "high_risk", label: "High risk" }
  ]

  return (
    <section className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200/70 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Mail</p>
          <p className="text-xs text-gray-500">Sorted by most recent</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500"
        >
          <Filter size={12} /> Filters
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200/70 bg-white px-4 py-2">
        {filterOptions.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFilterChange(filter.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              activeFilter === filter.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            aria-pressed={activeFilter === filter.id}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div
        ref={listRef}
        className="relative flex-1 overflow-y-auto pb-8"
        role="list"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onScroll={(event) => {
          if (!hasMore || loadingMore || !onLoadMore) return
          const element = event.currentTarget
          if (element.scrollHeight - element.scrollTop - element.clientHeight < 240) {
            onLoadMore()
          }
        }}
      >
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const email = emails[virtualRow.index]
            return (
              <div
                key={email.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                <MailItem
                  sender={email.sender_name || email.sender_email}
                  subject={email.subject || "(No subject)"}
                  preview={email.preview_snippet || ""}
                  time={formatDistanceToNow(new Date(email.received_at), { addSuffix: true })}
                  priority={email.priority_level || email.risk_level}
                  sourceLabel={email.account_email || null}
                  accountEmail={email.account_email || null}
                  unread={!email.is_read}
                  checked={Boolean(multiSelect[email.id])}
                  selected={selectedEmailId === email.id}
                  onToggleSelect={() =>
                    setMultiSelect((prev) => ({ ...prev, [email.id]: !prev[email.id] }))
                  }
                  onClick={() => onSelect(email)}
                  onArchive={() => onArchive(email.id)}
                  onDelete={() => onDelete(email.id)}
                  onToggleRead={() => onToggleRead(email)}
                />
              </div>
            )
          })}
        </div>
        {loadingMore ? (
          <div className="px-4 py-3 text-center text-xs text-gray-400">Loading more mail...</div>
        ) : null}
      </div>
    </section>
  )
}
