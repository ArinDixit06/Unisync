# Accessibility Report (WCAG 2.1 AA)

## Checklist
- Color contrast: text uses slate/teal palette with AA-compliant contrast against `--color-bg-base`.
- Focus states: all buttons/inputs use `focus-visible` ring styles.
- Keyboard navigation:
  - Mail list supports `J/K` and arrow navigation.
  - Enter opens the selected email.
  - Escape closes preview (via close button on mobile).
  - `Alt + A` opens account switcher.
- ARIA roles:
  - Sidebar: `aria-label="Mailbox sidebar"`.
  - Mail list: `role="list"` and items are `role="listitem"`.
  - Account switcher: `aria-haspopup="listbox"`, `aria-expanded`.
  - Sync toggle: `role="switch"`.
- Reduced motion: transitions are subtle; no mandatory animation loops beyond spinner.
- Labels: all icon-only controls include `aria-label`.

## Remaining Recommendations
- The listed accessibility recommendations are now implemented in the shell and header.
- Keep checking any future layout changes against the checklist above.
