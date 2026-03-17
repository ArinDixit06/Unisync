import { useState } from "react"
import { supabase, supabaseConfigured } from "../lib/supabase"
import { Button, Input } from "../components/primitives"

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
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "3fr 2fr" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #0b0f12, #102027)",
          color: "#f7f7f4",
          padding: 48,
          display: "flex",
          alignItems: "center"
        }}
      >
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 42, marginBottom: 16 }}>UniSync</h1>
          <p style={{ maxWidth: 420, lineHeight: 1.6 }}>
            A premium unified inbox for students. Designed for focus, clarity, and speed.
          </p>
        </div>
      </div>
      <div style={{ padding: 48, display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%", display: "grid", gap: 16 }}>
          <h2 style={{ fontSize: 24 }}>{mode === "sign_in" ? "Sign in" : "Create account"}</h2>
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button onClick={handleAuth}>{mode === "sign_in" ? "Sign in" : "Sign up"}</Button>
          <Button variant="secondary" onClick={handleGoogle}>Continue with Google</Button>
          <button
            onClick={() => setMode(mode === "sign_in" ? "sign_up" : "sign_in")}
            style={{ border: "none", background: "none", color: "var(--color-text-secondary)", cursor: "pointer" }}
          >
            {mode === "sign_in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  )
}
