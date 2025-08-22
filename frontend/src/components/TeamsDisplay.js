import React from 'react';

const TeamsDisplay = ({ teams, players }) => {
  const getCategoryColor = (category) => {
    const colors = {
      batter: 'bg-blue-100 text-blue-800',
      bowler: 'bg-red-100 text-red-800',
      'wicket-keeper': 'bg-green-100 text-green-800',
      allrounder: 'bg-orange-100 text-orange-800',
      captain: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Team Squads</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map(team => {
          const teamPlayers = players.filter(p => p.team === team.id);
          const captain = teamPlayers.find(p => p.category === 'captain');
          const soldPlayers = teamPlayers.filter(p => p.status === 'sold');
          const totalSpent = soldPlayers.reduce((sum, player) => sum + player.finalBid, 0);
          
          return (
            <div key={team.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold text-gray-900">{team.name}</h4>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Budget Left</div>
                  <div className="text-lg font-bold text-green-600">₹{team.budget}</div>
                </div>
              </div>

              {captain && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Captain</span>
                      <div className="font-medium text-purple-800">{captain.name}</div>
                      <div className="text-sm text-purple-600">{captain.role}</div>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-200 text-purple-800">
                      Auto-assigned
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {['batter', 'bowler', 'allrounder', 'wicket-keeper', 'other'].map(category => {
                  const categoryPlayers = soldPlayers.filter(p => p.category === category);
                  if (categoryPlayers.length === 0) return null;

                  return (
                    <div key={category}>
                      <h5 className="font-medium text-gray-700 mb-2 capitalize">
                        {category === 'wicket-keeper' ? 'Wicket Keepers' : `${category}s`}
                      </h5>
                      <div className="space-y-1">
                        {categoryPlayers.map(player => (
                          <div key={player.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{player.name}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(player.category)}`}>
                                {player.category}
                              </span>
                            </div>
                            <span className="font-medium text-green-600">₹{player.finalBid}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span>Total Players: {soldPlayers.length}</span>
                  <span>Total Spent: ₹{totalSpent}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamsDisplay;
