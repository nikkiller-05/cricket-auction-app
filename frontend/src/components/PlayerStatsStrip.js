import React from 'react';

/**
 * PlayerStatsStrip
 * Compact pill row showing key cricket stats. Renders nothing if the player
 * has no stat fields populated.
 *
 * Props:
 *   - player: { matches, runs, wickets, battingAvg, highestScore, strikeRate, economy, bestBowling, battingHand, bowlingStyle, city }
 *   - variant: 'light' (default, for white/yellow backgrounds) | 'dark'
 *   - compact: boolean — smaller variant for table rows
 */
const PlayerStatsStrip = ({ player = {}, variant = 'light', compact = false }) => {
  // Always render the full strip; show "—" for missing values so the layout
  // is consistent across players regardless of which stats are populated.
  const dash = (v) =>
    v === undefined || v === null || String(v).trim() === '' ? '—' : v;

  const items = [
    { label: 'Mat', value: dash(player.matches) },
    { label: 'Runs', value: dash(player.runs) },
    { label: 'Wkts', value: dash(player.wickets) },
    { label: 'Avg', value: dash(player.battingAvg) },
    { label: 'HS', value: dash(player.highestScore) },
    { label: 'SR', value: dash(player.strikeRate) },
    { label: 'Econ', value: dash(player.economy) },
    { label: 'BB', value: dash(player.bestBowling) },
  ];

  const pillBase =
    variant === 'dark'
      ? 'bg-white bg-opacity-15 border-white border-opacity-30 text-white'
      : 'bg-white bg-opacity-80 border-gray-300 text-gray-900';

  const pad = compact ? 'px-2 py-0.5' : 'px-3 py-1';
  const num = compact ? 'text-xs' : 'text-sm';
  const lbl = compact ? 'text-[10px]' : 'text-[11px]';

  const handStyle = [player.battingHand, player.bowlingStyle].filter(Boolean).join(' · ');

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
      {items.map((s) => (
        <div
          key={s.label}
          className={`${pillBase} ${pad} rounded-full border shadow-sm flex items-baseline gap-1`}
          title={`${s.label}: ${s.value}`}
        >
          <span className={`${num} font-bold leading-none`}>{s.value}</span>
          <span className={`${lbl} uppercase tracking-wide opacity-75 leading-none`}>{s.label}</span>
        </div>
      ))}
      {handStyle && (
        <div
          className={`${pillBase} ${pad} rounded-full border shadow-sm ${num} font-medium`}
          title={handStyle}
        >
          {handStyle}
        </div>
      )}
    </div>
  );
};

export default PlayerStatsStrip;
