import { useEffect, useState } from "react"
import { Folder, Mail, Star, Clock3, AlertTriangle, ChevronRight } from "lucide-react"
import { ComposeButton } from "./ComposeButton"
import { SyncToggle } from "./SyncToggle"
import { AccountSwitcher, AccountOption } from "./AccountSwitcher"
import { LabelList, LabelItem } from "./LabelList"
import { EmailCategory } from "../../stores/uiStore"

const categories: Array<{ id: EmailCategory; label: string }> = [
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
  onLogout?: () => void
}

export function Sidebar({
  labels,
  activeFilter,
  activeCategory,
  activeLabelId,
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
  onAccountSelect,
  onLogout
}: SidebarProps) {
  const [sections, setSections] = useState({ folders: true, categories: true, labels: true })
  const [accountOpen, setAccountOpen] = useState(false)

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
      className={`flex h-full flex-col gap-6 border-r border-gray-200/70 bg-gray-100 px-4 py-6 shadow-sm ${
        collapsed ? "w-[84px]" : "w-[260px]"
      } transition-all duration-200 ease-out`}
      aria-label="Mailbox sidebar"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
            U
          </span>
          {!collapsed ? <span>UniSync</span> : null}
        </div>
        <button
          type="button"
          onClick={onCollapseToggle}
          className="hidden rounded-full border border-gray-200 p-2 text-gray-500 hover:border-blue-300 hover:text-blue-600 lg:inline-flex"
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

      {!collapsed && accounts.length ? (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Linked Accounts</div>
          <div className="mt-2 space-y-2">
            {accounts.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600"
              >
                <span className="truncate">{item.email}</span>
                <span className="text-[11px] text-gray-400">Gmail</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <ComposeButton onClick={onCompose} />
        {!collapsed ? <SyncToggle syncing={syncing} disabled={syncDisabled} onToggle={onSync} /> : null}
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto pr-1">
        <div>
          <button
            type="button"
            className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-400"
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
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onFilterChange(item.id as SidebarProps["activeFilter"])}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                      active
                        ? "bg-blue-50 text-blue-800"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={16} />
                    {!collapsed ? <span>{item.label}</span> : null}
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
              className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-400"
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
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-100"
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
              className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-400"
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

      {!collapsed ? (
        <div className="rounded-2xl border border-gray-200 bg-white/70 p-3 text-xs text-gray-500">
          <div>Tip: Press <span className="font-semibold">Alt + A</span> to switch accounts.</div>
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
            >
              Log out
            </button>
          ) : null}
        </div>
      ) : null}
    </aside>
  )
}
