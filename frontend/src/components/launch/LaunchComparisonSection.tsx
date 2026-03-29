const rows = [
  {
    label: "Student context",
    unisync: "Prioritizes campus updates, deadlines, events, and follow-ups.",
    legacy: "Treats every inbox like a generic work mailbox.",
    impact: "You spot the important academic message first."
  },
  {
    label: "Inbox clarity",
    unisync: "Summaries, risk cues, and cleaner grouping reduce noise fast.",
    legacy: "Unread counts and folders still leave the real triage to you.",
    impact: "Less scanning, less second-guessing, less fatigue."
  },
  {
    label: "Security posture",
    unisync: "Encrypted mail storage plus sender trust analysis.",
    legacy: "Mostly leaves security understanding to the underlying provider.",
    impact: "Sensitive mail stays better protected and easier to evaluate."
  },
  {
    label: "Workflow speed",
    unisync: "Gmail and Outlook come together in one sharper interface.",
    legacy: "You bounce across tabs, accounts, and inconsistent views.",
    impact: "Faster check-ins between classes or during busy weeks."
  }
]

const tiers = [
  { name: "UniSync", tier: "S Tier", note: "Best fit for student life", color: "#173758", text: "#f8f6f0" },
  { name: "Gmail", tier: "B Tier", note: "Capable but generic", color: "#efe6d6", text: "#2f2517" },
  { name: "Outlook", tier: "B- Tier", note: "Useful, but less tailored", color: "#f2ecdf", text: "#2f2517" }
]

export function LaunchComparisonSection() {
  return (
    <section
      style={{
        padding: "clamp(24px, 4vw, 36px)",
        borderRadius: 34,
        background: "#fbfcfe",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        boxShadow: "0 28px 80px rgba(15, 23, 42, 0.08)"
      }}
    >
      <style>{`
        .launch-comparison-table {
          display: grid;
          grid-template-columns: 1.1fr 1fr 1fr 1fr;
        }

        @media (max-width: 900px) {
          .launch-comparison-table {
            grid-template-columns: 1fr;
          }

          .launch-comparison-head {
            display: none !important;
          }
        }
      `}</style>

      <div style={{ display: "grid", gap: 28 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 360px)",
            gap: 24,
            alignItems: "end"
          }}
        >
          <div style={{ display: "grid", gap: 14 }}>
            <span
              style={{
                display: "inline-flex",
                width: "fit-content",
                padding: "8px 13px",
                borderRadius: 999,
                background: "#eef4fb",
                border: "1px solid rgba(23, 55, 88, 0.08)",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#30506e"
              }}
            >
              Why it beats legacy platforms
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: "clamp(34px, 4vw, 54px)",
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
                color: "#132133"
              }}
            >
              A comparison that feels clear at a glance.
            </h2>
            <p style={{ margin: 0, maxWidth: 720, lineHeight: 1.8, color: "#526173" }}>
              UniSync is meant to feel more refined than standard email software. It is calmer, more protective, and
              more relevant to how students actually sort through mail every day.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: 10
            }}
          >
            {tiers.map((tier) => (
              <div
                key={tier.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "14px 16px",
                  borderRadius: 20,
                  background: tier.color,
                  color: tier.text
                }}
              >
                <div>
                  <strong style={{ display: "block", fontSize: 16 }}>{tier.name}</strong>
                  <span style={{ opacity: 0.76 }}>{tier.note}</span>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    padding: "7px 10px",
                    borderRadius: 999,
                    background: tier.name === "UniSync" ? "rgba(255,255,255,0.14)" : "rgba(19,33,51,0.06)",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    fontSize: 12
                  }}
                >
                  {tier.tier}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            overflow: "hidden",
            borderRadius: 28,
            border: "1px solid rgba(148, 163, 184, 0.16)"
          }}
        >
          <div
            className="launch-comparison-table launch-comparison-head"
            style={{
              background: "linear-gradient(135deg, #132133, #1f3d5e)",
              color: "#f8f6f0",
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase"
            }}
          >
            <div style={{ padding: 18 }}>Capability</div>
            <div style={{ padding: 18 }}>UniSync</div>
            <div style={{ padding: 18 }}>Legacy</div>
            <div style={{ padding: 18 }}>Student impact</div>
          </div>

          {rows.map((row, index) => (
            <div
              key={row.label}
              className="launch-comparison-table"
              style={{
                borderTop: index === 0 ? "none" : "1px solid rgba(148, 163, 184, 0.14)",
                background: index % 2 === 0 ? "#ffffff" : "#f8fafc"
              }}
            >
              <div style={{ padding: 20, color: "#132133", fontWeight: 700 }}>{row.label}</div>
              <div style={{ padding: 20, color: "#1d4f85", lineHeight: 1.75 }}>{row.unisync}</div>
              <div style={{ padding: 20, color: "#8a5a1b", lineHeight: 1.75 }}>{row.legacy}</div>
              <div style={{ padding: 20, color: "#526173", lineHeight: 1.75 }}>{row.impact}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
