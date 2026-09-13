import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { decodeToken, isExpired, clearAdminSession, clearAllSessions } from '../../../lib/session';

// Resolves the viewer's operator rights for THIS auction from the backend, so
// the dashboard shows controls only when the user actually owns/administers the
// auction (super-admin everywhere; organizer only their own event). Falls back
// to spectator on any failure or when entered explicitly as a spectator.
export default function useAuth(location) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('spectator');
  const [username, setUsername] = useState('');
  const [canConfigure, setCanConfigure] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    const auctionId = new URLSearchParams(location.search).get('auctionId') || 'default';
    const adminFromState = location.state?.isAdmin;
    const rawToken = localStorage.getItem('adminToken');
    const payload = decodeToken(rawToken);
    const token = rawToken && payload && !isExpired(payload) ? rawToken : null;
    if (rawToken && !token) clearAdminSession();

    const enteredAsSpectator = adminFromState === false;

    // Public/spectator entry, or no session: read-only, no backend probe.
    if (enteredAsSpectator || !token) {
      setIsAdmin(false);
      setUserRole('spectator');
      setUsername('');
      setCanConfigure(false);
      setCanUndo(false);
      return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    let active = true;
    axios
      .get(`${API_BASE_URL}/api/auction/access`, { params: { auctionId } })
      .then(({ data }) => {
        if (!active) return;
        setIsAdmin(!!data.canOperate);
        setUserRole(data.role || 'spectator');
        setUsername(data.username || '');
        setCanConfigure(!!data.canConfigure);
        setCanUndo(!!data.canUndo);
      })
      .catch(() => {
        if (!active) return;
        setIsAdmin(false);
        setUserRole('spectator');
        setCanConfigure(false);
        setCanUndo(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, location.search]);

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

  return { isAdmin, userRole, username, canConfigure, canUndo, logout };
}
