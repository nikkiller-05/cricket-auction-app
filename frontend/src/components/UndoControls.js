import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNotification } from './NotificationSystem';

// Use environment variable for backend URL, fallback to localhost for dev
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const UndoControls = ({ userRole, auctionData }) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [loading, setLoading] = useState(false);
  const [actionHistory, setActionHistory] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    if (userRole === 'super-admin') {
      fetchActionHistory();
    }
  }, [userRole]);

  // Keyboard shortcuts
  useEffect(() => {
    if (userRole !== 'super-admin') return;

    const handleKeyDown = (e) => {
      // Ctrl+Z or Cmd+Z: Undo anything (bid or sale/unsold)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (loading) return;
        
        // Priority: Undo current bid if exists, otherwise undo last sale/unsold
        if (auctionData?.currentBid) {
          handleUndoCurrentBid();
        } else {
          const lastAction = actionHistory.find(action => 
            action.type === 'PLAYER_SOLD' || action.type === 'PLAYER_UNSOLD'
          );
          if (lastAction) {
            handleUndoLastSale();
          }
        }
      }
      
      // Ctrl+Shift+Z or Cmd+Shift+Z: Undo Last Sale/Unsold
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        if (loading) return;
        
        const lastAction = actionHistory.find(action => 
          action.type === 'PLAYER_SOLD' || action.type === 'PLAYER_UNSOLD'
        );
        if (lastAction) {
          handleUndoLastSale();
        }
      }

      // Ctrl+B or Cmd+B: Undo Last Bid
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        if (auctionData?.currentBid && !loading) {
          handleUndoCurrentBid();
        }
      }

      // Number keys 1-9: Place bid for team (only if teams < 10)
      const teams = auctionData?.teams || [];
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 9 && teams.length < 10 && teams.length >= keyNum) {
          e.preventDefault();
          if (auctionData?.currentBid && !loading) {
            const team = teams[keyNum - 1]; // Array is 0-indexed
            if (team) {
              handlePlaceBid(team.id);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userRole, loading, actionHistory, auctionData, handleUndoLastSale, handleUndoCurrentBid, handlePlaceBid]);

  const fetchActionHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auction/history`);
      setActionHistory(response.data.history);
    } catch (error) {
      console.error('Error fetching action history:', error);
    }
  };

  const handleUndoLastSale = useCallback(async () => {
    const lastAction = actionHistory.find(action => 
      action.type === 'PLAYER_SOLD' || action.type === 'PLAYER_UNSOLD'
    );
    
    if (!lastAction) return;

    const actionType = lastAction.type === 'PLAYER_SOLD' ? 'sale' : 'unsold';
    const message = actionType === 'sale' 
      ? `Are you sure you want to undo the last sale? This will refund the money to the team and make the player available again.`
      : `Are you sure you want to undo the unsold action? This will make ${lastAction.playerName} available for bidding again.`;

    setConfirmAction({
      type: actionType,
      message,
      action: async () => {
        setLoading(true);
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auction/undo/sale`);
          
          if (response.data.type === 'sale') {
            showWarning(`Sale Undone!\n\nPlayer: ${response.data.player}\nTeam: ${response.data.team}\nRefunded: ₹${response.data.refundedAmount}`, 'Undo Successful');
          } else if (response.data.type === 'unsold') {
            showWarning(`Unsold Action Undone!\n\nPlayer: ${response.data.player} is now available again`, 'Undo Successful');
          }
          
          fetchActionHistory();
        } catch (error) {
          showError(error.response?.data?.error || 'Failed to undo action', 'Undo Failed');
        } finally {
          setLoading(false);
        }
      }
    });
    setShowConfirmModal(true);
  }, [actionHistory, showWarning, showError]);

  const handleUndoCurrentBid = useCallback(async () => {
    setConfirmAction({
      type: 'bid',
      message: 'Are you sure you want to undo the current bid? This will revert to the previous team\'s bid or base price.',
      action: async () => {
        setLoading(true);
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auction/undo/bid`);
          if (response.data.revertedToTeam) {
            showWarning(`Bid Undone!\n\nPlayer: ${response.data.player}\nReverted to: ${response.data.revertedToTeam}\nAmount: ₹${response.data.revertedToAmount}`, 'Undo Successful');
          } else {
            showWarning(`Bid Undone!\n\nPlayer: ${response.data.player}\nReverted to base price: ₹${response.data.revertedToAmount}`, 'Undo Successful');
          }
        } catch (error) {
          showError(error.response?.data?.error || 'Failed to undo bid', 'Undo Failed');
        } finally {
          setLoading(false);
        }
      }
    });
    setShowConfirmModal(true);
  }, [showWarning, showError]);

  const handlePlaceBid = useCallback(async (teamId) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auction/bidding/place`, { teamId });
      // Success notification will come from socket event
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to place bid', 'Bid Failed');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const executeAction = async () => {
    setShowConfirmModal(false);
    if (confirmAction) {
      await confirmAction.action();
    }
    setConfirmAction(null);
  };

  const cancelAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  if (userRole !== 'super-admin') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-bold mb-2 text-gray-900">Super Admin Access Required</h3>
        <p className="text-gray-600">Undo controls are restricted to Super Admins only</p>
      </div>
    );
  }

  const lastAction = actionHistory.find(action => 
    action.type === 'PLAYER_SOLD' || action.type === 'PLAYER_UNSOLD'
  );
  const currentBid = auctionData?.currentBid;

  return (
    <div className="space-y-6">
      <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-4 border-2 border-red-300 border-opacity-60 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900">🚨 Undo Controls (Super Admin)</h3>
      </div>
      
      {/* Critical Warning */}
      <div className="bg-red-50 border-l-4 border-red-500 border-2 border-red-300 border-opacity-60 rounded-lg p-4 shadow-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-base font-semibold text-red-800">⚠️ Critical Operations</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>These actions modify auction state and affect team budgets and player assignments. Use with extreme caution during live auctions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Undo Current Bid Card */}
        <div className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl shadow-2xl border-2 border-orange-400 border-opacity-70 hover:bg-opacity-30 transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="text-2xl mr-3">⏪</div>
                <h4 className="text-xl font-bold text-gray-900">Undo Current Bid</h4>
              </div>
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                Ctrl+B
              </div>
            </div>
            
            {currentBid ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 border-opacity-70 rounded-lg p-4 shadow-md">
                  <h5 className="text-lg font-bold text-yellow-800 mb-2">🔥 Active Bidding Session</h5>
                  <div className="space-y-1 text-sm text-yellow-700">
                    <div className="flex justify-between">
                      <span>Player:</span>
                      <span className="font-medium">{auctionData.players?.find(p => p.id === currentBid.playerId)?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Bid:</span>
                      <span className="font-bold text-lg">₹{currentBid.currentAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Leading Team:</span>
                      <span className="font-medium">
                        {currentBid.biddingTeam ? 
                          auctionData.teams?.find(t => t.id === parseInt(currentBid.biddingTeam))?.name || 'Unknown' : 
                          'No bids yet'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border-2 border-blue-300 border-opacity-70 rounded-lg p-3 shadow-md">
                  <p className="text-sm text-blue-700">
                    <strong>⏪ Undo Behavior:</strong> This will revert to the previous team's bid, or to base price if no previous bids exist.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={handleUndoCurrentBid}
                    disabled={loading}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-md font-medium transition-colors border-2 border-yellow-400 border-opacity-60 shadow-md"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Reverting Bid...
                      </span>
                    ) : (
                      '🔄 Revert to Previous Bid'
                    )}
                  </button>


                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  This will revert to the previous team's bid or reset to base price if this is the first bid
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">⏸️</div>
                <h5 className="text-lg font-bold text-gray-700 mb-1">No Active Bidding</h5>
                <p className="text-sm text-gray-500">There is currently no player being bid on</p>
              </div>
            )}
          </div>
        </div>

        {/* Undo Last Sale/Unsold Card */}
        <div className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl shadow-2xl border-2 border-red-400 border-opacity-70 hover:bg-opacity-30 transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="text-2xl mr-3">↩️</div>
                <h4 className="text-xl font-bold text-gray-900">Undo Last Action</h4>
              </div>
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                Ctrl+Shift+Z
              </div>
            </div>
            
            {lastAction ? (
              <div className="space-y-4">
                <div className={`bg-gradient-to-r ${
                  lastAction.type === 'PLAYER_SOLD' 
                    ? 'from-red-50 to-pink-50 border-red-300' 
                    : 'from-gray-50 to-slate-50 border-gray-300'
                } border-2 border-opacity-70 rounded-lg p-4 shadow-md`}>
                  <h5 className={`text-lg font-bold mb-2 ${
                    lastAction.type === 'PLAYER_SOLD' ? 'text-red-800' : 'text-gray-800'
                  }`}>
                    {lastAction.type === 'PLAYER_SOLD' ? '💰 Most Recent Sale' : '❌ Most Recent Unsold'}
                  </h5>
                  <div className={`space-y-1 text-sm ${
                    lastAction.type === 'PLAYER_SOLD' ? 'text-red-700' : 'text-gray-700'
                  }`}>
                    <div className="flex justify-between">
                      <span>Player:</span>
                      <span className="font-medium">{lastAction.playerName}</span>
                    </div>
                    {lastAction.type === 'PLAYER_SOLD' && (
                      <>
                        <div className="flex justify-between">
                          <span>Sold to:</span>
                          <span className="font-medium">{lastAction.teamName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sale Price:</span>
                          <span className="font-bold text-lg">₹{lastAction.amount}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="text-xs">{new Date(lastAction.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleUndoLastSale}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-md font-medium transition-colors border-2 border-red-500 border-opacity-60 shadow-md"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Undoing...
                    </span>
                  ) : (
                    `↩️ Undo ${lastAction.type === 'PLAYER_SOLD' ? 'Sale' : 'Unsold'}`
                  )}
                </button>
                
                <p className="text-xs text-gray-500 text-center">
                  {lastAction.type === 'PLAYER_SOLD' 
                    ? `This will refund ₹${lastAction.amount} to ${lastAction.teamName} and make ${lastAction.playerName} available again`
                    : `This will make ${lastAction.playerName} available for bidding again`
                  }
                </p>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-gray-300 border-opacity-50 rounded-lg bg-gray-50 bg-opacity-30">
                <div className="text-4xl mb-3">📦</div>
                <h5 className="font-medium text-gray-700 mb-1">No Recent Sales</h5>
                <p className="text-sm text-gray-500">No sales have been completed yet to undo</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action History */}
      <div className="bg-white bg-opacity-20 backdrop-blur-xl rounded-xl shadow-2xl border-2 border-indigo-300 border-opacity-70 hover:bg-opacity-30 transition-all duration-300">
        <div className="px-6 py-4 border-b-2 border-indigo-200 border-opacity-60">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">📜 Recent Action History</h4>
            <button
              onClick={fetchActionHistory}
              className="text-sm text-indigo-600 hover:text-indigo-500 border-2 border-indigo-300 border-opacity-50 px-3 py-1 rounded-lg hover:bg-indigo-50"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {actionHistory.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {actionHistory.slice(0, 15).map((action, index) => (
                <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-2 border-gray-200 border-opacity-60 shadow-sm">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">
                        {index === 0 ? '🔥' : 
                         action.type === 'PLAYER_SOLD' ? '💰' : 
                         action.type === 'PLAYER_UNSOLD' ? '❌' : '🔨'}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            action.type === 'PLAYER_SOLD' ? 'bg-green-100 text-green-800' : 
                            action.type === 'PLAYER_UNSOLD' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {action.type === 'PLAYER_SOLD' ? 'Sale' : 
                             action.type === 'PLAYER_UNSOLD' ? 'Unsold' : 'Bid'}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {action.playerName}
                          </span>
                          {action.type !== 'PLAYER_UNSOLD' && (
                            <>
                              <span className="text-sm text-gray-500">→</span>
                              <span className="text-sm font-medium text-gray-900">
                                {action.teamName}
                              </span>
                            </>
                          )}
                          {index === 0 && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                              LATEST
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center space-x-4">
                          {action.amount && <span>₹{action.amount}</span>}
                          {action.amount && <span>•</span>}
                          <span>{new Date(action.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-gray-300 border-opacity-50 rounded-lg bg-gray-50 bg-opacity-30">
              <div className="text-4xl mb-3">📜</div>
              <h5 className="font-medium text-gray-700 mb-1">No Action History</h5>
              <p className="text-sm text-gray-500">Action history will appear here as sales are completed</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white bg-opacity-20 backdrop-blur-xl rounded-xl shadow-2xl max-w-md mx-4 w-full border-2 border-yellow-400 border-opacity-70">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-center text-gray-900 mb-4">
                Confirm {confirmAction?.type === 'sale' ? 'Sale Undo' : 'Bid Reversion'}
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                {confirmAction?.message}
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelAction}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors border-2 border-gray-400 border-opacity-60 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={executeAction}
                  className={`flex-1 font-medium py-2 px-4 rounded-md transition-colors border-2 shadow-sm ${
                    confirmAction?.type === 'sale' 
                      ? 'bg-red-600 hover:bg-red-700 text-white border-red-500 border-opacity-60'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500 border-opacity-60'
                  }`}
                >
                  {confirmAction?.type === 'sale' ? 'Undo Sale' : 'Revert Bid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Guidelines */}
      <div className="bg-blue-50 border-2 border-blue-300 border-opacity-70 rounded-lg p-4 shadow-md">
        <h4 className="font-medium text-blue-800 mb-2">💡 Enhanced Undo Functionality</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Undo Last Action (Ctrl+Shift+Z):</strong> Reverts the most recent sale or unsold action, refunds money if applicable, and makes player available</p>
          <p><strong>Undo Current Bid (Ctrl+B):</strong> Reverts to previous team's bid instead of canceling completely. Falls back to base price if no previous bids exist.</p>
          <p><strong>Quick Undo (Ctrl+Z):</strong> Smart undo - reverts current bid if active, otherwise undoes last sale/unsold</p>
          <p><strong>Action History:</strong> Shows chronological record of all sales and unsold actions for tracking and transparency</p>
          <p className="font-medium mt-2">⚠️ These operations broadcast changes to all connected clients in real-time</p>
        </div>
        
        <div className="mt-3 pt-3 border-t border-blue-200">
          <h5 className="font-medium text-blue-800 mb-2">⌨️ Keyboard Shortcuts:</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-600">
            <div className="flex items-center">
              <kbd className="px-2 py-1 bg-white rounded border border-blue-300 font-mono">Ctrl+Z</kbd>
              <span className="ml-2">Undo Anything (Smart)</span>
            </div>
            <div className="flex items-center">
              <kbd className="px-2 py-1 bg-white rounded border border-blue-300 font-mono">Ctrl+B</kbd>
              <span className="ml-2">Undo Last Bid</span>
            </div>
            <div className="flex items-center">
              <kbd className="px-2 py-1 bg-white rounded border border-blue-300 font-mono">Ctrl+Shift+Z</kbd>
              <span className="ml-2">Undo Last Sale/Unsold</span>
            </div>
            {auctionData?.teams?.length < 10 && (
              <div className="flex items-center col-span-2">
                <kbd className="px-2 py-1 bg-white rounded border border-blue-300 font-mono">1-{auctionData.teams.length}</kbd>
                <span className="ml-2">Place bid for Team 1-{auctionData.teams.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UndoControls;
