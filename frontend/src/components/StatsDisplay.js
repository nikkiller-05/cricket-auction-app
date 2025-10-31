import React from 'react';

const StatsDisplay = ({ stats, teams, players }) => {
  // Calculate additional stats
  const soldPlayers = players?.filter(p => p.status === 'sold' && p.category !== 'captain') || [];
  const captains = players?.filter(p => p.category === 'captain') || [];
  const availablePlayers = players?.filter(p => p.status === 'available' && p.category !== 'captain') || [];
  const unsoldPlayers = players?.filter(p => p.status === 'unsold') || [];
  
  const totalSpent = soldPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900">Auction Statistics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Statistics */}
        <div className="bg-indigo-50 bg-opacity-80 backdrop-blur-xl rounded-xl shadow-2xl p-6 border-2 border-indigo-400 border-opacity-70 hover:bg-opacity-90 transition-all duration-300">
          <h4 className="text-xl font-bold text-indigo-900 mb-4">Overall Statistics</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-600">Total Players:</span>
              <span className="text-lg font-bold">{players?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-600">Players Sold (Bidding):</span>
              <span className="text-lg font-bold text-green-600">{soldPlayers.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-600">Team Captains:</span>
              <span className="text-lg font-bold text-purple-600">{captains.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-600">Players Available:</span>
              <span className="text-lg font-bold text-yellow-600">{availablePlayers.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-600">Players Unsold:</span>
              <span className="text-lg font-bold text-red-600">{unsoldPlayers.length}</span>
            </div>
          </div>
        </div>

        {/* Financial Statistics */}
        <div className="bg-green-50 bg-opacity-80 backdrop-blur-xl rounded-xl shadow-2xl p-6 border-2 border-green-400 border-opacity-70 hover:bg-opacity-90 transition-all duration-300">
          <h4 className="text-xl font-bold text-green-900 mb-4">Financial Statistics</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-600">Total Spent:</span>
              <span className="text-lg font-bold text-green-600">₹{totalSpent}</span>
            </div>
            
            {/* RESTORED: Better Highest Bid UI */}
            {stats?.highestBid && stats.highestBid.player && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Highest Bid:</span>
                <span className="font-semibold text-green-600">₹{stats.highestBid.amount}</span>
              </div>
            )}
            
            {/* RESTORED: Better Lowest Bid UI */}
            {stats?.lowestBid && stats.lowestBid.player && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Lowest Bid:</span>
                <span className="font-semibold text-blue-600">₹{stats.lowestBid.amount}</span>
              </div>
            )}
            
            {/* Average Price */}
            {stats?.averageBid && stats.averageBid > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Sale Price:</span>
                <span className="font-semibold text-indigo-600">₹{Math.round(stats.averageBid)}</span>
              </div>
            )}

            {soldPlayers.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Success Rate:</span>
                <span className="font-semibold text-purple-600">
                  {Math.round((soldPlayers.length / (soldPlayers.length + unsoldPlayers.length)) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RESTORED: Detailed Highest/Lowest Bid Cards */}
      {(stats?.highestBid?.player || stats?.lowestBid?.player) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Highest Bid Card */}
          {stats?.highestBid?.player && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-2xl p-6 border-2 border-green-400 border-opacity-70">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-green-800">🤑 Highest Bid</h4>
                <span className="text-3xl font-bold text-green-600">₹{stats.highestBid.amount}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700">Player:</span>
                  <span className="font-semibold text-green-900">{stats.highestBid.player.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Role:</span>
                  <span className="text-green-800">{stats.highestBid.player.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Category:</span>
                  <span className="capitalize text-green-800">{stats.highestBid.player.category}</span>
                </div>
                {stats.highestBid.player.team && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Team:</span>
                    <span className="font-medium text-green-900">
                      {teams?.find(t => t.id === stats.highestBid.player.team)?.name || 'Unknown'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lowest Bid Card */}
          {stats?.lowestBid?.player && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg shadow-2xl p-6 border-2 border-blue-400 border-opacity-70">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-blue-800">💎 Lowest Bid</h4>
                <span className="text-3xl font-bold text-blue-600">₹{stats.lowestBid.amount}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700">Player:</span>
                  <span className="font-semibold text-blue-900">{stats.lowestBid.player.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Role:</span>
                  <span className="text-blue-800">{stats.lowestBid.player.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Category:</span>
                  <span className="capitalize text-blue-800">{stats.lowestBid.player.category}</span>
                </div>
                {stats.lowestBid.player.team && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Team:</span>
                    <span className="font-medium text-blue-900">
                      {teams?.find(t => t.id === stats.lowestBid.player.team)?.name || 'Unknown'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Team Budget Analysis */}
      <div className="bg-purple-50 bg-opacity-80 backdrop-blur-xl rounded-xl shadow-2xl p-6 border-2 border-purple-400 border-opacity-70 hover:bg-opacity-90 transition-all duration-300">
        <h4 className="text-lg font-medium text-purple-900 mb-4">Team Budget Analysis</h4>
        <div className="space-y-4">
          {teams?.map((team) => {
            const teamPlayers = players?.filter(p => p.team === team.id && (p.status === 'sold' || p.status === 'assigned')) || [];
            const boughtPlayers = teamPlayers.filter(p => p.category !== 'captain');
            const totalSpentByTeam = boughtPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
            const budgetUsed = ((totalSpentByTeam / 1000) * 100); // Assuming 1000 starting budget
            
            return (
              <div key={team.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{team.name}</span>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">Players: {teamPlayers.length}</span>
                    <span className="text-green-600">Spent: ₹{totalSpentByTeam}</span>
                    <span className="text-blue-600">Remaining: ₹{team.budget}</span>
                  </div>
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
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{Math.round(budgetUsed)}% budget used</span>
                  <span>Avg: ₹{boughtPlayers.length > 0 ? Math.round(totalSpentByTeam / boughtPlayers.length) : 0} per player</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-orange-50 bg-opacity-80 backdrop-blur-xl rounded-xl shadow-2xl p-6 border-2 border-orange-400 border-opacity-70 hover:bg-opacity-90 transition-all duration-300">
        <h4 className="text-lg font-medium text-orange-900 mb-4">Category Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['batter', 'bowler', 'allrounder', 'wicket-keeper'].map(category => {
            const categoryPlayers = players?.filter(p => p.category === category) || [];
            const soldInCategory = categoryPlayers.filter(p => p.status === 'sold');
            const totalSpentInCategory = soldInCategory.reduce((sum, p) => sum + (p.finalBid || 0), 0);
            
            return (
              <div key={category} className="text-center p-4 bg-white bg-opacity-70 rounded-lg border border-gray-300 shadow-md">
                <h5 className="font-medium text-gray-900 capitalize mb-2">{category.replace('-', ' ')}</h5>
                <div className="space-y-1 text-sm">
                  <div className="text-gray-600">Total: {categoryPlayers.length}</div>
                  <div className="text-green-600">Sold: {soldInCategory.length}</div>
                  <div className="text-red-600">Unsold: {categoryPlayers.filter(p => p.status === 'unsold').length}</div>
                  <div className="font-medium text-blue-600">₹{totalSpentInCategory}</div>
                  <div className="text-xs text-gray-500">
                    Avg: ₹{soldInCategory.length > 0 ? Math.round(totalSpentInCategory / soldInCategory.length) : 0}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Warning if no valid sales data */}
      {(!stats?.highestBid || !stats?.lowestBid) && soldPlayers.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No Sales Data Available
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                No players have been sold through bidding yet. Statistics will appear once the auction begins.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsDisplay;
