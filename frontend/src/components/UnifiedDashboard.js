
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import PlayerUpload from './PlayerUpload';
import TeamManagement from './TeamManagement';
import AuctionControls from './AuctionControls';
import ResetControls from './ResetControls';
import PlayersList from './PlayersList';
import StatsDisplay from './StatsDisplay';
import SubAdminManagement from './SubAdminManagement';
import UndoControls from './UndoControls';

// Use environment variable for backend URL, fallback to localhost for dev
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper functions
const cleanTeamName = (name) => {
  return name ? name.replace(/\(\d+\)$/, '').trim() : '';
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

// Role badge styles
const roleStyles = {
  'super-admin': 'bg-red-100 text-red-800',
  'admin': 'bg-purple-100 text-purple-800',
  'sub-admin': 'bg-blue-100 text-blue-800'
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
  const teamPlayers = players?.filter(p => p.team === selectedTeam && p.status === 'sold') || [];
  
  // Categorize players by role
  const playersByCategory = {
    captain: teamPlayers.filter(p => p.category === 'captain'),
    batter: teamPlayers.filter(p => p.category === 'batter'),
    bowler: teamPlayers.filter(p => p.category === 'bowler'),
    allrounder: teamPlayers.filter(p => p.category === 'allrounder'),
    'wicket-keeper': teamPlayers.filter(p => p.category === 'wicket-keeper'),
    other: teamPlayers.filter(p => !['captain', 'batter', 'bowler', 'allrounder', 'wicket-keeper'].includes(p.category))
  };
  
  const boughtPlayers = teamPlayers.filter(p => p.category !== 'captain').sort((a, b) => (b.finalBid || 0) - (a.finalBid || 0));
  const totalSpent = boughtPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
  const budgetUsed = currentTeam ? ((totalSpent / 1000) * 100) : 0;

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Team Selector Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h3 className="text-lg font-medium text-gray-900">Team Squads</h3>
          
          {/* Team Selector */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Select Team:</label>
            <select
              value={selectedTeam || ''}
              onChange={(e) => setSelectedTeam(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {cleanTeamName(team.name)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Team Navigation Pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {teams.map(team => {
            const teamPlayerCount = players?.filter(p => p.team === team.id && p.status === 'sold').length || 0;
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTeam === team.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cleanTeamName(team.name)}
                <span className="ml-2 text-xs opacity-75">({teamPlayerCount})</span>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{playersByCategory.captain.length}</div>
                <div className="text-xs text-purple-600">Captain</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{boughtPlayers.length}</div>
                <div className="text-xs text-blue-600">Bought Players</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">₹{totalSpent}</div>
                <div className="text-xs text-green-600">Total Spent</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ₹{boughtPlayers.length > 0 ? Math.round(totalSpent / boughtPlayers.length) : 0}
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
                      <div key={player.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
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
                            ) : (
                              <div>
                                <div className="text-lg font-semibold text-green-600">₹{player.finalBid}</div>
                                <div className="text-xs text-gray-500">Purchase Price</div>
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
                        Total: ₹{categoryPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0)}
                      </span>
                      <span className="text-gray-600">
                        Avg: ₹{Math.round(categoryPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0) / categoryPlayers.length)}
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
                        {category === 'captain' ? 'Free' : `₹${categorySpent}`}
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
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // Spectator filter state for All Players tab
  const [spectatorPlayerFilter, setSpectatorPlayerFilter] = useState('all');
  
  // Download dropdown state
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

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
    setSocket(socketConnection);

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
    });

    socketConnection.on('fastTrackStarted', (data) => {
      addNotification(`Fast Track started with ${data.players?.length || 0} players`, 'info');
    });

    socketConnection.on('fastTrackEnded', () => {
      addNotification('Fast Track auction ended', 'info');
    });

    socketConnection.on('saleUndone', (data) => {
      addNotification(`Sale undone: ${data.player} returned from ${data.team}`, 'warning');
    });

    socketConnection.on('bidUndone', (data) => {
      addNotification(`Bid undone: ${data.player} (₹${data.revertedToAmount})`, 'warning');
    });

    // Cleanup on unmount
    return () => {
      socketConnection.disconnect();
    };
  }, [location.state]);

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

  const handleLogout = () => {
    setIsAdmin(false);
    setUserRole('spectator');
    localStorage.removeItem('adminToken');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/');
  };

  const fetchAuctionData = async () => {
    try {
  const response = await axios.get(`${API_BASE_URL}/api/auction/data`);
      setAuctionData(response.data);
    } catch (error) {
      console.error('Error fetching auction data:', error);
    }
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
    { id: 'upload', name: 'Upload Players', icon: '📁' },
    // { id: 'subadmins', name: 'Sub-Admins', icon: '👥' },
    { id: 'auction', name: 'Auction Controls', icon: '⚡' },
    { id: 'undo', name: 'Undo Controls', icon: '↩️' }, // UNDO TAB HERE
    { id: 'reset', name: 'Reset & Fast Track', icon: '🔄', badge: unsoldPlayers.length }
  ];

  const commonTabs = [
    { id: 'players', name: 'Players', icon: '👥', count: auctionData.players?.length || 0 },
    { id: 'teams', name: 'Teams', icon: '🏏', count: auctionData.teams?.length || 0 },
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
    <div className="min-h-screen bg-gray-50">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 space-y-2 z-50">
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

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                🏏 Cricket Auction
                {isAdmin && (
                  <span className={`text-sm px-2 py-1 rounded ml-2 ${roleStyles[userRole] || 'bg-gray-100 text-gray-800'}`}>
                    {userRole === 'super-admin' ? 'Super Admin' :
                     userRole === 'admin' ? 'Admin' :
                     userRole === 'sub-admin' ? 'Sub-Admin' :
                     'Admin'}
                  </span>
                )}
              </h1>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                auctionData.auctionStatus === 'running' 
                  ? 'bg-green-100 text-green-800 animate-pulse' 
                  : auctionData.auctionStatus === 'fast-track'
                  ? 'bg-orange-100 text-orange-800 animate-pulse'
                  : auctionData.auctionStatus === 'finished'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {auctionData.auctionStatus === 'running' && '🔴 LIVE AUCTION'}
                {auctionData.auctionStatus === 'fast-track' && '⚡ FAST TRACK'}
                {auctionData.auctionStatus === 'finished' && '✅ COMPLETED'}
                {auctionData.auctionStatus === 'stopped' && '⏸️ PAUSED'}
              </div>
              {auctionData.currentBid && (
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 animate-pulse">
                  💰 ₹{auctionData.currentBid.currentAmount}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Download dropdown - available to both admin and spectators */}
              {auctionData.fileUploaded && (
                <div className="relative download-dropdown">
                  <button
                    onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                  >
                    <span>📊 Download</span>
                    <svg className={`w-4 h-4 transform transition-transform ${showDownloadDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showDownloadDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            downloadResults('excel');
                            setShowDownloadDropdown(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <span className="mr-3">📊</span>
                          <div className="text-left">
                            <div className="font-medium">Complete Results (Excel)</div>
                            <div className="text-xs text-gray-500">All sheets with detailed data</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => {
                            downloadTeamSquads();
                            setShowDownloadDropdown(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <span className="mr-3">🏏</span>
                          <div className="text-left">
                            <div className="font-medium">Team Squads</div>
                            <div className="text-xs text-gray-500">Player name, role, price by team</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => {
                            downloadAuctionSummary();
                            setShowDownloadDropdown(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <span className="mr-3">📋</span>
                          <div className="text-left">
                            <div className="font-medium">Auction Summary</div>
                            <div className="text-xs text-gray-500">Statistics and financial overview</div>
                          </div>
                        </button>
                        
                        <hr className="my-1" />
                        
                        <button
                          onClick={() => {
                            downloadResults('csv');
                            setShowDownloadDropdown(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <span className="mr-3">�</span>
                          <div className="text-left">
                            <div className="font-medium">CSV Format</div>
                            <div className="text-xs text-gray-500">Alternative format (limited)</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {isAdmin ? (
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => navigate('/')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  ← Home
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* SINGLE Live Bidding Section - Visible to everyone */}
        {auctionData.currentBid && currentPlayer && (
          <div className="mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold flex items-center justify-center">
                🔥 LIVE BIDDING 
                {auctionData.auctionStatus === 'fast-track' && 
                  <span className="ml-2 bg-orange-600 px-2 py-1 rounded text-sm">FAST TRACK</span>
                }
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <h3 className="text-lg font-semibold mb-2">Player</h3>
                <p className="text-2xl font-bold">{currentPlayer.name}</p>
                <p className="text-sm opacity-90">{currentPlayer.role}</p>
                <p className="text-xs opacity-75">{currentPlayer.category}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Current Bid</h3>
                <p className="text-4xl font-bold">₹{auctionData.currentBid.currentAmount}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Leading Team</h3>
                <p className="text-2xl font-bold">{biddingTeam ? cleanTeamName(biddingTeam.name) : 'No bids yet'}</p>
                {biddingTeam && (
                  <p className="text-sm opacity-90">Budget: ₹{biddingTeam.budget}</p>
                )}
              </div>
            </div>

            {/* Admin bidding controls - Available to ALL admin roles including sub-admin */}
            {isAdmin && (
              <div className="mt-6 pt-4 border-t border-white border-opacity-30">
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {auctionData.teams?.map(team => {
                    const increment = 5;
                    const nextBidAmount = auctionData.currentBid.currentAmount + increment;
                    const canBid = team.budget >= nextBidAmount;
                    
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
                        className={`px-4 py-2 text-sm rounded-md font-medium ${
                          canBid 
                            ? 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white' 
                            : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                        }`}
                        title={!canBid ? `Insufficient budget (₹${team.budget})` : `Bid ₹${nextBidAmount} for ${cleanTeamName(team.name)}`}
                      >
                        {cleanTeamName(team.name)}
                        <div className="text-xs opacity-75">₹{team.budget}</div>
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex justify-center space-x-3">
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
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md font-medium"
                  >
                    Sell Player
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
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
                  >
                    Mark Unsold
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 text-center shadow">
            <div className="text-3xl font-bold text-blue-600">{auctionData.players?.length || 0}</div>
            <div className="text-sm text-gray-600">Total Players</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow">
            <div className="text-3xl font-bold text-green-600">{soldPlayers.length}</div>
            <div className="text-sm text-gray-600">Players Sold</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow">
            <div className="text-3xl font-bold text-purple-600">{captains.length}</div>
            <div className="text-sm text-gray-600">Captains</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow">
            <div className="text-3xl font-bold text-yellow-600">{availablePlayers.length}</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow">
            <div className="text-3xl font-bold text-red-600">{unsoldPlayers.length}</div>
            <div className="text-sm text-gray-600">Unsold</div>
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
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
                
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
                
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Live Status Tab - Available to everyone */}
          {activeTab === 'live' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">Live Auction Status</h3>
              
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 text-center shadow">
                  <div className="text-2xl font-bold text-green-600">{soldPlayers.length}</div>
                  <div className="text-sm text-gray-600">Sold</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow">
                  <div className="text-2xl font-bold text-red-600">{unsoldPlayers.length}</div>
                  <div className="text-sm text-gray-600">Unsold</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow">
                  <div className="text-2xl font-bold text-yellow-600">{availablePlayers.length}</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow">
                  <div className="text-2xl font-bold text-purple-600">{captains.length}</div>
                  <div className="text-sm text-gray-600">Captains</div>
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

              {/* Recent Transactions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions (Players Sold)</h4>
                <div className="space-y-3">
                  {soldPlayers.slice(-5).reverse().map((player) => {
                    const team = auctionData.teams?.find(t => t.id === player.team);
                    return (
                      <div key={player.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">{player.name}</span>
                          <span className="text-gray-500 ml-2">({player.role})</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">₹{player.finalBid}</div>
                          <div className="text-sm text-gray-500">{cleanTeamName(team?.name) || 'Unknown Team'}</div>
                        </div>
                      </div>
                    );
                  })}
                  {soldPlayers.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No players sold through bidding yet</p>
                  )}
                </div>
              </div>

              {/* Unsold Players */}
              {unsoldPlayers.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Unsold Players ({unsoldPlayers.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unsoldPlayers.map((player) => (
                      <div key={player.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">{player.name}</span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {player.category === 'wicket-keeper' ? 'keeper' : player.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{player.role}</p>
                        <div className="flex items-center text-red-600">
                          <span className="text-sm font-medium">❌ UNSOLD</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin-only tabs with role restrictions */}
          {isAdmin && activeTab === 'upload' && canConfigure && (
            <PlayerUpload 
              onUploadSuccess={(data) => {
                addNotification(`Successfully processed ${data.playerCount} players`, 'success');
                setActiveTab('players');
                fetchAuctionData();
              }}
              onDataRefresh={fetchAuctionData}
            />
          )}

          {isAdmin && activeTab === 'auction' && canConfigure && (
            <AuctionControls 
              auctionData={auctionData}
              socket={socket}
            />
          )}

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

          {/* NEW: Undo Controls Tab (super-admin only) */}
          {isAdmin && activeTab === 'undo' && userRole === 'super-admin' && (
            <UndoControls userRole={userRole} auctionData={auctionData} />
          )}

          {/* Access Denied for Sub-Admins trying to access config tabs */}
          {isAdmin && !canConfigure && ['upload', 'auction', 'reset', 'subadmins'].includes(activeTab) && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-lg font-medium mb-2 text-gray-900">Access Restricted</h3>
              <p className="text-gray-600 mb-4">
                Sub-Admins can only perform bidding operations. Configuration access requires Admin or Super Admin role.
              </p>
              <button
                onClick={() => setActiveTab('live')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
              >
                Go to Live Status
              </button>
            </div>
          )}

          {/* Access Denied for non-super-admins trying to access undo tab */}
          {isAdmin && activeTab === 'undo' && userRole !== 'super-admin' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-lg font-medium mb-2 text-gray-900">Super Admin Access Required</h3>
              <p className="text-gray-600 mb-4">
                Undo controls are restricted to Super Admins only for safety and audit purposes.
              </p>
              <button
                onClick={() => setActiveTab('live')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <h3 className="text-xl font-semibold text-gray-900">All Players</h3>
                      
                      {/* Filter Controls */}
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Filter:</label>
                        <select
                          value={spectatorPlayerFilter}
                          onChange={(e) => setSpectatorPlayerFilter(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                          <option value="all">All Players</option>
                          <option value="sold">Players Sold Through Bidding</option>
                          <option value="available">Available for Bidding</option>
                          <option value="unsold">Unsold Players</option>
                          <option value="captains">Captains</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Filtered Content */}
                    {(() => {
                      // Filter logic based on selected filter
                      if (spectatorPlayerFilter === 'captains') {
                        return captains.length > 0 && (
                          <div className="bg-white rounded-lg shadow p-6">
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
                                      <p className="font-medium text-purple-600">Auto-assigned</p>
                                      <p className="text-gray-500">{cleanTeamName(team?.name) || 'No Team'}</p>
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
                          <div className="bg-white rounded-lg shadow p-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">
                              Players Sold Through Bidding ({soldPlayers.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {soldPlayers.map((player) => {
                                const team = auctionData.teams?.find(t => t.id === player.team);
                                return (
                                  <div key={player.id} className="border rounded-lg p-4">
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
                                      <p className="font-medium text-green-600">₹{player.finalBid}</p>
                                      <p className="text-gray-500">{cleanTeamName(team?.name)}</p>
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
                          <div className="bg-white rounded-lg shadow p-6">
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
                          <div className="bg-white rounded-lg shadow p-6">
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
                      
                      // Default: Show all players
                      return (
                        <>
                          {/* Captains Section */}
                          {captains.length > 0 && (
                            <div className="bg-white rounded-lg shadow p-6">
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
                                        <p className="font-medium text-purple-600">Auto-assigned</p>
                                        <p className="text-gray-500">{cleanTeamName(team?.name) || 'No Team'}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Other Players by Status */}
                          {[
                            { status: 'sold', title: 'Players Sold Through Bidding', players: soldPlayers },
                            { status: 'available', title: 'Available for Bidding', players: availablePlayers },
                            { status: 'unsold', title: 'Unsold Players', players: unsoldPlayers }
                          ].map(({ status, title, players }) => {
                            if (players.length === 0) return null;
                            
                            return (
                              <div key={status} className="bg-white rounded-lg shadow p-6">
                                <h4 className="text-lg font-medium text-gray-900 mb-4">
                                  {title} ({players.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {players.map((player) => {
                                    const team = auctionData.teams?.find(t => t.id === player.team);
                                    return (
                                      <div key={player.id} className="border rounded-lg p-4">
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
                                        {status === 'sold' && (
                                          <div className="text-sm">
                                            <p className="font-medium text-green-600">₹{player.finalBid}</p>
                                            <p className="text-gray-500">{cleanTeamName(team?.name)}</p>
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
                          (spectatorPlayerFilter === 'unsold' && unsoldPlayers.length === 0);
                        
                        return isEmpty && (
                          <div className="text-center py-12">
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
                <div className="text-center py-12">
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
                      className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                    >
                      Upload Players
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Teams Tab - Available to everyone with Enhanced TeamSquadViewer */}
          {activeTab === 'teams' && (
            <div className="space-y-6">
              {auctionData.fileUploaded ? (
                <>
                  {/* Admin Team Management (only for admin/super-admin) */}
                  {isAdmin && canConfigure && <TeamManagement teams={auctionData.teams || []} />}
                  
                  {/* Enhanced Role-Based Team Squad Viewer */}
                  <TeamSquadViewer 
                    teams={auctionData.teams || []}
                    players={auctionData.players || []}
                  />
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🏏</div>
                  <h3 className="text-lg font-medium mb-2 text-gray-900">Teams Not Available</h3>
                  <p className="text-gray-600">Teams will be available once player data is uploaded.</p>
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
    </div>
  );
};

export default UnifiedDashboard;
