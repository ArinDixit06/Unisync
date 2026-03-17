import { useEffect, useState } from "react"
import { Modal, Input } from "../primitives"
import { apiFetch } from "../../lib/api"
import { EmailRow } from "../inbox"
import { useUIStore } from "../../stores/uiStore"

export function SearchCommand({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const { setState } = useUIStore()

  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timeout = setTimeout(async () => {
      const res = await apiFetch(`/search?q=${encodeURIComponent(query)}`)
      setResults(res.emails || [])
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: "grid", gap: 12 }}>
        <Input label="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div style={{ maxHeight: 360, overflow: "auto" }}>
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
