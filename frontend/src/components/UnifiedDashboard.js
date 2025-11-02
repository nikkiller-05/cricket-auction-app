
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import PlayerUploadModal from './PlayerUploadModal';
import TeamManagement from './TeamManagement';
import ResetControls from './ResetControls';
import PlayersList from './PlayersList';
import StatsDisplay from './StatsDisplay';
import SubAdminManagement from './SubAdminManagement';
import Header from './Header';

// Use environment variable for backend URL, fallback to localhost for dev
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper functions
const cleanTeamName = (name) => {
  return name ? name.replace(/\(\d+\)$/, '').trim() : '';
};

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
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        badge: 'bg-purple-100 text-purple-800',
        icon: '👑',
        name: 'Captain'
      };
    case 'batter':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-800',
        icon: '🏏',
        name: 'Batters'
      };
    case 'bowler':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-800',
        icon: '⚾',
        name: 'Bowlers'
      };
    case 'allrounder':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        badge: 'bg-orange-100 text-orange-800',
        icon: '🌟',
        name: 'All-rounders'
      };
    case 'wicket-keeper':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        badge: 'bg-green-100 text-green-800',
        icon: '🥅',
        name: 'Wicket-keepers'
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        badge: 'bg-gray-100 text-gray-800',
        icon: '👤',
        name: 'Others'
      };
  }
};

// Enhanced TeamSquadViewer Component
const TeamSquadViewer = ({ teams, players }) => {
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id || null);

  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏏</div>
        <h3 className="text-lg font-medium mb-2 text-gray-900">No Teams Available</h3>
        <p className="text-gray-600">Teams will be created once players are uploaded.</p>
      </div>
    );
  }

  const currentTeam = teams.find(t => t.id === selectedTeam);
  const teamPlayers = players?.filter(p => p.team === selectedTeam && (p.status === 'sold' || p.status === 'retained' || p.status === 'assigned')) || [];
  
  // Categorize players by role
  const playersByCategory = {
    captain: teamPlayers.filter(p => p.category === 'captain'),
    batter: teamPlayers.filter(p => p.category === 'batter'),
    bowler: teamPlayers.filter(p => p.category === 'bowler'),
    allrounder: teamPlayers.filter(p => p.category === 'allrounder'),
    'wicket-keeper': teamPlayers.filter(p => p.category === 'wicket-keeper'),
    other: teamPlayers.filter(p => !['captain', 'batter', 'bowler', 'allrounder', 'wicket-keeper'].includes(p.category))
  };
  
  const boughtPlayers = teamPlayers.filter(p => p.category !== 'captain' && p.status === 'sold').sort((a, b) => (b.finalBid || 0) - (a.finalBid || 0));
  const teamRetainedPlayers = teamPlayers.filter(p => p.status === 'retained');
  const totalSpentOnAuction = boughtPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
  const totalSpentOnRetention = teamRetainedPlayers.reduce((sum, p) => sum + (p.retentionAmount || p.finalBid || 0), 0);
  const totalSpent = totalSpentOnAuction + totalSpentOnRetention;
  const budgetUsed = currentTeam ? ((totalSpent / (currentTeam.budget + totalSpent)) * 100) : 0;

  return (
    <div className="bg-white bg-opacity-25 backdrop-blur-lg shadow-xl rounded-lg border border-white border-opacity-20">
      {/* Team Selector Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h3 className="text-2xl font-bold text-gray-900">Team Squads</h3>
          
        </div>

        {/* Team Navigation Cards */}
        <div className="mt-4 flex flex-wrap gap-2 pb-2">
          {teams.map(team => {
            const teamPlayerCount = players?.filter(p => p.team === team.id && (p.status === 'sold' || p.status === 'retained' || p.status === 'assigned')).length || 0;
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={`tab-button ${selectedTeam === team.id ? 'active' : ''} ${
                  selectedTeam === team.id
                    ? 'bg-blue-500 text-white shadow-xl border-blue-600'
                    : 'bg-white bg-opacity-20 text-gray-800 hover:text-gray-900 hover:bg-white hover:bg-opacity-30 border-white border-opacity-30'
                } whitespace-nowrap py-2 px-4 font-medium text-sm flex items-center rounded-lg backdrop-blur-lg border shadow-lg min-w-fit`}
              >
                🏏 {cleanTeamName(team.name)}
                {teamPlayerCount > 0 && (
                  <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${
                    selectedTeam === team.id 
                      ? 'bg-white bg-opacity-20 text-white' 
                      : 'bg-white bg-opacity-40 text-gray-700'
                  }`}>
                    {teamPlayerCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Team Details */}
      {currentTeam && (
        <div className="p-6">
          {/* Team Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{cleanTeamName(currentTeam.name)}</h2>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Players</div>
                  <div className="text-xl font-semibold text-gray-900">{teamPlayers.length}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Budget Remaining</div>
                  <div className="text-xl font-semibold text-green-600">₹{currentTeam.budget}</div>
                </div>
              </div>
            </div>

            {/* Budget Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Budget Used: ₹{totalSpent}</span>
                <span>{Math.round(budgetUsed)}% used</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    budgetUsed > 90 ? 'bg-red-500' : 
                    budgetUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{playersByCategory.captain.length}</div>
                <div className="text-xs text-purple-600">Captain</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-indigo-600">{teamRetainedPlayers.length}</div>
                <div className="text-xs text-indigo-600">Retained</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{boughtPlayers.length}</div>
                <div className="text-xs text-blue-600">Bought</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">₹{totalSpent}</div>
                <div className="text-xs text-green-600">Total Spent</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ₹{(boughtPlayers.length + teamRetainedPlayers.length) > 0 ? Math.round(totalSpent / (boughtPlayers.length + teamRetainedPlayers.length)) : 0}
                </div>
                <div className="text-xs text-orange-600">Avg Price</div>
              </div>
            </div>
          </div>

          {/* Players by Category */}
          <div className="space-y-6">
            {Object.entries(playersByCategory).map(([category, categoryPlayers]) => {
              if (categoryPlayers.length === 0) return null;
              
              const style = getCategoryStyle(category);
              
              return (
                <div key={category} className={`${style.bg} ${style.border} border rounded-lg p-4`}>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-2xl mr-3">{style.icon}</span>
                    {style.name}
                    <span className="ml-2 text-sm text-gray-500">({categoryPlayers.length})</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryPlayers.map((player, index) => (
                      <div key={player.id} className="bg-white bg-opacity-15 backdrop-blur-xl border-2 border-gray-200 border-opacity-50 rounded-xl p-3 hover:shadow-2xl hover:bg-opacity-25 hover:border-gray-300 hover:border-opacity-70 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {category !== 'captain' && (
                              <div className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                                {index + 1}
                              </div>
                            )}
                            <div>
                              <h5 className="font-medium text-gray-900 flex items-center">
                                {player.name}
                                {category === 'captain' && (
                                  <span className="ml-2 text-lg">👑</span>
                                )}
                              </h5>
                              <p className="text-sm text-gray-600">{player.role}</p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${style.badge}`}>
                                {category === 'captain' ? 'Captain' : category.replace('-', ' ')}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            {category === 'captain' ? (
                              <div>
                                <div className="text-sm font-semibold text-purple-600">Auto-assigned</div>
                                <div className="text-xs text-gray-500">No Cost</div>
                              </div>
                            ) : player.status === 'retained' ? (
                              <div>
                                <div className="text-lg font-semibold text-purple-600">₹{player.retentionAmount || player.finalBid}</div>
                                <div className="text-xs text-gray-500">Retention Cost</div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-lg font-semibold text-green-600">₹{player.finalBid}</div>
                                <div className="text-xs text-gray-500">Auction Price</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Category Summary */}
                  {category !== 'captain' && categoryPlayers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm">
                      <span className="text-gray-600">
                        {categoryPlayers.length} player{categoryPlayers.length !== 1 ? 's' : ''}
                      </span>
                      <span className="font-medium text-gray-900">
                        Total: ₹{categoryPlayers.reduce((sum, p) => sum + (p.status === 'retained' ? (p.retentionAmount || p.finalBid || 0) : (p.finalBid || 0)), 0)}
                      </span>
                      <span className="text-gray-600">
                        Avg: ₹{Math.round(categoryPlayers.reduce((sum, p) => sum + (p.status === 'retained' ? (p.retentionAmount || p.finalBid || 0) : (p.finalBid || 0)), 0) / categoryPlayers.length)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {teamPlayers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏏</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Players Yet</h4>
              <p className="text-gray-500">This team hasn't acquired any players</p>
            </div>
          )}

          {/* Team Composition Summary */}
          {teamPlayers.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Team Composition Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {['captain', 'batter', 'bowler', 'allrounder', 'wicket-keeper'].map(category => {
                  const categoryPlayers = playersByCategory[category] || [];
                  const categorySpent = categoryPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
                  const style = getCategoryStyle(category);
                  
                  return (
                    <div key={category} className={`${style.bg} ${style.border} border rounded-lg p-3 text-center`}>
                      <div className="text-2xl mb-1">{style.icon}</div>
                      <div className="text-xl font-bold text-gray-900">{categoryPlayers.length}</div>
                      <div className="text-xs text-gray-600 mb-1">
                        {category === 'captain' ? 'Captain' : 
                         category === 'wicket-keeper' ? 'Keepers' :
                         category === 'allrounder' ? 'All-rounders' :
                         category + 's'}
                      </div>
                      <div className="text-xs font-medium text-green-600">
                        {category === 'captain' ? 'Assigned' : `₹${categorySpent}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main UnifiedDashboard Component
const UnifiedDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('spectator');
  const [auctionData, setAuctionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');
  const [notifications, setNotifications] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
  
  // Spectator filter state for All Players tab
  const [spectatorPlayerFilter, setSpectatorPlayerFilter] = useState('all');
  
  // Download dropdown state
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  
  // Upload Players modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Undo functionality states
  const [undoLoading, setUndoLoading] = useState(false);
  const [actionHistory, setActionHistory] = useState([]);
  const [showUndoConfirmModal, setShowUndoConfirmModal] = useState(false);
  const [undoConfirmAction, setUndoConfirmAction] = useState(null);
  
  // Auction toggle state
  const [auctionToggleLoading, setAuctionToggleLoading] = useState(false);

  useEffect(() => {
    // Check if user is admin from location state or localStorage
    const adminFromState = location.state?.isAdmin;
    const token = localStorage.getItem('adminToken');
    
    if (adminFromState || token) {
      setIsAdmin(true);
      
      if (token) {
        try {
          // Decode JWT token to get user role
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserRole(payload.role || 'admin');
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          console.error('Error decoding token:', error);
          setUserRole('admin'); // Default fallback
        }
      } else {
        setUserRole('admin'); // Default for state-based admin
      }
    }

    // Initialize socket connection
    const socketConnection = io(API_BASE_URL);

    // Socket event listeners
    socketConnection.on('auctionData', (data) => {
      console.log('Received auction data:', data);
      setAuctionData(data);
      setLoading(false);
    });

    socketConnection.on('playersUpdated', (players) => {
      setAuctionData(prev => ({ ...prev, players }));
    });

    socketConnection.on('teamsUpdated', (teams) => {
      setAuctionData(prev => ({ ...prev, teams }));
    });

    socketConnection.on('playerSold', (data) => {
      if (data.player && data.team) {
        addTransaction(data.player, 'sold', data.team, data.finalBid);
        addNotification(`${data.player.name} sold to ${cleanTeamName(data.team.name)} for ₹${data.finalBid}`, 'success');
      }
    });

    socketConnection.on('playerUnsold', (data) => {
      if (data.player) {
        addTransaction(data.player, 'unsold');
        addNotification(`${data.player.name} marked as unsold`, 'warning');
      }
    });

    socketConnection.on('playerRetained', (data) => {
      if (data.player && data.team) {
        addTransaction(data.player, 'retained', data.team, data.retentionAmount);
        addNotification(`${data.player.name} retained by ${cleanTeamName(data.team.name)} for ₹${data.retentionAmount}`, 'info');
      }
    });

    socketConnection.on('playerRetentionRemoved', (data) => {
      if (data.player && data.team) {
        // Remove the retention transaction from history
        setTransactionHistory(prev => {
          return prev.filter(t => !(t.type === 'retained' && t.playerName === data.player.name));
        });
        addNotification(`Retention removed: ${data.player.name} (₹${data.refundedAmount} refunded)`, 'warning');
      }
    });

    socketConnection.on('currentBidUpdated', (currentBid) => {
      setAuctionData(prev => ({ ...prev, currentBid }));
    });

    socketConnection.on('auctionStatusChanged', (status) => {
      setAuctionData(prev => ({ ...prev, auctionStatus: status }));
    });

    socketConnection.on('statsUpdated', (stats) => {
      setAuctionData(prev => ({ ...prev, stats }));
    });

    socketConnection.on('fileUploaded', (fileInfo) => {
      addNotification(`Successfully uploaded ${fileInfo.playerCount} players`, 'success');
    });

    socketConnection.on('auctionReset', () => {
      addNotification('Auction has been reset', 'info');
      setTransactionHistory([]);
      setCurrentPage(1);
    });

    socketConnection.on('fastTrackStarted', (data) => {
      addNotification(`Fast Track started with ${data.players?.length || 0} players`, 'info');
    });

    socketConnection.on('fastTrackEnded', () => {
      addNotification('Fast Track auction ended', 'info');
    });

    socketConnection.on('saleUndone', (data) => {
      addNotification(`Sale undone: ${data.player} returned from ${data.team}`, 'warning');
      // Remove the last sale transaction from history
      setTransactionHistory(prev => {
        const playerName = typeof data.player === 'string' ? data.player : data.player?.name;
        return prev.filter(t => !(t.type === 'sold' && t.playerName === playerName));
      });
    });

    socketConnection.on('bidUndone', (data) => {
      addNotification(`Bid undone: ${data.player} (₹${data.revertedToAmount})`, 'warning');
    });

    // Cleanup on unmount
    return () => {
      socketConnection.disconnect();
    };
  }, [location.state]);

  // Transaction history initialization function
  const initializeTransactionHistory = useCallback((auctionData) => {
    if (!auctionData?.players) return;
    
    const soldPlayers = auctionData.players.filter(p => p.status === 'sold' && p.category !== 'captain');
    const unsoldPlayers = auctionData.players.filter(p => p.status === 'unsold');
    const retainedPlayers = auctionData.players.filter(p => p.status === 'retained');
    
    const transactions = [];
    
    // Add retained players to history (these happen first, before auction)
    retainedPlayers.forEach((player, index) => {
      const team = auctionData.teams?.find(t => t.id === player.team);
      transactions.push({
        id: `retained-${player.id}`,
        playerId: player.id,
        playerName: player.name,
        playerRole: player.role,
        playerCategory: player.category,
        type: 'retained',
        team: team,
        finalBid: player.retentionAmount || player.finalBid,
        timestamp: new Date(Date.now() - (retainedPlayers.length + soldPlayers.length + unsoldPlayers.length - index) * 90000) // Earlier timestamps
      });
    });
    
    // Add sold players to history (assuming they were sold in order)
    soldPlayers.forEach((player, index) => {
      const team = auctionData.teams?.find(t => t.id === player.team);
      transactions.push({
        id: `sold-${player.id}`,
        playerId: player.id,
        playerName: player.name,
        playerRole: player.role,
        playerCategory: player.category,
        type: 'sold',
        team: team,
        finalBid: player.finalBid,
        timestamp: new Date(Date.now() - (soldPlayers.length - index) * 60000) // Mock timestamps
      });
    });
    
    // Add unsold players to history
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
        timestamp: new Date(Date.now() - (unsoldPlayers.length - index) * 30000) // Mock timestamps
      });
    });
    
    // Sort by timestamp (most recent first)
    transactions.sort((a, b) => b.timestamp - a.timestamp);
    setTransactionHistory(transactions);
  }, []); // useCallback dependency array

  // Initialize transaction history when auction data changes
  useEffect(() => {
    if (auctionData && transactionHistory.length === 0) {
      initializeTransactionHistory(auctionData);
    }
  }, [auctionData, transactionHistory.length, initializeTransactionHistory]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadDropdown && !event.target.closest('.download-dropdown')) {
        setShowDownloadDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadDropdown]);

  // Action history fetch function
  const fetchActionHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auction/history`);
      console.log('Action history fetched:', response.data.history);
      setActionHistory(response.data.history);
    } catch (error) {
      console.error('Error fetching action history:', error);
    }
  }, []);

  // Fetch action history for super-admin
  useEffect(() => {
    console.log('Role check for action history:', { userRole, isAdmin });
    if (userRole === 'super-admin' && isAdmin) {
      fetchActionHistory();
    }
  }, [userRole, isAdmin, fetchActionHistory]);

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const addTransaction = (player, type, team = null, finalBid = null) => {
    const transaction = {
      id: Date.now() + Math.random(),
      playerId: player.id,
      playerName: player.name,
      playerRole: player.role,
      playerCategory: player.category,
      type: type, // 'sold', 'unsold', or 'retained'
      team: team,
      finalBid: finalBid,
      timestamp: new Date()
    };
    
    setTransactionHistory(prev => [transaction, ...prev]);
  };

  // Undo functionality functions
  const handleUndoLastSale = async () => {
    setUndoConfirmAction({
      type: 'sale',
      message: 'Are you sure you want to undo the last sale? This will refund the money to the team and make the player available again.',
      action: async () => {
        setUndoLoading(true);
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auction/undo/sale`);
          addNotification(`Sale Undone: ${response.data.player} - Refunded ₹${response.data.refundedAmount} to ${response.data.team}`, 'success');
          fetchActionHistory();
        } catch (error) {
          addNotification(error.response?.data?.error || 'Failed to undo sale', 'error');
        } finally {
          setUndoLoading(false);
        }
      }
    });
    setShowUndoConfirmModal(true);
  };

  const handleUndoCurrentBid = async () => {
    setUndoConfirmAction({
      type: 'bid',
      message: 'Are you sure you want to undo the current bid? This will revert to the previous team\'s bid or base price.',
      action: async () => {
        setUndoLoading(true);
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auction/undo/bid`);
          if (response.data.revertedToTeam) {
            addNotification(`Bid Reverted: ${response.data.player} - Back to ${response.data.revertedToTeam} (₹${response.data.revertedToAmount})`, 'success');
          } else {
            addNotification(`Bid Reverted: ${response.data.player} - Back to base price (₹${response.data.revertedToAmount})`, 'success');
          }
        } catch (error) {
          addNotification(error.response?.data?.error || 'Failed to undo bid', 'error');
        } finally {
          setUndoLoading(false);
        }
      }
    });
    setShowUndoConfirmModal(true);
  };

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

  const handleLogout = () => {
    setIsAdmin(false);
    setUserRole('spectator');
    localStorage.removeItem('adminToken');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/');
  };

  const handleUploadSuccess = (data) => {
    addNotification(`Successfully uploaded ${data.playerCount} players from ${data.fileName}`, 'success');
    // Refresh auction data after successful upload
    fetchAuctionData();
  };

  const fetchAuctionData = async () => {
    try {
  const response = await axios.get(`${API_BASE_URL}/api/auction/data`);
      setAuctionData(response.data);
    } catch (error) {
      console.error('Error fetching auction data:', error);
    }
  };

  // Initialize transaction history from existing auction data


  // Callback functions for TeamManagement component
  const handleTeamsUpdate = (updatedTeams) => {
    setAuctionData(prev => ({ ...prev, teams: updatedTeams }));
  };

  const handlePlayersUpdate = (updatedPlayers) => {
    setAuctionData(prev => ({ ...prev, players: updatedPlayers }));
  };

  const downloadResults = async (format = 'excel') => {
    try {
  const endpoint = format === 'csv' ? `${API_BASE_URL}/api/download-results-csv` : `${API_BASE_URL}/api/download-results`;
  const response = await axios.get(endpoint, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `auction-results.${format === 'csv' ? 'csv' : 'xlsx'}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      addNotification(`${format.toUpperCase()} results downloaded successfully`, 'success');
    } catch (error) {
      console.error('Error downloading results:', error);
      addNotification(`Error downloading ${format} results`, 'error');
    }
  };

  const downloadTeamSquads = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/download-team-squads`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'team-squads.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      addNotification('Team squads downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading team squads:', error);
      addNotification('Error downloading team squads', 'error');
    }
  };

  const downloadAuctionSummary = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/download-auction-summary`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'auction-summary.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      addNotification('Auction summary downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading auction summary:', error);
      addNotification('Error downloading auction summary', 'error');
    }
  };

  // Handle auction toggle for Header component - Only for admin roles
  const handleAuctionToggle = async (newState) => {
    // Check if user has admin permissions
    if (!isAdmin) {
      addNotification('Only administrators can control auction status', 'error');
      return;
    }

    try {
      setAuctionToggleLoading(true);
      
      if (newState) {
        await axios.post(`${API_BASE_URL}/api/auction/start`);
      } else {
        await axios.post(`${API_BASE_URL}/api/auction/stop`);
      }
    } catch (error) {
      console.error('Error toggling auction:', error);
      addNotification(error.response?.data?.error || 'Error toggling auction', 'error');
    } finally {
      setAuctionToggleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Connecting to auction...</p>
        </div>
      </div>
    );
  }

  if (!auctionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏏</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Auction Data</h2>
          <p className="text-gray-600 mb-6">
            Unable to load auction data. Please check your connection.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = auctionData.currentBid 
    ? auctionData.players?.find(p => p.id === auctionData.currentBid.playerId)
    : null;

  const biddingTeam = auctionData.currentBid && auctionData.currentBid.biddingTeam
    ? auctionData.teams?.find(t => t.id === parseInt(auctionData.currentBid.biddingTeam))
    : null;

  // Separate sold players (exclude captains) and captains
  const soldPlayers = auctionData.players?.filter(p => p.status === 'sold' && p.category !== 'captain') || [];
  const retainedPlayers = auctionData.players?.filter(p => p.status === 'retained') || [];
  const captains = auctionData.players?.filter(p => p.category === 'captain') || [];
  const availablePlayers = auctionData.players?.filter(p => p.status === 'available' && p.category !== 'captain') || [];
  const unsoldPlayers = auctionData.players?.filter(p => p.status === 'unsold') || [];

  // Define tabs based on user role
  const spectatorTabs = [
    { id: 'live', name: 'Live Status', icon: '🔴' },
    { id: 'teams', name: 'Team Squads', icon: '🏏' },
    { id: 'players', name: 'All Players', icon: '👥' },
    { id: 'stats', name: 'Statistics', icon: '📊' }
  ];

  // Base tabs for all admin roles
  const baseAdminTabs = [
    { id: 'live', name: 'Live Status', icon: '🔴' }
  ];

  // Configuration tabs (only for super-admin and admin)
  const configTabs = [
    // Upload Players moved to hamburger menu
    // { id: 'subadmins', name: 'Sub-Admins', icon: '👥' },
    { id: 'reset', name: 'Reset & Fast Track', icon: '🔄', badge: unsoldPlayers.length }
  ];

  const commonTabs = [
    { id: 'players', name: 'Players', icon: '👥', count: auctionData.players?.length || 0 },
    { id: 'teams', name: 'Team Management', icon: '⚙️', count: auctionData.teams?.length || 0 },
    { id: 'teamsquads', name: 'Team Squads', icon: '🏏', count: auctionData.teams?.length || 0 },
    { id: 'stats', name: 'Statistics', icon: '📊' }
  ];

  // Determine tabs based on user role
  const canConfigure = ['super-admin', 'admin'].includes(userRole);
  
  const adminTabs = [
    ...baseAdminTabs,
    ...(canConfigure ? configTabs : []), // Only show config tabs to super-admin and admin
    ...commonTabs
  ];

  const tabs = isAdmin ? adminTabs : spectatorTabs;

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto space-y-2 z-50 max-w-sm sm:max-w-sm">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`max-w-sm p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ${
                notification.type === 'success' ? 'bg-green-50 border-green-400 text-green-800' :
                notification.type === 'error' ? 'bg-red-50 border-red-400 text-red-800' :
                notification.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' :
                'bg-blue-50 border-blue-400 text-blue-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="ml-3 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Modern Header */}
      <Header
        username={userRole === 'super-admin' ? 'Super Admin' :
                 userRole === 'admin' ? 'Admin' :
                 userRole === 'sub-admin' ? 'Sub-Admin' :
                 userRole === 'spectator' ? 'Spectator' :
                 'User'}
        userRole={userRole}
        onLogout={handleLogout}
        isAuctionOn={auctionData.auctionStatus === 'running'}
        onToggleAuction={isAdmin ? handleAuctionToggle : null}
        auctionLoading={auctionToggleLoading}
        showDownloadOptions={auctionData.fileUploaded}
        onDownloadExcel={() => downloadResults('excel')}
        onDownloadTeamSquads={downloadTeamSquads}
        onDownloadSummary={downloadAuctionSummary}
        onDownloadCSV={() => downloadResults('csv')}
        onUploadPlayers={() => setShowUploadModal(true)}
        onUndoLastSale={handleUndoLastSale}
        canUndoLastSale={(() => {
          const lastSale = actionHistory.slice().reverse().find(action => action.type === 'PLAYER_SOLD');
          console.log('Can undo last sale check:', { actionHistory: actionHistory.length, lastSale: !!lastSale });
          return !!lastSale;
        })()}
        undoLoading={undoLoading}
        auctionStatus={auctionData.auctionStatus}
      />



      {/* Current Bid Indicator - only show when there's an active bid */}
      {auctionData.currentBid && (
        <div className="bg-white bg-opacity-20 backdrop-blur-lg border-b border-white border-opacity-30 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <div className="px-4 py-2 rounded-full text-sm font-medium bg-yellow-400 bg-opacity-80 backdrop-blur-sm text-yellow-900 animate-pulse shadow-lg border border-yellow-300">
                💰 Current Bid: ₹{auctionData.currentBid.currentAmount}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-2 border-blue-200 border-opacity-30 rounded-2xl bg-white bg-opacity-5 backdrop-blur-sm shadow-xl">
        {/* SINGLE Live Bidding Section - Visible to everyone */}
        {auctionData.currentBid && currentPlayer && (
          <div className="mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-2xl border-2 border-yellow-300 border-opacity-70">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold flex items-center justify-center">
                🔥 LIVE BIDDING 
                {auctionData.auctionStatus === 'fast-track' && 
                  <span className="ml-2 bg-orange-600 px-2 py-1 rounded text-sm">FAST TRACK</span>
                }
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Player</h3>
                <p 
                  className="text-2xl font-bold transform hover:scale-110 transition-all duration-500 cursor-pointer relative text-blue-900"
                  style={{
                    animation: 'playerNameGlow 2s ease-in-out infinite',
                    textShadow: '0 0 8px rgba(59, 130, 246, 0.4), 0 0 15px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {currentPlayer.name}
                </p>
                <p className="text-sm text-gray-700 font-medium">{currentPlayer.role}</p>
                <p className="text-xs text-gray-600">{currentPlayer.category}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Current Bid</h3>
                <p 
                  className="text-4xl font-bold transform hover:scale-125 transition-all duration-500 cursor-pointer relative text-green-700"
                  style={{
                    animation: 'bidAmountPulse 1.5s ease-in-out infinite, pulse 2s ease-in-out infinite',
                    textShadow: '0 0 12px rgba(34, 197, 94, 0.6), 0 0 25px rgba(34, 197, 94, 0.5), 0 0 35px rgba(34, 197, 94, 0.4)',
                    filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.5))'
                  }}
                >
                  ₹{auctionData.currentBid.currentAmount}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Leading Team</h3>
                <p className="text-2xl font-bold text-purple-700">{biddingTeam ? cleanTeamName(biddingTeam.name) : 'No bids yet'}</p>
                {biddingTeam && (
                  <p className="text-sm text-gray-600 font-medium">Budget: ₹{biddingTeam.budget}</p>
                )}
              </div>
            </div>

            {/* Admin bidding controls - Available to ALL admin roles including sub-admin */}
            {isAdmin && (
              <div className="mt-6 pt-4 bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-4">
                <div className="flex flex-wrap justify-center gap-1 sm:gap-2 mb-4">
                  {auctionData.teams?.map(team => {
                    const increment = 5;
                    const nextBidAmount = auctionData.currentBid.currentAmount + increment;
                    const hasMaxPlayers = team.players?.length >= (auctionData.settings?.maxPlayersPerTeam || 15);
                    const hasSufficientBudget = team.budget >= nextBidAmount;
                    const canBid = hasSufficientBudget && !hasMaxPlayers;
                    
                    return (
                      <button
                        key={team.id}
                        onClick={async () => {
                          try {
                            await axios.post(`${API_BASE_URL}/api/auction/bidding/place`, { teamId: team.id });
                          } catch (error) {
                            addNotification(error.response?.data?.error || 'Error placing bid', 'error');
                          }
                        }}
                        disabled={!canBid}
                        className={`px-2 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm rounded-full font-semibold transition-all duration-200 border-2 ${
                          canBid 
                            ? 'bg-gradient-to-r from-blue-200 to-cyan-300 hover:from-blue-300 hover:to-cyan-400 text-gray-800 border-blue-300 hover:border-cyan-400 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg' 
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60 border-gray-600 shadow-inner'
                        }`}
                        title={
                          hasMaxPlayers 
                            ? `Team full (${team.players?.length}/${auctionData.settings?.maxPlayersPerTeam || 15} players)` 
                            : !hasSufficientBudget 
                              ? `Insufficient budget (₹${team.budget})` 
                              : `Bid ₹${nextBidAmount} for ${cleanTeamName(team.name)}`
                        }
                      >
                        {cleanTeamName(team.name)}
                        <div className="text-xs opacity-75">₹{team.budget}</div>
                      </button>
                    );
                  })}
                </div>
                
                {/* Primary Action Buttons */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mb-4">
                  <button
                    onClick={async () => {
                      try {
                        await axios.post(`${API_BASE_URL}/api/auction/bidding/sell`);
                        addNotification('Player sold successfully', 'success');
                      } catch (error) {
                        addNotification(error.response?.data?.error || 'Error selling player', 'error');
                      }
                    }}
                    disabled={!auctionData.currentBid.biddingTeam}
                    className="px-4 sm:px-6 md:px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-full font-bold text-xs sm:text-sm md:text-base shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center space-x-1 sm:space-x-2"
                  >
                    <span>✅</span>
                    <span>Sell</span>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await axios.post(`${API_BASE_URL}/api/auction/bidding/unsold`);
                        addNotification('Player marked as unsold', 'warning');
                      } catch (error) {
                        addNotification(error.response?.data?.error || 'Error marking as unsold', 'error');
                      }
                    }}
                    className="px-4 sm:px-6 md:px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-full font-bold text-xs sm:text-sm md:text-base shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center space-x-1 sm:space-x-2"
                  >
                    <span>❌</span>
                    <span>Unsold</span>
                  </button>

                </div>
                
                {/* Undo Controls - Only for super-admin */}
                {userRole === 'super-admin' && (
                  <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-white border-opacity-20">
                    <button
                      onClick={handleUndoCurrentBid}
                      disabled={undoLoading || !auctionData.currentBid}
                      className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed disabled:shadow-inner text-white rounded-full text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center space-x-1.5 border border-purple-300 hover:border-indigo-400 backdrop-blur-sm"
                      title="Undo Last Bid - Removes the most recent bid during active bidding"
                    >
                      <span>⏪</span>
                      <span className="hidden sm:inline">Undo Last Bid</span>
                    </button>
                    
                    {/* Cancel Bidding Button - Available to all admins */}
                    <button
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Cancel bidding for ${currentPlayer.name}?\n\nThis will:\n• Reset the player to available status\n• Clear all bids for this player\n• Allow starting bidding again for this player\n\nAre you sure?`
                        );
                        if (!confirmed) return;

                        try {
                          await axios.post(`${API_BASE_URL}/api/auction/bidding/cancel`);
                          addNotification('Bidding cancelled successfully - player is available again', 'info');
                        } catch (error) {
                          addNotification(error.response?.data?.error || 'Error cancelling bidding', 'error');
                        }
                      }}
                      disabled={!auctionData.currentBid}
                      className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed disabled:shadow-inner text-white rounded-full text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center space-x-1.5 border border-sky-300 hover:border-blue-400 backdrop-blur-sm"
                      title="Cancel bidding and return player to available status"
                    >
                      <span>❌</span>
                      <span className="hidden sm:inline">Cancel</span>
                    </button>
                  </div>
                )}
                
                {/* Cancel Button for Regular Admins (when super-admin controls not shown) */}
                {isAdmin && userRole !== 'super-admin' && (
                  <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-white border-opacity-20">
                    <button
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Cancel bidding for ${currentPlayer.name}?\n\nThis will:\n• Reset the player to available status\n• Clear all bids for this player\n• Allow starting bidding again for this player\n\nAre you sure?`
                        );
                        if (!confirmed) return;

                        try {
                          await axios.post(`${API_BASE_URL}/api/auction/bidding/cancel`);
                          addNotification('Bidding cancelled successfully - player is available again', 'info');
                        } catch (error) {
                          addNotification(error.response?.data?.error || 'Error cancelling bidding', 'error');
                        }
                      }}
                      disabled={!auctionData.currentBid}
                      className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed disabled:shadow-inner text-white rounded-full text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center space-x-1.5 border border-sky-300 hover:border-blue-400 backdrop-blur-sm"
                      title="Cancel bidding and return player to available status"
                    >
                      <span>❌</span>
                      <span className="hidden sm:inline">Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white bg-opacity-15 backdrop-blur-xl rounded-xl p-4 text-center shadow-2xl border-2 border-blue-200 border-opacity-50 hover:bg-opacity-25 hover:scale-105 hover:border-blue-300 hover:border-opacity-70 transition-all duration-300">
            <div className="text-3xl font-bold text-blue-600">{auctionData.players?.length || 0}</div>
            <div className="text-sm text-gray-700 font-medium">Total Players</div>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-xl rounded-xl p-4 text-center shadow-2xl border-2 border-green-200 border-opacity-50 hover:bg-opacity-25 hover:scale-105 hover:border-green-300 hover:border-opacity-70 transition-all duration-300">
            <div className="text-3xl font-bold text-green-600">{soldPlayers.length}</div>
            <div className="text-sm text-gray-700 font-medium">Players Sold</div>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-xl rounded-xl p-4 text-center shadow-2xl border-2 border-purple-200 border-opacity-50 hover:bg-opacity-25 hover:scale-105 hover:border-purple-300 hover:border-opacity-70 transition-all duration-300">
            <div className="text-3xl font-bold text-purple-600">{retainedPlayers.length}</div>
            <div className="text-sm text-gray-700 font-medium">Retained</div>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-xl rounded-xl p-4 text-center shadow-2xl border-2 border-indigo-200 border-opacity-50 hover:bg-opacity-25 hover:scale-105 hover:border-indigo-300 hover:border-opacity-70 transition-all duration-300">
            <div className="text-3xl font-bold text-indigo-600">{captains.length}</div>
            <div className="text-sm text-gray-700 font-medium">Captains</div>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-xl rounded-xl p-4 text-center shadow-2xl border-2 border-orange-200 border-opacity-50 hover:bg-opacity-25 hover:scale-105 hover:border-orange-300 hover:border-opacity-70 transition-all duration-300">
            <div className="text-3xl font-bold text-orange-600">{availablePlayers.length}</div>
            <div className="text-sm text-gray-700 font-medium">Available</div>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-xl rounded-xl p-4 text-center shadow-2xl border-2 border-red-200 border-opacity-50 hover:bg-opacity-25 hover:scale-105 hover:border-red-300 hover:border-opacity-70 transition-all duration-300">
            <div className="text-3xl font-bold text-red-600">{unsoldPlayers.length}</div>
            <div className="text-sm text-gray-700 font-medium">Unsold</div>
          </div>
        </div>

        {/* Warning for spectators when no auction data */}
        {!auctionData.fileUploaded && !isAdmin && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No auction data available
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  The admin hasn't uploaded player data yet. Please check back later.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Permission Warning for Sub-Admins */}
        {userRole === 'sub-admin' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Sub-Admin Access
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  You have bidding permissions only. Configuration and file uploads require Admin or Super Admin access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex flex-wrap gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${
                  activeTab === tab.id
                    ? 'bg-blue-500 bg-opacity-90 text-white shadow-2xl border-2 border-blue-300 border-opacity-80 scale-105'
                    : 'bg-white bg-opacity-15 text-gray-800 hover:text-gray-900 hover:bg-white hover:bg-opacity-25 border-2 border-blue-200 border-opacity-40 hover:border-blue-300 hover:border-opacity-60'
                } whitespace-nowrap py-3 px-6 font-bold text-sm flex items-center rounded-xl backdrop-blur-xl shadow-xl min-w-fit transition-all duration-300`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
                
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${
                    activeTab === tab.id 
                      ? 'bg-white bg-opacity-20 text-white' 
                      : 'bg-white bg-opacity-40 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
                
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${
                    activeTab === tab.id 
                      ? 'bg-red-400 text-white' 
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-8 border-2 border-yellow-300 border-opacity-60 shadow-2xl mt-4">
          {/* Live Status Tab - Available to everyone */}
          {activeTab === 'live' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 tracking-wide">Live Auction Status</h3>
              
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl p-4 text-center shadow-2xl border-2 border-green-400 border-opacity-70 hover:bg-opacity-30 hover:scale-105 hover:border-green-500 hover:border-opacity-90 transition-all duration-300">
                  <div className="text-2xl font-bold text-green-600">{soldPlayers.length}</div>
                  <div className="text-sm text-gray-700 font-medium">Sold</div>
                </div>
                <div className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl p-4 text-center shadow-2xl border-2 border-red-400 border-opacity-70 hover:bg-opacity-30 hover:scale-105 hover:border-red-500 hover:border-opacity-90 transition-all duration-300">
                  <div className="text-2xl font-bold text-red-600">{unsoldPlayers.length}</div>
                  <div className="text-sm text-gray-700 font-medium">Unsold</div>
                </div>
                <div className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl p-4 text-center shadow-2xl border-2 border-orange-400 border-opacity-70 hover:bg-opacity-30 hover:scale-105 hover:border-orange-500 hover:border-opacity-90 transition-all duration-300">
                  <div className="text-2xl font-bold text-orange-600">{availablePlayers.length}</div>
                  <div className="text-sm text-gray-700 font-medium">Available</div>
                </div>
                <div className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl p-4 text-center shadow-2xl border-2 border-purple-400 border-opacity-70 hover:bg-opacity-30 hover:scale-105 hover:border-purple-500 hover:border-opacity-90 transition-all duration-300">
                  <div className="text-2xl font-bold text-purple-600">{captains.length}</div>
                  <div className="text-sm text-gray-700 font-medium">Captains</div>
                </div>
              </div>
              
              {auctionData.auctionStatus === 'stopped' && !auctionData.currentBid && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Auction is currently paused. Waiting for the next player to be put up for bidding.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Recent Transactions */}
              <div className="bg-white bg-opacity-25 backdrop-blur-lg rounded-lg shadow-xl p-6 border-2 border-blue-300 border-opacity-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-bold text-gray-900">Recent Auction Activity</h4>
                  {transactionHistory.length > transactionsPerPage && (
                    <div className="text-sm text-gray-600">
                      Showing {Math.min(transactionsPerPage, transactionHistory.length)} of {transactionHistory.length} transactions
                    </div>
                  )}
                </div>
                
                {/* Transactions List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transactionHistory.length > 0 ? (
                    transactionHistory
                      .filter(transaction => transaction && transaction.id) // Filter out null/undefined transactions
                      .slice((currentPage - 1) * transactionsPerPage, currentPage * transactionsPerPage)
                      .map((transaction, index) => {
                        const team = transaction.team ? auctionData.teams?.find(t => t.id === transaction.team.id) : null;
                        return (
                          <div 
                            key={transaction.id} 
                            className={`flex justify-between items-center p-3 rounded-lg border-2 border-l-4 ${
                              transaction.type === 'sold' 
                                ? 'bg-green-50 border-green-400 border-l-green-600' 
                                : transaction.type === 'retained'
                                ? 'bg-purple-50 border-purple-400 border-l-purple-600'
                                : 'bg-red-50 border-red-400 border-l-red-600'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{transaction.playerName}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  transaction.playerCategory === 'batter' ? 'bg-blue-100 text-blue-800' :
                                  transaction.playerCategory === 'bowler' ? 'bg-red-100 text-red-800' :
                                  transaction.playerCategory === 'allrounder' ? 'bg-orange-100 text-orange-800' :
                                  transaction.playerCategory === 'wicket-keeper' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {transaction.playerCategory === 'wicket-keeper' ? 'keeper' : transaction.playerCategory}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {transaction.playerRole}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              {transaction.type === 'sold' ? (
                                <>
                                  <div className="font-bold text-green-600">₹{transaction.finalBid}</div>
                                  <div className="text-sm text-gray-700">
                                    Sold to <span className={`px-2 py-1 rounded-full text-xs font-bold ml-1 ${getTeamStyle(transaction.player?.team, auctionData.teams)}`}>
                                      🏏 {cleanTeamName(team?.name) || 'Unknown Team'}
                                    </span>
                                  </div>
                                </>
                              ) : transaction.type === 'retained' ? (
                                <>
                                  <div className="font-bold text-purple-600">₹{transaction.finalBid}</div>
                                  <div className="text-sm text-gray-700">
                                    Retained by <span className={`px-2 py-1 rounded-full text-xs font-bold ml-1 ${getTeamStyle(transaction.player?.team, auctionData.teams)}`}>
                                      🏏 {cleanTeamName(team?.name) || 'Unknown Team'}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="font-bold text-red-600">UNSOLD</div>
                                  <div className="text-sm text-gray-600">No bids received</div>
                                </>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                {transaction.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    // Fallback to show recent players from auctionData if no transaction history
                    [...(auctionData.players?.filter(p => p.status === 'retained') || []).slice(-3).map(player => {
                      const team = auctionData.teams?.find(t => t.id === player.team);
                      return (
                        <div 
                          key={`fallback-retained-${player.id}`} 
                          className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border-2 border-l-4 border-purple-400 border-l-purple-600"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{player.name}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                player.category === 'batter' ? 'bg-blue-100 text-blue-800' :
                                player.category === 'bowler' ? 'bg-red-100 text-red-800' :
                                player.category === 'allrounder' ? 'bg-orange-100 text-orange-800' :
                                player.category === 'wicket-keeper' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {player.category === 'wicket-keeper' ? 'keeper' : player.category}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{player.role}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-purple-600">₹{player.retentionAmount || player.finalBid || 0}</div>
                            <div className="text-sm text-gray-700">
                              Retained by <span className={`px-2 py-1 rounded-full text-xs font-bold ml-1 ${getTeamStyle(player.team, auctionData.teams)}`}>
                                🏏 {cleanTeamName(team?.name) || 'Unknown Team'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }),
                    ...soldPlayers.slice(-5).reverse().map(player => {
                      const team = auctionData.teams?.find(t => t.id === player.team);
                      return (
                        <div 
                          key={`fallback-${player.id}`} 
                          className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-l-4 border-green-400 border-l-green-600"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{player.name}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                player.category === 'batter' ? 'bg-blue-100 text-blue-800' :
                                player.category === 'bowler' ? 'bg-red-100 text-red-800' :
                                player.category === 'allrounder' ? 'bg-orange-100 text-orange-800' :
                                player.category === 'wicket-keeper' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {player.category === 'wicket-keeper' ? 'keeper' : player.category}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{player.role}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">₹{player.finalBid}</div>
                            <div className="text-sm text-gray-700">
                              Sold to <span className={`px-2 py-1 rounded-full text-xs font-bold ml-1 ${getTeamStyle(player.team, auctionData.teams)}`}>
                                🏏 {cleanTeamName(team?.name) || 'Unknown Team'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }),
                    ...unsoldPlayers.slice(-3).map(player => (
                      <div 
                        key={`fallback-unsold-${player.id}`} 
                        className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-2 border-l-4 border-red-400 border-l-red-600"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{player.name}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              player.category === 'batter' ? 'bg-blue-100 text-blue-800' :
                              player.category === 'bowler' ? 'bg-red-100 text-red-800' :
                              player.category === 'allrounder' ? 'bg-orange-100 text-orange-800' :
                              player.category === 'wicket-keeper' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {player.category === 'wicket-keeper' ? 'keeper' : player.category}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">{player.role}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">UNSOLD</div>
                          <div className="text-sm text-gray-600">No bids received</div>
                        </div>
                      </div>
                    ))].slice(0, 8)
                  )}
                  
                  {transactionHistory.length === 0 && soldPlayers.length === 0 && unsoldPlayers.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No auction activity yet</p>
                  )}
                </div>
                
                {/* Pagination */}
                {transactionHistory.length > transactionsPerPage && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {Math.ceil(transactionHistory.length / transactionsPerPage)}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg backdrop-blur-lg border border-white border-opacity-30 shadow-md"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(transactionHistory.length / transactionsPerPage)))}
                        disabled={currentPage >= Math.ceil(transactionHistory.length / transactionsPerPage)}
                        className="px-3 py-1 text-sm bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg backdrop-blur-lg border border-white border-opacity-30 shadow-md"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>


            </div>
          )}

          {/* Admin-only tabs with role restrictions */}
          {/* Upload Players moved to modal - see PlayerUploadModal component */}

          {isAdmin && activeTab === 'reset' && canConfigure && (
            <ResetControls 
              auctionData={auctionData}
              onReset={fetchAuctionData}
            />
          )}

          {/* NEW: Sub-Admin Management Tab (admin and super-admin only) */}
          {isAdmin && activeTab === 'subadmins' && canConfigure && (
            <SubAdminManagement userRole={userRole} />
          )}



          {/* Access Denied for Sub-Admins trying to access config tabs */}
          {isAdmin && !canConfigure && ['upload', 'reset', 'subadmins'].includes(activeTab) && (
            <div className="text-center py-12 bg-white bg-opacity-25 backdrop-blur-lg rounded-lg border-2 border-red-300 border-opacity-60 shadow-xl">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-lg font-medium mb-2 text-gray-900">Access Restricted</h3>
              <p className="text-gray-600 mb-4">
                Sub-Admins can only perform bidding operations. Configuration access requires Admin or Super Admin role.
              </p>
              <button
                onClick={() => setActiveTab('live')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 border-2 border-indigo-500 shadow-md transition-all"
              >
                Go to Live Status
              </button>
            </div>
          )}

          {/* Access Denied for non-super-admins trying to access undo tab */}
          {isAdmin && activeTab === 'undo' && userRole !== 'super-admin' && (
            <div className="text-center py-12 bg-white bg-opacity-25 backdrop-blur-lg rounded-lg border-2 border-red-300 border-opacity-60 shadow-xl">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-lg font-medium mb-2 text-gray-900">Super Admin Access Required</h3>
              <p className="text-gray-600 mb-4">
                Undo controls are restricted to Super Admins only for safety and audit purposes.
              </p>
              <button
                onClick={() => setActiveTab('live')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 border-2 border-indigo-500 shadow-md transition-all"
              >
                Go to Live Status
              </button>
            </div>
          )}

          {/* Players Tab - Enhanced for both admin and spectators */}
          {activeTab === 'players' && (
            <div className="space-y-6">
              {auctionData.fileUploaded && auctionData.players?.length > 0 ? (
                isAdmin ? (
                  <PlayersList 
                    players={auctionData.players}
                    teams={auctionData.teams}
                    currentBid={auctionData.currentBid}
                    auctionStatus={auctionData.auctionStatus}
                    userRole={userRole}
                  />
                ) : (
                  // Spectator view of players
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-900 tracking-wide">All Players</h3>
                      
                      {/* Modern Filter Tabs */}
                      <div className="flex flex-wrap gap-2 pb-2">
                        {[
                          { id: 'all', name: 'All Players', icon: '👥', count: auctionData.players?.length || 0 },
                          { id: 'sold', name: 'Sold', icon: '✅', count: soldPlayers.length },
                          { id: 'available', name: 'Available', icon: '🔄', count: availablePlayers.length },
                          { id: 'unsold', name: 'Unsold', icon: '❌', count: unsoldPlayers.length },
                          { id: 'captains', name: 'Captains', icon: '👑', count: captains.length },
                          { id: 'retained', name: 'Retentions', icon: '🔒', count: retainedPlayers.length }
                        ].map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => setSpectatorPlayerFilter(filter.id)}
                            className={`tab-button ${spectatorPlayerFilter === filter.id ? 'active' : ''} ${
                              spectatorPlayerFilter === filter.id
                                ? 'bg-blue-500 text-white shadow-xl border-2 border-blue-600'
                                : 'bg-white bg-opacity-25 text-gray-800 hover:text-gray-900 hover:bg-white hover:bg-opacity-35 border-2 border-white border-opacity-50 hover:border-opacity-70'
                            } whitespace-nowrap py-2 px-4 font-medium text-sm flex items-center rounded-lg backdrop-blur-lg shadow-lg min-w-fit transition-all duration-200`}
                          >
                            <span className="mr-2">{filter.icon}</span>
                            {filter.name}
                            {filter.count > 0 && (
                              <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${
                                spectatorPlayerFilter === filter.id 
                                  ? 'bg-white bg-opacity-20 text-white' 
                                  : 'bg-white bg-opacity-40 text-gray-700'
                              }`}>
                                {filter.count}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Filtered Content */}
                    {(() => {
                      // Filter logic based on selected filter
                      if (spectatorPlayerFilter === 'captains') {
                        return captains.length > 0 && (
                          <div className="bg-white bg-opacity-30 backdrop-blur-lg rounded-lg shadow-xl p-6 border-2 border-yellow-300 border-opacity-60">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">
                              Captains ({captains.length}) - Auto-assigned
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {captains.map((player) => {
                                const team = auctionData.teams?.find(t => t.id === player.team);
                                return (
                                  <div key={player.id} className="border rounded-lg p-4 bg-purple-50">
                                    <div className="flex justify-between items-start mb-2">
                                      <h5 className="font-medium text-gray-900">{player.name}</h5>
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        Captain
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{player.role}</p>
                                    <div className="text-sm">
                                      <p className="font-medium text-purple-600 mb-2">Auto-assigned</p>
                                      <div className="mt-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTeamStyle(player.team, auctionData.teams)}`}>
                                          🏏 {cleanTeamName(team?.name) || 'No Team'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      
                      if (spectatorPlayerFilter === 'sold') {
                        return soldPlayers.length > 0 && (
                          <div className="bg-white bg-opacity-30 backdrop-blur-lg rounded-lg shadow-xl p-6 border-2 border-green-300 border-opacity-60">
                            <h4 className="text-lg font-bold text-gray-900 mb-6">
                              Players Sold Through Bidding ({soldPlayers.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {soldPlayers.map((player) => {
                                const team = auctionData.teams?.find(t => t.id === player.team);
                                return (
                                  <div key={player.id} className="bg-green-50 border-2 border-green-300 border-opacity-60 rounded-lg p-4 hover:shadow-lg hover:border-green-400 hover:border-opacity-80 transition-all duration-200">
                                    <div className="flex justify-between items-start mb-2">
                                      <h5 className="text-lg font-bold text-gray-900">{player.name}</h5>
                                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        player.category === 'batter' ? 'bg-blue-100 text-blue-800' :
                                        player.category === 'bowler' ? 'bg-red-100 text-red-800' :
                                        player.category === 'allrounder' ? 'bg-orange-100 text-orange-800' :
                                        player.category === 'wicket-keeper' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {player.category === 'wicket-keeper' ? 'keeper' : player.category}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{player.role}</p>
                                    <div className="text-sm space-y-3">
                                      <p className="text-lg font-bold text-green-600">₹{player.finalBid}</p>
                                      <div className="text-sm text-gray-700">
                                        Sold to <span className={`px-3 py-1 rounded-full text-xs font-bold ml-1 ${getTeamStyle(player.team, auctionData.teams)}`}>
                                          🏏 {cleanTeamName(team?.name)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      
                      if (spectatorPlayerFilter === 'available') {
                        return availablePlayers.length > 0 && (
                          <div className="bg-white bg-opacity-25 backdrop-blur-lg rounded-lg shadow-xl p-6 border border-white border-opacity-20">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">
                              Available for Bidding ({availablePlayers.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {availablePlayers.map((player) => {
                                return (
                                  <div key={player.id} className="border rounded-lg p-4 bg-yellow-50">
                                    <div className="flex justify-between items-start mb-2">
                                      <h5 className="font-medium text-gray-900">{player.name}</h5>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        player.category === 'batter' ? 'bg-blue-100 text-blue-800' :
                                        player.category === 'bowler' ? 'bg-red-100 text-red-800' :
                                        player.category === 'allrounder' ? 'bg-orange-100 text-orange-800' :
                                        player.category === 'wicket-keeper' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {player.category === 'wicket-keeper' ? 'keeper' : player.category}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{player.role}</p>
                                    <div className="text-sm">
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Available
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      
                      if (spectatorPlayerFilter === 'unsold') {
                        return unsoldPlayers.length > 0 && (
                          <div className="bg-white bg-opacity-25 backdrop-blur-lg rounded-lg shadow-xl p-6 border border-white border-opacity-20">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">
                              Unsold Players ({unsoldPlayers.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {unsoldPlayers.map((player) => {
                                return (
                                  <div key={player.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                                    <div className="flex justify-between items-start mb-2">
                                      <h5 className="font-medium text-gray-900">{player.name}</h5>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        player.category === 'batter' ? 'bg-blue-100 text-blue-800' :
                                        player.category === 'bowler' ? 'bg-red-100 text-red-800' :
                                        player.category === 'allrounder' ? 'bg-orange-100 text-orange-800' :
                                        player.category === 'wicket-keeper' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {player.category === 'wicket-keeper' ? 'keeper' : player.category}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{player.role}</p>
                                    <div className="flex items-center text-red-600">
                                      <span className="text-sm font-medium">❌ UNSOLD</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      
                      if (spectatorPlayerFilter === 'retained') {
                        return retainedPlayers.length > 0 ? (
                          <div className="bg-white bg-opacity-25 backdrop-blur-lg rounded-lg shadow-xl p-6 border-2 border-cyan-300 border-opacity-60">
                            <h4 className="text-lg font-medium text-gray-900 mb-6">
                              Retained Players - Team-wise Overview ({retainedPlayers.length} total)
                            </h4>
                            
                            {/* Team-wise Retained Players Table */}
                            <div className="space-y-6">
                              {auctionData.teams?.map((team) => {
                                const teamRetainedPlayers = retainedPlayers.filter(player => player.team === team.id);
                                
                                if (teamRetainedPlayers.length === 0) return null;
                                
                                const totalRetentionAmount = teamRetainedPlayers.reduce((sum, player) => 
                                  sum + (player.retentionAmount || player.finalBid || 0), 0
                                );
                                
                                return (
                                  <div key={team.id} className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl shadow-xl border-2 border-cyan-300 border-opacity-70 mb-4">
                                    {/* Team Header */}
                                    <div className="px-6 py-4 bg-cyan-100 bg-opacity-30 border-b-2 border-cyan-300 border-opacity-60 rounded-t-xl">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                          <span className={`px-4 py-2 rounded-full text-sm font-bold ${getTeamStyle(team.id, auctionData.teams)}`}>
                                            🏏 {cleanTeamName(team.name)}
                                          </span>
                                          <span className="text-sm text-gray-700 font-medium">
                                            ({teamRetainedPlayers.length} player{teamRetainedPlayers.length !== 1 ? 's' : ''})
                                          </span>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm text-gray-600 font-medium">Total Retention Cost</div>
                                          <div className="text-lg font-bold text-cyan-700">₹{totalRetentionAmount}</div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Players Table */}
                                    <div className="overflow-x-auto border-2 border-cyan-200 border-opacity-50 rounded-b-xl">
                                      <table className="w-full border-collapse">
                                        <thead>
                                          <tr className="bg-cyan-100 bg-opacity-40">
                                            <th className="text-left py-3 px-6 text-sm font-semibold text-gray-800 border-b-2 border-r border-cyan-300 border-opacity-50">
                                              Player Name
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-800 border-b-2 border-r border-cyan-300 border-opacity-50">
                                              Role
                                            </th>
                                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-800 border-b-2 border-r border-cyan-300 border-opacity-50">
                                              Category
                                            </th>
                                            <th className="text-right py-3 px-6 text-sm font-semibold text-gray-800 border-b-2 border-cyan-300 border-opacity-50">
                                              Retention Amount
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y-2 divide-cyan-200 divide-opacity-40">
                                          {teamRetainedPlayers.map((player, index) => (
                                            <tr 
                                              key={player.id} 
                                              className={`${
                                                index % 2 === 0 ? 'bg-white bg-opacity-15' : 'bg-cyan-50 bg-opacity-25'
                                              } hover:bg-cyan-100 hover:bg-opacity-40 transition-colors duration-200 border-b border-cyan-200 border-opacity-30`}
                                            >
                                              <td className="py-4 px-6 text-sm border-r border-cyan-200 border-opacity-30">
                                                <div className="flex items-center space-x-2">
                                                  <span className="font-medium text-gray-900">{player.name}</span>
                                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyan-200 bg-opacity-80 text-cyan-900 border border-cyan-400">
                                                    🔒 Retained
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="py-4 px-4 text-sm text-gray-800 border-r border-cyan-200 border-opacity-30">
                                                {player.role}
                                              </td>
                                              <td className="py-4 px-4 text-sm text-center border-r border-cyan-200 border-opacity-30">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                  player.category === 'captain' ? 'bg-purple-100 text-purple-800 border border-purple-400' :
                                                  player.category === 'batter' ? 'bg-gray-200 text-gray-800 border border-gray-500' :
                                                  player.category === 'bowler' ? 'bg-red-100 text-red-800 border border-red-400' :
                                                  player.category === 'allrounder' ? 'bg-orange-100 text-orange-800 border border-orange-400' :
                                                  player.category === 'wicket-keeper' ? 'bg-green-100 text-green-800 border border-green-400' :
                                                  'bg-gray-100 text-gray-800 border border-gray-400'
                                                }`}>
                                                  {player.category === 'wicket-keeper' ? 'Keeper' : 
                                                   player.category === 'allrounder' ? 'All-rounder' :
                                                   player.category.charAt(0).toUpperCase() + player.category.slice(1)}
                                                </span>
                                              </td>
                                              <td className="py-4 px-6 text-sm text-right">
                                                <span className="font-bold text-cyan-700 text-lg">
                                                  ₹{player.retentionAmount || player.finalBid || 0}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Overall Summary */}
                            <div className="mt-6 pt-6 border-t-2 border-cyan-300 border-opacity-50">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-cyan-50 bg-opacity-60 rounded-lg p-4 text-center border-2 border-cyan-300 border-opacity-70 shadow-lg">
                                  <div className="text-2xl font-bold text-cyan-600">{retainedPlayers.length}</div>
                                  <div className="text-sm text-gray-600 font-medium">Total Retained</div>
                                </div>
                                <div className="bg-green-50 bg-opacity-60 rounded-lg p-4 text-center border-2 border-green-300 border-opacity-70 shadow-lg">
                                  <div className="text-2xl font-bold text-green-600">
                                    {auctionData.teams?.filter(team => 
                                      retainedPlayers.some(player => player.team === team.id)
                                    ).length || 0}
                                  </div>
                                  <div className="text-sm text-gray-600 font-medium">Teams with Retentions</div>
                                </div>
                                <div className="bg-purple-50 bg-opacity-60 rounded-lg p-4 text-center border-2 border-purple-300 border-opacity-70 shadow-lg">
                                  <div className="text-2xl font-bold text-purple-600">
                                    ₹{retainedPlayers.reduce((sum, player) => sum + (player.retentionAmount || player.finalBid || 0), 0)}
                                  </div>
                                  <div className="text-sm text-gray-600 font-medium">Total Retention Value</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white bg-opacity-25 backdrop-blur-lg rounded-lg shadow-xl p-12 border-2 border-cyan-300 border-opacity-60 text-center">
                            <div className="text-6xl mb-4">🔒</div>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">No Retained Players</h4>
                            <p className="text-gray-600">No players have been retained by teams yet.</p>
                          </div>
                        );
                      }
                      
                      // Default: Show all players
                      return (
                        <>
                          {/* Captains Section */}
                          {captains.length > 0 && (
                            <div className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl shadow-2xl p-6 border-2 border-yellow-400 border-opacity-70 hover:bg-opacity-30 transition-all duration-300">
                              <h4 className="text-lg font-medium text-gray-900 mb-4">
                                Captains ({captains.length}) - Auto-assigned
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {captains.map((player) => {
                                  const team = auctionData.teams?.find(t => t.id === player.team);
                                  return (
                                    <div key={player.id} className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                                      <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-medium text-gray-900">{player.name}</h5>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                          Captain
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-2">{player.role}</p>
                                      <div className="text-sm">
                                        <p className="font-medium text-purple-600 mb-2">Auto-assigned</p>
                                        <div className="mt-2">
                                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTeamStyle(player.team, auctionData.teams)}`}>
                                            🏏 {cleanTeamName(team?.name) || 'No Team'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Other Players by Status */}
                          {[
                            { status: 'retained', title: 'Players Retained by Teams', players: retainedPlayers },
                            { status: 'sold', title: 'Players Sold Through Bidding', players: soldPlayers },
                            { status: 'available', title: 'Available for Bidding', players: availablePlayers },
                            { status: 'unsold', title: 'Unsold Players', players: unsoldPlayers }
                          ].map(({ status, title, players }) => {
                            if (players.length === 0) return null;
                            
                            return (
                              <div key={status} className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl shadow-2xl p-6 border-2 border-indigo-400 border-opacity-70 hover:bg-opacity-30 transition-all duration-300">
                                <h4 className="text-lg font-medium text-gray-900 mb-4">
                                  {title} ({players.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {players.map((player) => {
                                    const team = auctionData.teams?.find(t => t.id === player.team);
                                    return (
                                      <div key={player.id} className="border-2 border-gray-300 rounded-lg p-4 bg-white bg-opacity-40">
                                        <div className="flex justify-between items-start mb-2">
                                          <h5 className="font-medium text-gray-900">{player.name}</h5>
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            player.category === 'batter' ? 'bg-blue-100 text-blue-800' :
                                            player.category === 'bowler' ? 'bg-red-100 text-red-800' :
                                            player.category === 'allrounder' ? 'bg-orange-100 text-orange-800' :
                                            player.category === 'wicket-keeper' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {player.category === 'wicket-keeper' ? 'keeper' : player.category}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{player.role}</p>
                                        {status === 'retained' && (
                                          <div className="text-sm space-y-2">
                                            <p className="font-medium text-purple-600 mb-2">₹{player.retentionAmount || player.finalBid || 0}</p>
                                            <div className="mt-2">
                                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTeamStyle(player.team, auctionData.teams)}`}>
                                                🏏 {cleanTeamName(team?.name)}
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                        {status === 'sold' && (
                                          <div className="text-sm space-y-2">
                                            <p className="font-medium text-green-600 mb-2">₹{player.finalBid}</p>
                                            <div className="mt-2">
                                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTeamStyle(player.team, auctionData.teams)}`}>
                                                🏏 {cleanTeamName(team?.name)}
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                        {status === 'assigned' && (
                                          <div className="text-sm space-y-2">
                                            <p className="font-medium text-purple-600 mb-2">Captain</p>
                                            <div className="mt-2">
                                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTeamStyle(player.team, auctionData.teams)}`}>
                                                🏏 {cleanTeamName(team?.name)}
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                        {status === 'unsold' && (
                                          <div className="flex items-center text-red-600">
                                            <span className="text-sm font-medium">❌ UNSOLD</span>
                                          </div>
                                        )}
                                        {status === 'available' && (
                                          <div className="text-sm">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                              Available
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                    
                    {/* No results message */}
                    {spectatorPlayerFilter !== 'all' && (
                      (() => {
                        const isEmpty = 
                          (spectatorPlayerFilter === 'captains' && captains.length === 0) ||
                          (spectatorPlayerFilter === 'sold' && soldPlayers.length === 0) ||
                          (spectatorPlayerFilter === 'available' && availablePlayers.length === 0) ||
                          (spectatorPlayerFilter === 'unsold' && unsoldPlayers.length === 0) ||
                          (spectatorPlayerFilter === 'retained' && retainedPlayers.length === 0);
                        
                        return isEmpty && (
                          <div className="text-center py-12 bg-white bg-opacity-20 backdrop-blur-lg rounded-lg border-2 border-gray-300 border-opacity-50 shadow-lg">
                            <div className="text-4xl mb-4">🔍</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Players Found</h3>
                            <p className="text-gray-600">
                              No players match the selected filter criteria.
                            </p>
                          </div>
                        );
                      })()
                    )}
                  </div>
                )
              ) : (
                <div className="text-center py-12 bg-white bg-opacity-25 backdrop-blur-lg rounded-lg border-2 border-gray-300 border-opacity-60 shadow-xl">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-medium mb-2 text-gray-900">No Players Available</h3>
                  <p className="text-gray-600">
                    {!auctionData.fileUploaded 
                      ? 'No player file has been uploaded yet.' 
                      : 'The uploaded file doesn\'t contain any valid players.'
                    }
                  </p>
                  {isAdmin && canConfigure && (
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 border-2 border-indigo-500 shadow-md"
                    >
                      Upload Players
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Team Management Tab - For Admin: Team Management & Retention, For Spectators: Team Squad Viewer */}
          {activeTab === 'teams' && (
            <div className="space-y-6">
              {auctionData.fileUploaded ? (
                <>
                  {/* Admin Team Management (only for admin/super-admin) */}
                  {isAdmin && canConfigure && <TeamManagement 
                    teams={auctionData.teams || []} 
                    auctionData={auctionData} 
                    onTeamsUpdate={handleTeamsUpdate}
                    onPlayersUpdate={handlePlayersUpdate}
                  />}
                  
                  {/* Team Squad Viewer for Spectators only */}
                  {!isAdmin && <TeamSquadViewer 
                    teams={auctionData.teams || []}
                    players={auctionData.players || []}
                  />}
                  
                  {/* Message for admin when no team management access */}
                  {isAdmin && !canConfigure && (
                    <div className="text-center py-12 text-gray-500 bg-white bg-opacity-25 backdrop-blur-lg rounded-lg border-2 border-gray-300 border-opacity-60 shadow-xl">
                      <div className="text-6xl mb-4">🔐</div>
                      <h3 className="text-lg font-medium mb-2 text-gray-900">Access Restricted</h3>
                      <p className="text-gray-600">Team management is only available to super-admin and admin roles.</p>
                      <p className="text-sm text-gray-500 mt-2">Use the "Team Squads" tab to view team compositions.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 bg-white bg-opacity-25 backdrop-blur-lg rounded-lg border-2 border-gray-300 border-opacity-60 shadow-xl">
                  <div className="text-6xl mb-4">⚙️</div>
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">Team Management Not Available</h3>
                  <p className="text-lg font-semibold text-gray-700">Team management features will be available once player data is uploaded.</p>
                </div>
              )}
            </div>
          )}

          {/* Team Squads Tab - Dedicated tab for viewing team compositions */}
          {activeTab === 'teamsquads' && (
            <div className="space-y-6">
              {auctionData.fileUploaded ? (
                <TeamSquadViewer 
                  teams={auctionData.teams || []}
                  players={auctionData.players || []}
                />
              ) : (
                <div className="text-center py-12 text-gray-500 bg-white bg-opacity-25 backdrop-blur-lg rounded-lg border-2 border-gray-300 border-opacity-60 shadow-xl">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">Team Squads Not Available</h3>
                  <p className="text-lg font-semibold text-gray-700">Team squads will be available once player data is uploaded.</p>
                </div>
              )}
            </div>
          )}

          {/* Stats Tab - Available to everyone */}
          {activeTab === 'stats' && (
            <StatsDisplay 
              stats={auctionData.stats || {}}
              teams={auctionData.teams || []}
              players={auctionData.players || []}
            />
          )}
        </div>
      </div>

      {/* Undo Confirmation Modal */}
      {showUndoConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white bg-opacity-25 backdrop-blur-xl rounded-xl shadow-2xl max-w-md w-full mx-auto border-2 border-red-400 border-opacity-70">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-center text-gray-900 mb-4">
                Confirm {undoConfirmAction?.type === 'sale' ? 'Sale Undo' : 'Bid Reversion'}
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                {undoConfirmAction?.message}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={cancelUndoAction}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeUndoAction}
                  disabled={undoLoading}
                  className={`flex-1 font-medium py-2 px-4 rounded-md transition-colors ${
                    undoConfirmAction?.type === 'sale' 
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  } disabled:opacity-50`}
                >
                  {undoLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    undoConfirmAction?.type === 'sale' ? '↩️ Undo Sale' : '⏪ Revert Bid'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Players Modal */}
      <PlayerUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
        onDataRefresh={fetchAuctionData}
      />
    </div>
  );
};

export default UnifiedDashboard;
