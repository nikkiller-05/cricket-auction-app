import React from 'react';
import { cleanTeamName } from '../../lib/format';

const SIZES = { xs: 20, sm: 28, md: 40, lg: 56, xl: 72 };

// Rounded-square team logo. Shows the uploaded image (inline data URL) when
// present, otherwise a branded initials badge as a fallback.
const TeamLogo = ({ team, size = 'sm', rounded = 'rounded-lg', className = '' }) => {
  const px = SIZES[size] || SIZES.sm;
  const name = cleanTeamName(team?.name) || '';
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  if (team?.logoUrl) {
    return (
      <img
        src={team.logoUrl}
        alt={name ? `${name} logo` : 'Team logo'}
        width={px}
        height={px}
        crossOrigin="anonymous"
        style={{ width: px, height: px }}
        className={`object-contain bg-white/90 border border-black/10 ${rounded} shrink-0 ${className}`}
      />
    );
  }

  return (
    <span
      style={{ width: px, height: px, fontSize: Math.round(px * 0.4) }}
      className={`inline-flex items-center justify-center font-bold text-white bg-gradient-to-br from-amber-500 to-orange-600 ${rounded} shrink-0 ${className}`}
      aria-label={name ? `${name} logo` : 'Team logo'}
    >
      {initials}
    </span>
  );
};

export default TeamLogo;
