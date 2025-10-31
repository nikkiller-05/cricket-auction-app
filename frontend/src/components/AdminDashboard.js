import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PlayerUpload from './PlayerUpload';
import TeamManagement from './TeamManagement';
import AuctionControls from './AuctionControls';
import ResetControls from './ResetControls';
import PlayersList from './PlayersList';
import TeamsDisplay from './TeamsDisplay';
import StatsDisplay from './StatsDisplay';

const AdminDashboard = ({ auctionData, onLogout, socket, onDataRefresh }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [notifications, setNotifications] = useState([]);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Add console logging to see what data we're receiving
  useEffect(() => {
    console.log('AdminDashboard received auctionData:', auctionData);

    // Socket event listeners for notifications and updates
    const handleAuctionReset = () => {
      console.log('Auction was reset');
      addNotification('Auction has been reset successfully', 'success');
      if (onDataRefresh) onDataRefresh();
    };

    const handleFastTrackStarted = (data) => {
      console.log('Fast track auction started:', data);
      addNotification(`Fast Track Auction started with ${data.players?.length || 0} players`, 'info');
    };

    const handleFastTrackEnded = () => {
      console.log('Fast track auction ended');
      addNotification('Fast Track Auction has been completed', 'info');
    };

    const handleFileUploaded = (fileInfo) => {
      console.log('File uploaded:', fileInfo);
      addNotification(`Successfully uploaded ${fileInfo.playerCount} players`, 'success');
    };

    const handleAuctionCleared = () => {
      console.log('Auction cleared');
      addNotification('All auction data has been cleared', 'warning');
    };

    const handlePlayerSold = (data) => {
      if (data.player && data.team) {
        addNotification(`${data.player.name} sold to ${data.team.name} for ₹${data.player.finalBid}`, 'success');
      }
    };

    const handlePlayerUnsold = (data) => {
      if (data.player) {
        addNotification(`${data.player.name} marked as unsold`, 'warning');
      }
    };

    // Attach socket listeners
    socket.on('auctionReset', handleAuctionReset);
    socket.on('fastTrackStarted', handleFastTrackStarted);
    socket.on('fastTrackEnded', handleFastTrackEnded);
    socket.on('fileUploaded', handleFileUploaded);
    socket.on('auctionCleared', handleAuctionCleared);
    socket.on('playerSold', handlePlayerSold);
    socket.on('playerUnsold', handlePlayerUnsold);

    return () => {
      socket.off('auctionReset', handleAuctionReset);
      socket.off('fastTrackStarted', handleFastTrackStarted);
      socket.off('fastTrackEnded', handleFastTrackEnded);
      socket.off('fileUploaded', handleFileUploaded);
      socket.off('auctionCleared', handleAuctionCleared);
      socket.off('playerSold', handlePlayerSold);
      socket.off('playerUnsold', handlePlayerUnsold);
    };
  }, [auctionData, socket, onDataRefresh]);

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 notifications
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const downloadResults = async (format = 'excel') => {
    if (downloadLoading) return;
    
    try {
      setDownloadLoading(true);
      const endpoint = format === 'csv' ? '/api/download-results-csv' : '/api/download-results';
      console.log(`Downloading ${format} results...`);
      
      const response = await axios.get(endpoint, {
        responseType: 'blob',
        timeout: 30000 // 30 second timeout
      });
      
      // Create blob URL and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `auction-results-${new Date().toISOString().slice(0, 10)}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up blob URL
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      
      addNotification(`${format.toUpperCase()} results downloaded successfully: ${filename}`, 'success');
    } catch (error) {
      console.error('Error downloading results:', error);
      let errorMessage = `Error downloading ${format} results`;
      
      if (error.response?.status === 404) {
        errorMessage = 'Download endpoint not found. Please check server configuration.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || 'No data available for download';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Download timeout. Please try again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      addNotification(errorMessage, 'error');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleUploadSuccess = (data) => {
    console.log('Upload success callback:', data);
    setActiveTab('players'); // Auto-switch to players tab
    addNotification(`Successfully processed ${data.playerCount} players from ${data.fileName}`, 'success');
    if (onDataRefresh) {
      onDataRefresh();
    }
  };

  const getStatusInfo = () => {
    const status = auctionData.auctionStatus;
    const configs = {
      'stopped': { color: 'bg-gray-100 text-gray-800', icon: '⏹️', text: 'STOPPED' },
      'running': { color: 'bg-green-100 text-green-800', icon: '🔴', text: 'LIVE' },
      'fast-track': { color: 'bg-orange-100 text-orange-800', icon: '⚡', text: 'FAST TRACK' },
      'finished': { color: 'bg-blue-100 text-blue-800', icon: '✅', text: 'COMPLETED' }
    };
    return configs[status] || configs['stopped'];
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const statusInfo = getStatusInfo();

  // Calculate stats for tabs
  const availablePlayersCount = auctionData.players?.filter(p => p.status === 'available' && p.category !== 'captain').length || 0;
  const soldPlayersCount = auctionData.players?.filter(p => p.status === 'sold').length || 0;
  const unsoldPlayersCount = auctionData.players?.filter(p => p.status === 'unsold').length || 0;
  const totalPlayersCount = auctionData.players?.length || 0;

  const tabs = [
    { 
      id: 'upload', 
      name: 'Upload Players', 
      icon: '📁',
      description: 'Upload and manage player data'
    },
    { 
      id: 'players', 
      name: 'Players', 
      icon: '👥', 
      count: totalPlayersCount,
      subCount: availablePlayersCount,
      description: 'View and manage all players'
    },
    { 
      id: 'teams', 
      name: 'Teams', 
      icon: '🏏', 
      count: auctionData.teams?.length || 0,
      description: 'Team management and squad overview'
    },
    { 
      id: 'auction', 
      name: 'Auction Controls', 
      icon: '⚡',
      description: 'Start/stop auction and control bidding'
    },
    { 
      id: 'reset', 
      name: 'Reset & Fast Track', 
      icon: '🔄',
      badge: unsoldPlayersCount,
      description: 'Reset auction or run fast track for unsold players'
    },
    { 
      id: 'stats', 
      name: 'Statistics', 
      icon: '📊',
      description: 'View auction statistics and analytics'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 space-y-2 z-50">
          <div className="flex justify-end mb-2">
            <button
              onClick={clearAllNotifications}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`max-w-sm p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 animate-slide-in ${
                notification.type === 'success' ? 'bg-green-50 border-green-400 text-green-800' :
                notification.type === 'error' ? 'bg-red-50 border-red-400 text-red-800' :
                notification.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' :
                'bg-blue-50 border-blue-400 text-blue-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-3 text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 shadow-xl sticky top-0 z-40 backdrop-blur-xl bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Cricket Auction Admin</h1>
              
              <div className="flex items-center space-x-2 flex-wrap">
                <div className={`px-3 py-1 rounded-full text-base font-semibold ${statusInfo.color}`}>
                  {statusInfo.icon} {statusInfo.text}
                </div>
                
                {auctionData.currentBid && (
                  <div className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 animate-pulse">
                    💰 Bidding: ₹{auctionData.currentBid.currentAmount}
                  </div>
                )}
              </div>
              
              {auctionData.fileUploaded && (
                <div className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 max-w-xs truncate">
                  📁 {auctionData.fileName} ({totalPlayersCount} players)
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              {/* Download Buttons */}
              <div className="flex space-x-1">
                <button
                  onClick={() => downloadResults('excel')}
                  disabled={!auctionData.fileUploaded || downloadLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center"
                  title="Download Excel file with auction results"
                >
                  {downloadLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  )}
                  Excel
                </button>
                <button
                  onClick={() => downloadResults('csv')}
                  disabled={!auctionData.fileUploaded || downloadLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center"
                  title="Download CSV file with auction results"
                >
                  {downloadLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  )}
                  CSV
                </button>
              </div>
              
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats Bar */}
        {auctionData.fileUploaded && (
          <div className="mb-6 bg-white bg-opacity-15 backdrop-blur-xl rounded-xl shadow-2xl p-4 border-2 border-blue-200 border-opacity-50 hover:bg-opacity-25 transition-all duration-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{availablePlayersCount}</div>
                <div className="text-sm text-gray-600">Available</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{soldPlayersCount}</div>
                <div className="text-sm text-gray-600">Sold</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{unsoldPlayersCount}</div>
                <div className="text-sm text-gray-600">Unsold</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{totalPlayersCount}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>
        )}

        {/* File Upload Warning */}
        {!auctionData.fileUploaded && (
          <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  No player data uploaded
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Please upload a CSV or Excel file with player data to begin the auction.
                </p>
              </div>
              <div className="ml-3">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Upload Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm flex items-center transition-colors group relative`}
                title={tab.description}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
                
                {tab.subCount !== undefined && tab.subCount > 0 && (
                  <span className="ml-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {tab.subCount}
                  </span>
                )}
                
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {tab.badge}
                  </span>
                )}
                
                {tab.id === 'upload' && !auctionData.fileUploaded && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full animate-pulse">
                    Required
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <PlayerUpload 
                onUploadSuccess={handleUploadSuccess}
                onDataRefresh={onDataRefresh}
              />
              
              {/* Upload Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📋 Upload Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Required column: <strong>Name</strong></li>
                  <li>• Optional columns: Sl.No, Role/Category, Role, Category</li>
                  <li>• Supported formats: .xlsx, .xls, .csv</li>
                  <li>• Players with "Captain" in their role will be available for manual assignment</li>
                  <li>• Files are processed in memory only - not saved permanently</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'players' && (
            <div className="space-y-6">
              {auctionData.fileUploaded && auctionData.players?.length > 0 ? (
                <PlayersList 
                  players={auctionData.players}
                  teams={auctionData.teams}
                  currentBid={auctionData.currentBid}
                  auctionStatus={auctionData.auctionStatus}
                />
              ) : (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    {!auctionData.fileUploaded ? (
                      <div>
                        <div className="text-6xl mb-4">📁</div>
                        <h3 className="text-lg font-medium mb-2 text-gray-900">No Player File Uploaded</h3>
                        <p className="text-gray-600 mb-6">Please upload a player file first to see the players list.</p>
                        <button
                          onClick={() => setActiveTab('upload')}
                          className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 font-medium"
                        >
                          Upload Players
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="text-6xl mb-4">🚫</div>
                        <h3 className="text-lg font-medium mb-2 text-gray-900">No Valid Players Found</h3>
                        <p className="text-gray-600 mb-6">The uploaded file doesn't contain any valid players.</p>
                        <button
                          onClick={() => setActiveTab('upload')}
                          className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 font-medium"
                        >
                          Upload New File
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="space-y-6">
              {auctionData.fileUploaded ? (
                <>
                  <TeamManagement 
                    teams={auctionData.teams || []} 
                    auctionData={auctionData}
                    onTeamsUpdate={onDataRefresh}
                    onPlayersUpdate={onDataRefresh}
                  />
                  <TeamsDisplay 
                    teams={auctionData.teams || []}
                    players={auctionData.players || []}
                  />
                </>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-4">🏏</div>
                    <h3 className="text-lg font-medium mb-2 text-gray-900">Teams Not Available</h3>
                    <p className="text-gray-600 mb-6">Please upload a player file first to initialize teams.</p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 font-medium"
                    >
                      Upload Players
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'auction' && (
            <AuctionControls 
              auctionData={auctionData}
              socket={socket}
            />
          )}

          {activeTab === 'reset' && (
            <ResetControls 
              auctionData={auctionData}
              onReset={onDataRefresh}
            />
          )}

          {activeTab === 'stats' && (
            <StatsDisplay 
              stats={auctionData.stats || {}}
              teams={auctionData.teams || []}
              players={auctionData.players || []}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
