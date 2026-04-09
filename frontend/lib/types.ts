export type MailTag = "newsletter" | "promotional" | "transactional" | "high-risk"

export type RiskLevel = "safe" | "low" | "medium" | "high"

export interface EmailHeaders {
  from: string
  listUnsubscribe?: string
  xMailer?: string
  bulk?: boolean
}

export interface EmailLink {
  label: string
  href: string
}

export interface EmailImage {
  alt: string
  src: string
  external: boolean
}

export interface ContactProfile {
  trusted: boolean
  replied: boolean
  knownDomains: string[]
}

export interface EmailRecord {
  id: string
  senderName: string
  senderEmail: string
  displayName?: string
  subject: string
  preview: string
  greeting: string
  body: string[]
  orderedIntro?: string[]
  links: EmailLink[]
  images?: EmailImage[]
  receivedAt: string
  read: boolean
  starred: boolean
  snoozed: boolean
  archived: boolean
  folder: "inbox" | "starred" | "snoozed" | "sent" | "drafts" | "trash"
  tag: MailTag
  headers: EmailHeaders
  contactProfile: ContactProfile
  firstTimeSender: boolean
}
