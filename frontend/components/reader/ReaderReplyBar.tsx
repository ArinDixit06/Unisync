"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ComposeToolbar } from "@/components/compose/ComposeToolbar"
import { copy } from "@/lib/copy"

/**
 * Props for the inline reply composer.
 */
export interface ReaderReplyBarProps {
  senderName: string
  onSend: () => void
}

export function ReaderReplyBar({ senderName, onSend }: ReaderReplyBarProps) {
  const [focused, setFocused] = useState(false)
  const [value, setValue] = useState("")

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        if (focused && value.trim()) {
          onSend()
          setValue("")
          setFocused(false)
        }
      }

      if (event.key === "Escape") {
        setFocused(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [focused, onSend, value])

  return (
    <div className="sticky bottom-0 border-t border-border bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-[#0f0f0f]/90">
      <AnimatePresence initial={false}>
        {focused ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <ComposeToolbar />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="flex items-end gap-3 p-4">
        <textarea
          aria-label={copy.reader.replyPlaceholder.replace("{{name}}", senderName)}
          className="focus-ring min-h-[44px] flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-muted dark:border-white/10 dark:bg-[#1c1c1c] dark:text-white"
          placeholder={copy.reader.replyPlaceholder.replace("{{name}}", senderName)}
          rows={focused ? 4 : 1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setFocused(true)}
        />
        <Button variant="ghost">{copy.reader.actions.forward}</Button>
        <Button onClick={onSend}>{copy.reader.sendReply}</Button>
      </div>
    </div>
  )
}
