import React from 'react';
import { formatCurrency, cleanTeamName } from '../../lib/format';

// Broadcast-style team standings for the live view: a compact, horizontally
// scrollable strip showing each team's remaining purse (with a depletion bar)
// and squad size. Visible to everyone, so spectators can read the room at a
// glance. Memoized — team budgets only change on a sale, not on every bid.
const initials = (name) =>
  (cleanTeamName(name) || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const TeamStandingsStrip = ({ teams = [], startingBudget = 0, maxPlayers = 0 }) => {
  if (!teams.length) return null;
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Team standings</span>
        <span className="h-px flex-1 bg-slate-200/70" />
      </div>
      <div className="gbx-standings-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {teams.map((t) => {
          const owned = t.players?.length || 0;
          const budget = t.budget || 0;
          const pct = startingBudget > 0 ? Math.max(0, Math.min(100, (budget / startingBudget) * 100)) : 0;
          const barColor = pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-500' : 'bg-rose-500';
          const full = maxPlayers > 0 && owned >= maxPlayers;
          return (
            <div
              key={t.id}
              className="shrink-0 w-44 rounded-2xl border border-slate-200/70 bg-white/90 p-3 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_6px_16px_-10px_rgba(15,23,42,0.18)]"
            >
              <div className="flex items-center gap-2 min-w-0">
                {t.logoUrl ? (
                  <img src={t.logoUrl} alt="" className="h-7 w-7 rounded-lg object-contain bg-slate-100 shrink-0" />
                ) : (
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-[10px] font-bold text-white shrink-0">
                    {initials(t.name)}
                  </div>
                )}
                <span className="truncate text-sm font-bold text-slate-800" title={cleanTeamName(t.name)}>
                  {cleanTeamName(t.name)}
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">Purse</span>
                <span className="text-sm font-extrabold text-slate-900 tabular-nums">{formatCurrency(budget)}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                <div className={`h-full ${barColor} transition-[width] duration-300`} style={{ width: `${pct}%` }} />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-500">Squad</span>
                <span className={`font-bold tabular-nums ${full ? 'text-rose-500' : 'text-slate-700'}`}>
                  {owned}{maxPlayers > 0 ? ` / ${maxPlayers}` : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(TeamStandingsStrip);
