import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AuctionSetup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Configuration state
  const [config, setConfig] = useState({
    teamCount: 4,
    startingBudget: 1000,
    maxPlayersPerTeam: 15,
    basePrice: 10,
    biddingIncrements: [
      { threshold: 50, increment: 5 },
      { threshold: 100, increment: 10 },
      { threshold: 200, increment: 20 }
    ]
  });

  // File upload state
  const [fileData, setFileData] = useState({
    file: null,
    fileName: '',
    preview: null,
    validation: null
  });

  const handleConfigChange = (field, value) => {
    // Allow empty string so user can clear and type new value
    // Only apply defaults during validation, not during typing
    setConfig(prev => ({
      ...prev,
      [field]: value === '' ? '' : value
    }));
  };

  const handleIncrementChange = (index, field, value) => {
    const newIncrements = [...config.biddingIncrements];
    
    // Handle empty string - allow user to clear and type new value
    if (value === '') {
      newIncrements[index] = {
        ...newIncrements[index],
        [field]: ''
      };
      setConfig(prev => ({
        ...prev,
        biddingIncrements: newIncrements
      }));
      return;
    }
    
    // Convert to number - accepting the raw value from input
    const numericValue = parseInt(value, 10);
    
    // Only update if it's a valid positive number
    if (!isNaN(numericValue) && numericValue >= 0) {
      newIncrements[index] = {
        ...newIncrements[index],
        [field]: numericValue
      };
      setConfig(prev => ({
        ...prev,
        biddingIncrements: newIncrements
      }));
    }
    // If invalid, do nothing (keep previous value)
  };

  const addIncrement = () => {
    setConfig(prev => ({
      ...prev,
      biddingIncrements: [
        ...prev.biddingIncrements,
        { threshold: 0, increment: 5 }
      ]
    }));
  };

  const removeIncrement = (index) => {
    if (config.biddingIncrements.length > 1) {
      const newIncrements = config.biddingIncrements.filter((_, i) => i !== index);
      setConfig(prev => ({
        ...prev,
        biddingIncrements: newIncrements
      }));
    }
  };

  const moveIncrement = (index, direction) => {
    const newIncrements = [...config.biddingIncrements];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newIncrements.length) {
      // Swap elements
      [newIncrements[index], newIncrements[targetIndex]] = [newIncrements[targetIndex], newIncrements[index]];
      setConfig(prev => ({
        ...prev,
        biddingIncrements: newIncrements
      }));
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('playerFile', file);

  const response = await axios.post(`${API_BASE_URL}/api/players/validate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFileData({
        file,
        fileName: file.name,
        preview: response.data.preview,
        validation: response.data
      });

    } catch (error) {
      console.error('File validation error:', error);
      setError(error.response?.data?.error || 'Error validating file');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinishSetup = async () => {
    setLoading(true);
    setError('');

    try {
      // Prepare config with proper numeric values (convert empty strings to defaults if needed)
      const sanitizedConfig = {
        teamCount: typeof config.teamCount === 'number' ? config.teamCount : 4,
        startingBudget: typeof config.startingBudget === 'number' ? config.startingBudget : 1000,
        maxPlayersPerTeam: typeof config.maxPlayersPerTeam === 'number' ? config.maxPlayersPerTeam : 15,
        basePrice: typeof config.basePrice === 'number' ? config.basePrice : 10,
        biddingIncrements: config.biddingIncrements
      };

      // First, save auction settings
      await axios.post(`${API_BASE_URL}/api/auction/settings`, sanitizedConfig);

      // Then upload players file
      if (fileData.file) {
        const formData = new FormData();
        formData.append('playerFile', fileData.file);
        await axios.post(`${API_BASE_URL}/api/players/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Navigate to unified dashboard
      navigate('/dashboard', { state: { isAdmin: true } });

    } catch (error) {
      console.error('Setup error:', error);
      setError(error.response?.data?.error || 'Error completing setup');
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        // Ensure all fields have valid numeric values (not empty strings)
        return typeof config.teamCount === 'number' && config.teamCount >= 2 && config.teamCount <= 16 &&
               typeof config.startingBudget === 'number' && config.startingBudget >= 100 &&
               typeof config.maxPlayersPerTeam === 'number' && config.maxPlayersPerTeam >= 5 && config.maxPlayersPerTeam <= 25 &&
               typeof config.basePrice === 'number' && config.basePrice >= 5;
      case 2:
        return config.biddingIncrements.length > 0 && 
               config.biddingIncrements.every(inc => 
                 (typeof inc.threshold === 'number' && inc.threshold >= 0) && 
                 (typeof inc.increment === 'number' && inc.increment > 0)
               );
      case 3:
        return fileData.file && fileData.validation?.valid;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900">
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="pt-8 pb-4">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
              🏏 Auction Setup
            </h1>
            <p className="text-xl text-blue-200 font-light">
              Configure your cricket auction settings
            </p>
          </div>
        </header>

        {/* Progress Indicator */}
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white bg-opacity-20 text-blue-200'
                }`}>
                  {currentStep > step ? '✓' : step}
                </div>
                <div className="ml-3 text-white">
                  <div className="text-sm font-medium">
                    {step === 1 && 'Basic Settings'}
                    {step === 2 && 'Bidding Rules'}
                    {step === 3 && 'Upload Players'}
                  </div>
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-4 ${
                    currentStep > step ? 'bg-green-500' : 'bg-white bg-opacity-20'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-2xl w-full">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20">
              
              {/* Step 1: Basic Settings */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-white text-center mb-6">Basic Auction Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-semibold text-blue-200 mb-2">
                        Number of Teams
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={config.teamCount}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleConfigChange('teamCount', value === '' ? '' : parseInt(value));
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value !== '') {
                            handleConfigChange('teamCount', parseInt(value));
                          }
                        }}
                        className="w-full px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-blue-200 mb-2">
                        Starting Budget per Team (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={config.startingBudget}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleConfigChange('startingBudget', value === '' ? '' : parseInt(value));
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value !== '') {
                            handleConfigChange('startingBudget', parseInt(value));
                          }
                        }}
                        className="w-full px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-blue-200 mb-2">
                        Max Players per Team
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={config.maxPlayersPerTeam}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleConfigChange('maxPlayersPerTeam', value === '' ? '' : parseInt(value));
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value !== '') {
                            handleConfigChange('maxPlayersPerTeam', parseInt(value));
                          }
                        }}
                        className="w-full px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-blue-200 mb-2">
                        Base Price (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={config.basePrice}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleConfigChange('basePrice', value === '' ? '' : parseInt(value));
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value !== '') {
                            handleConfigChange('basePrice', parseInt(value));
                          }
                        }}
                        className="w-full px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>



                  <div className="bg-blue-500 bg-opacity-20 rounded-lg p-4 border border-blue-400 border-opacity-30">
                    <h4 className="text-white font-medium mb-2">Preview:</h4>
                    <div className="text-blue-200 text-sm space-y-1">
                      <p>• {config.teamCount || '...'} teams will participate</p>
                      <p>• Each team gets ₹{config.startingBudget || '...'} budget</p>
                      <p>• Maximum {config.maxPlayersPerTeam || '...'} players per team</p>
                      <p>• Bidding starts from ₹{config.basePrice || '...'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Bidding Rules */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-white text-center mb-6">Bidding Increment Rules</h3>
                  
                  <div className="bg-blue-500 bg-opacity-20 rounded-lg p-4 border border-blue-400 border-opacity-30 mb-6">
                    <p className="text-blue-200 text-sm mb-2">
                      Set how much the bid should increase at different price levels. For example, increment by ₹5 
                      until ₹50, then by ₹10 until ₹100, and so on.
                    </p>
                    <p className="text-yellow-300 text-xs font-medium">
                      ⚠️ Important: Rules will be saved in the exact order you enter them. Arrange from lowest to highest threshold for best results.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {config.biddingIncrements.map((increment, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-white bg-opacity-5 rounded-lg p-4">
                        {/* Order controls */}
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => moveIncrement(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-blue-300 hover:text-blue-100 hover:bg-blue-500 hover:bg-opacity-20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveIncrement(index, 'down')}
                            disabled={index === config.biddingIncrements.length - 1}
                            className="p-1 text-blue-300 hover:text-blue-100 hover:bg-blue-500 hover:bg-opacity-20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            ▼
                          </button>
                        </div>
                        
                        {/* Rule number indicator */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 bg-opacity-30 text-blue-200 font-bold text-sm">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1">
                          <label className="block text-xs text-blue-200 mb-1">
                            Until ₹{typeof increment.threshold === 'number' ? increment.threshold : '0'} (Threshold)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={increment.threshold}
                            placeholder="Enter threshold amount"
                            onChange={(e) => {
                              const value = e.target.value;
                              handleIncrementChange(index, 'threshold', value);
                            }}
                            onBlur={(e) => {
                              // Preserve the exact value on blur to prevent browser corrections
                              const value = e.target.value;
                              if (value !== '') {
                                handleIncrementChange(index, 'threshold', value);
                              }
                            }}
                            className="w-full px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded text-white text-sm placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-blue-200 mb-1">
                            Increment by ₹{typeof increment.increment === 'number' ? increment.increment : '0'}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={increment.increment}
                            placeholder="Enter increment amount"
                            onChange={(e) => {
                              const value = e.target.value;
                              handleIncrementChange(index, 'increment', value);
                            }}
                            onBlur={(e) => {
                              // Preserve the exact value on blur to prevent browser corrections
                              const value = e.target.value;
                              if (value !== '') {
                                handleIncrementChange(index, 'increment', value);
                              }
                            }}
                            className="w-full px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded text-white text-sm placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                        {config.biddingIncrements.length > 1 && (
                          <button
                            onClick={() => removeIncrement(index)}
                            className="p-2 text-red-300 hover:text-red-100 hover:bg-red-500 hover:bg-opacity-20 rounded"
                            title="Remove this rule"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addIncrement}
                    className="w-full py-2 border-2 border-dashed border-blue-400 border-opacity-50 text-blue-200 rounded-lg hover:border-opacity-100 hover:bg-blue-500 hover:bg-opacity-10 transition-all"
                  >
                    + Add Another Rule
                  </button>

                  <div className="bg-green-500 bg-opacity-20 rounded-lg p-4 border border-green-400 border-opacity-30">
                    <h4 className="text-white font-medium mb-2">📋 Your Bidding Rules (In Order):</h4>
                    <div className="text-green-200 text-sm space-y-1">
                      {config.biddingIncrements
                        .filter(rule => typeof rule.threshold === 'number' && typeof rule.increment === 'number')
                        .map((rule, index) => (
                          <p key={index}>
                            {index + 1}. Until ₹{rule.threshold}: increment by ₹{rule.increment}
                          </p>
                        ))}
                      {config.biddingIncrements.filter(rule => typeof rule.threshold === 'number' && typeof rule.increment === 'number').length === 0 && (
                        <p className="text-yellow-300 italic">Complete the rules above to see preview</p>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-400 border-opacity-30">
                      <p className="text-green-100 text-xs">
                        ✓ Rules will be saved exactly as shown above
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: File Upload */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-white text-center mb-6">Upload Players File</h3>
                  
                  {!fileData.file ? (
                    <div className="border-2 border-dashed border-blue-400 border-opacity-30 rounded-lg p-8 text-center">
                      <div className="text-6xl mb-4">📁</div>
                      <h4 className="text-xl font-semibold text-white mb-2">Upload Player Data</h4>
                      <p className="text-blue-200 mb-4">Select an Excel (.xlsx) or CSV file containing player information</p>
                      
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                        disabled={loading}
                      />
                      <label
                        htmlFor="file-upload"
                        className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {loading ? 'Validating...' : 'Choose File'}
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-500 bg-opacity-20 rounded-lg p-4 border border-green-400 border-opacity-30">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">✅ {fileData.fileName}</h4>
                            <p className="text-green-200 text-sm">
                              {fileData.validation?.totalRows} rows • Valid format
                            </p>
                          </div>
                          <button
                            onClick={() => setFileData({ file: null, fileName: '', preview: null, validation: null })}
                            className="text-green-200 hover:text-white"
                          >
                            Change File
                          </button>
                        </div>
                      </div>

                      {fileData.preview && (
                        <div className="bg-white bg-opacity-10 rounded-lg p-4">
                          <h4 className="text-white font-medium mb-3">File Preview:</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm border-2 border-white border-opacity-30 rounded-lg overflow-hidden">
                              <thead>
                                <tr className="border-b-2 border-white border-opacity-40 bg-white bg-opacity-10">
                                  {fileData.validation?.columns?.map((col, index) => (
                                    <th key={index} className="text-left py-2 px-3 text-blue-200 font-medium border-r border-white border-opacity-20">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {fileData.preview.map((row, index) => (
                                  <tr key={index} className="border-b border-white border-opacity-20 hover:bg-white hover:bg-opacity-10">
                                    {Object.values(row.data).map((value, colIndex) => (
                                      <td key={colIndex} className="py-2 px-3 text-white text-xs border-r border-white border-opacity-10">
                                        {value || '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-blue-500 bg-opacity-20 rounded-lg p-4 border border-blue-400 border-opacity-30">
                    <h4 className="text-white font-medium mb-2">File Requirements:</h4>
                    <div className="text-blue-200 text-sm space-y-1">
                      <p>• Must contain a "Name" column with player names</p>
                      <p>• Optional: "Role" or "Category" column for player positions</p>
                      <p>• Roles with "/WK" will be classified as wicket-keepers</p>
                      <p>• Excel (.xlsx) or CSV (.csv) format supported</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-4 bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    currentStep === 1
                      ? 'bg-gray-500 bg-opacity-30 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-600 bg-opacity-50 text-white hover:bg-opacity-70'
                  }`}
                >
                  Back
                </button>

                {currentStep < 3 ? (
                  <button
                    onClick={handleNext}
                    disabled={!canProceedToNext()}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      canProceedToNext()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-500 bg-opacity-30 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleFinishSetup}
                    disabled={!canProceedToNext() || loading}
                    className={`px-8 py-3 rounded-lg font-medium transition-all ${
                      canProceedToNext() && !loading
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-500 bg-opacity-30 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Setting up...' : 'Start Auction'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center">
          <p className="text-blue-300 text-sm">
            © 2025 Cricket Auction Platform. Built with ❤️ for cricket enthusiasts.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AuctionSetup;
