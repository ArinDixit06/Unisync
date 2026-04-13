import { ChevronDown } from "lucide-react"

export interface AccountOption {
  id: string
  name: string
  email: string
  provider?: string
}

export function AccountSwitcher({
  account,
  accounts,
  open,
  onToggle,
  onSelect
}: {
  account: AccountOption
  accounts: AccountOption[]
  open: boolean
  onToggle: () => void
  onSelect: (accountId: string) => void
}) {
  return (
    <div className="relative">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-left text-sm font-semibold text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex flex-col">
          <span className="text-xs text-[var(--text-muted)]">Account</span>
          <span>{account.name}</span>
          <span className="text-xs font-normal text-[var(--text-secondary)]">{account.email}</span>
        </span>
        <ChevronDown size={16} className="text-[var(--text-muted)]" />
      </button>
      {open ? (
        <div
          className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-2 shadow-lift"
          role="listbox"
        >
          {accounts.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="flex w-full flex-col items-start gap-1 rounded-xl px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              <span className="font-semibold">{item.name}</span>
              <span className="text-xs text-[var(--text-muted)]">{item.email}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
