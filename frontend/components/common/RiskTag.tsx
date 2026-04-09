import { copy } from "@/lib/copy"
import type { MailTag } from "@/lib/types"
import { cn } from "@/lib/utils"

const tagStyles: Record<MailTag, string> = {
  newsletter: "bg-tag-news-bg text-tag-news-text",
  promotional: "bg-tag-promo-bg text-tag-promo-text",
  transactional: "bg-tag-txn-bg text-tag-txn-text",
  "high-risk": "bg-tag-risk-bg text-tag-risk-text"
}

const tagCopy: Record<MailTag, string> = {
  newsletter: copy.tags.newsletter,
  promotional: copy.tags.promotional,
  transactional: copy.tags.transactional,
  "high-risk": copy.tags.highRisk
}

/**
 * Props for category chips shown in the mail list.
 */
export interface RiskTagProps {
  tag: MailTag
}

export function RiskTag({ tag }: RiskTagProps) {
  return <span className={cn("inline-flex rounded-full px-2 py-1 text-xs font-medium", tagStyles[tag])}>{tagCopy[tag]}</span>
}
