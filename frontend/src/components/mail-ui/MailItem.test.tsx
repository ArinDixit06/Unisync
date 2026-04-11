import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MailItem } from "./MailItem"

describe("MailItem", () => {
  it("shows a star toggle and calls the handler", () => {
    const onToggleStar = vi.fn()

    render(
      <MailItem
        sender="Ada Lovelace"
        subject="Project update"
        preview="Hello there"
        time="2m ago"
        unread
        selected={false}
        onClick={vi.fn()}
        onArchive={vi.fn()}
        onDelete={vi.fn()}
        onToggleRead={vi.fn()}
        onToggleStar={onToggleStar}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Star" }))

    expect(onToggleStar).toHaveBeenCalledTimes(1)
  })
})
