import React, { useState } from 'react';

const ViewerDashboard = ({ auctionData, socket }) => {
  const [selectedTab, setSelectedTab] = useState('auction');

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

  const downloadResults = async () => {
    try {
      const response = await fetch('/api/download-results');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'auction-results.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading results:', error);
      alert('Error downloading results');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Cricket Auction Live</h1>
              <div className={`ml-4 px-3 py-1 rounded-full text-base font-semibold ${
                auctionData.auctionStatus === 'running' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {auctionData.auctionStatus === 'running' ? '🔴 LIVE' : 'STOPPED'}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={downloadResults}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Download Results
              </button>
              <a
                href="/admin/login"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Admin Login
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Bidding */}
        {auctionData.currentBid && (
          <div className="mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 border-2 border-orange-300 border-opacity-60 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">🔥 LIVE BIDDING</h2>
            {(() => {
              const player = auctionData.players.find(p => p.id === auctionData.currentBid.playerId);
              const biddingTeam = auctionData.teams.find(t => t.id === parseInt(auctionData.currentBid.biddingTeam));
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Player</h3>
                    <p className="text-2xl font-bold text-blue-900">{player?.name}</p>
                    <p className="text-gray-700 font-medium">{player?.role}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Current Bid</h3>
                    <p className="text-3xl font-bold text-green-800">₹{auctionData.currentBid.currentAmount}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Leading Team</h3>
                    <p className="text-2xl font-bold text-purple-800">{biddingTeam?.name || 'No bids yet'}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'auction', name: 'Live Auction', icon: '⚡' },
              { id: 'teams', name: 'Teams', icon: '🏏' },
              { id: 'stats', name: 'Statistics', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`${
                  selectedTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {selectedTab === 'auction' && (
          <div className="space-y-8">
            {/* Available Players */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Players</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {auctionData.players
                  .filter(p => p.status === 'available' && p.category !== 'captain')
                  .map(player => (
                    <div key={player.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{player.name}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(player.category)}`}>
                          {player.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{player.role}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Unsold Players */}
            {auctionData.players.filter(p => p.status === 'unsold').length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Unsold Players</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {auctionData.players
                    .filter(p => p.status === 'unsold')
                    .map(player => (
                      <div key={player.id} className="border border-gray-200 rounded-lg p-4 opacity-60">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{player.name}</h5>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(player.category)}`}>
                            {player.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{player.role}</p>
                        <p className="text-sm text-red-600 font-medium mt-1">UNSOLD</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'teams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {auctionData.teams.map(team => {
              const teamPlayers = auctionData.players.filter(p => p.team === team.id);
              const captain = teamPlayers.find(p => p.category === 'captain');
              
              return (
                <div key={team.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Remaining Budget</p>
                      <p className="text-lg font-bold text-green-600">₹{team.budget}</p>
                    </div>
                  </div>

                  {captain && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-1">Captain</h4>
                      <p className="text-purple-700">{captain.name}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {['batter', 'bowler', 'allrounder', 'wicket-keeper'].map(category => {
                      const categoryPlayers = teamPlayers.filter(p => p.category === category && p.status === 'sold');
                      if (categoryPlayers.length === 0) return null;

                      return (
                        <div key={category}>
                          <h4 className="font-medium text-gray-700 mb-2 capitalize">{category}s</h4>
                          <div className="space-y-1">
                            {categoryPlayers.map(player => (
                              <div key={player.id} className="flex justify-between items-center text-sm">
                                <span>{player.name}</span>
                                <span className="font-medium text-gray-600">₹{player.finalBid}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span>Players: {teamPlayers.filter(p => p.status === 'sold').length}</span>
                      <span>Spent: ₹{(auctionData.settings.startingBudget || 1000) - team.budget}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedTab === 'stats' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Sold</h3>
                <p className="text-2xl font-bold text-gray-900">{auctionData.stats.totalSold || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Unsold</h3>
                <p className="text-2xl font-bold text-gray-900">{auctionData.stats.totalUnsold || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Average Bid</h3>
                <p className="text-2xl font-bold text-gray-900">₹{Math.round(auctionData.stats.averageBid || 0)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Available</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {auctionData.players.filter(p => p.status === 'available' && p.category !== 'captain').length}
                </p>
              </div>
            </div>

            {/* Highest and Lowest Bids */}
            {auctionData.stats.highestBid && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Highest Bid</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{auctionData.stats.highestBid.player?.name}</p>
                      <p className="text-sm text-gray-600">{auctionData.stats.highestBid.player?.role}</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">₹{auctionData.stats.highestBid.amount}</p>
                  </div>
                </div>
                
                {auctionData.stats.lowestBid && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Lowest Bid</h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{auctionData.stats.lowestBid.player?.name}</p>
                        <p className="text-sm text-gray-600">{auctionData.stats.lowestBid.player?.role}</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">₹{auctionData.stats.lowestBid.amount}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewerDashboard;
