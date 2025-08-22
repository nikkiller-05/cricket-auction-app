import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import AuctionSetup from './components/AuctionSetup';
import UnifiedDashboard from './components/UnifiedDashboard';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Home page with login options */}
        <Route path="/" element={<HomePage />} />
        
        {/* NEW: Auction setup for admin */}
        <Route path="/setup" element={<AuctionSetup />} />
        
        {/* Unified dashboard for both admin and spectators */}
        <Route path="/dashboard" element={<UnifiedDashboard />} />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
