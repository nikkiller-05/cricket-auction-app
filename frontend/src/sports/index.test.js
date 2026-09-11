import { getSportPack, listSports, DEFAULT_SPORT } from './index';

test('returns the cricket pack for the cricket key', () => {
  const pack = getSportPack('cricket');
  expect(pack.key).toBe('cricket');
  expect(pack.teamIcon).toBe('🏏');
  expect(pack.roles).toContain('wicket-keeper');
  expect(pack.categoryLabels['wicket-keeper']).toBe('Keeper');
});

test('falls back to the default sport for unknown keys', () => {
  expect(getSportPack('football').key).toBe(DEFAULT_SPORT);
  expect(getSportPack(undefined).key).toBe(DEFAULT_SPORT);
});

test('lists available sports as {key,label}', () => {
  expect(listSports()).toEqual([{ key: 'cricket', label: 'Cricket' }]);
});
