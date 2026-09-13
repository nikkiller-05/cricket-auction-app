import { buildDashboardTabs } from './tabs';

test('spectators get the read-only tab set', () => {
  const ids = buildDashboardTabs({ isAdmin: false, userRole: 'spectator' }).map((t) => t.id);
  expect(ids).toEqual(['live', 'teams', 'players', 'stats']);
});

test('admins get the operator tab set (Auction Tools moved to the header menu)', () => {
  const tabs = buildDashboardTabs({
    isAdmin: true,
    userRole: 'super-admin',
    playersCount: 30,
    teamsCount: 6,
    unsoldCount: 4,
  });
  const ids = tabs.map((t) => t.id);
  expect(ids).toEqual(['live', 'players', 'teamsquads', 'stats']);
  expect(tabs.find((t) => t.id === 'players').count).toBe(30);
});

test('sub-admin gets the same operator tab set', () => {
  const ids = buildDashboardTabs({ isAdmin: true, userRole: 'sub-admin' }).map((t) => t.id);
  expect(ids).toEqual(['live', 'players', 'teamsquads', 'stats']);
});
