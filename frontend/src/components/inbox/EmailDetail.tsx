import { Button, Badge } from "../primitives"
import "./inbox.css"
import { AISummaryCard } from "./AISummaryCard"
import { RiskBanner } from "./RiskBanner"
import { SuggestedEventCard } from "./SuggestedEventCard"

export function EmailDetail({
  email,
  onArchive,
  onDelete,
  onToggleRead,
  onConfirmEvent,
  onDismissEvent
}: {
  email: any
  onArchive: () => void
  onDelete: () => void
  onToggleRead: () => void
  onConfirmEvent: (eventId: string) => void
  onDismissEvent: (eventId: string) => void
}) {
  if (!email) {
    return <div className="email-detail">Select an email</div>
  }

  const bullets = typeof email.summary_bullets === "string" ? JSON.parse(email.summary_bullets) : email.summary_bullets

  return (
    <div className="email-detail">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--type-xl)" }}>{email.subject || "(No subject)"}</div>
          <div style={{ color: "var(--color-text-secondary)" }}>{email.sender_name} &lt;{email.sender_email}&gt;</div>
          <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
            {email.provider && <Badge variant="info">{email.provider}</Badge>}
            {email.account_email && <span style={{ fontSize: "var(--type-xs)", color: "var(--color-text-tertiary)" }}>{email.account_email}</span>}
            {email.processing_status && email.processing_status !== "done" && <Badge variant="warning">Analyzing</Badge>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button variant="secondary" size="sm" onClick={onToggleRead}>{email.is_read ? "Mark Unread" : "Mark Read"}</Button>
          <Button variant="secondary" size="sm" onClick={onArchive}>Archive</Button>
          <Button variant="danger" size="sm" onClick={onDelete}>Delete</Button>
        </div>
      </div>

      {email.risk_level && email.risk_reasons?.length ? (
        <RiskBanner level={email.risk_level} reasons={email.risk_reasons} onDismiss={() => {}} />
      ) : null}

      {bullets ? <AISummaryCard bullets={bullets} /> : null}

      <div dangerouslySetInnerHTML={{ __html: email.body_html || "" }} />

      {(email.suggested_events || []).map((event: any) => (
        <SuggestedEventCard
          key={event.id}
          event={event}
          onConfirm={() => onConfirmEvent(event.id)}
          onDismiss={() => onDismissEvent(event.id)}
        />
      ))}
    </div>
  )
}
