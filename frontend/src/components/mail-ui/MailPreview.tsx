import { ArrowLeft, Paperclip, Reply, Forward, Archive, Trash2, MailOpen, X } from "lucide-react"
import { EmptyState } from "./EmptyState"
import { EmailViewer } from "./EmailViewer"
import { safeParseJsonArray } from "../../lib/json"
import { accountColorFor } from "../../lib/accountColors"

function normalizeRiskReasons(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  return []
}

export function MailPreview({
  email,
  onArchive,
  onDelete,
  onToggleRead,
  onReply,
  onForward,
  onConfirmEvent,
  onDismissEvent,
  onClose
}: {
  email: any
  onArchive: () => void
  onDelete: () => void
  onToggleRead: () => void
  onReply: () => void
  onForward: () => void
  onConfirmEvent: (eventId: string) => void
  onDismissEvent: (eventId: string) => void
  onClose?: () => void
}) {
  if (!email) {
    return (
      <div className="h-full p-6">
        <EmptyState
          title="Select an email"
          description="Choose a message from the list to see it here."
          shortcutHint="Tip: use J / K to navigate"
        />
      </div>
    )
  }

  const bullets = safeParseJsonArray(email.summary_bullets)
  const riskReasons = normalizeRiskReasons(email.risk_reasons)
  const events = email.suggested_events || []
  const accountColors = accountColorFor(email.account_email)
  const riskTone =
    email.risk_level === "high"
      ? {
          box: "border-rose-200 bg-rose-50 text-rose-700",
          title: "High risk",
          message: "This message looks risky. Verify the sender before replying, opening links, or downloading files."
        }
      : email.risk_level === "medium"
      ? {
          box: "border-amber-200 bg-amber-50 text-amber-700",
          title: "Medium risk",
          message: "This message has warning signs. Double-check the sender and any requested action."
        }
      : email.risk_level
      ? {
          box: "border-emerald-200 bg-emerald-50 text-emerald-700",
          title: "Low risk",
          message: "No major phishing indicators were detected, but normal caution still applies."
        }
      : null

  return (
    <article className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-200/70 bg-white px-4 py-3 lg:px-6">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-blue-300 hover:text-blue-700"
            aria-label="Back to inbox"
          >
            <ArrowLeft size={16} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onArchive}
          className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-blue-300 hover:text-blue-700"
          aria-label="Archive"
        >
          <Archive size={16} />
        </button>
        <button
          type="button"
          onClick={onToggleRead}
          className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-blue-300 hover:text-blue-700"
          aria-label={email.is_read ? "Mark unread" : "Mark read"}
        >
          <MailOpen size={16} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-rose-300 hover:text-rose-600"
          aria-label="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex items-start justify-between border-b border-gray-200/70 bg-white px-4 py-4 lg:px-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {email.subject || "(No subject)"}
          </h2>
          <p className="text-sm text-gray-500">
            {email.sender_name} &lt;{email.sender_email}&gt;
          </p>
          {email.account_email ? (
            <div className="mt-2">
              <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${accountColors.pill}`}>
                <span className={`h-2 w-2 rounded-full ${accountColors.dot}`} />
                Received in {email.account_email}
              </span>
            </div>
          ) : null}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 p-2 text-gray-500 lg:hidden"
            aria-label="Close preview"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200/70 bg-white px-4 py-3 text-xs text-gray-500 lg:px-6">
        <button
          type="button"
          onClick={onReply}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1"
        >
          <Reply size={12} /> Reply
        </button>
        <button
          type="button"
          onClick={onForward}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1"
        >
          <Forward size={12} /> Forward
        </button>
      </div>

      <div className="flex-1 w-full min-w-0 overflow-y-auto py-4">
        {events.length ? (
          <div className="mb-5 border-y border-blue-200 bg-blue-50/70 px-4 py-5 lg:px-6">
            <div className="mb-2 text-sm font-semibold text-blue-900">Event detected</div>
            {events.map((event: any) => (
              <div key={event.id} className="mb-4 last:mb-0">
                <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                <p className="text-xs text-gray-600">{event.start_datetime || event.starts_at}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onConfirmEvent(event.id)}
                    className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
                  >
                    Add to calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismissEvent(event.id)}
                    className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs text-gray-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {riskTone ? (
          <div className={`mb-4 border-y px-4 py-4 text-sm lg:px-6 ${riskTone.box}`}>
            <p className="font-semibold">{riskTone.title}</p>
            <p className="mt-1">{riskTone.message}</p>
            {riskReasons.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-4 text-xs">
                {riskReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {bullets.length ? (
          <div className="mb-5 border-y border-gray-200 bg-white px-4 py-4 text-sm text-gray-600 lg:px-6">
            <p className="mb-2 font-semibold text-gray-800">AI Summary</p>
            <ul className="list-disc space-y-1 pl-4">
              {bullets.map((bullet: string) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <EmailViewer email={email} />

        {(email.attachments || []).length ? (
          <div className="mt-6 px-4 lg:px-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500">
              <Paperclip size={12} /> Attachments
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {email.attachments.map((file: any) => (
                <div
                  key={file.id || file.name}
                  className="rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-600 shadow-sm"
                >
                  <div className="font-semibold text-gray-800">{file.name}</div>
                  <div className="text-[11px] text-gray-400">{file.size || "Unknown size"}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  )
}
