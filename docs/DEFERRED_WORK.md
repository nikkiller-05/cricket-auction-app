# Deferred Work & Parked Decisions

Living TODO for work we intentionally postponed. Nothing here blocks shipping —
these are picked up later, most of them **with a purpose** during feature work
rather than as standalone refactors.

_Last updated: 2026-09-11_

## Deferred restructuring (do later, ideally as part of multi-auction)

1. **Live-bidding hooks extraction** — pull the inline bidding logic in
   `UnifiedDashboard` (team bids, custom/big bid, sell, unsold, keyboard
   shortcuts, optimistic updates) into `useBidding` / `useAuctionData` /
   `useTransactionHistory` hooks.
   - Why deferred: high-risk (runs on the live money path), zero user-facing
     value on its own. Best done when multi-auction forces a clean seam.

2. **Deep React Query wiring** — migrate the live dashboard off manual
   `socket + useState` onto the React Query cache with socket invalidation +
   optimistic mutations.
   - Foundation already in place (safe to build on): `lib/queryClient.js`,
     `lib/queryKeys.js`, `QueryClientProvider` in `App.js`, and
     `features/auction/hooks/useAuction.js` (+ test). These are intentionally
     kept even though not yet wired into the dashboard.

3. **Next.js migration** — only if we want SSR/SEO for public auction pages.
   Fully independent; can be skipped entirely (CRA works fine) or replaced by
   adding SSR pages when public listings are built.

## Intentionally-kept scaffolding (not dead code — leave in place)

- `frontend/src/features/auction/hooks/useAuction.js` — React Query hook for the
  deferred deep-wiring (has a co-located test).
- `frontend/src/lib/socket.js` — single shared socket helper for the deferred
  socket wiring.

## Future feature ideas (competitive roadmap)

- Spin-the-wheel for unsold players (self-contained, high-wow).
- Shareable team/player posters (extends existing squad PNG export).
- WhatsApp alerts on sale/registration.
- Multi-auction / multi-tenant: each organizer runs many auctions with public
  live pages + Upcoming/Live/Completed listings. This is the strategic moat and
  where the two deferred refactors above naturally get done.

## Housekeeping done 2026-09-11

- Removed dead legacy files superseded by `UnifiedDashboard` + the new
  `features/`, `lib/` structure: `AdminLogin.js`, `AuctionControls.js`,
  `UndoControls.js`, `TeamsDisplay.js`, `PlayerStatsStrip.js`, and the unused
  `Header.js` / `Header.css` / `HeaderExample.js` demo cluster.
