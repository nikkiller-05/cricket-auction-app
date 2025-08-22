const getNextBidIncrement = (currentBid, biddingIncrements) => {
  try {
    // Default increment if no rules are set
    if (!biddingIncrements || biddingIncrements.length === 0) {
      return 5;
    }
    
    for (const rule of biddingIncrements) {
      if (currentBid < rule.threshold) {
        return rule.increment;
      }
    }
    
    const lastRule = biddingIncrements[biddingIncrements.length - 1];
    return lastRule.increment;
  } catch (error) {
    console.error('Error calculating increment:', error);
    return 5; // Default increment
  }
};

// COMPLETELY FIXED: Calculate stats excluding captains and zero/invalid bids
const calculateStats = (players) => {
  console.log('Calculating stats for players:', players.length);
  
  // STRICT FILTER: Only include players sold through bidding (exclude captains and zero bids)
  const validSoldPlayers = players.filter(p => {
    const isValidSale = p.status === 'sold' && 
                       p.category !== 'captain' && 
                       p.finalBid && 
                       p.finalBid > 0;
    
    if (!isValidSale && p.status === 'sold') {
      console.log('Excluding from stats:', p.name, p.category, p.finalBid);
    }
    
    return isValidSale;
  });
  
  console.log('Valid sold players for stats:', validSoldPlayers.length);
  
  const unsoldPlayers = players.filter(p => p.status === 'unsold');
  
  // If no valid sold players, return null stats
  if (validSoldPlayers.length === 0) {
    console.log('No valid sold players, returning null stats');
    return {
      highestBid: null,
      lowestBid: null,
      totalSold: 0,
      totalUnsold: unsoldPlayers.length,
      averageBid: 0
    };
  }

  // Get all valid bid amounts (should all be > 0)
  const bidAmounts = validSoldPlayers.map(p => p.finalBid);
  console.log('Valid bid amounts:', bidAmounts);
  
  // Find highest and lowest bid players from valid sales only
  const maxBidAmount = Math.max(...bidAmounts);
  const minBidAmount = Math.min(...bidAmounts);
  
  const highestBidPlayer = validSoldPlayers.find(p => p.finalBid === maxBidAmount);
  const lowestBidPlayer = validSoldPlayers.find(p => p.finalBid === minBidAmount);
  
  console.log('Highest bid player:', highestBidPlayer?.name, maxBidAmount);
  console.log('Lowest bid player:', lowestBidPlayer?.name, minBidAmount);
  
  const stats = {
    highestBid: {
      player: highestBidPlayer,
      amount: maxBidAmount
    },
    lowestBid: {
      player: lowestBidPlayer,
      amount: minBidAmount
    },
    totalSold: validSoldPlayers.length,
    totalUnsold: unsoldPlayers.length,
    averageBid: bidAmounts.reduce((a, b) => a + b, 0) / bidAmounts.length
  };
  
  console.log('Final stats:', stats);
  return stats;
};

module.exports = {
  getNextBidIncrement,
  calculateStats
};
