export interface LabelItem {
  id: string
  name: string
  color: string
}

export function LabelList({
  labels,
  activeLabelId,
  onSelect
}: {
  labels: LabelItem[]
  activeLabelId: string | null
  onSelect: (labelId: string | null) => void
}) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm ${
          activeLabelId === null
            ? "bg-blue-50 text-blue-800"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        All Labels
      </button>
      {labels.map((label) => (
        <button
          key={label.id}
          type="button"
          onClick={() => onSelect(label.id)}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm ${
            activeLabelId === label.id
              ? "bg-blue-50 text-blue-800"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>{label.name}</span>
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: label.color || "#0f766e" }}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  )
}
