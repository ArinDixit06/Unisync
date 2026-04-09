import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeMailTime(date: string) {
  const value = new Date(date)
  const now = new Date()
  const sameDay = value.toDateString() === now.toDateString()

  if (sameDay) {
    return value.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    })
  }

  return value.toLocaleDateString([], {
    month: "short",
    day: "numeric"
  })
}

export function formatLongMailDate(date: string) {
  return new Date(date).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  })
}

export function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join("")
}

export function getDomainFromEmail(email: string) {
  return email.split("@")[1]?.toLowerCase() ?? ""
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}
