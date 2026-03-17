import React from "react"
import clsx from "clsx"
import "./primitives.css"

export function Switch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      className={clsx("switch", { checked })}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    />
  )
}
