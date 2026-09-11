// Display formatting helpers.

// Settings-aware currency formatter (₹, $, £, €, or points) lives in ./currency.
export { formatCurrency } from './currency';

// Strip a trailing "(N)" counter some team names carry.
export const cleanTeamName = (name) => (name ? name.replace(/\(\d+\)$/, '').trim() : '');
