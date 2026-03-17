import { Switch, Input, Button } from "../components/primitives"

export function SettingsPage() {
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--type-2xl)", marginBottom: 24 }}>Settings</h1>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "var(--type-lg)" }}>Profile</h2>
        <Input label="Display Name" value="Student" onChange={() => {}} />
      </section>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "var(--type-lg)" }}>AI Preferences</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Switch checked={true} onChange={() => {}} />
          <span>Enable AI summaries</span>
        </div>
      </section>
      <section>
        <h2 style={{ fontSize: "var(--type-lg)" }}>Danger Zone</h2>
        <Button variant="danger">Delete Account</Button>
      </section>
    </div>
  )
}
