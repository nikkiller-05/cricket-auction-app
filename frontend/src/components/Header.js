import React, { useState, useRef, useEffect, memo } from 'react';
import './Header.css';
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
  onDownloadUnsold = () => {},
  onOpenTeamSquads = () => {},
  onDownloadBackup = () => {},
  canBackup = false,
  onUploadPlayers = null,
  auctionStatus = null,
  onUndoLastSale = null,
  canUndoLastSale = false,
  undoLoading = false,
  onEditSettings = null,
  onOpenTeamSetup = null,
  onConsole = null,
  canConfigure = false,
  eventName = '',
  canUndo = false,
  onEndAuction = null,
  onReopen = null,
  onResetAuction = null,
  onStartFastTrack = null,
  onEndFastTrack = null,
  isFastTrack = false,
  unsoldCount = 0,
  fileUploaded = false,
  progressCompleted = 0,
  progressTotal = 0
}) => {
  const { theme, toggleTheme } = useTheme();
  const isSpectator = userRole === 'spectator';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuButtonRef = useRef(null);
  const downloadDropdownRef = useRef(null);
  const controlsRef = useRef(null);

  // Derived auction phase from the authoritative auctionStatus + progress.
  // 'stopped' means NOT STARTED before any player is completed, else PAUSED.
  const isLive = ['running', 'fast-track'].includes(auctionStatus);
  const isEnded = auctionStatus === 'finished';
  const completedCount = Number(progressCompleted) || 0;
  const totalCount = Number(progressTotal) || 0;
  const phase = isEnded ? 'ended' : isLive ? 'live' : completedCount > 0 ? 'paused' : 'notstarted';
  const phaseLabel = { live: 'LIVE', paused: 'PAUSED', notstarted: 'NOT STARTED', ended: 'AUCTION ENDED' }[phase];
  const canOperateAuction = onToggleAuction && (canConfigure || userRole === 'sub-admin');
  const primaryLabel = phase === 'live' ? 'Pause' : phase === 'paused' ? 'Resume' : 'Start';
  const showControls =
    !isSpectator &&
    ((canUndo && onUndoLastSale) ||
      (canConfigure &&
        (onResetAuction || onStartFastTrack || onEndFastTrack || (onEndAuction && !isEnded) || (onReopen && isEnded))));
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target)) setIsDownloadDropdownOpen(false);
      if (controlsRef.current && !controlsRef.current.contains(event.target)) setIsControlsOpen(false);
    };

    if (isDropdownOpen || isDownloadDropdownOpen || isControlsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen, isDownloadDropdownOpen, isControlsOpen]);

  // Handle escape key to close dropdown
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
          menuButtonRef.current?.focus();
        }
        if (isDownloadDropdownOpen) setIsDownloadDropdownOpen(false);
        if (isControlsOpen) setIsControlsOpen(false);
      }
    };

    if (isDropdownOpen || isDownloadDropdownOpen || isControlsOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isDropdownOpen, isDownloadDropdownOpen, isControlsOpen]);

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
      <div className="header-container gbx-hd">

        {/* Brand */}
        <div className="gbx-hd-brand">
          <a href="/" className="logo" title="Go to Home">
            <img src="/auction-logo.png" alt="GoldenBidX" className="logo-img" />
            <span className="logo-text gbx-wordmark">
              <span className="logo-gold">Golden</span><span className="logo-white">Bid</span><span className="logo-gold">X</span>
            </span>
          </a>
        </div>

        {/* Tournament */}
        <div className="gbx-hd-tourn">
          {eventName && (
            <>
              <span className="gbx-hd-sep" aria-hidden="true" />
              <span className="gbx-hd-tournament" title={eventName}>{eventName}</span>
            </>
          )}
        </div>

        {/* Status */}
        <div className="gbx-hd-status">
          <div className={`gbx-status gbx-status-${phase}`}>
            <span className="gbx-status-dot" aria-hidden="true" />
            <span className="gbx-status-label">{phaseLabel}</span>
          </div>
        </div>

        {/* Flexible spacer keeps the action cluster to the right on desktop */}
        <div className="gbx-hd-spacer" aria-hidden="true" />

        {/* Primary auction action: Start / Pause / Resume */}
        <div className="gbx-hd-primary">
          {canOperateAuction && !isEnded && (
            <button
              type="button"
              onClick={() => onToggleAuction(!isAuctionOn)}
              disabled={auctionLoading}
              className={`gbx-pa gbx-pa-${phase}`}
              title={primaryLabel}
            >
              {auctionLoading ? (
                <span className="gbx-pa-spin" />
              ) : (
                <>
                  <span className="gbx-pa-ico">{phase === 'live' ? '‖' : '▶'}</span>
                  <span className="gbx-pa-txt">{primaryLabel}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Actions cluster: Controls + Export + Profile (right-anchored) */}
        <div className="gbx-hd-actions">
          {/* Tools: Auction Controls + Export */}
          <div className="gbx-hd-tools">

          {/* Auction Controls menu: Undo Sale, Revert Bid, End Auction */}
          {showControls && (
            <div className="gbx-menu-wrap" ref={controlsRef}>
              <button
                type="button"
                className="gbx-hd-btn gbx-hd-grey"
                onClick={() => setIsControlsOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={isControlsOpen}
                title="Auction Controls"
              >
                <span className="gbx-hd-btn-ico">⚙</span>
                <span className="gbx-hd-btn-txt">Controls</span>
              </button>
              {isControlsOpen && (
                <div className="gbx-menu" role="menu">
                  <div className="gbx-menu-head">Auction Controls</div>
                  {canConfigure && isEnded && onReopen && (
                    <button
                      className="gbx-menu-item"
                      role="menuitem"
                      onClick={() => { setIsControlsOpen(false); onReopen(); }}
                    >
                      <span className="gbx-menu-ico">↺</span> Reopen auction
                    </button>
                  )}
                  {canUndo && onUndoLastSale && (
                    <button
                      className="gbx-menu-item"
                      role="menuitem"
                      disabled={!canUndoLastSale || undoLoading}
                      onClick={() => { setIsControlsOpen(false); onUndoLastSale(); }}
                    >
                      <span className="gbx-menu-ico">↶</span> Undo Sale
                    </button>
                  )}
                  {canConfigure && isFastTrack && onEndFastTrack && (
                    <button
                      className="gbx-menu-item"
                      role="menuitem"
                      onClick={() => { setIsControlsOpen(false); onEndFastTrack(); }}
                    >
                      <span className="gbx-menu-ico">⚡</span> End Fast Track
                    </button>
                  )}
                  {canConfigure && !isFastTrack && onStartFastTrack && (
                    <button
                      className="gbx-menu-item"
                      role="menuitem"
                      disabled={unsoldCount === 0}
                      onClick={() => { setIsControlsOpen(false); onStartFastTrack(); }}
                    >
                      <span className="gbx-menu-ico">⚡</span> Start Fast Track{unsoldCount ? ` (${unsoldCount})` : ''}
                    </button>
                  )}
                  {canConfigure && onResetAuction && (
                    <button
                      className="gbx-menu-item"
                      role="menuitem"
                      disabled={!fileUploaded}
                      onClick={() => { setIsControlsOpen(false); onResetAuction(); }}
                    >
                      <span className="gbx-menu-ico">🔄</span> Reset Auction
                    </button>
                  )}
                  {canConfigure && onEndAuction && !isEnded && (
                    <>
                      <div className="gbx-menu-sep" />
                      <button
                        className="gbx-menu-item gbx-menu-danger"
                        role="menuitem"
                        onClick={() => { setIsControlsOpen(false); onEndAuction(); }}
                      >
                        <span className="gbx-menu-ico">■</span> End Auction
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Download Button with Dropdown */}
          {showDownloadOptions && !isSpectator && (
            <div className="download-dropdown-container" ref={downloadDropdownRef}>
              <button
                onClick={() => setIsDownloadDropdownOpen(!isDownloadDropdownOpen)}
                className="gbx-hd-btn gbx-hd-sky"
                title="Export"
              >
                <svg className="gbx-hd-btn-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="gbx-hd-btn-txt">Export</span>
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

                  <button
                    onClick={() => {
                      onDownloadUnsold();
                      setIsDownloadDropdownOpen(false);
                    }}
                    className="download-dropdown-item"
                  >
                    <span className="download-item-icon">📄</span>
                    <div className="download-item-content">
                      <div className="download-item-title">Unsold Players (Excel)</div>
                      <div className="download-item-subtitle">Everyone who went unsold</div>
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

        </div>

        {/* User menu */}
        <div className="gbx-hd-user">
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

                {/* Edit Settings Option - operators who can configure */}
                {canConfigure && onEditSettings && (
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

                {/* Team Setup Option - operators who can configure */}
                {canConfigure && onOpenTeamSetup && (
                  <button 
                    onClick={() => {
                      onOpenTeamSetup();
                      setIsDropdownOpen(false);
                    }}
                    className="menu-option"
                    role="menuitem"
                  >
                    <svg className="menu-option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-3-3" />
                    </svg>
                    Team Setup
                  </button>
                )}

                {/* Upload Players Option - operators who can configure */}
                {canConfigure && (
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

                {/* Appearance toggle (moved out of the header bar) */}
                <button
                  onClick={() => toggleTheme()}
                  className="menu-option"
                  role="menuitem"
                >
                  <svg className="menu-option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  {theme === 'dark' ? 'Light theme' : 'Dark theme'}
                </button>

                {/* Return to the organizer console (multi-tenant nav) */}
                {onConsole && (
                  <button
                    onClick={() => { setIsDropdownOpen(false); onConsole(); }}
                    className="menu-option"
                    role="menuitem"
                  >
                    <svg className="menu-option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Console
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

          {/* Home (spectators only) — operators use the Console item in the menu. */}
          {isSpectator && (
            <a href="/" className="gbx-hd-btn gbx-hd-grey gbx-hd-home" title="Home" aria-label="Go to home">
              <svg className="gbx-hd-btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 11.5 12 4l9 7.5" />
                <path d="M5 10v10h5v-6h4v6h5V10" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {totalCount > 0 && (
        <div
          className="gbx-progress"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Auction progress"
        >
          <div className="gbx-progress-meta">
            <span className="gbx-progress-count">
              {completedCount} / {totalCount} <span className="gbx-progress-word">completed</span>
            </span>
            <span className="gbx-progress-pct">{progressPct}%</span>
          </div>
          <div className="gbx-progress-track">
            <div className={`gbx-progress-fill gbx-progress-${phase}`} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}
    </header>
  );
});

Header.displayName = 'Header';

export default Header;