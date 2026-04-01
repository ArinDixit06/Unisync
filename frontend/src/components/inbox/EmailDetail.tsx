import DOMPurify from "dompurify"
import { Button, Badge } from "../primitives"
import "./inbox.css"
import { AISummaryCard } from "./AISummaryCard"
import { RiskBanner } from "./RiskBanner"
import { SuggestedEventCard } from "./SuggestedEventCard"
import { safeParseJsonArray } from "../../lib/json"

const sanitizeEmailHtml = (html: string) => {
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ["style", "table", "thead", "tbody", "tfoot", "tr", "td", "th"],
    ADD_ATTR: [
      "target",
      "rel",
      "style",
      "class",
      "align",
      "valign",
      "bgcolor",
      "width",
      "height",
      "border",
      "cellpadding",
      "cellspacing",
      "colspan",
      "rowspan",
      "srcset"
    ]
  })

  const doc = new DOMParser().parseFromString(clean, "text/html")
  doc.querySelectorAll("a").forEach((anchor) => {
    anchor.setAttribute("target", "_blank")
    anchor.setAttribute("rel", "noopener noreferrer")
  })
  return doc.body.innerHTML
}

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

  const bullets = safeParseJsonArray(email.summary_bullets)
  const bodyHtml = email.body_html ? sanitizeEmailHtml(email.body_html) : ""

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

      {bullets.length ? <AISummaryCard bullets={bullets} /> : null}

      {bodyHtml ? <div dangerouslySetInnerHTML={{ __html: bodyHtml }} /> : null}

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
