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
  // External player-profile provider (link builder reads this key off a player).
  externalProfile: { label: 'CricHeroes', urlKey: 'cricHeroesLink' },
};
