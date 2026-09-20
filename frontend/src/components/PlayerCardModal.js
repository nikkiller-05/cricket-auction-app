import React, { useState } from 'react';
import PlayerAvatar from './PlayerAvatar';
import PlayerNameLink from './PlayerNameLink';
import { formatRoleLabel } from '../features/players/categories';
import { formatCurrency, cleanTeamName } from '../lib/format';

// A flip "player card": front shows photo/name/basic info plus two small
// actions (Stats / View Poster); clicking either flips the SAME card in place
// to reveal that content, and clicking anywhere on the back flips it back.
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

const PlayerCardModal = ({ player, team, onClose }) => {
  const [view, setView] = useState('front'); // 'front' | 'stats' | 'poster'
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

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div style={{ perspective: '1400px' }} className="relative w-full max-w-sm">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-2 -right-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
        >
          ✕
        </button>

        <div
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
            transform: view === 'front' ? 'rotateY(0deg)' : 'rotateY(180deg)',
            minHeight: 420,
          }}
          className="relative w-full"
        >
          {/* FRONT */}
          <div
            style={{ backfaceVisibility: 'hidden' }}
            className="absolute inset-0 rounded-3xl border border-white/12 bg-gradient-to-b from-[#0d1224] via-[#0a0e1c] to-[#070911] p-6 shadow-2xl text-white overflow-y-auto"
          >
            <div className="flex flex-col items-center text-center">
              <div className="rounded-3xl p-1 bg-gradient-to-br from-sky-400/70 via-indigo-500/60 to-sky-400/70 shadow-[0_0_30px_-6px_rgba(56,189,248,0.5)]">
                <PlayerAvatar player={player} size="2xl" shape="rounded" />
              </div>
              <h2 className="mt-4 text-2xl font-extrabold">
                <PlayerNameLink player={player} linkClassName="text-sky-300 hover:text-sky-200 hover:underline" />
              </h2>
              {basicInfo && <p className="mt-1 text-sm text-white/60">{basicInfo}</p>}
            </div>

            {hasOutcome ? (
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
            ) : (
              player.basePrice ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-white/50">Base Price</div>
                  <div className="text-xl font-extrabold text-amber-300">{formatCurrency(player.basePrice)}</div>
                </div>
              ) : null
            )}
          </div>

          {/* BACK — content depends on which action was clicked */}
          <div
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 rounded-3xl border border-white/12 bg-gradient-to-b from-[#0d1224] via-[#0a0e1c] to-[#070911] p-6 shadow-2xl text-white overflow-y-auto cursor-pointer"
            onClick={flipBack}
            title="Tap to go back"
          >
            {view === 'stats' ? (
              <div className="flex h-full flex-col items-center justify-center">
                <p className="text-xs uppercase tracking-widest text-white/50 mb-4">Career Stats</p>
                <div className="grid w-full grid-cols-3 gap-3">
                  {[
                    { label: 'Matches', value: dash(player.matches) },
                    { label: 'Runs', value: dash(player.runs) },
                    { label: 'Wickets', value: dash(player.wickets) },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center">
                      <div className="text-lg font-extrabold">{s.value}</div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-white/50">{s.label}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-[11px] text-white/40">Tap anywhere to go back</p>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                {team?.logoUrl && (
                  <img
                    src={team.logoUrl}
                    alt=""
                    crossOrigin="anonymous"
                    className="mb-4 h-20 w-20 rounded-2xl bg-white/90 object-contain shadow-lg"
                  />
                )}
                <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide ${OUTCOME_STYLES[outcome.tone]}`}>
                  {outcome.label}
                </span>
                {outcome.note && <p className="mt-3 text-base font-semibold text-white/90">{outcome.note}</p>}
                {price != null && <p className="mt-2 text-3xl font-extrabold text-amber-300">{formatCurrency(price)}</p>}
                <p className="mt-6 text-[11px] text-white/40">Tap anywhere to go back</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCardModal;

