import React from 'react';
import PlayerNameLink from '../../components/PlayerNameLink';
import { formatCurrency, cleanTeamName } from '../../lib/format';
import { getTeamStyle, CategoryTag } from '../players/categories';

// Live Status tab: header + paused notice + paginated "Recent Auction Activity"
// feed (falls back to recent players when there's no transaction history yet).
const LiveStatusPanel = ({
  auctionData,
  transactionHistory = [],
  transactionsPerPage = 10,
  currentPage = 1,
  setCurrentPage,
  soldPlayers = [],
  unsoldPlayers = [],
  onShare,
}) => {
  return (
    <div className="gbx-tabpanel-live space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Live Auction Status</h3>
        <button
          onClick={onShare}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 px-4 py-2 text-sm font-semibold text-slate-900 shadow-md shadow-amber-600/30 hover:-translate-y-0.5 active:translate-y-0 transition"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.7 10.7l6.6-3.4M8.7 13.3l6.6 3.4M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zm12 7a3 3 0 100-6 3 3 0 000 6z"
            />
          </svg>
          Share
        </button>
      </div>

      {auctionData.auctionStatus === 'stopped' && !auctionData.currentBid && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Auction is currently paused. Waiting for the next player to be put up for bidding.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Recent Transactions */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)] p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xl font-bold text-slate-900 tracking-tight">Recent Auction Activity</h4>
          {transactionHistory.length > transactionsPerPage && (
            <div className="text-sm text-gray-600">
              Showing {Math.min(transactionsPerPage, transactionHistory.length)} of{' '}
              {transactionHistory.length} transactions
            </div>
          )}
        </div>

        {/* Transactions List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transactionHistory.length > 0
            ? transactionHistory
                .filter((transaction) => transaction && transaction.id)
                .slice((currentPage - 1) * transactionsPerPage, currentPage * transactionsPerPage)
                .map((transaction) => {
                  const team = transaction.team
                    ? auctionData.teams?.find((t) => t.id === transaction.team.id)
                    : null;
                  return (
                    <div
                      key={transaction.id}
                      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-lg border-2 border-l-4 ${
                        transaction.type === 'sold'
                          ? 'bg-green-50 border-green-400 border-l-green-600'
                          : transaction.type === 'retained'
                            ? 'bg-purple-50 border-purple-400 border-l-purple-600'
                            : transaction.type === 'captain-assigned'
                              ? 'bg-yellow-50 border-yellow-400 border-l-yellow-600'
                              : 'bg-red-50 border-red-400 border-l-red-600'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 break-words">
                            {transaction.playerName}
                          </span>
                          <CategoryTag category={transaction.playerCategory} />
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{transaction.playerRole}</div>
                      </div>

                      <div className="text-left sm:text-right shrink-0 sm:pl-2">
                        {transaction.type === 'sold' ? (
                          <>
                            <div className="font-bold text-green-600 whitespace-nowrap">
                              {formatCurrency(transaction.finalBid)}
                            </div>
                            <div className="text-sm text-gray-700">
                              Sold to{' '}
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-bold ml-1 ${getTeamStyle(transaction.player?.team, auctionData.teams)}`}
                              >
                                🏏 {cleanTeamName(team?.name) || 'Unknown Team'}
                              </span>
                            </div>
                          </>
                        ) : transaction.type === 'retained' ? (
                          <>
                            <div className="font-bold text-purple-600">
                              {formatCurrency(transaction.finalBid)}
                            </div>
                            <div className="text-sm text-gray-700">
                              Retained by{' '}
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-bold ml-1 ${getTeamStyle(transaction.player?.team, auctionData.teams)}`}
                              >
                                🏏 {cleanTeamName(team?.name) || 'Unknown Team'}
                              </span>
                            </div>
                          </>
                        ) : transaction.type === 'captain-assigned' ? (
                          <>
                            <div className="font-bold text-yellow-700">
                              👑 {formatCurrency(transaction.finalBid || 0)}
                            </div>
                            <div className="text-sm text-gray-700">
                              Captain of{' '}
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-bold ml-1 ${getTeamStyle(transaction.team?.id, auctionData.teams)}`}
                              >
                                🏏 {cleanTeamName(team?.name) || 'Unknown Team'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-bold text-red-600">UNSOLD</div>
                            <div className="text-sm text-gray-600">No bids received</div>
                          </>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {transaction.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })
            : // Fallback to show recent players from auctionData if no transaction history
              [
                ...(auctionData.players?.filter((p) => p.status === 'retained') || [])
                  .slice(-3)
                  .map((player) => {
                    const team = auctionData.teams?.find((t) => t.id === player.team);
                    return (
                      <div
                        key={`fallback-retained-${player.id}`}
                        className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border-2 border-l-4 border-purple-400 border-l-purple-600"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <PlayerNameLink player={player} className="font-medium text-gray-900" />
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                player.category === 'batter'
                                  ? 'bg-blue-100 text-blue-800'
                                  : player.category === 'bowler'
                                    ? 'bg-red-100 text-red-800'
                                    : player.category === 'allrounder'
                                      ? 'bg-orange-100 text-orange-800'
                                      : player.category === 'wicket-keeper'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {player.category === 'wicket-keeper' ? 'keeper' : player.category}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">{player.role}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-purple-600">
                            {formatCurrency(player.retentionAmount || player.finalBid || 0)}
                          </div>
                          <div className="text-sm text-gray-700">
                            Retained by{' '}
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ml-1 ${getTeamStyle(player.team, auctionData.teams)}`}
                            >
                              🏏 {cleanTeamName(team?.name) || 'Unknown Team'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }),
                ...soldPlayers
                  .slice(-5)
                  .reverse()
                  .map((player) => {
                    const team = auctionData.teams?.find((t) => t.id === player.team);
                    return (
                      <div
                        key={`fallback-${player.id}`}
                        className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-l-4 border-green-400 border-l-green-600"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <PlayerNameLink player={player} className="font-medium text-gray-900" />
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                player.category === 'batter'
                                  ? 'bg-blue-100 text-blue-800'
                                  : player.category === 'bowler'
                                    ? 'bg-red-100 text-red-800'
                                    : player.category === 'allrounder'
                                      ? 'bg-orange-100 text-orange-800'
                                      : player.category === 'wicket-keeper'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {player.category === 'wicket-keeper' ? 'keeper' : player.category}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">{player.role}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {formatCurrency(player.finalBid)}
                          </div>
                          <div className="text-sm text-gray-700">
                            Sold to{' '}
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ml-1 ${getTeamStyle(player.team, auctionData.teams)}`}
                            >
                              🏏 {cleanTeamName(team?.name) || 'Unknown Team'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }),
                ...unsoldPlayers.slice(-3).map((player) => (
                  <div
                    key={`fallback-unsold-${player.id}`}
                    className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-2 border-l-4 border-red-400 border-l-red-600"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <PlayerNameLink player={player} className="font-medium text-gray-900" />
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            player.category === 'batter'
                              ? 'bg-blue-100 text-blue-800'
                              : player.category === 'bowler'
                                ? 'bg-red-100 text-red-800'
                                : player.category === 'allrounder'
                                  ? 'bg-orange-100 text-orange-800'
                                  : player.category === 'wicket-keeper'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {player.category === 'wicket-keeper' ? 'keeper' : player.category}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{player.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">UNSOLD</div>
                      <div className="text-sm text-gray-600">No bids received</div>
                    </div>
                  </div>
                )),
              ].slice(0, 8)}

          {transactionHistory.length === 0 &&
            soldPlayers.length === 0 &&
            unsoldPlayers.length === 0 && (
              <p className="text-gray-500 text-center py-8">No auction activity yet</p>
            )}
        </div>

        {/* Pagination */}
        {transactionHistory.length > transactionsPerPage && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {Math.ceil(transactionHistory.length / transactionsPerPage)}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-1.5 text-sm bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-full border border-white/30 shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, Math.ceil(transactionHistory.length / transactionsPerPage))
                  )
                }
                disabled={
                  currentPage >= Math.ceil(transactionHistory.length / transactionsPerPage)
                }
                className="px-4 py-1.5 text-sm bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-full border border-white/30 shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveStatusPanel;
