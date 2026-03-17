import clsx from "clsx"
import "./primitives.css"

export function Checkbox({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      className={clsx("checkbox", { checked })}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      {checked ? "✓" : ""}
    </button>
  )
}
