import React from 'react';
import './AuctionToggleButton.css';

const AuctionToggleButton = ({ 
  isActive = false, 
  onToggle = () => {}, 
  disabled = false,
  loading = false 
}) => {

  const handleToggle = () => {
    if (disabled || loading) return;
    
    const newState = !isActive;
    onToggle(newState);
  };

  return (
    <div className="auction-toggle-container">
      <button
        className={`auction-toggle ${isActive ? 'active' : 'inactive'} ${disabled ? 'disabled' : ''} ${loading ? 'loading' : ''}`}
        onClick={handleToggle}
        disabled={disabled || loading}
        aria-label={isActive ? 'Stop Auction' : 'Start Auction'}
      >
        {/* Background Track */}
        <div className="toggle-track">
          {/* Text Labels */}
          <span className={`toggle-text start-text ${isActive ? 'visible' : 'hidden'}`}>
            START
          </span>
          <span className={`toggle-text stop-text ${!isActive ? 'visible' : 'hidden'}`}>
            STOP
          </span>
        </div>
        
        {/* Sliding Circle */}
        <div className={`toggle-circle ${isActive ? 'slide-right' : 'slide-left'}`}>
          {loading ? (
            <div className="spinner"></div>
          ) : (
            <span className="toggle-icon">
              {isActive ? '⏹' : '▶'}
            </span>
          )}
        </div>
      </button>
    </div>
  );
};

export default AuctionToggleButton;