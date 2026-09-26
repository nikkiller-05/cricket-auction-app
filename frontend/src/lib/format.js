// Display formatting helpers.

// Settings-aware currency formatter (₹, $, £, €, or points) lives in ./currency.
export { formatCurrency } from './currency';

// Strip a trailing "(N)" counter some team names carry.
export const cleanTeamName = (name) => (name ? name.replace(/\(\d+\)$/, '').trim() : '');

// Compact team label for tight spaces (e.g. bid buttons): long names collapse
// to initials — "Royal Challengers Bangalore" → "RCB", "Champions Creed" → "CC".
// Short names are returned as-is. Keep the full name elsewhere (with a title).
export const abbreviateTeamName = (name, maxLen = 12) => {
  const clean = cleanTeamName(name);
  if (!clean || clean.length <= maxLen) return clean;
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return words.map((w) => w[0]).join('').toUpperCase().slice(0, 4);
  return clean.slice(0, 3).toUpperCase();
};
