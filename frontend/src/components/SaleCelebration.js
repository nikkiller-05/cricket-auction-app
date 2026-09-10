import React, { useEffect, useMemo, useRef } from 'react';
import PlayerAvatar from './PlayerAvatar';

const GLITTER_COLORS = ['#fde047', '#facc15', '#f59e0b', '#fbbf24', '#fff7cc', '#eab308'];
const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Synthesized wooden "bang"/"thud" via Web Audio — no asset needed.
function playImpactSound(sold) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(sold ? 185 : 135, now);
    osc.frequency.exponentialRampToValueAtTime(sold ? 55 : 48, now + 0.18);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(sold ? 0.6 : 0.45, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.32);
    const len = Math.floor(ctx.sampleRate * 0.06);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(sold ? 0.5 : 0.35, now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    noise.connect(ng); ng.connect(ctx.destination);
    noise.start(now);
    setTimeout(() => { try { ctx.close(); } catch (e) { /* ignore */ } }, 600);
  } catch (e) { /* audio blocked — ignore */ }
}

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
    // Play the wooden bang/thud timed to the moment of impact.
    const sfx = setTimeout(() => playImpactSound(celebration.type === 'sold'), 560);
    return () => { clearTimeout(t); clearTimeout(sfx); };
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
          {/* Wooden auction gavel arcs down and bangs the sound block */}
          <div className="gbx-gavel-stage" aria-hidden="true">
            <div className="gbx-soundblock" />
            <svg viewBox="0 0 230 130" className="gbx-gavel-svg">
              <defs>
                <linearGradient id="gvHead" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#b07d40" />
                  <stop offset="0.5" stopColor="#8a5a2b" />
                  <stop offset="1" stopColor="#6b4420" />
                </linearGradient>
                <linearGradient id="gvHandle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#b5834f" />
                  <stop offset="0.5" stopColor="#8a5a2b" />
                  <stop offset="1" stopColor="#6b4420" />
                </linearGradient>
              </defs>
              <rect x="92" y="56" width="120" height="16" rx="8" fill="url(#gvHandle)" />
              <rect x="200" y="50" width="26" height="28" rx="9" fill="#6b4420" />
              <rect x="22" y="20" width="84" height="88" rx="22" fill="url(#gvHead)" />
              <ellipse cx="30" cy="64" rx="11" ry="44" fill="#5c3a1a" />
              <ellipse cx="98" cy="64" rx="11" ry="44" fill="#7c5227" />
              <rect x="34" y="34" width="58" height="9" rx="4.5" fill="rgba(255,255,255,0.22)" />
            </svg>
          </div>
          <div className="gbx-impact-flash" aria-hidden="true" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className={`relative ${sold ? 'gbx-sold-photo' : 'gbx-unsold-photo'}`}>
          <div className="rounded-3xl overflow-hidden ring-4 ring-amber-300/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
            <PlayerAvatar player={player} size="3xl" shape="rounded" position="top" />
          </div>
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
