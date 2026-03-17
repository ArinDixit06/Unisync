# Testing Suggestions

## Unit + Integration (Jest + React Testing Library)
- Mail list rendering with 10k mock items (virtualization on/off).
- Keyboard navigation (`J/K`, arrows, Enter) changes selection.
- Preview panel opens/closes on selection and close button.
- Sidebar collapse/expand and off-canvas open/close behavior.
- Sync button disabled state while syncing.

## Visual Regression (Chromatic or Percy)
- Desktop: three-column layout with preview.
- Tablet: sidebar collapsed, preview hidden.
- Mobile: list view with FAB, preview slide-in.
- Dark mode: color tokens verify contrast.
