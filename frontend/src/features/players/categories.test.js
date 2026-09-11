import { getCategoryStyle, formatCategoryLabel, getTeamStyle } from './categories';

describe('getCategoryStyle', () => {
  test('returns the display name + badge per known role', () => {
    expect(getCategoryStyle('batter').name).toBe('Batters');
    expect(getCategoryStyle('bowler').badge).toContain('red');
    expect(getCategoryStyle('wicket-keeper').name).toBe('Wicket-keepers');
  });

  test('falls back to Others for unknown categories', () => {
    expect(getCategoryStyle('unknown').name).toBe('Others');
  });
});

describe('formatCategoryLabel', () => {
  test('maps known roles and capitalizes unknown ones', () => {
    expect(formatCategoryLabel('wicket-keeper')).toBe('Keeper');
    expect(formatCategoryLabel('batter')).toBe('Batter');
    expect(formatCategoryLabel('coach')).toBe('Coach');
    expect(formatCategoryLabel('')).toBe('Other');
  });
});

describe('getTeamStyle', () => {
  const teams = [{ id: 'a' }, { id: 'b' }];

  test('is stable for a given team', () => {
    expect(getTeamStyle('a', teams)).toBe(getTeamStyle('a', teams));
  });

  test('is neutral gray when team or list is missing', () => {
    expect(getTeamStyle(null, teams)).toContain('gray');
    expect(getTeamStyle('a', null)).toContain('gray');
  });
});
