import React, { useState } from 'react';

const TeamSquadViewer = ({ teams, players }) => {
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id || null);

  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏏</div>
        <h3 className="text-xl font-bold mb-2 text-gray-900">No Teams Available</h3>
        <p className="text-gray-600">Teams will be created once players are uploaded.</p>
      </div>
    );
  }

  const currentTeam = teams.find(t => t.id === selectedTeam);
  const teamPlayers = players?.filter(p => p.team === selectedTeam && (p.status === 'sold' || p.status === 'assigned' || p.status === 'retained')) || [];
  const captain = teamPlayers.find(p => p.category === 'captain');
  const boughtPlayers = teamPlayers.filter(p => p.category !== 'captain').sort((a, b) => (b.finalBid || 0) - (a.finalBid || 0));
  
  const totalSpent = boughtPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
  const budgetUsed = currentTeam ? ((totalSpent / (1000)) * 100) : 0; // Assuming 1000 initial budget

  return (
    <div className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl shadow-2xl border-2 border-cyan-400 border-opacity-70 hover:bg-opacity-30 transition-all duration-300 overflow-hidden">
      {/* Team Selector Header */}
      <div className="border-b-2 border-cyan-300 border-opacity-50 px-4 sm:px-6 py-4 bg-cyan-50 bg-opacity-30 rounded-t-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">Team Squads</h3>
          
          {/* Team Selector */}
          <div className="flex items-center space-x-3">
            <label className="text-lg font-bold text-gray-800">Select Team:</label>
            <select
              value={selectedTeam || ''}
              onChange={(e) => setSelectedTeam(parseInt(e.target.value))}
              className="border-2 border-gray-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Team Navigation Pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {teams.map(team => {
            const teamPlayerCount = players?.filter(p => p.team === team.id && (p.status === 'sold' || p.status === 'assigned' || p.status === 'retained')).length || 0;
            return (
                <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={`px-3 py-2 rounded-full text-sm font-semibold transition-colors border-2 flex-shrink-0 ${
                  selectedTeam === team.id
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 hover:border-gray-400'
                }`}
              >
                <span className="truncate">{team.name}</span>
                <span className="ml-2 text-xs opacity-75">({teamPlayerCount})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Team Details */}
      {currentTeam && (
        <div className="p-4 sm:p-6">
          {/* Team Header */}
          <div className="mb-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
              <h2 className="text-3xl font-bold text-gray-900 tracking-wide">{currentTeam.name}</h2>
              <div className="flex items-center space-x-4 sm:space-x-6">
                <div className="text-center sm:text-right">
                  <div className="text-sm text-gray-500">Players</div>
                  <div className="text-xl font-bold text-gray-900">{teamPlayers.length}</div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-sm text-gray-500">Budget Remaining</div>
                  <div className="text-xl font-bold text-green-600">₹{currentTeam.budget}</div>
                </div>
              </div>
            </div>

            {/* Budget Bar */}
            <div className="mb-4">
              <div className="flex flex-col space-y-1 sm:flex-row sm:justify-between sm:space-y-0 text-sm text-gray-600 mb-1">
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
              <div className="bg-purple-50 rounded-lg p-3 text-center border-2 border-purple-300 border-opacity-60 shadow-lg">
                <div className="text-2xl font-bold text-purple-600">{captain ? 1 : 0}</div>
                <div className="text-xs text-purple-600 font-semibold">Captain</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center border-2 border-blue-300 border-opacity-60 shadow-lg">
                <div className="text-2xl font-bold text-blue-600">{boughtPlayers.length}</div>
                <div className="text-xs text-blue-600 font-semibold">Bought Players</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center border-2 border-green-300 border-opacity-60 shadow-lg">
                <div className="text-2xl font-bold text-green-600">₹{totalSpent}</div>
                <div className="text-xs text-green-600 font-semibold">Total Spent</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center border-2 border-orange-300 border-opacity-60 shadow-lg">
                <div className="text-2xl font-bold text-orange-600">
                  ₹{boughtPlayers.length > 0 ? Math.round(totalSpent / boughtPlayers.length) : 0}
                </div>
                <div className="text-xs text-orange-600 font-semibold">Avg Price</div>
              </div>
            </div>
          </div>

          {/* Captain Section */}
          {captain && (
            <div className="mb-6">
              <h4 className="text-2xl font-bold text-gray-900 mb-3 flex items-center tracking-wide">
                <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm mr-2">C</span>
                Team Captain
              </h4>
              <div className="bg-purple-50 border-2 border-purple-300 border-opacity-70 rounded-lg p-4 shadow-md">
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div>
                    <h5 className="text-xl font-bold text-gray-900">{captain.name}</h5>
                    <p className="text-sm text-gray-600">{captain.role}</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 mt-2">
                      Auto-assigned Captain
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-bold text-purple-600">Captain</div>
                    <div className="text-sm text-gray-500">No Cost</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Squad Players */}
          <div>
            <h4 className="text-2xl font-bold text-gray-900 mb-3 tracking-wide">
              Squad Players {boughtPlayers.length > 0 && `(${boughtPlayers.length})`}
            </h4>
            
            {boughtPlayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {boughtPlayers.map((player, index) => (
                  <div key={player.id} className="bg-gray-50 border-2 border-gray-300 border-opacity-60 rounded-lg p-4 hover:shadow-lg hover:border-gray-400 hover:border-opacity-80 transition-all duration-200">
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-lg font-bold text-gray-900">{player.name}</h5>
                          <p className="text-sm text-gray-600">{player.role}</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                            player.category === 'batter' ? 'bg-blue-100 text-blue-800' :
                            player.category === 'bowler' ? 'bg-red-100 text-red-800' :
                            player.category === 'allrounder' ? 'bg-orange-100 text-orange-800' :
                            player.category === 'wicket-keeper' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {player.category}
                          </span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <div className="text-lg font-bold text-green-600">₹{player.finalBid}</div>
                        <div className="text-sm text-gray-500">Purchase Price</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🛒</div>
                <p className="text-gray-500">No players bought yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  {captain ? 'Only captain assigned so far' : 'No players in this team'}
                </p>
              </div>
            )}
          </div>

          {/* Team Composition Analysis */}
          {boughtPlayers.length > 0 && (
            <div className="mt-6 pt-6 border-t-2 border-gray-300 border-opacity-60">
              <h4 className="text-xl font-bold text-gray-900 mb-3">Team Composition</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['batter', 'bowler', 'allrounder', 'wicket-keeper'].map(category => {
                  const categoryPlayers = boughtPlayers.filter(p => p.category === category);
                  const categorySpent = categoryPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
                  
                  return (
                    <div key={category} className="bg-white bg-opacity-15 backdrop-blur-xl border-2 border-gray-200 border-opacity-50 rounded-xl p-3 hover:bg-opacity-25 hover:border-gray-300 hover:border-opacity-70 transition-all duration-300 shadow-lg">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">{categoryPlayers.length}</div>
                        <div className="text-xs text-gray-500 capitalize mb-1">{category.replace('-', ' ')}</div>
                        <div className="text-xs text-green-600">₹{categorySpent}</div>
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

export default TeamSquadViewer;
