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
    <header className="col-span-full flex items-center justify-between gap-4 border-b border-gray-200/70 bg-white px-4 py-3 shadow-sm lg:col-start-2 lg:col-end-4">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {syncAnnouncement || "Mail sync ready"}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-500 hover:border-blue-300 hover:text-blue-600 lg:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        <div className="hidden text-sm font-semibold text-gray-700 lg:block">Inbox</div>
      </div>

      <div className="flex w-full max-w-xl flex-1 items-center">
        <SearchBar
          placeholder="Search mail, sender or subject"
          value={searchValue}
          onChange={(value) => onSearchChange?.(value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 shadow-sm lg:flex">
          Unread <span className="font-semibold text-gray-900">{unreadCount ?? 0}</span>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-500 hover:border-blue-300 hover:text-blue-600"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
        <button
          type="button"
          onClick={onSync}
          disabled={syncDisabled}
          className="hidden rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-60 lg:inline-flex"
          aria-busy={syncLoading}
        >
          {syncLoading ? "Syncing" : "Sync"}
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="inline-flex rounded-full border-0 p-2 text-gray-500 transition-transform duration-300 hover:rotate-90 hover:text-gray-900"
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
