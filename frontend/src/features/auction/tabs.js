// Builds the dashboard tab list for a given role. Pure so it is unit-testable.
export const buildDashboardTabs = ({
  isAdmin,
  playersCount = 0,
  teamsCount = 0,
}) => {
  const spectatorTabs = [
    { id: 'live', name: 'Live Status', icon: '🔴' },
    { id: 'teams', name: 'Squads', icon: '🏏' },
    { id: 'players', name: 'All Players', icon: '👥' },
    { id: 'stats', name: 'Statistics', icon: '📊' },
  ];

  if (!isAdmin) return spectatorTabs;

  // Auction Tools (reset / fast-track / end) moved into the header controls menu.
  return [
    { id: 'live', name: 'Live Status', icon: '🔴' },
    { id: 'players', name: 'Players', icon: '👥', count: playersCount },
    { id: 'teamsquads', name: 'Squads', icon: '🏏', count: teamsCount },
    { id: 'stats', name: 'Statistics', icon: '📊' },
  ];
};
