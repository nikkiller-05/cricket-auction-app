import React from 'react';

// Dashboard quick-stat cards. Retained/Captains cards appear only when their
// feature is enabled; the grid column count adapts to the number of cards.
const StatCards = ({
  totalPlayers = 0,
  sold = 0,
  retained = 0,
  captains = 0,
  available = 0,
  unsold = 0,
  enableCaptains = true,
  enableRetention = false,
}) => {
  const statCards = [
    { label: 'Total Players', value: totalPlayers, accent: 'from-indigo-500 to-violet-500' },
    { label: 'Players Sold', value: sold, accent: 'from-emerald-500 to-teal-500' },
    ...(enableRetention
      ? [{ label: 'Retained', value: retained, accent: 'from-fuchsia-500 to-purple-500' }]
      : []),
    ...(enableCaptains
      ? [{ label: 'Captains', value: captains, accent: 'from-amber-500 to-orange-500' }]
      : []),
    { label: 'Available', value: available, accent: 'from-sky-500 to-cyan-500' },
    { label: 'Unsold', value: unsold, accent: 'from-rose-500 to-red-500' },
  ];
  const colsClass =
    { 4: 'md:grid-cols-4', 5: 'md:grid-cols-5', 6: 'md:grid-cols-6' }[statCards.length] ||
    'md:grid-cols-6';

  return (
    <div className={`gbx-stats-grid grid grid-cols-2 sm:grid-cols-3 ${colsClass} gap-3 mb-8`}>
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="gbx-stat-card group relative overflow-hidden rounded-xl border border-slate-200/70 bg-white/90 p-4 text-left shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_6px_16px_-10px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 hover:border-slate-300/80 transition-[transform,box-shadow,border-color] duration-200"
        >
          <span
            className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${stat.accent} opacity-80`}
          />
          <div className="gbx-stat-label text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-500">
            {stat.label}
          </div>
          <div
            className={`gbx-stat-value mt-1 text-3xl font-bold bg-gradient-to-br ${stat.accent} bg-clip-text text-transparent`}
          >
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
