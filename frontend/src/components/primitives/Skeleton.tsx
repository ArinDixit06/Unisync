import "./primitives.css"

export function Skeleton({ width = "100%", height = 12 }: { width?: string | number; height?: number }) {
  return <div className="skeleton" style={{ width, height }} />
}
