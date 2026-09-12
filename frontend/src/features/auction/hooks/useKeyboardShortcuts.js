import { useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';
import { cleanTeamName, formatCurrency } from '../../../lib/format';
import { computeNextBid } from '../../../domain/bidding';

// Super-admin keyboard shortcuts: Ctrl/Cmd+Z smart undo, Ctrl+Shift+Z undo
// sale/unsold, Ctrl+B undo bid, number keys 1-9 quick team bids (teams < 10).
// Extracted verbatim from UnifiedDashboard — behavior is intentionally unchanged.
export default function useKeyboardShortcuts({
  userRole,
  undoLoading,
  auctionData,
  actionHistory,
  handleUndoLastSale,
  handleUndoCurrentBid,
  showError,
}) {
  useEffect(() => {
    if (userRole !== 'super-admin') return undefined;

    const handleKeyDown = (e) => {
      // Prevent keyboard shortcuts when typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Ctrl+Z or Cmd+Z: Smart undo (bid if active, otherwise last sale/unsold)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (undoLoading) return;

        if (auctionData?.currentBid) {
          handleUndoCurrentBid();
        } else {
          handleUndoLastSale();
        }
      }

      // Ctrl+Shift+Z: Undo Last Sale/Unsold
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        if (!undoLoading) {
          handleUndoLastSale();
        }
      }

      // Ctrl+B: Undo Last Bid
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        if (auctionData?.currentBid && !undoLoading) {
          handleUndoCurrentBid();
        }
      }

      // Number keys 1-9: Quick team bidding (only if teams < 10)
      const teams = auctionData?.teams || [];
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 9 && teams.length < 10 && teams.length >= keyNum) {
          e.preventDefault();
          if (auctionData?.currentBid?.playerId) {
            const team = teams[keyNum - 1];
            if (team) {
              // Same guards as the on-screen bid buttons.
              const nextBidAmount = computeNextBid(auctionData.currentBid, auctionData.settings);
              const maxPlayers = auctionData.settings?.maxPlayersPerTeam || 15;
              if (team.players?.length >= maxPlayers) {
                showError(
                  `Team ${cleanTeamName(team.name)} is full (${team.players?.length}/${maxPlayers} players)`
                );
                return;
              }
              if (team.budget < nextBidAmount) {
                showError(
                  `Insufficient budget for ${cleanTeamName(team.name)} (${formatCurrency(team.budget)})`
                );
                return;
              }
              axios
                .post(`${API_BASE_URL}/api/auction/bidding/place`, { teamId: team.id })
                .catch((error) => showError(error.response?.data?.error || 'Failed to place bid'));
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    userRole,
    undoLoading,
    auctionData,
    actionHistory,
    handleUndoLastSale,
    handleUndoCurrentBid,
    showError,
  ]);
}
