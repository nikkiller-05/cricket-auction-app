import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';

// Smart Random / mystery-reveal flow: server picks a random eligible player,
// admin reveals or cancels, then hands the revealed player to the existing
// bidding flow. Extracted verbatim from UnifiedDashboard — behavior unchanged.
export default function useSelection({ showError, setActiveTab }) {
  const [selectionMode, setSelectionMode] = useState('all');
  const [selectionBusy, setSelectionBusy] = useState(false);

  const handlePickPlayer = async () => {
    setSelectionBusy(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auction/selection/pick`, { mode: selectionMode });
    } catch (error) {
      showError(error.response?.data?.error || 'Could not pick a player');
    } finally {
      setSelectionBusy(false);
    }
  };

  const handleRevealPlayer = async () => {
    setSelectionBusy(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auction/selection/reveal`);
    } catch (error) {
      showError(error.response?.data?.error || 'Could not reveal the player');
    } finally {
      setSelectionBusy(false);
    }
  };

  // Undo a pick so the admin can change the category and pick again.
  const handleCancelSelection = async () => {
    setSelectionBusy(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auction/selection/cancel`);
    } catch (error) {
      showError(error.response?.data?.error || 'Could not cancel the selection');
    } finally {
      setSelectionBusy(false);
    }
  };

  // Bid: hand the revealed player to the existing bidding flow.
  const handleBidSelected = async (playerId) => {
    setSelectionBusy(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auction/bidding/start/${playerId}`);
      setActiveTab('live');
    } catch (error) {
      showError(error.response?.data?.error || 'Could not start bidding');
    } finally {
      setSelectionBusy(false);
    }
  };

  return {
    selectionMode,
    setSelectionMode,
    selectionBusy,
    handlePickPlayer,
    handleRevealPlayer,
    handleCancelSelection,
    handleBidSelected,
  };
}
