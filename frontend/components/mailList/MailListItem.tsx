"use client"

import { motion } from "framer-motion"
import { Avatar } from "@/components/common/Avatar"
import { RiskTag } from "@/components/common/RiskTag"
import type { EmailRecord } from "@/lib/types"
import { cn, formatRelativeMailTime } from "@/lib/utils"

/**
 * Props for a single mail list row.
 */
export interface MailListItemProps {
  email: EmailRecord
  selected: boolean
  index: number
  onSelect: () => void
}

export function MailListItem({ email, selected, index, onSelect }: MailListItemProps) {
  return (
    <motion.button
      layoutId={`mail-${email.id}`}
      aria-pressed={selected}
      aria-label={`${email.senderName} ${email.subject}`}
      className={cn(
        "focus-ring flex w-full items-start gap-3 rounded-xl border border-transparent px-4 py-4 text-left transition-colors",
        selected
          ? "bg-[#f0fdf7] dark:bg-brand/10"
          : "hover:bg-surface-raised dark:hover:bg-white/5"
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onSelect}
    >
      <span className={cn("mt-3 h-[7px] w-[7px] rounded-full bg-brand", email.read && "opacity-0")} />
      <Avatar name={email.senderName} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <p className={cn("truncate text-sm", email.read ? "font-regular text-text-secondary" : "font-semibold text-text-primary dark:text-white")}>
            {email.senderName}
          </p>
          <span className="ml-auto shrink-0 text-xs text-text-muted">{formatRelativeMailTime(email.receivedAt)}</span>
        </div>
        <p className={cn("mt-1 truncate text-sm", email.read ? "font-regular text-[#444444] dark:text-text-muted" : "font-semibold text-text-primary dark:text-white")}>
          {email.subject}
        </p>
        <p className="mt-1 truncate text-xs text-text-muted">{email.preview}</p>
        <div className="mt-2">
          <RiskTag tag={email.tag} />
        </div>
      </div>
    </motion.button>
  )
}
