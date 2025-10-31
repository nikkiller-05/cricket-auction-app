import React from 'react';
import PlayerUpload from './PlayerUpload';
import './PlayerUploadModal.css';

const PlayerUploadModal = ({ 
  isOpen, 
  onClose, 
  onUploadSuccess, 
  onDataRefresh 
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleUploadSuccess = (data) => {
    if (onUploadSuccess) {
      onUploadSuccess(data);
    }
    // Auto close modal after successful upload
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">
            <span className="modal-icon">📁</span>
            Upload Players
          </h2>
          <button 
            onClick={onClose}
            className="modal-close-button"
            aria-label="Close modal"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="modal-content">
          <PlayerUpload 
            onUploadSuccess={handleUploadSuccess}
            onDataRefresh={onDataRefresh}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerUploadModal;