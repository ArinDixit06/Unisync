import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Dashboard } from "./Dashboard"
import { apiFetch } from "../lib/api"

const setQueryData = vi.fn()
const getQueryData = vi.fn()
const invalidateQueries = vi.fn()

class MockWebSocket {
  onmessage: ((event: MessageEvent) => void) | null = null
  close = vi.fn()
  constructor(_url: string, _protocols?: string | string[]) {}
}

vi.mock("../lib/api", () => ({
  apiFetch: vi.fn(),
  getWsBaseUrl: () => "ws://localhost:8000"
}))

vi.mock("../stores/authStore", () => ({
  useAuthStore: () => ({
    setLinkedAccounts: vi.fn(),
    accessToken: "token-1",
    setUser: vi.fn(),
    setAccessToken: vi.fn()
  })
}))

vi.mock("../stores/uiStore", () => ({
  useUIStore: () => ({
    activeAccountId: null,
    activeCategory: "all",
    activeFilter: "all",
    activeLabelId: null,
    selectedEmailId: "mail-1",
    sidebarOpen: true,
    setState: vi.fn()
  })
}))

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    setQueryData,
    getQueryData,
    invalidateQueries
  }),
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === "accounts") {
      return { data: { accounts: [{ id: "acc-1", provider: "gmail", email_address: "test@example.com" }] } }
    }
    if (queryKey[0] === "labels") {
      return { data: { labels: [] } }
    }
    if (queryKey[0] === "emails-search") {
      const searchTerm = String(queryKey[5] || "").toLowerCase()
      if (searchTerm.includes("google")) {
        return {
          data: {
            emails: [
              {
                id: "mail-2",
                sender_name: "Google Workspace",
                sender_email: "no-reply@google.com",
                subject: "Welcome to Google",
                preview_snippet: "Google account setup is complete",
                received_at: "2026-04-10T12:00:00.000Z",
                is_read: true,
                is_starred: false,
                account_email: "test@example.com"
              }
            ]
          },
          isFetching: false,
          isError: false,
          error: null
        }
      }
      return { data: { emails: [] }, isFetching: false, isError: false, error: null }
    }
    if (queryKey[0] === "email") {
      return {
        data: {
          id: "mail-1",
          subject: "Preview subject",
          sender_name: "Ada Lovelace",
          sender_email: "ada@example.com",
          preview_snippet: "Preview text",
          received_at: "2026-04-11T12:00:00.000Z",
          is_read: false,
          is_starred: false,
          account_email: "test@example.com",
          suggested_events: [],
          attachments: []
        }
      }
    }
    return { data: null }
  },
  useInfiniteQuery: () => ({
    data: {
      pages: [
        {
          emails: [
            {
              id: "mail-1",
              sender_name: "Ada Lovelace",
              sender_email: "ada@example.com",
              subject: "Preview subject",
              preview_snippet: "Preview text",
              received_at: "2026-04-11T12:00:00.000Z",
              is_read: false,
              is_starred: false,
              account_email: "test@example.com"
            },
            {
              id: "mail-2",
              sender_name: "Slack",
              sender_email: "no-reply@slack.com",
              subject: "Workspace updates",
              preview_snippet: "Slack workspace setup is complete",
              received_at: "2026-04-10T12:00:00.000Z",
              is_read: true,
              is_starred: false,
              account_email: "test@example.com"
            },
            {
              id: "mail-3",
              sender_name: "Notion",
              sender_email: "no-reply@notion.so",
              subject: "Weekly digest",
              preview_snippet: "A roundup of pages you follow",
              received_at: "2026-04-09T12:00:00.000Z",
              is_read: true,
              is_starred: false,
              account_email: "test@example.com"
            }
          ]
        }
      ]
    },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false
  })
}))

vi.mock("../lib/supabase", () => ({
  supabase: { auth: { signOut: vi.fn() } },
  supabaseConfigured: false
}))

vi.mock("../components/layout", () => ({
  AppShell: ({ topbar, list, detail, children }: any) => (
    <div>
      {topbar}
      {list}
      {detail}
      {children}
    </div>
  ),
  TopBar: ({ searchValue, onSearchChange }: any) => (
    <div data-testid="topbar">
      <input
        aria-label="Search mail, sender or subject"
        value={searchValue ?? ""}
        onChange={(event) => onSearchChange?.(event.target.value)}
      />
    </div>
  )
}))

vi.mock("../components/mail-ui", () => ({
  ComposeButton: () => null,
  EmptyState: () => <div data-testid="empty-state" />,
  MailList: ({ emails }: any) => (
    <div data-testid="mail-list">{emails.length ? emails.map((email: any) => email.sender_name).join(", ") : "No matches found"}</div>
  ),
  MailPreview: ({ onToggleStar }: any) => (
    <button type="button" onClick={onToggleStar}>
      Preview Star
    </button>
  )
}))

vi.mock("../components/compose/ComposeModal", () => ({
  ComposeModal: () => null
}))

vi.mock("../components/search/SearchCommand", () => ({
  SearchCommand: () => null
}))

vi.stubGlobal("WebSocket", MockWebSocket as any)

describe("Dashboard", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("optimistically toggles the preview star and patches the email", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ status: "ok" })
    getQueryData.mockImplementation((key: any) => {
      if (Array.isArray(key) && key[0] === "email" && key[1] === "mail-1") {
        return {
          id: "mail-1",
          subject: "Preview subject",
          sender_name: "Ada Lovelace",
          sender_email: "ada@example.com",
          is_starred: false
        }
      }
      return {
        pages: [
          {
            emails: [
              {
                id: "mail-1",
                is_starred: false
              }
            ]
          }
        ]
      }
    })

    render(<Dashboard />)

    fireEvent.click(screen.getByRole("button", { name: "Preview Star" }))

    expect(setQueryData).toHaveBeenCalledWith(
      ["email", "mail-1"],
      expect.any(Function)
    )
    expect(setQueryData).toHaveBeenCalledWith(
      ["emails", null, "all", "all", null],
      expect.any(Function)
    )

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith("/emails/mail-1", {
        method: "PATCH",
        body: JSON.stringify({ is_starred: true })
      })
    )
  })

  it("filters the mail list as the search query changes", async () => {
    vi.mocked(apiFetch).mockImplementation(async (path: string) => {
      if (path.startsWith("/search?")) {
        const params = new URLSearchParams(path.split("?")[1] || "")
        const q = params.get("q") || ""
        if (q.toLowerCase().includes("google")) {
          return {
            emails: [
              {
                id: "mail-2",
                sender_name: "Google Workspace",
                sender_email: "no-reply@google.com",
                subject: "Welcome to Google",
                preview_snippet: "Google account setup is complete",
                received_at: "2026-04-10T12:00:00.000Z",
                is_read: true,
                is_starred: false,
                account_email: "test@example.com"
              }
            ]
          }
        }
        return { emails: [] }
      }
      return { status: "ok" }
    })

    render(<Dashboard />)

    fireEvent.change(screen.getAllByRole("textbox", { name: "Search mail, sender or subject" })[0], {
      target: { value: "Google" }
    })

    await waitFor(() => expect(screen.getByTestId("mail-list")).toHaveTextContent("Google Workspace"))
    expect(screen.getByTestId("mail-list")).not.toHaveTextContent("Ada Lovelace")
    expect(screen.getByTestId("mail-list")).not.toHaveTextContent("Slack")
    expect(screen.getByTestId("mail-list")).not.toHaveTextContent("Notion")

    fireEvent.change(screen.getAllByRole("textbox", { name: "Search mail, sender or subject" })[0], {
      target: { value: "xyzzy123" }
    })

    await waitFor(() => expect(screen.getByTestId("mail-list")).toHaveTextContent("No matches found"))
  })
})
