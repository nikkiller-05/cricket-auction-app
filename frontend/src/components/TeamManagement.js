import React, { useState, useEffect } from 'react';
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TeamManagement = ({ teams, auctionData, onTeamsUpdate, onPlayersUpdate }) => {
  const [teamNames, setTeamNames] = useState(
    teams.reduce((acc, team) => {
      acc[team.id] = team.name;
      return acc;
    }, {})
  );
  const [updating, setUpdating] = useState(false);
  const [assigningCaptain, setAssigningCaptain] = useState(false);
  const [assigningRetention, setAssigningRetention] = useState(false);
  const [retentionAmounts, setRetentionAmounts] = useState({});
  const [notification, setNotification] = useState(null);

  // Get available captains and assigned captains
  const allCaptains = auctionData?.players?.filter(p => p.category === 'captain') || [];
  const availableCaptains = allCaptains.filter(p => !p.team || p.status === 'available');
  const assignedCaptains = allCaptains.filter(p => p.team && p.status === 'assigned');

  // Local retention controls (independent of auction settings)
  // Initialize retention state from existing retained players
  const existingRetainedPlayers = auctionData?.players?.filter(p => p.status === 'retained') || [];
  const [retentionEnabled, setRetentionEnabled] = useState(existingRetainedPlayers.length > 0);
  const [retentionsPerTeam, setRetentionsPerTeam] = useState(() => {
    // Try to get saved configuration from localStorage or use existing retention data
    const saved = localStorage.getItem('retentionConfig');
    if (saved) {
      const config = JSON.parse(saved);
      return config.retentionsPerTeam || 2;
    }
    // If there are existing retained players, calculate retentions per team from data
    if (existingRetainedPlayers.length > 0 && auctionData?.teams?.length > 0) {
      const maxRetentionsFound = Math.max(
        ...auctionData.teams.map(team => 
          existingRetainedPlayers.filter(p => p.team === team.id).length
        )
      );
      return maxRetentionsFound > 0 ? maxRetentionsFound : 2;
    }
    return 2;
  });
  const [retentionConfigSaved, setRetentionConfigSaved] = useState(() => {
    const saved = localStorage.getItem('retentionConfig');
    return saved ? JSON.parse(saved).saved : false;
  });
  const [selectedPlayers, setSelectedPlayers] = useState({}); // {teamId: playerId}
  const [retentionAmountInputs, setRetentionAmountInputs] = useState({}); // {teamId: amount}

  // Effect to maintain retention state based on existing data
  useEffect(() => {
    const currentRetainedPlayers = auctionData?.players?.filter(p => p.status === 'retained') || [];
    if (currentRetainedPlayers.length > 0 && !retentionEnabled) {
      setRetentionEnabled(true);
    }
  }, [auctionData?.players, retentionEnabled]);

  // Get retention-related data
  const allPlayers = auctionData?.players || [];
  const nonCaptainPlayers = allPlayers.filter(p => p.category !== 'captain');
  const availableForRetention = nonCaptainPlayers.filter(p => 
    p.status === 'available' && 
    (!p.team || p.team === null) && 
    p.status !== 'retained' &&
    p.status !== 'sold'
  );
  const retainedPlayers = nonCaptainPlayers.filter(p => p.status === 'retained');

  const handleNameChange = (teamId, newName) => {
    setTeamNames({
      ...teamNames,
      [teamId]: newName
    });
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const updateTeams = async () => {
    setUpdating(true);
    try {
      const updatedTeams = Object.keys(teamNames).map(id => ({
        id: parseInt(id),
        name: teamNames[id]
      }));

      const response = await axios.post(`${API_BASE_URL}/api/teams/update`, { teams: updatedTeams });
      if (onTeamsUpdate) {
        onTeamsUpdate(response.data.teams);
      }
      showNotification('Teams updated successfully!');
    } catch (error) {
      showNotification('Error updating teams', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const assignCaptain = async (teamId, captainId) => {
    setAssigningCaptain(true);
    try {
      // Check if there are any unsaved team name changes
      const hasUnsavedChanges = Object.keys(teamNames).some(id => {
        const currentTeam = teams.find(t => t.id === parseInt(id));
        return currentTeam && currentTeam.name !== teamNames[id];
      });
      
      // Save team name changes first if there are any
      if (hasUnsavedChanges) {
        await updateTeams();
      }
      
      const response = await axios.post(`${API_BASE_URL}/api/teams/assign-captain`, { 
        teamId: parseInt(teamId), 
        captainId: captainId // Keep as string (UUID)
      });
      
      // Update parent component state instead of refreshing page
      if (onTeamsUpdate) {
        onTeamsUpdate(response.data.teams);
      }
      if (onPlayersUpdate) {
        onPlayersUpdate(response.data.players);
      }
      
      showNotification('Captain assigned successfully!');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error assigning captain', 'error');
    } finally {
      setAssigningCaptain(false);
    }
  };

  const unassignCaptain = async (teamId) => {
    setAssigningCaptain(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/teams/unassign-captain`, { 
        teamId: parseInt(teamId) 
      });
      
      // Update parent component state instead of refreshing page
      if (onTeamsUpdate) {
        onTeamsUpdate(response.data.teams);
      }
      if (onPlayersUpdate) {
        onPlayersUpdate(response.data.players);
      }
      
      showNotification('Captain unassigned successfully!');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error unassigning captain', 'error');
    } finally {
      setAssigningCaptain(false);
    }
  };

  const getTeamCaptain = (teamId) => {
    return assignedCaptains.find(captain => captain.team === teamId);
  };

  // Retention-related functions
  const getTeamRetainedPlayers = (teamId) => {
    return retainedPlayers.filter(player => player.team === teamId);
  };

  const canRetainMorePlayers = (teamId) => {
    const currentRetentions = getTeamRetainedPlayers(teamId).length;
    return currentRetentions < retentionsPerTeam;
  };

  // Retention configuration management
  const saveRetentionConfig = () => {
    const config = {
      retentionEnabled,
      retentionsPerTeam,
      saved: true,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('retentionConfig', JSON.stringify(config));
    setRetentionConfigSaved(true);
    showNotification(`Retention configuration saved: ${retentionsPerTeam} retentions per team`, 'success');
  };

  const editRetentionConfig = () => {
    setRetentionConfigSaved(false);
    showNotification('Retention configuration unlocked for editing', 'info');
  };

  const resetRetentionConfig = () => {
    if (retainedPlayers.length > 0) {
      const confirm = window.confirm(`You have ${retainedPlayers.length} retained players. Resetting configuration may affect existing retentions. Continue?`);
      if (!confirm) return;
    }
    localStorage.removeItem('retentionConfig');
    setRetentionEnabled(false);
    setRetentionsPerTeam(2);
    setRetentionConfigSaved(false);
    showNotification('Retention configuration reset', 'warning');
  };

  const handlePlayerSelection = (teamId, playerId) => {
    setSelectedPlayers(prev => ({
      ...prev,
      [teamId]: playerId
    }));
  };

  const handleRetentionAmountInput = (teamId, amount) => {
    setRetentionAmountInputs(prev => ({
      ...prev,
      [teamId]: amount
    }));
  };

  const assignRetentionFromDropdown = async (teamId) => {
    const playerId = selectedPlayers[teamId];
    const amount = retentionAmountInputs[teamId] || 0;
    
    if (!playerId) {
      showNotification('Please select a player first', 'error');
      return;
    }
    
    // Validate amount
    const numericAmount = parseInt(amount) || 0;
    if (numericAmount < 0) {
      showNotification('Retention amount must be ≥ ₹0', 'error');
      return;
    }
    
    console.log('🎯 Assigning retention:', {
      teamId,
      playerId,
      amount: numericAmount,
      originalAmount: amount
    });
    
    // Pass the amount directly to avoid state timing issues
    await assignRetention(teamId, playerId, numericAmount);
    
    // Clear selections for this team
    setSelectedPlayers(prev => ({
      ...prev,
      [teamId]: ''
    }));
    setRetentionAmountInputs(prev => ({
      ...prev,
      [teamId]: ''
    }));
  };

  const assignRetention = async (teamId, playerId, customAmount = null) => {
    const amount = customAmount !== null ? customAmount : (retentionAmounts[playerId] || 0);
    if (amount < 0) {
      showNotification('Retention amount must be ≥ ₹0', 'error');
      return;
    }

    setAssigningRetention(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/teams/assign-retention`, {
        teamId: parseInt(teamId),
        playerId: playerId,
        retentionAmount: parseInt(amount) || 0,
        retentionsPerTeam: retentionsPerTeam
      });

      // Update local players data to reflect the retention assignment
      if (onPlayersUpdate) {
        const updatedPlayers = auctionData.players.map(player => {
          if (player.id === playerId) {
            return {
              ...player,
              status: 'retained',
              team: parseInt(teamId),
              retentionAmount: parseInt(amount) || 0
            };
          }
          return player;
        });
        onPlayersUpdate(updatedPlayers);
      }

      if (onTeamsUpdate) {
        onTeamsUpdate(response.data.teams);
      }
      if (onPlayersUpdate) {
        onPlayersUpdate(response.data.players);
      }

      // Clear the retention amount for this player
      setRetentionAmounts(prev => {
        const newAmounts = { ...prev };
        delete newAmounts[playerId];
        return newAmounts;
      });

      showNotification(`Player retained for ₹${amount}!`);
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error assigning retention', 'error');
    } finally {
      setAssigningRetention(false);
    }
  };

  const unassignRetention = async (playerId) => {
    setAssigningRetention(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/teams/unassign-retention`, {
        playerId: playerId
      });

      // Update local players data to reflect the retention removal
      if (onPlayersUpdate) {
        const updatedPlayers = auctionData.players.map(player => {
          if (player.id === playerId) {
            return {
              ...player,
              status: 'available',
              team: null,
              retentionAmount: 0
            };
          }
          return player;
        });
        onPlayersUpdate(updatedPlayers);
      }

      if (onTeamsUpdate) {
        onTeamsUpdate(response.data.teams);
      }
      if (onPlayersUpdate) {
        onPlayersUpdate(response.data.players);
      }

      showNotification('Player retention removed!');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error removing retention', 'error');
    } finally {
      setAssigningRetention(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl shadow-2xl p-4 sm:p-6 border-2 border-cyan-400 border-opacity-70 hover:bg-opacity-30 transition-all duration-300 overflow-hidden">
      <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Team Management</h3>
      
      {notification && (
        <div className={`mb-4 p-4 rounded-md border-2 shadow-md ${
          notification.type === 'error' 
            ? 'bg-red-50 text-red-700 border-red-300' 
            : 'bg-green-50 text-green-700 border-green-300'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Retention Controls */}
      <div className="mb-6 bg-purple-50 border-2 border-purple-300 border-opacity-70 rounded-lg p-4 shadow-lg">
        <h4 className="text-xl font-semibold text-purple-900 mb-3 tracking-wide">🔐 Player Retention Controls</h4>
        
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-6">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enableRetentionToggle"
              checked={retentionEnabled}
              onChange={(e) => {
                if (!e.target.checked && retainedPlayers.length > 0) {
                  const confirm = window.confirm(`You have ${retainedPlayers.length} retained players. Disabling retention will hide the retention management section. Continue?`);
                  if (!confirm) return;
                }
                setRetentionEnabled(e.target.checked);
              }}
              className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
            />
            <label htmlFor="enableRetentionToggle" className="text-base font-semibold text-purple-900">
              Enable Player Retention
            </label>
          </div>

          {retentionEnabled && (
            <div className="flex items-center space-x-2">
              <label htmlFor="retentionCount" className="text-sm text-purple-700 whitespace-nowrap">
                Retentions per team:
              </label>
              <select
                id="retentionCount"
                value={retentionsPerTeam}
                onChange={(e) => setRetentionsPerTeam(parseInt(e.target.value))}
                disabled={retentionConfigSaved}
                className={`border-2 border-purple-400 rounded-md px-2 py-1 text-sm focus:ring-purple-500 focus:border-purple-500 shadow-sm ${
                  retentionConfigSaved 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                    : 'bg-white'
                }`}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
              
              {!retentionConfigSaved ? (
                <button
                  onClick={saveRetentionConfig}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                >
                  Save Config
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600 font-semibold">✓ Saved</span>
                  <button
                    onClick={editRetentionConfig}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={resetRetentionConfig}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {retentionEnabled && (
          <div className="mt-3 text-sm text-purple-700">
            <div className="flex flex-wrap items-center gap-4">
              <p>✓ Each team can retain up to {retentionsPerTeam} player(s)</p>
              <p>✓ Total retention slots: {teams.length * retentionsPerTeam}</p>
              <p>✓ Currently retained: {retainedPlayers.length} player(s)</p>
              {retentionConfigSaved && (
                <p className="text-green-600 font-semibold">🔒 Configuration locked</p>
              )}
            </div>
            {retentionConfigSaved && (
              <p className="mt-1 text-xs text-gray-600">
                Configuration is saved and locked. Use "Edit" button to modify settings.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {teams.map(team => {
          const teamCaptain = getTeamCaptain(team.id);
          
          return (
            <div key={team.id} className="border-2 border-gray-300 border-opacity-70 rounded-lg p-4 bg-white bg-opacity-30 shadow-md">
              {/* Team Name Section */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 mb-4">
                <label className="text-lg font-bold text-gray-800 sm:w-20 whitespace-nowrap">
                  Team {team.id}:
                </label>
                <input
                  type="text"
                  value={teamNames[team.id] || ''}
                  onChange={(e) => handleNameChange(team.id, e.target.value)}
                  className="flex-1 min-w-0 border-2 border-gray-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                  placeholder="Enter team name"
                />
                <div className="text-sm text-gray-600 whitespace-nowrap">
                  Budget: ₹{team.budget}
                </div>
              </div>

              {/* Captain Assignment Section */}
              <div className="bg-gray-50 border-2 border-gray-300 border-opacity-60 rounded-md p-3 shadow-sm">
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-2">
                  <h4 className="text-lg font-bold text-gray-800">Captain Assignment</h4>
                  {teamCaptain && (
                    <button
                      onClick={() => unassignCaptain(team.id)}
                      disabled={assigningCaptain}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded self-start sm:self-auto"
                    >
                      Unassign
                    </button>
                  )}
                </div>
                
                {teamCaptain ? (
                  <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-600 font-bold text-lg">👑</span>
                      <span className="text-lg font-bold text-gray-900">{teamCaptain.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-6 sm:ml-0">({teamCaptain.team_name || 'Assigned'})</span>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          assignCaptain(team.id, e.target.value);
                          e.target.value = ''; // Reset selection
                        }
                      }}
                      disabled={assigningCaptain || availableCaptains.length === 0}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto min-w-0"
                    >
                      <option value="">
                        {availableCaptains.length === 0 ? 'No captains available' : 'Select a captain...'}
                      </option>
                      {availableCaptains.map(captain => (
                        <option key={captain.id} value={captain.id}>
                          {captain.name} {captain.team_name ? `(${captain.team_name})` : ''}
                        </option>
                      ))}
                    </select>
                    {availableCaptains.length === 0 && (
                      <span className="text-xs text-gray-500">All captains are assigned</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center">
        <button
          onClick={updateTeams}
          disabled={updating}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium border-2 border-indigo-500 border-opacity-60 shadow-md"
        >
          {updating ? 'Updating...' : 'Update Team Names'}
        </button>
        
        <div className="text-sm text-gray-600">
          Available Captains: {availableCaptains.length} | Assigned Captains: {assignedCaptains.length}
        </div>
      </div>

      {/* Captain Status Summary */}
      <div className="mt-6 bg-blue-50 border-2 border-blue-300 border-opacity-70 rounded-lg p-4 shadow-lg">
        <h4 className="text-lg font-bold text-blue-900 mb-2">Captain Assignment Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-bold text-blue-800">Available Captains:</span>
            <ul className="list-disc list-inside text-blue-600 ml-4">
              {availableCaptains.map(captain => (
                <li key={captain.id}>{captain.name}</li>
              ))}
              {availableCaptains.length === 0 && <li className="text-gray-500">None</li>}
            </ul>
          </div>
          <div>
            <span className="font-bold text-blue-800">Assigned Captains:</span>
            <ul className="list-disc list-inside text-blue-600 ml-4">
              {teams.map(team => {
                const captain = getTeamCaptain(team.id);
                return captain ? (
                  <li key={team.id}>{captain.name} → {team.name || `Team ${team.id}`}</li>
                ) : null;
              })}
              {assignedCaptains.length === 0 && <li className="text-gray-500">None</li>}
            </ul>
          </div>
        </div>
      </div>



      {/* Player Retention Section */}
      {retentionEnabled && (
        <div className="mt-8 bg-purple-50 rounded-lg p-6 border border-purple-200">
          <h3 className="text-2xl font-bold text-purple-900 mb-4 flex items-center tracking-wide">
            🔄 Player Retention Management
            <span className="ml-2 text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
              {retentionsPerTeam} per team
            </span>
          </h3>

          <div className="space-y-6">
            {teams.map(team => {
              const teamRetainedPlayers = getTeamRetainedPlayers(team.id);
              const canRetainMore = canRetainMorePlayers(team.id);
              
              return (
                <div key={team.id} className="bg-white bg-opacity-15 backdrop-blur-xl rounded-xl border-2 border-purple-200 border-opacity-50 p-4 hover:bg-opacity-25 hover:border-purple-300 hover:border-opacity-70 transition-all duration-300 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-bold text-gray-900">
                      {team.name || `Team ${team.id}`}
                    </h4>
                    <div className="text-sm text-gray-600">
                      Retained: {teamRetainedPlayers.length} / {retentionsPerTeam}
                    </div>
                  </div>

                  {/* Current Retained Players */}
                  {teamRetainedPlayers.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-lg font-bold text-gray-800 mb-2">Currently Retained:</h5>
                      <div className="space-y-2">
                        {teamRetainedPlayers.map(player => (
                          <div key={player.id} className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 bg-purple-50 rounded px-3 py-2">
                            <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                              <span className="text-lg font-bold text-gray-900">{player.name}</span>
                              <span className="text-sm text-gray-600">({player.role})</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
                                player.category === 'batter' ? 'bg-blue-100 text-blue-800' :
                                player.category === 'bowler' ? 'bg-red-100 text-red-800' :
                                player.category === 'allrounder' ? 'bg-orange-100 text-orange-800' :
                                player.category === 'wicket-keeper' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {player.category === 'wicket-keeper' ? 'keeper' : player.category}
                              </span>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end space-x-2">
                              <span className="text-sm font-medium text-purple-600">
                                ₹{player.retentionAmount || 0}
                              </span>
                              <button
                                onClick={() => unassignRetention(player.id)}
                                disabled={assigningRetention}
                                className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-2 py-1 rounded disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add New Retention */}
                  {canRetainMore && availableForRetention.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h5 className="text-lg font-bold text-gray-800 mb-3">🆕 Add New Retention:</h5>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
                        {/* Player Selection Dropdown */}
                        <div className="sm:col-span-2 lg:col-span-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Select Player
                          </label>
                          <select
                            value={selectedPlayers[team.id] || ''}
                            onChange={(e) => handlePlayerSelection(team.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="">Choose a player...</option>
                            {availableForRetention.map(player => (
                              <option key={player.id} value={player.id}>
                                {player.name} ({player.category}) - {player.role}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Retention Amount Input */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Retention Amount (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            placeholder="Enter amount"
                            value={retentionAmountInputs[team.id] || ''}
                            onChange={(e) => handleRetentionAmountInput(team.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>

                        {/* Add Button */}
                        <div>
                          <button
                            onClick={() => assignRetentionFromDropdown(team.id)}
                            disabled={assigningRetention || !selectedPlayers[team.id]}
                            className="w-full bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium transition-colors border-2 border-purple-500 border-opacity-60 shadow-md"
                          >
                            {assigningRetention ? 'Adding...' : 'Add Retention'}
                          </button>
                        </div>
                      </div>

                      {selectedPlayers[team.id] && (
                        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
                          <div className="text-sm">
                            <span className="font-medium text-purple-900">Selected: </span>
                            <span className="text-purple-700">
                              {availableForRetention.find(p => p.id === selectedPlayers[team.id])?.name}
                            </span>
                            <span className="text-purple-600 ml-2">
                              ({availableForRetention.find(p => p.id === selectedPlayers[team.id])?.category})
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-2 text-xs text-gray-600">
                        📊 {availableForRetention.length} players available for retention
                      </div>
                    </div>
                  )}

                  {!canRetainMore && (
                    <div className="text-sm text-gray-600 italic">
                      Maximum retentions reached for this team
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Retention Summary */}
          <div className="mt-6 bg-purple-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-900 mb-2">Retention Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-purple-700">Total Retained:</span>
                <p className="text-purple-600">{retainedPlayers.length} players</p>
              </div>
              <div>
                <span className="font-medium text-purple-700">Available for Retention:</span>
                <p className="text-purple-600">{availableForRetention.length} players</p>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <span className="font-medium text-purple-700">Total Retention Budget:</span>
                <p className="text-purple-600">
                  ₹{retainedPlayers.reduce((sum, player) => sum + (player.retentionAmount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show message when retention is not enabled */}
      {!retentionEnabled && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            🔄 Player Retention 
            <span className="ml-2 text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full">
              Disabled
            </span>
          </h3>
          <p className="text-gray-600">
            Player retention is currently disabled. Use the retention controls above to:
          </p>
          <ol className="list-decimal list-inside text-gray-600 mt-2 space-y-1 text-sm">
            <li>Check "Enable Player Retention" checkbox</li>
            <li>Select the number of players each team can retain</li>
            <li>Start assigning retained players to teams</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
