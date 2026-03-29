import { ShieldCheck, GraduationCap, Sparkles, Clock3 } from "lucide-react"

const pillars = [
  {
    icon: ShieldCheck,
    title: "Security Policy",
    text: "Mail bodies and drafts are persisted in encrypted armored form, access remains user-scoped, and trust signals surface suspicious senders early."
  },
  {
    icon: GraduationCap,
    title: "Built for campus life",
    text: "UniSync prioritizes class updates, admin notices, deadlines, and events instead of treating everything like generic office email."
  },
  {
    icon: Sparkles,
    title: "A calmer daily flow",
    text: "Summaries, priorities, and better organization turn inbox time into quick decisions rather than endless reading."
  },
  {
    icon: Clock3,
    title: "Fast when it matters",
    text: "Realtime updates and less context switching make the product feel lighter during heavy academic weeks."
  }
]

export function LaunchSecurityHighlights() {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "clamp(24px, 4vw, 34px)",
        borderRadius: 34,
        background:
          "linear-gradient(135deg, #fffaf2 0%, #f7f0e2 45%, #f1e6d5 100%)",
        border: "1px solid rgba(131, 98, 48, 0.12)",
        boxShadow: "0 28px 80px rgba(87, 67, 32, 0.08)"
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -70,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(12, 37, 63, 0.12), transparent 70%)",
          pointerEvents: "none"
        }}
      />

      <div style={{ position: "relative", display: "grid", gap: 26 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)",
            gap: 22,
            alignItems: "start"
          }}
        >
          <div style={{ display: "grid", gap: 14 }}>
            <span
              style={{
                display: "inline-flex",
                width: "fit-content",
                padding: "8px 13px",
                borderRadius: 999,
                background: "rgba(15, 23, 42, 0.05)",
                border: "1px solid rgba(15, 23, 42, 0.08)",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#7a5b2d"
              }}
            >
              Elegant protection
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
              Security that feels premium, not paranoid.
            </h2>
            <p style={{ margin: 0, maxWidth: 700, lineHeight: 1.8, color: "#475569", fontSize: 16 }}>
              UniSync treats privacy and clarity as part of the product experience. The result is a launch page that
              explains the security story cleanly while still feeling warm, polished, and student-friendly.
            </p>
          </div>

          <div
            style={{
              padding: 22,
              borderRadius: 26,
              background: "linear-gradient(180deg, #10253d 0%, #173758 100%)",
              color: "#f8f6f0",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.14)"
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.72 }}>
              UniSync Security Policy
            </div>
            <div style={{ marginTop: 14, display: "grid", gap: 12, lineHeight: 1.7, color: "rgba(248,246,240,0.82)" }}>
              <div>1. Sensitive mail bodies and drafts are encrypted before long-term storage.</div>
              <div>2. Authenticated ownership and service boundaries control who can access mail data.</div>
              <div>3. Trust signals like SPF or DKIM issues and disposable domains help flag risky senders.</div>
              <div>4. The security story is visible and explainable instead of buried in vague claims.</div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16
          }}
        >
          {pillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <article
                key={pillar.title}
                style={{
                  padding: 22,
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.05)",
                  display: "grid",
                  gap: 14
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    background: "linear-gradient(135deg, #183556, #2a5a8b)",
                    color: "#fff"
                  }}
                >
                  <Icon size={20} />
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <strong style={{ fontSize: 18, color: "#132133" }}>{pillar.title}</strong>
                  <p style={{ margin: 0, lineHeight: 1.7, color: "#526173" }}>{pillar.text}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
