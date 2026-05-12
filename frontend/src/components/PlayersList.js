import React, { useState, memo, useMemo, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from './NotificationSystem';
import PlayerAvatar from './PlayerAvatar';
import PlayerImageUpload from './PlayerImageUpload';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Module-scope helpers — stable references, never recreated per render.
const TEAM_COLORS = [
  'bg-blue-100 text-blue-800 border border-blue-300',
  'bg-green-100 text-green-800 border border-green-300',
  'bg-purple-100 text-purple-800 border border-purple-300',
  'bg-orange-100 text-orange-800 border border-orange-300',
  'bg-red-100 text-red-800 border border-red-300',
  'bg-indigo-100 text-indigo-800 border border-indigo-300',
  'bg-pink-100 text-pink-800 border border-pink-300',
  'bg-teal-100 text-teal-800 border border-teal-300',
  'bg-yellow-100 text-yellow-800 border border-yellow-300',
  'bg-cyan-100 text-cyan-800 border border-cyan-300',
];

const cleanTeamName = (name) => (name ? name.replace(/\(\d+\)$/, '').trim() : '');

const getTeamStyle = (teamId, teams) => {
  if (!teamId || !teams) return 'bg-gray-100 text-gray-800 border border-gray-300';
  const teamIndex = teams.findIndex((team) => team.id === teamId);
  return teamIndex !== -1
    ? TEAM_COLORS[teamIndex % TEAM_COLORS.length]
    : 'bg-gray-100 text-gray-800 border border-gray-300';
};

const CATEGORY_STYLES = {
  captain: 'bg-purple-100 text-purple-800 border-purple-300',
  batter: 'bg-gray-200 text-gray-800 border-gray-400',
  bowler: 'bg-red-100 text-red-800 border-red-300',
  allrounder: 'bg-orange-100 text-orange-800 border-orange-300',
  'wicket-keeper': 'bg-green-100 text-green-800 border-green-300',
};
const getCategoryStyle = (category) =>
  CATEGORY_STYLES[category] || 'bg-gray-100 text-gray-800 border-gray-300';

const PlayersList = memo(({ players, teams, currentBid, auctionStatus, userRole, onDataRefresh }) => {
  const { showWarning, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Debounce search so filtering doesn't run on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // FIXED: Include fast-track mode in bidding conditions
  const canStartBidding = (auctionStatus === 'running' || auctionStatus === 'fast-track');
  const canPerformBidActions = ['super-admin', 'admin', 'sub-admin'].includes(userRole);

  const handleStartBidding = useCallback(async (playerId) => {
    if (currentBid && currentBid.playerId !== playerId) {
      showWarning('Another player is currently being bid on. Please complete or cancel that auction first.', 'Bidding In Progress');
      return;
    }

    setLoading(true);
    try {
  await axios.post(`${API_BASE_URL}/api/auction/bidding/start/${playerId}`);
    } catch (error) {
      showError(error.response?.data?.error || 'Error starting bidding', 'Bidding Error');
    } finally {
      setLoading(false);
    }
  }, [currentBid, showWarning, showError]);

  // Filter players based on search and filters - MEMOIZED for performance
  const filteredPlayers = useMemo(() => {
    if (!players?.length) return [];
    return players.filter((player) => {
      const matchesSearch = !debouncedSearch
        || player.name?.toLowerCase().includes(debouncedSearch)
        || player.role?.toLowerCase().includes(debouncedSearch);
      const matchesCategory = categoryFilter === 'all' || player.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || player.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [players, debouncedSearch, categoryFilter, statusFilter]);

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
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
          Players Management
          {auctionStatus === 'fast-track' && (
            <span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              ⚡ FAST TRACK
            </span>
          )}
        </h3>
      </div>

      {/* Search and Filter Controls */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-500 mb-1.5">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or role…"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-500 mb-1.5">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
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
            <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-500 mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
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
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 overflow-hidden shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)]">
        <div className="px-6 py-4 border-b border-slate-200/70 flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-900 tracking-tight">
            Players List
          </h4>
          <span className="text-xs font-semibold text-slate-500">{filteredPlayers.length} {filteredPlayers.length === 1 ? 'player' : 'players'}</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
                  Player
                </th>
                <th className="px-6 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
                  Category
                </th>
                <th className="px-6 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
                  Bid
                </th>
                <th className="px-6 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
                  Team
                </th>
                {canPerformBidActions && (
                  <th className="px-6 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlayers.map((player) => {
                const team = teams?.find(t => t.id === player.team);
                const isCurrentlyBidding = currentBid?.playerId === player.id;
                const canStartBiddingForPlayer = canStartBidding && 
                                               player.status === 'available' && 
                                               player.category !== 'captain' &&
                                               !currentBid;

                return (
                  <tr key={player.id} className={isCurrentlyBidding ? 'bg-amber-50/70' : 'hover:bg-slate-50/70 transition-colors'}>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center">
                        <PlayerAvatar player={player} size="md" className="mb-2" />
                        <div>
                          <div className="text-lg font-bold text-gray-900 flex items-center justify-center">
                            {player.cricHeroesLink ? (
                              <a
                                href={player.cricHeroesLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 active:text-blue-900"
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                              >
                                {player.name}
                              </a>
                            ) : (
                              player.name
                            )}
                            {teams?.some(t => t.captain === player.id) && (
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
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryStyle(player.category)}`}>
                          {player.category === 'wicket-keeper' ? 'keeper' : player.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-center">
                      {player.status === 'sold' ? (
                        <span className="font-bold text-emerald-600">₹{player.finalBid}</span>
                      ) : player.status === 'assigned' ? (
                        <span className="font-bold text-purple-600">Captain</span>
                      ) : player.status === 'retained' ? (
                        <span className="font-bold text-cyan-600">₹{player.retentionAmount || player.finalBid}</span>
                      ) : player.currentBid > 0 ? (
                        <span className="font-bold text-indigo-600">₹{player.currentBid}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-center">
                      <div className="flex items-center justify-center">
                        {team ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${getTeamStyle(player.team, teams)}`}>
                            🏏 {cleanTeamName(team.name)}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </div>
                    </td>
                    {canPerformBidActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <PlayerImageUpload
                            playerId={player.id}
                            onUploaded={() => onDataRefresh && onDataRefresh()}
                          />
                          {canStartBiddingForPlayer && (
                            <button
                              onClick={() => handleStartBidding(player.id)}
                              disabled={loading}
                              className="inline-flex items-center gap-1 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white hover:-translate-y-0.5 active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm shadow-indigo-500/30"
                            >
                              {loading ? 'Starting…' : '🔨 Start Bidding'}
                            </button>
                          )}
                          {isCurrentlyBidding && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                              🔥 Bidding
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
});

export default PlayersList;
