import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';

// Undo the last sale/unsold or the current bid, with a confirm-modal gate and
// the super-admin action-history feed. Extracted verbatim from UnifiedDashboard
// — behavior is intentionally unchanged. The 'saleUndone' / 'bidUndone' socket
// events broadcast the single notification to everyone.
export default function useUndo({ showError, isAdmin, userRole }) {
  const [undoLoading, setUndoLoading] = useState(false);
  const [actionHistory, setActionHistory] = useState([]);
  const [showUndoConfirmModal, setShowUndoConfirmModal] = useState(false);
  const [undoConfirmAction, setUndoConfirmAction] = useState(null);

  const fetchActionHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auction/history`);
      setActionHistory(response.data.history);
    } catch (error) {
      console.error('Error fetching action history:', error);
    }
  }, []);

  useEffect(() => {
    if (userRole === 'super-admin' && isAdmin) {
      fetchActionHistory();
    }
  }, [userRole, isAdmin, fetchActionHistory]);

  const handleUndoLastSale = useCallback(async () => {
    const lastAction = actionHistory.find(
      (action) => action.type === 'PLAYER_SOLD' || action.type === 'PLAYER_UNSOLD'
    );

    if (!lastAction) {
      showError('No sale or unsold action to undo');
      return;
    }

    const actionType = lastAction.type === 'PLAYER_SOLD' ? 'sale' : 'unsold';
    const message =
      actionType === 'sale'
        ? 'Are you sure you want to undo the last sale? This will refund the money to the team and make the player available again.'
        : `Are you sure you want to undo the unsold action? This will make ${lastAction.playerName} available for bidding again.`;

    setUndoConfirmAction({
      type: actionType,
      message,
      action: async () => {
        setUndoLoading(true);
        try {
          await axios.post(`${API_BASE_URL}/api/auction/undo/sale`);
          fetchActionHistory();
        } catch (error) {
          showError(error.response?.data?.error || 'Failed to undo action');
        } finally {
          setUndoLoading(false);
        }
      },
    });
    setShowUndoConfirmModal(true);
  }, [actionHistory, showError, fetchActionHistory]);

  const handleUndoCurrentBid = useCallback(async () => {
    setUndoConfirmAction({
      type: 'bid',
      message:
        "Are you sure you want to undo the current bid? This will revert to the previous team's bid or base price.",
      action: async () => {
        setUndoLoading(true);
        try {
          await axios.post(`${API_BASE_URL}/api/auction/undo/bid`);
        } catch (error) {
          showError(error.response?.data?.error || 'Failed to undo bid');
        } finally {
          setUndoLoading(false);
        }
      },
    });
    setShowUndoConfirmModal(true);
  }, [showError]);

  const executeUndoAction = async () => {
    setShowUndoConfirmModal(false);
    if (undoConfirmAction) {
      await undoConfirmAction.action();
    }
    setUndoConfirmAction(null);
  };

  const cancelUndoAction = () => {
    setShowUndoConfirmModal(false);
    setUndoConfirmAction(null);
  };

  return {
    undoLoading,
    actionHistory,
    showUndoConfirmModal,
    undoConfirmAction,
    fetchActionHistory,
    handleUndoLastSale,
    handleUndoCurrentBid,
    executeUndoAction,
    cancelUndoAction,
  };
}
