"use client"

import { motion } from "framer-motion"
import { AlertTriangle, Info, ShieldAlert, X } from "lucide-react"
import type { RiskAssessment } from "@/lib/computeRisk"
import { copy } from "@/lib/copy"
import { cn } from "@/lib/utils"

const bannerStyles = {
  low: {
    wrapper: "border-l-4 border-blue-500 bg-tag-txn-bg text-tag-txn-text",
    icon: Info
  },
  medium: {
    wrapper: "border-l-4 border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100",
    icon: AlertTriangle
  },
  high: {
    wrapper: "border-l-4 border-red-600 bg-tag-risk-bg text-tag-risk-text dark:bg-red-500/10 dark:text-red-100",
    icon: ShieldAlert
  }
} as const

/**
 * Props for the computed risk banner.
 */
export interface ReaderRiskBannerProps {
  assessment: RiskAssessment
  onDismiss: () => void
}

export function ReaderRiskBanner({ assessment, onDismiss }: ReaderRiskBannerProps) {
  if (assessment.level === "safe") {
    return null
  }

  const config = bannerStyles[assessment.level]
  const Icon = config.icon

  return (
    <motion.div
      aria-live="polite"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className={cn("overflow-hidden rounded-xl px-4 py-4", config.wrapper)}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{assessment.title}</p>
          <p className="mt-1 text-sm leading-6">{assessment.body}</p>
        </div>
        <button aria-label={copy.reader.riskDismiss} className="focus-ring rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10" onClick={onDismiss}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}
