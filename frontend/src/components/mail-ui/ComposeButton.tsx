import { Pencil } from "lucide-react"

export function ComposeButton({
  onClick,
  floating
}: {
  onClick: () => void
  floating?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full bg-[var(--compose-btn-bg)] px-4 py-2 text-sm font-semibold text-[var(--compose-btn-text)] shadow-soft transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
        floating ? "fixed bottom-6 right-6 z-40 lg:hidden" : ""
      }`}
      aria-label="Compose new message"
    >
      <Pencil size={16} />
      <span>Compose</span>
    </button>
  )
}
