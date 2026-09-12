import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';
import { formatCurrency, cleanTeamName } from '../../../lib/format';

// Owns the live auction state: opens the Socket.IO connection, keeps
// `auctionData` in sync from all server events, and exposes a manual fetch +
// the team/player update callbacks. This is the single seam through which the
// dashboard reads live state (the natural place to later scope by auctionId
// for multi-tenant). Extracted verbatim from UnifiedDashboard — behavior is
// intentionally unchanged.
//
// Side-effects that belong to other concerns (activity feed, celebration,
// toasts) are injected so this hook stays focused on data.
export default function useAuctionData({
  addTransaction,
  setTransactionHistory,
  setCurrentPage,
  setCelebration,
  notify,
}) {
  const { showSuccess, showWarning, showInfo } = notify;
  const [auctionData, setAuctionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socketConnection = io(API_BASE_URL);

    socketConnection.on('auctionData', (data) => {
      setAuctionData(data);
      setLoading(false);
    });

    socketConnection.on('playersUpdated', (players) => {
      setAuctionData((prev) => (prev ? { ...prev, players } : prev));
    });

    socketConnection.on('teamsUpdated', (teams) => {
      setAuctionData((prev) => (prev ? { ...prev, teams } : prev));
    });

    socketConnection.on('playerSold', (data) => {
      if (data.player && data.team) {
        addTransaction(data.player, 'sold', data.team, data.finalBid);
        setCelebration({
          type: 'sold',
          player: data.player,
          team: data.team,
          amount: data.finalBid,
        });
        showSuccess(
          `${data.player.name} sold to ${cleanTeamName(data.team.name)} for ${formatCurrency(data.finalBid)}`
        );
      }
    });

    socketConnection.on('playerUnsold', (data) => {
      if (data.player) {
        addTransaction(data.player, 'unsold');
        setCelebration({ type: 'unsold', player: data.player });
        showWarning(`${data.player.name} marked as unsold`);
      }
    });

    socketConnection.on('playerRetained', (data) => {
      if (data.player && data.team) {
        addTransaction(data.player, 'retained', data.team, data.retentionAmount);
        showInfo(
          `${data.player.name} retained by ${cleanTeamName(data.team.name)} for ${formatCurrency(data.retentionAmount)}`
        );
      }
    });

    socketConnection.on('playerRetentionRemoved', (data) => {
      if (data.player && data.team) {
        setTransactionHistory((prev) =>
          prev.filter((t) => !(t.type === 'retained' && t.playerName === data.player.name))
        );
        showWarning(`Retention removed: ${data.player.name} (${formatCurrency(data.refundedAmount)} refunded)`);
      }
    });

    socketConnection.on('captainAssigned', (data) => {
      if (data.player && data.team) {
        addTransaction(data.player, 'captain-assigned', data.team, data.captainAmount);
        showInfo(`👑 ${data.player.name} assigned as captain of ${cleanTeamName(data.team.name)}`);
      }
    });

    socketConnection.on('captainUnassigned', (data) => {
      if (data.team) {
        if (data.player) {
          setTransactionHistory((prev) =>
            prev.filter((t) => !(t.type === 'captain-assigned' && t.playerId === data.player.id))
          );
        }
        showWarning(`Captain unassigned from ${cleanTeamName(data.team.name)}`);
      }
    });

    socketConnection.on('currentBidUpdated', (currentBid) => {
      setAuctionData((prev) => ({ ...prev, currentBid }));
    });

    socketConnection.on('auctionStatusChanged', (status) => {
      setAuctionData((prev) => ({ ...prev, auctionStatus: status }));
    });

    socketConnection.on('statsUpdated', (stats) => {
      setAuctionData((prev) => ({ ...prev, stats }));
    });

    socketConnection.on('settingsUpdated', (settings) => {
      setAuctionData((prev) => ({ ...prev, settings }));
      console.log('Settings updated in real-time:', settings);
    });

    socketConnection.on('fileUploaded', (fileInfo) => {
      showSuccess(`Successfully uploaded ${fileInfo.playerCount} players`);
    });

    socketConnection.on('auctionReset', () => {
      showInfo('Auction has been reset');
      setTransactionHistory([]);
      setCurrentPage(1);
    });

    socketConnection.on('fastTrackStarted', (data) => {
      showInfo(`Fast Track started with ${data.players?.length || 0} players`);
    });

    socketConnection.on('fastTrackEnded', () => {
      showInfo('Fast Track auction ended');
    });

    socketConnection.on('saleUndone', (data) => {
      showWarning(`Sale undone: ${data.player} returned from ${data.team}`);
      setTransactionHistory((prev) => {
        const playerName = typeof data.player === 'string' ? data.player : data.player?.name;
        return prev.filter((t) => !(t.type === 'sold' && t.playerName === playerName));
      });
    });

    socketConnection.on('bidUndone', (data) => {
      showWarning(`Bid undone: ${data.player} (${formatCurrency(data.revertedToAmount)})`);
    });

    socketConnection.on('selectionUpdated', (sel) => {
      setAuctionData((prev) => (prev ? { ...prev, selection: sel } : prev));
    });

    return () => {
      socketConnection.disconnect();
    };
    // Socket is created once on mount; injected setters/addTransaction are
    // stable (useState setters / useCallback), so they don't belong in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAuctionData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auction/data`);
      setAuctionData(response.data);
    } catch (error) {
      console.error('Error fetching auction data:', error);
    }
  };

  // Callbacks passed to child components that edit teams/players in place.
  const handleTeamsUpdate = (updatedTeams) => {
    setAuctionData((prev) => ({ ...prev, teams: updatedTeams }));
  };

  const handlePlayersUpdate = (updatedPlayers) => {
    setAuctionData((prev) => ({ ...prev, players: updatedPlayers }));
  };

  return {
    auctionData,
    setAuctionData,
    loading,
    fetchAuctionData,
    handleTeamsUpdate,
    handlePlayersUpdate,
  };
}
