import {
  formatCurrency,
  setActiveCurrency,
  getActiveCurrency,
  DEFAULT_CURRENCY,
  currencyOptions,
} from './currency';

afterEach(() => setActiveCurrency(DEFAULT_CURRENCY));

describe('formatCurrency with explicit code', () => {
  test('prefixes the symbol for standard currencies', () => {
    expect(formatCurrency(1000, 'INR')).toBe('₹1,000');
    expect(formatCurrency(1000, 'USD')).toBe('$1,000');
    expect(formatCurrency(1000, 'GBP')).toBe('£1,000');
    expect(formatCurrency(1000, 'EUR')).toBe('€1,000');
  });

  test('suffixes "pts" for points', () => {
    expect(formatCurrency(1000, 'POINTS')).toBe('1,000 pts');
    expect(formatCurrency(0, 'POINTS')).toBe('0 pts');
  });

  test('falls back to the default for unknown codes and null amounts', () => {
    expect(formatCurrency(null, 'INR')).toBe('₹0');
    expect(formatCurrency(50, 'XXX')).toBe('₹50');
  });
});

describe('active currency', () => {
  test('setActiveCurrency changes the default used by formatCurrency', () => {
    setActiveCurrency('USD');
    expect(getActiveCurrency()).toBe('USD');
    expect(formatCurrency(2500)).toBe('$2,500');

    setActiveCurrency('POINTS');
    expect(formatCurrency(2500)).toBe('2,500 pts');
  });

  test('ignores invalid codes', () => {
    setActiveCurrency('NOPE');
    expect(getActiveCurrency()).toBe(DEFAULT_CURRENCY);
  });
});

test('currencyOptions lists all supported currencies', () => {
  const codes = currencyOptions().map((o) => o.code);
  expect(codes).toEqual(['INR', 'USD', 'GBP', 'EUR', 'POINTS']);
});
