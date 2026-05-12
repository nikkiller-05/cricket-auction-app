
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import LiveBiddingCard from './LiveBiddingCard';
import { useNotification } from './NotificationSystem';

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
  
  // Find captain based on team.captain property
  const captain = currentTeam?.captain ? teamPlayers.find(p => p.id === currentTeam.captain) : null;
  
  // Exclude captain from bought players and categorize by role
  const playersExcludingCaptain = captain ? teamPlayers.filter(p => p.id !== captain.id) : teamPlayers;
  
  // Categorize players by role (excluding captain)
  const playersByCategory = {
    batter: playersExcludingCaptain.filter(p => p.category === 'batter'),
    bowler: playersExcludingCaptain.filter(p => p.category === 'bowler'),
    allrounder: playersExcludingCaptain.filter(p => p.category === 'allrounder'),
    'wicket-keeper': playersExcludingCaptain.filter(p => p.category === 'wicket-keeper'),
    other: playersExcludingCaptain.filter(p => !['batter', 'bowler', 'allrounder', 'wicket-keeper'].includes(p.category))
  };
  
  const boughtPlayers = playersExcludingCaptain.filter(p => p.status === 'sold').sort((a, b) => (b.finalBid || 0) - (a.finalBid || 0));
  const teamRetainedPlayers = playersExcludingCaptain.filter(p => p.status === 'retained');
  const captainAmount = captain ? (captain.captainAmount || currentTeam?.captainAmount || 0) : 0;
  const totalSpentOnAuction = boughtPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
  const totalSpentOnRetention = teamRetainedPlayers.reduce((sum, p) => sum + (p.retentionAmount || p.finalBid || 0), 0);
  const totalSpent = totalSpentOnAuction + totalSpentOnRetention + captainAmount;
  const budgetUsed = currentTeam ? ((totalSpent / (currentTeam.budget + totalSpent)) * 100) : 0;

  return (
    <div className="bg-white bg-opacity-25 shadow-xl rounded-lg border border-white border-opacity-20">
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
                } whitespace-nowrap py-2 px-4 font-medium text-sm flex items-center rounded-lg border shadow-lg min-w-fit`}
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
                  className={`h-2 rounded-full transition-colors duration-200 ${
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
                <div className="text-2xl font-bold text-purple-600">{captain ? 1 : 0}</div>
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

          {/* Captain Section */}
          {captain && (
            <div className="mb-6">
              <div className="bg-purple-50 border-2 border-purple-300 border-opacity-70 rounded-lg p-4 shadow-md">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-2xl mr-3">👑</span>
                  Team Captain
                  <span className="ml-2 text-sm text-gray-500">(1)</span>
                </h4>
                <div className="bg-white bg-opacity-15 border-2 border-gray-200 border-opacity-50 rounded-xl p-3 hover:shadow-2xl hover:bg-opacity-25 hover:border-gray-300 hover:border-opacity-70 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">C</div>
                      <div>
                        <h5 className="font-medium text-gray-900 flex items-center">
                          {captain.name}
                          <span className="ml-2 text-lg">👑</span>
                        </h5>
                        <p className="text-sm text-gray-600">{captain.role}</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 bg-purple-100 text-purple-800">
                          Captain
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-purple-600">₹{captainAmount}</div>
                      <div className="text-xs text-gray-500">{captain.status === 'retained' ? 'Retention Cost' : 'Assignment Cost'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                      <div key={player.id} className="bg-white bg-opacity-15 border-2 border-gray-200 border-opacity-50 rounded-xl p-3 hover:shadow-2xl hover:bg-opacity-25 hover:border-gray-300 hover:border-opacity-70 transition-colors duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900 flex items-center">
                                {player.name}
                              </h5>
                              <p className="text-sm text-gray-600">{player.role}</p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${style.badge}`}>
                                {category.replace('-', ' ')}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            {player.status === 'retained' ? (
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
                  {categoryPlayers.length > 0 && (
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
                  const isCaptainCol = category === 'captain';
                  const categoryPlayers = isCaptainCol
                    ? (captain ? [captain] : [])
                    : (playersByCategory[category] || []);
                  const categorySpent = isCaptainCol
                    ? captainAmount
                    : categoryPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
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
                        ₹{categorySpent}
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
  const { showSuccess, showError, showWarning, showInfo, confirm } = useNotification();
  
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
  
  // Edit Settings modal state
  const [showEditSettingsModal, setShowEditSettingsModal] = useState(false);
  const [settingsConfig, setSettingsConfig] = useState({
    teamCount: 4,
    startingBudget: 1000,
    maxPlayersPerTeam: 15,
    basePrice: 10,
    biddingIncrements: [
      { threshold: 50, increment: 5 },
      { threshold: 100, increment: 10 },
      { threshold: 200, increment: 20 }
    ]
  });
  const [settingsSaveLoading, setSettingsSaveLoading] = useState(false);
  
  // Undo functionality states
  const [undoLoading, setUndoLoading] = useState(false);
  const [actionHistory, setActionHistory] = useState([]);
  const [showUndoConfirmModal, setShowUndoConfirmModal] = useState(false);
  const [undoConfirmAction, setUndoConfirmAction] = useState(null);
  
  // Auction toggle state
  const [auctionToggleLoading, setAuctionToggleLoading] = useState(false);

  // Memoized player lists for performance - MUST BE BEFORE ANY CONDITIONAL RETURNS
  // Captains: derive from teams[].captain so admin-assigned captains (any
  // category) are reflected, and fall back to legacy category==='captain'.
  const captains = useMemo(() => {
    const allPlayers = auctionData?.players || [];
    const allTeams = auctionData?.teams || [];
    const fromTeams = allTeams
      .map(t => (t.captain ? allPlayers.find(p => p.id === t.captain) : null))
      .filter(Boolean);
    const legacy = allPlayers.filter(
      p => p.category === 'captain' && !fromTeams.some(c => c.id === p.id)
    );
    return [...fromTeams, ...legacy];
  }, [auctionData?.players, auctionData?.teams]);
  const soldPlayers = useMemo(() => 
    auctionData?.players?.filter(p => p.status === 'sold' && p.category !== 'captain') || [], 
    [auctionData?.players]
  );
  const retainedPlayers = useMemo(() => 
    auctionData?.players?.filter(p => p.status === 'retained') || [], 
    [auctionData?.players]
  );
  const availablePlayers = useMemo(() => 
    auctionData?.players?.filter(p => p.status === 'available' && p.category !== 'captain') || [], 
    [auctionData?.players]
  );
  const unsoldPlayers = useMemo(() => 
    auctionData?.players?.filter(p => p.status === 'unsold') || [], 
    [auctionData?.players]
  );

  useEffect(() => {
    // Check if user is admin from location state or localStorage
    const adminFromState = location.state?.isAdmin;
    const token = localStorage.getItem('adminToken');

    // Honor explicit spectator entry (state.isAdmin === false) even if a stale
    // admin token lingers in localStorage from a previous session.
    const enteredAsSpectator = adminFromState === false;

    if (!enteredAsSpectator && (adminFromState || token)) {
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
      setAuctionData(data);
      setLoading(false);
    });

    socketConnection.on('playersUpdated', (players) => {
      setAuctionData(prev => prev ? { ...prev, players } : prev);
    });

    socketConnection.on('teamsUpdated', (teams) => {
      setAuctionData(prev => prev ? { ...prev, teams } : prev);
    });

    socketConnection.on('playerSold', (data) => {
      if (data.player && data.team) {
        addTransaction(data.player, 'sold', data.team, data.finalBid);
        showSuccess(`${data.player.name} sold to ${cleanTeamName(data.team.name)} for ₹${data.finalBid}`);
      }
    });

    socketConnection.on('playerUnsold', (data) => {
      if (data.player) {
        addTransaction(data.player, 'unsold');
        showWarning(`${data.player.name} marked as unsold`);
      }
    });

    socketConnection.on('playerRetained', (data) => {
      if (data.player && data.team) {
        addTransaction(data.player, 'retained', data.team, data.retentionAmount);
        showInfo(`${data.player.name} retained by ${cleanTeamName(data.team.name)} for ₹${data.retentionAmount}`);
      }
    });

    socketConnection.on('playerRetentionRemoved', (data) => {
      if (data.player && data.team) {
        // Remove the retention transaction from history
        setTransactionHistory(prev => {
          return prev.filter(t => !(t.type === 'retained' && t.playerName === data.player.name));
        });
        showWarning(`Retention removed: ${data.player.name} (₹${data.refundedAmount} refunded)`);
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
        // Remove any prior captain-assigned transaction for the same player on the same team
        if (data.player) {
          setTransactionHistory(prev => prev.filter(t =>
            !(t.type === 'captain-assigned' && t.playerId === data.player.id)
          ));
        }
        showWarning(`Captain unassigned from ${cleanTeamName(data.team.name)}`);
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

    socketConnection.on('settingsUpdated', (settings) => {
      setAuctionData(prev => ({ ...prev, settings }));
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
      // Remove the last sale transaction from history
      setTransactionHistory(prev => {
        const playerName = typeof data.player === 'string' ? data.player : data.player?.name;
        return prev.filter(t => !(t.type === 'sold' && t.playerName === playerName));
      });
    });

    socketConnection.on('bidUndone', (data) => {
      showWarning(`Bid undone: ${data.player} (₹${data.revertedToAmount})`);
    });

    // Cleanup on unmount
    return () => {
      socketConnection.disconnect();
    };
  }, [location.state, showSuccess, showWarning, showInfo]);

  // Transaction history initialization function - OPTIMIZED with proper memoization
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
      setActionHistory(response.data.history);
    } catch (error) {
      console.error('Error fetching action history:', error);
    }
  }, []);

  // Fetch action history for super-admin
  useEffect(() => {
    if (userRole === 'super-admin' && isAdmin) {
      fetchActionHistory();
    }
  }, [userRole, isAdmin, fetchActionHistory]);

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
  const handleUndoLastSale = useCallback(async () => {
    const lastAction = actionHistory.find(action => 
      action.type === 'PLAYER_SOLD' || action.type === 'PLAYER_UNSOLD'
    );
    
    if (!lastAction) {
      showError('No sale or unsold action to undo');
      return;
    }

    const actionType = lastAction.type === 'PLAYER_SOLD' ? 'sale' : 'unsold';
    const message = actionType === 'sale' 
      ? 'Are you sure you want to undo the last sale? This will refund the money to the team and make the player available again.'
      : `Are you sure you want to undo the unsold action? This will make ${lastAction.playerName} available for bidding again.`;

    setUndoConfirmAction({
      type: actionType,
      message,
      action: async () => {
        setUndoLoading(true);
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auction/undo/sale`);
          
          if (response.data.type === 'sale') {
            showWarning(`Sale Undone: ${response.data.player} - Refunded ₹${response.data.refundedAmount} to ${response.data.team}`);
          } else if (response.data.type === 'unsold') {
            showWarning(`Unsold Action Undone: ${response.data.player} is now available again`);
          }
          
          fetchActionHistory();
        } catch (error) {
          showError(error.response?.data?.error || 'Failed to undo action');
        } finally {
          setUndoLoading(false);
        }
      }
    });
    setShowUndoConfirmModal(true);
  }, [actionHistory, showError, showWarning, fetchActionHistory]);

  const handleUndoCurrentBid = useCallback(async () => {
    setUndoConfirmAction({
      type: 'bid',
      message: 'Are you sure you want to undo the current bid? This will revert to the previous team\'s bid or base price.',
      action: async () => {
        setUndoLoading(true);
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auction/undo/bid`);
          if (response.data.revertedToTeam) {
            showWarning(`Bid Reverted: ${response.data.player} - Back to ${response.data.revertedToTeam} (₹${response.data.revertedToAmount})`);
          } else {
            showWarning(`Bid Reverted: ${response.data.player} - Back to base price (₹${response.data.revertedToAmount})`);
          }
        } catch (error) {
          showError(error.response?.data?.error || 'Failed to undo bid');
        } finally {
          setUndoLoading(false);
        }
      }
    });
    setShowUndoConfirmModal(true);
  }, [showWarning, showError]);

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

  // Keyboard shortcuts for Super Admin
  useEffect(() => {
    if (userRole !== 'super-admin') return;

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
              // Place bid for this team
              axios.post(`${API_BASE_URL}/api/auction/bidding/place`, { teamId: team.id })
                .catch(error => showError(error.response?.data?.error || 'Failed to place bid'));
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userRole, undoLoading, auctionData, actionHistory, handleUndoLastSale, handleUndoCurrentBid, showError]);

  const handleLogout = () => {
    setIsAdmin(false);
    setUserRole('spectator');
    localStorage.removeItem('adminToken');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/');
  };

  const handleUploadSuccess = (data) => {
    showSuccess(`Successfully uploaded ${data.playerCount} players from ${data.fileName}`);
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
      showSuccess(`${format.toUpperCase()} results downloaded successfully`);
    } catch (error) {
      console.error('Error downloading results:', error);
      showError(`Error downloading ${format} results`);
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
      showSuccess('Team squads downloaded successfully');
    } catch (error) {
      console.error('Error downloading team squads:', error);
      showError('Error downloading team squads');
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
      showSuccess('Auction summary downloaded successfully');
    } catch (error) {
      console.error('Error downloading auction summary:', error);
      showError('Error downloading auction summary');
    }
  };

  // Settings modal functions
  const handleOpenEditSettings = async () => {
    try {
      // Fetch current auction configuration
      const response = await axios.get(`${API_BASE_URL}/api/auction/config`);
      if (response.data.config) {
        setSettingsConfig(response.data.config);
      }
      setShowEditSettingsModal(true);
    } catch (error) {
      console.error('Error fetching auction config:', error);
      showError('Error loading auction settings');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSettingsSaveLoading(true);
      
      // Validate settings
      if (settingsConfig.teamCount < 2) {
        showError('Team count must be at least 2');
        setSettingsSaveLoading(false);
        return;
      }
      if (settingsConfig.startingBudget < 100) {
        showError('Starting budget must be at least 100');
        setSettingsSaveLoading(false);
        return;
      }
      if (settingsConfig.maxPlayersPerTeam < 5) {
        showError('Max players per team must be at least 5');
        setSettingsSaveLoading(false);
        return;
      }
      if (settingsConfig.basePrice < 1) {
        showError('Base price must be at least 1');
        setSettingsSaveLoading(false);
        return;
      }

      // Update auction configuration
      const response = await axios.put(`${API_BASE_URL}/api/auction/config`, settingsConfig);
      
      if (response.data.success) {
        showSuccess('Auction settings updated successfully');
        setShowEditSettingsModal(false);
        // Refresh auction data to reflect new settings
        const dataResponse = await axios.get(`${API_BASE_URL}/api/auction/data`);
        setAuctionData(dataResponse.data);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showError(error.response?.data?.error || 'Error saving auction settings');
    } finally {
      setSettingsSaveLoading(false);
    }
  };

  const handleSettingsConfigChange = (field, value) => {
    setSettingsConfig(prev => ({
      ...prev,
      [field]: value === '' ? '' : value
    }));
  };

  const handleSettingsIncrementChange = (index, field, value) => {
    const newIncrements = [...settingsConfig.biddingIncrements];
    
    if (value === '') {
      newIncrements[index] = {
        ...newIncrements[index],
        [field]: ''
      };
      setSettingsConfig(prev => ({
        ...prev,
        biddingIncrements: newIncrements
      }));
      return;
    }
    
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue) && numericValue >= 0) {
      newIncrements[index] = {
        ...newIncrements[index],
        [field]: numericValue
      };
      setSettingsConfig(prev => ({
        ...prev,
        biddingIncrements: newIncrements
      }));
    }
  };

  const addSettingsIncrement = () => {
    setSettingsConfig(prev => ({
      ...prev,
      biddingIncrements: [
        ...prev.biddingIncrements,
        { threshold: 0, increment: 5 }
      ]
    }));
  };

  const removeSettingsIncrement = (index) => {
    if (settingsConfig.biddingIncrements.length > 1) {
      const newIncrements = settingsConfig.biddingIncrements.filter((_, i) => i !== index);
      setSettingsConfig(prev => ({
        ...prev,
        biddingIncrements: newIncrements
      }));
    }
  };

  // Handle auction toggle for Header component - Only for admin roles
  const handleAuctionToggle = async (newState) => {
    // Check if user has admin permissions
    if (!isAdmin) {
      showError('Only administrators can control auction status');
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
      showError(error.response?.data?.error || 'Error toggling auction');
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
            className="bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white hover:-translate-y-0.5 active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150 px-6 py-3 rounded-xl font-semibold transition-[background-color,box-shadow,transform,border-color] duration-150 hover:-translate-y-0.5 active:translate-y-0"
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
              className={`max-w-sm p-4 rounded-lg shadow-lg border-l-4 transform transition-colors duration-200 ${
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
        onEditSettings={isAdmin ? handleOpenEditSettings : null}
        onUndoLastSale={handleUndoLastSale}
        canUndoLastSale={(() => {
          const lastSale = actionHistory.slice().reverse().find(action => action.type === 'PLAYER_SOLD');
          return !!lastSale;
        })()}
        undoLoading={undoLoading}
        auctionStatus={auctionData.auctionStatus}
      />



      {/* Current Bid Indicator - only show when there's an active bid */}
      {auctionData.currentBid && (
        <div className="bg-white bg-opacity-20 border-b border-white border-opacity-30 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <div className="px-4 py-2 rounded-full text-sm font-medium bg-yellow-400 bg-opacity-80 text-yellow-900 animate-pulse shadow-lg border border-yellow-300">
                💰 Current Bid: ₹{auctionData.currentBid.currentAmount}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 rounded-2xl border border-white/60 bg-white/55 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_12px_28px_-16px_rgba(15,23,42,0.18)]">
        {/* SINGLE Live Bidding Section - Visible to everyone */}
        {auctionData.currentBid && currentPlayer && (
          <LiveBiddingCard
            player={currentPlayer}
            currentAmount={auctionData.currentBid.currentAmount}
            leadingTeamName={biddingTeam ? cleanTeamName(biddingTeam.name) : null}
            leadingTeamBudget={biddingTeam ? biddingTeam.budget : null}
            isFastTrack={auctionData.auctionStatus === 'fast-track'}
            rightSlot={isAdmin ? (
              <div>
                {/* Section label */}
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-bold text-white/70 text-center mb-3">
                  Place Bid
                </p>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 mb-5">
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
                            showError(error.response?.data?.error || 'Error placing bid');
                          }
                        }}
                        disabled={!canBid}
                        className={`group relative overflow-hidden px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-200 border ${
                          canBid 
                            ? 'bg-gradient-to-br from-cyan-400/90 to-blue-600/90 text-white border-cyan-300/60 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-400/50 hover:-translate-y-0.5 hover:from-cyan-300 hover:to-blue-500 active:scale-95' 
                            : 'bg-white/5 text-white hover:-translate-y-0.5 active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150/40 cursor-not-allowed border-white/10'
                        }`}
                        title={
                          hasMaxPlayers 
                            ? `Team full (${team.players?.length}/${auctionData.settings?.maxPlayersPerTeam || 15} players)` 
                            : !hasSufficientBudget 
                              ? `Insufficient budget (₹${team.budget})` 
                              : `Bid ₹${nextBidAmount} for ${cleanTeamName(team.name)}`
                        }
                      >
                        {canBid && (
                          <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                        )}
                        <div className="relative flex flex-col items-center leading-tight">
                          <span className="tracking-wide">{cleanTeamName(team.name)}</span>
                          <span className={`text-[10px] mt-0.5 font-semibold ${canBid ? 'text-white/85' : 'text-white/30'}`}>₹{team.budget}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* Primary Action Buttons */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  <button
                    onClick={async () => {
                      try {
                        await axios.post(`${API_BASE_URL}/api/auction/bidding/sell`);
                        if (userRole === 'super-admin') {
                          fetchActionHistory();
                        }
                      } catch (error) {
                        showError(error.response?.data?.error || 'Error selling player');
                      }
                    }}
                    disabled={!auctionData.currentBid.biddingTeam}
                    className="group relative overflow-hidden px-5 sm:px-7 py-2.5 sm:py-3 bg-gradient-to-br from-emerald-400 to-green-600 hover:from-emerald-300 hover:to-green-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-white hover:-translate-y-0.5 active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/40 hover:shadow-xl hover:shadow-emerald-400/60 hover:-translate-y-0.5 active:scale-95 duration-200 border border-emerald-300/50 inline-flex items-center gap-2"
                  >
                    <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                    <span className="text-base">✅</span>
                    <span className="tracking-wide">SELL</span>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await axios.post(`${API_BASE_URL}/api/auction/bidding/unsold`);
                        if (userRole === 'super-admin') {
                          fetchActionHistory();
                        }
                      } catch (error) {
                        showError(error.response?.data?.error || 'Error marking as unsold');
                      }
                    }}
                    className="group relative overflow-hidden px-5 sm:px-7 py-2.5 sm:py-3 bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white hover:-translate-y-0.5 active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/40 hover:shadow-xl hover:shadow-rose-400/60 hover:-translate-y-0.5 active:scale-95 duration-200 border border-rose-300/50 inline-flex items-center gap-2"
                  >
                    <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                    <span className="text-base">❌</span>
                    <span className="tracking-wide">UNSOLD</span>
                  </button>
                </div>
                
                {/* Undo Controls - Only for super-admin */}
                {userRole === 'super-admin' && (
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4 pt-4 border-t border-white/15">
                    <button
                      onClick={handleUndoCurrentBid}
                      disabled={undoLoading || !auctionData.currentBid}
                      className="group relative overflow-hidden px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg text-xs font-semibold border border-white/20 hover:border-white/40 transition-colors duration-150 active:scale-95 inline-flex items-center gap-1.5"
                      title="Undo Last Bid - Removes the most recent bid during active bidding"
                    >
                      <span>⏪</span>
                      <span className="hidden sm:inline tracking-wide">Undo Last Bid</span>
                    </button>
                    
                    <button
                      onClick={async () => {
                        const confirmed = await confirm(
                          `Cancel bidding for ${currentPlayer.name}?\n\nThis will:\n• Reset the player to available status\n• Clear all bids for this player\n• Allow starting bidding again for this player\n\nAre you sure?`,
                          'Cancel Bidding'
                        );
                        if (!confirmed) return;

                        try {
                          await axios.post(`${API_BASE_URL}/api/auction/bidding/cancel`);
                          showInfo('Bidding cancelled successfully - player is available again', 'Bidding Cancelled');
                        } catch (error) {
                          showError(error.response?.data?.error || 'Error cancelling bidding', 'Error');
                        }
                      }}
                      disabled={!auctionData.currentBid}
                      className="group relative overflow-hidden px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg text-xs font-semibold border border-white/20 hover:border-white/40 transition-colors duration-150 active:scale-95 inline-flex items-center gap-1.5"
                      title="Cancel bidding and return player to available status"
                    >
                      <span>⛔</span>
                      <span className="hidden sm:inline tracking-wide">Cancel</span>
                    </button>
                  </div>
                )}
                
                {/* Cancel Button for Regular Admins (when super-admin controls not shown) */}
                {isAdmin && userRole !== 'super-admin' && (
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4 pt-4 border-t border-white/15">
                    <button
                      onClick={async () => {
                        const confirmed = await confirm(
                          `Cancel bidding for ${currentPlayer.name}?\n\nThis will:\n• Reset the player to available status\n• Clear all bids for this player\n• Allow starting bidding again for this player\n\nAre you sure?`,
                          'Cancel Bidding'
                        );
                        if (!confirmed) return;

                        try {
                          await axios.post(`${API_BASE_URL}/api/auction/bidding/cancel`);
                          showInfo('Bidding cancelled successfully - player is available again', 'Bidding Cancelled');
                        } catch (error) {
                          showError(error.response?.data?.error || 'Error cancelling bidding', 'Error');
                        }
                      }}
                      disabled={!auctionData.currentBid}
                      className="group relative overflow-hidden px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg text-xs font-semibold border border-white/20 hover:border-white/40 transition-colors duration-150 active:scale-95 inline-flex items-center gap-1.5"
                      title="Cancel bidding and return player to available status"
                    >
                      <span>⛔</span>
                      <span className="hidden sm:inline tracking-wide">Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          />
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Total Players', value: auctionData.players?.length || 0, accent: 'from-indigo-500 to-violet-500' },
            { label: 'Players Sold', value: soldPlayers.length, accent: 'from-emerald-500 to-teal-500' },
            { label: 'Retained', value: retainedPlayers.length, accent: 'from-fuchsia-500 to-purple-500' },
            { label: 'Captains', value: captains.length, accent: 'from-amber-500 to-orange-500' },
            { label: 'Available', value: availablePlayers.length, accent: 'from-sky-500 to-cyan-500' },
            { label: 'Unsold', value: unsoldPlayers.length, accent: 'from-rose-500 to-red-500' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-xl border border-slate-200/70 bg-white/90 p-4 text-left shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_6px_16px_-10px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 hover:border-slate-300/80 transition-[transform,box-shadow,border-color] duration-200"
            >
              <span className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${stat.accent} opacity-80`} />
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-500">{stat.label}</div>
              <div className={`mt-1 text-3xl font-bold bg-gradient-to-br ${stat.accent} bg-clip-text text-transparent`}>{stat.value}</div>
            </div>
          ))}
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
                    ? 'bg-gradient-to-br from-slate-900 via-indigo-900 to-indigo-700 text-white border-indigo-500/40 shadow-[0_10px_24px_-12px_rgba(79,70,229,0.6)]'
                    : 'bg-white/70 text-slate-700 hover:text-slate-900 hover:bg-white border-slate-200/80 hover:border-slate-300'
                } whitespace-nowrap py-2.5 px-5 font-semibold text-sm flex items-center rounded-xl border shadow-sm min-w-fit transition-colors duration-150`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
                
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === tab.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
                
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === tab.id 
                      ? 'bg-rose-400 text-white' 
                      : 'bg-rose-100 text-rose-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content rounded-2xl p-6 sm:p-8 mt-4 border border-white/60 bg-white/65 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_20px_50px_-30px_rgba(15,23,42,0.25)]">
          {/* Live Status Tab - Available to everyone */}
          {activeTab === 'live' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Live Auction Status</h3>
              
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Sold', value: soldPlayers.length, accent: 'from-emerald-500 to-teal-500' },
                  { label: 'Unsold', value: unsoldPlayers.length, accent: 'from-rose-500 to-red-500' },
                  { label: 'Available', value: availablePlayers.length, accent: 'from-sky-500 to-cyan-500' },
                  { label: 'Captains', value: captains.length, accent: 'from-amber-500 to-orange-500' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="group relative overflow-hidden rounded-xl border border-slate-200/70 bg-white/90 p-4 text-left shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_6px_16px_-10px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 transition-[transform,box-shadow,border-color] duration-200"
                  >
                    <span className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${stat.accent}`} />
                    <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-500">{stat.label}</div>
                    <div className={`mt-1 text-2xl font-bold bg-gradient-to-br ${stat.accent} bg-clip-text text-transparent`}>{stat.value}</div>
                  </div>
                ))}
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
              <div className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)] p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-bold text-slate-900 tracking-tight">Recent Auction Activity</h4>
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
                                : transaction.type === 'captain-assigned'
                                ? 'bg-yellow-50 border-yellow-400 border-l-yellow-600'
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
                              ) : transaction.type === 'captain-assigned' ? (
                                <>
                                  <div className="font-bold text-yellow-700">👑 ₹{transaction.finalBid || 0}</div>
                                  <div className="text-sm text-gray-700">
                                    Captain of <span className={`px-2 py-1 rounded-full text-xs font-bold ml-1 ${getTeamStyle(transaction.team?.id, auctionData.teams)}`}>
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
                        className="px-3 py-1 text-sm bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-white border-opacity-30 shadow-md"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(transactionHistory.length / transactionsPerPage)))}
                        disabled={currentPage >= Math.ceil(transactionHistory.length / transactionsPerPage)}
                        className="px-3 py-1 text-sm bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-white border-opacity-30 shadow-md"
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
            <div className="text-center py-12 bg-white bg-opacity-25 rounded-lg border-2 border-red-300 border-opacity-60 shadow-xl">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-lg font-medium mb-2 text-gray-900">Access Restricted</h3>
              <p className="text-gray-600 mb-4">
                Sub-Admins can only perform bidding operations. Configuration access requires Admin or Super Admin role.
              </p>
              <button
                onClick={() => setActiveTab('live')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 border border-indigo-500/40 shadow-md transition-all"
              >
                Go to Live Status
              </button>
            </div>
          )}

          {/* Access Denied for non-super-admins trying to access undo tab */}
          {isAdmin && activeTab === 'undo' && userRole !== 'super-admin' && (
            <div className="text-center py-12 bg-white bg-opacity-25 rounded-lg border-2 border-red-300 border-opacity-60 shadow-xl">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-lg font-medium mb-2 text-gray-900">Super Admin Access Required</h3>
              <p className="text-gray-600 mb-4">
                Undo controls are restricted to Super Admins only for safety and audit purposes.
              </p>
              <button
                onClick={() => setActiveTab('live')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 border border-indigo-500/40 shadow-md transition-all"
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
                    onDataRefresh={fetchAuctionData}
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
                            } whitespace-nowrap py-2 px-4 font-medium text-sm flex items-center rounded-lg shadow-lg min-w-fit transition-colors duration-150`}
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
                          <div className="bg-white bg-opacity-30 rounded-lg shadow-xl p-6 border-2 border-yellow-300 border-opacity-60">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">
                              Captains ({captains.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {captains.map((player) => {
                                const team = auctionData.teams?.find(t => t.id === player.team || t.captain === player.id);
                                const capAmt = player.captainAmount || team?.captainAmount || player.finalBid || 0;
                                return (
                                  <div key={player.id} className="border rounded-lg p-4 bg-purple-50">
                                    <div className="flex justify-between items-start mb-2">
                                      <h5 className="font-medium text-gray-900 flex items-center">
                                        <span className="mr-1">👑</span>
                                        {player.name}
                                      </h5>
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        Captain
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{player.role}</p>
                                    <div className="text-sm">
                                      <p className="font-medium text-purple-600 mb-2">₹{capAmt}</p>
                                      <div className="mt-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTeamStyle(player.team || team?.id, auctionData.teams)}`}>
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
                          <div className="bg-white bg-opacity-30 rounded-lg shadow-xl p-6 border-2 border-green-300 border-opacity-60">
                            <h4 className="text-lg font-bold text-gray-900 mb-6">
                              Players Sold Through Bidding ({soldPlayers.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {soldPlayers.map((player) => {
                                const team = auctionData.teams?.find(t => t.id === player.team);
                                return (
                                  <div key={player.id} className="bg-green-50 border-2 border-green-300 border-opacity-60 rounded-lg p-4 hover:shadow-lg hover:border-green-400 hover:border-opacity-80 transition-colors duration-150">
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
                          <div className="bg-white bg-opacity-25 rounded-lg shadow-xl p-6 border border-white border-opacity-20">
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
                          <div className="bg-white bg-opacity-25 rounded-lg shadow-xl p-6 border border-white border-opacity-20">
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
                          <div className="bg-white bg-opacity-25 rounded-lg shadow-xl p-6 border-2 border-cyan-300 border-opacity-60">
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
                                  <div key={team.id} className="bg-white bg-opacity-20 rounded-xl shadow-xl border-2 border-cyan-300 border-opacity-70 mb-4">
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
                          <div className="bg-white bg-opacity-25 rounded-lg shadow-xl p-12 border-2 border-cyan-300 border-opacity-60 text-center">
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
                            <div className="bg-white bg-opacity-20 rounded-xl shadow-2xl p-6 border-2 border-yellow-400 border-opacity-70 hover:bg-opacity-30 transition-colors duration-200">
                              <h4 className="text-lg font-medium text-gray-900 mb-4">
                                Captains ({captains.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {captains.map((player) => {
                                  const team = auctionData.teams?.find(t => t.id === player.team || t.captain === player.id);
                                  const capAmt = player.captainAmount || team?.captainAmount || player.finalBid || 0;
                                  return (
                                    <div key={player.id} className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                                      <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-medium text-gray-900 flex items-center">
                                          <span className="mr-1">👑</span>
                                          {player.name}
                                        </h5>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                          Captain
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-2">{player.role}</p>
                                      <div className="text-sm">
                                        <p className="font-medium text-purple-600 mb-2">₹{capAmt}</p>
                                        <div className="mt-2">
                                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTeamStyle(player.team || team?.id, auctionData.teams)}`}>
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
                              <div key={status} className="bg-white bg-opacity-20 rounded-xl shadow-2xl p-6 border-2 border-indigo-400 border-opacity-70 hover:bg-opacity-30 transition-colors duration-200">
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
                          <div className="text-center py-12 bg-white bg-opacity-20 rounded-lg border-2 border-gray-300 border-opacity-50 shadow-lg">
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
                <div className="text-center py-12 bg-white bg-opacity-25 rounded-lg border-2 border-gray-300 border-opacity-60 shadow-xl">
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
                      onClick={() => setShowUploadModal(true)}
                      className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 border border-indigo-500/40 shadow-md"
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
                    <div className="text-center py-12 text-gray-500 bg-white bg-opacity-25 rounded-lg border-2 border-gray-300 border-opacity-60 shadow-xl">
                      <div className="text-6xl mb-4">🔐</div>
                      <h3 className="text-lg font-medium mb-2 text-gray-900">Access Restricted</h3>
                      <p className="text-gray-600">Team management is only available to super-admin and admin roles.</p>
                      <p className="text-sm text-gray-500 mt-2">Use the "Team Squads" tab to view team compositions.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 bg-white bg-opacity-25 rounded-lg border-2 border-gray-300 border-opacity-60 shadow-xl">
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
                <div className="text-center py-12 text-gray-500 bg-white bg-opacity-25 rounded-lg border-2 border-gray-300 border-opacity-60 shadow-xl">
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
              settings={auctionData.settings || {}}
            />
          )}
        </div>
      </div>

      {/* Undo Confirmation Modal */}
      {showUndoConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white bg-opacity-25 rounded-xl shadow-2xl max-w-md w-full mx-auto border-2 border-red-400 border-opacity-70">
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
                      ? 'bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white hover:-translate-y-0.5 active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150'
                      : 'bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white hover:-translate-y-0.5 active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150'
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

      {/* Edit Settings Modal */}
      {showEditSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Auction Settings</h2>
              <button
                onClick={() => setShowEditSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Basic Configuration */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-6 border border-blue-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                  <span className="mr-2">⚙️</span>
                  Basic Configuration
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Number of Teams
                    </label>
                    <input
                      type="number"
                      value={settingsConfig.teamCount}
                      onChange={(e) => handleSettingsConfigChange('teamCount', parseInt(e.target.value) || '')}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          handleSettingsConfigChange('teamCount', 4);
                        } else {
                          handleSettingsConfigChange('teamCount', parseInt(e.target.value));
                        }
                      }}
                      step="any"
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Starting Budget (₹)
                    </label>
                    <input
                      type="number"
                      value={settingsConfig.startingBudget}
                      onChange={(e) => handleSettingsConfigChange('startingBudget', parseInt(e.target.value) || '')}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          handleSettingsConfigChange('startingBudget', 1000);
                        } else {
                          handleSettingsConfigChange('startingBudget', parseInt(e.target.value));
                        }
                      }}
                      step="any"
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Max Players Per Team
                    </label>
                    <input
                      type="number"
                      value={settingsConfig.maxPlayersPerTeam}
                      onChange={(e) => handleSettingsConfigChange('maxPlayersPerTeam', parseInt(e.target.value) || '')}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          handleSettingsConfigChange('maxPlayersPerTeam', 15);
                        } else {
                          handleSettingsConfigChange('maxPlayersPerTeam', parseInt(e.target.value));
                        }
                      }}
                      step="any"
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Base Price (₹)
                    </label>
                    <input
                      type="number"
                      value={settingsConfig.basePrice}
                      onChange={(e) => handleSettingsConfigChange('basePrice', parseInt(e.target.value) || '')}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          handleSettingsConfigChange('basePrice', 10);
                        } else {
                          handleSettingsConfigChange('basePrice', parseInt(e.target.value));
                        }
                      }}
                      step="any"
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bidding Increments */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 sm:p-6 border border-green-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">📊</span>
                    Bidding Increments
                  </h3>
                  <button
                    onClick={addSettingsIncrement}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium"
                  >
                    + Add Increment
                  </button>
                </div>

                <div className="space-y-3">
                  {settingsConfig.biddingIncrements.map((increment, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Price Threshold (₹)
                        </label>
                        <input
                          type="number"
                          value={increment.threshold}
                          onChange={(e) => handleSettingsIncrementChange(index, 'threshold', e.target.value)}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              handleSettingsIncrementChange(index, 'threshold', '0');
                            }
                          }}
                          step="any"
                          className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Bid Increment (₹)
                        </label>
                        <input
                          type="number"
                          value={increment.increment}
                          onChange={(e) => handleSettingsIncrementChange(index, 'increment', e.target.value)}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              handleSettingsIncrementChange(index, 'increment', '5');
                            }
                          }}
                          step="any"
                          className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      {settingsConfig.biddingIncrements.length > 1 && (
                        <button
                          onClick={() => removeSettingsIncrement(index)}
                          className="sm:mt-5 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors self-center"
                          title="Remove increment"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">Tip:</span> Increments are applied based on the current bid amount. Lower thresholds are used for lower bids.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setShowEditSettingsModal(false)}
                disabled={settingsSaveLoading}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={settingsSaveLoading}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {settingsSaveLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedDashboard;
