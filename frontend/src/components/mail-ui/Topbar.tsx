import { Bell, Menu } from "lucide-react"
import { SearchBar } from "./SearchBar"

export function Topbar({
  onCompose,
  onSync,
  onConnectGmail,
  showConnectGmail,
  unreadCount,
  syncDisabled,
  syncLoading,
  onToggleSidebar
}: {
  onCompose: () => void
  onSync: () => void
  onConnectGmail?: () => void
  showConnectGmail?: boolean
  unreadCount?: number
  syncDisabled?: boolean
  syncLoading?: boolean
  onToggleSidebar?: () => void
}) {
  return (
    <header className="col-span-full flex items-center justify-between gap-4 border-b border-gray-200/70 bg-white px-4 py-3 shadow-sm lg:col-start-2 lg:col-end-4">
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
        <SearchBar placeholder="Search mail, sender or subject" />
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
        {showConnectGmail ? (
          <button
            type="button"
            onClick={onConnectGmail}
            className="hidden rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 lg:inline-flex"
          >
            Connect Gmail
          </button>
        ) : null}
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
          onClick={onCompose}
          className="hidden rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:bg-blue-700 lg:inline-flex"
        >
          Compose
        </button>
      </div>
    </header>
  )
}

