# Architectural Improvements Over the SRS

## Push-based ingestion only
- Gmail uses Pub/Sub push notifications and Outlook uses Graph change notifications; no polling anywhere.

## Event-driven ingestion pipeline
- Webhook receives payload, validates signature, stores minimal email metadata, enqueues processing, and emits a realtime event on completion.

## AI resilience and fallbacks
- Each AI step has a timeout, retry with exponential backoff, and a null-safe fallback so the app never blocks on Gemini.
- A circuit breaker halts Gemini calls after repeated failures for a short cooldown window.

## Realtime-first UI
- WebSocket updates stream new emails and AI processing status so the UI never polls.

## Schema and API are future-proof
- Data model supports compose/send, threading, labels, snooze, undo send, full-text search, attachments, keyboard shortcuts, categories, AI summary, priority, phishing detection, and calendar sync from day one.

## Product improvements beyond the SRS
1) Deadline Radar: extracted dates and deadlines are aggregated into a weekly digest with conflict detection.
2) Focus Mode: temporary inbox filter that hides low-priority and promotional mail during study sessions.
3) Privacy Guard: optional client-side redaction of sensitive fields before AI processing.
