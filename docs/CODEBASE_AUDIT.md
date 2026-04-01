# UniSync Codebase Audit

Static review of the current backend and frontend code.

## High Priority Findings

### 1. Auth accepts unsigned JWTs after verification fails

- Files: [backend/app/auth.py](/Users/bhavya_agarwal/Desktop/Unisync/backend/app/auth.py), [backend/app/routers/realtime.py](/Users/bhavya_agarwal/Desktop/Unisync/backend/app/routers/realtime.py)
- Problem: both token decoders first try the Supabase signing secret, then fall back to `jwt.decode(..., verify_signature=False)`.
- Impact: a forged JWT can be accepted as long as it contains a `sub` claim. That is a direct authentication bypass.
- Fix: remove the unsigned-token fallback and reject any token that cannot be verified cryptographically.

### 2. Email detail rendering can execute injected HTML

- Files: [frontend/src/components/inbox/EmailDetail.tsx](/Users/bhavya_agarwal/Desktop/Unisync/frontend/src/components/inbox/EmailDetail.tsx), [frontend/src/components/mail-ui/EmailViewer.tsx](/Users/bhavya_agarwal/Desktop/Unisync/frontend/src/components/mail-ui/EmailViewer.tsx)
- Problem: `EmailDetail` rendered `email.body_html` with `dangerouslySetInnerHTML` and no sanitization.
- Impact: if this component is used with untrusted email content, it is vulnerable to XSS. `EmailViewer` already had a sanitizer, so the codebase was inconsistent here.
- Status: fixed in [frontend/src/components/inbox/EmailDetail.tsx](/Users/bhavya_agarwal/Desktop/Unisync/frontend/src/components/inbox/EmailDetail.tsx).
- Change: email HTML is now sanitized with DOMPurify, anchors are forced to `noopener noreferrer`, and the component only renders the body when sanitized output is available.

### 3. Outlook webhooks attach notifications to the newest Outlook account, not the correct account

- Files: [backend/app/routers/webhooks.py](/Users/bhavya_agarwal/Desktop/Unisync/backend/app/routers/webhooks.py), [backend/migrations/001_init.sql](/Users/bhavya_agarwal/Desktop/Unisync/backend/migrations/001_init.sql)
- Problem: the Outlook webhook previously fetched `limit=1` ordered by `created_at.desc` for all Outlook accounts, then stored the email under that account.
- Impact: if a user links more than one Outlook account, inbound mail can be attributed to the wrong mailbox.
- Status: fixed in [backend/app/routers/webhooks.py](/Users/bhavya_agarwal/Desktop/Unisync/backend/app/routers/webhooks.py).
- Change: webhook notifications now resolve the linked account by `subscriptionId`, which Microsoft Graph includes in the notification payload.

### 4. Webhook signature checks are disabled when `WEBHOOK_SECRET` is missing

- Files: [backend/app/webhook_security.py](/Users/bhavya_agarwal/Desktop/Unisync/backend/app/webhook_security.py), [backend/app/routers/webhooks.py](/Users/bhavya_agarwal/Desktop/Unisync/backend/app/routers/webhooks.py)
- Problem: `verify_signature` returned immediately if `settings.webhook_secret` was unset.
- Impact: a misconfigured deployment silently disabled webhook authentication entirely.
- Status: fixed in [backend/app/webhook_security.py](/Users/bhavya_agarwal/Desktop/Unisync/backend/app/webhook_security.py).
- Change: webhook requests now fail with a server misconfiguration error when the secret is missing, so the endpoint no longer accepts unsigned payloads by accident.

## Medium Priority Improvements

### 5. WebSocket auth token is passed in the URL query string

- Files: [frontend/src/pages/Dashboard.tsx](/Users/bhavya_agarwal/Desktop/Unisync/frontend/src/pages/Dashboard.tsx), [backend/app/routers/realtime.py](/Users/bhavya_agarwal/Desktop/Unisync/backend/app/routers/realtime.py)
- Problem: the browser previously opened `/ws?token=...`.
- Risk: tokens in URLs are easier to leak through logs, browser history, proxy tooling, and referer-related surfaces.
- Status: fixed in [frontend/src/pages/Dashboard.tsx](/Users/bhavya_agarwal/Desktop/Unisync/frontend/src/pages/Dashboard.tsx) and [backend/app/routers/realtime.py](/Users/bhavya_agarwal/Desktop/Unisync/backend/app/routers/realtime.py).
- Change: the client now passes the access token as the WebSocket subprotocol and the server reads it from the `Sec-WebSocket-Protocol` handshake header, so the token no longer appears in the URL.

### 6. `apiFetch` always forces `Content-Type: application/json`

- File: [frontend/src/lib/api.ts](/Users/bhavya_agarwal/Desktop/Unisync/frontend/src/lib/api.ts)
- Problem: the helper used to set JSON content type for every request, regardless of body type.
- Impact: this would break `FormData`, file uploads, and any non-JSON POST in the future.
- Status: fixed in [frontend/src/lib/api.ts](/Users/bhavya_agarwal/Desktop/Unisync/frontend/src/lib/api.ts).
- Change: `apiFetch` now preserves caller-provided headers and only defaults to `application/json` when the body is a plain JSON payload.

### 7. Search requests do not handle failures explicitly

- File: [frontend/src/components/search/SearchCommand.tsx](/Users/bhavya_agarwal/Desktop/Unisync/frontend/src/components/search/SearchCommand.tsx)
- Problem: the debounced search call has no `try/catch`.
- Impact: a network or backend error can surface as an unhandled rejection and leave the search modal in a stale state.
- Improvement: catch the error, clear results, and show a small inline error state.

### 8. Malformed `summary_bullets` can crash the mail preview and detail view

- Files: [frontend/src/components/mail-ui/MailPreview.tsx](/Users/bhavya_agarwal/Desktop/Unisync/frontend/src/components/mail-ui/MailPreview.tsx), [frontend/src/components/inbox/EmailDetail.tsx](/Users/bhavya_agarwal/Desktop/Unisync/frontend/src/components/inbox/EmailDetail.tsx)
- Problem: both components previously used raw `JSON.parse` on `summary_bullets`.
- Impact: malformed backend data could crash the inbox preview and the detail pane while rendering an email.
- Status: fixed by adding a shared safe parser in [frontend/src/lib/json.ts](/Users/bhavya_agarwal/Desktop/Unisync/frontend/src/lib/json.ts).
- Change: `summary_bullets` now falls back to an empty list when parsing fails, so the UI stays usable even if the stored value is malformed.

### 9. Malformed webhook and cursor values could crash request handlers

- Files: [backend/app/routers/webhooks.py](/Users/bhavya_agarwal/Desktop/Unisync/backend/app/routers/webhooks.py), [backend/app/routers/emails.py](/Users/bhavya_agarwal/Desktop/Unisync/backend/app/routers/emails.py), [backend/app/routers/calendar.py](/Users/bhavya_agarwal/Desktop/Unisync/backend/app/routers/calendar.py), [backend/app/routers/compose.py](/Users/bhavya_agarwal/Desktop/Unisync/backend/app/routers/compose.py)
- Problem: webhook payload parsing, attachment decoding, and cursor/date parsing previously assumed well-formed input.
- Impact: malformed webhook bodies, invalid attachment payloads, or bad cursor/date strings could raise exceptions and return 500s instead of clean client errors.
- Status: fixed in the listed router files.
- Change: webhook payloads now return 400 on malformed JSON/base64 input, compose rejects invalid attachment payloads, cursor parsing falls back to `None`, and invalid calendar timestamps return clear bad-request errors.

## Notes

- I did not run the full test suite for this audit.
- The codebase also uses a lot of `any` in the frontend state and props. That is not a runtime bug by itself, but it makes regressions harder to catch and is worth tightening over time.

## Completed Fixes

- Removed the unsigned JWT fallback from the backend auth path and realtime WebSocket auth.
- Sanitized `EmailDetail` HTML rendering to remove the direct XSS sink.
- Routed Outlook webhook events to the correct linked account using `subscriptionId`.
- Made webhook signature verification fail closed when `WEBHOOK_SECRET` is not configured.
- Moved WebSocket auth off the query string and into the WebSocket subprotocol handshake.
- Updated `apiFetch` to stop forcing JSON headers onto non-JSON requests.
- Added safe parsing for `summary_bullets` in the mail preview and detail views.
- Removed a dead no-op branch from the mail preview and a redundant console log from Gmail linking.
- Hardened webhook, cursor, and calendar parsing against malformed input.
- Validated compose attachment payloads before encoding them into outgoing messages.
