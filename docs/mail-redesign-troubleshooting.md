# Bottom-Left Overflow Bug Checklist

## Common Causes
- Grid auto-placement putting list in column 1 when topbar spans columns without explicit row/column placement.
- `position: absolute` on list children without a positioned parent.
- Missing `height: 100%` on list container when using `calc(100vh - headerHeight)`.
- Parent container uses `transform` (creates new stacking/containing context).
- `overflow: hidden` on wrong ancestor hides list and causes perceived "bottom-left" rendering.
- `z-index` mismatch between sidebar and list columns.

## Quick Fixes Applied in This Redesign
- Explicit grid rows/columns in `AppShell` (`grid-rows-[auto_1fr]` + `lg:grid-cols-[...]`).
- List and preview are placed with explicit `lg:col-start-2` / `lg:col-start-3`.
- Scroll containers have `overflow-y-auto` and `position: relative`.
- Mobile preview uses fixed panel with controlled `translate-x`.
