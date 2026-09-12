import React, { useEffect, useMemo, useRef, useState } from 'react';
import PlayerAvatar from '../../components/PlayerAvatar';
import { formatCurrency } from '../../lib/format';

// Fixed category options (reuse the backend player-model terminology).
const MODE_OPTIONS = [
  { value: 'all', label: 'All Remaining' },
  { value: 'batter', label: 'Batter' },
  { value: 'bowler', label: 'Bowler' },
  { value: 'allrounder', label: 'All-rounder' },
  { value: 'wicket-keeper', label: 'Wicket-keeper' },
];

const STAT_FIELDS = [
  { key: 'matches', label: 'Matches' },
  { key: 'runs', label: 'Runs' },
  { key: 'battingAvg', label: 'Average' },
  { key: 'strikeRate', label: 'SR' },
  { key: 'wickets', label: 'Wickets' },
  { key: 'economy', label: 'Economy' },
  { key: 'highestScore', label: 'HS' },
  { key: 'bestBowling', label: 'Best' },
];

const hasValue = (v) => v !== undefined && v !== null && String(v).trim() !== '' && String(v) !== '0';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Pre-bidding experience: Smart Random pick -> mystery card -> shuffle reveal ->
// Bid. Fully driven by the shared `selection` state so admins and spectators
// see the same thing; only admins get the action buttons.
const SmartRandomStage = ({
  players = [],
  selection = null,
  settings = {},
  isAdmin = false,
  mode = 'all',
  onModeChange = () => {},
  onPick = () => {},
  onReveal = () => {},
  onBid = () => {},
  busy = false,
}) => {
  const availablePlayers = useMemo(
    () => players.filter((p) => p.status === 'available' && p.category !== 'captain'),
    [players]
  );

  const eligibleCount = useMemo(
    () => availablePlayers.filter((p) => mode === 'all' || p.category === mode).length,
    [availablePlayers, mode]
  );

  const stage = selection?.stage || 'idle';
  const selectedPlayer = useMemo(
    () => (selection?.playerId ? players.find((p) => p.id === selection.playerId) : null),
    [players, selection?.playerId]
  );

  // A random remaining player used as a blurred teaser while idle.
  const idleTeaser = useMemo(() => {
    if (!availablePlayers.length) return null;
    return availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
  }, [availablePlayers]);

  // Image shuffle: cycle through remaining players, decelerate, land on the pick.
  const [shuffleImg, setShuffleImg] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (stage !== 'revealing' || !selectedPlayer) return undefined;
    const pool = availablePlayers.length ? availablePlayers : [selectedPlayer];
    if (prefersReducedMotion()) {
      setShuffleImg(selectedPlayer);
      return undefined;
    }
    let cancelled = false;
    const DURATION = 2300;
    const started = Date.now();
    setShuffleImg(pool[Math.floor(Math.random() * pool.length)]);
    const tick = () => {
      if (cancelled) return;
      const elapsed = Date.now() - started;
      if (elapsed >= DURATION) {
        setShuffleImg(selectedPlayer);
        return;
      }
      setShuffleImg(pool[Math.floor(Math.random() * pool.length)]);
      const progress = elapsed / DURATION;
      const delay = 55 + progress * progress * 280; // start fast, ease out
      timerRef.current = setTimeout(tick, delay);
    };
    timerRef.current = setTimeout(tick, 60);
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stage, selectedPlayer, availablePlayers]);

  const basePrice = settings?.basePrice ?? 0;

  return (
    <div className="gbx-live-card relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#0b0a06] via-[#1c1608] to-[#2a1f08] text-white shadow-2xl mb-8">
      {/* branded glow accents (match the live bidding card) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-yellow-600/20 blur-3xl" />

      <div className="relative flex items-center gap-2 px-5 pt-4">
        <span className="text-lg">🎯</span>
        <h2 className="bg-gradient-to-r from-amber-200 via-white to-amber-200 bg-clip-text text-sm font-bold uppercase tracking-[0.2em] text-transparent">
          Smart Player Pick
        </h2>
      </div>

      <div className={`relative grid gap-5 p-5 ${isAdmin ? 'md:grid-cols-2' : ''}`}>
        {/* LEFT: Smart Random control panel (admin only) */}
        {isAdmin && (
          <div className="flex flex-col justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-white/15 to-white/5 p-5 shadow-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-amber-200/80">
              Smart Random
            </p>
            <label className="mb-1 block text-xs font-semibold text-white/70">Pick from</label>
            <select
              value={mode}
              onChange={(e) => onModeChange(e.target.value)}
              disabled={stage !== 'idle' || busy}
              className="mb-4 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400/60 disabled:opacity-50 [&>option]:text-slate-900"
            >
              {MODE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <div className="mb-4 text-3xl font-extrabold text-white">
              {eligibleCount}
              <span className="ml-2 text-sm font-semibold text-white/50">players remaining</span>
            </div>

            <button
              type="button"
              onClick={onPick}
              disabled={stage !== 'idle' || busy || eligibleCount === 0}
              className="rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 px-5 py-3 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/30 transition hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {eligibleCount === 0 ? 'No players left' : '🎲 Pick Player'}
            </button>
          </div>
        )}

        {/* RIGHT: Mystery / Reveal card (everyone) */}
        <div
          className={`flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-white/15 to-white/5 p-5 text-center shadow-2xl ${
            isAdmin ? '' : 'mx-auto w-full max-w-2xl'
          }`}
        >
          {stage === 'idle' && (
            <>
              <div className="relative mb-4">
                {idleTeaser ? (
                  <div
                    style={{ filter: 'blur(18px)' }}
                    className="pointer-events-none select-none opacity-80"
                  >
                    <PlayerAvatar player={idleTeaser} size="2xl" shape="rounded" />
                  </div>
                ) : (
                  <div className="text-6xl">🎴</div>
                )}
              </div>
              <p className="text-sm font-semibold text-white/60">The Player will appear here.</p>
            </>
          )}

          {stage === 'selected' && selectedPlayer && (
            <>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
                Mystery Player
              </p>
              <div className="relative mb-4">
                <div style={{ filter: 'blur(16px)' }} className="pointer-events-none select-none">
                  <PlayerAvatar player={selectedPlayer} size="2xl" shape="rounded" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-5xl">🔒</div>
              </div>
              <div className="mb-5 text-2xl font-extrabold tracking-widest text-white/70">?????????</div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onReveal}
                  disabled={busy}
                  className="rounded-full bg-gradient-to-b from-fuchsia-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-fuchsia-500/30 transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  ✨ Reveal Player
                </button>
              )}
            </>
          )}

          {stage === 'revealing' && (
            <>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
                Revealing…
              </p>
              <div className="animate-pulse" style={{ filter: 'blur(2px)' }}>
                <PlayerAvatar player={shuffleImg || selectedPlayer || {}} size="2xl" shape="rounded" />
              </div>
            </>
          )}

          {stage === 'revealed' && selectedPlayer && (
            <>
              <div className="mb-3">
                <PlayerAvatar player={selectedPlayer} size="2xl" shape="rounded" />
              </div>
              <div className="text-2xl font-extrabold text-white">{selectedPlayer.name}</div>
              {selectedPlayer.role && (
                <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-300">
                  {selectedPlayer.role}
                </div>
              )}
              <div className="mb-4 grid w-full max-w-sm grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                {STAT_FIELDS.filter((f) => hasValue(selectedPlayer[f.key])).map((f) => (
                  <div key={f.key} className="flex flex-col items-center">
                    <span className="font-bold text-white">{selectedPlayer[f.key]}</span>
                    <span className="text-[10px] uppercase tracking-wide text-white/50">{f.label}</span>
                  </div>
                ))}
              </div>
              <div className="mb-4 text-sm text-white/70">
                Base Price:{' '}
                <span className="font-bold text-emerald-400">{formatCurrency(basePrice)}</span>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onBid(selectedPlayer.id)}
                  disabled={busy}
                  className="rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/40 transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  🔨 Bid Player
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartRandomStage;
