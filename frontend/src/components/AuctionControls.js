import React, { useState, memo } from 'react';
import axios from 'axios';
import { useNotification } from './NotificationSystem';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AuctionControls = memo(({ auctionData, socket }) => {
  const [loading, setLoading] = useState(false);
  const { showError } = useNotification();

  // FIXED: Safe access to settings with default values
  const settings = auctionData?.settings || {
    basePrice: 10,
    teamCount: 4,
    maxPlayersPerTeam: 15,
    startingBudget: 1000,
    biddingIncrements: [
      { threshold: 50, increment: 5 },
      { threshold: 100, increment: 10 }
    ]
  };

  const auctionStatus = auctionData?.auctionStatus || 'stopped';
  const teams = auctionData?.teams || [];

  const handleStartAuction = async () => {
    setLoading(true);
    try {
  await axios.post(`${API_BASE_URL}/api/auction/start`);
    } catch (error) {
      console.error('Error starting auction:', error);
      showError(error.response?.data?.error || 'Error starting auction');
    } finally {
      setLoading(false);
    }
  };

  const handleStopAuction = async () => {
    setLoading(true);
    try {
  await axios.post(`${API_BASE_URL}/api/auction/stop`);
    } catch (error) {
      console.error('Error stopping auction:', error);
      showError(error.response?.data?.error || 'Error stopping auction');
    } finally {
      setLoading(false);
    }
  };

  // Don't render if no auctionData
  if (!auctionData) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Loading auction controls...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Auction Controls</h3>
      
      {/* Auction Status Display */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)]">
        <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
        <h4 className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500 mb-4">Current Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-left">
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-500">Auction</div>
            <div className="mt-1 text-2xl font-bold text-indigo-600">{auctionStatus.toUpperCase()}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-left">
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-500">Base Price</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">₹{settings.basePrice}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-left">
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-500">Teams</div>
            <div className="mt-1 text-2xl font-bold text-purple-600">{teams.length}</div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)]">
        <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <h4 className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500 mb-4">Controls</h4>
        <div className="flex flex-wrap gap-3">
          {auctionStatus === 'stopped' && (
            <button
              onClick={handleStartAuction}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:opacity-50 text-white hover:-translate-y-0.5 active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150 px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 active:scale-95"
            >
              {loading ? 'Starting…' : '▶ Start Auction'}
            </button>
          )}
          
          {auctionStatus === 'running' && (
            <button
              onClick={handleStopAuction}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 disabled:opacity-50 text-white hover:-translate-y-0.5 active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150 px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-rose-500/30 hover:-translate-y-0.5 active:scale-95"
            >
              {loading ? 'Stopping…' : '⏹ Stop Auction'}
            </button>
          )}
        </div>
      </div>

      {/* Settings Display */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_-12px_rgba(15,23,42,0.18)]">
        <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-fuchsia-500 to-purple-500" />
        <h4 className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500 mb-4">Current Settings</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-500">Base Price</div>
            <div className="mt-1 text-lg font-bold text-slate-900">₹{settings.basePrice}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-500">Teams</div>
            <div className="mt-1 text-lg font-bold text-slate-900">{settings.teamCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-500">Max Players/Team</div>
            <div className="mt-1 text-lg font-bold text-slate-900">{settings.maxPlayersPerTeam}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-500">Starting Budget</div>
            <div className="mt-1 text-lg font-bold text-slate-900">₹{settings.startingBudget}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

AuctionControls.displayName = 'AuctionControls';

export default AuctionControls;
