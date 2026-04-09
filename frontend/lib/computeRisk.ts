import { copy } from "@/lib/copy"
import type { EmailRecord, RiskLevel } from "@/lib/types"
import { getDomainFromEmail } from "@/lib/utils"

const HIGH_RISK_PATTERNS = [/click here/i, /verify account/i, /urgent action/i]

export interface RiskAssessment {
  level: RiskLevel
  reasons: string[]
  title: string
  body: string
}

export function computeRisk(email: EmailRecord): RiskAssessment {
  const reasons: string[] = []
  const senderDomain = getDomainFromEmail(email.senderEmail)
  const knownDomain = email.contactProfile.knownDomains.includes(senderDomain)
  const trustedSender = email.contactProfile.trusted || email.contactProfile.replied || knownDomain
  const spoofedDisplayName =
    typeof email.displayName === "string" &&
    email.displayName.trim().length > 0 &&
    email.displayName.trim().toLowerCase() !== email.senderName.trim().toLowerCase()
  const bodyText = `${email.subject} ${email.preview} ${email.body.join(" ")}`

  if (!knownDomain && HIGH_RISK_PATTERNS.some((pattern) => pattern.test(bodyText))) {
    reasons.push("Suspicious urgency language from an unknown sender.")
  }

  if (spoofedDisplayName) {
    reasons.push("Display name does not match sender identity.")
  }

  if (reasons.length > 0) {
    return {
      level: "high",
      reasons,
      title: copy.risk.highTitle,
      body: copy.risk.highBody
    }
  }

  if (!trustedSender && ((email.images?.some((image) => image.external) ?? false) || email.headers.bulk)) {
    return {
      level: "medium",
      reasons: ["Untrusted sender with tracking or bulk-mail signals."],
      title: copy.risk.mediumTitle,
      body: copy.risk.mediumBody
    }
  }

  if (email.headers.listUnsubscribe || email.firstTimeSender) {
    return {
      level: "low",
      reasons: ["Likely newsletter or first-time sender."],
      title: copy.risk.lowTitle,
      body: copy.risk.lowBody
    }
  }

  return {
    level: "safe",
    reasons: ["Trusted sender or previous reply history."],
    title: "",
    body: ""
  }
}
