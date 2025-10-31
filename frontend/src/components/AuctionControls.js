import React, { useState } from 'react';
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AuctionControls = ({ auctionData, socket }) => {
  const [loading, setLoading] = useState(false);

  // FIXED: Safe access to settings with default values
  const settings = auctionData?.settings || {
    basePrice: 10,
    teamCount: 4,
    maxPlayersPerTeam: 15,
    startingBudget: 1000,
    biddingIncrements: [
      { threshold: 50, increment: 5 },
      { threshold: 100, increment: 10 }
    ]
  };

  const auctionStatus = auctionData?.auctionStatus || 'stopped';
  const teams = auctionData?.teams || [];

  const handleStartAuction = async () => {
    setLoading(true);
    try {
  await axios.post(`${API_BASE_URL}/api/auction/start`);
    } catch (error) {
      console.error('Error starting auction:', error);
      alert(error.response?.data?.error || 'Error starting auction');
    } finally {
      setLoading(false);
    }
  };

  const handleStopAuction = async () => {
    setLoading(true);
    try {
  await axios.post(`${API_BASE_URL}/api/auction/stop`);
    } catch (error) {
      console.error('Error stopping auction:', error);
      alert(error.response?.data?.error || 'Error stopping auction');
    } finally {
      setLoading(false);
    }
  };

  // Don't render if no auctionData
  if (!auctionData) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Loading auction controls...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900">Auction Controls</h3>
      
      {/* Auction Status Display */}
      <div className="bg-white bg-opacity-15 backdrop-blur-xl rounded-xl shadow-2xl p-6 border-2 border-blue-200 border-opacity-50 hover:bg-opacity-25 transition-all duration-300">
        <h4 className="text-xl font-bold text-gray-900 mb-4">Current Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {auctionStatus.toUpperCase()}
            </div>
            <div className="text-sm text-gray-600">Auction Status</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ₹{settings.basePrice}
            </div>
            <div className="text-sm text-gray-600">Base Price</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {teams.length}
            </div>
            <div className="text-sm text-gray-600">Teams</div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="bg-white bg-opacity-15 backdrop-blur-xl rounded-xl shadow-2xl p-6 border-2 border-green-200 border-opacity-50 hover:bg-opacity-25 transition-all duration-300">
        <h4 className="text-xl font-bold text-gray-900 mb-4">Controls</h4>
        <div className="flex space-x-4">
          {auctionStatus === 'stopped' && (
            <button
              onClick={handleStartAuction}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-md font-medium"
            >
              {loading ? 'Starting...' : 'Start Auction'}
            </button>
          )}
          
          {auctionStatus === 'running' && (
            <button
              onClick={handleStopAuction}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-3 rounded-md font-medium"
            >
              {loading ? 'Stopping...' : 'Stop Auction'}
            </button>
          )}
        </div>
      </div>

      {/* Settings Display */}
      <div className="bg-white bg-opacity-15 backdrop-blur-xl rounded-xl shadow-2xl p-6 border-2 border-purple-200 border-opacity-50 hover:bg-opacity-25 transition-all duration-300">
        <h4 className="text-xl font-bold text-gray-900 mb-4">Current Settings</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Base Price</div>
            <div className="text-lg font-bold">₹{settings.basePrice}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Teams</div>
            <div className="text-lg font-bold">{settings.teamCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Max Players/Team</div>
            <div className="text-lg font-bold">{settings.maxPlayersPerTeam}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Starting Budget</div>
            <div className="text-lg font-bold">₹{settings.startingBudget}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionControls;
