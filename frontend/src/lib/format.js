// Display formatting helpers.

// Settings-aware currency formatter (₹, $, £, €, or points) lives in ./currency.
export { formatCurrency } from './currency';

// Strip a trailing "(N)" counter some team names carry.
export const cleanTeamName = (name) => (name ? name.replace(/\(\d+\)$/, '').trim() : '');

// Compact team label for tight spaces (e.g. bid buttons): multi-word names
// collapse to initials — "Royal Challengers Bangalore" → "RCB", "Champions
// Creed" → "CC", "Warriors CC" → "WCC" (an already-short ALL-CAPS word like
// "CC"/"XI"/"FC" is kept whole rather than reduced to one letter). Single-word
// names are only truncated if long. Keep the full name elsewhere (with a title).
export const abbreviateTeamName = (name, maxLen = 12) => {
  const clean = cleanTeamName(name);
  if (!clean) return clean;
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .map((w) => (/^[A-Z]{2,3}$/.test(w) ? w : w[0].toUpperCase()))
      .join('')
      .slice(0, 5);
  }
  return clean.length > maxLen ? clean.slice(0, 3).toUpperCase() : clean;
};
