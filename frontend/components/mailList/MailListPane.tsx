"use client"

import type { EmailRecord } from "@/lib/types"
import { copy } from "@/lib/copy"
import type { ListFilter } from "@/stores/useMailStore"
import { MailListEmpty } from "@/components/mailList/MailListEmpty"
import { MailListFilter } from "@/components/mailList/MailListFilter"
import { MailListItem } from "@/components/mailList/MailListItem"
import { MailListSearch } from "@/components/mailList/MailListSearch"

/**
 * Props for the scrollable mail list panel.
 */
export interface MailListPaneProps {
  emails: EmailRecord[]
  selectedEmailId: string | null
  filter: ListFilter
  query: string
  onFilterChange: (filter: ListFilter) => void
  onQueryChange: (value: string) => void
  onSelect: (emailId: string) => void
  hidden?: boolean
}

export function MailListPane({
  emails,
  selectedEmailId,
  filter,
  query,
  onFilterChange,
  onQueryChange,
  onSelect,
  hidden = false
}: MailListPaneProps) {
  return (
    <section
      aria-label={copy.list.title}
      className={hidden ? "hidden xl:flex xl:w-0" : "flex h-full min-w-0 flex-col border-r border-border bg-[var(--mail-list-bg)] dark:border-white/10"}
    >
      <header className="space-y-4 border-b border-border px-4 py-5 dark:border-white/10">
        <div>
          <h1 className="text-xl font-semibold text-text-primary dark:text-white">{copy.list.title}</h1>
          <p className="mt-1 text-base text-text-secondary dark:text-text-muted">{copy.list.subtitle}</p>
        </div>
        <MailListSearch value={query} onChange={onQueryChange} />
        <MailListFilter activeFilter={filter} onFilterChange={onFilterChange} />
      </header>
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {emails.length === 0 ? (
          <MailListEmpty />
        ) : (
          <div role="list" className="space-y-1">
            {emails.map((email, index) => (
              <div key={email.id} role="listitem">
                <MailListItem
                  email={email}
                  index={index}
                  selected={selectedEmailId === email.id}
                  onSelect={() => onSelect(email.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
