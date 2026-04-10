const ACCOUNT_COLOR_PAIRS = [
  { dot: "bg-blue-500", pill: "border-blue-200 bg-blue-50 text-blue-700" },
  { dot: "bg-emerald-500", pill: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { dot: "bg-amber-500", pill: "border-amber-200 bg-amber-50 text-amber-700" },
  { dot: "bg-rose-500", pill: "border-rose-200 bg-rose-50 text-rose-700" },
  { dot: "bg-violet-500", pill: "border-violet-200 bg-violet-50 text-violet-700" },
  { dot: "bg-cyan-500", pill: "border-cyan-200 bg-cyan-50 text-cyan-700" }
]

function hashValue(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

export function accountColorFor(accountEmail?: string | null) {
  const normalized = String(accountEmail || "").trim().toLowerCase()
  if (!normalized) return ACCOUNT_COLOR_PAIRS[0]
  return ACCOUNT_COLOR_PAIRS[hashValue(normalized) % ACCOUNT_COLOR_PAIRS.length]
}
