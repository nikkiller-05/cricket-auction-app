import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { decodeToken, isExpired, clearAdminSession, clearAllSessions } from '../../../lib/session';

// Resolves the viewer's operator rights for THIS auction from the backend, so
// the dashboard shows controls only when the user actually owns/administers the
// auction (super-admin everywhere; organizer only their own event). Falls back
// to spectator on any failure or when entered explicitly as a spectator.
export default function useAuth(location, auctionIdOverride = null, forceSpectator = false) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('spectator');
  const [username, setUsername] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventSlug, setEventSlug] = useState('');
  const [canConfigure, setCanConfigure] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    const auctionId = auctionIdOverride || new URLSearchParams(location.search).get('auctionId') || 'default';
    const adminFromState = forceSpectator ? false : location.state?.isAdmin;
    const rawToken = localStorage.getItem('adminToken');
    const payload = decodeToken(rawToken);
    const token = rawToken && payload && !isExpired(payload) ? rawToken : null;
    if (rawToken && !token) clearAdminSession();

    // Public/spectator entry (explicit, or no session) is read-only regardless
    // of any lingering token; operators pass their token for the ownership check.
    const spectator = forceSpectator || adminFromState === false || !token;
    if (token && !spectator) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    let active = true;
    const headers = token && !spectator ? { Authorization: `Bearer ${token}` } : {};
    axios
      .get(`${API_BASE_URL}/api/auction/access`, { params: { auctionId }, headers })
      .then(({ data }) => {
        if (!active) return;
        setEventName(data.eventName || '');
        setEventSlug(data.eventSlug || '');
        if (spectator) {
          setIsAdmin(false);
          setUserRole('spectator');
          setUsername('');
          setCanConfigure(false);
          setCanUndo(false);
          return;
        }
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
  }, [location.state, location.search, auctionIdOverride, forceSpectator]);

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

  return { isAdmin, userRole, username, eventName, eventSlug, canConfigure, canUndo, logout };
}
