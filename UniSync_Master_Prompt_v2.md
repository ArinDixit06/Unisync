# UniSync — Master Production Prompt v2
> **Model:** Claude Opus 4.6 (Extended Thinking) via Antigravity Planning Mode
> **Role:** World-Class Senior Systems Architect + Principal Engineer + Lead Designer
> **Output:** Production-ready, full-featured intelligent mailing application

---

## WHO YOU ARE

You are a **principal engineer** who has shipped production systems at scale. You have the design sensibility of a Figma-obsessed product designer, the architectural rigor of someone who has debugged race conditions at 3am in production, and the frontend craft of someone who treats 60fps as a moral obligation. You do not write placeholder code. You do not write TODO comments. You finish what you start.

You are building **UniSync** — a premium, AI-powered unified mailing application for university students. Think of it as the intersection of Superhuman's design ethos, Gmail's feature depth, and Linear's engineering quality — but built for a student who has three inboxes, hates cognitive overload, and needs their deadlines organized automatically.

---

## PHASE 0 — ARCHITECT FIRST, BUILD SECOND

**This is a Planning Mode execution. Before a single file is created, produce the following:**

### 0.1 — Stack Decision Document

You have full authority to choose the best stack. Here are the constraints and preferences:

- **Primary Platform:** Web (browser-first, mobile-responsive, mobile app is future scope)
- **Email Providers:** Gmail (Google API) + Outlook (Microsoft Graph API)
- **AI Provider:** Google Gemini (primary for all AI features)
- **Deployment:** Railway (monorepo, single platform for everything)
- **Repository:** Monorepo
- **Scale:** < 1,000 users (student demo → real product trajectory)
- **Auth:** Undecided — you recommend the best option
- **Backend language:** Undecided — you recommend the best option

Evaluate and commit to a stack covering: Frontend framework, Backend language/framework, Auth provider, Database, Cache/Queue, Real-time layer, Search engine, File storage. For each choice, write one sentence justifying it. Be opinionated. Do not hedge.

### 0.2 — Architectural Improvements Over the Original SRS

The SRS was written by students. As the principal architect, you must:

1. **Challenge every polling assumption.** Gmail and Microsoft Graph both offer push notifications (Gmail Pub/Sub, Microsoft Graph webhooks). Implement push, not pull. Polling at scale is an anti-pattern even at 1,000 users.

2. **Propose a proper event-driven email ingestion pipeline.** When a new email arrives via webhook → validate → enqueue → process (security analysis + AI) → push to frontend via WebSocket. Zero polling anywhere in this pipeline.

3. **Design the AI pipeline for resilience.** Every AI call must have: retry with exponential backoff, a timeout, a graceful fallback (show email without AI enrichment), and a dead-letter queue for failed jobs. The app must work if Gemini is down.

4. **Propose the right real-time strategy.** The frontend must never poll for new emails. New emails must appear in the inbox automatically, processing status must update live ("Analyzing..." → "Done"), and calendar confirmations must reflect instantly.

5. **Design for the full feature set from day one.** The schema, API design, and component architecture must accommodate: compose/send, threading, labels, snooze, undo-send, full-text search, attachments, keyboard shortcuts, smart categories, AI summary, priority score, phishing detection, and calendar sync. No retrofitting later.

6. **Propose at least 3 improvements not in the SRS** that would make UniSync meaningfully better as a product. Be specific — name the feature, how it works technically, and why it matters to the user.

### 0.3 — Full Task Breakdown for Planning Mode

After the architectural decisions, produce a numbered flat task list covering every file that needs to be created, in dependency order. This becomes Antigravity's execution manifest.

---

## PHASE 1 — DESIGN SYSTEM

### 1.1 — Visual Identity

Design a **premium, professional-grade design system** from scratch. This is the single most important decision you make — every pixel in the app flows from here.

**The Aesthetic Direction:**
- **Tone:** Refined luxury minimalism. Think Bloomberg Terminal meets Notion meets Linear. Controlled, dense, purposeful. Not playful. Not bubbly. Not corporate-boring either.
- **Theme:** Fully adaptive — respects `prefers-color-scheme`. Both light and dark must feel premium, not like an afterthought.
- **The one thing users remember:** The typographic hierarchy. Every piece of information has exactly the right visual weight. Reading the inbox feels effortless.

**Typography (non-negotiable rules):**
- Choose a distinctive display/heading font that is NOT Inter, Roboto, Arial, SF Pro, or Space Grotesk. Something with character — consider: Instrument Serif, Fraunces, Söhne, Editorial New, Playfair Display, Reckless Neue, or similar. Load from Google Fonts or Fontsource.
- Pair it with a refined monospace or geometric sans for UI labels, metadata, timestamps.
- Establish a strict 6-step type scale with matching line heights and letter spacings.
- Font sizes, weights, and colors must be CSS custom properties — never hardcoded.

**Color System:**
```css
/* Design and implement ALL of the following as CSS custom properties */
/* with full light/dark variants via [data-theme="dark"] or @media */

--color-bg-base          /* Page background */
--color-bg-surface       /* Cards, panels */
--color-bg-elevated      /* Dropdowns, modals */
--color-bg-subtle        /* Hover states, tags */

--color-border-default   /* Standard borders */
--color-border-strong    /* Emphasized borders */

--color-text-primary     /* Body text */
--color-text-secondary   /* Labels, metadata */
--color-text-tertiary    /* Placeholders, disabled */
--color-text-inverse     /* Text on dark/accent backgrounds */

--color-accent           /* Primary brand color — NOT purple gradient */
--color-accent-subtle    /* 10% opacity accent for backgrounds */
--color-accent-hover     /* Darker/lighter on hover */

--color-success          /* Confirmed, synced, safe */
--color-warning          /* Medium risk, attention */
--color-danger           /* High risk, error, phishing */
--color-info             /* Processing, neutral info */

/* Semantic aliases */
--color-risk-low         /* = success */
--color-risk-medium      /* = warning */
--color-risk-high        /* = danger */
--color-priority-high    /* Hot accent */
--color-priority-medium  /* Warm neutral */
--color-priority-low     /* Cool neutral */
```

**Motion System:**
```css
--duration-instant    /* 80ms  — micro feedback (button press) */
--duration-fast       /* 150ms — hover states, tooltips */
--duration-normal     /* 250ms — panel transitions */
--duration-slow       /* 400ms — page transitions, modals */
--duration-deliberate /* 600ms — onboarding, empty states */

--ease-default        /* cubic-bezier(0.16, 1, 0.3, 1)  — snappy deceleration */
--ease-spring         /* cubic-bezier(0.34, 1.56, 0.64, 1) — subtle overshoot */
--ease-in             /* cubic-bezier(0.4, 0, 1, 1) — exits */
--ease-out            /* cubic-bezier(0, 0, 0.2, 1) — entrances */
```

**Spacing & Radius:**
- 4px base unit. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Radius scale: 4px (inputs), 8px (cards), 12px (modals), 9999px (pills/badges).
- All as CSS custom properties.

**Elevation / Shadow System:**
- 3 levels of shadow — subtle, medium, high — for light mode.
- Dark mode uses border + subtle background shift instead of shadows.

### 1.2 — Component Library (implement all, zero placeholders)

Every component must be fully implemented, animated, and accessible (ARIA labels, keyboard navigation, focus rings).

**Primitives:**
- `Button` — variants: primary, secondary, ghost, danger. States: default, hover, active, loading (spinner replaces text), disabled. Size variants: sm, md, lg.
- `Input` — variants: default, search. States: default, focused (animated label float), error (shake animation + red border), disabled. With prefix/suffix icon slots.
- `Badge` — variants: default, success, warning, danger, info. Sizes: sm, md.
- `Avatar` — image with initials fallback. Sizes: xs (24px), sm (32px), md (40px), lg (48px). Online indicator dot variant.
- `Tooltip` — follows cursor, fades in on 300ms delay, keyboard accessible.
- `Spinner` — three sizes, matches accent color.
- `Skeleton` — animated shimmer. Variants: text-sm, text-md, text-lg, avatar, card, email-row.
- `Divider` — horizontal and vertical. With optional label.
- `Switch` — toggle with smooth thumb animation.
- `Checkbox` — custom styled, animated checkmark on select.
- `Dropdown` — animated open/close, keyboard navigable, portal-rendered.
- `Toast` — slide-in from bottom-right, auto-dismiss with progress bar, variants: success/error/warning/info. Stack up to 4.
- `Modal` — backdrop blur, scale-in animation, focus trap, Escape to close.
- `Kbd` — keyboard shortcut display component. E.g. `⌘K`, `G I`.

**Layout:**
- `AppShell` — the main 3-column layout: NavigationSidebar (240px) + EmailList (380px) + DetailPanel (flex-1). Collapsible sidebar. Resizable list/detail split via drag handle.
- `NavigationSidebar` — account switcher at top, nav items, label list, footer with settings/profile.
- `TopBar` — breadcrumb, search trigger, compose button, notification bell, theme toggle, user avatar.

**Inbox Components:**
- `EmailRow` — the single most important UI element. Must show: sender avatar, sender name (bold if unread), subject (bold if unread), preview snippet, timestamp (relative: "2m ago", "Yesterday", "Jan 14"), account source badge (Gmail/Outlook pill), risk badge, priority indicator (colored left border), AI-processing status. Hover state: subtle background shift + action buttons appear (archive, snooze, mark read). Selected state: distinct accent background.
- `EmailThread` — groups emails by thread_id. Shows thread count badge. Expandable.
- `EmailDetail` — full reading pane. Header: sender info, to/cc/bcc (expandable), timestamp, action bar (reply, forward, archive, label, snooze, delete). Body: sanitized HTML render. Footer: quick reply input.
- `AISummaryCard` — premium card above email body. Shows 3 bullet points with animated reveal (staggered, 100ms apart). "Analyzing..." skeleton while pending. Collapsed by default with expand toggle. Never show if AI failed — silently omit.
- `PriorityBadge` — shows AI-assigned priority (High/Medium/Low) with appropriate color and icon.
- `RiskBanner` — full-width, dismissible. Color-coded by risk level. Lists specific reasons. On High risk: overlays all links in the email body with a warning overlay until dismissed.
- `SuggestedEventCard` — date, time, title extracted by AI. "Add to Calendar" CTA. Confirmed state shows green checkmark.

**Compose:**
- `ComposeModal` — floats over the inbox (like Gmail). Draggable. Minimizable to a pill in the bottom bar. Maximizable to full screen. Fields: To (tag input with autocomplete from contacts), CC (expandable), BCC (expandable), Subject, Body (rich text editor). Bottom toolbar: formatting options, attachment button, send button, undo-send countdown.
- `RichTextEditor` — built on Tiptap. Supports: bold, italic, underline, strikethrough, ordered/unordered list, blockquote, inline code, links, text alignment. Clean, minimal toolbar — icons only, tooltips on hover.
- `AttachmentPreview` — file chip with icon, name, size, remove button. Image files show thumbnail.

**Search:**
- `SearchCommand` — full-screen modal triggered by `⌘K` or `/`. Instant search across all emails as user types. Results grouped by: Emails, Contacts, Labels. Keyboard navigable. Shows recent searches when empty.

**Settings:**
- `SettingsPage` — left nav (sections) + right content. Sections: Profile, Accounts (linked email accounts), Notifications, AI Preferences, Appearance (theme toggle, font size), Keyboard Shortcuts, Privacy & Security, Danger Zone.

---

## PHASE 2 — FULL FEATURE SPECIFICATION

Implement every feature below completely. No half-implementations.

### 2.1 — Authentication & Onboarding

**Provider Recommendation (implement this):**
Use **Supabase Auth** — it eliminates the Firebase dependency, consolidates auth + database in one provider, supports Google OAuth natively, and integrates with Railway trivially. This simplifies the stack significantly.

**Flows to implement:**
- Sign up with email + password (email verification required)
- Sign in with Google (OAuth)
- Forgot password / Reset password flow
- Onboarding flow (shown once after first login): Step 1 — Link Gmail account, Step 2 — Link Outlook account (skippable), Step 3 — Set notification preferences, Step 4 — Tour of key features (3-slide tooltip walkthrough). Progress indicator. Skip option.
- Session management: auto-refresh tokens, detect session expiry, graceful redirect to login.

**Login Page Design:**
- Full-viewport, split layout: left panel (60%) with animated brand illustration or abstract geometric art — subtle, looping, CSS/SVG animation — dark background. Right panel (40%) with the auth form, clean, well-spaced, premium.
- Adaptive: on mobile, full-screen form with brand logo at top.
- Form fields animate in with staggered fade+slide on load.
- Google OAuth button styled properly (follows Google brand guidelines).
- "Sign up" / "Sign in" toggle with smooth crossfade between states.
- Password field with show/hide toggle.

### 2.2 — Email Ingestion (Push-Based, Not Polling)

**Gmail:**
- Use Gmail Push Notifications via Google Cloud Pub/Sub.
- On account link: call `users.watch()` to subscribe to inbox changes.
- On webhook arrival at `POST /webhooks/gmail`: decode message, fetch changed email via Gmail API, enqueue for processing.
- Refresh the `watch()` subscription every 6 days (it expires at 7 days) via a scheduled Railway cron job.

**Outlook:**
- Use Microsoft Graph change notifications (webhooks).
- On account link: create a subscription to `me/messages`.
- On webhook arrival at `POST /webhooks/outlook`: validate lifecycle notification, fetch new message, enqueue.
- Renew subscription before expiry (max 4,230 minutes) via scheduled job.

**Why this matters:** Zero polling. Zero battery drain on mobile (future). Emails appear in the inbox within seconds of arrival, not minutes.

### 2.3 — AI Feature Pipeline (Google Gemini)

Use `google-generativeai` Python SDK. Model: `gemini-1.5-flash` for speed, `gemini-1.5-pro` for complex analysis. All AI calls are async, run in background workers, never block the API.

**Feature 1 — Email Summarization**
- Input: cleaned email body (HTML stripped, forwarded chains removed)
- Output: exactly 3 bullet points, each max 15 words, action-oriented language
- Prompt must enforce format via output schema (Gemini supports JSON mode)
- Fallback: if Gemini fails after 2 retries, store `summary: null` — UI silently omits summary card

**Feature 2 — Priority Analysis**
- Input: sender, subject, body, sender history (has user replied to this sender before?)
- Output: `{ priority: "high" | "medium" | "low", reason: string, confidence: float }`
- High priority signals: professor/advisor sender, deadline mentioned, reply requested, financial matter
- This score drives the colored left border on EmailRow

**Feature 3 — Phishing & Security Analysis**
- Layer 1 (deterministic, always runs): Parse SPF/DKIM/DMARC headers. Check sender domain against known disposable/malicious domain list. Flag domain mismatch (display name vs actual sender).
- Layer 2 (Gemini): Analyze tone for urgency manipulation, credential harvesting, impersonation, financial threat. Returns `{ risk: "low"|"medium"|"high", reasons: string[] }`
- Layer 2 only runs if Layer 1 doesn't already yield `high` risk (saves API calls)
- Combine both layers into final RiskResult

**Feature 4 — Smart Category Classification**
- Input: sender, subject, body snippet
- Output: `"primary" | "updates" | "promotions" | "social" | "forums"`
- Drives the category tabs in the inbox (like Gmail's tabs)

**Feature 5 — Event/Deadline Extraction**
- Input: full email body
- Output: `List<{ title, date, time, location, description }>` or empty list
- Use `dateparser` + Gemini for robust relative date handling ("next Thursday", "end of semester")
- Only extract if confidence > 0.8

**AI Pipeline Architecture:**
```
Webhook arrives
    → validate & store raw email (immediate)
    → enqueue job: process_email(email_id)
    → worker picks up:
        1. run_security_analysis()      [always, deterministic first]
        2. run_gemini_classification()  [category]
        3. run_gemini_priority()        [priority]
        4. run_gemini_summary()         [summary]
        5. run_gemini_events()          [calendar events]
        → all 5 update DB atomically
        → push realtime event to frontend
        
Each step: try → except → log → continue (one failure ≠ pipeline failure)
Circuit breaker: if Gemini fails 5 times in 60s → disable Gemini calls for 2 minutes
```

### 2.4 — Core Email Features (all must work)

**Reading:**
- Unified inbox: merged, sorted by received_at DESC, across all linked accounts
- Thread view: emails grouped by thread, expandable, shows reply count
- Mark as read/unread (syncs back to provider)
- Star / flag email (syncs back)
- Category tabs: Primary / Updates / Promotions / Social / Forums
- Filter bar: All / Unread / Starred / High Priority / High Risk

**Composing:**
- New email compose (floating modal, draggable, minimizable)
- Reply (inline in detail panel, or in compose modal)
- Reply All
- Forward
- Rich text editor (Tiptap): bold, italic, underline, strikethrough, lists, blockquote, code, links
- To/CC/BCC fields with tag-input, contact autocomplete from sender history
- File attachments: drag-and-drop + click to upload. Max 25MB per file. Preview chips.
- Send via Gmail API / Microsoft Graph API (sends from the linked account the email belongs to)

**Undo Send:**
- On clicking Send: start 5-second countdown toast ("Sending in 5s... Undo")
- Clicking Undo: cancel the send, reopen compose modal with the draft intact
- After countdown: actual API call fires
- If send fails: toast error + reopen compose with draft

**Organization:**
- Archive: removes from inbox, syncs to provider
- Delete: moves to trash, syncs to provider
- Labels/Tags: create, assign, remove, color-code. Syncs to Gmail labels / Outlook categories.
- Move to folder (Outlook)
- Snooze: pick datetime → email disappears from inbox → reappears at that time (implement via a scheduled job that un-archives and pushes realtime update)

**Search:**
- Full-text search across subject, sender, body snippet, labels
- Implement using PostgreSQL `tsvector` full-text search (no external search engine needed at this scale)
- Search modal (`⌘K`): results as user types (debounced 300ms), keyboard navigable
- Advanced filters: from:, to:, has:attachment, label:, before:, after:, is:unread

**Attachments:**
- Download attachments (streamed from Gmail/Outlook API, not stored permanently)
- Preview: images shown inline, PDFs open in new tab
- Storage: do NOT store attachment files in your database. Stream directly from provider API on demand.

### 2.5 — Calendar Integration

- Connect Google Calendar via OAuth (same Google account as Gmail, reuse scopes)
- `SuggestedEventCard` appears in email detail when events are extracted
- User can edit title, date, time, location before confirming
- On confirm: `POST` to Google Calendar API, store `gcal_event_id` in DB
- Visual confirmation: card changes to "Added to Calendar ✓" with green state
- Settings page: view/disconnect connected calendar, toggle auto-suggestions on/off

### 2.6 — Snooze System

- Snooze picker: presets (Later Today, Tomorrow Morning, This Weekend, Next Week, Custom datetime picker)
- On snooze: set `snoozed_until` timestamp, remove from inbox view
- Railway cron job runs every minute: `SELECT * FROM emails WHERE snoozed_until <= NOW() AND is_snoozed = true` → un-snooze, push realtime event to frontend → email reappears at top of inbox

### 2.7 — Keyboard Shortcuts (implement all)

```
Navigation:
  G I       → Go to Inbox
  G S       → Go to Starred
  G T       → Go to Sent
  G D       → Go to Drafts
  G L       → Go to Labels

Email List:
  J / K     → Next / Previous email
  X         → Select email
  Enter     → Open selected email
  U         → Back to email list

Email Actions (when email is open):
  R         → Reply
  A         → Reply All
  F         → Forward
  E         → Archive
  #         → Delete
  S         → Star / Unstar
  M         → Mute thread
  B         → Snooze

Global:
  C         → Compose new email
  /         → Focus search
  ⌘K        → Open command palette
  ?         → Show keyboard shortcuts help modal
  Escape    → Close modal / deselect
```

Implement via a global `useKeyboardShortcuts` hook. Show shortcuts in a help modal (`?`). Show `Kbd` component hints in tooltips on relevant UI elements.

---

## PHASE 3 — BACKEND ARCHITECTURE

### 3.1 — Stack Decision (implement exactly this)

| Layer | Choice | Reason |
|---|---|---|
| Backend | **Go + Fiber** | 3-5x faster than FastAPI for I/O-bound workloads, built-in goroutine concurrency, single binary deployment on Railway, zero cold starts |
| Database | **Supabase (PostgreSQL)** | RLS, realtime, auth, storage in one platform |
| Auth | **Supabase Auth** | Eliminates Firebase, native Google OAuth, JWT-based, integrates with RLS |
| Cache | **Redis (Railway)** | Job queue, session cache, rate limiting, snooze job index |
| Queue | **Asynq** (Go Redis-backed queue) | Native Go, fast, monitoring UI, replaces Celery |
| Real-time | **Supabase Realtime** | WebSocket push to frontend, no custom WS server needed |
| AI | **Google Gemini API** | Primary for all AI features |
| File Streaming | **Provider APIs** | Never store attachments — stream on demand |
| Deployment | **Railway** | Single platform, monorepo, one `railway.json` |

> **Note to implementer:** If Go feels too divergent from the team's comfort zone, FastAPI + Python is an acceptable fallback. In that case: use `asyncio`-native endpoints everywhere, `arq` instead of Celery (async Redis queue), and `httpx.AsyncClient` for all external calls. Never use `requests` (sync). This note is the only place fallback is mentioned — choose one and implement it fully.

### 3.2 — Project Structure (Monorepo)

```
unisync/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, test, type-check on PR
│       └── deploy.yml                # Deploy to Railway on main merge
│
├── frontend/                         # React + Vite + TypeScript
│   ├── src/
│   │   ├── design-system/
│   │   │   ├── tokens.css            # All CSS custom properties
│   │   │   ├── tokens.ts             # JS token exports (for Tailwind)
│   │   │   └── typography.css        # Font imports + type scale
│   │   ├── components/
│   │   │   ├── primitives/           # Button, Input, Badge, Avatar, etc.
│   │   │   ├── layout/               # AppShell, Sidebar, TopBar
│   │   │   ├── inbox/                # EmailRow, EmailThread, EmailDetail
│   │   │   ├── ai/                   # AISummaryCard, PriorityBadge, RiskBanner
│   │   │   ├── compose/              # ComposeModal, RichTextEditor, AttachmentPreview
│   │   │   ├── calendar/             # SuggestedEventCard, AddToCalendarModal
│   │   │   ├── search/               # SearchCommand
│   │   │   └── settings/             # SettingsPage and sub-sections
│   │   ├── stores/
│   │   │   ├── uiStore.ts            # UI state (Zustand)
│   │   │   └── authStore.ts          # Auth state (Zustand)
│   │   ├── hooks/
│   │   │   ├── useKeyboardShortcuts.ts
│   │   │   ├── useRealtimeEmails.ts  # Supabase realtime subscription
│   │   │   └── useUndoSend.ts
│   │   ├── api/                      # TanStack Query hooks
│   │   │   ├── useEmails.ts
│   │   │   ├── useCompose.ts
│   │   │   ├── useLabels.ts
│   │   │   └── useCalendar.ts
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Onboarding.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Settings.tsx
│   │   ├── lib/
│   │   │   ├── supabase.ts           # Supabase client
│   │   │   ├── queryClient.ts        # TanStack Query config
│   │   │   └── sanitize.ts           # DOMPurify email body sanitizer
│   │   └── main.tsx
│   ├── .storybook/                   # Storybook config
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/                          # Go + Fiber (or FastAPI fallback)
│   ├── cmd/
│   │   ├── api/
│   │   │   └── main.go               # API server entrypoint
│   │   └── worker/
│   │       └── main.go               # Background worker entrypoint
│   ├── internal/
│   │   ├── config/
│   │   │   └── config.go             # Env-based config (godotenv)
│   │   ├── middleware/
│   │   │   ├── auth.go               # JWT validation middleware
│   │   │   ├── ratelimit.go          # Per-user rate limiting
│   │   │   └── cors.go
│   │   ├── handlers/
│   │   │   ├── auth.go               # /auth/* routes
│   │   │   ├── emails.go             # /emails/* routes
│   │   │   ├── compose.go            # /compose/* routes
│   │   │   ├── labels.go             # /labels/* routes
│   │   │   ├── calendar.go           # /calendar/* routes
│   │   │   ├── webhooks.go           # /webhooks/gmail, /webhooks/outlook
│   │   │   ├── search.go             # /search route
│   │   │   └── health.go             # /health, /ready
│   │   ├── services/
│   │   │   ├── gmail/
│   │   │   │   ├── client.go         # Gmail API client
│   │   │   │   ├── watch.go          # Pub/Sub subscription management
│   │   │   │   └── send.go           # Send email via Gmail API
│   │   │   ├── outlook/
│   │   │   │   ├── client.go         # Microsoft Graph client
│   │   │   │   ├── webhook.go        # Subscription management
│   │   │   │   └── send.go           # Send via Graph API
│   │   │   ├── ai/
│   │   │   │   ├── gemini.go         # Gemini client + circuit breaker
│   │   │   │   ├── summarizer.go     # Summary chain
│   │   │   │   ├── priority.go       # Priority analysis chain
│   │   │   │   ├── security.go       # Phishing detection
│   │   │   │   ├── classifier.go     # Category classification
│   │   │   │   └── events.go         # Date/event extraction
│   │   │   ├── token/
│   │   │   │   ├── encrypt.go        # AES-256-GCM token encryption
│   │   │   │   └── refresh.go        # OAuth token refresh logic
│   │   │   └── calendar/
│   │   │       └── gcal.go           # Google Calendar API client
│   │   ├── workers/
│   │   │   ├── processor.go          # process_email task
│   │   │   ├── syncer.go             # bulk_sync_account task
│   │   │   ├── snooze.go             # snooze watcher task
│   │   │   └── webhook_renewer.go    # renew Gmail/Outlook subscriptions
│   │   ├── models/
│   │   │   └── models.go             # Go structs matching DB schema
│   │   └── db/
│   │       └── db.go                 # Supabase/pgx connection pool
│   ├── go.mod
│   └── go.sum
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_full_text_search.sql
│   │   └── 004_cron_jobs.sql
│   └── seed.sql
│
├── docker-compose.yml                # Local dev: Redis, backend, worker
├── railway.json                      # Railway deployment config
├── .env.example                      # All required env vars documented
├── README.md                         # Setup + architecture
├── ARCHITECTURE.md                   # Decision log
└── docs/
    └── USER_GUIDE.md                 # Full user guide (see Phase 5)
```

### 3.3 — Database Schema (implement in full)

```sql
-- migrations/001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- ENUMS
CREATE TYPE email_provider AS ENUM ('gmail', 'outlook');
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'done', 'failed');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE email_category AS ENUM ('primary', 'updates', 'promotions', 'social', 'forums');

-- USERS (mirrors Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{
    "theme": "system",
    "fontSize": "medium",
    "aiSummaryEnabled": true,
    "priorityAnalysisEnabled": true,
    "calendarSyncEnabled": true,
    "undoSendDelaySeconds": 5,
    "notificationsEnabled": true
  }',
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LINKED ACCOUNTS (email provider connections)
CREATE TABLE linked_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider email_provider NOT NULL,
  email_address TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  encrypted_refresh_token TEXT NOT NULL,   -- AES-256-GCM encrypted
  access_token_hash TEXT,                  -- SHA-256 hash for identity only
  token_expires_at TIMESTAMPTZ,
  scope TEXT,                              -- granted OAuth scopes
  gmail_history_id TEXT,                   -- for Gmail incremental sync
  gmail_watch_expiry TIMESTAMPTZ,          -- Pub/Sub watch expiry
  outlook_subscription_id TEXT,            -- Graph webhook subscription
  outlook_subscription_expiry TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider, email_address)
);

-- EMAILS
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES linked_accounts(id) ON DELETE CASCADE,
  
  -- Provider identity
  message_id TEXT NOT NULL,               -- provider's message ID
  thread_id TEXT,                         -- provider's thread ID
  
  -- Email metadata
  sender_name TEXT,
  sender_email TEXT NOT NULL,
  recipient_emails TEXT[],
  cc_emails TEXT[],
  bcc_emails TEXT[],
  subject TEXT,
  preview_snippet TEXT,                   -- first 200 chars of body
  received_at TIMESTAMPTZ NOT NULL,
  
  -- State
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_snoozed BOOLEAN DEFAULT FALSE,
  snoozed_until TIMESTAMPTZ,
  has_attachments BOOLEAN DEFAULT FALSE,
  attachment_count INTEGER DEFAULT 0,
  
  -- AI enrichment
  processing_status processing_status DEFAULT 'pending',
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  
  summary_bullets JSONB,                  -- ["bullet 1", "bullet 2", "bullet 3"]
  risk_level risk_level,
  risk_reasons TEXT[],
  priority_level priority_level,
  priority_reason TEXT,
  category email_category DEFAULT 'primary',
  
  -- Raw data (expires)
  raw_headers JSONB,
  body_expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  
  -- Search
  search_vector TSVECTOR,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, message_id)
);

-- LABELS
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- EMAIL_LABELS (many-to-many)
CREATE TABLE email_labels (
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (email_id, label_id)
);

-- SUGGESTED_EVENTS
CREATE TABLE suggested_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  location TEXT,
  description TEXT,
  gcal_event_id TEXT,
  confirmed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTACTS (built from sender history)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  display_name TEXT,
  interaction_count INTEGER DEFAULT 1,
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_address)
);

-- SECURITY_LOGS
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  detail JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES (critical for performance)
CREATE INDEX idx_emails_user_received ON emails(user_id, received_at DESC)
  WHERE is_deleted = FALSE;
CREATE INDEX idx_emails_user_thread ON emails(user_id, thread_id);
CREATE INDEX idx_emails_user_risk ON emails(user_id, risk_level)
  WHERE risk_level = 'high';
CREATE INDEX idx_emails_user_priority ON emails(user_id, priority_level);
CREATE INDEX idx_emails_snoozed ON emails(snoozed_until)
  WHERE is_snoozed = TRUE;
CREATE INDEX idx_emails_processing ON emails(processing_status)
  WHERE processing_status IN ('pending', 'processing');
CREATE INDEX idx_emails_search ON emails USING GIN(search_vector);
CREATE INDEX idx_contacts_user ON contacts(user_id, interaction_count DESC);

-- FULL TEXT SEARCH TRIGGER
CREATE OR REPLACE FUNCTION update_email_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.subject, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.sender_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.sender_email, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.preview_snippet, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_search_update
BEFORE INSERT OR UPDATE OF subject, sender_name, sender_email, preview_snippet
ON emails
FOR EACH ROW EXECUTE FUNCTION update_email_search_vector();
```

```sql
-- migrations/002_rls_policies.sql
-- Row Level Security — users can ONLY access their own data

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggested_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Policy pattern: auth.uid() must match user_id
-- (repeat this pattern for all tables)
CREATE POLICY "Users can only access own data"
ON emails FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Write equivalent policies for every table above.
-- Test: attempt to read User B's emails with User A's JWT — must return 0 rows.
```

```sql
-- migrations/004_cron_jobs.sql
-- Requires pg_cron extension (enable in Supabase dashboard)

-- Expire email body data (data minimization compliance)
SELECT cron.schedule(
  'expire-email-bodies',
  '0 2 * * *',  -- 2am daily
  $$UPDATE emails SET raw_headers = NULL, preview_snippet = LEFT(preview_snippet, 200)
    WHERE body_expires_at < NOW() AND raw_headers IS NOT NULL$$
);

-- Un-snooze emails
SELECT cron.schedule(
  'unsnooze-emails',
  '* * * * *',  -- every minute
  $$UPDATE emails SET is_snoozed = FALSE, snoozed_until = NULL
    WHERE is_snoozed = TRUE AND snoozed_until <= NOW()$$
);
```

### 3.4 — API Design (all endpoints, fully documented)

```
AUTH
  POST   /auth/callback/google          OAuth callback, exchange code for tokens
  POST   /auth/link/gmail               Link Gmail to existing account
  GET    /auth/callback/gmail           Gmail OAuth callback
  POST   /auth/link/outlook             Link Outlook account
  GET    /auth/callback/outlook         Outlook OAuth callback
  DELETE /auth/accounts/:id             Unlink an email account
  GET    /auth/accounts                 List linked accounts

EMAILS
  GET    /emails                        List emails (cursor-paginated)
    ?account_id=&category=&filter=unread|starred|high_risk|snoozed
    ?label_id=&cursor=&limit=50
  GET    /emails/:id                    Get single email with full detail
  PATCH  /emails/:id                    Update email state (read, starred, archived)
  DELETE /emails/:id                    Move to trash
  POST   /emails/:id/snooze             Set snooze time
  DELETE /emails/:id/snooze             Cancel snooze
  GET    /emails/thread/:thread_id      Get all emails in a thread

COMPOSE
  POST   /compose/send                  Send new email
  POST   /compose/reply                 Reply to email
  POST   /compose/forward               Forward email
  GET    /compose/drafts                List drafts
  POST   /compose/drafts                Save draft
  PUT    /compose/drafts/:id            Update draft
  DELETE /compose/drafts/:id            Delete draft

SEARCH
  GET    /search?q=&limit=20            Full-text search across emails

LABELS
  GET    /labels                        List user labels
  POST   /labels                        Create label
  PUT    /labels/:id                    Update label
  DELETE /labels/:id                    Delete label
  POST   /emails/:id/labels/:label_id   Add label to email
  DELETE /emails/:id/labels/:label_id   Remove label from email

CALENDAR
  POST   /calendar/events/:id/confirm   Confirm suggested event → create in GCal
  DELETE /calendar/events/:id           Dismiss suggested event

WEBHOOKS
  POST   /webhooks/gmail                Gmail Pub/Sub push endpoint
  POST   /webhooks/outlook              Microsoft Graph change notification

SYNC
  POST   /sync/account/:id             Trigger manual full sync for an account

HEALTH
  GET    /health                        { status: "ok", version, uptime }
  GET    /ready                         Readiness check (DB + Redis connectivity)
```

All endpoints must have: Pydantic/Go struct request validation, auth middleware (except webhooks), rate limiting, structured error responses `{ error: { code, message, details } }`, and are documented via auto-generated OpenAPI/Swagger.

### 3.5 — Performance & Resilience (non-negotiable)

```
Connection Pooling: pgx pool with min=5, max=20 connections
Redis: all queue operations use pipelines where possible
HTTP Clients: all external API calls use connection-reused clients (not new client per request)
Gemini: circuit breaker — 5 failures in 60s → open for 2min → half-open → close
        retry: 2 attempts, exponential backoff 1s → 2s
        timeout: 15s per request
Rate Limiting:
  - /emails: 120 req/min per user
  - /compose/send: 20 req/min per user  
  - /auth/*: 10 req/min per IP
  - /webhooks/*: no limit (validate HMAC signature instead)
Structured Logging: every request logs: method, path, status, latency, user_id
```

---

## PHASE 4 — FRONTEND IMPLEMENTATION

### 4.1 — State Architecture

```typescript
// uiStore.ts — client/UI state only
interface UIStore {
  // Layout
  sidebarOpen: boolean
  detailPanelOpen: boolean
  activeCategory: EmailCategory
  activeFilter: 'all' | 'unread' | 'starred' | 'high_risk' | 'snoozed'
  activeLabelId: string | null

  // Selection
  selectedEmailId: string | null
  selectedThreadId: string | null

  // Compose
  composeOpen: boolean
  composeMinimized: boolean
  composeData: ComposeData | null    // prefilled for reply/forward

  // Modals
  searchOpen: boolean
  shortcutsHelpOpen: boolean
  calendarModalEvent: SuggestedEvent | null
  snoozeModalEmailId: string | null

  // Optimistic state
  pendingArchives: Set<string>
  pendingDeletes: Set<string>
  pendingReads: Map<string, boolean>

  // Undo send
  pendingSend: { emailData: any, cancelFn: () => void } | null

  // Actions (all defined here)
}

// authStore.ts — auth state
interface AuthStore {
  user: SupabaseUser | null
  linkedAccounts: LinkedAccount[]
  isLoadingAuth: boolean
  setUser: (user: SupabaseUser | null) => void
  setLinkedAccounts: (accounts: LinkedAccount[]) => void
}
```

### 4.2 — Frontend Performance Requirements

```
Virtual scroll: @tanstack/react-virtual for EmailRow list
                never render more than 20 EmailRow DOM nodes simultaneously

Memoization:    every EmailRow wrapped in React.memo
                Zustand selectors use shallow equality
                TanStack Query staleTime: 30s for email list, Infinity for labels

Prefetch:       hover EmailRow for 200ms → prefetchQuery for email detail
                on app load → prefetch first 50 emails immediately

Optimistic UI:  archive, delete, mark-read, star → instant UI update
                rollback with error toast if API fails

Code splitting: Dashboard, Settings, Onboarding → React.lazy
                Login page bundle < 60KB gzipped

Real-time:      Supabase channel subscription for new emails + processing updates
                no polling anywhere — zero setInterval calls for data fetching

Accessibility:  all interactive elements have aria-label
                keyboard navigation works without a mouse
                focus rings visible (never outline: none without alternative)
                color is never the only indicator of meaning
```

### 4.3 — Animation Principles

Every animation must feel intentional, fast, and premium. Implement these specific interactions:

- **Email arrives in inbox:** slides in from top with 240ms ease-out, subtle opacity fade
- **Email archived:** slides out to the left, adjacent emails close the gap smoothly
- **Compose modal opens:** scale from 0.95 + opacity 0 → 1 in 200ms
- **Compose minimized:** shrinks to pill in bottom-right corner with spring easing
- **AI summary reveals:** 3 bullets stagger in 80ms apart, fade + slight upward translate
- **Risk banner enters:** slides down from top of email body, 200ms
- **Toast notification:** slides in from bottom-right, progress bar depletes, slides out
- **Search modal:** backdrop blurs in 150ms, modal scales from 0.96 in 200ms
- **Category tab switch:** sliding indicator animates between tabs (like Linear's nav)
- **Skeleton → content:** cross-fade, not flash/pop
- **Sidebar collapse:** smooth width transition, icons remain centered
- **Theme switch:** smooth color interpolation via CSS transitions on custom properties

Use `framer-motion` for complex animations. Use CSS transitions for simple hover/state changes. Never use `setTimeout` to fake animations.

---

## PHASE 5 — USER GUIDE (produce this as `docs/USER_GUIDE.md`)

Write a comprehensive, beautifully structured user guide. This is not a README. This is a document that a non-technical university student can read and understand. It must cover every single feature of the application.

**Structure:**

```markdown
# UniSync User Guide

## Welcome to UniSync
[What it is, why it exists, what problems it solves]

## Getting Started
### Creating Your Account
### Linking Your Gmail Account (step by step with what to expect)
### Linking Your Outlook Account
### Understanding the Onboarding Flow

## The Inbox
### Reading Emails
### Understanding the Email Row (what each element means)
### Switching Between Accounts
### Category Tabs (Primary, Updates, Promotions, Social, Forums)
### Filtering Your Inbox
### Threading (conversation view)
### Marking as Read / Unread
### Starring Emails

## AI Features
### Email Summaries (what they are, when they appear, what the bullets mean)
### Priority Analysis (how it works, what High/Medium/Low means)
### Security & Phishing Detection
  #### Understanding Risk Scores
  #### What to Do With a High-Risk Email
  #### Why Links Are Blocked on High-Risk Emails
### Smart Categories (how AI decides where to put emails)

## Organizing Your Inbox
### Archiving Emails
### Deleting Emails
### Snoozing Emails (how to snooze, presets, custom time)
### Labels & Tags (creating, applying, color-coding)
### Searching Your Emails (basic search, advanced filters, syntax guide)

## Composing Emails
### Writing a New Email
### Replying and Replying All
### Forwarding
### Using the Rich Text Editor (all formatting options)
### Adding Attachments
### CC and BCC
### Undo Send (how it works, how to use it)

## Calendar Integration
### Connecting Google Calendar
### Understanding Suggested Events
### Adding Events to Your Calendar
### Editing Before Confirming
### Dismissing Suggestions

## Keyboard Shortcuts
[Full shortcuts table, organized by category]

## Settings
### Profile Settings
### Managing Linked Accounts
### AI Preferences (toggle features on/off)
### Appearance (light/dark/system, font size)
### Notification Settings
### Privacy & Data (what is stored, what expires, how to delete your data)

## Security & Privacy
### How UniSync Protects Your Data
### OAuth Permissions Explained (what we access and why)
### Data Retention Policy
### How to Revoke Access

## Troubleshooting
### Email Not Appearing in UniSync
### AI Features Not Working
### Calendar Sync Failed
### Can't Link Outlook Account
### How to Report a Bug

## FAQ
[10+ common questions with clear answers]
```

The guide must be written in plain, warm, helpful language. No jargon. Include callout boxes for important notes/warnings. Assume the reader has never used a third-party email client before.

---

## PHASE 6 — DEVOPS & DOCUMENTATION

### 6.1 — Railway Deployment Config

```json
// railway.json
{
  "services": {
    "frontend": {
      "buildCommand": "cd frontend && npm ci && npm run build",
      "startCommand": "cd frontend && npx serve dist",
      "healthcheckPath": "/"
    },
    "api": {
      "buildCommand": "cd backend && go build -o ./bin/api ./cmd/api",
      "startCommand": "./backend/bin/api",
      "healthcheckPath": "/health"
    },
    "worker": {
      "buildCommand": "cd backend && go build -o ./bin/worker ./cmd/worker",
      "startCommand": "./backend/bin/worker"
    },
    "redis": {
      "image": "redis:7-alpine"
    }
  }
}
```

### 6.2 — CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
# Runs on every PR to main:
# - Frontend: TypeScript type-check, ESLint, Vitest unit tests, build
# - Backend: go vet, golangci-lint, go test ./...
# - Fail fast: any failure blocks the PR

# .github/workflows/deploy.yml
# Runs on merge to main:
# - Runs CI checks first
# - Deploys to Railway via Railway CLI
# - Runs DB migrations via supabase db push
# - Posts deploy status to PR comment
```

### 6.3 — Environment Variables Reference (`.env.example`)

Document every single environment variable with:
- Variable name
- What it's for
- How to obtain it
- Whether it's required or optional
- Example format (never real values)

Minimum variables to document:
```
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Google (Gmail + Calendar)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_PUBSUB_TOPIC=
GOOGLE_CLOUD_PROJECT=

# Microsoft (Outlook)
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=

# Google Gemini
GEMINI_API_KEY=

# Redis
REDIS_URL=

# Security
TOKEN_ENCRYPTION_KEY=          # 32-byte hex key for AES-256-GCM
JWT_SECRET=                    # For internal token signing

# App
API_BASE_URL=
FRONTEND_URL=
ENVIRONMENT=development|production
```

### 6.4 — README Architecture

The README must include:

1. Project overview (2 sentences)
2. Feature list (comprehensive)
3. Architecture diagram in Mermaid showing: Frontend → API → Workers → DB, Webhooks → Queue → Workers, Gemini API ← Workers, Supabase Realtime → Frontend
4. ERD diagram in Mermaid (all tables + relationships)
5. Quick start (local dev in under 5 commands)
6. Environment setup guide
7. Deployment guide (Railway)
8. API reference link (Swagger UI)
9. Contributing guide

### 6.5 — Storybook

Every component in `components/primitives/` must have a Storybook story covering:
- Default state
- All variants
- All sizes
- All interactive states (hover, active, disabled, loading, error)
- Dark mode variant

Use `@storybook/addon-themes` for theme switching in Storybook.

---

## FINAL MANDATE

You are not done until:

- [ ] Every route returns real data, not mocks
- [ ] Every component renders without errors in light and dark mode
- [ ] Every keyboard shortcut works
- [ ] The compose modal opens, you can type, attach a file, and send
- [ ] A new email arriving via webhook appears in the inbox within 3 seconds
- [ ] The AI summary appears on an email within 10 seconds of arrival
- [ ] A high-risk email shows the risk banner and blocks links
- [ ] Snoozing an email removes it and it returns at the right time
- [ ] Search returns results as you type
- [ ] The app works on mobile Chrome at 390px viewport width
- [ ] All CI checks pass
- [ ] `docker-compose up` starts the full local dev environment
- [ ] The User Guide covers every feature without gaps

The standard is: a university student with no technical knowledge can sign up, link their Gmail, and have a working premium mail client in under 3 minutes. And a senior engineer reading the codebase can understand every architectural decision without asking anyone.

Now begin with Phase 0. Think deeply. Commit to your stack. Then build.
