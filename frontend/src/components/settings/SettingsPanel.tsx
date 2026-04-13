import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { formatDistanceToNow } from "date-fns"
import { X } from "lucide-react"
import { useTheme, type ThemePreference } from "../../contexts/ThemeContext"
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

function ThemeSegmentedControl({
  value,
  onChange
}: {
  value: ThemePreference
  onChange: (value: ThemePreference) => void
}) {
  const options: Array<{ value: ThemePreference; label: string }> = [
    { value: "light", label: "Light" },
    { value: "system", label: "System" },
    { value: "dark", label: "Dark" }
  ]
  const selectedIndex = options.findIndex((item) => item.value === value)

  return (
    <div className="relative grid grid-cols-3 rounded-[8px] border-[0.5px] border-[var(--border-color)] bg-[var(--bg-hover)] p-px">
      <span
        className="pointer-events-none absolute inset-y-px left-px w-[calc((100%-2px)/3)] rounded-[7px] bg-[var(--accent-primary)] transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${Math.max(selectedIndex, 0) * 100}%)` }}
        aria-hidden="true"
      />
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`relative z-10 inline-flex items-center justify-center gap-1.5 rounded-[7px] px-3 py-2 text-xs font-semibold transition ${
              active ? "text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            aria-pressed={active}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
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
  const { themePreference, setTheme } = useTheme()
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
    setDesktopNotificationsEnabled(readStoredBoolean("desktop_notifications_enabled", false))
    setNewEmailAlertsEnabled(readStoredBoolean("new_email_alerts_enabled", false))
    onShowPreviewTextChange(readStoredBoolean("show_preview", true))
    onSortOrderChange(readStoredSortOrder())
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

  const dangerZoneStyle = {
    background: "color-mix(in srgb, var(--tag-highrisk-bg) 24%, transparent)",
    border: "1px solid color-mix(in srgb, var(--tag-highrisk-text) 18%, transparent)"
  }

  return createPortal(
    <div className={`fixed inset-0 z-50 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}>
      <button
        type="button"
        className={`absolute inset-0 bg-[var(--overlay-backdrop)] transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close settings"
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-[420px] transform flex-col bg-[var(--bg-sidebar)] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <section className="space-y-3 border-b border-[var(--border-color)] pb-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">ACCOUNT</h3>
            {account ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{account.email}</p>
                  <p className="truncate text-xs text-[var(--text-secondary)]">{account.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDisconnectAccount?.(account.id)}
                  className="rounded-full border border-[var(--border-color)] bg-[var(--bg-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onConnectGmail}
                className="rounded-full border border-[var(--border-color)] bg-[var(--bg-hover)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
              >
                Connect Gmail
              </button>
            )}
            <p className="text-xs text-[var(--text-muted)]">Press Alt+A to switch accounts</p>
          </section>

          <section className="space-y-4 border-b border-[var(--border-color)] py-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">NOTIFICATIONS</h3>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Desktop notifications</p>
                <p className="text-xs text-[var(--text-secondary)]">Ask before enabling desktop alerts.</p>
              </div>
              <Toggle checked={desktopNotificationsEnabled} onChange={handleDesktopNotificationsToggle} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">New email alerts</p>
                <p className="text-xs text-[var(--text-secondary)]">Store alert preference locally.</p>
              </div>
              <Toggle checked={newEmailAlertsEnabled} onChange={handleNewEmailAlertsToggle} />
            </div>
          </section>

          <section className="space-y-4 border-b border-[var(--border-color)] py-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">DISPLAY</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">App theme</p>
                <p className="text-xs text-[var(--text-secondary)]">Switch between light and dark mode</p>
              </div>
              <ThemeSegmentedControl value={themePreference} onChange={setTheme} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Show preview text in email list</p>
                <p className="text-xs text-[var(--text-secondary)]">Hide snippets to keep the inbox denser.</p>
              </div>
              <Toggle checked={showPreviewText} onChange={handlePreviewToggle} />
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">Sort emails by</span>
              <select
                value={sortOrder}
                onChange={(event) => handleSortChange(event.target.value === "oldest" ? "oldest" : "recent")}
                className="rounded-2xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm outline-none"
              >
                <option value="recent">Most recent</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </section>

          <section className="space-y-4 border-b border-[var(--border-color)] py-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">SYNC</h3>
            <button
              type="button"
              onClick={onSyncNow}
              className="rounded-full border border-[var(--border-color)] bg-[var(--bg-hover)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
            >
              Sync now
            </button>
            {lastSyncedLabel ? <p className="text-xs text-[var(--text-muted)]">Last synced: {lastSyncedLabel}</p> : null}
          </section>

          <section className="mt-5 rounded-lg p-4" style={dangerZoneStyle}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--tag-highrisk-text)]">DANGER ZONE</h3>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--tag-highrisk-text)]">Sign out from this device.</p>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full border border-[var(--tag-highrisk-text)] bg-[var(--tag-highrisk-bg)] px-4 py-2 text-sm font-semibold text-[var(--tag-highrisk-text)]"
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
