import "./inbox.css"

export function RiskBanner({ level, reasons, onDismiss }: { level: "low" | "medium" | "high"; reasons: string[]; onDismiss: () => void }) {
  return (
    <div className={`risk-banner ${level}`}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>Security Risk: {level}</strong>
        <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer" }}>Dismiss</button>
      </div>
      <ul style={{ paddingLeft: 16, marginTop: 8 }}>
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </div>
  )
}
