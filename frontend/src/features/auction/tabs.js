// Builds the dashboard tab list for a given role. Pure so it is unit-testable.
export const buildDashboardTabs = ({
  isAdmin,
  userRole,
  playersCount = 0,
  teamsCount = 0,
  unsoldCount = 0,
}) => {
  const spectatorTabs = [
    { id: 'live', name: 'Live Status', icon: '🔴' },
    { id: 'teams', name: 'Squads', icon: '🏏' },
    { id: 'players', name: 'All Players', icon: '👥' },
    { id: 'stats', name: 'Statistics', icon: '📊' },
  ];

  if (!isAdmin) return spectatorTabs;

  const canConfigure = ['super-admin', 'admin'].includes(userRole);
  const baseAdminTabs = [{ id: 'live', name: 'Live Status', icon: '🔴' }];
  const configTabs = [{ id: 'reset', name: 'Auction Tools', icon: '🔄', badge: unsoldCount }];
  const commonTabs = [
    { id: 'players', name: 'Players', icon: '👥', count: playersCount },
    { id: 'teamsquads', name: 'Squads', icon: '🏏', count: teamsCount },
    { id: 'stats', name: 'Statistics', icon: '📊' },
  ];

  return [...baseAdminTabs, ...(canConfigure ? configTabs : []), ...commonTabs];
};
