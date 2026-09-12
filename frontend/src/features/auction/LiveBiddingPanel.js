import React from 'react';
import axios from 'axios';
import LiveBiddingCard from '../../components/LiveBiddingCard';
import { API_BASE_URL } from '../../config';
import { formatCurrency, cleanTeamName } from '../../lib/format';
import { computeNextBid } from '../../domain/bidding';

// The live bidding card + admin bid controls (team bids, custom/big bid, sell,
// unsold, cancel, undo). Moved VERBATIM out of UnifiedDashboard — prop names
// mirror the former locals so the JSX and behavior are unchanged. Money path:
// keep behavior identical.
const LiveBiddingPanel = ({
  auctionData,
  setAuctionData,
  currentPlayer,
  biddingTeam,
  isAdmin,
  userRole,
  customBidTeamId,
  setCustomBidTeamId,
  customBidAmount,
  setCustomBidAmount,
  confirm,
  showError,
  showInfo,
  fetchActionHistory,
  handleUndoCurrentBid,
  undoLoading,
}) => {
  if (!auctionData?.currentBid || !currentPlayer) return null;

  return (
    <LiveBiddingCard
      player={currentPlayer}
      currentAmount={auctionData.currentBid.currentAmount}
      leadingTeamName={biddingTeam ? cleanTeamName(biddingTeam.name) : null}
      leadingTeamBudget={biddingTeam ? biddingTeam.budget : null}
      leadingTeamLogo={biddingTeam ? biddingTeam.logoUrl : null}
      isFastTrack={auctionData.auctionStatus === 'fast-track'}
      spectator={!isAdmin}
      rightSlot={
        isAdmin ? (
          <div>
            {/* Section label */}
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-bold text-white/70 text-center mb-3">
              Place Bid
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 mb-5">
              {auctionData.teams?.map((team) => {
                const nextBidAmount = computeNextBid(auctionData.currentBid, auctionData.settings);
                const hasMaxPlayers =
                  team.players?.length >= (auctionData.settings?.maxPlayersPerTeam || 15);
                const hasSufficientBudget = team.budget >= nextBidAmount;
                const canBid = hasSufficientBudget && !hasMaxPlayers;

                return (
                  <button
                    key={team.id}
                    onClick={async () => {
                      // Optimistic: show the bid instantly; socket reconciles.
                      setAuctionData((prev) =>
                        prev
                          ? {
                              ...prev,
                              currentBid: {
                                ...(prev.currentBid || {}),
                                playerId: currentPlayer?.id,
                                currentAmount: nextBidAmount,
                                biddingTeam: team.id,
                              },
                            }
                          : prev
                      );
                      try {
                        await axios.post(`${API_BASE_URL}/api/auction/bidding/place`, {
                          teamId: team.id,
                        });
                      } catch (error) {
                        showError(error.response?.data?.error || 'Error placing bid');
                      }
                    }}
                    disabled={!canBid}
                    className={`group relative overflow-hidden px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-200 border ${
                      canBid
                        ? 'bg-gradient-to-br from-cyan-400/90 to-blue-600/90 text-white border-cyan-300/60 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-400/50 hover:-translate-y-0.5 hover:from-cyan-300 hover:to-blue-500 active:scale-95'
                        : 'bg-white/5 text-white hover:-translate-y-0.5 active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150/40 cursor-not-allowed border-white/10'
                    }`}
                    title={
                      hasMaxPlayers
                        ? `Team full (${team.players?.length}/${auctionData.settings?.maxPlayersPerTeam || 15} players)`
                        : !hasSufficientBudget
                          ? `Insufficient budget (${formatCurrency(team.budget)})`
                          : `Bid ${formatCurrency(nextBidAmount)} for ${cleanTeamName(team.name)}`
                    }
                  >
                    {canBid && (
                      <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                    )}
                    <div className="relative flex flex-col items-center leading-tight">
                      <span className="tracking-wide">{cleanTeamName(team.name)}</span>
                      <span
                        className={`text-[10px] mt-0.5 font-semibold ${canBid ? 'text-white/85' : 'text-white/30'}`}
                      >
                        {formatCurrency(team.budget)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom / Big Bid — jump to a large amount in one action */}
            <div className="mb-5 pt-4 border-t border-white/15">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-bold text-white/70 text-center mb-2.5">
                Custom / Big Bid
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <select
                  value={customBidTeamId}
                  onChange={(e) => setCustomBidTeamId(e.target.value)}
                  className="rounded-lg bg-white/10 border border-white/25 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 [&>option]:text-slate-900"
                >
                  <option value="">Select team…</option>
                  {auctionData.teams?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {cleanTeamName(t.name)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={customBidAmount}
                  onChange={(e) => setCustomBidAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-32 rounded-lg bg-white/10 border border-white/25 text-white text-sm px-3 py-2 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                />
                <button
                  onClick={async () => {
                    if (!customBidTeamId) {
                      showError('Select a team for the custom bid');
                      return;
                    }
                    const amt = parseInt(customBidAmount, 10);
                    if (isNaN(amt) || amt <= 0) {
                      showError('Enter a valid bid amount');
                      return;
                    }
                    const cur = auctionData.currentBid?.currentAmount || 0;
                    // Guard against fat-finger jumps: confirm big leaps.
                    const bigJump = amt >= cur * 2 || amt - cur >= 100000;
                    if (bigJump) {
                      const team = auctionData.teams?.find((t) => t.id === parseInt(customBidTeamId));
                      const ok = await confirm(
                        `Place a bid of ${formatCurrency(amt)} for ${cleanTeamName(team?.name)}?\n\nThis is a big jump from the current ${formatCurrency(cur)}.`,
                        'Confirm Big Bid'
                      );
                      if (!ok) return;
                    }
                    try {
                      await axios.post(`${API_BASE_URL}/api/auction/bidding/place`, {
                        teamId: parseInt(customBidTeamId),
                        amount: amt,
                      });
                      setCustomBidAmount('');
                    } catch (error) {
                      showError(error.response?.data?.error || 'Error placing bid');
                    }
                  }}
                  className="rounded-full bg-gradient-to-b from-emerald-500 to-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 transition"
                >
                  Place
                </button>
              </div>
              <div className="flex justify-center gap-2 mt-2.5">
                {(() => {
                  // Quick-add steps scale with the auction's own bid increment
                  // (not hardcoded lakhs), so any budget size works.
                  const curAmt =
                    auctionData.currentBid?.currentAmount ?? (auctionData.settings?.basePrice || 0);
                  const step = Math.max(
                    1,
                    computeNextBid(auctionData.currentBid, auctionData.settings) - curAmt
                  );
                  return [1, 5, 10].map((m) => ({
                    label: `+${formatCurrency(step * m)}`,
                    val: step * m,
                  }));
                })().map((j) => (
                  <button
                    key={j.label}
                    onClick={() => {
                      const cur = auctionData.currentBid?.currentAmount || 0;
                      const start = customBidAmount ? parseInt(customBidAmount, 10) : cur;
                      setCustomBidAmount(String((isNaN(start) ? cur : start) + j.val));
                    }}
                    className="rounded-full bg-white/10 border border-white/20 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white/20 hover:-translate-y-0.5 active:translate-y-0 transition"
                  >
                    {j.label}
                  </button>
                ))}
                <button
                  onClick={() => setCustomBidAmount('')}
                  className="rounded-full bg-white/5 border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/15 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              <button
                onClick={async () => {
                  try {
                    await axios.post(`${API_BASE_URL}/api/auction/bidding/sell`);
                    if (userRole === 'super-admin') {
                      fetchActionHistory();
                    }
                  } catch (error) {
                    showError(error.response?.data?.error || 'Error selling player');
                  }
                }}
                disabled={!auctionData.currentBid.biddingTeam}
                className="group relative overflow-hidden px-5 sm:px-7 py-2.5 sm:py-3 bg-gradient-to-br from-emerald-400 to-green-600 hover:from-emerald-300 hover:to-green-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-white hover:-translate-y-0.5 active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/40 hover:shadow-xl hover:shadow-emerald-400/60 hover:-translate-y-0.5 active:scale-95 duration-200 border border-emerald-300/50 inline-flex items-center gap-2"
              >
                <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="tracking-wide">SELL</span>
              </button>
              <button
                onClick={async () => {
                  try {
                    await axios.post(`${API_BASE_URL}/api/auction/bidding/unsold`);
                    if (userRole === 'super-admin') {
                      fetchActionHistory();
                    }
                  } catch (error) {
                    showError(error.response?.data?.error || 'Error marking as unsold');
                  }
                }}
                className="group relative overflow-hidden px-5 sm:px-7 py-2.5 sm:py-3 bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white hover:-translate-y-0.5 active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/40 hover:shadow-xl hover:shadow-rose-400/60 hover:-translate-y-0.5 active:scale-95 duration-200 border border-rose-300/50 inline-flex items-center gap-2"
              >
                <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="tracking-wide">UNSOLD</span>
              </button>
            </div>

            {/* Undo Controls - Only for super-admin */}
            {userRole === 'super-admin' && (
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4 pt-4 border-t border-white/15">
                <button
                  onClick={handleUndoCurrentBid}
                  disabled={undoLoading || !auctionData.currentBid}
                  className="group relative overflow-hidden px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg text-xs font-semibold border border-white/20 hover:border-white/40 transition-colors duration-150 active:scale-95 inline-flex items-center gap-1.5"
                  title="Undo Last Bid - Removes the most recent bid during active bidding"
                >
                  <span>⏪</span>
                  <span className="hidden sm:inline tracking-wide">Undo Last Bid</span>
                </button>

                <button
                  onClick={async () => {
                    const confirmed = await confirm(
                      `Cancel bidding for ${currentPlayer.name}?\n\nThis will:\n• Reset the player to available status\n• Clear all bids for this player\n• Allow starting bidding again for this player\n\nAre you sure?`,
                      'Cancel Bidding'
                    );
                    if (!confirmed) return;

                    try {
                      await axios.post(`${API_BASE_URL}/api/auction/bidding/cancel`);
                      showInfo(
                        'Bidding cancelled successfully - player is available again',
                        'Bidding Cancelled'
                      );
                    } catch (error) {
                      showError(error.response?.data?.error || 'Error cancelling bidding', 'Error');
                    }
                  }}
                  disabled={!auctionData.currentBid}
                  className="group relative overflow-hidden px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg text-xs font-semibold border border-white/20 hover:border-white/40 transition-colors duration-150 active:scale-95 inline-flex items-center gap-1.5"
                  title="Cancel bidding and return player to available status"
                >
                  <span>⛔</span>
                  <span className="hidden sm:inline tracking-wide">Cancel</span>
                </button>
              </div>
            )}

            {/* Cancel Button for Regular Admins (when super-admin controls not shown) */}
            {isAdmin && userRole !== 'super-admin' && (
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4 pt-4 border-t border-white/15">
                <button
                  onClick={async () => {
                    const confirmed = await confirm(
                      `Cancel bidding for ${currentPlayer.name}?\n\nThis will:\n• Reset the player to available status\n• Clear all bids for this player\n• Allow starting bidding again for this player\n\nAre you sure?`,
                      'Cancel Bidding'
                    );
                    if (!confirmed) return;

                    try {
                      await axios.post(`${API_BASE_URL}/api/auction/bidding/cancel`);
                      showInfo(
                        'Bidding cancelled successfully - player is available again',
                        'Bidding Cancelled'
                      );
                    } catch (error) {
                      showError(error.response?.data?.error || 'Error cancelling bidding', 'Error');
                    }
                  }}
                  disabled={!auctionData.currentBid}
                  className="group relative overflow-hidden px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg text-xs font-semibold border border-white/20 hover:border-white/40 transition-colors duration-150 active:scale-95 inline-flex items-center gap-1.5"
                  title="Cancel bidding and return player to available status"
                >
                  <span>⛔</span>
                  <span className="hidden sm:inline tracking-wide">Cancel</span>
                </button>
              </div>
            )}
          </div>
        ) : null
      }
    />
  );
};

export default LiveBiddingPanel;
