// Keyword groups per category (case-insensitive substring match on the role).
const isAllrounderRole = (t) =>
  t.includes('allrounder') ||
  t.includes('all rounder') ||
  t.includes('all-rounder') ||
  /\bar\b/.test(t);
const isKeeperRole = (t) => t.includes('keeper') || t.includes('wicket') || /\bwk\b/.test(t);
const hasBat = (t) => t.includes('batter') || t.includes('batsman') || t.includes('batting');
const hasBowl = (t) => t.includes('bowler') || t.includes('bowling');

// Single PRIMARY category for display/styling.
// Priority: captain > all-rounder > wicket-keeper > batter > bowler.
const determineCategory = (role) => {
  if (!role) return 'other';
  const t = role.toLowerCase();
  if (t.includes('captain')) return 'captain';
  if (isAllrounderRole(t)) return 'allrounder';
  if (isKeeperRole(t)) return 'wicket-keeper';
  if (hasBat(t)) return 'batter';
  if (hasBowl(t)) return 'bowler';
  return 'other';
};

// Multi-membership match for the Smart Random "Pick from" filter. A player can
// belong to more than one pool, e.g. "Wicket Keeper Batter" matches both
// 'wicket-keeper' and 'batter'. Sold/unsold players drop out via their status.
const matchesCategory = (role, mode) => {
  if (!mode || mode === 'all') return true;
  const t = String(role || '').toLowerCase();
  const allrounder = isAllrounderRole(t);
  switch (mode) {
    case 'batting-allrounder':
      return allrounder && (t.includes('batting') || !t.includes('bowling'));
    case 'bowling-allrounder':
      return allrounder && t.includes('bowling');
    case 'allrounder':
      return allrounder;
    case 'wicket-keeper':
      return isKeeperRole(t);
    case 'batter':
      // "batting all-rounder" is an all-rounder, not a batter.
      return !allrounder && hasBat(t);
    case 'bowler':
      return !allrounder && hasBowl(t);
    default:
      return determineCategory(role) === mode;
  }
};

module.exports = {
  determineCategory,
  matchesCategory,
};
  