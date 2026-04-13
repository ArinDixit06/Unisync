export function accountColorFor(accountEmail?: string | null) {
  void accountEmail
  return {
    dot: "bg-[var(--avatar-text)]",
    pill: "border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
  }
}
