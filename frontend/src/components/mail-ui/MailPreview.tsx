import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Paperclip, Reply, Forward, Archive, Trash2, MailOpen, X, Sparkles, Send, ChevronRight } from "lucide-react"
import { EmptyState } from "./EmptyState"
import { EmailViewer } from "./EmailViewer"
import { safeParseJsonArray } from "../../lib/json"
import { accountColorFor } from "../../lib/accountColors"
import { apiFetch } from "../../lib/api"

function normalizeRiskReasons(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  return []
}

export function MailPreview({
  email,
  onArchive,
  onDelete,
  onToggleRead,
  onToggleStar,
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
  onToggleStar: () => void
  onReply: () => void
  onForward: () => void
  onConfirmEvent: (eventId: string) => void
  onDismissEvent: (eventId: string) => void
  onClose?: () => void
}) {
  const [insightOpen, setInsightOpen] = useState(false)

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
          box: "border-[var(--tag-highrisk-text)] bg-[var(--tag-highrisk-bg)] text-[var(--tag-highrisk-text)]",
          title: "High risk",
          message: "This message looks risky. Verify the sender before replying, opening links, or downloading files."
        }
      : email.risk_level === "medium"
      ? {
          box: "border-[var(--tag-promotional-text)] bg-[var(--tag-promotional-bg)] text-[var(--tag-promotional-text)]",
          title: "Medium risk",
          message: "This message has warning signs. Double-check the sender and any requested action."
        }
      : email.risk_level
      ? {
          box: "border-[var(--tag-transactional-text)] bg-[var(--tag-transactional-bg)] text-[var(--tag-transactional-text)]",
          title: "Low risk",
          message: "No major phishing indicators were detected, but normal caution still applies."
        }
      : null

  return (
    <article className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden bg-[var(--bg-main)]">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3 lg:px-6">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            aria-label="Back to inbox"
          >
            <ArrowLeft size={16} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onArchive}
          className="rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
          aria-label="Archive"
        >
          <Archive size={16} />
        </button>
        <button
          type="button"
          onClick={onToggleRead}
          className="rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
          aria-label={email.is_read ? "Mark unread" : "Mark read"}
        >
          <MailOpen size={16} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] transition hover:text-[var(--tag-highrisk-text)]"
          aria-label="Delete"
        >
          <Trash2 size={16} />
        </button>

        {/* ── AI Insight button — left of star ── */}
        <button
          id="ai-insight-btn"
          type="button"
          onClick={() => setInsightOpen(true)}
          className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-primary)] bg-[var(--accent-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-primary)] transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          aria-label="Open AI insights"
          title="Ask AI about this email"
        >
          <Sparkles size={13} className="shrink-0" />
          AI Insight
        </button>

        {/* ── Star button ── */}
        <button
          type="button"
          onClick={onToggleStar}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-none border-0 bg-transparent p-0 text-[20px] leading-none text-[var(--text-muted)] transition hover:brightness-110 active:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          aria-label={email.is_starred ? "Unstar" : "Star"}
          aria-pressed={Boolean(email.is_starred)}
          title={email.is_starred ? "Unstar" : "Star"}
        >
          <span aria-hidden="true" className={email.is_starred ? "text-[var(--tag-promotional-text)]" : "text-[var(--text-muted)]"}>
            {email.is_starred ? "★" : "☆"}
          </span>
        </button>
      </div>

      {/* ── Subject / sender ── */}
      <div className="flex items-start justify-between border-b border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-4 lg:px-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {email.subject || "(No subject)"}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
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
            className="rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] lg:hidden"
            aria-label="Close preview"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* ── Reply / Forward ── */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3 text-xs text-[var(--text-secondary)] lg:px-6">
        <button
          type="button"
          onClick={onReply}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-hover)] px-3 py-1 text-[var(--text-primary)]"
        >
          <Reply size={12} /> Reply
        </button>
        <button
          type="button"
          onClick={onForward}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-hover)] px-3 py-1 text-[var(--text-primary)]"
        >
          <Forward size={12} /> Forward
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 w-full min-w-0 overflow-y-auto py-4 bg-[var(--bg-main)]">
        {events.length ? (
          <div className="mb-5 border-y border-[var(--accent-primary)] bg-[var(--accent-bg)] px-4 py-5 lg:px-6">
            <div className="mb-2 text-sm font-semibold text-[var(--accent-primary)]">Event detected</div>
            {events.map((event: any) => (
              <div key={event.id} className="mb-4 last:mb-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{event.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">{event.start_datetime || event.starts_at}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onConfirmEvent(event.id)}
                    className="rounded-full bg-[var(--accent-primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
                  >
                    Add to calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismissEvent(event.id)}
                    className="rounded-full border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-1.5 text-xs text-[var(--text-secondary)]"
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
          <div className="mb-5 border-y border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-4 text-sm text-[var(--text-secondary)] lg:px-6">
            <p className="mb-2 font-semibold text-[var(--text-primary)]">AI Summary</p>
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
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <Paperclip size={12} /> Attachments
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {email.attachments.map((file: any) => (
                <div
                  key={file.id || file.name}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-3 text-xs text-[var(--text-secondary)] shadow-sm"
                >
                  <div className="font-semibold text-[var(--text-primary)]">{file.name}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{file.size || "Unknown size"}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* ── AI Insight Modal ── */}
      {insightOpen ? (
        <AiInsightModal email={email} onClose={() => setInsightOpen(false)} />
      ) : null}
    </article>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Insight Modal
// ─────────────────────────────────────────────────────────────────────────────

type InsightEntry = {
  question: string
  answer: string
  key_points: string[]
  suggested_action: string | null
}

const QUICK_QUESTIONS = [
  "What action do I need to take?",
  "Is this email urgent?",
  "Summarise in one sentence",
  "Any deadlines mentioned?"
]

function AiInsightModal({ email, onClose }: { email: any; onClose: () => void }) {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<InsightEntry[]>([])
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [history, loading])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const ask = async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed || loading) return
    setQuestion("")
    setLoading(true)
    try {
      const result = await apiFetch(`/emails/${email.id}/insights`, {
        method: "POST",
        body: JSON.stringify({ question: trimmed })
      })
      setHistory((prev) => [...prev, { question: trimmed, ...result }])
    } catch {
      setHistory((prev) => [
        ...prev,
        {
          question: trimmed,
          answer: "Could not get AI insights right now. Please try again.",
          key_points: [],
          suggested_action: null
        }
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <>
      {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-[var(--overlay-backdrop)] backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />

      {/* Slide-up panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI Insight"
        className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-2xl flex-col rounded-t-3xl bg-[var(--bg-sidebar)] shadow-2xl ring-1 ring-[var(--border-color)]"
        style={{ maxHeight: "78vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-primary)]">
              <Sparkles size={14} className="text-white" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">AI Insight</p>
              <p className="mt-0.5 text-[11px] leading-none text-[var(--text-muted)]">Powered by Gemini</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border-color)] p-1.5 text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            aria-label="Close AI insight"
          >
            <X size={14} />
          </button>
        </div>

        {/* Context chip */}
        <div className="border-b border-[var(--border-color)] px-5 py-2.5">
          <span className="inline-flex max-w-full items-center gap-2 truncate rounded-full bg-[var(--bg-hover)] px-3 py-1 text-xs text-[var(--text-secondary)]">
            <ChevronRight size={11} className="shrink-0 text-[var(--text-muted)]" />
            <span className="truncate font-medium text-[var(--text-primary)]">{email.subject || "(No subject)"}</span>
            <span className="shrink-0 text-[var(--text-muted)]">· {email.sender_name || email.sender_email}</span>
          </span>
        </div>

        {/* Conversation */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {history.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-bg)]">
                <Sparkles size={22} className="text-[var(--accent-primary)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Ask anything about this email</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Get instant AI-powered answers, key points, and action suggestions.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => ask(q)}
                    className="rounded-full border border-[var(--accent-primary)] bg-[var(--accent-bg)] px-3 py-1.5 text-xs font-medium text-[var(--accent-primary)] transition hover:brightness-95"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {history.map((item, idx) => (
            <div key={idx} className="space-y-3">
              {/* User bubble */}
              <div className="flex justify-end">
                <span className="max-w-[82%] rounded-2xl rounded-tr-sm bg-[var(--accent-primary)] px-4 py-2.5 text-xs font-medium text-white shadow-sm">
                  {item.question}
                </span>
              </div>

              {/* AI answer card */}
              <div className="rounded-2xl rounded-tl-sm border border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-3.5 shadow-sm">
                <p className="text-xs leading-relaxed text-[var(--text-primary)]">{item.answer}</p>

                {item.key_points.length > 0 ? (
                  <div className="mt-3 space-y-1.5">
                    {item.key_points.map((point, i) => (
                      <div key={i} className="flex gap-2 text-xs text-[var(--text-secondary)]">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--accent-bg)] text-[10px] font-bold text-[var(--accent-primary)]">
                          {i + 1}
                        </span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {item.suggested_action ? (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--accent-primary)] bg-[var(--accent-bg)] px-3 py-2">
                    <ChevronRight size={12} className="mt-0.5 shrink-0 text-[var(--accent-primary)]" />
                    <p className="text-xs text-[var(--accent-primary)]">
                      <span className="font-semibold">Suggested: </span>
                      {item.suggested_action}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-3 shadow-sm">
                <span className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-primary)]" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-primary)]" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-primary)]" style={{ animationDelay: "300ms" }} />
                </span>
                <span className="text-xs text-[var(--text-muted)]">Gemini is thinking…</span>
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3">
          <form
            onSubmit={(e) => { e.preventDefault(); void ask(question) }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  void ask(question)
                }
              }}
              placeholder="Ask a question about this email…"
              className="flex-1 resize-none rounded-2xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-bg)]"
              style={{ maxHeight: 96 }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!question.trim() || loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--send-btn-bg)] text-[var(--send-btn-text)] shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send question"
            >
              <Send size={14} />
            </button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-[var(--text-muted)]">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  )
}
