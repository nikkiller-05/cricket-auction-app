// Currency registry + settings-aware formatter.
// One auction runs at a time, so the active currency is a module-level default
// set from auction settings. (Moves to context when multi-tenant lands.)

export const CURRENCIES = {
  INR: { code: 'INR', label: '₹ Indian Rupee', symbol: '₹', locale: 'en-IN', position: 'prefix' },
  USD: { code: 'USD', label: '$ US Dollar', symbol: '$', locale: 'en-US', position: 'prefix' },
  GBP: { code: 'GBP', label: '£ British Pound', symbol: '£', locale: 'en-GB', position: 'prefix' },
  EUR: { code: 'EUR', label: '€ Euro', symbol: '€', locale: 'en-IE', position: 'prefix' },
  POINTS: { code: 'POINTS', label: 'pts Points', symbol: 'pts', locale: 'en-US', position: 'suffix' },
};

export const DEFAULT_CURRENCY = 'INR';

let activeCurrency = DEFAULT_CURRENCY;

export const setActiveCurrency = (code) => {
  activeCurrency = CURRENCIES[code] ? code : DEFAULT_CURRENCY;
};

export const getActiveCurrency = () => activeCurrency;

// Format an amount using the given currency code, or the active one.
export const formatCurrency = (n, code = activeCurrency) => {
  const c = CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY];
  const num = Number(n || 0).toLocaleString(c.locale);
  return c.position === 'suffix' ? `${num} ${c.symbol}` : `${c.symbol}${num}`;
};

// Options for dropdowns: [{ code, label }, ...]
export const currencyOptions = () =>
  Object.values(CURRENCIES).map(({ code, label }) => ({ code, label }));
