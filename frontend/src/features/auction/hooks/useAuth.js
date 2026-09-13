import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { decodeToken, isExpired, clearAdminSession, clearAllSessions } from '../../../lib/session';

// Resolves admin/spectator identity from router state + stored token, keeps the
// axios Authorization header in sync, and exposes logout. Extracted verbatim
// from UnifiedDashboard — behavior is intentionally unchanged.
export default function useAuth(location) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('spectator');

  useEffect(() => {
    const adminFromState = location.state?.isAdmin;
    const rawToken = localStorage.getItem('adminToken');
    const payload = decodeToken(rawToken);
    // Reject an expired/invalid token so it can't grant stale admin access.
    const token = rawToken && payload && !isExpired(payload) ? rawToken : null;
    if (rawToken && !token) clearAdminSession();

    // Honor explicit spectator entry (state.isAdmin === false) even if a stale
    // admin token lingers in localStorage from a previous session.
    const enteredAsSpectator = adminFromState === false;

    if (!enteredAsSpectator && (adminFromState || token)) {
      setIsAdmin(true);
      if (token) {
        setUserRole(payload.role || 'admin');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        setUserRole('admin'); // Default for state-based admin
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Logging out in another tab (or the console) clears the shared token; mirror
  // that here so the dashboard drops admin access everywhere at once.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'adminToken' && e.newValue === null) {
        setIsAdmin(false);
        setUserRole('spectator');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    setIsAdmin(false);
    setUserRole('spectator');
    clearAllSessions();
    delete axios.defaults.headers.common['Authorization'];
    navigate('/');
  };

  return { isAdmin, userRole, logout };
}
