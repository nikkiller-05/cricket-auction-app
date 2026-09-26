import React, { useEffect, useMemo, useRef, useState } from 'react';
import PlayerAvatar from './PlayerAvatar';
import PlayerNameLink from './PlayerNameLink';
import { formatRoleLabel } from '../features/players/categories';
import { formatCurrency, cleanTeamName } from '../lib/format';

// A flip "player card": front shows photo/name/basic info plus two small
// actions (Stats / View Poster); clicking either flips the SAME card in place.
// The poster face is a shareable, downloadable card themed to the winning
// team's colour, with a rarity tier (by how far above base they went), a QR
// link, and confetti for sold players; unsold gets its own bold ribbon design.
const OUTCOME_STYLES = {
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
  purple: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
};

const dash = (v) => (v === undefined || v === null || String(v).trim() === '' ? '—' : v);

const battingHandAbbr = (bh) => {
  const s = String(bh || '').toLowerCase();
  if (s.includes('left')) return 'LHB';
  if (s.includes('right')) return 'RHB';
  return null;
};

// Deterministic brand-ish colour from a seed (fallback when we can't read the
// logo's pixels, e.g. a cross-origin image without CORS headers).
const hashColor = (seed = '') => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 62% 48%)`;
};

// Average the logo's non-white/non-black pixels for a team accent colour.
// Falls back to a hashed colour on any CORS/decoding failure.
const useDominantColor = (url, seed) => {
  const [color, setColor] = useState(() => hashColor(seed));
  useEffect(() => {
    let alive = true;
    if (!url) { setColor(hashColor(seed)); return undefined; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const s = 24;
        const c = document.createElement('canvas');
        c.width = s; c.height = s;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, s, s);
        const { data } = ctx.getImageData(0, 0, s, s);
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue;
          const rr = data[i], gg = data[i + 1], bb = data[i + 2];
          const mx = Math.max(rr, gg, bb), mn = Math.min(rr, gg, bb);
          if (mx > 238 && mn > 238) continue; // near white
          if (mx < 26) continue; // near black
          r += rr; g += gg; b += bb; n += 1;
        }
        if (alive && n > 0) setColor(`rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`);
      } catch {
        if (alive) setColor(hashColor(seed));
      }
    };
    img.onerror = () => { if (alive) setColor(hashColor(seed)); };
    img.src = url;
    return () => { alive = false; };
  }, [url, seed]);
  return color;
};

// Rarity by how far the final price went above base (currency-agnostic).
const rarityOf = (price, base) => {
  const ratio = base > 0 ? price / base : 1;
  if (ratio >= 4) return { key: 'marquee', label: '★ Marquee Pick', foil: true };
  if (ratio >= 2.5) return { key: 'gold', label: 'Gold Tier', foil: false };
  if (ratio >= 1.5) return { key: 'silver', label: 'Silver Tier', foil: false };
  return { key: 'bronze', label: '', foil: false };
};

const useCountUp = (target, run) => {
  const [val, setVal] = useState(run ? 0 : target);
  useEffect(() => {
    if (!run) { setVal(target); return undefined; }
    const canAnim = typeof window !== 'undefined' && window.requestAnimationFrame &&
      !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!canAnim) { setVal(target); return undefined; }
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      setVal(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return val;
};

const CARD_FACE_CLASS =
  'rounded-3xl border border-white/12 bg-gradient-to-b from-[#0d1224] via-[#0a0e1c] to-[#070911] p-5 sm:p-6 shadow-2xl text-white';

const CloseButton = ({ onClose }) => (
  <button
    onClick={onClose}
    aria-label="Close"
    className="absolute right-3 top-3 z-30 grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
  >
    ✕
  </button>
);

const EventBrand = ({ eventName, eventLogoUrl }) => {
  if (!eventName) return null;
  return (
    <div className="mb-2 flex items-center justify-center gap-2 text-center">
      {eventLogoUrl && <img src={eventLogoUrl} alt="" crossOrigin="anonymous" className="h-5 w-5 rounded object-contain bg-white/90 shrink-0" />}
      <span className="truncate text-[11px] font-bold uppercase tracking-[0.15em] text-white/60">{eventName}</span>
    </div>
  );
};

const StatTiles = ({ player }) => (
  <div className="grid grid-cols-3 gap-2">
    {[
      { label: 'Matches', value: dash(player.matches) },
      { label: 'Runs', value: dash(player.runs) },
      { label: 'Wickets', value: dash(player.wickets) },
    ].map((s) => (
      <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2.5 text-center">
        <div className="text-lg font-extrabold">{s.value}</div>
        <div className="mt-0.5 text-[10px] uppercase tracking-wider text-white/50">{s.label}</div>
      </div>
    ))}
  </div>
);

// A confetti burst confined to the poster (sold only).
const Confetti = () => {
  const bits = useMemo(
    () => Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      dur: 1.6 + Math.random() * 1.2,
      color: ['#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#a78bfa', '#f59e0b'][i % 6],
      size: 5 + Math.random() * 6,
    })),
    []
  );
  return (
    <div className="gbx-card-confetti pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute top-0 rounded-[1px]"
          style={{
            left: `${b.left}%`, width: b.size, height: b.size * 1.6, background: b.color,
            animation: `gbxCardConfetti ${b.dur}s ${b.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
};

// The shareable poster surface. Rendered twice: once in the flip back-face for
// on-screen display (animate + last-5 bids), once off-screen for a clean
// html2canvas capture (forCapture: content-height, no bids, no scroll gaps).
const Poster = React.forwardRef(({ player, team, outcome, price, rarity, accent, eventName, eventLogoUrl, recentBids, animate, forCapture = false }, ref) => {
  const animatedPrice = useCountUp(price || 0, animate && outcome.key !== 'unsold');
  const isUnsold = outcome.key === 'unsold';
  const rootH = forCapture ? '' : 'h-full';
  const roleInfo = [battingHandAbbr(player.battingHand), formatRoleLabel(player.role)].filter(Boolean).join(' · ');
  const teamInitials = (cleanTeamName(team?.name) || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  if (isUnsold) {
    return (
      <div ref={ref} className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-b from-[#1a0e12] via-[#12090c] to-[#0a0608] text-white ${rootH}`}>
        <div className="pointer-events-none absolute -right-10 top-8 rotate-45 bg-rose-600/90 px-16 py-1.5 text-sm font-black uppercase tracking-[0.3em] text-white shadow-lg">Unsold</div>
        <div className={`relative z-10 flex flex-col items-center justify-center px-6 py-7 text-center ${forCapture ? '' : 'h-full'}`}>
          <EventBrand eventName={eventName} eventLogoUrl={eventLogoUrl} />
          <div className="rounded-3xl p-1 bg-gradient-to-br from-rose-400/50 to-slate-600/40">
            <div className="grayscale">
              <PlayerAvatar player={player} size="2xl" shape="rounded" />
            </div>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold">{player.name}</h2>
          {[battingHandAbbr(player.battingHand), formatRoleLabel(player.role)].filter(Boolean).length > 0 && (
            <p className="mt-1 text-sm text-white/55">{[battingHandAbbr(player.battingHand), formatRoleLabel(player.role)].filter(Boolean).join(' · ')}</p>
          )}
          <span className="mt-3 inline-flex items-center rounded-full border border-rose-400/40 bg-rose-500/15 px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-rose-200">Unsold this round</span>
          <p className="mt-3 text-sm font-semibold text-amber-200">↩ Returns in Fast‑Track</p>
          <p className="mt-1 max-w-[15rem] text-xs text-white/50">Teams can grab this player when they come back up. Register your interest with the organizer.</p>
          <div className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            <span className="text-amber-300">Golden</span>BidX
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`relative w-full overflow-hidden rounded-3xl text-white ${rootH}`}
      style={{ background: 'linear-gradient(to bottom, #0d1224, #0a0e1c 60%, #070911)' }}
    >
      {/* ---- Team-branded background (all html2canvas-safe: gradients, no blur) ---- */}
      {/* Team-colour glow from the top */}
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(105% 70% at 50% -5%, ${accent} 0%, transparent 55%)`, opacity: 0.42 }} />
      {/* Spotlight behind the player */}
      <div className="pointer-events-none absolute left-1/2 top-[30%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 68%)`, opacity: 0.38 }} />
      {/* Crest watermark, or big team initials when there's no logo */}
      {team?.logoUrl ? (
        <img
          src={team.logoUrl}
          alt=""
          crossOrigin="anonymous"
          className={`pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 object-contain ${animate ? 'gbx-crest-in' : ''}`}
          style={{ opacity: 0.15, ['--crest-opacity']: 0.15, animation: animate ? 'gbxCrestIn 0.7s ease-out both' : undefined }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="font-black" style={{ color: accent, opacity: 0.12, fontSize: '190px', lineHeight: 1 }}>{teamInitials}</span>
        </div>
      )}
      {/* Bottom vignette keeps the price/footer legible over the glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3" style={{ background: 'linear-gradient(to top, #070911 6%, transparent 60%)' }} />
      {/* Top accent line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      {animate && outcome.key !== 'unsold' && <Confetti />}

      <div className={`relative z-10 flex flex-col items-center px-6 text-center ${forCapture ? 'py-9' : 'h-full overflow-y-auto py-6'}`}>
        {/* Event header — padded with explicit line-height so html2canvas can't clip it */}
        {eventName && (
          <div className="w-full">
            <div className="flex items-center justify-center gap-2">
              {eventLogoUrl && <img src={eventLogoUrl} alt="" crossOrigin="anonymous" className="h-4 w-4 rounded object-contain bg-white/90" />}
              <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-white/70" style={{ lineHeight: '1.8' }}>{eventName}</span>
            </div>
            <div className="mx-auto mt-2 h-0.5 w-14 rounded-full" style={{ background: accent, opacity: 0.7 }} />
          </div>
        )}

        <div className="mt-5 rounded-3xl p-1.5 shadow-2xl" style={{ background: `linear-gradient(135deg, ${accent}, transparent)` }}>
          <PlayerAvatar player={player} size="xl" shape="rounded" />
        </div>

        <h2 className="mt-4 text-3xl font-extrabold" style={{ lineHeight: '1.15' }}>{player.name}</h2>
        {roleInfo && <p className="mt-1 text-sm text-white/60" style={{ lineHeight: '1.5' }}>{roleInfo}</p>}

        <div className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 ${OUTCOME_STYLES[outcome.tone]}`}>
          {team?.logoUrl && <img src={team.logoUrl} alt="" crossOrigin="anonymous" className="h-6 w-6 rounded-md bg-white/90 object-contain" />}
          <span className="text-sm font-extrabold uppercase tracking-wide" style={{ lineHeight: '1.5' }}>{outcome.label}{outcome.note ? ` ${outcome.note}` : ''}</span>
        </div>

        {price != null && (
          <p
            className={`mt-4 text-5xl font-extrabold ${forCapture ? '' : `text-transparent bg-clip-text ${rarity.foil ? 'gbx-foil' : ''}`}`}
            style={forCapture ? { color: '#fcd34d', lineHeight: '1.1' } : (rarity.foil ? { lineHeight: '1.1' } : { backgroundImage: `linear-gradient(to bottom, #fff, ${accent})`, lineHeight: '1.1' })}
          >
            {formatCurrency(animate ? animatedPrice : price)}
          </p>
        )}
        {rarity.label && (
          <span className="mt-2 inline-flex items-center rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-[11px] font-bold text-amber-200" style={{ lineHeight: '1.5' }}>
            {rarity.label}
          </span>
        )}

        {/* Last-5 bids are shown on-screen only, never in the downloaded image. */}
        {!forCapture && recentBids.length > 0 && (
          <div className="mt-4 w-full">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-white/40">Auction Bids</p>
            <div className="max-h-24 w-full space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-1.5">
              {recentBids.map((b, i) => (
                <div key={b.id || i} className={`flex items-center justify-between rounded-lg px-2.5 py-1 text-xs ${i === 0 ? 'bg-amber-400/10 text-amber-200 font-bold' : 'text-white/70'}`}>
                  <span className="truncate">{cleanTeamName(b.teamName) || 'Team'}</span>
                  <span className="shrink-0 tabular-nums">{formatCurrency(b.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`flex w-full items-center justify-center pt-6 ${forCapture ? 'mt-6' : 'mt-auto'}`}>
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45" style={{ lineHeight: '1.6' }}><span className="text-amber-300">Golden</span>BidX</span>
        </div>
      </div>
    </div>
  );
});

const PlayerCardModal = ({ player, team, eventName, eventLogoUrl, onClose }) => {
  const [view, setView] = useState('front'); // 'front' | 'stats' | 'poster'
  const [busy, setBusy] = useState(false);
  const captureRef = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const accent = useDominantColor(team?.logoUrl, cleanTeamName(team?.name) || player?.name || 'x');

  const hasOutcome = ['sold', 'retained', 'assigned', 'unsold'].includes(player?.status);
  const price =
    player?.status === 'sold' ? player.finalBid
      : player?.status === 'retained' ? (player.retentionAmount || player.finalBid)
        : player?.status === 'assigned' ? (player.captainAmount || 0)
          : null;

  const outcome = useMemo(() => {
    if (player?.status === 'sold') return { key: 'sold', label: 'SOLD', tone: 'emerald', note: team ? `· ${cleanTeamName(team.name)}` : null };
    if (player?.status === 'retained') return { key: 'retained', label: 'RETAINED', tone: 'cyan', note: team ? `· ${cleanTeamName(team.name)}` : null };
    if (player?.status === 'assigned') return { key: 'assigned', label: 'CAPTAIN', tone: 'purple', note: team ? `· ${cleanTeamName(team.name)}` : null };
    return { key: 'unsold', label: 'UNSOLD', tone: 'rose', note: null };
  }, [player?.status, team]);

  const rarity = useMemo(() => (price != null && outcome.key === 'sold' ? rarityOf(price, player?.basePrice || 0) : { key: 'none', label: '', foil: false }), [price, outcome.key, player?.basePrice]);

  const recentBids = player?.status === 'sold' && Array.isArray(player.bidHistory) ? player.bidHistory.slice(-5).reverse() : [];

  if (!player) return null;

  const basicInfo = [battingHandAbbr(player.battingHand), formatRoleLabel(player.role)].filter(Boolean).join(' · ');
  const flipTo = (v) => (e) => { e.stopPropagation(); setView(v); };
  const flipBack = () => setView('front');

  const capturePng = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(captureRef.current, { useCORS: true, backgroundColor: '#0a0e1c', scale: 2, logging: false });
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  };

  const downloadPoster = async (e) => {
    e.stopPropagation();
    if (!captureRef.current || busy) return;
    setBusy(true);
    try {
      const blob = await capturePng();
      if (!blob) throw new Error('render failed');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${player.name.replace(/\s+/g, '_')}_${outcome.label.toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch { /* capture can fail on tainted images; ignore */ } finally { setBusy(false); }
  };

  const sharePoster = async (e) => {
    e.stopPropagation();
    if (!captureRef.current || busy) return;
    setBusy(true);
    try {
      const blob = await capturePng();
      if (!blob) throw new Error('render failed');
      const file = new File([blob], `${player.name.replace(/\s+/g, '_')}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: player.name, text: `${player.name} — ${outcome.label}` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch { /* user cancelled or capture failed */ } finally { setBusy(false); }
  };

  const posterProps = { player, team, outcome, price, rarity, accent, eventName, eventLogoUrl, recentBids };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm sm:max-w-md">
        <EventBrand eventName={eventName} eventLogoUrl={eventLogoUrl} />

        {!hasOutcome ? (
          <div className={`relative ${CARD_FACE_CLASS} max-h-[85vh] overflow-y-auto`}>
            <CloseButton onClose={onClose} />
            <div className="flex flex-col items-center text-center">
              <div className="rounded-3xl p-1 bg-gradient-to-br from-sky-400/70 via-indigo-500/60 to-sky-400/70 shadow-[0_0_30px_-6px_rgba(56,189,248,0.5)]">
                <PlayerAvatar player={player} size="2xl" shape="rounded" />
              </div>
              <h2 className="mt-4 text-2xl font-extrabold">
                <PlayerNameLink player={player} linkClassName="text-sky-300 hover:text-sky-200 hover:underline" />
              </h2>
              {basicInfo && <p className="mt-1 text-sm text-white/60">{basicInfo}</p>}
              <span className="mt-2 inline-flex items-center rounded-full border border-slate-400/30 bg-slate-500/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-slate-300">Available</span>
            </div>
            <div className="mt-5"><StatTiles player={player} /></div>
            {player.basePrice ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-white/50">Base Price</div>
                <div className="text-xl font-extrabold text-amber-300">{formatCurrency(player.basePrice)}</div>
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ perspective: '1400px' }}>
            <div
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
                transform: view === 'front' ? 'rotateY(0deg)' : 'rotateY(180deg)',
                minHeight: 'clamp(400px, 70vh, 560px)',
                maxHeight: '85vh',
              }}
              className="relative w-full"
            >
              {/* FRONT */}
              <div style={{ backfaceVisibility: 'hidden' }} className={`absolute inset-0 ${CARD_FACE_CLASS} overflow-y-auto`}>
                <CloseButton onClose={onClose} />
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-3xl p-1 bg-gradient-to-br from-sky-400/70 via-indigo-500/60 to-sky-400/70 shadow-[0_0_30px_-6px_rgba(56,189,248,0.5)]">
                    <PlayerAvatar player={player} size="2xl" shape="rounded" />
                  </div>
                  <h2 className="mt-4 text-2xl font-extrabold">
                    <PlayerNameLink player={player} linkClassName="text-sky-300 hover:text-sky-200 hover:underline" />
                  </h2>
                  {basicInfo && <p className="mt-1 text-sm text-white/60">{basicInfo}</p>}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button onClick={flipTo('stats')} className="rounded-2xl border border-white/12 bg-white/[0.05] hover:bg-white/[0.09] transition px-3 py-4 text-center">
                    <div className="text-2xl mb-1">📊</div>
                    <div className="text-sm font-bold">Stats</div>
                  </button>
                  <button onClick={flipTo('poster')} className="rounded-2xl border border-amber-300/25 bg-amber-400/10 hover:bg-amber-400/20 transition px-3 py-4 text-center">
                    <div className="text-2xl mb-1">🖼️</div>
                    <div className="text-sm font-bold text-amber-200">View Poster</div>
                  </button>
                </div>
              </div>

              {/* BACK */}
              <div
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                className={`absolute inset-0 ${view === 'poster' ? 'rounded-3xl border border-white/12 shadow-2xl overflow-hidden' : CARD_FACE_CLASS} flex flex-col`}
              >
                <CloseButton onClose={onClose} />
                {view === 'stats' ? (
                  <div className="flex h-full cursor-pointer flex-col items-center justify-center" onClick={flipBack} title="Tap to go back">
                    <p className="text-xs uppercase tracking-widest text-white/50 mb-4">Career Stats</p>
                    <div className="w-full"><StatTiles player={player} /></div>
                    <p className="mt-6 text-[11px] text-white/40">Tap anywhere to go back</p>
                  </div>
                ) : (
                  <div className="flex h-full flex-col">
                    <div className="min-h-0 flex-1">
                      <Poster {...posterProps} animate={view === 'poster'} />
                    </div>
                    {/* Action bar (not part of the captured image) */}
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-[#070911]/95 border-t border-white/10">
                      <button onClick={downloadPoster} disabled={busy} className="flex-1 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 px-3 py-2 text-sm font-bold text-slate-900 shadow disabled:opacity-60 inline-flex items-center justify-center gap-1.5">
                        {busy ? '…' : '⬇ Download'}
                      </button>
                      <button onClick={sharePoster} disabled={busy} className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-60 inline-flex items-center justify-center gap-1.5">
                        ↗ Share
                      </button>
                      <button onClick={flipBack} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10">Back</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Off-screen upright copy for a clean capture (avoids 3D-transform issues).
          Content-height so the downloaded image has no empty gaps. */}
      {view === 'poster' && (
        <div style={{ position: 'fixed', left: -10000, top: 0, width: 380, pointerEvents: 'none' }} aria-hidden="true">
          <Poster ref={captureRef} {...posterProps} animate={false} forCapture />
        </div>
      )}
    </div>
  );
};

export default PlayerCardModal;
