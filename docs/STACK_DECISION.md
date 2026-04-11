# UniSync Stack Decision

## Summary
- Frontend: React + Vite + TypeScript with CSS variables and CSS modules for strict theming, plus Framer Motion for motion.
- Backend: Node.js 20 + TypeScript + Express for API routes, provider integrations, and realtime delivery.
- Auth: Supabase Auth (email/password + Google OAuth), verified via JWT.
- Database: Postgres (Supabase), accessed via `pg` and Supabase REST helpers.
- Cache/Queue: Redis plus an in-process async job pipeline for email enrichment and cache invalidation.
- Real-time: Express HTTP server paired with a `ws` WebSocket gateway for instant UI updates.
- Search: Postgres tsvector with GIN indexes for full-text search.
- File storage: Supabase Storage for attachments.

## Rationale (one sentence each)
- React + Vite + TypeScript gives fast iteration, strong typing, and a clean component architecture.
- Express + TypeScript keeps the backend aligned with the rest of the stack and is straightforward to deploy on Node-first platforms.
- Supabase Auth consolidates auth and database concerns while providing first-class Google OAuth.
- Postgres plus Supabase REST keeps the data layer simple while preserving direct SQL control for complex flows.
- Redis handles cache invalidation and realtime fan-out without requiring a separate worker runtime in the current architecture.
- A WebSocket gateway avoids polling and enables live processing updates with minimal client overhead.
- Postgres tsvector delivers fast, built-in full-text search without extra infrastructure.
- Supabase Storage keeps attachments and access controls aligned with the auth system.
