import React from 'react';
import { currencyOptions } from '../../lib/currency';

// Edit Auction Settings modal: basic config (teams/budget/max/base/currency) +
// bidding increments. Presentational: parent owns config state + handlers.
const EditSettingsModal = ({
  open,
  onClose,
  config,
  onChange,
  onIncrementChange,
  onAddIncrement,
  onRemoveIncrement,
  onSave,
  saving = false,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Auction Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Configuration */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-6 border border-blue-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <span className="mr-2">⚙️</span>
              Basic Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Number of Teams
                </label>
                <input
                  type="number"
                  value={config.teamCount}
                  onChange={(e) => onChange('teamCount', parseInt(e.target.value) || '')}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      onChange('teamCount', 4);
                    } else {
                      onChange('teamCount', parseInt(e.target.value));
                    }
                  }}
                  step="any"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Starting Budget
                </label>
                <input
                  type="number"
                  value={config.startingBudget}
                  onChange={(e) => onChange('startingBudget', parseInt(e.target.value) || '')}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      onChange('startingBudget', 1000);
                    } else {
                      onChange('startingBudget', parseInt(e.target.value));
                    }
                  }}
                  step="any"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Max Players Per Team
                </label>
                <input
                  type="number"
                  value={config.maxPlayersPerTeam}
                  onChange={(e) => onChange('maxPlayersPerTeam', parseInt(e.target.value) || '')}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      onChange('maxPlayersPerTeam', 15);
                    } else {
                      onChange('maxPlayersPerTeam', parseInt(e.target.value));
                    }
                  }}
                  step="any"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Base Price
                </label>
                <input
                  type="number"
                  value={config.basePrice}
                  onChange={(e) => onChange('basePrice', parseInt(e.target.value) || '')}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      onChange('basePrice', 10);
                    } else {
                      onChange('basePrice', parseInt(e.target.value));
                    }
                  }}
                  step="any"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={config.currency || 'INR'}
                  onChange={(e) => onChange('currency', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {currencyOptions().map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bidding Increments */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 sm:p-6 border border-green-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                <span className="mr-2">📊</span>
                Bidding Increments
              </h3>
              <button
                onClick={onAddIncrement}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-b from-emerald-500 to-green-600 text-white rounded-full hover:from-emerald-400 hover:to-green-500 shadow-md shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all text-xs sm:text-sm font-semibold"
              >
                + Add Increment
              </button>
            </div>

            <div className="space-y-3">
              {config.biddingIncrements.map((increment, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-white p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Price Threshold
                    </label>
                    <input
                      type="number"
                      value={increment.threshold}
                      onChange={(e) => onIncrementChange(index, 'threshold', e.target.value)}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          onIncrementChange(index, 'threshold', '0');
                        }
                      }}
                      step="any"
                      className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Bid Increment
                    </label>
                    <input
                      type="number"
                      value={increment.increment}
                      onChange={(e) => onIncrementChange(index, 'increment', e.target.value)}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          onIncrementChange(index, 'increment', '5');
                        }
                      }}
                      step="any"
                      className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  {config.biddingIncrements.length > 1 && (
                    <button
                      onClick={() => onRemoveIncrement(index)}
                      className="sm:mt-5 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors self-center"
                      title="Remove increment"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs sm:text-sm text-gray-600">
              <span className="font-medium">Tip:</span> Increments are applied based on the current
              bid amount. Lower thresholds are used for lower bids.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="w-full sm:w-auto px-5 sm:px-6 py-2 bg-slate-100 text-slate-700 rounded-full border border-slate-200 hover:bg-slate-200 hover:-translate-y-0.5 active:translate-y-0 transition-all font-semibold text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="w-full sm:w-auto px-5 sm:px-6 py-2 bg-gradient-to-b from-amber-400 to-amber-600 text-slate-900 rounded-full hover:from-amber-300 hover:to-amber-500 shadow-md shadow-amber-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSettingsModal;
