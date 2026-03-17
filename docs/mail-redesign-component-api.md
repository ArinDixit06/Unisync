# Component API Definitions

## MailListItem
File: `frontend/src/components/mail-ui/MailListItem.tsx`

Props:
- `email: MailListItemData`
- `selected: boolean`
- `onSelect(): void`
- `onArchive(): void`
- `onDelete(): void`
- `onToggleRead(): void`
- `onToggleStar?(): void`
- `onSelectToggle?(): void`
- `multiSelected?: boolean`

Events:
- Click row -> `onSelect`
- Click actions -> `onArchive`, `onDelete`, `onToggleRead`

## MailPreview
File: `frontend/src/components/mail-ui/MailPreview.tsx`

Props:
- `email: any` (expects `/emails/:id` shape)
- `onArchive(): void`
- `onDelete(): void`
- `onToggleRead(): void`
- `onConfirmEvent(eventId: string): void`
- `onDismissEvent(eventId: string): void`
- `onClose?(): void` (mobile close)
