import React from 'react';
import PlayerAvatar from '../../components/PlayerAvatar';
import PlayerNameLink from '../../components/PlayerNameLink';
import { formatCurrency, cleanTeamName } from '../../lib/format';
import { getTeamStyle, CategoryTag } from './categories';
import RetainedTeamsTable from './RetainedTeamsTable';

// Spectator player groups: renders the grid/table for the selected filter,
// plus an empty-state message when a non-"all" filter has no matches.
const SpectatorPlayerGroups = ({
  spectatorPlayerFilter,
  teams = [],
  captains = [],
  soldPlayers = [],
  availablePlayers = [],
  unsoldPlayers = [],
  retainedPlayers = [],
}) => {
  return (
    <>
      {(() => {
        if (spectatorPlayerFilter === 'captains') {
          return (
            captains.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Captains ({captains.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {captains.map((player) => {
                    const team = teams?.find(
                      (t) => t.id === player.team || t.captain === player.id
                    );
                    const capAmt =
                      player.captainAmount || team?.captainAmount || player.finalBid || 0;
                    return (
                      <div key={player.id} className="border rounded-lg p-4 bg-purple-50">
                        <div className="flex justify-between items-start mb-2 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <PlayerAvatar player={player} size="md" />
                            <h5 className="font-medium text-gray-900 flex items-center min-w-0">
                              <span className="mr-1">👑</span>
                              <PlayerNameLink player={player} />
                            </h5>
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 shrink-0">
                            Captain
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{player.role}</p>
                        <div className="text-sm">
                          <p className="font-medium text-purple-600 mb-2">
                            {formatCurrency(capAmt)}
                          </p>
                          <div className="mt-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${getTeamStyle(player.team || team?.id, teams)}`}
                            >
                              🏏 {cleanTeamName(team?.name) || 'No Team'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          );
        }

        if (spectatorPlayerFilter === 'sold') {
          return (
            soldPlayers.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-900 mb-6">
                  Players Sold Through Bidding ({soldPlayers.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {soldPlayers.map((player) => {
                    const team = teams?.find((t) => t.id === player.team);
                    return (
                      <div
                        key={player.id}
                        className="bg-green-50 border-2 border-green-300 border-opacity-60 rounded-lg p-4 hover:shadow-lg hover:border-green-400 hover:border-opacity-80 transition-colors duration-150"
                      >
                        <div className="flex justify-between items-start mb-2 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <PlayerAvatar player={player} size="md" />
                            <h5 className="text-lg font-bold text-gray-900 min-w-0">
                              <PlayerNameLink player={player} />
                            </h5>
                          </div>
                          <CategoryTag category={player.category} className="shrink-0" />
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{player.role}</p>
                        <div className="text-sm space-y-3">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(player.finalBid)}
                          </p>
                          <div className="text-sm text-gray-700">
                            Sold to{' '}
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ml-1 ${getTeamStyle(player.team, teams)}`}
                            >
                              🏏 {cleanTeamName(team?.name)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          );
        }

        if (spectatorPlayerFilter === 'available') {
          return (
            availablePlayers.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Available for Bidding ({availablePlayers.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availablePlayers.map((player) => {
                    return (
                      <div key={player.id} className="border rounded-lg p-4 bg-yellow-50">
                        <div className="flex justify-between items-start mb-2 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <PlayerAvatar player={player} size="md" />
                            <h5 className="font-medium text-gray-900 min-w-0">
                              <PlayerNameLink player={player} />
                            </h5>
                          </div>
                          <CategoryTag category={player.category} className="shrink-0" />
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
            )
          );
        }

        if (spectatorPlayerFilter === 'unsold') {
          return (
            unsoldPlayers.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Unsold Players ({unsoldPlayers.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unsoldPlayers.map((player) => {
                    return (
                      <div key={player.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex justify-between items-start mb-2 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <PlayerAvatar player={player} size="md" />
                            <h5 className="font-medium text-gray-900 min-w-0">
                              <PlayerNameLink player={player} />
                            </h5>
                          </div>
                          <CategoryTag category={player.category} className="shrink-0" />
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
            )
          );
        }

        if (spectatorPlayerFilter === 'retained') {
          return <RetainedTeamsTable retainedPlayers={retainedPlayers} teams={teams} />;
        }

        // Default: Show all players
        return (
          <>
            {/* Captains Section */}
            {captains.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Captains ({captains.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {captains.map((player) => {
                    const team = teams?.find(
                      (t) => t.id === player.team || t.captain === player.id
                    );
                    const capAmt =
                      player.captainAmount || team?.captainAmount || player.finalBid || 0;
                    return (
                      <div
                        key={player.id}
                        className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50"
                      >
                        <div className="flex justify-between items-start mb-2 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <PlayerAvatar player={player} size="md" />
                            <h5 className="font-medium text-gray-900 flex items-center min-w-0">
                              <span className="mr-1">👑</span>
                              <PlayerNameLink player={player} />
                            </h5>
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 shrink-0">
                            Captain
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{player.role}</p>
                        <div className="text-sm">
                          <p className="font-medium text-purple-600 mb-2">
                            {formatCurrency(capAmt)}
                          </p>
                          <div className="mt-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${getTeamStyle(player.team || team?.id, teams)}`}
                            >
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
              {
                status: 'retained',
                title: 'Players Retained by Teams',
                players: retainedPlayers,
              },
              {
                status: 'sold',
                title: 'Players Sold Through Bidding',
                players: soldPlayers,
              },
              {
                status: 'available',
                title: 'Available for Bidding',
                players: availablePlayers,
              },
              { status: 'unsold', title: 'Unsold Players', players: unsoldPlayers },
            ].map(({ status, title, players }) => {
              if (players.length === 0) return null;

              return (
                <div key={status} className="mb-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    {title} ({players.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {players.map((player) => {
                      const team = teams?.find((t) => t.id === player.team);
                      return (
                        <div
                          key={player.id}
                          className="border-2 border-gray-300 rounded-lg p-4 bg-white bg-opacity-40"
                        >
                          <div className="flex justify-between items-start mb-2 gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <PlayerAvatar player={player} size="md" />
                              <h5 className="font-medium text-gray-900 min-w-0">
                                <PlayerNameLink player={player} />
                              </h5>
                            </div>
                            <CategoryTag category={player.category} className="shrink-0" />
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{player.role}</p>
                          {status === 'retained' && (
                            <div className="text-sm space-y-2">
                              <p className="font-medium text-purple-600 mb-2">
                                {formatCurrency(player.retentionAmount || player.finalBid || 0)}
                              </p>
                              <div className="mt-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold ${getTeamStyle(player.team, teams)}`}
                                >
                                  🏏 {cleanTeamName(team?.name)}
                                </span>
                              </div>
                            </div>
                          )}
                          {status === 'sold' && (
                            <div className="text-sm space-y-2">
                              <p className="font-medium text-green-600 mb-2">
                                {formatCurrency(player.finalBid)}
                              </p>
                              <div className="mt-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold ${getTeamStyle(player.team, teams)}`}
                                >
                                  🏏 {cleanTeamName(team?.name)}
                                </span>
                              </div>
                            </div>
                          )}
                          {status === 'assigned' && (
                            <div className="text-sm space-y-2">
                              <p className="font-medium text-purple-600 mb-2">Captain</p>
                              <div className="mt-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold ${getTeamStyle(player.team, teams)}`}
                                >
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
      {spectatorPlayerFilter !== 'all' &&
        (() => {
          const isEmpty =
            (spectatorPlayerFilter === 'captains' && captains.length === 0) ||
            (spectatorPlayerFilter === 'sold' && soldPlayers.length === 0) ||
            (spectatorPlayerFilter === 'available' && availablePlayers.length === 0) ||
            (spectatorPlayerFilter === 'unsold' && unsoldPlayers.length === 0) ||
            (spectatorPlayerFilter === 'retained' && retainedPlayers.length === 0);

          return (
            isEmpty && (
              <div className="text-center py-12 bg-white bg-opacity-20 rounded-lg border-2 border-gray-300 border-opacity-50 shadow-lg">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Players Found</h3>
                <p className="text-gray-600">No players match the selected filter criteria.</p>
              </div>
            )
          );
        })()}
    </>
  );
};

export default SpectatorPlayerGroups;
