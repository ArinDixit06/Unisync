import { getInitials, cn } from "@/lib/utils"

const avatarPalettes = [
  "bg-[hsl(12_48%_46%)]",
  "bg-[hsl(36_48%_46%)]",
  "bg-[hsl(68_48%_42%)]",
  "bg-[hsl(112_40%_42%)]",
  "bg-[hsl(156_46%_40%)]",
  "bg-[hsl(188_52%_42%)]",
  "bg-[hsl(214_52%_46%)]",
  "bg-[hsl(246_48%_52%)]",
  "bg-[hsl(284_42%_52%)]",
  "bg-[hsl(332_52%_48%)]"
] as const

function getAvatarPalette(seed: string) {
  const hash = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return avatarPalettes[hash % avatarPalettes.length]
}

/**
 * Props for the sender avatar component.
 */
export interface AvatarProps {
  name: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-11 w-11 text-sm" : "h-10 w-10 text-sm"

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        getAvatarPalette(name),
        sizeClass,
        className
      )}
    >
      {getInitials(name)}
    </span>
  )
}
