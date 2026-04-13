import { Search } from "lucide-react"

export function SearchBar({
  placeholder,
  value,
  onChange
}: {
  placeholder?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="relative flex w-full items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-200">
      <Search size={16} className="text-gray-400" />
      <input
        className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? "Search mail, sender or subject"}
        aria-label={placeholder ?? "Search mail, sender or subject"}
      />
      <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-400">
        /
      </span>
    </label>
  )
}
