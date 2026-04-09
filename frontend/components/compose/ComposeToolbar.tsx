"use client"

import { Bold, Italic, Link2, List } from "lucide-react"
import { copy } from "@/lib/copy"

const tools = [
  { id: "bold", icon: Bold, label: copy.compose.toolbar.bold },
  { id: "italic", icon: Italic, label: copy.compose.toolbar.italic },
  { id: "link", icon: Link2, label: copy.compose.toolbar.link },
  { id: "bullets", icon: List, label: copy.compose.toolbar.bullets }
]

/**
 * Props for the compose formatting toolbar.
 */
export function ComposeToolbar() {
  return (
    <div className="flex items-center gap-2 border-t border-border px-4 py-3 dark:border-white/10">
      {tools.map((tool) => (
        <button
          key={tool.id}
          aria-label={tool.label}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary dark:hover:bg-white/10 dark:hover:text-white"
        >
          <tool.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}
