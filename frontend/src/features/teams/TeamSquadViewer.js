import React, { useState } from 'react';
import PlayerNameLink from '../../components/PlayerNameLink';
import { getSportPack } from '../../sports';
import { formatCurrency, cleanTeamName } from '../../lib/format';
import { getCategoryStyle, formatCategoryLabel } from '../players/categories';

// Per-team squad view: team selector, budget bar, quick stats, captain card,
// players grouped by category, and a composition summary. Captain/Retained
// sections are gated by the enableCaptains / enableRetention feature flags.
const TeamSquadViewer = ({ teams, players, enableCaptains = true, enableRetention = true }) => {
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

  const currentTeam = teams.find((t) => t.id === selectedTeam);
  const teamPlayers =
    players?.filter(
      (p) =>
        p.team === selectedTeam &&
        (p.status === 'sold' || p.status === 'retained' || p.status === 'assigned')
    ) || [];

  // Find captain based on team.captain property
  const captain = currentTeam?.captain ? teamPlayers.find((p) => p.id === currentTeam.captain) : null;

  // Exclude captain from bought players and categorize by role
  const playersExcludingCaptain = captain
    ? teamPlayers.filter((p) => p.id !== captain.id)
    : teamPlayers;

  // Categorize players by role (excluding captain)
  const playersByCategory = {
    batter: playersExcludingCaptain.filter((p) => p.category === 'batter'),
    bowler: playersExcludingCaptain.filter((p) => p.category === 'bowler'),
    allrounder: playersExcludingCaptain.filter((p) => p.category === 'allrounder'),
    'wicket-keeper': playersExcludingCaptain.filter((p) => p.category === 'wicket-keeper'),
    other: playersExcludingCaptain.filter(
      (p) => !['batter', 'bowler', 'allrounder', 'wicket-keeper'].includes(p.category)
    ),
  };

  const boughtPlayers = playersExcludingCaptain
    .filter((p) => p.status === 'sold')
    .sort((a, b) => (b.finalBid || 0) - (a.finalBid || 0));
  const teamRetainedPlayers = playersExcludingCaptain.filter((p) => p.status === 'retained');
  const captainAmount = captain ? captain.captainAmount || currentTeam?.captainAmount || 0 : 0;
  const totalSpentOnAuction = boughtPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
  const totalSpentOnRetention = teamRetainedPlayers.reduce(
    (sum, p) => sum + (p.retentionAmount || p.finalBid || 0),
    0
  );
  const totalSpent = totalSpentOnAuction + totalSpentOnRetention + captainAmount;
  const budgetUsed = currentTeam ? (totalSpent / (currentTeam.budget + totalSpent)) * 100 : 0;

  return (
    <div className="bg-white bg-opacity-25 shadow-xl rounded-lg border border-white border-opacity-20">
      {/* Team Selector Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h3 className="text-2xl font-bold text-gray-900">Team Squads</h3>
        </div>

        {/* Team Navigation Cards */}
        <div className="mt-4 flex flex-wrap gap-2 pb-2">
          {teams.map((team) => {
            const teamPlayerCount =
              players?.filter(
                (p) =>
                  p.team === team.id &&
                  (p.status === 'sold' || p.status === 'retained' || p.status === 'assigned')
              ).length || 0;
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
                {getSportPack('cricket').teamIcon} {cleanTeamName(team.name)}
                {teamPlayerCount > 0 && (
                  <span
                    className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${
                      selectedTeam === team.id
                        ? 'bg-white bg-opacity-20 text-white'
                        : 'bg-white bg-opacity-40 text-gray-700'
                    }`}
                  >
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
                  <div className="text-xl font-semibold text-green-600">
                    {formatCurrency(currentTeam.budget)}
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Budget Used: {formatCurrency(totalSpent)}</span>
                <span>{Math.round(budgetUsed)}% used</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-colors duration-200 ${
                    budgetUsed > 90 ? 'bg-red-500' : budgetUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Quick Stats */}
            {(() => {
              const tiles = [
                ...(enableCaptains
                  ? [
                      {
                        key: 'captain',
                        value: captain ? 1 : 0,
                        label: 'Captain',
                        wrap: 'bg-purple-50',
                        text: 'text-purple-600',
                      },
                    ]
                  : []),
                ...(enableRetention
                  ? [
                      {
                        key: 'retained',
                        value: teamRetainedPlayers.length,
                        label: 'Retained',
                        wrap: 'bg-indigo-50',
                        text: 'text-indigo-600',
                      },
                    ]
                  : []),
                {
                  key: 'bought',
                  value: boughtPlayers.length,
                  label: 'Bought',
                  wrap: 'bg-blue-50',
                  text: 'text-blue-600',
                },
                {
                  key: 'spent',
                  value: formatCurrency(totalSpent),
                  label: 'Total Spent',
                  wrap: 'bg-green-50',
                  text: 'text-green-600',
                },
                {
                  key: 'avg',
                  value: formatCurrency(
                    boughtPlayers.length + teamRetainedPlayers.length > 0
                      ? Math.round(totalSpent / (boughtPlayers.length + teamRetainedPlayers.length))
                      : 0
                  ),
                  label: 'Avg Price',
                  wrap: 'bg-orange-50',
                  text: 'text-orange-600',
                },
              ];
              const cols =
                { 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5' }[tiles.length] ||
                'md:grid-cols-5';
              return (
                <div className={`grid grid-cols-2 ${cols} gap-4 mb-6`}>
                  {tiles.map((t) => (
                    <div key={t.key} className={`${t.wrap} rounded-lg p-3 text-center`}>
                      <div className={`text-2xl font-bold ${t.text}`}>{t.value}</div>
                      <div className={`text-xs ${t.text}`}>{t.label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Captain Section */}
          {enableCaptains && captain && (
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
                      <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                        C
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 flex items-center">
                          <PlayerNameLink player={captain} />
                          <span className="ml-2 text-lg">👑</span>
                        </h5>
                        <p className="text-sm text-gray-600">{captain.role}</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 bg-purple-100 text-purple-800">
                          Captain
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-purple-600">
                        {formatCurrency(captainAmount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {captain.status === 'retained' ? 'Retention Cost' : 'Assignment Cost'}
                      </div>
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
                      <div
                        key={player.id}
                        className="bg-white bg-opacity-15 border-2 border-gray-200 border-opacity-50 rounded-xl p-3 hover:shadow-2xl hover:bg-opacity-25 hover:border-gray-300 hover:border-opacity-70 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-medium text-gray-900 flex items-center">
                                <PlayerNameLink player={player} />
                              </h5>
                              <p className="text-sm text-gray-600">{player.role}</p>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${style.badge}`}
                              >
                                {formatCategoryLabel(category)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {player.status === 'retained' ? (
                              <div>
                                <div className="text-lg font-semibold text-purple-600 whitespace-nowrap">
                                  {formatCurrency(player.retentionAmount || player.finalBid)}
                                </div>
                                <div className="text-xs text-gray-500">Retention Cost</div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-lg font-semibold text-green-600 whitespace-nowrap">
                                  {formatCurrency(player.finalBid)}
                                </div>
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
                        Total:{' '}
                        {formatCurrency(
                          categoryPlayers.reduce(
                            (sum, p) =>
                              sum +
                              (p.status === 'retained'
                                ? p.retentionAmount || p.finalBid || 0
                                : p.finalBid || 0),
                            0
                          )
                        )}
                      </span>
                      <span className="text-gray-600">
                        Avg:{' '}
                        {formatCurrency(
                          Math.round(
                            categoryPlayers.reduce(
                              (sum, p) =>
                                sum +
                                (p.status === 'retained'
                                  ? p.retentionAmount || p.finalBid || 0
                                  : p.finalBid || 0),
                              0
                            ) / categoryPlayers.length
                          )
                        )}
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
                {['captain', 'batter', 'bowler', 'allrounder', 'wicket-keeper'].map((category) => {
                  const isCaptainCol = category === 'captain';
                  const categoryPlayers = isCaptainCol
                    ? captain
                      ? [captain]
                      : []
                    : playersByCategory[category] || [];
                  const categorySpent = isCaptainCol
                    ? captainAmount
                    : categoryPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
                  const style = getCategoryStyle(category);

                  return (
                    <div
                      key={category}
                      className={`${style.bg} ${style.border} border rounded-lg p-3 text-center`}
                    >
                      <div className="text-2xl mb-1">{style.icon}</div>
                      <div className="text-xl font-bold text-gray-900">{categoryPlayers.length}</div>
                      <div className="text-xs text-gray-600 mb-1">
                        {category === 'captain'
                          ? 'Captain'
                          : category === 'wicket-keeper'
                            ? 'Keepers'
                            : category === 'allrounder'
                              ? 'All-rounders'
                              : category + 's'}
                      </div>
                      <div className="text-xs font-medium text-green-600">
                        {formatCurrency(categorySpent)}
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
