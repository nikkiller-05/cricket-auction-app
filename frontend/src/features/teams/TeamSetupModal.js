import React from 'react';
import TeamManagement from '../../components/TeamManagement';

// Hamburger "Team Setup" modal: feature toggles (captains/retention) + team
// naming / captain / retention assignment. Replaces the old Manage tab.
const TeamSetupModal = ({
  open,
  onClose,
  auctionData,
  enableCaptains,
  enableRetention,
  onToggleFeature,
  onTeamsUpdate,
  onPlayersUpdate,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto bg-black/60 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl my-4 rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex flex-col gap-3 rounded-t-2xl border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Close Team Setup"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <span className="text-xl">🛠️</span>
            <h2 className="text-lg font-bold text-slate-900">Team Setup</h2>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={enableCaptains}
                onChange={(e) => onToggleFeature('enableCaptains', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              👑 Captains
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={enableRetention}
                onChange={(e) => onToggleFeature('enableRetention', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              🔒 Retention
            </label>
            <button
              onClick={onClose}
              className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Done
            </button>
          </div>
        </div>
        <div className="p-3 sm:p-5">
          <p className="mb-3 text-xs text-slate-500">
            Turn a feature on to show its card on the dashboards and reveal its assignment section
            below.
          </p>
          {auctionData.fileUploaded ? (
            <TeamManagement
              teams={auctionData.teams || []}
              auctionData={auctionData}
              onTeamsUpdate={onTeamsUpdate}
              onPlayersUpdate={onPlayersUpdate}
              enableCaptains={enableCaptains}
              enableRetention={enableRetention}
            />
          ) : (
            <div className="py-10 text-center text-slate-500">
              <div className="mb-3 text-5xl">⚙️</div>
              <p className="font-semibold">Upload players first to set up teams.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamSetupModal;
