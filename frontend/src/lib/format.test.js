import { formatCurrency, cleanTeamName } from './format';

describe('formatCurrency', () => {
  test('formats with the rupee sign and Indian grouping', () => {
    expect(formatCurrency(1000)).toBe('₹1,000');
    expect(formatCurrency(100000)).toBe('₹1,00,000');
  });

  test('treats null/undefined/zero as ₹0', () => {
    expect(formatCurrency(0)).toBe('₹0');
    expect(formatCurrency(null)).toBe('₹0');
    expect(formatCurrency(undefined)).toBe('₹0');
  });
});

describe('cleanTeamName', () => {
  test('strips a trailing "(N)" counter', () => {
    expect(cleanTeamName('Warriors (5)')).toBe('Warriors');
  });

  test('leaves plain names untouched and handles empty input', () => {
    expect(cleanTeamName('Kings')).toBe('Kings');
    expect(cleanTeamName('')).toBe('');
    expect(cleanTeamName(null)).toBe('');
  });
});
