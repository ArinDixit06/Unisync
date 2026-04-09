"use client"

import { Archive, Ellipsis, Forward, Reply, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { Avatar } from "@/components/common/Avatar"
import { Kbd } from "@/components/common/Kbd"
import { Tooltip } from "@/components/ui/tooltip"
import { copy } from "@/lib/copy"
import type { EmailRecord } from "@/lib/types"
import { formatLongMailDate } from "@/lib/utils"

/**
 * Props for the reader header section.
 */
export interface ReaderHeaderProps {
  email: EmailRecord
  onArchive: () => void
}

export function ReaderHeader({ email, onArchive }: ReaderHeaderProps) {
  const actions = [
    { label: copy.reader.actions.reply, shortcut: "R", icon: Reply },
    { label: copy.reader.actions.forward, shortcut: "F", icon: Forward },
    { label: copy.reader.actions.archive, shortcut: "E", icon: Archive, onClick: onArchive },
    { label: copy.reader.actions.delete, shortcut: "Del", icon: Trash2 },
    { label: copy.reader.actions.more, shortcut: "", icon: Ellipsis }
  ]

  return (
    <motion.header layoutId={`mail-${email.id}`} className="space-y-4 border-b border-border px-5 py-5 dark:border-white/10">
      <div className="flex items-start justify-between gap-4">
        <h2 className="line-clamp-2 max-w-3xl text-md font-semibold text-text-primary dark:text-white">{email.subject}</h2>
        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <Tooltip
              key={action.label}
              content={
                <span className="flex items-center gap-2">
                  {action.label}
                  {action.shortcut ? <Kbd className="border-white/20 bg-white/10 text-white" keys={action.shortcut} /> : null}
                </span>
              }
            >
              <button
                aria-label={action.label}
                className="focus-ring flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary dark:hover:bg-white/10 dark:hover:text-white"
                onClick={action.onClick}
              >
                <action.icon className="h-4 w-4" />
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Avatar name={email.senderName} size="lg" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary dark:text-white">{email.senderName}</p>
          <p className="truncate text-sm text-text-muted">{email.senderEmail}</p>
        </div>
        <p className="ml-auto text-sm text-text-muted">{formatLongMailDate(email.receivedAt)}</p>
      </div>
    </motion.header>
  )
}
