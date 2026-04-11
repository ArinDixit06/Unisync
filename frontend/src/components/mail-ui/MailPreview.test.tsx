import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MailPreview } from "./MailPreview"

describe("MailPreview", () => {
  it("shows a star toggle in the header", () => {
    const onToggleStar = vi.fn()

    render(
      <MailPreview
        email={{
          subject: "Weekly update",
          sender_name: "Ada Lovelace",
          sender_email: "ada@example.com",
          is_read: false,
          is_starred: false,
          suggested_events: [],
          attachments: []
        }}
        onArchive={vi.fn()}
        onDelete={vi.fn()}
        onToggleRead={vi.fn()}
        onToggleStar={onToggleStar}
        onReply={vi.fn()}
        onForward={vi.fn()}
        onConfirmEvent={vi.fn()}
        onDismissEvent={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Star" }))

    expect(onToggleStar).toHaveBeenCalledTimes(1)
  })
})
