import { Inbox } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"
import { copy } from "@/lib/copy"

/**
 * Props for the mail list empty state.
 */
export function MailListEmpty() {
  return <EmptyState title={copy.list.emptyTitle} description={copy.list.emptyDescription} icon={<Inbox className="h-7 w-7" />} />
}
