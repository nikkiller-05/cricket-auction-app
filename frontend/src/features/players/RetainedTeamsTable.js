import React from 'react';
import PlayerNameLink from '../../components/PlayerNameLink';
import { formatCurrency, cleanTeamName } from '../../lib/format';
import { getTeamStyle } from './categories';

// Spectator retained-players view: per-team tables + an overall summary.
const RetainedTeamsTable = ({ retainedPlayers = [], teams = [] }) => {
  if (retainedPlayers.length === 0) {
    return (
      <div className="bg-white bg-opacity-25 rounded-lg shadow-xl p-12 border-2 border-cyan-300 border-opacity-60 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h4 className="text-lg font-medium text-gray-900 mb-2">No Retained Players</h4>
        <p className="text-gray-600">No players have been retained by teams yet.</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h4 className="text-lg font-medium text-gray-900 mb-6">
        Retained Players - Team-wise Overview ({retainedPlayers.length} total)
      </h4>

      {/* Team-wise Retained Players Table */}
      <div className="space-y-6">
        {teams?.map((team) => {
          const teamRetainedPlayers = retainedPlayers.filter((player) => player.team === team.id);

          if (teamRetainedPlayers.length === 0) return null;

          const totalRetentionAmount = teamRetainedPlayers.reduce(
            (sum, player) => sum + (player.retentionAmount || player.finalBid || 0),
            0
          );

          return (
            <div
              key={team.id}
              className="bg-white bg-opacity-20 rounded-xl shadow-xl border-2 border-cyan-300 border-opacity-70 mb-4"
            >
              {/* Team Header */}
              <div className="px-6 py-4 bg-cyan-100 bg-opacity-30 border-b-2 border-cyan-300 border-opacity-60 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-bold ${getTeamStyle(team.id, teams)}`}
                    >
                      🏏 {cleanTeamName(team.name)}
                    </span>
                    <span className="text-sm text-gray-700 font-medium">
                      ({teamRetainedPlayers.length} player
                      {teamRetainedPlayers.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 font-medium">Total Retention Cost</div>
                    <div className="text-lg font-bold text-cyan-700">
                      {formatCurrency(totalRetentionAmount)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Players Table */}
              <div className="overflow-x-auto border-2 border-cyan-200 border-opacity-50 rounded-b-xl">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-cyan-100 bg-opacity-40">
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-800 border-b-2 border-r border-cyan-300 border-opacity-50">
                        Player Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-800 border-b-2 border-r border-cyan-300 border-opacity-50">
                        Role
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-800 border-b-2 border-r border-cyan-300 border-opacity-50">
                        Category
                      </th>
                      <th className="text-right py-3 px-6 text-sm font-semibold text-gray-800 border-b-2 border-cyan-300 border-opacity-50">
                        Retention Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-cyan-200 divide-opacity-40">
                    {teamRetainedPlayers.map((player, index) => (
                      <tr
                        key={player.id}
                        className={`${
                          index % 2 === 0 ? 'bg-white bg-opacity-15' : 'bg-cyan-50 bg-opacity-25'
                        } hover:bg-cyan-100 hover:bg-opacity-40 transition-colors duration-200 border-b border-cyan-200 border-opacity-30`}
                      >
                        <td className="py-4 px-6 text-sm border-r border-cyan-200 border-opacity-30">
                          <div className="flex items-center space-x-2">
                            <PlayerNameLink player={player} className="font-medium text-gray-900" />
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyan-200 bg-opacity-80 text-cyan-900 border border-cyan-400">
                              🔒 Retained
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-800 border-r border-cyan-200 border-opacity-30">
                          {player.role}
                        </td>
                        <td className="py-4 px-4 text-sm text-center border-r border-cyan-200 border-opacity-30">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              player.category === 'captain'
                                ? 'bg-purple-100 text-purple-800 border border-purple-400'
                                : player.category === 'batter'
                                  ? 'bg-gray-200 text-gray-800 border border-gray-500'
                                  : player.category === 'bowler'
                                    ? 'bg-red-100 text-red-800 border border-red-400'
                                    : player.category === 'allrounder'
                                      ? 'bg-orange-100 text-orange-800 border border-orange-400'
                                      : player.category === 'wicket-keeper'
                                        ? 'bg-green-100 text-green-800 border border-green-400'
                                        : 'bg-gray-100 text-gray-800 border border-gray-400'
                            }`}
                          >
                            {player.category === 'wicket-keeper'
                              ? 'Keeper'
                              : player.category === 'allrounder'
                                ? 'All-rounder'
                                : player.category.charAt(0).toUpperCase() + player.category.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-right">
                          <span className="font-bold text-cyan-700 text-lg">
                            {formatCurrency(player.retentionAmount || player.finalBid || 0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Summary */}
      <div className="mt-6 pt-6 border-t-2 border-cyan-300 border-opacity-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-cyan-50 bg-opacity-60 rounded-lg p-4 text-center border-2 border-cyan-300 border-opacity-70 shadow-lg">
            <div className="text-2xl font-bold text-cyan-600">{retainedPlayers.length}</div>
            <div className="text-sm text-gray-600 font-medium">Total Retained</div>
          </div>
          <div className="bg-green-50 bg-opacity-60 rounded-lg p-4 text-center border-2 border-green-300 border-opacity-70 shadow-lg">
            <div className="text-2xl font-bold text-green-600">
              {teams?.filter((team) => retainedPlayers.some((player) => player.team === team.id))
                .length || 0}
            </div>
            <div className="text-sm text-gray-600 font-medium">Teams with Retentions</div>
          </div>
          <div className="bg-purple-50 bg-opacity-60 rounded-lg p-4 text-center border-2 border-purple-300 border-opacity-70 shadow-lg">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(
                retainedPlayers.reduce(
                  (sum, player) => sum + (player.retentionAmount || player.finalBid || 0),
                  0
                )
              )}
            </div>
            <div className="text-sm text-gray-600 font-medium">Total Retention Value</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetainedTeamsTable;
