import type { Meta, StoryObj } from "@storybook/react"
import { AppShell } from "./AppShell"
import { TopBar } from "./TopBar"
import { MailPreview } from "../mail-ui/MailPreview"
import { MailList } from "../mail-ui/MailList"

const meta: Meta<typeof AppShell> = {
  title: "Mail/AppShell",
  component: AppShell,
  parameters: {
    layout: "fullscreen"
  }
}

export default meta

type Story = StoryObj<typeof AppShell>

const sampleEmail = {
  id: "mail-1",
  subject: "Study group moved to Thursday",
  sender_name: "Priya Sharma",
  sender_email: "priya@example.edu",
  preview_snippet: "We moved the group meeting to Thursday at 6pm.",
  received_at: "2026-04-08T09:00:00.000Z",
  is_read: false,
  is_starred: false,
  is_archived: false,
  is_snoozed: false,
  has_attachments: false,
  processing_status: "done",
  category: "primary",
  priority_level: "high",
  risk_level: null,
  linked_accounts: [],
  suggested_events: [
    {
      id: "event-1",
      title: "Study group",
      starts_at: "2026-04-10T18:00:00.000Z",
      start_datetime: "2026-04-10T18:00:00.000Z"
    }
  ],
  summary_bullets: ["Meeting moved to Thursday", "Bring slides and notes"],
  body_html: "<p>Hey, we moved the study group to Thursday at 6pm.</p>"
}

export const Default: Story = {
  render: () => (
    <AppShell
      sidebarProps={{
        labels: [{ id: "label-1", name: "School", color: "#0f766e" }],
        activeFilter: "all",
        activeCategory: "all",
        activeLabelId: null,
        account: { id: "all", name: "Primary", email: "student@unisync.app" },
        accounts: [{ id: "all", name: "Primary", email: "student@unisync.app" }],
        onFilterChange: () => {},
        onLabelSelect: () => {},
        onCategoryChange: () => {},
        onCompose: () => {},
        onSync: () => {},
        onAccountSelect: () => {}
      }}
      sidebarOpen
      onSidebarToggle={() => {}}
      topbar={
        <TopBar
          onCompose={() => {}}
          onSync={() => {}}
          syncAnnouncement="Mail sync ready"
          unreadCount={12}
        />
      }
      list={
        <div id="mail-list" className="h-full border-r border-gray-200/70 bg-white" tabIndex={-1}>
          <MailList
            emails={[sampleEmail as any, { ...sampleEmail, id: "mail-2", subject: "Project feedback", is_read: true } as any]}
            selectedEmailId="mail-1"
            activeFilter="all"
            onFilterChange={() => {}}
            onSelect={() => {}}
            onArchive={() => {}}
            onDelete={() => {}}
            onToggleRead={() => {}}
            onToggleStar={() => {}}
          />
        </div>
      }
      detail={
        <div
          className="fixed inset-0 z-20 bg-[var(--color-bg-base)] transition duration-200 ease-out lg:static lg:inset-auto lg:z-auto lg:h-full lg:translate-x-0 translate-x-0"
          role="region"
          aria-label="Email preview"
          aria-selected="true"
        >
          <div className="h-full border-l border-gray-200/70 bg-white">
            <MailPreview
              email={sampleEmail as any}
              onArchive={() => {}}
              onDelete={() => {}}
              onToggleRead={() => {}}
              onToggleStar={() => {}}
              onConfirmEvent={() => {}}
              onDismissEvent={() => {}}
            />
          </div>
        </div>
      }
    />
  )
}
