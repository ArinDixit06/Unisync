import React, { useState } from "react"
import "./primitives.css"

export function Dropdown({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="dropdown">
      <span onClick={() => setOpen(!open)}>{trigger}</span>
      {open ? <div className="dropdown-menu">{children}</div> : null}
    </div>
  )
}
