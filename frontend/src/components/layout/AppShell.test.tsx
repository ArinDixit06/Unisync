import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AppShell } from "./AppShell"

vi.mock("../mail-ui/Sidebar", () => ({
  Sidebar: () => <aside data-testid="sidebar" />
}))

describe("AppShell", () => {
  it("exposes a skip link to the mail list", () => {
    render(
      <AppShell
        sidebarProps={{
          labels: [],
          activeFilter: "all",
          activeCategory: "all",
          activeLabelId: null,
          account: { id: "all", name: "Primary", email: "student@unisync.app" },
          accounts: [],
          onFilterChange: vi.fn(),
          onLabelSelect: vi.fn(),
          onCategoryChange: vi.fn(),
          onCompose: vi.fn(),
          onSync: vi.fn(),
          onAccountSelect: vi.fn()
        }}
        sidebarOpen
        onSidebarToggle={vi.fn()}
        topbar={<header>Topbar</header>}
        list={<div id="mail-list">Mail list</div>}
        detail={<div>Preview</div>}
      />
    )

    const skipLink = screen.getByRole("link", { name: "Skip to list" })
    expect(skipLink).toHaveAttribute("href", "#mail-list")
  })
})
