import { formatDistanceToNow } from "date-fns"
import { Avatar, Badge, Button } from "../primitives"
import "./inbox.css"

export interface EmailRowData {
  id: string
  sender_name?: string
  sender_email: string
  subject?: string
  preview_snippet?: string
  received_at: string
  is_read: boolean
  is_starred?: boolean
  risk_level?: string
  priority_level?: string
  category?: string
  provider?: string
  account_email?: string
  processing_status?: string
}

export function EmailRow({
  email,
  selected,
  onSelect,
  onArchive,
  onDelete,
  onToggleRead
}: {
  email: EmailRowData
  selected: boolean
  onSelect: () => void
  onArchive: () => void
  onDelete: () => void
  onToggleRead: () => void
}) {
  const timeAgo = formatDistanceToNow(new Date(email.received_at), { addSuffix: true })
  const riskBadge =
    email.risk_level === "high" ? "danger" : email.risk_level === "medium" ? "warning" : "success"
  const priorityBadge =
    email.priority_level === "high" ? "danger" : email.priority_level === "medium" ? "warning" : "info"

  return (
    <div className={`email-row ${selected ? "selected" : ""} ${email.is_read ? "" : "unread"}`} onClick={onSelect}>
      <Avatar name={email.sender_name || email.sender_email} size="sm" />
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 600 }}>{email.sender_name || email.sender_email}</div>
          <div style={{ fontSize: "var(--type-xs)", color: "var(--color-text-tertiary)" }}>{timeAgo}</div>
        </div>
        <div className="subject">{email.subject || "(No subject)"}</div>
        <div className="snippet">{email.preview_snippet}</div>
        <div className="row-meta">
          {email.provider && <Badge variant="info">{email.provider}</Badge>}
          {email.processing_status && email.processing_status !== "done" && (
            <Badge variant="warning">Analyzing</Badge>
          )}
          {email.account_email && <span className="row-account">{email.account_email}</span>}
        </div>
      </div>
      <div className="row-right">
        <div className="row-badges">
          {email.risk_level && <Badge variant={riskBadge}>{email.risk_level}</Badge>}
          {email.priority_level && <Badge variant={priorityBadge}>{email.priority_level}</Badge>}
        </div>
        <div className="row-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              onToggleRead()
            }}
          >
            {email.is_read ? "Unread" : "Read"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              onArchive()
            }}
          >
            Archive
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
