import React from 'react';
import { getSportPack } from '../../sports';

// Player category taxonomy + styling. NOTE: currently cricket-specific; this is
// the seam that becomes the per-sport "Sport Pack" in a later phase.

// Cyclic team color chips.
export const getTeamStyle = (teamId, teams) => {
  if (!teamId || !teams) return 'bg-gray-100 text-gray-800 border border-gray-300';

  const teamColors = [
    'bg-blue-100 text-blue-800 border border-blue-300',
    'bg-green-100 text-green-800 border border-green-300',
    'bg-purple-100 text-purple-800 border border-purple-300',
    'bg-orange-100 text-orange-800 border border-orange-300',
    'bg-red-100 text-red-800 border border-red-300',
    'bg-indigo-100 text-indigo-800 border border-indigo-300',
    'bg-pink-100 text-pink-800 border border-pink-300',
    'bg-teal-100 text-teal-800 border border-teal-300',
    'bg-yellow-100 text-yellow-800 border border-yellow-300',
    'bg-cyan-100 text-cyan-800 border border-cyan-300',
  ];

  const teamIndex = teams.findIndex((team) => team.id === teamId);
  return teamIndex !== -1
    ? teamColors[teamIndex % teamColors.length]
    : 'bg-gray-100 text-gray-800 border border-gray-300';
};

// Inline SVG cricket icons (scalable, themeable, no external dependency)
export const CATEGORY_ICONS = {
  batter: (
    <svg viewBox="0 0 24 24" className="w-9 h-9 inline-block align-middle text-blue-600" fill="currentColor" aria-hidden="true">
      <g transform="rotate(42 12 12)">
        <rect x="10.7" y="2.5" width="2.6" height="6.5" rx="1.3" />
        <rect x="8.6" y="9" width="6.8" height="12.5" rx="3.4" />
      </g>
    </svg>
  ),
  bowler: (
    <svg viewBox="0 0 24 24" className="w-7 h-7 inline-block align-middle text-red-600" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 5.5c2.5 3.8 2.5 9.2 0 13" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="1.6 1.9" opacity="0.9" />
    </svg>
  ),
  allrounder: (
    <svg viewBox="0 0 24 24" className="w-9 h-9 inline-block align-middle text-orange-600" fill="currentColor" aria-hidden="true">
      <g transform="rotate(42 9 11)">
        <rect x="7.7" y="2.5" width="2" height="5" rx="1" />
        <rect x="6.1" y="7.6" width="5.2" height="10" rx="2.6" />
      </g>
      <circle cx="17.2" cy="16.5" r="4" />
      <path d="M15 13.7c1.5 1.5 1.5 4.1 0 5.6" fill="none" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" strokeDasharray="1.2 1.4" opacity="0.9" />
    </svg>
  ),
};

export const getCategoryStyle = (category) => {
  const pack = getSportPack('cricket');
  const style = pack.categoryStyles[category] || pack.defaultCategoryStyle;
  // Resolve inline SVG icons by key; fall back to the literal emoji.
  const icon = style.iconKey ? CATEGORY_ICONS[style.iconKey] : style.icon;
  return { bg: style.bg, border: style.border, badge: style.badge, icon, name: style.name };
};

// Readable category label (e.g. "wicket-keeper" -> "Keeper"), sourced from the
// active Sport Pack so other sports supply their own labels.
const CATEGORY_LABELS = getSportPack('cricket').categoryLabels;

export const formatCategoryLabel = (c) =>
  CATEGORY_LABELS[c] || (c ? c.charAt(0).toUpperCase() + c.slice(1) : 'Other');

// Reusable colored category pill.
export const CategoryTag = ({ category, className = '' }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryStyle(category).badge} ${className}`}
  >
    {formatCategoryLabel(category)}
  </span>
);
