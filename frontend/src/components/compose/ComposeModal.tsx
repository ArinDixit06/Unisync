import { useEffect, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import { useQueryClient } from "@tanstack/react-query"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import { Button, Input } from "../primitives"
import { useAuthStore } from "../../stores/authStore"
import { apiFetch } from "../../lib/api"
import "./compose.css"

export function ComposeModal({ onClose }: { onClose: () => void }) {
  const { linkedAccounts } = useAuthStore()
  const queryClient = useQueryClient()
  const [accountId, setAccountId] = useState("")
  const [to, setTo] = useState("")
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [subject, setSubject] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const sendTimeoutRef = useRef<number | null>(null)
  const countdownRef = useRef<number | null>(null)
  const editor = useEditor({
    extensions: [StarterKit, Underline, Link],
    content: ""
  })

  useEffect(() => {
    if (!linkedAccounts.length) {
      setAccountId("")
      return
    }
    setAccountId((current) => current && linkedAccounts.some((account) => account.id === current) ? current : linkedAccounts[0].id)
  }, [linkedAccounts])

  const clearTimers = () => {
    if (sendTimeoutRef.current) window.clearTimeout(sendTimeoutRef.current)
    if (countdownRef.current) window.clearInterval(countdownRef.current)
    sendTimeoutRef.current = null
    countdownRef.current = null
  }

  useEffect(() => {
    return () => clearTimers()
  }, [])

  const buildAttachmentPayload = async () => {
    return Promise.all(
      attachments.map(async (file) => {
        const buffer = await file.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        let binary = ""
        bytes.forEach((b) => (binary += String.fromCharCode(b)))
        const base64 = btoa(binary)
        return {
          filename: file.name,
          content_type: file.type || "application/octet-stream",
          content_base64: base64
        }
      })
    )
  }

  const parseRecipients = (value: string) =>
    value
      .split(/[,;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const match = item.match(/<([^>]+)>/)
        return match ? match[1].trim() : item
      })
      .filter((item) => item.includes("@"))

  const sendNow = async () => {
    if (!accountId) {
      alert("Choose which connected mailbox you want to send from.")
      setIsSending(false)
      setCountdown(5)
      return
    }
    try {
      const html = editor?.getHTML() || ""
      const attachmentPayload = await buildAttachmentPayload()
      const toList = parseRecipients(to)
      const ccList = parseRecipients(cc)
      const bccList = parseRecipients(bcc)
      if (!toList.length && !ccList.length && !bccList.length) {
        alert("Please add at least one recipient.")
        setIsSending(false)
        setCountdown(5)
        return
      }
      await apiFetch("/compose/send", {
        method: "POST",
        body: JSON.stringify({
          account_id: accountId,
          to: toList,
          cc: ccList,
          bcc: bccList,
          subject,
          body_html: html,
          attachments: attachmentPayload
        })
      })
      queryClient.invalidateQueries({ queryKey: ["emails"] })
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send email."
      alert(message)
      setIsSending(false)
      setCountdown(5)
    }
  }

  const handleSend = () => {
    if (isSending) return
    setIsSending(true)
    setCountdown(5)
    countdownRef.current = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    sendTimeoutRef.current = window.setTimeout(async () => {
      clearTimers()
      await sendNow()
    }, 5000)
  }

  const handleUndo = () => {
    clearTimers()
    setIsSending(false)
    setCountdown(5)
  }

  return (
    <div className="compose-modal">
      <div className="compose-header">
        <div className="compose-title">New Message</div>
        <button className="compose-close" onClick={onClose} type="button">Close</button>
      </div>
      <div className="compose-body">
        <label className="primitive-field">
          <span className="primitive-label">From</span>
          <select
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            className="primitive-input"
          >
            {linkedAccounts.length ? (
              linkedAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {(account.display_name || account.email_address || account.provider || "Account")} {account.email_address ? `(${account.email_address})` : ""}
                </option>
              ))
            ) : (
              <option value="">No connected account</option>
            )}
          </select>
        </label>
        <Input label="To" value={to} onChange={(e) => setTo(e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="sm" variant="ghost" onClick={() => setShowCc((prev) => !prev)}>CC</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowBcc((prev) => !prev)}>BCC</Button>
        </div>
        {showCc && <Input label="CC" value={cc} onChange={(e) => setCc(e.target.value)} />}
        {showBcc && <Input label="BCC" value={bcc} onChange={(e) => setBcc(e.target.value)} />}
        <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <div className="rich-editor">
          <EditorContent editor={editor} />
        </div>
        <input
          type="file"
          multiple
          onChange={(e) => setAttachments(Array.from(e.target.files || []))}
        />
        <div className="attachment-list">
          {attachments.map((file) => (
            <div key={file.name} className="attachment-chip">
              <span>{file.name}</span>
              <button
                className="attachment-remove"
                onClick={() => setAttachments((prev) => prev.filter((item) => item !== file))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="compose-footer">
        <div style={{ fontSize: "var(--type-xs)", color: "var(--color-text-tertiary)" }}>
          {isSending ? `Sending in ${countdown}s...` : "Undo send: 5s"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isSending && <Button variant="ghost" onClick={handleUndo}>Undo</Button>}
          <Button onClick={handleSend} disabled={isSending}>Send</Button>
        </div>
      </div>
    </div>
  )
}
