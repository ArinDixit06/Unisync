import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Topbar } from "./Topbar"

describe("Topbar", () => {
  afterEach(() => {
    cleanup()
  })

  it("announces sync status in a live region", () => {
    render(
      <Topbar
        onSync={() => {}}
        syncAnnouncement="Syncing mailbox"
      />
    )

    expect(screen.getByText("Syncing mailbox")).toBeInTheDocument()
  })

  it("shows the settings button", () => {
    render(
      <Topbar
        onSync={() => {}}
        sortOrder="recent"
        onSortOrderChange={() => {}}
        showPreviewText
        onShowPreviewTextChange={() => {}}
      />
    )

    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument()
  })
})
