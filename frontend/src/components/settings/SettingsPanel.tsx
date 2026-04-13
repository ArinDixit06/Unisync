import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { formatDistanceToNow } from "date-fns"
import { X } from "lucide-react"
import { Toggle } from "./Toggle"

type AccountLike = {
  id: string
  name: string
  email: string
}

function readStoredBoolean(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback
  const value = window.localStorage.getItem(key)
  if (value == null) return fallback
  return value === "true"
}

function readStoredSortOrder() {
  if (typeof window === "undefined") return "recent" as const
  return window.localStorage.getItem("email_sort_order") === "oldest" ? "oldest" : "recent"
}

export function SettingsPanel({
  open,
  onClose,
  currentAccount,
  linkedAccounts,
  onDisconnectAccount,
  onConnectGmail,
  onSyncNow,
  onLogout,
  sortOrder,
  onSortOrderChange,
  showPreviewText,
  onShowPreviewTextChange,
  lastSyncedAt
}: {
  open: boolean
  onClose: () => void
  currentAccount: AccountLike | null
  linkedAccounts: AccountLike[]
  onDisconnectAccount?: (accountId: string) => void
  onConnectGmail?: () => void
  onSyncNow?: () => void
  onLogout?: () => void
  sortOrder: "recent" | "oldest"
  onSortOrderChange: (value: "recent" | "oldest") => void
  showPreviewText: boolean
  onShowPreviewTextChange: (value: boolean) => void
  lastSyncedAt?: number | null
}) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(open)
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(false)
  const [newEmailAlertsEnabled, setNewEmailAlertsEnabled] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (open) {
      setMounted(true)
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      animationFrameRef.current = window.requestAnimationFrame(() => setVisible(true))
      return
    }

    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setVisible(false)
    closeTimerRef.current = window.setTimeout(() => setMounted(false), 300)
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }
  }, [open])

  useEffect(() => {
    if (!mounted) return
    const desktop = readStoredBoolean("desktop_notifications_enabled", false)
    const alerts = readStoredBoolean("new_email_alerts_enabled", false)
    const preview = readStoredBoolean("show_preview", true)
    const storedSortOrder = readStoredSortOrder()

    setDesktopNotificationsEnabled(desktop)
    setNewEmailAlertsEnabled(alerts)
    onShowPreviewTextChange(preview)
    onSortOrderChange(storedSortOrder)
  }, [mounted, onShowPreviewTextChange, onSortOrderChange])

  useEffect(() => {
    if (!mounted || !visible) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [mounted, visible, onClose])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
      if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  if (!mounted || typeof document === "undefined") return null

  const account = currentAccount?.id === "all" && linkedAccounts.length ? linkedAccounts[0] : currentAccount
  const lastSyncedLabel = lastSyncedAt ? formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true }) : null

  const handleDesktopNotificationsToggle = async (nextValue: boolean) => {
    if (nextValue && typeof Notification !== "undefined") {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setDesktopNotificationsEnabled(false)
        window.localStorage.setItem("desktop_notifications_enabled", "false")
        return
      }
    }
    setDesktopNotificationsEnabled(nextValue)
    window.localStorage.setItem("desktop_notifications_enabled", String(nextValue))
  }

  const handleNewEmailAlertsToggle = (nextValue: boolean) => {
    setNewEmailAlertsEnabled(nextValue)
    window.localStorage.setItem("new_email_alerts_enabled", String(nextValue))
  }

  const handlePreviewToggle = (nextValue: boolean) => {
    onShowPreviewTextChange(nextValue)
    window.localStorage.setItem("show_preview", String(nextValue))
  }

  const handleSortChange = (nextValue: "recent" | "oldest") => {
    onSortOrderChange(nextValue)
    window.localStorage.setItem("email_sort_order", nextValue)
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close settings"
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-[420px] transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-blue-300 hover:text-blue-700"
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <section className="space-y-3 border-b border-gray-200 pb-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Account</h3>
            {account ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{account.email}</p>
                  <p className="truncate text-xs text-gray-500">{account.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDisconnectAccount?.(account.id)}
                  className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-rose-300 hover:text-rose-600"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onConnectGmail}
                className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
              >
                Connect Gmail
              </button>
            )}
            <p className="text-xs text-gray-500">Press Alt+A to switch accounts</p>
          </section>

          <section className="space-y-4 border-b border-gray-200 py-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Notifications</h3>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Desktop notifications</p>
                <p className="text-xs text-gray-500">Ask before enabling desktop alerts.</p>
              </div>
              <Toggle checked={desktopNotificationsEnabled} onChange={handleDesktopNotificationsToggle} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">New email alerts</p>
                <p className="text-xs text-gray-500">Store alert preference locally.</p>
              </div>
              <Toggle checked={newEmailAlertsEnabled} onChange={handleNewEmailAlertsToggle} />
            </div>
          </section>

          <section className="space-y-4 border-b border-gray-200 py-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Display</h3>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Show preview text in email list</p>
                <p className="text-xs text-gray-500">Hide snippets to keep the inbox denser.</p>
              </div>
              <Toggle checked={showPreviewText} onChange={handlePreviewToggle} />
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-900">Sort emails by</span>
              <select
                value={sortOrder}
                onChange={(event) => handleSortChange(event.target.value === "oldest" ? "oldest" : "recent")}
                className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-200"
              >
                <option value="recent">Most recent</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </section>

          <section className="space-y-4 border-b border-gray-200 py-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Sync</h3>
            <button
              type="button"
              onClick={onSyncNow}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
            >
              Sync now
            </button>
            {lastSyncedLabel ? <p className="text-xs text-gray-500">Last synced: {lastSyncedLabel}</p> : null}
          </section>

          <section className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-red-600">Danger Zone</h3>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-red-700">Sign out from this device.</p>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
              >
                Sign out
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div>,
    document.body
  )
}
