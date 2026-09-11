// Bidding-increment rules — mirror of backend utils/biddingRules.js.
// Pure functions so they are trivially unit-testable and reusable.

export const getNextBidIncrement = (currentBid, increments) => {
  if (!increments || increments.length === 0) return 5;
  for (const rule of increments) {
    if (currentBid < rule.threshold) return rule.increment;
  }
  return increments[increments.length - 1].increment;
};

// First bid sits at base price (no increment); otherwise current + increment.
export const computeNextBid = (currentBid, settings) => {
  const basePrice = settings?.basePrice || 0;
  if (!currentBid?.biddingTeam) return basePrice;
  return (
    currentBid.currentAmount + getNextBidIncrement(currentBid.currentAmount, settings?.biddingIncrements)
  );
};
