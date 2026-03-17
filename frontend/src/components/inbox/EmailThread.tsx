import "./inbox.css"

export function EmailThread({ count }: { count: number }) {
  return (
    <div style={{ padding: "8px 16px", fontSize: "var(--type-xs)", color: "var(--color-text-tertiary)" }}>
      Thread ({count})
    </div>
  )
}
