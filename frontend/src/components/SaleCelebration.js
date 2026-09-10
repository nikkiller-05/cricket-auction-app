import React, { useEffect, useMemo, useRef } from 'react';
import PlayerAvatar from './PlayerAvatar';

const CONFETTI_COLORS = ['#34d399', '#10b981', '#22c55e', '#fde047', '#fbbf24', '#86efac'];
const BALLOON_COLORS = ['#34d399', '#10b981', '#22c55e', '#fbbf24', '#f472b6', '#60a5fa', '#a78bfa'];
const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Full-screen celebration: SOLD = green banner + balloons + confetti,
// UNSOLD = red banner + spin. Auto-dismisses; click to skip.
const SaleCelebration = ({ celebration, onDone }) => {
  const sold = celebration?.type === 'sold';

  const confetti = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 1.9 + Math.random() * 1.8,
        size: 5 + Math.random() * 9,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rot: 180 + Math.random() * 540,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [celebration?.player?.id, celebration?.type]
  );

  const balloons = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        left: 4 + Math.random() * 90,
        delay: Math.random() * 0.9,
        duration: 3 + Math.random() * 2,
        size: 34 + Math.random() * 26,
        color: BALLOON_COLORS[i % BALLOON_COLORS.length],
        sway: `${(Math.random() * 2 - 1) * 44}px`,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [celebration?.player?.id, celebration?.type]
  );

  // Keep the latest onDone without re-arming the timer on every parent render.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!celebration) return undefined;
    const ms = celebration.type === 'sold' ? 4500 : 3500;
    const t = setTimeout(() => onDoneRef.current(), ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebration?.player?.id, celebration?.type]);

  if (!celebration) return null;
  const { player, team, amount } = celebration;

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center overflow-hidden gbx-modal-in"
      onClick={onDone}
      role="dialog"
      aria-label={sold ? 'Player sold' : 'Player unsold'}
    >
      <div className="absolute inset-0 bg-black/75 gbx-modal-backdrop" />

      {sold && (
        <>
          {balloons.map((b) => (
            <span
              key={`b${b.id}`}
              className="gbx-balloon"
              style={{
                left: `${b.left}%`,
                width: b.size,
                height: b.size * 1.22,
                background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), ${b.color} 62%)`,
                animationDelay: `${b.delay}s`,
                animationDuration: `${b.duration}s`,
                '--sway': b.sway,
              }}
            />
          ))}
          {confetti.map((g) => (
            <span
              key={`c${g.id}`}
              className="gbx-glitter"
              style={{
                left: `${g.left}%`,
                width: g.size,
                height: g.size,
                background: g.color,
                animationDelay: `${g.delay}s`,
                animationDuration: `${g.duration}s`,
                '--rot': `${g.rot}deg`,
              }}
            />
          ))}
        </>
      )}

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className={`relative ${sold ? 'gbx-sold-photo' : 'gbx-unsold-photo'}`}>
          <div
            className={`rounded-3xl overflow-hidden ring-4 ${
              sold ? 'ring-emerald-300/60' : 'ring-rose-300/60'
            } shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]`}
          >
            <PlayerAvatar player={player} size="3xl" shape="rounded" position="top" />
          </div>
        </div>

        {sold ? (
          <div className="gbx-sold-text mt-7">
            <div className="text-5xl sm:text-7xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-emerald-200 via-emerald-300 to-green-500 drop-shadow-[0_4px_18px_rgba(16,185,129,0.5)]">
              SOLD!
            </div>
            <div className="mt-3 text-xl sm:text-2xl font-bold text-white">{player?.name}</div>
            <div className="mt-1 text-base sm:text-lg font-semibold text-emerald-200">
              {formatCurrency(amount)} · {team?.name}
            </div>
          </div>
        ) : (
          <div className="gbx-unsold-text mt-7">
            <div className="text-5xl sm:text-7xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-rose-300 via-rose-400 to-red-600 drop-shadow-[0_4px_18px_rgba(244,63,94,0.5)]">
              UNSOLD
            </div>
            <div className="mt-3 text-xl sm:text-2xl font-bold text-white">{player?.name}</div>
            <div className="mt-1 text-sm uppercase tracking-[0.25em] text-rose-300 font-semibold">No bids</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleCelebration;
