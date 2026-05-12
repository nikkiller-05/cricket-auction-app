import React, { useMemo } from 'react';
import PlayerAvatar from './PlayerAvatar';

/**
 * LiveBiddingCard
 * Modern, responsive hero card for the active player + current bid.
 * Inspired by the test.html mockup: glass-morphism card with avatar,
 * meta line, stat grid, and a side bid panel.
 *
 * Props:
 *   - player: the player being bid on
 *   - currentAmount: number
 *   - leadingTeamName: string | null
 *   - leadingTeamBudget: number | null
 *   - isFastTrack: boolean
 *   - rightSlot: optional ReactNode rendered below the bid panel (e.g. team bid buttons)
 */
const Stat = ({ label, value }) => (
  <div className="group relative flex flex-col items-center justify-center text-center rounded-xl px-2.5 py-1.5 sm:py-2 min-w-[58px] bg-gradient-to-br from-white/20 to-white/5 border border-white/25 shadow-md hover:shadow-lg hover:from-white/30 hover:-translate-y-0.5 transition-all duration-300">
    <div className="absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    <div className="text-sm sm:text-base md:text-lg font-extrabold leading-tight text-white drop-shadow-sm">
      {value}
    </div>
    <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] opacity-75 mt-0.5 font-semibold">
      {label}
    </div>
  </div>
);

const buildStats = (p = {}) => {
  // Always render every stat slot; "—" means missing so the card layout
  // stays stable across players regardless of which stats are populated.
  const dash = (v) =>
    v === undefined || v === null || String(v).trim() === '' ? '—' : v;
  return [
    { label: 'Matches', value: dash(p.matches) },
    { label: 'Runs', value: dash(p.runs) },
    { label: 'Wickets', value: dash(p.wickets) },
    { label: 'Avg', value: dash(p.battingAvg) },
    { label: 'HS', value: dash(p.highestScore) },
    { label: 'SR', value: dash(p.strikeRate) },
    { label: 'Econ', value: dash(p.economy) },
    { label: 'BB', value: dash(p.bestBowling) },
  ];
};

const LiveBiddingCard = ({
  player,
  currentAmount,
  leadingTeamName,
  leadingTeamBudget,
  isFastTrack = false,
  rightSlot = null,
}) => {
  if (!player) return null;
  return <LiveBiddingCardInner
    player={player}
    currentAmount={currentAmount}
    leadingTeamName={leadingTeamName}
    leadingTeamBudget={leadingTeamBudget}
    isFastTrack={isFastTrack}
    rightSlot={rightSlot}
  />;
};

const LiveBiddingCardInner = ({
  player,
  currentAmount,
  leadingTeamName,
  leadingTeamBudget,
  isFastTrack,
  rightSlot,
}) => {
  // Intentional fine-grained deps so the memo only invalidates when a
  // displayed stat actually changes, not on every new player object identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats = useMemo(() => buildStats(player), [
    player.matches,
    player.runs,
    player.wickets,
    player.battingAvg,
    player.highestScore,
    player.strikeRate,
    player.economy,
    player.bestBowling,
  ]);
  const meta = useMemo(
    () => [player.role, player.battingHand, player.bowlingStyle].filter(Boolean).join(' · '),
    [player.role, player.battingHand, player.bowlingStyle]
  );

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-white/15 mb-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white">
      {/* Top shine accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 bg-fuchsia-500/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="pointer-events-none absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

      {/* Header bar */}
      <div className="relative flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
          </span>
          <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-[0.2em] uppercase bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
            Live Bidding
          </h2>
          {isFastTrack && (
            <span className="ml-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/40 uppercase tracking-wider border border-orange-300/50">
              ⚡ Fast Track
            </span>
          )}
        </div>
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6 pt-4">
        {/* Player profile (spans 2 cols on lg) */}
        <div className="lg:col-span-2 relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          {/* Avatar with animated ring */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 blur-xl opacity-80 animate-pulse" style={{ animationDuration: '3s' }} />
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-cyan-300 via-fuchsia-400 to-amber-300 opacity-90" />
            <div className="relative">
              <PlayerAvatar player={player} size="xl" className="border-4 border-white shadow-2xl ring-2 ring-white/30" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              {player.cricHeroesLink ? (
                <a
                  href={player.cricHeroesLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent hover:from-cyan-200 hover:to-cyan-200 transition-all break-words"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {player.name}
                </a>
              ) : (
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent break-words">
                  {player.name}
                </h3>
              )}
              {player.category && (
                <span className="mt-1 sm:mt-0 inline-block text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500/30 to-fuchsia-500/30 border border-white/30 backdrop-blur-sm shadow-lg">
                  {player.category === 'wicket-keeper' ? 'Keeper' : player.category}
                </span>
              )}
            </div>

            {meta && (
              <p className="mt-1 text-sm sm:text-base text-white/85 font-medium">{meta}</p>
            )}
            {player.city && (
              <p className="mt-0.5 text-xs sm:text-sm text-white/70">📍 {player.city}</p>
            )}

            {stats.length > 0 ? (
              <div className="mt-3 sm:mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                {stats.map((s) => (
                  <Stat key={s.label} label={s.label} value={s.value} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-white/60 italic">No career stats available</p>
            )}
          </div>
        </div>

        {/* Bid panel */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Current Bid - emerald hero */}
          <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-emerald-300/60 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl" />
            <div className="relative p-4 sm:p-5 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-base">💰</span>
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] font-bold text-white/95">
                  Current Bid
                </p>
              </div>
              <p
                className="text-3xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                style={{ animation: 'bidAmountPulse 1.5s ease-in-out infinite' }}
              >
                ₹{currentAmount ?? 0}
              </p>
            </div>
          </div>

          {/* Leading Team - amber/orange contrast */}
          <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-amber-300/60 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500">
            <div className="absolute -top-6 -left-6 w-28 h-28 bg-yellow-200/30 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-rose-300/30 rounded-full blur-2xl" />
            <div className="relative p-4 sm:p-5 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-base">🏆</span>
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] font-bold text-white/95">
                  Leading Team
                </p>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)] truncate">
                {leadingTeamName || (
                  <span className="text-white/75 italic font-medium text-base sm:text-lg">
                    No bids yet
                  </span>
                )}
              </p>
              {leadingTeamBudget != null && leadingTeamName && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-sm border border-white/20">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-white/90">
                    Budget
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white">₹{leadingTeamBudget}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {rightSlot && (
        <div className="relative px-4 sm:px-6 pb-5 sm:pb-6">
          <div className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-white/20 shadow-2xl overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            {rightSlot}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(LiveBiddingCard);
