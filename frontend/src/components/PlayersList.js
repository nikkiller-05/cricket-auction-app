import React, { useState } from 'react';
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PlayersList = ({ players, teams, currentBid, auctionStatus, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // FIXED: Include fast-track mode in bidding conditions
  const canStartBidding = (auctionStatus === 'running' || auctionStatus === 'fast-track');
  const canPerformBidActions = ['super-admin', 'admin', 'sub-admin'].includes(userRole);

  const handleStartBidding = async (playerId) => {
    if (currentBid && currentBid.playerId !== playerId) {
      alert('Another player is currently being bid on. Please complete or cancel that auction first.');
      return;
    }

    setLoading(true);
    try {
  await axios.post(`${API_BASE_URL}/api/auction/bidding/start/${playerId}`);
    } catch (error) {
      alert(error.response?.data?.error || 'Error starting bidding');
    } finally {
      setLoading(false);
    }
  };

  // Filter players based on search and filters
  const filteredPlayers = players?.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || player.category === categoryFilter;
    
    const matchesStatus = statusFilter === 'all' || player.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  const cleanTeamName = (name) => name ? name.replace(/\(\d+\)$/, '').trim() : '';

  const getCategoryStyle = (category) => {
    switch (category) {
      case 'captain':
        return 'bg-purple-100 text-purple-800';
      case 'batter':
        return 'bg-blue-100 text-blue-800';
      case 'bowler':
        return 'bg-red-100 text-red-800';
      case 'allrounder':
        return 'bg-orange-100 text-orange-800';
      case 'wicket-keeper':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'sold':
        return 'bg-green-100 text-green-800';
      case 'available':
        return 'bg-yellow-100 text-yellow-800';
      case 'unsold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">
          Players Management
          {auctionStatus === 'fast-track' && (
            <span className="ml-2 bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-medium">
              FAST TRACK MODE
            </span>
          )}
        </h3>
        
        {/* Auction Status Indicator */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          canStartBidding
            ? 'bg-green-100 text-green-800 animate-pulse'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {auctionStatus === 'running' && '🔴 Live Auction'}
          {auctionStatus === 'fast-track' && '⚡ Fast Track'}
          {auctionStatus === 'stopped' && '⏸️ Paused'}
          {auctionStatus === 'finished' && '✅ Completed'}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Players</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or role..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="captain">Captain</option>
              <option value="batter">Batter</option>
              <option value="bowler">Bowler</option>
              <option value="allrounder">All-rounder</option>
              <option value="wicket-keeper">Wicket-keeper</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="unsold">Unsold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">
            Players List ({filteredPlayers.length} players)
          </h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current/Final Bid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                {canPerformBidActions && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlayers.map((player) => {
                const team = teams?.find(t => t.id === player.team);
                const isCurrentlyBidding = currentBid?.playerId === player.id;
                const canStartBiddingForPlayer = canStartBidding && 
                                               player.status === 'available' && 
                                               player.category !== 'captain' &&
                                               !currentBid;

                return (
                  <tr key={player.id} className={isCurrentlyBidding ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {player.name}
                            {player.category === 'captain' && (
                              <span className="ml-2 text-lg">👑</span>
                            )}
                            {isCurrentlyBidding && (
                              <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                                LIVE
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{player.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(player.category)}`}>
                        {player.category === 'wicket-keeper' ? 'keeper' : player.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(player.status)}`}>
                        {player.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.status === 'sold' ? (
                        <span className="font-bold text-green-600">₹{player.finalBid}</span>
                      ) : player.currentBid > 0 ? (
                        <span className="font-bold text-blue-600">₹{player.currentBid}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {team ? cleanTeamName(team.name) : '-'}
                    </td>
                    {canPerformBidActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {canStartBiddingForPlayer && (
                          <button
                            onClick={() => handleStartBidding(player.id)}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-medium"
                          >
                            {loading ? 'Starting...' : '🔨 Start Bidding'}
                          </button>
                        )}
                        {isCurrentlyBidding && (
                          <span className="text-yellow-600 font-medium">
                            🔥 Currently Bidding
                          </span>
                        )}
                        {player.status === 'sold' && (
                          <span className="text-green-600 font-medium">
                            ✅ Sold
                          </span>
                        )}
                        {player.status === 'unsold' && (
                          <span className="text-red-600 font-medium">
                            ❌ Unsold
                          </span>
                        )}
                        {player.category === 'captain' && (
                          <span className="text-purple-600 font-medium">
                            👑 Captain
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredPlayers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Players Found</h3>
              <p className="text-gray-600">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No players have been uploaded yet'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      {canPerformBidActions && canStartBidding && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">
            {auctionStatus === 'fast-track' ? '⚡ Fast Track Mode Active' : '🔴 Live Auction Mode Active'}
          </h4>
          <p className="text-sm text-blue-700">
            {auctionStatus === 'fast-track' 
              ? 'Fast track mode allows quick bidding on unsold players. Click "Start Bidding" on any available player to begin.'
              : 'Live auction is active. You can start bidding on available players.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default PlayersList;
