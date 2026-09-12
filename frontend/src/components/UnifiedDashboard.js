import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PlayerUploadModal from './PlayerUploadModal';
import TeamManagement from './TeamManagement';
import ResetControls from './ResetControls';
import PlayersList from './PlayersList';
import PlayerFormModal from './PlayerFormModal';
import TeamSquadsModal from './TeamSquadsModal';
import StatsDisplay from './StatsDisplay';
import SubAdminManagement from './SubAdminManagement';
import Header from './Header';
import LiveBiddingCard from './LiveBiddingCard';
import ShareAuctionModal from './ShareAuctionModal';
import BrandFooter from './BrandFooter';
import SaleCelebration from './SaleCelebration';
import { useNotification } from './NotificationSystem';
import { useTheme } from '../ThemeContext';
import { API_BASE_URL } from '../config';
import { computeNextBid } from '../domain/bidding';
import { formatCurrency, cleanTeamName } from '../lib/format';
import { setActiveCurrency } from '../lib/currency';
import useAuth from '../features/auction/hooks/useAuth';
import useAuctionData from '../features/auction/hooks/useAuctionData';
import StatCards from '../features/auction/StatCards';
import TabNav from '../features/auction/TabNav';
import LiveStatusPanel from '../features/auction/LiveStatusPanel';
import SmartRandomStage from '../features/auction/SmartRandomStage';
import EditSettingsModal from '../features/auction/EditSettingsModal';
import { buildDashboardTabs } from '../features/auction/tabs';
import useTransactionHistory from '../features/auction/hooks/useTransactionHistory';
import TeamSetupModal from '../features/teams/TeamSetupModal';
import PlayerFilterChips from '../features/players/PlayerFilterChips';
import SpectatorPlayerGroups from '../features/players/SpectatorPlayerGroups';

import TeamSquadViewer from '../features/teams/TeamSquadViewer';

// Main UnifiedDashboard Component
const UnifiedDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning, showInfo, confirm } = useNotification();
  const { theme } = useTheme();
  // Full-screen SOLD/UNSOLD celebration overlay
  const [celebration, setCelebration] = useState(null);

  const { isAdmin, userRole, logout } = useAuth(location);
  const [activeTab, setActiveTab] = useState('live');
  // Smart Random / mystery-reveal flow UI state.
  const [selectionMode, setSelectionMode] = useState('all');
  const [selectionBusy, setSelectionBusy] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const {
    transactionHistory,
    setTransactionHistory,
    addTransaction,
    initializeTransactionHistory,
    currentPage,
    setCurrentPage,
    transactionsPerPage,
  } = useTransactionHistory();
  const {
    auctionData,
    setAuctionData,
    loading,
    fetchAuctionData,
    handleTeamsUpdate,
    handlePlayersUpdate,
  } = useAuctionData({
    addTransaction,
    setTransactionHistory,
    setCurrentPage,
    setCelebration,
    notify: { showSuccess, showWarning, showInfo },
  });

  // Seed the activity feed once from the initial data; afterwards the socket
  // events own it (re-running would re-add undone sales via a race).
  const hasInitedTx = useRef(false);
  useEffect(() => {
    if (auctionData && !hasInitedTx.current) {
      hasInitedTx.current = true;
      initializeTransactionHistory(auctionData);
    }
  }, [auctionData, initializeTransactionHistory]);

  // Spectator filter state for All Players tab
  const [spectatorPlayerFilter, setSpectatorPlayerFilter] = useState('all');
  const [showShareModal, setShowShareModal] = useState(false);
  // Custom / big-bid controls
  const [customBidTeamId, setCustomBidTeamId] = useState('');
  const [customBidAmount, setCustomBidAmount] = useState('');

  // Download dropdown state
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  // Upload Players modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  // Import from Registrations modal state
  const [showRegImport, setShowRegImport] = useState(false);
  const [regEvents, setRegEvents] = useState([]);
  const [regSelected, setRegSelected] = useState('');
  const [regBusy, setRegBusy] = useState(false);
  // Add Player (manual, from empty state) modal
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  // Designed team squads (PDF/PNG) modal
  const [showTeamSquadsModal, setShowTeamSquadsModal] = useState(false);
  // Team Setup modal (team naming, captains, retention) — replaces the Manage tab
  const [showTeamSetup, setShowTeamSetup] = useState(false);
  // Edit Settings modal state
  const [showEditSettingsModal, setShowEditSettingsModal] = useState(false);
  const [settingsConfig, setSettingsConfig] = useState({
    teamCount: 4,
    startingBudget: 1000,
    maxPlayersPerTeam: 15,
    basePrice: 10,
    biddingIncrements: [
      { threshold: 50, increment: 5 },
      { threshold: 100, increment: 10 },
      { threshold: 200, increment: 20 },
    ],
  });
  const [settingsSaveLoading, setSettingsSaveLoading] = useState(false);

  // Undo functionality states
  const [undoLoading, setUndoLoading] = useState(false);
  const [actionHistory, setActionHistory] = useState([]);
  const [showUndoConfirmModal, setShowUndoConfirmModal] = useState(false);
  const [undoConfirmAction, setUndoConfirmAction] = useState(null);

  // Auction toggle state
  const [auctionToggleLoading, setAuctionToggleLoading] = useState(false);

  // Memoized player lists for performance - MUST BE BEFORE ANY CONDITIONAL RETURNS
  // Captains: derive from teams[].captain so admin-assigned captains (any
  // category) are reflected, and fall back to legacy category==='captain'.
  const captains = useMemo(() => {
    const allPlayers = auctionData?.players || [];
    const allTeams = auctionData?.teams || [];
    const fromTeams = allTeams
      .map((t) => (t.captain ? allPlayers.find((p) => p.id === t.captain) : null))
      .filter(Boolean);
    const legacy = allPlayers.filter(
      (p) => p.category === 'captain' && !fromTeams.some((c) => c.id === p.id)
    );
    return [...fromTeams, ...legacy];
  }, [auctionData?.players, auctionData?.teams]);
  const soldPlayers = useMemo(
    () =>
      auctionData?.players?.filter((p) => p.status === 'sold' && p.category !== 'captain') || [],
    [auctionData?.players]
  );
  const retainedPlayers = useMemo(
    () => auctionData?.players?.filter((p) => p.status === 'retained') || [],
    [auctionData?.players]
  );
  const availablePlayers = useMemo(
    () =>
      auctionData?.players?.filter((p) => p.status === 'available' && p.category !== 'captain') ||
      [],
    [auctionData?.players]
  );
  const unsoldPlayers = useMemo(
    () => auctionData?.players?.filter((p) => p.status === 'unsold') || [],
    [auctionData?.players]
  );

  // Smart Random: server picks a random eligible player and locks it.
  const handlePickPlayer = async () => {
    setSelectionBusy(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auction/selection/pick`, { mode: selectionMode });
    } catch (error) {
      showError(error.response?.data?.error || 'Could not pick a player');
    } finally {
      setSelectionBusy(false);
    }
  };

  const handleRevealPlayer = async () => {
    setSelectionBusy(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auction/selection/reveal`);
    } catch (error) {
      showError(error.response?.data?.error || 'Could not reveal the player');
    } finally {
      setSelectionBusy(false);
    }
  };

  // Undo a pick so the admin can change the category and pick again.
  const handleCancelSelection = async () => {
    setSelectionBusy(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auction/selection/cancel`);
    } catch (error) {
      showError(error.response?.data?.error || 'Could not cancel the selection');
    } finally {
      setSelectionBusy(false);
    }
  };

  // Bid: hand the revealed player to the existing bidding flow.
  const handleBidSelected = async (playerId) => {
    setSelectionBusy(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auction/bidding/start/${playerId}`);
      setActiveTab('live');
    } catch (error) {
      showError(error.response?.data?.error || 'Could not start bidding');
    } finally {
      setSelectionBusy(false);
    }
  };

  // Feature flags: captains default ON, retention default OFF. When a feature
  // is off we hide its stat card, player filter and Team Setup section.
  const enableCaptains = auctionData?.settings?.enableCaptains !== false;
  const enableRetention = auctionData?.settings?.enableRetention === true;

  // Keep the shared currency formatter in sync with the auction's setting.
  if (auctionData?.settings?.currency) setActiveCurrency(auctionData.settings.currency);

  // Live auction state (socket connection + fetch) is owned by useAuctionData.


  // Coming straight from Auction Setup: open Team Setup once so the admin can name
  // teams and assign captains/retentions. Clear the history state so a refresh
  // doesn't reopen it. Runs once on mount.
  useEffect(() => {
    if (location.state?.isAdmin !== false && location.state?.openTeamSetup) {
      setShowTeamSetup(true);
      navigate(location.pathname, {
        replace: true,
        state: { ...location.state, openTeamSetup: false },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Transaction history is owned by useTransactionHistory (seeds once from data,
  // then socket events via addTransaction are the source of truth).

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadDropdown && !event.target.closest('.download-dropdown')) {
        setShowDownloadDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadDropdown]);

  // Action history fetch function
  const fetchActionHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auction/history`);
      setActionHistory(response.data.history);
    } catch (error) {
      console.error('Error fetching action history:', error);
    }
  }, []);

  // Fetch action history for super-admin
  useEffect(() => {
    if (userRole === 'super-admin' && isAdmin) {
      fetchActionHistory();
    }
  }, [userRole, isAdmin, fetchActionHistory]);

  // Undo functionality functions
  const handleUndoLastSale = useCallback(async () => {
    const lastAction = actionHistory.find(
      (action) => action.type === 'PLAYER_SOLD' || action.type === 'PLAYER_UNSOLD'
    );

    if (!lastAction) {
      showError('No sale or unsold action to undo');
      return;
    }

    const actionType = lastAction.type === 'PLAYER_SOLD' ? 'sale' : 'unsold';
    const message =
      actionType === 'sale'
        ? 'Are you sure you want to undo the last sale? This will refund the money to the team and make the player available again.'
        : `Are you sure you want to undo the unsold action? This will make ${lastAction.playerName} available for bidding again.`;

    setUndoConfirmAction({
      type: actionType,
      message,
      action: async () => {
        setUndoLoading(true);
        try {
          // Socket 'saleUndone' broadcasts the single notification to everyone.
          await axios.post(`${API_BASE_URL}/api/auction/undo/sale`);
          fetchActionHistory();
        } catch (error) {
          showError(error.response?.data?.error || 'Failed to undo action');
        } finally {
          setUndoLoading(false);
        }
      },
    });
    setShowUndoConfirmModal(true);
  }, [actionHistory, showError, fetchActionHistory]);

  const handleUndoCurrentBid = useCallback(async () => {
    setUndoConfirmAction({
      type: 'bid',
      message:
        "Are you sure you want to undo the current bid? This will revert to the previous team's bid or base price.",
      action: async () => {
        setUndoLoading(true);
        try {
          // Socket 'bidUndone' broadcasts the single notification to everyone.
          await axios.post(`${API_BASE_URL}/api/auction/undo/bid`);
        } catch (error) {
          showError(error.response?.data?.error || 'Failed to undo bid');
        } finally {
          setUndoLoading(false);
        }
      },
    });
    setShowUndoConfirmModal(true);
  }, [showError]);

  const executeUndoAction = async () => {
    setShowUndoConfirmModal(false);
    if (undoConfirmAction) {
      await undoConfirmAction.action();
    }
    setUndoConfirmAction(null);
  };

  const cancelUndoAction = () => {
    setShowUndoConfirmModal(false);
    setUndoConfirmAction(null);
  };

  // Keyboard shortcuts for Super Admin
  useEffect(() => {
    if (userRole !== 'super-admin') return;

    const handleKeyDown = (e) => {
      // Prevent keyboard shortcuts when typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Ctrl+Z or Cmd+Z: Smart undo (bid if active, otherwise last sale/unsold)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (undoLoading) return;

        if (auctionData?.currentBid) {
          handleUndoCurrentBid();
        } else {
          handleUndoLastSale();
        }
      }

      // Ctrl+Shift+Z: Undo Last Sale/Unsold
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        if (!undoLoading) {
          handleUndoLastSale();
        }
      }

      // Ctrl+B: Undo Last Bid
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        if (auctionData?.currentBid && !undoLoading) {
          handleUndoCurrentBid();
        }
      }

      // Number keys 1-9: Quick team bidding (only if teams < 10)
      const teams = auctionData?.teams || [];
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 9 && teams.length < 10 && teams.length >= keyNum) {
          e.preventDefault();
          if (auctionData?.currentBid?.playerId) {
            const team = teams[keyNum - 1];
            if (team) {
              // Same guards as the on-screen bid buttons.
              const nextBidAmount = computeNextBid(auctionData.currentBid, auctionData.settings);
              const maxPlayers = auctionData.settings?.maxPlayersPerTeam || 15;
              if (team.players?.length >= maxPlayers) {
                showError(
                  `Team ${cleanTeamName(team.name)} is full (${team.players?.length}/${maxPlayers} players)`
                );
                return;
              }
              if (team.budget < nextBidAmount) {
                showError(
                  `Insufficient budget for ${cleanTeamName(team.name)} (${formatCurrency(team.budget)})`
                );
                return;
              }
              axios
                .post(`${API_BASE_URL}/api/auction/bidding/place`, { teamId: team.id })
                .catch((error) => showError(error.response?.data?.error || 'Failed to place bid'));
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    userRole,
    undoLoading,
    auctionData,
    actionHistory,
    handleUndoLastSale,
    handleUndoCurrentBid,
    showError,
  ]);

  const handleUploadSuccess = (data) => {
    showSuccess(`Successfully uploaded ${data.playerCount} players from ${data.fileName}`);
    // Refresh auction data after successful upload
    fetchAuctionData();
  };

  // Open the "From Registrations" import modal and load available events.
  const openRegImport = async () => {
    setShowRegImport(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/registrations/events`);
      setRegEvents(res.data.events || []);
    } catch (e) {
      showError(e.response?.data?.error || 'Could not load registration events');
    }
  };

  const doRegImport = async () => {
    if (!regSelected) return;
    setRegBusy(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/registrations/events/${regSelected}/import-to-auction`
      );
      showSuccess(res.data.message || 'Imported players from registrations');
      setShowRegImport(false);
      setRegSelected('');
      fetchAuctionData();
    } catch (e) {
      showError(e.response?.data?.error || 'Import failed');
    } finally {
      setRegBusy(false);
    }
  };

  // fetchAuctionData + team/player update callbacks are provided by useAuctionData.

  // Toggle a feature flag (captains / retention). Persists + broadcasts via the
  // backend; the socket 'settingsUpdated' also refreshes other clients.
  const handleToggleFeature = async (key, value) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auction/features`, { [key]: value });
      if (data?.settings) setAuctionData((prev) => ({ ...prev, settings: data.settings }));
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to update feature');
    }
  };

  const downloadResults = async (format = 'excel') => {
    try {
      const endpoint =
        format === 'csv'
          ? `${API_BASE_URL}/api/download-results-csv`
          : `${API_BASE_URL}/api/download-results`;
      const response = await axios.get(endpoint, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = `auction-results.${format === 'csv' ? 'csv' : 'xlsx'}`;
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

      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      showSuccess(`${format.toUpperCase()} results downloaded successfully`);
    } catch (error) {
      console.error('Error downloading results:', error);
      showError(`Error downloading ${format} results`);
    }
  };

  const downloadSaleLog = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/download-sale-log`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'sale-log.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) filename = filenameMatch[1].replace(/['"]/g, '');
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      showSuccess('Sale log downloaded successfully');
    } catch (error) {
      console.error('Error downloading sale log:', error);
      showError('Error downloading sale log');
    }
  };

  const downloadBackup = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/download-backup`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'auction-backup.json';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) filename = filenameMatch[1].replace(/['"]/g, '');
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      showSuccess('Backup downloaded successfully');
    } catch (error) {
      console.error('Error downloading backup:', error);
      showError('Error downloading backup');
    }
  };

  // Settings modal functions
  const handleOpenEditSettings = async () => {
    try {
      // Fetch current auction configuration
      const response = await axios.get(`${API_BASE_URL}/api/auction/config`);
      if (response.data.config) {
        setSettingsConfig(response.data.config);
      }
      setShowEditSettingsModal(true);
    } catch (error) {
      console.error('Error fetching auction config:', error);
      showError('Error loading auction settings');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSettingsSaveLoading(true);

      // Validate settings
      if (settingsConfig.teamCount < 2) {
        showError('Team count must be at least 2');
        setSettingsSaveLoading(false);
        return;
      }
      if (settingsConfig.startingBudget < 100) {
        showError('Starting budget must be at least 100');
        setSettingsSaveLoading(false);
        return;
      }
      if (settingsConfig.maxPlayersPerTeam < 5) {
        showError('Max players per team must be at least 5');
        setSettingsSaveLoading(false);
        return;
      }
      if (settingsConfig.basePrice < 1) {
        showError('Base price must be at least 1');
        setSettingsSaveLoading(false);
        return;
      }

      // Update auction configuration
      const response = await axios.put(`${API_BASE_URL}/api/auction/config`, settingsConfig);

      if (response.data.success) {
        showSuccess('Auction settings updated successfully');
        setShowEditSettingsModal(false);
        // Refresh auction data to reflect new settings
        const dataResponse = await axios.get(`${API_BASE_URL}/api/auction/data`);
        setAuctionData(dataResponse.data);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showError(error.response?.data?.error || 'Error saving auction settings');
    } finally {
      setSettingsSaveLoading(false);
    }
  };

  const handleSettingsConfigChange = (field, value) => {
    setSettingsConfig((prev) => ({
      ...prev,
      [field]: value === '' ? '' : value,
    }));
  };

  const handleSettingsIncrementChange = (index, field, value) => {
    const newIncrements = [...settingsConfig.biddingIncrements];

    if (value === '') {
      newIncrements[index] = {
        ...newIncrements[index],
        [field]: '',
      };
      setSettingsConfig((prev) => ({
        ...prev,
        biddingIncrements: newIncrements,
      }));
      return;
    }

    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue) && numericValue >= 0) {
      newIncrements[index] = {
        ...newIncrements[index],
        [field]: numericValue,
      };
      setSettingsConfig((prev) => ({
        ...prev,
        biddingIncrements: newIncrements,
      }));
    }
  };

  const addSettingsIncrement = () => {
    setSettingsConfig((prev) => ({
      ...prev,
      biddingIncrements: [...prev.biddingIncrements, { threshold: 0, increment: 5 }],
    }));
  };

  const removeSettingsIncrement = (index) => {
    if (settingsConfig.biddingIncrements.length > 1) {
      const newIncrements = settingsConfig.biddingIncrements.filter((_, i) => i !== index);
      setSettingsConfig((prev) => ({
        ...prev,
        biddingIncrements: newIncrements,
      }));
    }
  };

  // Handle auction toggle for Header component - Only for admin roles
  const handleAuctionToggle = async (newState) => {
    // Check if user has admin permissions
    if (!isAdmin) {
      showError('Only administrators can control auction status');
      return;
    }

    try {
      setAuctionToggleLoading(true);

      if (newState) {
        await axios.post(`${API_BASE_URL}/api/auction/start`);
      } else {
        await axios.post(`${API_BASE_URL}/api/auction/stop`);
      }
    } catch (error) {
      console.error('Error toggling auction:', error);
      showError(error.response?.data?.error || 'Error toggling auction');
    } finally {
      setAuctionToggleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-root min-h-screen flex items-center justify-center" data-theme={theme}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Connecting to auction...</p>
        </div>
      </div>
    );
  }

  if (!auctionData) {
    return (
      <div className="dash-root min-h-screen flex items-center justify-center" data-theme={theme}>
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏏</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Auction Data</h2>
          <p className="text-gray-600 mb-6">
            Unable to load auction data. Please check your connection.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-900 hover:-translate-y-0.5 active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150 px-6 py-3 rounded-xl font-semibold transition-[background-color,box-shadow,transform,border-color] duration-150 hover:-translate-y-0.5 active:translate-y-0"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = auctionData.currentBid
    ? auctionData.players?.find((p) => p.id === auctionData.currentBid.playerId)
    : null;

  const biddingTeam =
    auctionData.currentBid && auctionData.currentBid.biddingTeam
      ? auctionData.teams?.find((t) => t.id === parseInt(auctionData.currentBid.biddingTeam))
      : null;

  // Define tabs based on user role
  const canConfigure = ['super-admin', 'admin'].includes(userRole);

  const tabs = buildDashboardTabs({
    isAdmin,
    userRole,
    playersCount: auctionData.players?.length || 0,
    teamsCount: auctionData.teams?.length || 0,
    unsoldCount: unsoldPlayers.length,
  });

  return (
    <div className="gbx-dashboard dash-root min-h-screen overflow-x-hidden" data-theme={theme}>
      {/* SOLD / UNSOLD celebration overlay */}
      <SaleCelebration celebration={celebration} onDone={() => setCelebration(null)} />
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto space-y-2 z-50 max-w-sm sm:max-w-sm">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`max-w-sm p-4 rounded-lg shadow-lg border-l-4 transform transition-colors duration-200 ${
                notification.type === 'success'
                  ? 'bg-green-50 border-green-400 text-green-800'
                  : notification.type === 'error'
                    ? 'bg-red-50 border-red-400 text-red-800'
                    : notification.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                      : 'bg-blue-50 border-blue-400 text-blue-800'
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
                  onClick={() =>
                    setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
                  }
                  className="ml-3 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Modern Header */}
      <Header
        username={
          userRole === 'super-admin'
            ? 'Super Admin'
            : userRole === 'admin'
              ? 'Admin'
              : userRole === 'sub-admin'
                ? 'Sub-Admin'
                : userRole === 'spectator'
                  ? 'Spectator'
                  : 'User'
        }
        userRole={userRole}
        onLogout={logout}
        isAuctionOn={['running', 'fast-track'].includes(auctionData.auctionStatus)}
        onToggleAuction={isAdmin ? handleAuctionToggle : null}
        auctionLoading={auctionToggleLoading}
        showDownloadOptions={auctionData.fileUploaded}
        onDownloadExcel={() => downloadResults('excel')}
        onDownloadSaleLog={downloadSaleLog}
        onOpenTeamSquads={() => setShowTeamSquadsModal(true)}
        onDownloadBackup={downloadBackup}
        canBackup={isAdmin && canConfigure}
        onUploadPlayers={() => setShowUploadModal(true)}
        onEditSettings={isAdmin ? handleOpenEditSettings : null}
        onOpenTeamSetup={isAdmin && canConfigure ? () => setShowTeamSetup(true) : null}
        onUndoLastSale={handleUndoLastSale}
        canUndoLastSale={actionHistory.some(
          (action) => action.type === 'PLAYER_SOLD' || action.type === 'PLAYER_UNSOLD'
        )}
        undoLoading={undoLoading}
        auctionStatus={auctionData.auctionStatus}
      />

      {/* Current Bid Indicator - only show when there's an active bid */}
      {auctionData.currentBid && (
        <div className="gbx-current-bid-banner bg-white bg-opacity-20 border-b border-white border-opacity-30 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <div className="gbx-current-bid-pill px-4 py-2 rounded-full text-sm font-bold bg-amber-400 text-slate-900 animate-pulse shadow-lg border border-amber-500">
                💰 Current Bid: {formatCurrency(auctionData.currentBid.currentAmount)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="gbx-dashboard-content max-w-7xl mx-auto mt-5 sm:mt-6 px-4 sm:px-6 lg:px-8 py-8 rounded-2xl border border-white/60 bg-white/55 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_12px_28px_-16px_rgba(15,23,42,0.18)]">
        {/* Smart Random / mystery-reveal stage — runs before live bidding */}
        {!auctionData.currentBid &&
          ['running', 'fast-track'].includes(auctionData.auctionStatus) &&
          (isAdmin || auctionData.selection) && (
            <SmartRandomStage
              players={auctionData.players || []}
              selection={auctionData.selection}
              settings={auctionData.settings}
              isAdmin={isAdmin}
              mode={selectionMode}
              onModeChange={setSelectionMode}
              onPick={handlePickPlayer}
              onReveal={handleRevealPlayer}
              onCancel={handleCancelSelection}
              onBid={handleBidSelected}
              busy={selectionBusy}
            />
          )}
        {/* SINGLE Live Bidding Section - Visible to everyone */}
        {auctionData.currentBid && currentPlayer && (
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
                      const nextBidAmount = computeNextBid(
                        auctionData.currentBid,
                        auctionData.settings
                      );
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
                            const team = auctionData.teams?.find(
                              (t) => t.id === parseInt(customBidTeamId)
                            );
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
                          auctionData.currentBid?.currentAmount ??
                          (auctionData.settings?.basePrice || 0);
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
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
                            showError(
                              error.response?.data?.error || 'Error cancelling bidding',
                              'Error'
                            );
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
                            showError(
                              error.response?.data?.error || 'Error cancelling bidding',
                              'Error'
                            );
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
        )}

        {/* Quick Stats */}
        <StatCards
          totalPlayers={auctionData.players?.length || 0}
          sold={soldPlayers.length}
          retained={retainedPlayers.length}
          captains={captains.length}
          available={availablePlayers.length}
          unsold={unsoldPlayers.length}
          enableCaptains={enableCaptains}
          enableRetention={enableRetention}
        />

        {/* Warning for spectators when no auction data */}
        {!auctionData.fileUploaded && !isAdmin && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
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
                <h3 className="text-sm font-medium text-yellow-800">No auction data available</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  The admin hasn't uploaded player data yet. Please check back later.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Permission Warning for Sub-Admins */}
        {userRole === 'sub-admin' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Sub-Admin Access</h3>
                <p className="mt-1 text-sm text-blue-700">
                  You have bidding permissions only. Configuration and file uploads require Admin or
                  Super Admin access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <TabNav tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />

        {/* Tab Content */}
        <div className="gbx-tab-content mt-4">
          {/* Live Status Tab - Available to everyone */}
          {activeTab === 'live' && (
            <LiveStatusPanel
              auctionData={auctionData}
              transactionHistory={transactionHistory}
              transactionsPerPage={transactionsPerPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              soldPlayers={soldPlayers}
              unsoldPlayers={unsoldPlayers}
              onShare={() => setShowShareModal(true)}
            />
          )}

          {/* Admin-only tabs with role restrictions */}
          {/* Upload Players moved to modal - see PlayerUploadModal component */}

          {isAdmin && activeTab === 'reset' && canConfigure && (
            <ResetControls auctionData={auctionData} onReset={fetchAuctionData} />
          )}

          {/* NEW: Sub-Admin Management Tab (admin and super-admin only) */}
          {isAdmin && activeTab === 'subadmins' && canConfigure && (
            <SubAdminManagement userRole={userRole} />
          )}

          {/* Access Denied for Sub-Admins trying to access config tabs */}
          {isAdmin && !canConfigure && ['upload', 'reset', 'subadmins'].includes(activeTab) && (
            <div className="text-center py-12 bg-white bg-opacity-25 rounded-lg border-2 border-red-300 border-opacity-60 shadow-xl">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-lg font-medium mb-2 text-gray-900">Access Restricted</h3>
              <p className="text-gray-600 mb-4">
                Sub-Admins can only perform bidding operations. Configuration access requires Admin
                or Super Admin role.
              </p>
              <button
                onClick={() => setActiveTab('live')}
                className="bg-amber-500 text-slate-900 px-6 py-3 rounded-xl hover:bg-amber-400 border border-amber-600/40 shadow-md font-semibold transition-all"
              >
                Go to Live Status
              </button>
            </div>
          )}

          {/* Access Denied for non-super-admins trying to access undo tab */}
          {isAdmin && activeTab === 'undo' && userRole !== 'super-admin' && (
            <div className="text-center py-12 bg-white bg-opacity-25 rounded-lg border-2 border-red-300 border-opacity-60 shadow-xl">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-lg font-medium mb-2 text-gray-900">
                Super Admin Access Required
              </h3>
              <p className="text-gray-600 mb-4">
                Undo controls are restricted to Super Admins only for safety and audit purposes.
              </p>
              <button
                onClick={() => setActiveTab('live')}
                className="bg-amber-500 text-slate-900 px-6 py-3 rounded-xl hover:bg-amber-400 border border-amber-600/40 shadow-md font-semibold transition-all"
              >
                Go to Live Status
              </button>
            </div>
          )}

          {/* Players Tab - Enhanced for both admin and spectators */}
          {activeTab === 'players' && (
            <div className="gbx-tabpanel-players space-y-6">
              {auctionData.fileUploaded && auctionData.players?.length > 0 ? (
                isAdmin ? (
                  <PlayersList
                    players={auctionData.players}
                    teams={auctionData.teams}
                    currentBid={auctionData.currentBid}
                    auctionStatus={auctionData.auctionStatus}
                    userRole={userRole}
                    onDataRefresh={fetchAuctionData}
                  />
                ) : (
                  // Spectator view of players
                  <div className="space-y-6">
                    <PlayerFilterChips
                      totalPlayers={auctionData.players?.length || 0}
                      sold={soldPlayers.length}
                      available={availablePlayers.length}
                      unsold={unsoldPlayers.length}
                      captains={captains.length}
                      retained={retainedPlayers.length}
                      enableCaptains={enableCaptains}
                      enableRetention={enableRetention}
                      active={spectatorPlayerFilter}
                      onSelect={setSpectatorPlayerFilter}
                    />

                    <SpectatorPlayerGroups
                      spectatorPlayerFilter={spectatorPlayerFilter}
                      teams={auctionData.teams}
                      captains={captains}
                      soldPlayers={soldPlayers}
                      availablePlayers={availablePlayers}
                      unsoldPlayers={unsoldPlayers}
                      retainedPlayers={retainedPlayers}
                    />
                  </div>
                )
              ) : (
                <div className="gbx-players-empty text-center py-12 bg-white bg-opacity-25 rounded-lg border-2 border-gray-300 border-opacity-60 shadow-xl">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-medium mb-2 text-gray-900">No Players Available</h3>
                  <p className="text-gray-600">
                    {!auctionData.fileUploaded
                      ? 'No player file has been uploaded yet.'
                      : "The uploaded file doesn't contain any valid players."}
                  </p>
                  {isAdmin && canConfigure && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="gbx-btn-upload-players mt-4 bg-amber-500 text-slate-900 px-6 py-3 rounded-xl hover:bg-amber-400 border border-amber-600/40 shadow-md font-semibold"
                    >
                      Upload Players
                    </button>
                  )}
                  {isAdmin && canConfigure && (
                    <button
                      onClick={() => setShowAddPlayerModal(true)}
                      className="gbx-btn-add-player mt-4 ml-3 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 border border-emerald-500/40 shadow-md"
                    >
                      ➕ Add Player Manually
                    </button>
                  )}
                  {isAdmin && canConfigure && (
                    <button
                      onClick={openRegImport}
                      className="gbx-btn-from-registrations mt-4 ml-3 bg-amber-500 text-slate-900 px-6 py-3 rounded-xl hover:bg-amber-400 border border-amber-400/40 shadow-md font-semibold"
                    >
                      📋 From Registrations
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Team Management Tab - For Admin: Team Management & Retention, For Spectators: Team Squad Viewer */}
          {activeTab === 'teams' && (
            <div className="gbx-tabpanel-teams space-y-6">
              {auctionData.fileUploaded ? (
                <>
                  {/* Admin Team Management (only for admin/super-admin) */}
                  {isAdmin && canConfigure && (
                    <TeamManagement
                      teams={auctionData.teams || []}
                      auctionData={auctionData}
                      onTeamsUpdate={handleTeamsUpdate}
                      onPlayersUpdate={handlePlayersUpdate}
                    />
                  )}

                  {/* Team Squad Viewer for Spectators only */}
                  {!isAdmin && (
                    <TeamSquadViewer
                      teams={auctionData.teams || []}
                      players={auctionData.players || []}
                      enableCaptains={enableCaptains}
                      enableRetention={enableRetention}
                    />
                  )}

                  {/* Message for admin when no team management access */}
                  {isAdmin && !canConfigure && (
                    <div className="text-center py-12 text-gray-500 bg-white bg-opacity-25 rounded-lg border-2 border-gray-300 border-opacity-60 shadow-xl">
                      <div className="text-6xl mb-4">🔐</div>
                      <h3 className="text-lg font-medium mb-2 text-gray-900">Access Restricted</h3>
                      <p className="text-gray-600">
                        Team management is only available to super-admin and admin roles.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Use the "Team Squads" tab to view team compositions.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 bg-white bg-opacity-25 rounded-lg border-2 border-gray-300 border-opacity-60 shadow-xl">
                  <div className="text-6xl mb-4">⚙️</div>
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">
                    Team Management Not Available
                  </h3>
                  <p className="text-lg font-semibold text-gray-700">
                    Team management features will be available once player data is uploaded.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Team Squads Tab - Dedicated tab for viewing team compositions */}
          {activeTab === 'teamsquads' && (
            <div className="gbx-tabpanel-teamsquads space-y-6">
              {auctionData.fileUploaded ? (
                <TeamSquadViewer
                  teams={auctionData.teams || []}
                  players={auctionData.players || []}
                  enableCaptains={enableCaptains}
                  enableRetention={enableRetention}
                />
              ) : (
                <div className="text-center py-12 text-gray-500 bg-white bg-opacity-25 rounded-lg border-2 border-gray-300 border-opacity-60 shadow-xl">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">
                    Team Squads Not Available
                  </h3>
                  <p className="text-lg font-semibold text-gray-700">
                    Team squads will be available once player data is uploaded.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Stats Tab - Available to everyone */}
          {activeTab === 'stats' && (
            <StatsDisplay
              stats={auctionData.stats || {}}
              teams={auctionData.teams || []}
              players={auctionData.players || []}
              settings={auctionData.settings || {}}
            />
          )}
        </div>
      </div>

      {/* Undo Confirmation Modal */}
      {showUndoConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white bg-opacity-25 rounded-xl shadow-2xl max-w-md w-full mx-auto border-2 border-red-400 border-opacity-70">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-center text-gray-900 mb-4">
                Confirm {undoConfirmAction?.type === 'sale' ? 'Sale Undo' : 'Bid Reversion'}
              </h3>

              <p className="text-sm text-gray-600 text-center mb-6">{undoConfirmAction?.message}</p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={cancelUndoAction}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-full border border-slate-200 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={executeUndoAction}
                  disabled={undoLoading}
                  className={`flex-1 font-medium py-2 px-4 rounded-md transition-colors ${
                    undoConfirmAction?.type === 'sale'
                      ? 'bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white hover:-translate-y-0.5 active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150'
                      : 'bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white hover:-translate-y-0.5 active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150'
                  } disabled:opacity-50`}
                >
                  {undoLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Processing...
                    </span>
                  ) : undoConfirmAction?.type === 'bid' ? (
                    '⏪ Revert Bid'
                  ) : undoConfirmAction?.type === 'unsold' ? (
                    '↩️ Undo Unsold'
                  ) : (
                    '↩️ Undo Sale'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Players Modal */}
      <PlayerUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
        onDataRefresh={fetchAuctionData}
      />

      {/* Import from Registrations Modal */}
      {showRegImport && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowRegImport(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Import from Registrations</h3>
            <p className="text-sm text-gray-500 mb-4">
              Bring in approved players from a registration event into this auction.
            </p>
            <select
              value={regSelected}
              onChange={(e) => setRegSelected(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-4 text-gray-900"
            >
              <option value="">Select an event…</option>
              {regEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                  {ev.counts ? ` (${ev.counts.verified || 0} approved)` : ''}
                </option>
              ))}
            </select>
            {regEvents.length === 0 && (
              <p className="text-xs text-gray-400 mb-4">
                No registration events found. Create one in the organizer console.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRegImport(false)}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={doRegImport}
                disabled={regBusy || !regSelected}
                className="rounded-full bg-emerald-600 text-white px-5 py-2 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
              >
                {regBusy ? 'Importing…' : 'Import players'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Player Manually Modal (from empty state) */}
      <PlayerFormModal
        isOpen={showAddPlayerModal}
        mode="add"
        onClose={() => setShowAddPlayerModal(false)}
      />

      {/* Designed Team Squads (PDF / PNG) Modal */}
      <TeamSquadsModal
        isOpen={showTeamSquadsModal}
        onClose={() => setShowTeamSquadsModal(false)}
        teams={auctionData.teams || []}
        players={auctionData.players || []}
      />

      {/* Team Setup Modal — team naming, captains, retention (replaces Manage tab) */}
      <TeamSetupModal
        open={showTeamSetup}
        onClose={() => setShowTeamSetup(false)}
        auctionData={auctionData}
        enableCaptains={enableCaptains}
        enableRetention={enableRetention}
        onToggleFeature={handleToggleFeature}
        onTeamsUpdate={handleTeamsUpdate}
        onPlayersUpdate={handlePlayersUpdate}
      />

      <ShareAuctionModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={window.location.origin}
      />

      {/* Edit Settings Modal */}
      <EditSettingsModal
        open={showEditSettingsModal}
        onClose={() => setShowEditSettingsModal(false)}
        config={settingsConfig}
        onChange={handleSettingsConfigChange}
        onIncrementChange={handleSettingsIncrementChange}
        onAddIncrement={addSettingsIncrement}
        onRemoveIncrement={removeSettingsIncrement}
        onSave={handleSaveSettings}
        saving={settingsSaveLoading}
      />

      <BrandFooter />
    </div>
  );
};

export default UnifiedDashboard;
