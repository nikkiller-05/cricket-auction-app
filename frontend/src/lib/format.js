// Display formatting helpers.

// Indian-style number formatting for currency.
export const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Strip a trailing "(N)" counter some team names carry.
export const cleanTeamName = (name) => (name ? name.replace(/\(\d+\)$/, '').trim() : '');
