import { Badge } from "../primitives"

export function PriorityBadge({ level }: { level: "high" | "medium" | "low" }) {
  const variant = level === "high" ? "danger" : level === "medium" ? "warning" : "info"
  return <Badge variant={variant}>{level}</Badge>
}
