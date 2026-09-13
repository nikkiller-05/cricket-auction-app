# GoldenBidX — Multi-Tenant Roadmap

Reference studied: auctionarena.in (per-organizer, per-auction platform).

## Current limitation
- The app runs **one auction at a time**. Live state is a single global in `backend/services/dataService.js` (in-memory + Supabase snapshot). Not multi-tenant.
- Registrations are already multi-event (`auction_events` + `player_registrations` + organizer accounts), but the **live auction itself is singular**.

## Goal
Multi-tenant: each organizer can create and run many auctions, each with its own public live page, operator (admin) screen, and player registration — similar to auctionarena.in.

## Phased plan (phase-wise, do NOT implement all at once)

### Phase A — Branding & foundations ✅ (done)
Landing page style, branding, registrations/organizers, email reset, welcome email.

### Phase B — Auctions as first-class entities
- New `auctions` table: `id`/`slug`, `organizer_id`, `config` (JSON), `status`, `created_at`.
- Move players / teams / bidding state to be scoped **per `auction_id`** (DB-backed, not a global).
- Socket.io **rooms per auction** so live updates are isolated.

### Phase C — Organizer multi-auction dashboard
Create / list / manage many auctions; each links to its live page + operator screen.

### Phase D — Public auction pages + listings
- `/a/{slug}` public live view.
- Upcoming / Live / Completed auction lists on the site with cards (date, venue, teams, player pool, views).

### Phase E — Monetization
Per-event pricing tiers by team count (e.g. free ≤3 teams, then paid tiers).

### Phase F — Extras
WhatsApp alerts, spin-the-wheel for unsold, streaming overlay, custom themes, team/player posters, replay.

## Can do now (no multi-auction backend needed)
Stats bar, features grid, screenshots/mockups section, pricing placeholder, testimonials, richer footer (product/company/support links + socials).
