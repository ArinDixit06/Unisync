export const copy = {
  appName: "UniSync",
  common: {
    closeDialog: "Close dialog",
    mobileNavigation: "Mobile navigation"
  },
  skipToMain: "Skip to main content",
  sidebar: {
    compose: "Compose",
    collapse: "Collapse sidebar",
    expand: "Expand sidebar",
    sections: {
      mail: "Mail",
      security: "Security"
    },
    items: {
      inbox: "Inbox",
      snoozed: "Snoozed",
      sent: "Sent",
      drafts: "Drafts",
      starred: "Starred",
      highRisk: "High Risk",
      trash: "Trash"
    },
    accountLabel: "Primary account",
    darkMode: "Dark mode"
  },
  filters: {
    all: "All",
    unread: "Unread",
    starred: "Starred",
    snoozed: "Snoozed"
  },
  list: {
    title: "Inbox",
    subtitle: "Priority-sorted conversations",
    searchPlaceholder: "Search mail, people, links, and tasks",
    emptyTitle: "Nothing to triage",
    emptyDescription: "Your filtered mailbox is clear. New mail will land here as it arrives."
  },
  reader: {
    loadImages: "Load images",
    imagesBlocked: "External images are blocked for privacy.",
    actions: {
      reply: "Reply",
      forward: "Forward",
      archive: "Archive",
      delete: "Delete",
      more: "More"
    },
    replyPlaceholder: "Reply to {{name}}…",
    sendReply: "Send reply",
    discard: "Discard",
    shortcutsTitle: "Keyboard shortcuts",
    riskDismiss: "Dismiss risk warning",
    loadAnnouncement: "Email loaded",
    sendAnnouncement: "Reply sent"
  },
  compose: {
    title: "New message",
    to: "To",
    subject: "Subject",
    body: "Message",
    close: "Close compose",
    discard: "Discard draft",
    send: "Send email",
    toolbar: {
      bold: "Bold",
      italic: "Italic",
      link: "Insert link",
      bullets: "Bulleted list"
    }
  },
  tags: {
    newsletter: "Newsletter",
    promotional: "Promotional",
    transactional: "Transactional",
    highRisk: "High Risk"
  },
  risk: {
    lowTitle: "Low-risk sender",
    mediumTitle: "Review before acting",
    highTitle: "Potential phishing attempt",
    lowBody: "This looks like a first-time newsletter or unfamiliar sender. Review before sharing information.",
    mediumBody:
      "Signals suggest bulk tracking or a sender outside your trusted network. Use caution with downloads and links.",
    highBody:
      "Multiple phishing signals detected, including suspicious urgency or display-name spoofing. Avoid clicking links until verified."
  },
  emptyReader: {
    title: "Select a conversation",
    description: "Open any thread to inspect the full AI-assisted reading view."
  },
  shortcuts: {
    openInbox: "Go to inbox",
    openStarred: "Go to starred",
    compose: "Compose new email",
    archive: "Archive selected email",
    reply: "Reply to selected email",
    next: "Next email",
    previous: "Previous email",
    help: "Open shortcuts"
  },
  bottomTabs: {
    inbox: "Inbox",
    starred: "Starred",
    compose: "Compose",
    settings: "Theme"
  }
} as const
