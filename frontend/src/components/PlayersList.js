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

  const getTeamStyle = (teamId, teams) => {
    if (!teamId || !teams) return 'bg-gray-100 text-gray-800 border border-gray-300';
    
    const teamColors = [
      'bg-blue-100 text-blue-800 border border-blue-300',
      'bg-green-100 text-green-800 border border-green-300', 
      'bg-purple-100 text-purple-800 border border-purple-300',
      'bg-orange-100 text-orange-800 border border-orange-300',
      'bg-red-100 text-red-800 border border-red-300',
      'bg-indigo-100 text-indigo-800 border border-indigo-300',
      'bg-pink-100 text-pink-800 border border-pink-300',
      'bg-teal-100 text-teal-800 border border-teal-300',
      'bg-yellow-100 text-yellow-800 border border-yellow-300',
      'bg-cyan-100 text-cyan-800 border border-cyan-300'
    ];
    
    const teamIndex = teams.findIndex(team => team.id === teamId);
    return teamIndex !== -1 ? teamColors[teamIndex % teamColors.length] : 'bg-gray-100 text-gray-800 border border-gray-300';
  };

  const getCategoryStyle = (category) => {
    switch (category) {
      case 'captain':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'batter':
        return 'bg-gray-200 text-gray-800 border-gray-400';
      case 'bowler':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'allrounder':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'wicket-keeper':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'sold':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'assigned':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'retained':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'available':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'unsold':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900">
          Players Management
          {auctionStatus === 'fast-track' && (
            <span className="ml-2 bg-orange-100 text-orange-800 px-2 py-1 rounded text-base font-semibold">
              FAST TRACK MODE
            </span>
          )}
        </h3>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl shadow-2xl p-6 border-2 border-blue-400 border-opacity-70 hover:bg-opacity-30 transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">Search Players</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or role..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">Filter by Category</label>
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
            <label className="block text-base font-semibold text-gray-700 mb-1">Filter by Status</label>
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
      <div className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border-2 border-gray-400 border-opacity-60">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-xl font-bold text-gray-900">
            Players List ({filteredPlayers.length} players)
          </h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-400 divide-opacity-50 border-2 border-gray-400 border-opacity-30">
            <thead className="bg-gray-100 bg-opacity-80">
              <tr className="border-b-2 border-gray-400 border-opacity-40">
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Player
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Category
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Current/Final Bid
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Team
                </th>
                {canPerformBidActions && (
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white bg-opacity-20 divide-y divide-gray-400 divide-opacity-40">
              {filteredPlayers.map((player) => {
                const team = teams?.find(t => t.id === player.team);
                const isCurrentlyBidding = currentBid?.playerId === player.id;
                const canStartBiddingForPlayer = canStartBidding && 
                                               player.status === 'available' && 
                                               player.category !== 'captain' &&
                                               !currentBid;

                return (
                  <tr key={player.id} className={isCurrentlyBidding ? 'bg-yellow-100 bg-opacity-70 border-b border-gray-400 border-opacity-40' : 'hover:bg-gray-100 hover:bg-opacity-50 border-b border-gray-300 border-opacity-30'}>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-300 border-opacity-30 text-center">
                      <div className="flex flex-col items-center">
                        <div>
                          <div className="text-lg font-bold text-gray-900 flex items-center justify-center">
                            {player.name}
                            {player.category === 'captain' && (
                              <span className="ml-2 text-lg bg-yellow-100 px-1 py-0.5 rounded-full border border-yellow-300">👑</span>
                            )}
                            {player.status === 'retained' && (
                              <span className="ml-2 text-sm bg-cyan-100 px-1 py-0.5 rounded-full border border-cyan-300">🔒</span>
                            )}
                            {isCurrentlyBidding && (
                              <span className="ml-2 bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium animate-pulse border border-yellow-400">
                                LIVE
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 text-center">{player.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-300 border-opacity-30 text-center">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryStyle(player.category)}`}>
                          {player.category === 'wicket-keeper' ? 'keeper' : player.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-300 border-opacity-30 text-center">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(player.status)}`}>
                          {player.status === 'assigned' ? 'Captain' : 
                           player.status === 'retained' ? 'Retained' :
                           player.status === 'sold' ? 'Sold' :
                           player.status === 'unsold' ? 'Unsold' :
                           player.status === 'available' ? 'Available' :
                           player.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300 border-opacity-30 text-center">
                      {player.status === 'sold' ? (
                        <span className="font-bold text-green-600">₹{player.finalBid}</span>
                      ) : player.status === 'assigned' ? (
                        <span className="font-bold text-purple-600">Captain</span>
                      ) : player.status === 'retained' ? (
                        <span className="font-bold text-blue-600">₹{player.retentionAmount || player.finalBid}</span>
                      ) : player.currentBid > 0 ? (
                        <span className="font-bold text-blue-600">₹{player.currentBid}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300 border-opacity-30 text-center">
                      <div className="flex items-center justify-center">
                        {team ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${getTeamStyle(player.team, teams)}`}>
                            🏏 {cleanTeamName(team.name)}
                          </span>
                        ) : '-'}
                      </div>
                    </td>
                    {canPerformBidActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex justify-center">
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
                        </div>
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
