import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SettingsPanel } from "./SettingsPanel"

describe("SettingsPanel", () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it("renders account controls and supports closing", () => {
    const onClose = vi.fn()
    const onDisconnectAccount = vi.fn()

    render(
      <SettingsPanel
        open
        onClose={onClose}
        currentAccount={{ id: "acc-1", name: "Primary", email: "test@example.com" }}
        linkedAccounts={[{ id: "acc-1", name: "Primary", email: "test@example.com" }]}
        onDisconnectAccount={onDisconnectAccount}
        onConnectGmail={vi.fn()}
        onSyncNow={vi.fn()}
        onLogout={vi.fn()}
        sortOrder="recent"
        onSortOrderChange={vi.fn()}
        showPreviewText
        onShowPreviewTextChange={vi.fn()}
        lastSyncedAt={Date.now() - 60_000}
      />
    )

    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Disconnect" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole("button", { name: "Close settings" })[0])
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }))
    expect(onDisconnectAccount).toHaveBeenCalledWith("acc-1")
  })
})
