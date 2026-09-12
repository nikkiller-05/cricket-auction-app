import { useCallback, useEffect, useRef, useState } from 'react';

// Owns the sold/unsold/retained activity feed shown on the dashboard.
// Seeds once from the initial auction data, then the socket events (via the
// returned addTransaction) are the source of truth. Extracted verbatim from
// UnifiedDashboard — behavior is intentionally unchanged.
export default function useTransactionHistory(auctionData) {
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  const initializeTransactionHistory = useCallback((data) => {
    if (!data?.players) return;

    const soldPlayers = data.players.filter(
      (p) => p.status === 'sold' && p.category !== 'captain'
    );
    const unsoldPlayers = data.players.filter((p) => p.status === 'unsold');
    const retainedPlayers = data.players.filter((p) => p.status === 'retained');

    const transactions = [];

    retainedPlayers.forEach((player, index) => {
      const team = data.teams?.find((t) => t.id === player.team);
      transactions.push({
        id: `retained-${player.id}`,
        playerId: player.id,
        playerName: player.name,
        playerRole: player.role,
        playerCategory: player.category,
        type: 'retained',
        team: team,
        finalBid: player.retentionAmount || player.finalBid,
        timestamp: new Date(
          Date.now() -
            (retainedPlayers.length + soldPlayers.length + unsoldPlayers.length - index) * 90000
        ),
      });
    });

    soldPlayers.forEach((player, index) => {
      const team = data.teams?.find((t) => t.id === player.team);
      transactions.push({
        id: `sold-${player.id}`,
        playerId: player.id,
        playerName: player.name,
        playerRole: player.role,
        playerCategory: player.category,
        type: 'sold',
        team: team,
        finalBid: player.finalBid,
        timestamp: new Date(Date.now() - (soldPlayers.length - index) * 60000),
      });
    });

    unsoldPlayers.forEach((player, index) => {
      transactions.push({
        id: `unsold-${player.id}`,
        playerId: player.id,
        playerName: player.name,
        playerRole: player.role,
        playerCategory: player.category,
        type: 'unsold',
        team: null,
        finalBid: null,
        timestamp: new Date(Date.now() - (unsoldPlayers.length - index) * 30000),
      });
    });

    transactions.sort((a, b) => b.timestamp - a.timestamp);
    setTransactionHistory(transactions);
  }, []);

  // Seed once; afterwards socket events own the feed (re-running here re-added
  // undone sales via a race).
  const hasInitedTx = useRef(false);
  useEffect(() => {
    if (auctionData && !hasInitedTx.current) {
      hasInitedTx.current = true;
      initializeTransactionHistory(auctionData);
    }
  }, [auctionData, initializeTransactionHistory]);

  const addTransaction = useCallback((player, type, team = null, finalBid = null) => {
    const transaction = {
      id: Date.now() + Math.random(),
      playerId: player.id,
      playerName: player.name,
      playerRole: player.role,
      playerCategory: player.category,
      type,
      team,
      finalBid,
      timestamp: new Date(),
    };
    // Skip if this player+type is already in the feed (guards the
    // init-from-data + socket-event race that produced duplicates).
    setTransactionHistory((prev) =>
      prev.some((t) => t.playerId === player.id && t.type === type) ? prev : [transaction, ...prev]
    );
  }, []);

  return {
    transactionHistory,
    setTransactionHistory,
    addTransaction,
    currentPage,
    setCurrentPage,
    transactionsPerPage,
  };
}
