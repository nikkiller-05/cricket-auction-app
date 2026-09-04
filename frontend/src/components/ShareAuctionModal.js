import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

// Lightweight share dialog: QR code + copyable link so spectators can join instantly.
const ShareAuctionModal = ({ isOpen, onClose, url }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const shareUrl = url || window.location.origin;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable (insecure context); ignore silently.
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Cricket Auction — Live', text: 'Watch the live cricket auction!', url: shareUrl });
      } catch {
        // User dismissed the share sheet.
      }
    }
  };

  const downloadQr = () => {
    const canvas = document.getElementById('share-qr-canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'auction-join-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 text-center">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition text-xl leading-none"
        >
          ×
        </button>

        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Share this auction</h3>
        <p className="text-sm text-slate-500 mb-5">Scan the QR or share the link to join as a spectator.</p>

        <div className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-5">
          <QRCodeCanvas id="share-qr-canvas" value={shareUrl} size={200} level="M" includeMargin />
        </div>

        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 mb-4">
          <span className="flex-1 truncate text-sm text-slate-600 text-left">{shareUrl}</span>
          <button
            onClick={copyLink}
            className="shrink-0 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-95 transition"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="flex justify-center gap-2">
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              onClick={nativeShare}
              className="rounded-full bg-gradient-to-b from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:-translate-y-0.5 active:translate-y-0 transition"
            >
              Share…
            </button>
          )}
          <button
            onClick={downloadQr}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-200 hover:-translate-y-0.5 active:translate-y-0 transition"
          >
            Download QR
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareAuctionModal;
