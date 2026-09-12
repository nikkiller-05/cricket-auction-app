import React, { useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useNotification } from '../../components/NotificationSystem';
import TeamLogo from './TeamLogo';

const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp';
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB source cap (resized down before upload)
const MAX_DIM = 256; // logos are stored small to keep the data URL tiny

// Read a file, downscale it on a canvas and return a compact base64 data URL.
const resizeToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const isPng = file.type === 'image/png';
      // PNG keeps transparency for logos; others compress well as JPEG.
      resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.9));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });

/**
 * TeamLogoUpload
 * Shows the current logo (or initials) with an "Upload"/"Remove" control.
 * Resizes the picked image client-side and stores it inline on the team.
 */
const TeamLogoUpload = ({ team, onUpdated }) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const { showSuccess, showError } = useNotification();

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ACCEPT.split(',').includes(file.type)) {
      showError('Only JPG, PNG, or WebP images are allowed', 'Invalid file');
      return;
    }
    if (file.size > MAX_BYTES) {
      showError('Image must be under 8 MB', 'File too large');
      return;
    }

    setBusy(true);
    try {
      const logo = await resizeToDataUrl(file);
      const res = await axios.post(`${API_BASE_URL}/api/teams/${team.id}/logo`, { logo });
      showSuccess('Team logo updated', 'Upload complete');
      if (onUpdated) onUpdated(res.data.team?.logoUrl || logo);
    } catch (err) {
      console.error('Team logo upload failed:', err);
      showError(err.response?.data?.error || 'Failed to upload logo', 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await axios.post(`${API_BASE_URL}/api/teams/${team.id}/logo`, { logo: null });
      showSuccess('Team logo removed');
      if (onUpdated) onUpdated(null);
    } catch (err) {
      console.error('Team logo remove failed:', err);
      showError(err.response?.data?.error || 'Failed to remove logo', 'Remove failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <TeamLogo team={team} size="lg" rounded="rounded-xl" />
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => !busy && inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-amber-400/50 bg-amber-400/15 text-amber-700 hover:bg-amber-400/25 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {busy ? '⏳ Working…' : team?.logoUrl ? '🖼️ Change logo' : '🖼️ Add logo'}
        </button>
        {team?.logoUrl && !busy && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:underline"
          >
            Remove
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={ACCEPT} onChange={handleChange} className="hidden" />
    </div>
  );
};

export default TeamLogoUpload;
