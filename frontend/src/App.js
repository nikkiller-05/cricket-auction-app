import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './components/NotificationSystem';
import './index.css';

// Lazy load components for better initial performance
const HomePage = lazy(() => import('./components/HomePage'));
const AuctionSetup = lazy(() => import('./components/AuctionSetup'));
const UnifiedDashboard = lazy(() => import('./components/UnifiedDashboard'));

// Loading component for suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
      <p className="text-white text-lg">Loading Cricket Auction...</p>
    </div>
  </div>
);

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
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
        </Suspense>
      </Router>
    </NotificationProvider>
  );
}

export default App;
