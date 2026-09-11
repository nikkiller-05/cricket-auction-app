import { buildDashboardTabs } from './tabs';

test('spectators get the read-only tab set', () => {
  const ids = buildDashboardTabs({ isAdmin: false, userRole: 'spectator' }).map((t) => t.id);
  expect(ids).toEqual(['live', 'teams', 'players', 'stats']);
});

test('super-admin gets config tabs including Auction Tools with the unsold badge', () => {
  const tabs = buildDashboardTabs({
    isAdmin: true,
    userRole: 'super-admin',
    playersCount: 30,
    teamsCount: 6,
    unsoldCount: 4,
  });
  const ids = tabs.map((t) => t.id);
  expect(ids).toEqual(['live', 'reset', 'players', 'teamsquads', 'stats']);
  expect(tabs.find((t) => t.id === 'reset').badge).toBe(4);
  expect(tabs.find((t) => t.id === 'players').count).toBe(30);
});

test('sub-admin (cannot configure) has no config tabs', () => {
  const ids = buildDashboardTabs({ isAdmin: true, userRole: 'sub-admin' }).map((t) => t.id);
  expect(ids).toEqual(['live', 'players', 'teamsquads', 'stats']);
});
