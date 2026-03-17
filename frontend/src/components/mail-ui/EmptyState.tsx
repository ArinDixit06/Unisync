import { Mail } from "lucide-react"

export function EmptyState({
  title,
  description,
  shortcutHint
}: {
  title: string
  description?: string
  shortcutHint?: string
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200/70 bg-white/70 p-8 text-center shadow-soft">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
        <Mail size={20} />
      </div>
      <div>
        <p className="text-lg font-semibold text-gray-900">{title}</p>
        {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
      </div>
      {shortcutHint ? (
        <div className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">
          {shortcutHint}
        </div>
      ) : null}
    </div>
  )
}
