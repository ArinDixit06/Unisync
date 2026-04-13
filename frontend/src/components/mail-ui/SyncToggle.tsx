import { RefreshCw } from "lucide-react"

export function SyncToggle({
  syncing,
  disabled,
  onToggle
}: {
  syncing?: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={syncing}
      aria-label="Sync inbox"
      onClick={onToggle}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--bg-selected)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
      {syncing ? "Syncing" : "Sync"}
    </button>
  )
}
