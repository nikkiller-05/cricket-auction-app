import React, { useRef, useState } from 'react';
import axios from 'axios';
import { useNotification } from './NotificationSystem';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp';

/**
 * PlayerImageUpload
 * Tiny "📷" button that opens a file picker and uploads the image
 * to /api/players/upload-image/:playerId. On success calls onUploaded(url).
 */
const PlayerImageUpload = ({ playerId, onUploaded, label = '📷', className = '' }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const handlePick = () => {
    if (uploading) return;
    inputRef.current?.click();
  };

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so same file can be re-selected
    if (!file) return;

    if (!ACCEPT.split(',').includes(file.type)) {
      showError('Only JPG, PNG, or WebP images are allowed', 'Invalid file');
      return;
    }
    if (file.size > MAX_BYTES) {
      showError('Image must be under 10 MB', 'File too large');
      return;
    }

    const formData = new FormData();
    formData.append('playerFile', file);

    setUploading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/players/upload-image/${playerId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      showSuccess('Player photo updated', 'Upload complete');
      if (onUploaded) onUploaded(res.data.imageUrl);
    } catch (err) {
      console.error('Image upload failed:', err);
      showError(
        err.response?.data?.error || 'Failed to upload image',
        'Upload failed'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handlePick}
        disabled={uploading}
        title="Upload player photo"
        className={`inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-md border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed transition ${className}`}
      >
        {uploading ? '⏳' : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleChange}
        className="hidden"
      />
    </>
  );
};

export default PlayerImageUpload;
