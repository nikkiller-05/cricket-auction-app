// Cricket Sport Pack — the sport-specific taxonomy the common auction screens
// read through. Other sports add a sibling pack with the same shape.
export const cricket = {
  key: 'cricket',
  label: 'Cricket',
  teamIcon: '🏏',
  // Player roles/categories for this sport.
  roles: ['batter', 'bowler', 'allrounder', 'wicket-keeper'],
  categoryLabels: {
    batter: 'Batter',
    bowler: 'Bowler',
    allrounder: 'All-rounder',
    'wicket-keeper': 'Keeper',
    captain: 'Captain',
    other: 'Other',
  },
  // Per-category card styling. `iconKey` resolves to an inline SVG in the UI
  // layer; `icon` is a literal emoji. Anything not listed uses defaultCategoryStyle.
  categoryStyles: {
    captain: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      badge: 'bg-purple-100 text-purple-800',
      icon: '👑',
      name: 'Captain',
    },
    batter: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-800',
      iconKey: 'batter',
      name: 'Batters',
    },
    bowler: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-800',
      iconKey: 'bowler',
      name: 'Bowlers',
    },
    allrounder: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      badge: 'bg-orange-100 text-orange-800',
      iconKey: 'allrounder',
      name: 'All-rounders',
    },
    'wicket-keeper': {
      bg: 'bg-green-50',
      border: 'border-green-200',
      badge: 'bg-green-100 text-green-800',
      icon: '🧤',
      name: 'Wicket-keepers',
    },
  },
  defaultCategoryStyle: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-800',
    icon: '👤',
    name: 'Others',
  },
  // External player-profile provider (link builder reads this key off a player).
  externalProfile: { label: 'CricHeroes', urlKey: 'cricHeroesLink' },
};
