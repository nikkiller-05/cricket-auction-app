import React from 'react';
import { formatCurrency, cleanTeamName } from '../../lib/format';

// Broadcast-style "latest sales" strip for the live view: a slim, horizontally
// scrollable row of the most recent acquisitions (player → team · price), newest
// first. Memoized — the feed only changes on a sale, not on every bid.
const RecentSalesTicker = ({ transactions = [] }) => {
  const sales = transactions
    .filter((t) => t && t.type !== 'unsold' && t.team && t.finalBid != null)
    .slice(0, 12);
  if (!sales.length) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Latest sales
        </span>
        <div className="gbx-ticker-scroll flex flex-1 gap-2 overflow-x-auto pb-1">
          {sales.map((s) => (
            <div
              key={s.id}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200/70 bg-white/90 px-3 py-1.5 shadow-sm"
            >
              <span className="max-w-[130px] truncate text-sm font-bold text-slate-800" title={s.playerName}>
                {s.playerName}
              </span>
              <span className="text-slate-400" aria-hidden="true">→</span>
              <span className="max-w-[120px] truncate text-xs font-semibold text-slate-600" title={cleanTeamName(s.team.name)}>
                {cleanTeamName(s.team.name)}
              </span>
              <span className="tabular-nums text-sm font-extrabold text-emerald-600">{formatCurrency(s.finalBid)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(RecentSalesTicker);
