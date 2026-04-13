import { useEffect, useState } from "react"
import { Folder, Mail, Star, Clock3, AlertTriangle, ChevronRight, Moon, Sun } from "lucide-react"
import { ComposeButton } from "./ComposeButton"
import { SyncToggle } from "./SyncToggle"
import { AccountSwitcher, AccountOption } from "./AccountSwitcher"
import { LabelList, LabelItem } from "./LabelList"
import { EmailCategory } from "../../stores/uiStore"
import { useTheme } from "../../contexts/ThemeContext"

const categories: Array<{ id: EmailCategory; label: string }> = [
  { id: "all", label: "All mail" },
  { id: "primary", label: "Primary" },
  { id: "updates", label: "Updates" },
  { id: "promotions", label: "Promotions" },
  { id: "social", label: "Social" },
  { id: "forums", label: "Forums" }
]

export interface SidebarProps {
  labels: LabelItem[]
  activeFilter: "all" | "unread" | "starred" | "high_risk" | "snoozed" | "sent" | "drafts" | "trash"
  activeCategory: EmailCategory
  activeLabelId: string | null
  starredCount?: number
  syncing?: boolean
  syncDisabled?: boolean
  account: AccountOption
  accounts: AccountOption[]
  collapsed?: boolean
  onCollapseToggle?: () => void
  onFilterChange: (filter: "all" | "unread" | "starred" | "high_risk" | "snoozed" | "sent" | "drafts" | "trash") => void
  onLabelSelect: (labelId: string | null) => void
  onCategoryChange: (category: EmailCategory) => void
  onCompose: () => void
  onSync: () => void
  onAccountSelect: (accountId: string) => void
}

export function Sidebar({
  labels,
  activeFilter,
  activeCategory,
  activeLabelId,
  starredCount,
  syncing,
  syncDisabled,
  account,
  accounts,
  collapsed,
  onCollapseToggle,
  onFilterChange,
  onLabelSelect,
  onCategoryChange,
  onCompose,
  onSync,
  onAccountSelect
}: SidebarProps) {
  const [sections, setSections] = useState({ folders: true, categories: true, labels: true })
  const [accountOpen, setAccountOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === "a") {
        event.preventDefault()
        setAccountOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const toggleSection = (key: keyof typeof sections) =>
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <aside
      className={`flex h-full flex-col gap-6 border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] px-4 py-6 shadow-sm ${
        collapsed ? "w-[84px]" : "w-[260px]"
      } transition-all duration-200 ease-out`}
      aria-label="Mailbox sidebar"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--compose-btn-bg)] text-sm font-bold text-[var(--compose-btn-text)]">
            U
          </span>
          {!collapsed ? <span>UniSync</span> : null}
        </div>
        <button
          type="button"
          onClick={onCollapseToggle}
          className="hidden rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] lg:inline-flex"
          aria-label="Collapse sidebar"
        >
          <ChevronRight size={16} className={collapsed ? "rotate-180" : ""} />
        </button>
      </div>

      {!collapsed ? (
        <AccountSwitcher
          account={account}
          accounts={accounts}
          open={accountOpen}
          onToggle={() => setAccountOpen((value) => !value)}
          onSelect={(id) => {
            onAccountSelect(id)
            setAccountOpen(false)
          }}
        />
      ) : null}

      <div className="flex flex-col gap-3">
        <ComposeButton onClick={onCompose} />
        {!collapsed ? <SyncToggle syncing={syncing} disabled={syncDisabled} onToggle={onSync} /> : null}
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto pr-1">
        <div>
          <button
            type="button"
            className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
            onClick={() => toggleSection("folders")}
            aria-expanded={sections.folders}
          >
            Folders
            <ChevronRight size={14} className={sections.folders ? "rotate-90" : ""} />
          </button>
          {sections.folders ? (
            <div className="mt-2 space-y-1">
              {[
                { id: "all", label: "Inbox", icon: Mail },
                { id: "unread", label: "Unread", icon: Folder },
                { id: "starred", label: "Starred", icon: Star },
                { id: "snoozed", label: "Snoozed", icon: Clock3 },
                { id: "sent", label: "Sent", icon: Mail },
                { id: "drafts", label: "Drafts", icon: Mail },
                { id: "trash", label: "Trash", icon: Mail },
                { id: "high_risk", label: "High Risk", icon: AlertTriangle }
              ].map((item) => {
                const active = activeFilter === item.id
                const Icon = item.icon
                const showStarCount = item.id === "starred" && typeof starredCount === "number"
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onFilterChange(item.id as SidebarProps["activeFilter"])}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                      active
                        ? "bg-[var(--bg-selected)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <Icon size={16} />
                    {!collapsed ? (
                      <span className="flex flex-1 items-center justify-between gap-2">
                        <span>{item.label}</span>
                        {showStarCount ? (
                          <span className="rounded-full bg-[var(--accent-primary)] px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                            {starredCount}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        {!collapsed ? (
          <div>
            <button
              type="button"
              className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
              onClick={() => toggleSection("categories")}
              aria-expanded={sections.categories}
            >
              Categories
              <ChevronRight size={14} className={sections.categories ? "rotate-90" : ""} />
            </button>
            {sections.categories ? (
              <div className="mt-2 space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onCategoryChange(category.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm ${
                      activeCategory === category.id
                        ? "bg-[var(--bg-selected)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {!collapsed ? (
          <div>
            <button
              type="button"
              className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
              onClick={() => toggleSection("labels")}
              aria-expanded={sections.labels}
            >
              Labels
              <ChevronRight size={14} className={sections.labels ? "rotate-90" : ""} />
            </button>
            {sections.labels ? (
              <div className="mt-2">
                <LabelList labels={labels} activeLabelId={activeLabelId} onSelect={onLabelSelect} />
              </div>
            ) : null}
          </div>
        ) : null}
      </nav>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--border-color)] pt-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-hover)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)]"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          {!collapsed ? (theme === "dark" ? "Light mode" : "Dark mode") : null}
        </button>
      </div>

    </aside>
  )
}
