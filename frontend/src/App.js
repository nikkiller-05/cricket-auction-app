import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './components/NotificationSystem';
import { ThemeProvider } from './ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './App.css';

// Lazy load components for better initial performance
const HomePage = lazy(() => import('./components/HomePage'));
const AuctionSetup = lazy(() => import('./components/AuctionSetup'));
const UnifiedDashboard = lazy(() => import('./components/UnifiedDashboard'));
const RegisterPage = lazy(() => import('./components/RegisterPage'));
const RegistrationsAdmin = lazy(() => import('./components/RegistrationsAdmin'));
const ResetPasswordPage = lazy(() => import('./components/ResetPasswordPage'));

// Loading component for suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0a06] via-[#1c1608] to-[#2a1f08]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
      <p className="text-amber-100 text-lg">Loading GoldenBidX...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <ThemeProvider>
          <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
              {/* Home page with login options */}
              <Route path="/" element={<HomePage />} />
              
              {/* NEW: Auction setup for admin */}
              <Route path="/setup" element={<AuctionSetup />} />
              
              {/* Unified dashboard for both admin and spectators */}
              <Route path="/dashboard" element={<UnifiedDashboard />} />
              
              {/* Public player registration form */}
              <Route path="/register/:slug" element={<RegisterPage />} />
              
              {/* Organizer / admin dashboard (renamed from /registrations) */}
              <Route path="/console" element={<RegistrationsAdmin />} />
              <Route path="/registrations" element={<Navigate to="/console" replace />} />

              {/* Public password reset via emailed token */}
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          </Router>
        </ThemeProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
