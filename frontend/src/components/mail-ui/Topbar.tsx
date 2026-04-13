import { useState } from "react"
import { Bell, Menu, Settings2 } from "lucide-react"
import { SearchBar } from "./SearchBar"
import { SettingsPanel } from "../settings"

export function Topbar({
  onSync,
  onConnectGmail,
  onDisconnectAccount,
  onLogout,
  linkedAccounts = [],
  activeAccount = null,
  unreadCount,
  syncDisabled,
  syncLoading,
  syncAnnouncement,
  onToggleSidebar,
  searchValue = "",
  onSearchChange,
  sortOrder = "recent",
  onSortOrderChange = () => {},
  showPreviewText = true,
  onShowPreviewTextChange = () => {},
  lastSyncedAt
}: {
  onSync: () => void
  onConnectGmail?: () => void
  onDisconnectAccount?: (accountId: string) => void
  onLogout?: () => void
  linkedAccounts?: Array<{ id: string; name: string; email: string }>
  activeAccount?: { id: string; name: string; email: string } | null
  unreadCount?: number
  syncDisabled?: boolean
  syncLoading?: boolean
  syncAnnouncement?: string
  onToggleSidebar?: () => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  sortOrder?: "recent" | "oldest"
  onSortOrderChange?: (value: "recent" | "oldest") => void
  showPreviewText?: boolean
  onShowPreviewTextChange?: (value: boolean) => void
  lastSyncedAt?: number | null
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <header className="col-span-full flex items-center justify-between gap-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3 shadow-sm lg:col-start-2 lg:col-end-4">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {syncAnnouncement || "Mail sync ready"}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] lg:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        <div className="hidden text-sm font-semibold text-[var(--text-primary)] lg:block">Inbox</div>
      </div>

      <div className="flex w-full max-w-xl flex-1 items-center">
        <SearchBar
          placeholder="Search mail, sender or subject"
          value={searchValue}
          onChange={(value) => onSearchChange?.(value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-hover)] px-3 py-1 text-xs text-[var(--text-secondary)] shadow-sm lg:flex">
          Unread <span className="font-semibold text-[var(--text-primary)]">{unreadCount ?? 0}</span>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
        <button
          type="button"
          onClick={onSync}
          disabled={syncDisabled}
          className="hidden rounded-full border border-[var(--border-color)] bg-[var(--bg-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--bg-selected)] disabled:opacity-60 lg:inline-flex"
          aria-busy={syncLoading}
        >
          {syncLoading ? "Syncing" : "Sync"}
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="inline-flex rounded-full border-0 p-2 text-[var(--text-muted)] transition-transform duration-300 hover:rotate-90 hover:text-[var(--text-primary)]"
          aria-label="Settings"
        >
          <Settings2 size={18} />
        </button>
      </div>
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentAccount={activeAccount}
        linkedAccounts={linkedAccounts}
        onDisconnectAccount={onDisconnectAccount}
        onConnectGmail={onConnectGmail}
        onSyncNow={onSync}
        onLogout={onLogout}
        sortOrder={sortOrder}
        onSortOrderChange={onSortOrderChange}
        showPreviewText={showPreviewText}
        onShowPreviewTextChange={onShowPreviewTextChange}
        lastSyncedAt={lastSyncedAt}
      />
    </header>
  )
}
