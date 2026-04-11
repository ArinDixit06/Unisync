import { Sidebar, SidebarProps } from "../mail-ui/Sidebar"

export function AppShell({
  sidebarProps,
  topbar,
  list,
  detail,
  detailOpen,
  sidebarOpen,
  onSidebarToggle,
  children
}: {
  sidebarProps: SidebarProps
  topbar: React.ReactNode
  list: React.ReactNode
  detail: React.ReactNode
  detailOpen: boolean
  sidebarOpen: boolean
  onSidebarToggle: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[var(--color-bg-base)]">
      <a
        href="#mail-list"
        className="sr-only absolute left-4 top-4 z-50 rounded-full border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to list
      </a>
      <div
        className={`fixed inset-y-0 left-0 z-40 w-[260px] transform transition duration-200 ease-out lg:static lg:w-[260px] lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar {...sidebarProps} />
      </div>
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onSidebarToggle}
          aria-label="Close sidebar"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="shrink-0">{topbar}</div>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main
            className={`relative overflow-hidden transition-all duration-200 ${
              detailOpen
                ? "hidden lg:flex lg:w-[400px] lg:shrink-0"
                : "flex min-w-0 w-full flex-1"
            }`}
          >
            {list}
          </main>
          <aside
            className={`relative overflow-hidden transition-all duration-200 ${
              detailOpen
                ? "flex min-w-0 w-full flex-1"
                : "hidden lg:flex lg:min-w-0 lg:flex-1"
            }`}
          >
            {detail}
          </aside>
        </div>
      </div>
      {children}
    </div>
  )
}
