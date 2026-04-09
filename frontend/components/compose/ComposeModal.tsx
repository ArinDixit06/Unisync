"use client"

import { motion } from "framer-motion"
import { DialogShell } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ComposeToolbar } from "@/components/compose/ComposeToolbar"
import { copy } from "@/lib/copy"

/**
 * Props for the sliding compose sheet.
 */
export interface ComposeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ComposeModal({ open, onOpenChange }: ComposeModalProps) {
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={copy.compose.title}
      className="top-auto w-[min(880px,calc(100vw-24px))] translate-y-0 rounded-t-[24px] rounded-b-none p-0 sm:left-1/2 sm:top-auto sm:-translate-x-1/2 sm:translate-y-0"
    >
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 20 }}>
        <div className="grid gap-4 px-4 pb-4">
          <input aria-label={copy.compose.to} className="focus-ring h-11 rounded-lg border border-border px-4 dark:border-white/10 dark:bg-[#161616]" placeholder={copy.compose.to} />
          <input
            aria-label={copy.compose.subject}
            className="focus-ring h-11 rounded-lg border border-border px-4 dark:border-white/10 dark:bg-[#161616]"
            placeholder={copy.compose.subject}
          />
          <textarea
            aria-label={copy.compose.body}
            className="focus-ring min-h-[220px] rounded-xl border border-border px-4 py-4 dark:border-white/10 dark:bg-[#161616]"
            placeholder={copy.compose.body}
          />
        </div>
        <ComposeToolbar />
        <div className="flex items-center justify-between border-t border-border px-4 py-4 dark:border-white/10">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {copy.compose.discard}
          </Button>
          <Button>{copy.compose.send}</Button>
        </div>
      </motion.div>
    </DialogShell>
  )
}
