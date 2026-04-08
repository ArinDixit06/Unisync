# Markdown Status Matrix

Legend: `done` = reflected in code, `partial` = some parts exist, `missing` = not implemented.

| File | Status | Done | Missing |
|---|---|---|---|
| `README.md` | partial | Core stack, setup, and deployment docs are present. | Several feature claims are still aspirational or only partly realized. |
| `UniSync_Master_Prompt_v2.md` | partial | Core inbox, auth, AI pipeline, and design-system direction are represented. | Full product spec is not implemented, especially onboarding depth, richer compose UX, and some polish items. |
| `docs/STACK_DECISION.md` | done | Stack matches the current repo: React/Vite/TS frontend, FastAPI backend, Supabase auth, Postgres, Redis/arq, WebSockets, tsvector search. | Minor wording is dated, but the decision itself is implemented. |
| `docs/ARCHITECTURE_IMPROVEMENTS.md` | partial | Push-based ingestion, event-driven processing, realtime UI, and AI resilience are present. | Deadline Radar, Focus Mode, and Privacy Guard are not implemented. |
| `docs/TASK_BREAKDOWN.md` | done | Most repo structure, backend routes, frontend layout, docs, Docker, Railway pieces, and now minimal tests/sanity checks exist. | Full regression coverage and broader test depth are still missing. |
| `docs/CODEBASE_AUDIT.md` | partial | Most of the listed fixes are present in code, including auth, sanitization, webhook hardening, websocket auth, safe parsing, and search error handling. | The doc itself is still stale about item 1. |
| `docs/USER_GUIDE.md` | partial | Account linking, inbox behavior, AI summaries, labels, compose, calendar, and security concepts mostly match code. | Onboarding, notification preferences, font-size controls, data export, and help/report-bug flows are missing. |
| `docs/mail-redesign-summary.md` | done | Layout, component inventory, breakpoints, and redesign mapping match the current mail UI. | Some line items are descriptive rather than enforced, but the overall redesign exists. |
| `docs/mail-redesign-migration.md` | done | New layout and component mapping are in place. | No major gap in the migration guide relative to current code. |
| `docs/mail-redesign-accessibility.md` | done | Keyboard navigation, roles, focus styling, `aria-live`, preview selection state, and a visible skip link are present. | The report is still a checklist-style doc, but the listed recommendations are now implemented. |
| `docs/mail-redesign-tests.md` | done | Jest/RTL-style component tests, backend unit tests, and a visual regression snapshot now exist. | The doc is still a guide, but the missing coverage gap has been closed at a basic level. |
| `docs/mail-redesign-component-api.md` | partial | `MailListItem` and `MailPreview` exist conceptually in the UI. | The documented API does not fully match the current implementation details. |
| `docs/mail-redesign-shortcuts.md` | partial | `J/K`, arrows, Enter, `Alt+A`, and search shortcuts are supported or referenced in UI code. | Escape-to-close behavior is only partly implemented and shortcut help UI is missing. |
| `docs/mail-redesign-figma-spec.md` | partial | Visual direction, grid, colors, and iconography are broadly reflected. | This is a spec doc only; not every layout detail is implemented exactly. |
| `docs/mail-redesign-troubleshooting.md` | done | The listed overflow/layout fix is reflected in the current shell and grid structure. | No major gap. |

## Implementation Summary

Done:
- Core auth, inbox, compose, search, labels, calendar, realtime, and webhook plumbing.
- Mail redesign shell, sidebar, topbar, list, preview, and responsive layout.
- Several audit hardenings, including sanitization, webhook signature enforcement, and safer parsing.
- Minimal frontend and backend tests, plus backend compile sanity checks.
- Search error handling in the backend and the search modal.
- Accessibility polish for sync announcements, skip link navigation, and preview selection state.
- Initial visual regression coverage for the mail shell.

Still missing:
- Deeper scenario coverage and more visual cases.
- Product extras from the architecture docs: Deadline Radar, Focus Mode, Privacy Guard.
- Full onboarding and settings breadth from the user guide.

## Done vs Remaining

Compared with `docs/TASK_BREAKDOWN.md`, the repo is mostly complete on foundation and product wiring, while the remaining work is concentrated in coverage, polish, and feature breadth.

### Done or mostly done
- Repo structure, env setup, backend foundation, and core API routes.
- Gmail and Outlook integration, queue/worker pipeline, and WebSocket realtime updates.
- Frontend scaffold, design system, layout components, inbox flow, compose flow, search, and settings surfaces.
- Docs, Docker, and Railway configuration.
- Mail redesign migration, troubleshooting guidance, and baseline visual regression coverage.

### Remaining or incomplete
- Minimal tests and sanity checks, plus visual regression coverage.
- Other resilience gaps.
- Accessibility polish is mostly in place, with only deeper audit refinements left.
- Product extensions from the architecture docs: Deadline Radar, Focus Mode, Privacy Guard.
- Full onboarding and settings breadth from the user guide.
- A few doc/API mismatches and wording drift across the markdown set.

### Overall read
- The core app is implemented.
- What remains is mostly validation, accessibility, and feature expansion rather than basic platform plumbing.
