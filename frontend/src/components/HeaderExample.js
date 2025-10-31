// HeaderExample.js - Usage example for the Header component

import React, { useState } from 'react';
import Header from './Header';

const HeaderExample = () => {
  const [isAuctionOn, setIsAuctionOn] = useState(false);
  const [auctionLoading, setAuctionLoading] = useState(false);

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logging out...');
    // Example: redirect to login page, clear session, etc.
  };

  const handleToggleAuction = async (newState) => {
    setAuctionLoading(true);
    try {
      // Add API call logic here
      console.log(`${newState ? 'Starting' : 'Stopping'} auction...`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsAuctionOn(newState);
    } catch (error) {
      console.error('Error toggling auction:', error);
    } finally {
      setAuctionLoading(false);
    }
  };

  const handleDownload = () => {
    // Add download logic here
    console.log('Downloading results...');
  };

  return (
    <div>
      {/* Basic Usage */}
      <Header 
        username="Super Admin" 
        onLogout={handleLogout} 
        isAuctionOn={isAuctionOn} 
        onToggleAuction={handleToggleAuction}
        onDownload={handleDownload}
        auctionLoading={auctionLoading}
      />
      
      {/* Example with different username */}
      <Header 
        username="John Doe" 
        onLogout={handleLogout} 
        isAuctionOn={false} 
        onToggleAuction={handleToggleAuction}
        onDownload={handleDownload}
        auctionLoading={false}
      />
    </div>
  );
};

export default HeaderExample;

/* 
USAGE INSTRUCTIONS:

1. Import the Header component:
   import Header from './components/Header';

2. Basic usage:
   <Header 
     username="Super Admin" 
     onLogout={handleLogout} 
     isAuctionOn={false} 
     onToggleAuction={handleToggleAuction} 
   />

3. Full props:
   - username: string - Display name for the user (default: "Super Admin")
   - onLogout: function - Called when logout is triggered
   - onToggleAuction: function - Called when auction toggle is clicked  
   - isAuctionOn: boolean - Current auction state
   - onDownload: function - Called when download button is clicked
   - auctionLoading: boolean - Shows loading state on toggle

4. Features:
   - Responsive hamburger menu with user info dropdown
   - Compact logout icon button in header
   - Animated dropdown with fade-in effect
   - Keyboard accessibility (Tab, Escape, Enter, Space)
   - Click outside to close dropdown
   - ARIA attributes for screen readers
   - Mobile-responsive design
   - Modern gradient styling

5. Keyboard Navigation:
   - Tab: Navigate between header elements
   - Enter/Space: Activate buttons and menu
   - Escape: Close dropdown when open
   - Arrow keys: Navigate within dropdown (if extended)
*/