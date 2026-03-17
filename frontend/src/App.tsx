import { Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from "react"
import { supabase, supabaseConfigured } from "./lib/supabase"
import { useAuthStore } from "./stores/authStore"
import { Dashboard } from "./pages/Dashboard"
import { SettingsPage } from "./pages/SettingsPage"
import { AuthPage } from "./pages/AuthPage"

export default function App() {
  const { user, setUser, setAccessToken, isLoadingAuth, setLoading } = useAuthStore()

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      const session = data.session
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || "" })
        setAccessToken(session.access_token)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || "" })
        setAccessToken(session.access_token)
      } else {
        setUser(null)
        setAccessToken(null)
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [setUser, setAccessToken, setLoading])

  if (isLoadingAuth) {
    return null
  }

  if (!supabaseConfigured) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 32 }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-display)", marginBottom: 12 }}>Configure Supabase</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your frontend env file.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <AuthPage />} />
      <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" />} />
    </Routes>
  )
}
