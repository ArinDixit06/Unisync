import type { EmailRecord } from "@/lib/types"

export const mockEmails: EmailRecord[] = [
  {
    id: "mail-01",
    senderName: "Maya Patel",
    senderEmail: "maya@northstar.design",
    subject: "Creative review notes for the UniSync launch page",
    preview: "I annotated the hero, pricing narrative, and the motion timing for the product reveal.",
    greeting: "Hi Diwanshu,",
    body: [
      "The new launch page is strong, but the hero can feel more editorial and less dashboard-first.",
      "I left notes around the sequence, the premium cues in the background texture, and how the AI layer should show up without visual noise.",
      "If you want, I can send a second pass focused only on mobile hierarchy."
    ],
    orderedIntro: ["Hero pacing", "Pricing narrative", "Mobile hierarchy"],
    links: [{ label: "Open Figma review", href: "https://example.com/launch-review" }],
    receivedAt: "2026-04-09T08:10:00.000Z",
    read: false,
    starred: true,
    snoozed: false,
    archived: false,
    folder: "inbox",
    tag: "transactional",
    headers: { from: "Maya Patel <maya@northstar.design>" },
    contactProfile: { trusted: true, replied: true, knownDomains: ["northstar.design"] },
    firstTimeSender: false
  },
  {
    id: "mail-02",
    senderName: "Stripe Billing",
    senderEmail: "receipts@stripe.com",
    subject: "Your April infrastructure invoice is ready",
    preview: "Your payment for cloud and queue processing has been posted successfully.",
    greeting: "Hello,",
    body: [
      "Your monthly infrastructure invoice has been paid in full.",
      "The attached receipt includes itemized usage for email parsing, inference jobs, and storage."
    ],
    links: [{ label: "View receipt", href: "https://example.com/receipt" }],
    receivedAt: "2026-04-09T05:25:00.000Z",
    read: true,
    starred: false,
    snoozed: false,
    archived: false,
    folder: "inbox",
    tag: "transactional",
    headers: { from: "Stripe Billing <receipts@stripe.com>" },
    contactProfile: { trusted: true, replied: false, knownDomains: ["stripe.com"] },
    firstTimeSender: false
  },
  {
    id: "mail-03",
    senderName: "Superlist Weekly",
    senderEmail: "weekly@superlist.news",
    subject: "Seven workflow ideas from high-performing product teams",
    preview: "This week’s issue covers async planning, launch rituals, and attention management.",
    greeting: "Good morning,",
    body: [
      "Here is your curated digest for product operators and design leaders.",
      "We focused this edition on calmer systems, tighter launch loops, and cleaner review rituals."
    ],
    links: [{ label: "Read the full issue", href: "https://example.com/newsletter" }],
    receivedAt: "2026-04-08T20:15:00.000Z",
    read: false,
    starred: false,
    snoozed: false,
    archived: false,
    folder: "inbox",
    tag: "newsletter",
    headers: {
      from: "Superlist Weekly <weekly@superlist.news>",
      listUnsubscribe: "<mailto:unsubscribe@superlist.news>"
    },
    contactProfile: { trusted: false, replied: false, knownDomains: [] },
    firstTimeSender: false
  },
  {
    id: "mail-04",
    senderName: "Mercury Rewards",
    senderEmail: "offers@mercury-perks.co",
    subject: "Unlock partner credits for your next team offsite",
    preview: "Claim private hotel and travel bundles curated for startup operators.",
    greeting: "Hi there,",
    body: [
      "We put together a set of travel offers for founding teams and executive offsites.",
      "These expire next Friday and are available only through our partner network."
    ],
    links: [{ label: "Browse the offers", href: "https://example.com/offers" }],
    receivedAt: "2026-04-08T17:50:00.000Z",
    read: true,
    starred: false,
    snoozed: false,
    archived: false,
    folder: "inbox",
    tag: "promotional",
    headers: {
      from: "Mercury Rewards <offers@mercury-perks.co>",
      xMailer: "CampaignFlow",
      bulk: true
    },
    images: [{ alt: "Travel collage", src: "https://images.example.com/travel.png", external: true }],
    contactProfile: { trusted: false, replied: false, knownDomains: [] },
    firstTimeSender: true
  },
  {
    id: "mail-05",
    senderName: "Notion Security",
    senderEmail: "no-reply@notion.so",
    displayName: "Notion Security Team",
    subject: "Verify account access on your new device",
    preview: "Please verify account access from a new device to keep your workspace secure.",
    greeting: "Attention required,",
    body: [
      "We noticed a sign-in attempt from a new device.",
      "Click here to verify account access and avoid service interruption."
    ],
    links: [{ label: "Verify account", href: "https://example.com/verify" }],
    receivedAt: "2026-04-08T16:32:00.000Z",
    read: false,
    starred: false,
    snoozed: false,
    archived: false,
    folder: "inbox",
    tag: "high-risk",
    headers: { from: "Notion Security Team <no-reply@notion.so>" },
    contactProfile: { trusted: false, replied: false, knownDomains: [] },
    firstTimeSender: true
  },
  {
    id: "mail-06",
    senderName: "Aria Chen",
    senderEmail: "aria@ridgecap.com",
    subject: "Updated investment memo after today’s call",
    preview: "Sharing the cleaner narrative and the diligence tracker we discussed.",
    greeting: "Hi Diwanshu,",
    body: [
      "Thanks again for the walkthrough today.",
      "I tightened the memo around retention, monetization layers, and the AI posture in the workflow.",
      "Happy to keep the conversation moving next week."
    ],
    links: [{ label: "Open memo", href: "https://example.com/memo" }],
    receivedAt: "2026-04-08T12:04:00.000Z",
    read: false,
    starred: true,
    snoozed: false,
    archived: false,
    folder: "starred",
    tag: "transactional",
    headers: { from: "Aria Chen <aria@ridgecap.com>" },
    contactProfile: { trusted: true, replied: true, knownDomains: ["ridgecap.com"] },
    firstTimeSender: false
  },
  {
    id: "mail-07",
    senderName: "Nova Travel Desk",
    senderEmail: "updates@nova.travel",
    subject: "Your Bengaluru to Singapore itinerary has changed",
    preview: "Flight SQ503 now departs 45 minutes later. Review the revised boarding window.",
    greeting: "Hello Diwanshu,",
    body: [
      "Your itinerary has been updated due to a carrier schedule adjustment.",
      "Please review the new boarding time and seat assignment before departure."
    ],
    links: [{ label: "Manage itinerary", href: "https://example.com/itinerary" }],
    receivedAt: "2026-04-07T21:40:00.000Z",
    read: true,
    starred: false,
    snoozed: true,
    archived: false,
    folder: "snoozed",
    tag: "transactional",
    headers: { from: "Nova Travel Desk <updates@nova.travel>" },
    contactProfile: { trusted: true, replied: false, knownDomains: ["nova.travel"] },
    firstTimeSender: false
  },
  {
    id: "mail-08",
    senderName: "Design Systems Digest",
    senderEmail: "hello@dsdigest.com",
    subject: "What premium product teams changed in their component libraries this quarter",
    preview: "System patterns, token debt, and why fewer primitives often ship faster.",
    greeting: "Hi,",
    body: [
      "We compiled design system changes across several notable product teams this quarter.",
      "A recurring theme: stronger motion rules, tighter editorial typography, and fewer component variants."
    ],
    links: [{ label: "Read digest", href: "https://example.com/digest" }],
    receivedAt: "2026-04-07T14:05:00.000Z",
    read: true,
    starred: false,
    snoozed: false,
    archived: false,
    folder: "inbox",
    tag: "newsletter",
    headers: {
      from: "Design Systems Digest <hello@dsdigest.com>",
      listUnsubscribe: "<mailto:bye@dsdigest.com>"
    },
    contactProfile: { trusted: false, replied: false, knownDomains: [] },
    firstTimeSender: true
  },
  {
    id: "mail-09",
    senderName: "Dropbox Sign",
    senderEmail: "noreply@dropboxsign.com",
    subject: "Signature completed: contractor NDA",
    preview: "All parties have signed the NDA. A completed PDF is available for download.",
    greeting: "Hello,",
    body: [
      "The requested signature workflow has been completed.",
      "You can download the finalized document and audit trail from the secure workspace."
    ],
    links: [{ label: "Download signed PDF", href: "https://example.com/document" }],
    receivedAt: "2026-04-07T09:18:00.000Z",
    read: false,
    starred: false,
    snoozed: false,
    archived: false,
    folder: "inbox",
    tag: "transactional",
    headers: { from: "Dropbox Sign <noreply@dropboxsign.com>" },
    contactProfile: { trusted: true, replied: false, knownDomains: ["dropboxsign.com"] },
    firstTimeSender: false
  },
  {
    id: "mail-10",
    senderName: "Apple ID",
    senderEmail: "security@appleid-check.com",
    displayName: "Apple Support",
    subject: "Urgent action required for your billing profile",
    preview: "Your payment method has been suspended. Click here to prevent account lock.",
    greeting: "Dear customer,",
    body: [
      "Urgent action is required to keep your account active.",
      "Click here to confirm your payment method and restore access immediately."
    ],
    links: [{ label: "Restore access", href: "https://example.com/apple-warning" }],
    receivedAt: "2026-04-06T19:12:00.000Z",
    read: false,
    starred: false,
    snoozed: false,
    archived: false,
    folder: "inbox",
    tag: "high-risk",
    headers: { from: "Apple Support <security@appleid-check.com>" },
    contactProfile: { trusted: false, replied: false, knownDomains: [] },
    firstTimeSender: true
  },
  {
    id: "mail-11",
    senderName: "Linear",
    senderEmail: "updates@linear.app",
    subject: "Issue UNI-42 moved to ready for review",
    preview: "The onboarding accessibility pass is ready for your approval.",
    greeting: "Hello,",
    body: [
      "Issue UNI-42 has moved to ready for review.",
      "The latest branch includes keyboard navigation, stronger focus states, and screen-reader announcements."
    ],
    links: [{ label: "Open issue", href: "https://example.com/issue" }],
    receivedAt: "2026-04-06T12:22:00.000Z",
    read: true,
    starred: false,
    snoozed: false,
    archived: false,
    folder: "inbox",
    tag: "transactional",
    headers: { from: "Linear <updates@linear.app>" },
    contactProfile: { trusted: true, replied: true, knownDomains: ["linear.app"] },
    firstTimeSender: false
  },
  {
    id: "mail-12",
    senderName: "Field Notes",
    senderEmail: "hello@fieldnotes.media",
    subject: "A calmer way to structure founder updates",
    preview: "A short editorial piece on sharper updates, better context, and less noise.",
    greeting: "Hi there,",
    body: [
      "This note is about writing founder updates that feel crisp without losing substance.",
      "A tighter structure often reduces follow-up questions and makes decision-making faster."
    ],
    links: [{ label: "Read article", href: "https://example.com/article" }],
    receivedAt: "2026-04-05T15:44:00.000Z",
    read: true,
    starred: false,
    snoozed: false,
    archived: false,
    folder: "inbox",
    tag: "newsletter",
    headers: {
      from: "Field Notes <hello@fieldnotes.media>",
      listUnsubscribe: "<mailto:unsubscribe@fieldnotes.media>"
    },
    contactProfile: { trusted: false, replied: false, knownDomains: [] },
    firstTimeSender: false
  }
]
