import React, { useState } from 'react';
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
  const [notification, setNotification] = useState(null);

  // Get available captains and assigned captains
  const allCaptains = auctionData?.players?.filter(p => p.category === 'captain') || [];
  const availableCaptains = allCaptains.filter(p => !p.team || p.status === 'available');
  const assignedCaptains = allCaptains.filter(p => p.team && p.status === 'sold');

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

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Team Management</h3>
      
      {notification && (
        <div className={`mb-4 p-4 rounded-md ${
          notification.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="space-y-6">
        {teams.map(team => {
          const teamCaptain = getTeamCaptain(team.id);
          
          return (
            <div key={team.id} className="border border-gray-200 rounded-lg p-4">
              {/* Team Name Section */}
              <div className="flex items-center space-x-4 mb-4">
                <label className="w-20 text-sm font-medium text-gray-700">
                  Team {team.id}:
                </label>
                <input
                  type="text"
                  value={teamNames[team.id] || ''}
                  onChange={(e) => handleNameChange(team.id, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter team name"
                />
                <div className="text-sm text-gray-600">
                  Budget: ₹{team.budget}
                </div>
              </div>

              {/* Captain Assignment Section */}
              <div className="bg-gray-50 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Captain Assignment</h4>
                  {teamCaptain && (
                    <button
                      onClick={() => unassignCaptain(team.id)}
                      disabled={assigningCaptain}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
                    >
                      Unassign
                    </button>
                  )}
                </div>
                
                {teamCaptain ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-600 font-medium">👑</span>
                    <span className="text-sm text-gray-900">{teamCaptain.name}</span>
                    <span className="text-xs text-gray-500">({teamCaptain.team_name || 'Assigned'})</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          assignCaptain(team.id, e.target.value);
                          e.target.value = ''; // Reset selection
                        }
                      }}
                      disabled={assigningCaptain || availableCaptains.length === 0}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      <div className="mt-6 flex space-x-4">
        <button
          onClick={updateTeams}
          disabled={updating}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          {updating ? 'Updating...' : 'Update Team Names'}
        </button>
        
        <div className="text-sm text-gray-600 self-center">
          Available Captains: {availableCaptains.length} | Assigned Captains: {assignedCaptains.length}
        </div>
      </div>

      {/* Captain Status Summary */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Captain Assignment Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-700">Available Captains:</span>
            <ul className="list-disc list-inside text-blue-600 ml-4">
              {availableCaptains.map(captain => (
                <li key={captain.id}>{captain.name}</li>
              ))}
              {availableCaptains.length === 0 && <li className="text-gray-500">None</li>}
            </ul>
          </div>
          <div>
            <span className="font-medium text-blue-700">Assigned Captains:</span>
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
    </div>
  );
};

export default TeamManagement;
