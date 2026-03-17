# UniSync Mail Redesign Summary

## Design Summary (1 page)
- Visual direction: calm, minimal SaaS mail client with soft elevation, rounded 16px cards, and teal accent for primary actions.
- Typography: Inter (400/600/700), base 16px, line-height 1.4.
- Color system: neutral light canvas (`--color-bg-base`) with teal accent (`--color-accent`), dark-mode tokens in `frontend/src/styles/tokens.css`.
- Layout: three-column grid on desktop (sidebar 260px, list min 360px, preview 35–45% width), stacked on mobile with slide-in preview.
- Scroll containment: independent scroll containers for sidebar, mail list, and preview; app shell uses `h-screen` + `overflow-hidden`.
- Motion: 150–200ms transitions for hover and slide; respects `prefers-reduced-motion` via Tailwind defaults.

## Component Inventory
- `Sidebar` (`frontend/src/components/mail-ui/Sidebar.tsx`)
- `Topbar` (`frontend/src/components/mail-ui/Topbar.tsx`)
- `MailList` (`frontend/src/components/mail-ui/MailList.tsx`)
- `MailListItem` (`frontend/src/components/mail-ui/MailListItem.tsx`)
- `MailPreview` (`frontend/src/components/mail-ui/MailPreview.tsx`)
- `SearchBar` (`frontend/src/components/mail-ui/SearchBar.tsx`)
- `ComposeButton` (`frontend/src/components/mail-ui/ComposeButton.tsx`)
- `SyncToggle` (`frontend/src/components/mail-ui/SyncToggle.tsx`)
- `LabelList` (`frontend/src/components/mail-ui/LabelList.tsx`)
- `AccountSwitcher` (`frontend/src/components/mail-ui/AccountSwitcher.tsx`)
- `EmptyState` (`frontend/src/components/mail-ui/EmptyState.tsx`)

## Breakpoints & Grid
- `lg` (1024px): `grid-cols-[260px_minmax(360px,1fr)_minmax(360px,42%)]`
- `md` (768px): sidebar collapses off-canvas, preview hidden until selected.
- `sm` (<768px): list full width, preview slides in full screen.

## Known Existing Structure Mapped
- `AppShell` now handles explicit grid and columns, preventing list from rendering bottom-left.
- Legacy classes (`.list-panel`, `.detail-panel`, `.email-list`) are replaced with Tailwind-based layout in `Dashboard.tsx`.
