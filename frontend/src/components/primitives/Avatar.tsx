import clsx from "clsx"
import "./primitives.css"

interface AvatarProps {
  name: string
  size?: "xs" | "sm" | "md" | "lg"
  src?: string
  online?: boolean
}

const sizes: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48
}

export function Avatar({ name, size = "md", src, online }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const dimension = sizes[size]
  return (
    <div
      className={clsx("avatar", { online })}
      style={{ width: dimension, height: dimension, fontSize: dimension / 2.5 }}
    >
      {src ? <img src={src} alt={name} style={{ width: "100%", height: "100%", borderRadius: "50%" }} /> : initials}
    </div>
  )
}
