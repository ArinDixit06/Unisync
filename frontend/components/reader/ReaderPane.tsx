"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { MailOpen } from "lucide-react"
import { computeRisk } from "@/lib/computeRisk"
import { copy } from "@/lib/copy"
import type { EmailRecord } from "@/lib/types"
import { EmptyState } from "@/components/common/EmptyState"
import { ReaderBody } from "@/components/reader/ReaderBody"
import { ReaderHeader } from "@/components/reader/ReaderHeader"
import { ReaderReplyBar } from "@/components/reader/ReaderReplyBar"
import { ReaderRiskBanner } from "@/components/reader/ReaderRiskBanner"

/**
 * Props for the full email reader pane.
 */
export interface ReaderPaneProps {
  email: EmailRecord | null
  riskDismissed: boolean
  onDismissRisk: (emailId: string) => void
  onArchive: () => void
  onSendReply: () => void
}

export function ReaderPane({ email, riskDismissed, onDismissRisk, onArchive, onSendReply }: ReaderPaneProps) {
  const [showImages, setShowImages] = useState(false)

  useEffect(() => {
    setShowImages(false)
  }, [email?.id])

  if (!email) {
    return (
      <section aria-label={copy.emptyReader.title} className="flex h-full min-w-0 flex-1 p-5">
        <EmptyState title={copy.emptyReader.title} description={copy.emptyReader.description} icon={<MailOpen className="h-8 w-8" />} />
      </section>
    )
  }

  const assessment = computeRisk(email)

  return (
    <motion.section
      aria-live="polite"
      aria-label={copy.reader.loadAnnouncement}
      className="flex h-full min-w-0 flex-1 flex-col bg-[var(--reader-bg)]"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      <ReaderHeader email={email} onArchive={onArchive} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!riskDismissed ? (
          <div className="px-5 pt-4">
            <ReaderRiskBanner assessment={assessment} onDismiss={() => onDismissRisk(email.id)} />
          </div>
        ) : null}
        <ReaderBody email={email} showImages={showImages} onLoadImages={() => setShowImages(true)} />
      </div>
      <ReaderReplyBar senderName={email.senderName} onSend={onSendReply} />
    </motion.section>
  )
}
