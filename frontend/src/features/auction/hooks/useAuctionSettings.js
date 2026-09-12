import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';

// Owns the Edit Settings modal's working config + validation/save. On save it
// refreshes auction data so the new settings propagate. Extracted verbatim from
// UnifiedDashboard — behavior is intentionally unchanged.
export default function useAuctionSettings({
  showError,
  showSuccess,
  setShowEditSettingsModal,
  setAuctionData,
}) {
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

  const handleOpenEditSettings = async () => {
    try {
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

      const response = await axios.put(`${API_BASE_URL}/api/auction/config`, settingsConfig);

      if (response.data.success) {
        showSuccess('Auction settings updated successfully');
        setShowEditSettingsModal(false);
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
      newIncrements[index] = { ...newIncrements[index], [field]: '' };
      setSettingsConfig((prev) => ({ ...prev, biddingIncrements: newIncrements }));
      return;
    }

    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue) && numericValue >= 0) {
      newIncrements[index] = { ...newIncrements[index], [field]: numericValue };
      setSettingsConfig((prev) => ({ ...prev, biddingIncrements: newIncrements }));
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
      setSettingsConfig((prev) => ({ ...prev, biddingIncrements: newIncrements }));
    }
  };

  return {
    settingsConfig,
    settingsSaveLoading,
    handleOpenEditSettings,
    handleSaveSettings,
    handleSettingsConfigChange,
    handleSettingsIncrementChange,
    addSettingsIncrement,
    removeSettingsIncrement,
  };
}
