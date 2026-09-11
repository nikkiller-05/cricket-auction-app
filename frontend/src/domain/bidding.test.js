import { getNextBidIncrement, computeNextBid } from './bidding';

const increments = [
  { threshold: 50, increment: 5 },
  { threshold: 100, increment: 10 },
  { threshold: 200, increment: 20 },
];

describe('getNextBidIncrement', () => {
  test('defaults to 5 when no increments are configured', () => {
    expect(getNextBidIncrement(30, [])).toBe(5);
    expect(getNextBidIncrement(30, undefined)).toBe(5);
  });

  test('picks the increment for the current bid band', () => {
    expect(getNextBidIncrement(30, increments)).toBe(5); // < 50
    expect(getNextBidIncrement(80, increments)).toBe(10); // < 100
    expect(getNextBidIncrement(150, increments)).toBe(20); // < 200
  });

  test('caps at the last increment beyond the highest threshold', () => {
    expect(getNextBidIncrement(500, increments)).toBe(20);
  });
});

describe('computeNextBid', () => {
  const settings = { basePrice: 10, biddingIncrements: increments };

  test('returns base price for the first bid (no bidding team yet)', () => {
    expect(computeNextBid(null, settings)).toBe(10);
    expect(computeNextBid({ currentAmount: 0 }, settings)).toBe(10);
  });

  test('adds the band increment once a team is bidding', () => {
    expect(computeNextBid({ currentAmount: 30, biddingTeam: 't1' }, settings)).toBe(35);
    expect(computeNextBid({ currentAmount: 80, biddingTeam: 't1' }, settings)).toBe(90);
    expect(computeNextBid({ currentAmount: 150, biddingTeam: 't1' }, settings)).toBe(170);
  });

  test('handles missing settings safely', () => {
    expect(computeNextBid(null, undefined)).toBe(0);
  });
});
