import React, { useEffect, useState } from 'react';
import PlayerAvatar from './PlayerAvatar';
import PlayerNameLink from './PlayerNameLink';
import { formatRoleLabel } from '../features/players/categories';
import { formatCurrency, cleanTeamName } from '../lib/format';

// A flip "player card": front shows photo/name/basic info plus two small
// actions (Stats / View Poster) for players who've been through the auction;
// clicking either flips the SAME card in place to reveal that content, and
// clicking anywhere on the back flips it back. A player who hasn't been
// auctioned yet gets a single, simpler face (stats + base price, no flip).
// Nothing here navigates away or opens a new surface. Presentational only.
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

// Card chrome shared by every face — keeps the surface, radius and padding
// identical whether it's the single available-player face or one flip face.
const CARD_FACE_CLASS =
  'rounded-3xl border border-white/12 bg-gradient-to-b from-[#0d1224] via-[#0a0e1c] to-[#070911] p-5 sm:p-6 shadow-2xl text-white';

const CloseButton = ({ onClose }) => (
  <button
    onClick={onClose}
    aria-label="Close"
    className="absolute right-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
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

const PlayerCardModal = ({ player, team, eventName, eventLogoUrl, onClose }) => {
  const [view, setView] = useState('front'); // 'front' | 'stats' | 'poster'

  // Lock background scroll while the card is open — prevents a page-level
  // scrollbar/jitter behind the modal on any screen size.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!player) return null;

  const hasOutcome = ['sold', 'retained', 'assigned', 'unsold'].includes(player.status);
  const price =
    player.status === 'sold'
      ? player.finalBid
      : player.status === 'retained'
        ? player.retentionAmount || player.finalBid
        : player.status === 'assigned'
          ? player.captainAmount || 0
          : null;

  const outcome = (() => {
    if (player.status === 'sold') return { label: 'SOLD', tone: 'emerald', note: team ? `to ${cleanTeamName(team.name)}` : null };
    if (player.status === 'retained') return { label: 'RETAINED', tone: 'cyan', note: team ? `by ${cleanTeamName(team.name)}` : null };
    if (player.status === 'assigned') return { label: 'CAPTAIN', tone: 'purple', note: team ? `of ${cleanTeamName(team.name)}` : null };
    return { label: 'UNSOLD', tone: 'rose', note: null };
  })();

  const basicInfo = [battingHandAbbr(player.battingHand), formatRoleLabel(player.role)].filter(Boolean).join(' · ');

  const flipTo = (v) => (e) => { e.stopPropagation(); setView(v); };
  const flipBack = () => setView('front');

  // Last 5 bids, most recent (the winning bid, for sold players) first.
  const recentBids = player.status === 'sold' && Array.isArray(player.bidHistory)
    ? player.bidHistory.slice(-5).reverse()
    : [];

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm sm:max-w-md">
        <EventBrand eventName={eventName} eventLogoUrl={eventLogoUrl} />

        {!hasOutcome ? (
          // Not yet auctioned: a single, simple face — no flip needed.
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
              <span className="mt-2 inline-flex items-center rounded-full border border-slate-400/30 bg-slate-500/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-slate-300">
                Available
              </span>
            </div>

            <div className="mt-5">
              <StatTiles player={player} />
            </div>

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
              <div
                style={{ backfaceVisibility: 'hidden' }}
                className={`absolute inset-0 ${CARD_FACE_CLASS} overflow-y-auto`}
              >
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
                  <button
                    onClick={flipTo('stats')}
                    className="rounded-2xl border border-white/12 bg-white/[0.05] hover:bg-white/[0.09] transition px-3 py-4 text-center"
                  >
                    <div className="text-2xl mb-1">📊</div>
                    <div className="text-sm font-bold">Stats</div>
                  </button>
                  <button
                    onClick={flipTo('poster')}
                    className="rounded-2xl border border-amber-300/25 bg-amber-400/10 hover:bg-amber-400/20 transition px-3 py-4 text-center"
                  >
                    <div className="text-2xl mb-1">🖼️</div>
                    <div className="text-sm font-bold text-amber-200">View Poster</div>
                  </button>
                </div>
              </div>

              {/* BACK — content depends on which action was clicked */}
              <div
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                className={`absolute inset-0 ${CARD_FACE_CLASS} cursor-pointer flex flex-col overflow-hidden`}
                onClick={flipBack}
                title="Tap to go back"
              >
                <CloseButton onClose={onClose} />
                {view === 'stats' ? (
                  <div className="flex h-full flex-col items-center justify-center">
                    <p className="text-xs uppercase tracking-widest text-white/50 mb-4">Career Stats</p>
                    <div className="w-full"><StatTiles player={player} /></div>
                    <p className="mt-6 text-[11px] text-white/40">Tap anywhere to go back</p>
                  </div>
                ) : (
                  <div className="relative flex h-full flex-col items-center justify-center text-center overflow-hidden">
                    {/* Team crest watermark behind the poster content */}
                    {team?.logoUrl && (
                      <img
                        src={team.logoUrl}
                        alt=""
                        crossOrigin="anonymous"
                        className="pointer-events-none absolute inset-0 m-auto h-48 w-48 object-contain opacity-[0.08]"
                      />
                    )}
                    <div className="relative z-10 flex w-full flex-col items-center">
                      <EventBrand eventName={eventName} eventLogoUrl={eventLogoUrl} />
                      {team?.logoUrl && (
                        <img
                          src={team.logoUrl}
                          alt=""
                          crossOrigin="anonymous"
                          className="mb-3 h-16 w-16 rounded-2xl bg-white/90 object-contain shadow-lg"
                        />
                      )}
                      <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide ${OUTCOME_STYLES[outcome.tone]}`}>
                        {outcome.label}
                      </span>
                      {outcome.note && <p className="mt-3 text-base font-semibold text-white/90">{outcome.note}</p>}
                      {price != null && (
                        <p className="gbx-poster-amount-in mt-2 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.45)]">
                          {formatCurrency(price)}
                        </p>
                      )}

                      {recentBids.length > 0 && (
                        <div className="mt-4 w-full">
                          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-white/40">Auction Bids</p>
                          <div className="max-h-28 w-full space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-1.5">
                            {recentBids.map((b, i) => (
                              <div
                                key={b.id || i}
                                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                                  i === 0 ? 'bg-amber-400/10 text-amber-200 font-bold' : 'text-white/70'
                                }`}
                              >
                                <span className="truncate">{cleanTeamName(b.teamName) || 'Team'}</span>
                                <span className="shrink-0 tabular-nums">{formatCurrency(b.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="mt-4 text-[11px] text-white/40">Tap anywhere to go back</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCardModal;


