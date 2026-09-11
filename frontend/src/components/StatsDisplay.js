import React, { useMemo } from 'react';
import PlayerAvatar from './PlayerAvatar';
import { formatCurrency } from '../lib/format';
import { getTeamIcon } from '../sports';

const CATEGORY_LABELS = {
  batter: 'Batter',
  bowler: 'Bowler',
  allrounder: 'All-rounder',
  'wicket-keeper': 'Keeper',
  captain: 'Captain',
  other: 'Other',
};
const formatCategoryLabel = (c) => CATEGORY_LABELS[c] || (c ? c.charAt(0).toUpperCase() + c.slice(1) : '—');

const StatsDisplay = ({ stats, teams, players, settings }) => {
  // Memoize calculated stats to avoid recalculation on every render
  const { soldPlayers, captains, availablePlayers, unsoldPlayers, totalSpent } = useMemo(() => {
    const sold = players?.filter(p => p.status === 'sold' && p.category !== 'captain') || [];
    const caps = players?.filter(p => p.category === 'captain') || [];
    const available = players?.filter(p => p.status === 'available' && p.category !== 'captain') || [];
    const unsold = players?.filter(p => p.status === 'unsold') || [];
    const spent = sold.reduce((sum, p) => sum + (p.finalBid || 0), 0);
    
    return {
      soldPlayers: sold,
      captains: caps,
      availablePlayers: available,
      unsoldPlayers: unsold,
      totalSpent: spent
    };
  }, [players]);

  // Per-team spend for the chart + biggest spender highlight
  const { teamSpend, maxTeamSpend, biggestSpender } = useMemo(() => {
    const spendByTeam = (teams || []).map((t) => {
      const spent = (players || [])
        .filter(p => p.team === t.id && p.status === 'sold' && p.category !== 'captain')
        .reduce((s, p) => s + (p.finalBid || 0), 0);
      return { team: t, spent };
    });
    const max = Math.max(1, ...spendByTeam.map(x => x.spent));
    const top = spendByTeam.slice().sort((a, b) => b.spent - a.spent)[0];
    return { teamSpend: spendByTeam, maxTeamSpend: max, biggestSpender: top };
  }, [teams, players]);

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Auction Statistics</h3>

      {/* Headline tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-white/90 p-5 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)]">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-500">Total Spent</div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-600">{formatCurrency(totalSpent)}</div>
          <div className="mt-0.5 text-xs text-slate-500">{soldPlayers.length} sold via bidding</div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-white/90 p-5 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)]">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-500">Most Expensive</div>
          {stats?.highestBid?.player ? (
            <div className="mt-1 flex items-center gap-3">
              <PlayerAvatar player={stats.highestBid.player} size="md" />
              <div className="min-w-0">
                <div className="font-bold text-slate-900 truncate">{stats.highestBid.player.name}</div>
                <div className="text-sm font-bold text-amber-600">{formatCurrency(stats.highestBid.amount)}</div>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-sm text-slate-400">—</div>
          )}
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-indigo-200/70 bg-white/90 p-5 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)]">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
          <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-500">Biggest Spender</div>
          {biggestSpender && biggestSpender.spent > 0 ? (
            <>
              <div className="mt-1 font-bold text-slate-900 truncate">{biggestSpender.team.name}</div>
              <div className="text-sm font-bold text-indigo-600">{formatCurrency(biggestSpender.spent)}</div>
            </>
          ) : (
            <div className="mt-1 text-sm text-slate-400">—</div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Statistics */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)]">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
          <h4 className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500 mb-4">Overall</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Total Players</span>
              <span className="text-lg font-bold text-slate-900">{players?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Players Sold (Bidding)</span>
              <span className="text-lg font-bold text-emerald-600">{soldPlayers.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Team Captains</span>
              <span className="text-lg font-bold text-purple-600">{captains.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Players Available</span>
              <span className="text-lg font-bold text-amber-600">{availablePlayers.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Players Unsold</span>
              <span className="text-lg font-bold text-rose-600">{unsoldPlayers.length}</span>
            </div>
          </div>
        </div>

        {/* Financial Statistics */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)]">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <h4 className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500 mb-4">Financials</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Total Spent</span>
              <span className="text-lg font-bold text-emerald-600">{formatCurrency(totalSpent)}</span>
            </div>
            
            {stats?.highestBid && stats.highestBid.player && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Highest Bid</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(stats.highestBid.amount)}</span>
              </div>
            )}
            
            {stats?.lowestBid && stats.lowestBid.player && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Lowest Bid</span>
                <span className="font-semibold text-sky-600">{formatCurrency(stats.lowestBid.amount)}</span>
              </div>
            )}
            
            {stats?.averageBid && stats.averageBid > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Average Sale Price</span>
                <span className="font-semibold text-indigo-600">{formatCurrency(Math.round(stats.averageBid))}</span>
              </div>
            )}

            {soldPlayers.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Success Rate</span>
                <span className="font-semibold text-purple-600">
                  {Math.round((soldPlayers.length / (soldPlayers.length + unsoldPlayers.length)) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Highest/Lowest Bid Cards */}
      {(stats?.highestBid?.player || stats?.lowestBid?.player) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Highest Bid Card */}
          {stats?.highestBid?.player && (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-white/90 p-6 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)]">
              <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500">🤑 Highest Bid</h4>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{formatCurrency(stats.highestBid.amount)}</span>
              </div>
              <div className="flex items-center gap-4">
                <PlayerAvatar player={stats.highestBid.player} size="lg" />
                <div className="min-w-0 space-y-1">
                  <div className="text-lg font-bold text-slate-900 truncate">{stats.highestBid.player.name}</div>
                  <div className="text-sm text-slate-600">{stats.highestBid.player.role} · {formatCategoryLabel(stats.highestBid.player.category)}</div>
                  {stats.highestBid.player.team && (
                    <div className="text-sm font-medium text-slate-700">
                      {getTeamIcon()} {teams?.find(t => t.id === stats.highestBid.player.team)?.name || 'Unknown'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lowest Bid Card */}
          {stats?.lowestBid?.player && (
            <div className="relative overflow-hidden rounded-2xl border border-sky-200/70 bg-white/90 p-6 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)]">
              <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-500 to-blue-500" />
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500">💎 Lowest Bid</h4>
                <span className="text-2xl sm:text-3xl font-extrabold text-sky-600">{formatCurrency(stats.lowestBid.amount)}</span>
              </div>
              <div className="flex items-center gap-4">
                <PlayerAvatar player={stats.lowestBid.player} size="lg" />
                <div className="min-w-0 space-y-1">
                  <div className="text-lg font-bold text-slate-900 truncate">{stats.lowestBid.player.name}</div>
                  <div className="text-sm text-slate-600">{stats.lowestBid.player.role} · {formatCategoryLabel(stats.lowestBid.player.category)}</div>
                  {stats.lowestBid.player.team && (
                    <div className="text-sm font-medium text-slate-700">
                      {getTeamIcon()} {teams?.find(t => t.id === stats.lowestBid.player.team)?.name || 'Unknown'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spend by Team — comparative bar chart */}
      {teamSpend.some(t => t.spent > 0) && (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)]">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-500 to-indigo-500" />
          <h4 className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500 mb-4">Spend by Team</h4>
          <div className="space-y-3">
            {teamSpend.slice().sort((a, b) => b.spent - a.spent).map(({ team, spent }) => (
              <div key={team.id} className="flex items-center gap-3">
                <span className="w-28 sm:w-36 shrink-0 truncate text-sm font-medium text-slate-700">{team.name}</span>
                <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-500"
                    style={{ width: `${Math.max(2, (spent / maxTeamSpend) * 100)}%` }}
                  />
                </div>
                <span className="w-20 sm:w-24 shrink-0 text-right text-sm font-bold text-slate-900">{formatCurrency(spent)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Budget Analysis */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)]">
        <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-fuchsia-500 to-purple-500" />
        <h4 className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500 mb-4">Team Budget Analysis</h4>
        <div className="space-y-4">
          {teams?.map((team) => {
            const teamPlayers = players?.filter(p => p.team === team.id && (p.status === 'sold' || p.status === 'assigned')) || [];
            const boughtPlayers = teamPlayers.filter(p => p.category !== 'captain');
            const totalSpentByTeam = boughtPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
            const startingBudget = settings?.startingBudget || 1000;
            const budgetUsed = ((totalSpentByTeam / startingBudget) * 100);
            
            return (
              <div key={team.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{team.name}</span>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">Players: {teamPlayers.length}</span>
                    <span className="text-green-600">Spent: {formatCurrency(totalSpentByTeam)}</span>
                    <span className="text-blue-600">Remaining: {formatCurrency(team.budget)}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-colors duration-200 ${
                      budgetUsed > 90 ? 'bg-red-500' : 
                      budgetUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{Math.round(budgetUsed)}% budget used</span>
                  <span>Avg: {formatCurrency(boughtPlayers.length > 0 ? Math.round(totalSpentByTeam / boughtPlayers.length) : 0)} per player</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)]">
        <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
        <h4 className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500 mb-4">Category Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['batter', 'bowler', 'allrounder', 'wicket-keeper'].map(category => {
            const categoryPlayers = players?.filter(p => p.category === category) || [];
            const soldInCategory = categoryPlayers.filter(p => p.status === 'sold');
            const totalSpentInCategory = soldInCategory.reduce((sum, p) => sum + (p.finalBid || 0), 0);
            
            return (
              <div key={category} className="text-center p-4 bg-white bg-opacity-70 rounded-lg border border-gray-300 shadow-md">
                <h5 className="font-medium text-gray-900 mb-2">{formatCategoryLabel(category)}</h5>
                <div className="space-y-1 text-sm">
                  <div className="text-gray-600">Total: {categoryPlayers.length}</div>
                  <div className="text-green-600">Sold: {soldInCategory.length}</div>
                  <div className="text-red-600">Unsold: {categoryPlayers.filter(p => p.status === 'unsold').length}</div>
                  <div className="font-medium text-blue-600">{formatCurrency(totalSpentInCategory)}</div>
                  <div className="text-xs text-gray-500">
                    Avg: {formatCurrency(soldInCategory.length > 0 ? Math.round(totalSpentInCategory / soldInCategory.length) : 0)}
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
