# Mail Redesign Migration Guide

## Quick Steps
1. Install new frontend deps (Tailwind): `tailwindcss`, `postcss`, `autoprefixer`.
2. Ensure `frontend/tailwind.config.cjs` and `frontend/postcss.config.cjs` are present.
3. Use the new layout in `frontend/src/pages/Dashboard.tsx` (already updated).
4. Use new components from `frontend/src/components/mail-ui`.

## Old Class/ID Mapping
- `.app-shell` -> Tailwind grid in `frontend/src/components/layout/AppShell.tsx`
- `.sidebar` -> `Sidebar` component (`frontend/src/components/mail-ui/Sidebar.tsx`)
- `.topbar` -> `Topbar` component (`frontend/src/components/mail-ui/Topbar.tsx`)
- `.list-panel` -> list wrapper in `Dashboard.tsx` (`MailList` container)
- `.detail-panel` -> preview wrapper in `Dashboard.tsx` (`MailPreview` container)
- `.email-list` -> `MailList` scroll container (`overflow-y-auto`)
- `.email-row` -> `MailListItem` (hover actions, unread accent)

## DOM Selector Updates
- `#root` unchanged.
- Replace any references to `.email-list` with `role="list"` container in `MailList`.
- Replace `.email-row` selectors with component-level Tailwind classes.

## Data Flow Compatibility
The redesign still consumes:
- `/emails` for list
- `/emails/:id` for preview
- `/labels`
- `/auth/accounts`
- `/sync/account/:id`

Sample mapping (list):
- Old: `<EmailRow email={email} />`
- New: `<MailListItem email={email} selected={selectedId === email.id} />`

## Component Mapping (Old -> New)
- `NavigationSidebar` -> `Sidebar`
- `TopBar` -> `Topbar`
- `EmailRow` -> `MailListItem`
- `EmailDetail` -> `MailPreview`

## API Mapping Example
- `EmailRowData` fields are unchanged (id, sender_name, sender_email, subject, preview_snippet, received_at, is_read, risk_level, provider, account_email).
- `MailPreview` expects the same `email` object returned from `/emails/:id`.
