"use client"

import { DialogShell } from "@/components/ui/dialog"
import { Kbd } from "@/components/common/Kbd"
import { copy } from "@/lib/copy"

/**
 * Props for the keyboard shortcuts dialog.
 */
export interface KeyboardShortcutsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const shortcuts = [
  { keys: "G I", label: copy.shortcuts.openInbox },
  { keys: "G S", label: copy.shortcuts.openStarred },
  { keys: "C", label: copy.shortcuts.compose },
  { keys: "E", label: copy.shortcuts.archive },
  { keys: "R", label: copy.shortcuts.reply },
  { keys: "J", label: copy.shortcuts.next },
  { keys: "K", label: copy.shortcuts.previous },
  { keys: "?", label: copy.shortcuts.help }
]

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  return (
    <DialogShell open={open} onOpenChange={onOpenChange} title={copy.reader.shortcutsTitle}>
      <div className="grid gap-3 sm:grid-cols-2">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.keys}
            className="flex items-center justify-between rounded-xl border border-border bg-surface-raised px-4 py-4 dark:border-white/10 dark:bg-[#161616]"
          >
            <span className="text-base text-text-primary dark:text-white">{shortcut.label}</span>
            <Kbd keys={shortcut.keys} />
          </div>
        ))}
      </div>
    </DialogShell>
  )
}
