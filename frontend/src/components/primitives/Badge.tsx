import clsx from "clsx"
import "./primitives.css"

export function Badge({ variant = "default", children }: { variant?: "default" | "success" | "warning" | "danger" | "info"; children: React.ReactNode }) {
  return <span className={clsx("badge", variant)}>{children}</span>
}
