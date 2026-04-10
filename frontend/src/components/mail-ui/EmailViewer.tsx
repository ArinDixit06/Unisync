import DOMPurify from "dompurify"
import { useMemo } from "react"

type GmailPayload = {
  mimeType?: string
  body?: { data?: string }
  parts?: GmailPayload[]
}

const decodeBase64 = (data: string) => {
  try {
    let normalized = data.replace(/-/g, "+").replace(/_/g, "/")
    const pad = normalized.length % 4
    if (pad) {
      normalized = normalized.padEnd(normalized.length + (4 - pad), "=")
    }
    const binary = atob(normalized)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    return new TextDecoder("utf-8").decode(bytes)
  } catch {
    return ""
  }
}

const extractHtmlFromPayload = (payload?: GmailPayload | null): string | null => {
  if (!payload) return null
  const bodyData = payload.body?.data
  if (bodyData && payload.mimeType?.includes("text/html")) {
    return decodeBase64(bodyData)
  }
  if (bodyData && !payload.mimeType) {
    return decodeBase64(bodyData)
  }
  for (const part of payload.parts || []) {
    if (part.mimeType?.includes("text/html") && part.body?.data) {
      return decodeBase64(part.body.data)
    }
  }
  for (const part of payload.parts || []) {
    const nested = extractHtmlFromPayload(part)
    if (nested) return nested
  }
  return null
}

const extractPlainFromPayload = (payload?: GmailPayload | null): string | null => {
  if (!payload) return null
  const bodyData = payload.body?.data
  if (bodyData && payload.mimeType?.includes("text/plain")) {
    return decodeBase64(bodyData)
  }
  for (const part of payload.parts || []) {
    if (part.mimeType?.includes("text/plain") && part.body?.data) {
      return decodeBase64(part.body.data)
    }
  }
  for (const part of payload.parts || []) {
    const nested = extractPlainFromPayload(part)
    if (nested) return nested
  }
  return null
}

const sanitizeEmailHtml = (html: string) => {
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_DATA_URI_TAGS: ["img"],
    ADD_TAGS: ["style", "table", "thead", "tbody", "tfoot", "tr", "td", "th"],
    ADD_ATTR: [
      "target",
      "rel",
      "style",
      "class",
      "align",
      "valign",
      "bgcolor",
      "width",
      "height",
      "border",
      "cellpadding",
      "cellspacing",
      "colspan",
      "rowspan",
      "srcset",
      "src"
    ]
  })

  const doc = new DOMParser().parseFromString(clean, "text/html")
  doc.querySelectorAll("a").forEach((anchor) => {
    anchor.setAttribute("target", "_blank")
    anchor.setAttribute("rel", "noopener noreferrer")
  })
  return doc.body.innerHTML
}

export function EmailViewer({ email }: { email: any }) {
  const { html, plain } = useMemo(() => {
    const htmlFromBody = email?.body_html || email?.body?.content || null
    const htmlFromPayload =
      extractHtmlFromPayload(email?.payload) || extractHtmlFromPayload(email?.message?.payload)
    const decodedHtml = htmlFromBody || htmlFromPayload || null

    const plainFromPayload =
      extractPlainFromPayload(email?.payload) || extractPlainFromPayload(email?.message?.payload)
    const plainFallback = email?.body_text || email?.preview_snippet || ""

    return {
      html: decodedHtml ? sanitizeEmailHtml(decodedHtml) : null,
      plain: plainFromPayload || plainFallback
    }
  }, [email])

  if (!html) {
    return (
      <div className="w-full px-4 py-4 lg:px-6">
        <pre className="whitespace-pre-wrap text-sm text-gray-700">{plain}</pre>
      </div>
    )
  }

  return (
    <div className="email-html w-full px-4 py-4 lg:px-6">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
