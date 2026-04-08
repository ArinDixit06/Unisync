import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { apiFetch } from "../../lib/api"
import { SearchCommand } from "./SearchCommand"

vi.mock("../../lib/api", () => ({
  apiFetch: vi.fn()
}))

vi.mock("../inbox", () => ({
  EmailRow: ({ email }: { email: { id: string; subject?: string } }) => (
    <div data-testid="email-row">{email.subject || email.id}</div>
  )
}))

describe("SearchCommand", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("surfaces search errors instead of failing silently", async () => {
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error("Search is temporarily unavailable"))

    render(<SearchCommand open onClose={vi.fn()} />)

    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "deadline" } })

    await new Promise((resolve) => setTimeout(resolve, 350))

    await waitFor(() =>
      expect(screen.getByText("Search is temporarily unavailable")).toBeInTheDocument()
    )
    expect(screen.getAllByRole("textbox")[0]).toHaveClass("input")
  })

  it("renders returned results", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      emails: [{ id: "mail-1", subject: "Project update" }]
    })

    render(<SearchCommand open onClose={vi.fn()} />)

    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "project" } })

    await new Promise((resolve) => setTimeout(resolve, 350))

    await waitFor(() => expect(screen.getByTestId("email-row")).toHaveTextContent("Project update"))
  })
})
