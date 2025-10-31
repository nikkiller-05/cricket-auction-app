import React, { useState } from 'react';
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PlayerUpload = ({ onUploadSuccess, onDataRefresh }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setMessage('');
    setValidationResult(null);
    
    if (selectedFile) {
      validateFile(selectedFile);
    }
  };

  const validateFile = async (fileToValidate) => {
    setValidating(true);
    const formData = new FormData();
    formData.append('playerFile', fileToValidate);

    try {
  const response = await axios.post(`${API_BASE_URL}/api/players/validate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setValidationResult(response.data);
      if (!response.data.valid) {
        setMessage('File validation failed. Please check the requirements.');
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'File validation failed');
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    if (validationResult && !validationResult.valid) {
      setMessage('Please fix validation errors before uploading');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('playerFile', file);

    try {
      console.log('Uploading file...');
  const response = await axios.post(`${API_BASE_URL}/api/players/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Upload response:', response.data);
      setMessage(`Successfully uploaded ${response.data.playerCount} players from ${response.data.fileName}`);
      setFile(null);
      setValidationResult(null);
      e.target.reset();
      
      // Force refresh the data
      if (onDataRefresh) {
        setTimeout(() => {
          onDataRefresh();
        }, 500);
      }
      
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const clearAuction = async () => {
    if (!window.confirm('Are you sure you want to clear all auction data? This cannot be undone.')) {
      return;
    }

    try {
  await axios.post(`${API_BASE_URL}/api/players/clear`);
      setMessage('Auction data cleared successfully');
      setFile(null);
      setValidationResult(null);
      
      // Force refresh after clearing
      if (onDataRefresh) {
        setTimeout(() => {
          onDataRefresh();
        }, 500);
      }
    } catch (error) {
      setMessage('Error clearing auction data');
    }
  };

  return (
    <div className="bg-white bg-opacity-15 backdrop-blur-xl rounded-xl shadow-2xl p-6 border-2 border-green-200 border-opacity-50 hover:bg-opacity-25 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Upload Players</h3>
        <button
          onClick={clearAuction}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Clear Auction Data
        </button>
      </div>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Excel/CSV File
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <div className="mt-2 text-sm text-gray-500">
            <p>Required columns: <strong>Name</strong></p>
            <p>Optional columns: Sl.No, Role/Category, Role, Category</p>
            <p className="text-xs text-gray-400 mt-1">
              ⚠️ File is processed in memory only - not saved to server
            </p>
          </div>
        </div>

        {validating && (
          <div className="text-blue-600 text-sm flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Validating file...
          </div>
        )}

        {validationResult && (
          <div className={`p-3 rounded-md text-sm ${
            validationResult.valid 
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            <div className="font-medium mb-2">
              {validationResult.valid ? '✓ File is valid' : '✗ File validation failed'}
            </div>
            <div className="text-xs space-y-1">
              <p>File: {validationResult.fileName}</p>
              <p>Rows: {validationResult.totalRows}</p>
              <p>Columns: {validationResult.columns.join(', ')}</p>
              {validationResult.suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Suggestions:</p>
                  <ul className="list-disc list-inside">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file || (validationResult && !validationResult.valid)}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
        >
          {uploading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          )}
          {uploading ? 'Processing...' : 'Upload & Process Players'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md text-sm ${
          message.includes('Successfully') || message.includes('cleared')
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default PlayerUpload;
