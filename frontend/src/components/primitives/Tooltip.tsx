import React, { useState } from "react"
import "./primitives.css"

export function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <span className={open ? "tooltip show" : "tooltip"}>{content}</span>
    </span>
  )
}
