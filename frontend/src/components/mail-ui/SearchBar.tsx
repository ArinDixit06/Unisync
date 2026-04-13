import { Search } from "lucide-react"

export function SearchBar({
  placeholder,
  value,
  onChange
}: {
  placeholder?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="relative flex w-full items-center gap-2 rounded-full border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2 text-sm text-[var(--text-secondary)] shadow-sm transition focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-bg)]">
      <Search size={16} className="text-[var(--text-muted)]" />
      <input
        className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? "Search mail, sender or subject"}
        aria-label={placeholder ?? "Search mail, sender or subject"}
      />
      <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
        /
      </span>
    </label>
  )
}
