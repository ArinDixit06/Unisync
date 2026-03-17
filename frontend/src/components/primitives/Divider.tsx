import "./primitives.css"

export function Divider({ vertical = false }: { vertical?: boolean }) {
  return (
    <div
      className="divider"
      style={vertical ? { width: 1, height: "100%" } : { height: 1, width: "100%" }}
    />
  )
}
