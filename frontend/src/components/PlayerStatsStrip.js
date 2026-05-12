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
  const items = [
    { label: 'Mat', value: player.matches },
    { label: 'Runs', value: player.runs },
    { label: 'Wkts', value: player.wickets },
    { label: 'Avg', value: player.battingAvg },
    { label: 'HS', value: player.highestScore },
    { label: 'SR', value: player.strikeRate },
    { label: 'Econ', value: player.economy },
    { label: 'BB', value: player.bestBowling },
  ].filter((s) => s.value !== undefined && s.value !== null && String(s.value).trim() !== '');

  if (items.length === 0) return null;

  const pillBase =
    variant === 'dark'
      ? 'bg-white bg-opacity-15 border-white border-opacity-30 text-white'
      : 'bg-white bg-opacity-80 border-gray-300 text-gray-900';

  const pad = compact ? 'px-2 py-0.5' : 'px-3 py-1';
  const num = compact ? 'text-xs' : 'text-sm';
  const lbl = compact ? 'text-[10px]' : 'text-[11px]';

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
      {(player.battingHand || player.bowlingStyle) && (
        <div
          className={`${pillBase} ${pad} rounded-full border shadow-sm ${num} font-medium`}
          title={[player.battingHand, player.bowlingStyle].filter(Boolean).join(' · ')}
        >
          {[player.battingHand, player.bowlingStyle].filter(Boolean).join(' · ')}
        </div>
      )}
    </div>
  );
};

export default PlayerStatsStrip;
