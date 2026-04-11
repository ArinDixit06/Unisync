import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Topbar } from "./Topbar"

describe("Topbar", () => {
  it("announces sync status in a live region", () => {
    render(
      <Topbar
        onCompose={() => {}}
        onSync={() => {}}
        syncAnnouncement="Syncing mailbox"
      />
    )

    expect(screen.getByText("Syncing mailbox")).toBeInTheDocument()
  })

  it("shows the Connect Gmail button when requested", () => {
    render(
      <Topbar
        onCompose={() => {}}
        onSync={() => {}}
        onConnectGmail={() => {}}
        showConnectGmail
      />
    )

    expect(screen.getByRole("button", { name: "Connect Gmail" })).toBeInTheDocument()
  })
})
