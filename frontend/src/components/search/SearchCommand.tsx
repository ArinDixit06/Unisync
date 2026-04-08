import { useEffect, useState } from "react"
import { Modal, Input } from "../primitives"
import { apiFetch } from "../../lib/api"
import { EmailRow } from "../inbox"
import { useUIStore } from "../../stores/uiStore"

export function SearchCommand({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { setState } = useUIStore()

  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
      setError("")
      setIsLoading(false)
    }
  }, [open])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setError("")
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError("")
    let cancelled = false
    const timeout = setTimeout(async () => {
      try {
        const res = await apiFetch(`/search?q=${encodeURIComponent(trimmed)}`)
        if (cancelled) return
        setResults(res.emails || [])
      } catch (err) {
        if (cancelled) return
        setResults([])
        setError(err instanceof Error ? err.message : "Search failed")
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [query])

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: "grid", gap: 12 }}>
        <Input label="Search" value={query} onChange={(e) => setQuery(e.target.value)} error={Boolean(error)} />
        {error && (
          <div style={{ fontSize: "var(--type-xs)", color: "var(--color-danger)" }} aria-live="polite">
            {error}
          </div>
        )}
        {!error && isLoading && (
          <div style={{ fontSize: "var(--type-xs)", color: "var(--color-text-tertiary)" }} aria-live="polite">
            Searching...
          </div>
        )}
        <div style={{ maxHeight: 360, overflow: "auto" }}>
          {!error && !isLoading && !results.length && query.trim() && (
            <div style={{ fontSize: "var(--type-xs)", color: "var(--color-text-tertiary)" }}>
              No matches found.
            </div>
          )}
          {results.map((email) => (
            <EmailRow
              key={email.id}
              email={email}
              selected={false}
              onSelect={() => {
                setState({ selectedEmailId: email.id })
                onClose()
              }}
              onArchive={() => {}}
              onDelete={() => {}}
              onToggleRead={() => {}}
            />
          ))}
        </div>
      </div>
    </Modal>
  )
}
