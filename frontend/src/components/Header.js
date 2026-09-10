import React, { useState, useRef, useEffect, memo } from 'react';
import './Header.css';
import AuctionToggleButton from './AuctionToggleButton';
import { useTheme } from '../ThemeContext';

const Header = memo(({ 
  username = "Super Admin", 
  userRole = "spectator",
  onLogout = () => {}, 
  onToggleAuction = () => {}, 
  isAuctionOn = false,
  onDownload = () => {},
  auctionLoading = false,
  showDownloadOptions = false,
  onDownloadExcel = () => {},
  onDownloadSaleLog = () => {},
  onOpenTeamSquads = () => {},
  onDownloadBackup = () => {},
  canBackup = false,
  onUploadPlayers = null,
  auctionStatus = null,
  onUndoLastSale = null,
  canUndoLastSale = false,
  undoLoading = false,
  onEditSettings = null
}) => {
  const { theme, toggleTheme } = useTheme();
  const isSpectator = userRole === 'spectator';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuButtonRef = useRef(null);
  const downloadDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target)) {
        setIsDownloadDropdownOpen(false);
      }
    };

    if (isDropdownOpen || isDownloadDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen, isDownloadDropdownOpen]);

  // Handle escape key to close dropdown
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
          menuButtonRef.current?.focus();
        }
        if (isDownloadDropdownOpen) {
          setIsDownloadDropdownOpen(false);
        }
      }
    };

    if (isDropdownOpen || isDownloadDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isDropdownOpen, isDownloadDropdownOpen]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogoutFromDropdown = () => {
    setIsDropdownOpen(false);
    onLogout();
  };

  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'super-admin':
        return 'Super Administrator';
      case 'admin':
        return 'Administrator';
      case 'sub-admin':
        return 'Sub Administrator';
      case 'spectator':
        return 'Spectator';
      default:
        return 'User';
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        
        {/* Left Section - Logo */}
        <div className="header-left">
          <a href="/" className="logo" title="Go to Home">
            <img src="/auction-logo.png" alt="GoldenBidX" className="logo-img" />
            <span className="logo-text">
              <span className="logo-gold">Golden</span><span className="logo-white">Bid</span><span className="logo-gold">X</span>
            </span>
          </a>
          <button type="button" onClick={toggleTheme} className="theme-toggle-btn" title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Center Section - Auction Status */}
        <div className="header-center">
          {auctionStatus && (
            <div className={`auction-status-badge ${
              auctionStatus === 'running' 
                ? 'status-live' 
                : auctionStatus === 'fast-track'
                ? 'status-fast'
                : auctionStatus === 'finished'
                ? 'status-done'
                : auctionStatus === 'stopped'
                ? 'status-paused'
                : 'status-default'
            }`}>
              {auctionStatus === 'running' && '🔴 LIVE'}
              {auctionStatus === 'fast-track' && '⚡ FAST'}
              {auctionStatus === 'finished' && '✅ DONE'}
              {auctionStatus === 'stopped' && '⏸️ PAUSED'}
            </div>
          )}
        </div>

        {/* Right Section - User Controls */}
        <div className="header-right">
          
          {/* Auction Toggle - Only for admin roles */}
          {onToggleAuction && (userRole === 'super-admin' || userRole === 'admin' || userRole === 'sub-admin') && (
            <div className="auction-toggle-container">
              <AuctionToggleButton
                isActive={isAuctionOn}
                onToggle={onToggleAuction}
                loading={auctionLoading}
              />
            </div>
          )}

          {/* Undo Last Sale Button - Super Admin Only */}
          {userRole === 'super-admin' && onUndoLastSale && (
            <button
              onClick={onUndoLastSale}
              disabled={undoLoading || !canUndoLastSale}
              className="undo-last-sale-btn"
              title="Undo Last Sale - Reverses a completed sale and refunds money to team"
            >
              {undoLoading ? (
                <div className="undo-loading-spinner"></div>
              ) : (
                <>
                  <span className="undo-icon">↩️</span>
                  <span className="undo-text">Undo Sale</span>
                </>
              )}
            </button>
          )}

          {/* Download Button with Dropdown */}
          {showDownloadOptions && !isSpectator && (
            <div className="download-dropdown-container" ref={downloadDropdownRef}>
              <button
                onClick={() => setIsDownloadDropdownOpen(!isDownloadDropdownOpen)}
                className="download-btn"
                title="Download Results"
              >
                <svg className="download-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="download-text">Download</span>
                <svg className={`download-chevron ${isDownloadDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Download Dropdown Menu */}
              {isDownloadDropdownOpen && (
                <div className="download-dropdown-menu">
                  <button
                    onClick={() => {
                      onDownloadExcel();
                      setIsDownloadDropdownOpen(false);
                    }}
                    className="download-dropdown-item"
                  >
                    <span className="download-item-icon">📊</span>
                    <div className="download-item-content">
                      <div className="download-item-title">Complete Report (Excel)</div>
                      <div className="download-item-subtitle">Every sheet: squads, finances, sale log & more</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onOpenTeamSquads();
                      setIsDownloadDropdownOpen(false);
                    }}
                    className="download-dropdown-item"
                  >
                    <span className="download-item-icon">🖼️</span>
                    <div className="download-item-content">
                      <div className="download-item-title">Team Squads (PDF / PNG)</div>
                      <div className="download-item-subtitle">Designed, shareable team cards</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onDownloadSaleLog();
                      setIsDownloadDropdownOpen(false);
                    }}
                    className="download-dropdown-item"
                  >
                    <span className="download-item-icon">🧾</span>
                    <div className="download-item-content">
                      <div className="download-item-title">Sale Log (Excel)</div>
                      <div className="download-item-subtitle">Chronological record of every purchase</div>
                    </div>
                  </button>

                  {canBackup && (
                    <button
                      onClick={() => {
                        onDownloadBackup();
                        setIsDownloadDropdownOpen(false);
                      }}
                      className="download-dropdown-item"
                    >
                      <span className="download-item-icon">💾</span>
                      <div className="download-item-content">
                        <div className="download-item-title">Full Backup (JSON)</div>
                        <div className="download-item-subtitle">Admin only — complete auction snapshot</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User Menu Dropdown */}
          {isSpectator ? (
            <span className="spectator-pill">👁️ Spectator</span>
          ) : (
          <div className="user-menu" ref={dropdownRef}>
            <button
              ref={menuButtonRef}
              onClick={toggleDropdown}
              className="modern-menu-button"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              aria-label="User menu"
            >
              {/* Modern Circular Avatar Button */}
              <div className={`avatar-circle ${isDropdownOpen ? 'is-open' : ''}`}>
                <span className="avatar-initials">{getUserInitials(username)}</span>
                <div className="avatar-status-indicator"></div>
              </div>
              {/* Username Tooltip */}
              <span className="username-tooltip">{username}</span>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div 
                className="dropdown-menu"
                role="menu"
                aria-labelledby="user-menu-button"
              >
                {/* User Info */}
                <div className="user-info" role="menuitem">
                  <div className="user-avatar">
                    {getUserInitials(username)}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{username}</span>
                    <span className="user-role">{getRoleDisplayName(userRole)}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="menu-divider"></div>

                {/* Edit Settings Option - Admin only */}
                {(userRole === 'super-admin' || userRole === 'admin') && onEditSettings && (
                  <button 
                    onClick={() => {
                      onEditSettings();
                      setIsDropdownOpen(false);
                    }}
                    className="menu-option"
                    role="menuitem"
                  >
                    <svg className="menu-option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Edit Settings
                  </button>
                )}

                {/* Upload Players Option - Admin only */}
                {(userRole === 'super-admin' || userRole === 'admin') && (
                  <button 
                    onClick={() => {
                      if (onUploadPlayers) onUploadPlayers();
                      setIsDropdownOpen(false);
                    }}
                    className="menu-option"
                    role="menuitem"
                  >
                    <svg className="menu-option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Players
                  </button>
                )}

                {/* Logout Option */}
                <button 
                  onClick={handleLogoutFromDropdown}
                  className="logout-option"
                  role="menuitem"
                >
                  <svg className="logout-option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
          )}

        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;