import "./inbox.css"
import { Button } from "../primitives"

export function SuggestedEventCard({
  event,
  onConfirm,
  onDismiss
}: {
  event: any
  onConfirm: () => void
  onDismiss: () => void
}) {
  return (
    <div className="suggested-event">
      <div style={{ fontWeight: 600 }}>{event.title}</div>
      <div style={{ fontSize: "var(--type-xs)", color: "var(--color-text-secondary)" }}>{event.start_datetime}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button size="sm" onClick={onConfirm}>Add to Calendar</Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>Dismiss</Button>
      </div>
    </div>
  )
}
