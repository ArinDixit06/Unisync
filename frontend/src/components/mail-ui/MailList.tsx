import { useEffect, useMemo, useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Filter } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { EmptyState } from "./EmptyState"
import { MailItem } from "./MailItem"
import { MailListItemData } from "./MailListItem"

export function MailList({
  emails,
  selectedEmailId,
  activeFilter,
  sortOrder = "recent",
  showPreviewText = true,
  onFilterChange,
  onSelect,
  onArchive,
  onDelete,
  onToggleRead,
  onToggleStar,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  emptyState
}: {
  emails: MailListItemData[]
  selectedEmailId: string | null
  activeFilter: "all" | "unread" | "starred" | "high_risk" | "snoozed" | "sent" | "drafts" | "trash"
  sortOrder?: "recent" | "oldest"
  showPreviewText?: boolean
  onFilterChange: (
    filter: "all" | "unread" | "starred" | "high_risk" | "snoozed" | "sent" | "drafts" | "trash"
  ) => void
  onSelect: (email: MailListItemData) => void
  onArchive: (emailId: string) => void
  onDelete: (emailId: string) => void
  onToggleRead: (email: MailListItemData) => void
  onToggleStar: (email: MailListItemData) => void
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  emptyState?: React.ReactNode
}) {
  const listRef = useRef<HTMLDivElement | null>(null)
  const [multiSelect, setMultiSelect] = useState<Record<string, boolean>>({})
  const sortedEmails = useMemo(() => {
    const next = [...emails]
    next.sort((left, right) => {
      const leftTime = new Date(left.received_at).getTime()
      const rightTime = new Date(right.received_at).getTime()
      return sortOrder === "oldest" ? leftTime - rightTime : rightTime - leftTime
    })
    return next
  }, [emails, sortOrder])

  const rowVirtualizer = useVirtualizer({
    count: sortedEmails.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 76,
    overscan: 8
  })

  const selectedIndex = useMemo(
    () => (selectedEmailId ? sortedEmails.findIndex((email) => email.id === selectedEmailId) : -1),
    [selectedEmailId, sortedEmails]
  )

  useEffect(() => {
    if (!hasMore || loadingMore || !onLoadMore || !listRef.current) return
    const { clientHeight, scrollHeight } = listRef.current
    if (scrollHeight <= clientHeight + 24) {
      onLoadMore()
    }
  }, [sortedEmails.length, hasMore, loadingMore, onLoadMore])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
    if (event.key === "j" || event.key === "ArrowDown") {
      event.preventDefault()
      const nextIndex = Math.min(sortedEmails.length - 1, Math.max(0, selectedIndex + 1))
      if (sortedEmails[nextIndex]) {
        onSelect(sortedEmails[nextIndex])
        rowVirtualizer.scrollToIndex(nextIndex, { align: "center" })
      }
    }
    if (event.key === "k" || event.key === "ArrowUp") {
      event.preventDefault()
      const nextIndex = Math.max(0, selectedIndex - 1)
      if (sortedEmails[nextIndex]) {
        onSelect(sortedEmails[nextIndex])
        rowVirtualizer.scrollToIndex(nextIndex, { align: "center" })
      }
    }
    if (event.key === "Enter" && selectedIndex >= 0) {
      event.preventDefault()
      onSelect(sortedEmails[selectedIndex])
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
    <section className="flex h-full w-full min-w-0 flex-col bg-[var(--bg-main)]">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Inbox</p>
          <p className="text-xs text-[var(--text-secondary)]">
            {sortOrder === "oldest" ? "Sorted by oldest first" : "Sorted by most recent"}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-hover)] px-3 py-1 text-xs text-[var(--text-secondary)]"
        >
          <Filter size={12} /> Filters
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-2">
        {filterOptions.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFilterChange(filter.id)}
            className={`rounded-full border-b-2 px-3 py-1 text-xs font-semibold transition ${
              activeFilter === filter.id
                ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            }`}
            aria-pressed={activeFilter === filter.id}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div
        ref={listRef}
        className="relative flex-1 w-full min-w-0 overflow-y-auto pb-8 bg-[var(--bg-main)]"
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
        {sortedEmails.length === 0 ? (
          <div className="h-full px-4 py-6">
            {emptyState ?? (
              <EmptyState
                title="No mail found"
                description="Try a different search or clear the current filters."
                shortcutHint="Use / to search"
              />
            )}
          </div>
        ) : (
          <>
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                minWidth: "100%",
                position: "relative"
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const email = sortedEmails[virtualRow.index]
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
                      category={email.category || null}
                      showPreviewText={showPreviewText}
                      time={formatDistanceToNow(new Date(email.received_at), { addSuffix: true })}
                      priority={email.priority_level || email.risk_level}
                      sourceLabel={email.account_email || null}
                      accountEmail={email.account_email || null}
                      unread={!email.is_read}
                      checked={Boolean(multiSelect[email.id])}
                      selected={selectedEmailId === email.id}
                      starred={Boolean(email.is_starred)}
                      onToggleSelect={() =>
                        setMultiSelect((prev) => ({ ...prev, [email.id]: !prev[email.id] }))
                      }
                      onClick={() => onSelect(email)}
                      onArchive={() => onArchive(email.id)}
                      onDelete={() => onDelete(email.id)}
                      onToggleRead={() => onToggleRead(email)}
                      onToggleStar={() => onToggleStar(email)}
                    />
                  </div>
                )
              })}
            </div>
            {loadingMore ? (
            <div className="px-4 py-3 text-center text-xs text-[var(--text-muted)]">Loading more mail...</div>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
