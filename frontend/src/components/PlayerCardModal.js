import React from 'react';
import PlayerAvatar from './PlayerAvatar';
import PlayerNameLink from './PlayerNameLink';
import { CategoryTag, formatRoleLabel } from '../features/players/categories';
import { formatCurrency, cleanTeamName } from '../lib/format';

// A player "trading card": large photo, role, quick stats and the auction
// outcome (sold/retained/captain/unsold) with the team crest — opened by
// clicking a player's avatar anywhere in the spectator-facing UI. Purely
// presentational; reads the same player/team fields already used elsewhere.
const OUTCOME_STYLES = {
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
  purple: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  slate: 'bg-slate-500/15 text-slate-300 border-slate-400/30',
};

const dash = (v) => (v === undefined || v === null || String(v).trim() === '' ? '—' : v);

const PlayerCardModal = ({ player, team, onClose }) => {
  if (!player) return null;

  const price =
    player.status === 'sold'
      ? player.finalBid
      : player.status === 'retained'
        ? player.retentionAmount || player.finalBid
        : player.status === 'assigned'
          ? player.captainAmount || 0
          : null;

  const stats = [
    price != null && { label: 'Price', value: formatCurrency(price), accent: true },
    { label: 'Matches', value: dash(player.matches) },
    { label: 'Runs', value: dash(player.runs) },
    { label: 'Wickets', value: dash(player.wickets) },
  ].filter(Boolean);

  const outcome = (() => {
    if (player.status === 'sold') return { label: 'SOLD', tone: 'emerald', note: team ? `to ${cleanTeamName(team.name)}` : null };
    if (player.status === 'retained') return { label: 'RETAINED', tone: 'cyan', note: team ? `by ${cleanTeamName(team.name)}` : null };
    if (player.status === 'assigned') return { label: 'CAPTAIN', tone: 'purple', note: team ? `of ${cleanTeamName(team.name)}` : null };
    if (player.status === 'unsold') return { label: 'UNSOLD', tone: 'rose', note: null };
    return { label: 'AVAILABLE', tone: 'slate', note: null };
  })();

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-3xl border border-white/12 bg-gradient-to-b from-[#0d1224] via-[#0a0e1c] to-[#070911] p-6 shadow-2xl text-white">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="rounded-3xl p-1 bg-gradient-to-br from-sky-400/70 via-indigo-500/60 to-sky-400/70 shadow-[0_0_30px_-6px_rgba(56,189,248,0.5)]">
            <PlayerAvatar player={player} size="2xl" shape="rounded" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold">
            <PlayerNameLink player={player} linkClassName="text-sky-300 hover:text-sky-200 hover:underline" />
          </h2>
          <p className="mt-1 text-sm text-white/60">{formatRoleLabel(player.role)}</p>
          {player.category && (
            <div className="mt-2">
              <CategoryTag category={player.category} />
            </div>
          )}
        </div>

        <div className={`mt-5 grid gap-2 ${stats.length > 3 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {stats.map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border px-3 py-2.5 text-center ${
                s.accent ? 'border-amber-300/30 bg-amber-400/10' : 'border-white/10 bg-white/[0.04]'
              }`}
            >
              <div className={`text-lg font-extrabold ${s.accent ? 'text-amber-300' : 'text-white'}`}>{s.value}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wider text-white/50">{s.label}</div>
            </div>
          ))}
        </div>

        <div className={`mt-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${OUTCOME_STYLES[outcome.tone]}`}>
          <div className="flex min-w-0 items-center gap-2">
            {team?.logoUrl && (
              <img
                src={team.logoUrl}
                alt=""
                crossOrigin="anonymous"
                className="h-7 w-7 shrink-0 rounded-lg bg-white/90 object-contain"
              />
            )}
            <span className="truncate text-sm font-bold">
              {outcome.label}
              {outcome.note ? ` ${outcome.note}` : ''}
            </span>
          </div>
          {price != null && <span className="shrink-0 text-sm font-extrabold">{formatCurrency(price)}</span>}
        </div>
      </div>
    </div>
  );
};

export default PlayerCardModal;
