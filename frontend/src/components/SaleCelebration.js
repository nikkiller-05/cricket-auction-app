import React, { useEffect, useMemo, useRef } from 'react';
import PlayerAvatar from './PlayerAvatar';

const GLITTER_COLORS = ['#fde047', '#facc15', '#f59e0b', '#fbbf24', '#fff7cc', '#eab308'];
const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Full-screen celebration when a player is sold (hammer bang + spin/expand + glitter)
// or unsold (spin + red rubber-stamp slam). Auto-dismisses; click to skip.
const SaleCelebration = ({ celebration, onDone }) => {
  const sold = celebration?.type === 'sold';

  const glitter = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 1.9 + Math.random() * 1.8,
        size: 5 + Math.random() * 9,
        color: GLITTER_COLORS[i % GLITTER_COLORS.length],
        rot: 180 + Math.random() * 540,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [celebration?.player?.id, celebration?.type]
  );

  // Keep the latest onDone without re-arming the timer on every parent render.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!celebration) return undefined;
    // ~3s hold after the entrance animation finishes.
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
          {glitter.map((g) => (
            <span
              key={g.id}
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
          <div className="gbx-hammer" aria-hidden="true">🔨</div>
          <div className="gbx-impact-flash" aria-hidden="true" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className={`relative ${sold ? 'gbx-sold-photo' : 'gbx-unsold-photo'}`}>
          <div className="rounded-3xl overflow-hidden ring-4 ring-amber-300/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
            <PlayerAvatar player={player} size="3xl" shape="rounded" position="top" />
          </div>
          {!sold && <div className="gbx-stamp" aria-hidden="true"><span>UNSOLD</span></div>}
        </div>

        {sold ? (
          <div className="gbx-sold-text mt-7">
            <div className="text-5xl sm:text-7xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 drop-shadow-[0_4px_18px_rgba(245,158,11,0.5)]">
              SOLD!
            </div>
            <div className="mt-3 text-xl sm:text-2xl font-bold text-white">{player?.name}</div>
            <div className="mt-1 text-base sm:text-lg font-semibold text-amber-200">
              {formatCurrency(amount)} · {team?.name}
            </div>
          </div>
        ) : (
          <div className="gbx-unsold-text mt-7">
            <div className="text-xl sm:text-2xl font-bold text-white">{player?.name}</div>
            <div className="mt-1 text-sm uppercase tracking-[0.25em] text-rose-300 font-semibold">No bids</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleCelebration;
