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
              detailOpen ? "hidden w-0 lg:hidden" : "flex w-full flex-1"
            }`}
          >
            {list}
          </main>
          <aside
            className={`relative overflow-hidden transition-all duration-200 ${
              detailOpen ? "flex w-full flex-1" : "hidden w-0"
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
