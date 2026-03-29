import { useState } from "react"
import { LaunchComparisonSection, LaunchSecurityHighlights } from "../components/launch"
import { Button, Input } from "../components/primitives"
import { supabase, supabaseConfigured } from "../lib/supabase"

const trustStats = [
  { value: "2 inboxes", label: "Gmail and Outlook in one workspace" },
  { value: "Encrypted", label: "Mail bodies and drafts protected at rest" },
  { value: "Student-first", label: "Designed around deadlines and campus workflows" }
]

export function AuthPage() {
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleAuth = async () => {
    if (!supabaseConfigured || !supabase) return
    if (mode === "sign_in") {
      await supabase.auth.signInWithPassword({ email, password })
    } else {
      await supabase.auth.signUp({ email, password })
    }
  }

  const handleGoogle = async () => {
    if (!supabaseConfigured || !supabase) return
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    })
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 12% 10%, rgba(173, 198, 255, 0.32), transparent 20%), radial-gradient(circle at 86% 7%, rgba(255, 213, 158, 0.28), transparent 16%), linear-gradient(180deg, #f6f0e6 0%, #f6f0e6 34%, #f9fafb 100%)"
      }}
    >
      <style>{`
        .auth-launch-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) 390px;
          gap: 28px;
          align-items: start;
        }

        .auth-hero-panel {
          position: relative;
          overflow: hidden;
          padding: clamp(28px, 4vw, 48px);
          border-radius: 34px;
          background:
            linear-gradient(145deg, rgba(8, 25, 43, 0.98) 0%, rgba(17, 42, 66, 0.97) 55%, rgba(20, 52, 81, 0.93) 100%);
          color: #f8f6f0;
          box-shadow: 0 36px 100px rgba(15, 23, 42, 0.18);
        }

        .auth-hero-panel::before {
          content: "";
          position: absolute;
          inset: auto -6% -28% auto;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(255, 211, 141, 0.34), transparent 68%);
          pointer-events: none;
        }

        .auth-hero-panel::after {
          content: "";
          position: absolute;
          inset: -10% auto auto -6%;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(104, 175, 255, 0.2), transparent 70%);
          pointer-events: none;
        }

        .auth-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .auth-secondary-grid {
          display: grid;
          gap: 28px;
        }

        @media (max-width: 980px) {
          .auth-launch-grid {
            grid-template-columns: 1fr;
          }

          .auth-stat-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div
        style={{
          width: "min(1240px, calc(100% - 32px))",
          margin: "0 auto",
          padding: "24px 0 56px"
        }}
      >
        <div className="auth-launch-grid">
          <section className="auth-hero-panel">
            <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 28 }}>
              <div
                style={{
                  display: "inline-flex",
                  width: "fit-content",
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase"
                }}
              >
                Premium inbox for university life
              </div>

              <div style={{ display: "grid", gap: 18 }}>
                <h1
                  style={{
                    margin: 0,
                    maxWidth: 760,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: "clamp(48px, 8vw, 86px)",
                    lineHeight: 0.92,
                    letterSpacing: "-0.04em"
                  }}
                >
                  Serious email,
                  <br />
                  finally made calm.
                </h1>
                <p
                  style={{
                    margin: 0,
                    maxWidth: 660,
                    fontSize: 18,
                    lineHeight: 1.8,
                    color: "rgba(248, 246, 240, 0.76)"
                  }}
                >
                  UniSync brings academic email into one elegant workspace with encrypted storage, sharper triage, and
                  a more thoughtful experience than generic inboxes were ever built to offer.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12
                }}
              >
                <span style={{ padding: "10px 15px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Unified student inbox
                </span>
                <span style={{ padding: "10px 15px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Elegant security policy
                </span>
                <span style={{ padding: "10px 15px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Faster than tab juggling
                </span>
              </div>

              <div className="auth-stat-grid">
                {trustStats.map((stat) => (
                  <article
                    key={stat.label}
                    style={{
                      padding: 18,
                      borderRadius: 24,
                      background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
                      border: "1px solid rgba(255,255,255,0.12)",
                      backdropFilter: "blur(14px)"
                    }}
                  >
                    <div style={{ fontSize: 26, fontWeight: 700, color: "#ffe0a6", marginBottom: 8 }}>{stat.value}</div>
                    <div style={{ lineHeight: 1.6, color: "rgba(248, 246, 240, 0.72)" }}>{stat.label}</div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <aside style={{ position: "sticky", top: 20 }}>
            <div
              style={{
                padding: 10,
                borderRadius: 32,
                background: "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.78))",
                border: "1px solid rgba(15, 23, 42, 0.08)",
                boxShadow: "0 28px 80px rgba(15, 23, 42, 0.12)",
                backdropFilter: "blur(18px)"
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: 18,
                  padding: 24,
                  borderRadius: 24,
                  background: "linear-gradient(180deg, #fffdfa 0%, #f7f4ee 100%)"
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8b6f47" }}>
                    Access UniSync
                  </div>
                  <h2 style={{ fontSize: 28, lineHeight: 1.05, margin: 0, color: "#0f172a" }}>
                    {mode === "sign_in" ? "Welcome back" : "Create your workspace"}
                  </h2>
                  <p style={{ margin: 0, lineHeight: 1.65, color: "#6b7280" }}>
                    Your mail, deadlines, and student communication in one premium secure dashboard.
                  </p>
                </div>

                <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button onClick={handleAuth}>{mode === "sign_in" ? "Sign in" : "Sign up"}</Button>
                <Button variant="secondary" onClick={handleGoogle}>Continue with Google</Button>

                <div
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    background: "#f2eadf",
                    color: "#5f4a29",
                    fontSize: 14,
                    lineHeight: 1.6
                  }}
                >
                  Messages and drafts are now stored in encrypted armored form inside UniSync.
                </div>

                <button
                  onClick={() => setMode(mode === "sign_in" ? "sign_up" : "sign_in")}
                  style={{ border: "none", background: "none", color: "#6b7280", cursor: "pointer", padding: 0 }}
                >
                  {mode === "sign_in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </aside>
        </div>

        <div className="auth-secondary-grid" style={{ marginTop: 30 }}>
          <LaunchSecurityHighlights />
          <LaunchComparisonSection />
        </div>
      </div>
    </div>
  )
}
