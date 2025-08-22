import React, { useState } from 'react';
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TeamManagement = ({ teams }) => {
  const [teamNames, setTeamNames] = useState(
    teams.reduce((acc, team) => {
      acc[team.id] = team.name;
      return acc;
    }, {})
  );
  const [updating, setUpdating] = useState(false);

  const handleNameChange = (teamId, newName) => {
    setTeamNames({
      ...teamNames,
      [teamId]: newName
    });
  };

  const updateTeams = async () => {
    setUpdating(true);
    try {
      const updatedTeams = Object.keys(teamNames).map(id => ({
        id: parseInt(id),
        name: teamNames[id]
      }));

  await axios.post(`${API_BASE_URL}/api/teams/update`, { teams: updatedTeams });
      alert('Teams updated successfully!');
    } catch (error) {
      alert('Error updating teams');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Team Management</h3>
      
      <div className="space-y-4">
        {teams.map(team => (
          <div key={team.id} className="flex items-center space-x-4">
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
        ))}
      </div>

      <button
        onClick={updateTeams}
        disabled={updating}
        className="mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
      >
        {updating ? 'Updating...' : 'Update Teams'}
      </button>
    </div>
  );
};

export default TeamManagement;
