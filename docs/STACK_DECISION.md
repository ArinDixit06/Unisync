# UniSync Stack Decision

## Summary
- Frontend: React + Vite + TypeScript with CSS variables and CSS modules for strict theming, plus Framer Motion for motion.
- Backend: Python 3.11 + FastAPI (async) with Pydantic v2 for validation and OpenAPI.
- Auth: Supabase Auth (email/password + Google OAuth), verified via JWT.
- Database: Postgres (Supabase), accessed via asyncpg pool (min=5, max=20).
- Cache/Queue: Redis + arq for background jobs, retries, and scheduled tasks.
- Real-time: FastAPI WebSocket gateway for instant UI updates; optional Supabase Realtime if preferred.
- Search: Postgres tsvector with GIN indexes for full-text search.
- File storage: Supabase Storage for attachments.

## Rationale (one sentence each)
- React + Vite + TypeScript gives fast iteration, strong typing, and a clean component architecture.
- FastAPI provides async I/O, excellent OpenAPI docs, and structured validation with minimal boilerplate.
- Supabase Auth consolidates auth and database concerns while providing first-class Google OAuth.
- Postgres with asyncpg pool meets the performance requirements with explicit min/max connections.
- Redis + arq is lightweight, async-native, and supports retries and timeouts needed for AI resilience.
- A WebSocket gateway avoids polling and enables live processing updates with minimal client overhead.
- Postgres tsvector delivers fast, built-in full-text search without extra infrastructure.
- Supabase Storage keeps attachments and access controls aligned with the auth system.
