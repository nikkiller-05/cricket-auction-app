import React, { useState } from 'react';
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ResetControls = ({ auctionData, onReset }) => {
  const [loading, setLoading] = useState(false);

  const resetAuction = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset the entire auction? This will:\n\n' +
      '• Move all players back to available status\n' +
      '• Reset all team budgets\n' +
      '• Clear all bids and purchases\n' +
      '• Keep captains assigned to teams\n\n' +
      'This action cannot be undone!'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
  const response = await axios.post(`${API_BASE_URL}/api/auction/reset`);
      alert(response.data.message);
      if (onReset) onReset();
    } catch (error) {
      console.error('Error resetting auction:', error);
      alert(error.response?.data?.error || 'Error resetting auction');
    } finally {
      setLoading(false);
    }
  };

  const startFastTrack = async () => {
    const unsoldCount = auctionData.players?.filter(p => p.status === 'unsold').length || 0;
    
    if (unsoldCount === 0) {
      alert('No unsold players available for fast track auction');
      return;
    }

    const confirmed = window.confirm(
      `Start Fast Track Auction for ${unsoldCount} unsold players?\n\n` +
      'This will move all unsold players back to available status for bidding.'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
  const response = await axios.post(`${API_BASE_URL}/api/auction/fast-track/start`);
      alert(response.data.message);
    } catch (error) {
      console.error('Error starting fast track:', error);
      alert(error.response?.data?.error || 'Error starting fast track auction');
    } finally {
      setLoading(false);
    }
  };

  const endFastTrack = async () => {
    const confirmed = window.confirm(
      'End Fast Track Auction?\n\n' +
      'This will:\n' +
      '• End the fast track round\n' +
      '• Return to main auction if players are still available\n' +
      '• Or finish the entire auction if no players remain'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
  const response = await axios.post(`${API_BASE_URL}/api/auction/fast-track/end`);
      alert(response.data.message);
      
      // Show additional info about next status
      if (response.data.nextStatus === 'finished') {
        alert('🎉 Entire auction completed! All done.');
      } else if (response.data.availablePlayers > 0) {
        alert(`Fast track ended. ${response.data.availablePlayers} players still available for main auction.`);
      }
    } catch (error) {
      console.error('Error ending fast track:', error);
      alert(error.response?.data?.error || 'Error ending fast track auction');
    } finally {
      setLoading(false);
    }
  };

  const finishEntireAuction = async () => {
    const confirmed = window.confirm(
      '🏁 Finish Entire Auction?\n\n' +
      'This will permanently end the auction process.\n' +
      'This action cannot be undone!'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
  const response = await axios.post(`${API_BASE_URL}/api/auction/finish`);
      alert('🎉 ' + response.data.message);
    } catch (error) {
      console.error('Error finishing auction:', error);
      alert(error.response?.data?.error || 'Error finishing auction');
    } finally {
      setLoading(false);
    }
  };

  const unsoldPlayersCount = auctionData.players?.filter(p => p.status === 'unsold').length || 0;
  const soldPlayersCount = auctionData.players?.filter(p => p.status === 'sold').length || 0;
  const availablePlayersCount = auctionData.players?.filter(p => p.status === 'available' && p.category !== 'captain').length || 0;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Auction Management</h3>
      
      {/* Current Status */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{availablePlayersCount}</div>
          <div className="text-sm text-gray-600">Available</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-700">{soldPlayersCount}</div>
          <div className="text-sm text-gray-600">Sold</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-700">{unsoldPlayersCount}</div>
          <div className="text-sm text-gray-600">Unsold</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Reset Auction */}
        <div className="border-l-4 border-red-400 pl-4">
          <h4 className="font-medium text-gray-900 mb-2">Reset Entire Auction</h4>
          <p className="text-sm text-gray-600 mb-3">
            This will reset all players to available status and restore team budgets. 
            Captains will remain assigned to their respective teams.
          </p>
          <button
            onClick={resetAuction}
            disabled={loading || !auctionData.fileUploaded}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            {loading ? 'Resetting...' : 'Reset Auction'}
          </button>
        </div>

        {/* Fast Track Auction */}
        <div className="border-l-4 border-orange-400 pl-4">
          <h4 className="font-medium text-gray-900 mb-2">Fast Track Auction</h4>
          <p className="text-sm text-gray-600 mb-3">
            Give unsold players another chance by moving them back to available status.
            {unsoldPlayersCount > 0 && ` ${unsoldPlayersCount} players available for fast track.`}
          </p>
          
          {auctionData.auctionStatus === 'fast-track' ? (
            <div className="flex space-x-2">
              <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                ⚡ Fast Track Active
              </div>
              <button
                onClick={endFastTrack}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {loading ? 'Ending...' : 'End Fast Track'}
              </button>
            </div>
          ) : (
            <button
              onClick={startFastTrack}
              disabled={loading || unsoldPlayersCount === 0}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {loading ? 'Starting...' : `Start Fast Track (${unsoldPlayersCount} players)`}
            </button>
          )}
        </div>

        {/* Finish Entire Auction */}
        <div className="border-l-4 border-gray-400 pl-4">
          <h4 className="font-medium text-gray-900 mb-2">Complete Auction</h4>
          <p className="text-sm text-gray-600 mb-3">
            Permanently finish the entire auction process. This will end all bidding and finalize results.
          </p>
          
          {auctionData.auctionStatus !== 'finished' && (
            <button
              onClick={finishEntireAuction}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {loading ? 'Finishing...' : 'Finish Entire Auction'}
            </button>
          )}

          {auctionData.auctionStatus === 'finished' && (
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium inline-block">
              ✅ Auction Completed
            </div>
          )}
        </div>

        {/* Auction Status Info */}
        <div className="border-l-4 border-blue-400 pl-4">
          <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              auctionData.auctionStatus === 'running' ? 'bg-green-100 text-green-800' :
              auctionData.auctionStatus === 'fast-track' ? 'bg-orange-100 text-orange-800' :
              auctionData.auctionStatus === 'finished' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {auctionData.auctionStatus === 'running' ? '🔴 Main Auction Active' :
               auctionData.auctionStatus === 'fast-track' ? '⚡ Fast Track Active' :
               auctionData.auctionStatus === 'finished' ? '✅ Auction Completed' :
               '⏹️ Auction Stopped'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetControls;
