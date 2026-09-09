import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNotification } from './NotificationSystem';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Isolated axios instance so this page's auth never clobbers the dashboard's.
const api = axios.create({ baseURL: API_BASE_URL, timeout: 25000 });

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const initials = (s = '') => s.trim().slice(0, 2).toUpperCase() || '?';

// ---- Theme tokens (dark default, matching the project; light optional) ----
const DARK_BG = { background: 'radial-gradient(58rem 40rem at -8% -18%, rgba(232,184,75,0.16) 0%, transparent 60%), radial-gradient(54rem 40rem at 112% 116%, rgba(176,120,32,0.18) 0%, transparent 60%), linear-gradient(160deg, #0a0a0f 0%, #12101b 46%, #0b0b11 100%)' };
const THEMES = {
  dark: {
    isDark: true,
    pageStyle: DARK_BG, pageCls: 'text-white',
    header: 'bg-white/[0.04] border-white/10 backdrop-blur-xl',
    card: 'rounded-2xl border border-white/12 bg-white/[0.05] backdrop-blur-xl',
    menu: 'bg-[#15131f] border border-white/12 shadow-2xl',
    cardSel: 'border-amber-300/60 bg-amber-400/10',
    cardIdle: 'border-white/12 hover:border-white/25',
    heading: 'text-white', sub: 'text-indigo-200/60', label: 'text-indigo-200/80',
    input: 'bg-white/10 border-white/20 text-white placeholder-white/40 [&>option]:text-slate-900',
    chip: 'bg-white/10 text-white border-white/20 hover:bg-white/20',
    toggleBtn: 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20',
    tabIdle: 'text-indigo-200/60 hover:text-white',
    itemHover: 'hover:bg-white/5',
    soft: 'bg-white/[0.06] border-white/10',
    divide: 'border-white/10',
  },
  light: {
    isDark: false,
    pageStyle: { backgroundColor: '#f6f4ef' }, pageCls: 'text-slate-900',
    header: 'bg-white border-slate-200',
    card: 'rounded-2xl border border-slate-200 bg-white',
    menu: 'bg-white border border-slate-200 shadow-2xl',
    cardSel: 'border-indigo-400 bg-indigo-50',
    cardIdle: 'border-slate-200 hover:border-slate-300',
    heading: 'text-slate-900', sub: 'text-slate-500', label: 'text-slate-600',
    input: 'bg-white border-slate-300 text-slate-900 placeholder-slate-400',
    chip: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
    toggleBtn: 'bg-slate-800 text-amber-300 border-slate-800 hover:bg-slate-700',
    tabIdle: 'text-slate-500 hover:text-slate-900',
    itemHover: 'hover:bg-slate-50',
    soft: 'bg-slate-50 border-slate-200',
    divide: 'border-slate-100',
  },
};
const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  verified: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  not_required: 'bg-slate-100 text-slate-700',
};

const RegistrationsAdmin = () => {
  const { showSuccess, showError, showConfirm } = useNotification();
  const [auth, setAuth] = useState(null);
  const [booting, setBooting] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('regTheme') || 'dark');
  const T = THEMES[theme] || THEMES.dark;

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('regTheme', next);
  };

  useEffect(() => {
    const t = localStorage.getItem('regToken');
    const u = localStorage.getItem('regUser');
    if (t && u) {
      api.defaults.headers.common.Authorization = `Bearer ${t}`;
      try { setAuth({ token: t, user: JSON.parse(u) }); } catch { /* ignore */ }
    }
    setBooting(false);
  }, []);

  const onLogout = () => {
    localStorage.removeItem('regToken');
    localStorage.removeItem('regUser');
    delete api.defaults.headers.common.Authorization;
    setAuth(null);
  };

  if (booting) return <div className="min-h-screen" style={DARK_BG} />;
  if (!auth) return <LoginView onAuthed={setAuth} showSuccess={showSuccess} showError={showError} theme={theme} toggleTheme={toggleTheme} T={T} />;
  return <Console auth={auth} onLogout={onLogout} showSuccess={showSuccess} showError={showError} showConfirm={showConfirm} T={T} theme={theme} toggleTheme={toggleTheme} />;
};

// ---------------- Login ----------------
const LoginView = ({ onAuthed, showSuccess, showError, T, theme, toggleTheme }) => {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', creds);
      const { token, user } = res.data;
      if (!['super-admin', 'admin', 'organizer'].includes(user.role)) {
        showError('This account cannot manage registrations');
        return;
      }
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem('regToken', token);
      localStorage.setItem('regUser', JSON.stringify(user));
      onAuthed({ token, user });
    } catch (err) {
      showError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${T.pageCls}`} style={T.pageStyle}>
      <form onSubmit={login} className={`w-full max-w-sm ${T.card} p-7`}>
        <div className="text-center mb-6">
          <img src="/auction-logo.png" alt="" className="w-14 h-14 rounded-xl mx-auto mb-3 ring-1 ring-amber-300/30" />
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-400/90 font-bold">Registration Console</p>
        </div>
        <label className={`block text-xs font-semibold ${T.label} mb-1`}>Username</label>
        <input className={`w-full rounded-lg border px-3 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-amber-300/50 ${T.input}`} value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value })} />
        <label className={`block text-xs font-semibold ${T.label} mb-1`}>Password</label>
        <input type="password" className={`w-full rounded-lg border px-3 py-2.5 mb-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50 ${T.input}`} value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} />
        <div className="text-right mb-4">
          <button type="button" onClick={() => setForgot(true)} className="text-xs font-semibold text-amber-400 hover:text-amber-300">Forgot password?</button>
        </div>
        <button disabled={loading} className="w-full rounded-full bg-gradient-to-b from-amber-400 to-amber-500 px-6 py-2.5 text-sm font-bold text-slate-900 hover:-translate-y-0.5 transition disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <button type="button" onClick={toggleTheme} className={`mt-3 w-full rounded-full border px-4 py-1.5 text-xs font-semibold ${T.chip}`}>
          {theme === 'dark' ? '☀️ Light theme' : '🌙 Dark theme'}
        </button>
      </form>
      {forgot && <ForgotPasswordModal onClose={() => setForgot(false)} showSuccess={showSuccess} showError={showError} T={T} />}
    </div>
  );
};

// ---------------- Forgot password ----------------
const ForgotPasswordModal = ({ onClose, showSuccess, showError, T }) => {
  const [form, setForm] = useState({ username: '', email: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.username && !form.email) return showError('Enter your username or registered email');
    setBusy(true);
    try {
      const res = await api.post('/api/auth/forgot-password', form);
      showSuccess(res.data.message || 'Request sent');
      onClose();
    } catch (err) { showError(err.response?.data?.error || 'Could not send request'); }
    finally { setBusy(false); }
  };
  return (
    <ModalShell onClose={onClose} T={T} title="Forgot password">
      <p className={`text-xs mb-3 ${T.sub}`}>If your account has a registered email, we'll send a reset link. Otherwise a reset request goes to the admin, who will set a new password for you.</p>
      <form onSubmit={submit}>
        <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={`w-full rounded-lg border px-3 py-2.5 mb-2 ${T.input}`} />
        <input placeholder="Registered email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`w-full rounded-lg border px-3 py-2.5 mb-4 ${T.input}`} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`rounded-full border px-4 py-2 text-sm font-semibold ${T.chip}`}>Cancel</button>
          <button disabled={busy} className="rounded-full bg-amber-500 text-slate-900 px-5 py-2 text-sm font-bold hover:bg-amber-400 disabled:opacity-50">{busy ? 'Sending…' : 'Send request'}</button>
        </div>
      </form>
    </ModalShell>
  );
};

// ---------------- Modal shell ----------------
const ModalShell = ({ onClose, title, children, T }) => (
  <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className={`relative w-full max-w-sm ${T.card} p-6`}>
      <h3 className={`text-lg font-bold mb-4 ${T.heading}`}>{title}</h3>
      {children}
    </div>
  </div>
);

// ---------------- Send test email (super-admin) ----------------
const TestEmailModal = ({ defaultTo, onClose, showSuccess, showError, T }) => {
  const [to, setTo] = useState(defaultTo || '');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!to.trim()) return showError('Enter a recipient email');
    setBusy(true);
    try {
      const res = await api.post('/api/auth/test-email', { to: to.trim() });
      showSuccess(res.data.message || 'Test email sent');
      onClose();
    } catch (err) { showError(err.response?.data?.error || 'Failed to send test email'); }
    finally { setBusy(false); }
  };
  return (
    <ModalShell onClose={onClose} T={T} title="Send test email">
      <p className={`text-xs mb-3 ${T.sub}`}>Verifies your SMTP settings. If it fails, the exact error is shown so you can fix the credentials.</p>
      <form onSubmit={submit}>
        <input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@example.com" className={`w-full rounded-lg border px-3 py-2.5 mb-4 ${T.input}`} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`rounded-full border px-4 py-2 text-sm font-semibold ${T.chip}`}>Cancel</button>
          <button disabled={busy} className="rounded-full bg-indigo-600 text-white px-5 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50">{busy ? 'Sending…' : 'Send test'}</button>
        </div>
      </form>
    </ModalShell>
  );
};

// ---------------- Profile dropdown menu ----------------
const ProfileMenu = ({ auth, onChangePassword, onProfile, onLogout, onTestEmail, T }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const Item = ({ icon, label, onClick }) => (
    <button onClick={() => { setOpen(false); onClick(); }} className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium ${T.tabIdle} ${T.itemHover} text-left`}>
      <span className="w-5 text-center">{icon}</span>{label}
    </button>
  );
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className={`flex items-center gap-2 rounded-full border pl-1 pr-3 py-1 ${T.chip}`}>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-black text-slate-900">{initials(auth.user.name || auth.user.username)}</span>
        <span className="hidden sm:inline text-sm font-semibold">{auth.user.username}</span>
        <span className="text-xs opacity-70">▾</span>
      </button>
      {open && (
        <div className={`absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl ${T.menu} z-50`}>
          <div className={`px-4 py-3 border-b ${T.divide}`}>
            <p className={`text-sm font-bold ${T.heading}`}>{auth.user.name || auth.user.username}</p>
            <p className={`text-xs capitalize ${T.sub}`}>{String(auth.user.role).replace('-', ' ')}</p>
          </div>
          <div className="py-1">
            <Item icon="👤" label="Profile" onClick={onProfile} />
            <Item icon="🔑" label="Change password" onClick={onChangePassword} />
            {onTestEmail && <Item icon="✉️" label="Send test email" onClick={onTestEmail} />}
          </div>
          <div className={`border-t ${T.divide} py-1`}>
            <button onClick={() => { setOpen(false); onLogout(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 text-left">
              <span className="w-5 text-center">⏻</span>Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------- Console ----------------
const Console = ({ auth, onLogout, showSuccess, showError, showConfirm, T, theme, toggleTheme }) => {
  const isSuper = auth.user.role === 'super-admin';
  const isOrganizer = auth.user.role === 'organizer';
  const canImport = ['super-admin', 'admin'].includes(auth.user.role);
  const canManageEvents = isSuper || isOrganizer || auth.user.role === 'admin';
  const canAssignOrganizer = isSuper || auth.user.role === 'admin';

  const [view, setView] = useState('events'); // 'events' | 'organizers'
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null); // 'password' | 'profile'

  const loadEvents = useCallback(async () => {
    try {
      const res = await api.get('/api/registrations/events');
      const list = res.data.events || [];
      setEvents(list);
      // Keep the current selection only if it still exists; otherwise fall back to the first event.
      setSelected((cur) => list.find((e) => e.id === cur?.id) || list[0] || null);
    } catch (err) {
      showError(err.response?.data?.error || 'Could not load events');
    }
  }, [showError]);

  const loadOrganizers = useCallback(async () => {
    if (!isSuper) return;
    try { const res = await api.get('/api/auth/organizers'); setOrganizers(res.data.organizers || []); }
    catch { /* ignore */ }
  }, [isSuper]);

  useEffect(() => { loadEvents(); loadOrganizers(); }, [loadEvents, loadOrganizers]);

  return (
    <div className={`min-h-screen ${T.pageCls}`} style={T.pageStyle}>
      <header className={`sticky top-0 z-40 border-b px-4 sm:px-6 py-3 flex items-center justify-between ${T.header}`}>
        <div className="flex items-center gap-3">
          <img src="/auction-logo.png" alt="" className="w-9 h-9 rounded-lg" />
          <div>
            <h1 className={`text-lg font-bold tracking-tight ${T.heading}`}>Registration Console</h1>
            {isSuper && (
              <nav className="mt-1 flex gap-1">
                {[['events', 'Events'], ['organizers', 'Organizers']].map(([k, label]) => (
                  <button key={k} onClick={() => setView(k)} className={`rounded-full px-3 py-0.5 text-xs font-semibold ${view === k ? 'bg-amber-400 text-slate-900' : T.tabIdle}`}>{label}</button>
                ))}
              </nav>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} className={`grid h-9 w-9 place-items-center rounded-full border text-base shadow-sm ${T.toggleBtn}`}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <ProfileMenu auth={auth} onChangePassword={() => setModal('password')} onProfile={() => setModal('profile')} onTestEmail={isSuper ? () => setModal('testemail') : undefined} onLogout={onLogout} T={T} />
        </div>
      </header>

      {view === 'organizers' && isSuper ? (
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
          <OrganizersPanel events={events} organizers={organizers} reload={loadOrganizers} showSuccess={showSuccess} showError={showError} showConfirm={showConfirm} T={T} />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <EventsPanel canManageEvents={canManageEvents} canAssignOrganizer={canAssignOrganizer} events={events} organizers={organizers} selected={selected} onSelect={setSelected} reload={loadEvents} showSuccess={showSuccess} showError={showError} showConfirm={showConfirm} T={T} />
          </div>
          <div className="lg:col-span-2">
            {selected ? (
              <RegistrationsPanel event={selected} canImport={canImport} reloadEvents={loadEvents} showSuccess={showSuccess} showError={showError} showConfirm={showConfirm} T={T} />
            ) : (
              <div className={`${T.card} p-10 text-center ${T.sub}`}>
                {canManageEvents ? 'Create an event to start collecting registrations.' : 'No event assigned to you yet.'}
              </div>
            )}
          </div>
        </div>
      )}

      {modal === 'password' && <ChangePasswordModal onClose={() => setModal(null)} showSuccess={showSuccess} showError={showError} T={T} />}
      {modal === 'profile' && <ProfileModal auth={auth} onClose={() => setModal(null)} T={T} />}
      {modal === 'testemail' && <TestEmailModal defaultTo={auth.user.email || ''} onClose={() => setModal(null)} showSuccess={showSuccess} showError={showError} T={T} />}
    </div>
  );
};

// ---------------- Profile (read-only) ----------------
const ProfileModal = ({ auth, onClose, T }) => {
  const rows = [
    ['Username', auth.user.username],
    ['Name', auth.user.name || '—'],
    ['Role', String(auth.user.role).replace('-', ' ')],
  ];
  return (
    <ModalShell onClose={onClose} T={T} title="Profile">
      <div className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className={`flex justify-between gap-4 text-sm border-b pb-2 ${T.divide}`}>
            <span className={T.sub}>{k}</span>
            <span className={`font-semibold capitalize ${T.heading}`}>{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 text-right">
        <button onClick={onClose} className={`rounded-full border px-4 py-2 text-sm font-semibold ${T.chip}`}>Close</button>
      </div>
    </ModalShell>
  );
};

// ---------------- Change own password ----------------
const ChangePasswordModal = ({ onClose, showSuccess, showError, T }) => {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/api/auth/change-password', { currentPassword: cur, newPassword: next });
      showSuccess('Password changed');
      onClose();
    } catch (err) { showError(err.response?.data?.error || 'Could not change password'); }
    finally { setBusy(false); }
  };
  return (
    <ModalShell onClose={onClose} T={T} title="Change password">
      <form onSubmit={submit}>
        <input type="password" placeholder="Current password" value={cur} onChange={(e) => setCur(e.target.value)} className={`w-full rounded-lg border px-3 py-2.5 mb-2 ${T.input}`} />
        <input type="password" placeholder="New password (min 6)" value={next} onChange={(e) => setNext(e.target.value)} className={`w-full rounded-lg border px-3 py-2.5 mb-4 ${T.input}`} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`rounded-full border px-4 py-2 text-sm font-semibold ${T.chip}`}>Cancel</button>
          <button disabled={busy} className="rounded-full bg-indigo-600 text-white px-5 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </ModalShell>
  );
};

// ---------------- Events panel ----------------
const emptyForm = { name: '', paymentRequired: true, regFee: '', upiId: '', organizerId: '' };
const EventsPanel = ({ canManageEvents, canAssignOrganizer, events, organizers, selected, onSelect, reload, showSuccess, showError, showConfirm, T }) => {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [orgFilter, setOrgFilter] = useState('');

  const startCreate = () => { setCreating(true); setEditing(null); setForm(emptyForm); setQr(null); };
  const startEdit = (ev) => {
    setEditing(ev.id); setCreating(false); setQr(null);
    setForm({ name: ev.name, paymentRequired: ev.payment_required, regFee: ev.reg_fee || '', upiId: ev.upi_id || '', organizerId: ev.organizer_id || '' });
  };
  const closeForm = () => { setCreating(false); setEditing(null); setForm(emptyForm); setQr(null); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showError('Event name is required');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('paymentRequired', form.paymentRequired);
      fd.append('regFee', form.regFee || 0);
      fd.append('upiId', form.upiId);
      if (canAssignOrganizer && form.organizerId) fd.append('organizerId', form.organizerId);
      if (qr) fd.append('qr', qr);
      if (editing) { await api.put(`/api/registrations/events/${editing}`, fd); showSuccess('Event updated'); }
      else { await api.post('/api/registrations/events', fd); showSuccess('Event created'); }
      closeForm();
      reload();
    } catch (err) {
      showError(err.response?.data?.error || 'Could not save event');
    } finally { setBusy(false); }
  };

  const toggleOpen = async (ev) => {
    try { await api.put(`/api/registrations/events/${ev.id}`, { registrationOpen: !ev.registration_open }); reload(); }
    catch (err) { showError(err.response?.data?.error || 'Update failed'); }
  };
  const remove = (ev) => {
    showConfirm(
      `“${ev.name}” and all of its registrations will be permanently deleted. This cannot be undone.`,
      'Delete this event?',
      async () => {
        try { await api.delete(`/api/registrations/events/${ev.id}`); showSuccess('Event deleted'); reload(); }
        catch (err) { showError(err.response?.data?.error || 'Delete failed'); }
      }
    );
  };
  const copyLink = (ev) => {
    navigator.clipboard?.writeText(`${window.location.origin}/register/${ev.slug}`);
    showSuccess('Registration link copied');
  };

  const filtered = events.filter((e) => {
    if (orgFilter === '__none' && e.organizer_id) return false;
    if (orgFilter && orgFilter !== '__none' && String(e.organizer_id) !== orgFilter) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!e.name.toLowerCase().includes(s) && !(e.organizer_name || '').toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <div className={`${T.card} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={`font-bold ${T.heading}`}>Events <span className={`text-xs font-normal ${T.sub}`}>({events.length})</span></h2>
        {canManageEvents && !editing && <button onClick={creating ? closeForm : startCreate} className="rounded-full bg-amber-400 text-slate-900 px-3 py-1 text-xs font-bold hover:bg-amber-300">{creating ? 'Cancel' : '+ New event'}</button>}
      </div>

      {(events.length > 4 || (canAssignOrganizer && organizers.length > 0)) && (
        <div className="flex gap-2 mb-3">
          {events.length > 4 && (
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events…" className={`flex-1 min-w-0 rounded-lg border px-3 py-2 text-sm ${T.input}`} />
          )}
          {canAssignOrganizer && organizers.length > 0 && (
            <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)} className={`rounded-lg border px-3 py-2 text-sm ${T.input} ${events.length > 4 ? 'w-40 shrink-0' : 'w-full'}`}>
              <option value="">All organizers</option>
              <option value="__none">Unassigned</option>
              {organizers.map((o) => <option key={o.id} value={String(o.id)}>{o.name || o.username}</option>)}
            </select>
          )}
        </div>
      )}

      {canManageEvents && (creating || editing) && (
        <form onSubmit={submit} className={`space-y-2 mb-4 rounded-xl border p-3 ${T.soft}`}>
          <input className={`w-full rounded-lg border px-3 py-2 text-sm ${T.input}`} placeholder="Event name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className={`flex items-center gap-2 text-sm ${T.label}`}>
            <input type="checkbox" checked={form.paymentRequired} onChange={(e) => setForm({ ...form, paymentRequired: e.target.checked })} />
            Paid registration
          </label>
          {form.paymentRequired && (
            <>
              <input className={`w-full rounded-lg border px-3 py-2 text-sm ${T.input}`} placeholder="Registration fee (₹)" value={form.regFee} onChange={(e) => setForm({ ...form, regFee: e.target.value })} inputMode="numeric" />
              <input className={`w-full rounded-lg border px-3 py-2 text-sm ${T.input}`} placeholder="UPI ID" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} />
              <label className={`block text-xs ${T.sub}`}>Payment QR image{editing ? ' (upload to replace)' : ''}
                <input type="file" accept="image/*" onChange={(e) => setQr(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs" />
              </label>
            </>
          )}
          {canAssignOrganizer && (
            <select className={`w-full rounded-lg border px-3 py-2 text-sm ${T.input}`} value={form.organizerId} onChange={(e) => setForm({ ...form, organizerId: e.target.value })}>
              <option value="">Assign organizer (optional)…</option>
              {organizers.map((o) => <option key={o.id} value={o.id}>{o.name || o.username}</option>)}
            </select>
          )}
          <div className="flex gap-2">
            <button disabled={busy} className="flex-1 rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50">{busy ? 'Saving…' : editing ? 'Update event' : 'Create event'}</button>
            <button type="button" onClick={closeForm} className={`rounded-full border px-4 py-2 text-sm font-semibold ${T.chip}`}>Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && <p className={`text-sm ${T.sub}`}>{events.length === 0 ? 'No events yet.' : 'No events match your filters.'}</p>}
        {filtered.map((ev) => (
          <div key={ev.id} className={`rounded-xl border p-3 cursor-pointer transition ${selected?.id === ev.id ? T.cardSel : T.cardIdle}`} onClick={() => onSelect(ev)}>
            <div className="flex items-center justify-between gap-2">
              <span className={`font-semibold truncate ${T.heading}`}>{ev.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.registration_open ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{ev.registration_open ? 'OPEN' : 'CLOSED'}</span>
            </div>
            <div className={`mt-1 text-xs ${T.sub}`}>
              {ev.payment_required ? `Paid · ${money(ev.reg_fee)}` : 'Free entry'}
              {ev.organizer_name ? ` · 👤 ${ev.organizer_name}` : (canAssignOrganizer ? ' · 👤 unassigned' : '')}
            </div>
            {ev.counts && ev.counts.total > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-300">{ev.counts.total} total</span>
                {ev.counts.pending > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{ev.counts.pending} pending</span>}
                {ev.counts.verified > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{ev.counts.verified} approved</span>}
              </div>
            )}
            {canManageEvents && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={(e) => { e.stopPropagation(); copyLink(ev); }} className={`rounded-full border px-3 py-1 text-xs font-semibold ${T.chip}`}>🔗 Copy link</button>
                <button onClick={(e) => { e.stopPropagation(); startEdit(ev); }} className={`rounded-full border px-3 py-1 text-xs font-semibold ${T.chip}`}>✏️ Edit</button>
                <button onClick={(e) => { e.stopPropagation(); toggleOpen(ev); }} className={`rounded-full border px-3 py-1 text-xs font-semibold ${T.chip}`}>{ev.registration_open ? 'Close' : 'Open'}</button>
                <button onClick={(e) => { e.stopPropagation(); remove(ev); }} className="rounded-full border border-rose-300/40 bg-rose-500/10 text-rose-300 px-3 py-1 text-xs font-semibold hover:bg-rose-500/20">Delete</button>
              </div>
            )}
            {!canManageEvents && (
              <button onClick={(e) => { e.stopPropagation(); copyLink(ev); }} className={`mt-2 rounded-full border px-3 py-1 text-xs font-semibold ${T.chip}`}>🔗 Copy link</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------- Reset a user's password (super-admin) ----------------
const ResetPasswordModal = ({ user, onClose, showSuccess, showError, reload, T }) => {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const generate = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    setPw(Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
  };
  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 6) return showError('Password must be at least 6 characters');
    setBusy(true);
    try {
      await api.post(`/api/auth/users/${user.id}/reset-password`, { newPassword: pw });
      showSuccess(`Password reset for @${user.username}`);
      onClose();
      reload();
    } catch (err) { showError(err.response?.data?.error || 'Reset failed'); }
    finally { setBusy(false); }
  };
  return (
    <ModalShell onClose={onClose} T={T} title="Reset password">
      <p className={`text-xs mb-3 ${T.sub}`}>Set a new password for <span className={`font-semibold ${T.heading}`}>@{user.username}</span>, then share it with them securely.</p>
      <form onSubmit={submit}>
        <div className="flex gap-2 mb-4">
          <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (min 6)" className={`flex-1 min-w-0 rounded-lg border px-3 py-2.5 ${T.input}`} />
          <button type="button" onClick={generate} className={`shrink-0 rounded-lg border px-3 text-xs font-semibold ${T.chip}`}>Generate</button>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`rounded-full border px-4 py-2 text-sm font-semibold ${T.chip}`}>Cancel</button>
          <button disabled={busy} className="rounded-full bg-indigo-600 text-white px-5 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50">{busy ? 'Saving…' : 'Reset password'}</button>
        </div>
      </form>
    </ModalShell>
  );
};

// ---------------- Organizers panel (super-admin, own view) ----------------
const OrganizersPanel = ({ events, organizers, reload, showSuccess, showError, showConfirm, T }) => {
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', phone: '', eventId: '' });
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [resetting, setResetting] = useState(null);

  const create = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return showError('Username and password required');
    setBusy(true);
    try {
      await api.post('/api/auth/organizer', form);
      showSuccess('Organizer created');
      setForm({ username: '', password: '', name: '', email: '', phone: '', eventId: '' });
      reload();
    } catch (err) { showError(err.response?.data?.error || 'Could not create organizer'); }
    finally { setBusy(false); }
  };

  const resetPassword = (o) => setResetting(o);

  const removeOrganizer = (o) => {
    showConfirm(
      `Delete organizer “${o.name || o.username}”? Their events will be unassigned (not deleted).`,
      'Delete organizer?',
      async () => {
        try { await api.delete(`/api/auth/organizer/${o.id}`); showSuccess('Organizer deleted'); reload(); }
        catch (err) { showError(err.response?.data?.error || 'Delete failed'); }
      }
    );
  };

  const eventsFor = (oid) => events.filter((e) => e.organizer_id === oid).map((e) => e.name);
  const filtered = q
    ? organizers.filter((o) => [o.username, o.name, o.email, o.phone].some((v) => (v || '').toLowerCase().includes(q.toLowerCase())))
    : organizers;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className={`${T.card} p-5 md:col-span-1 h-fit`}>
        <h2 className={`font-bold mb-3 ${T.heading}`}>Add organizer</h2>
        <form onSubmit={create} className="space-y-2">
          <input className={`w-full rounded-lg border px-3 py-2 text-sm ${T.input}`} placeholder="Username *" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input className={`w-full rounded-lg border px-3 py-2 text-sm ${T.input}`} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={`w-full rounded-lg border px-3 py-2 text-sm ${T.input}`} placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={`w-full rounded-lg border px-3 py-2 text-sm ${T.input}`} placeholder="Phone (10 digits)" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
          <input type="password" className={`w-full rounded-lg border px-3 py-2 text-sm ${T.input}`} placeholder="Password *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className={`w-full rounded-lg border px-3 py-2 text-sm ${T.input}`} value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>
            <option value="">Assign to event (optional)…</option>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <button disabled={busy} className="w-full rounded-full bg-amber-400 text-slate-900 px-4 py-2 text-sm font-bold hover:bg-amber-300 disabled:opacity-50">{busy ? 'Creating…' : 'Create organizer'}</button>
        </form>
        <p className={`mt-3 text-[11px] ${T.sub}`}>Email/phone help avoid duplicates and power the forgot-password request.</p>
      </div>

      <div className={`${T.card} p-5 md:col-span-2`}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className={`font-bold ${T.heading}`}>Organizers <span className={`text-xs font-normal ${T.sub}`}>({organizers.length})</span></h2>
          {organizers.length > 4 && <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className={`rounded-lg border px-3 py-1.5 text-sm w-40 ${T.input}`} />}
        </div>
        <div className="space-y-2">
          {filtered.length === 0 && <p className={`text-sm ${T.sub}`}>{organizers.length === 0 ? 'No organizers yet.' : 'No matches.'}</p>}
          {filtered.map((o) => {
            const evs = eventsFor(o.id);
            return (
              <div key={o.id} className={`rounded-xl border p-3 ${T.cardIdle}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold ${T.heading}`}>{o.name || o.username}</span>
                      <span className={`text-xs ${T.sub}`}>@{o.username}</span>
                      {o.reset_requested_at && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">🔒 Reset requested</span>}
                    </div>
                    <div className={`text-xs mt-0.5 ${T.sub}`}>
                      {o.email || 'no email'}{o.phone ? ` · 📱 ${o.phone}` : ''}
                    </div>
                    <div className={`text-[11px] mt-1 ${T.sub}`}>Events: {evs.length ? evs.join(', ') : '—'}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button onClick={() => resetPassword(o)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${o.reset_requested_at ? 'bg-amber-400 text-slate-900 border-amber-400 hover:bg-amber-300' : T.chip}`}>Reset password</button>
                    <button onClick={() => removeOrganizer(o)} className="rounded-full border border-rose-300/40 bg-rose-500/10 text-rose-300 px-3 py-1 text-xs font-semibold hover:bg-rose-500/20">Delete</button>
                  </div>
                </div>              </div>
            );
          })}
        </div>
        <p className={`mt-3 text-[11px] ${T.sub}`}>Tip: assign one organizer to multiple events (season 1, 2…) via each event's Edit → organizer.</p>
      </div>
      {resetting && <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} showSuccess={showSuccess} showError={showError} reload={reload} T={T} />}
    </div>
  );
};

// ---------------- Registrations panel ----------------
const RegistrationsPanel = ({ event, canImport, reloadEvents, showSuccess, showError, showConfirm, T }) => {
  const [all, setAll] = useState([]);
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/registrations/events/${event.id}/registrations`);
      setAll(res.data.registrations || []);
    } catch (err) { showError(err.response?.data?.error || 'Could not load registrations'); }
    finally { setLoading(false); }
  }, [event.id, showError]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    try { await api.patch(`/api/registrations/registrations/${id}/status`, { status }); load(); reloadEvents?.(); }
    catch (err) { showError(err.response?.data?.error || 'Update failed'); }
  };

  const deleteReg = (r) => {
    showConfirm(
      `Delete “${r.name}” from this event? This cannot be undone.`,
      'Delete registration?',
      async () => {
        try { await api.delete(`/api/registrations/registrations/${r.id}`); showSuccess('Registration deleted'); load(); reloadEvents?.(); }
        catch (err) { showError(err.response?.data?.error || 'Delete failed'); }
      }
    );
  };

  const importToAuction = async () => {
    setImporting(true);
    try { const res = await api.post(`/api/registrations/events/${event.id}/import-to-auction`); showSuccess(res.data.message || 'Imported'); }
    catch (err) { showError(err.response?.data?.error || 'Import failed'); }
    finally { setImporting(false); }
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/api/registrations/events/${event.id}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `${event.slug}-registrations.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { showError('Export failed'); }
    finally { setExporting(false); }
  };

  const counts = all.reduce((a, r) => { a[r.payment_status] = (a[r.payment_status] || 0) + 1; return a; }, {});
  const regs = all
    .filter((r) => (filter ? r.payment_status === filter : true))
    .filter((r) => (q ? (r.name || '').toLowerCase().includes(q.toLowerCase()) || (r.mobile || '').includes(q) : true))
    .sort((a, b) => sort === 'new'
      ? new Date(b.created_at) - new Date(a.created_at)
      : new Date(a.created_at) - new Date(b.created_at));

  return (
    <div className={`${T.card} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className={`font-bold ${T.heading}`}>{event.name} — Registrations</h2>
          <p className={`text-xs ${T.sub} break-all`}>Link: {window.location.origin}/register/{event.slug}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} disabled={exporting} className="rounded-full bg-gradient-to-b from-sky-500 to-blue-600 text-white px-4 py-2 text-sm font-semibold shadow hover:-translate-y-0.5 transition disabled:opacity-50">
            {exporting ? 'Exporting…' : '⬇ Export Excel'}
          </button>
          {canImport && (
            <button onClick={importToAuction} disabled={importing} className="rounded-full bg-gradient-to-b from-emerald-500 to-teal-600 text-white px-4 py-2 text-sm font-semibold shadow hover:-translate-y-0.5 transition disabled:opacity-50">
              {importing ? 'Importing…' : '⬇ Import to auction'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[['', 'All', all.length], ['pending', 'Pending', counts.pending || 0], ['verified', 'Approved', counts.verified || 0], ['rejected', 'Rejected', counts.rejected || 0]].map(([s, label, n]) => (
          <button key={s || 'all'} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs font-semibold border ${filter === s ? 'bg-indigo-600 text-white border-indigo-600' : T.chip}`}>
            {label} ({n})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or mobile…" className={`flex-1 min-w-[10rem] rounded-lg border px-3 py-2 text-sm ${T.input}`} />
        <button onClick={() => setSort((s) => (s === 'new' ? 'old' : 'new'))} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${T.chip}`}>
          {sort === 'new' ? '↓ Newest first' : '↑ Oldest first'}
        </button>
      </div>

      {loading ? (
        <p className={`text-sm py-8 text-center ${T.sub}`}>Loading…</p>
      ) : regs.length === 0 ? (
        <p className={`text-sm py-8 text-center ${T.sub}`}>No registrations here.</p>
      ) : (
        <div className="space-y-3">
          {regs.map((r) => {
            const decided = r.payment_status === 'verified' || r.payment_status === 'rejected';
            return (
              <div key={r.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border p-3 ${T.cardIdle}`}>
                <img src={r.profile_pic_url || '/logo192.png'} alt="" className="w-14 h-14 rounded-lg object-cover bg-slate-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold ${T.heading}`}>{r.name}</span>
                    <span className={`text-xs ${T.sub}`}>{r.role}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[r.payment_status] || 'bg-slate-100'}`}>
                      {r.payment_status === 'verified' ? '✓ Approved' : r.payment_status === 'rejected' ? '✗ Rejected' : r.payment_status}
                    </span>
                  </div>
                  <div className={`text-xs mt-0.5 ${T.sub}`}>📱 {r.mobile}{r.profile_link ? ' · ' : ''}{r.profile_link && <a href={r.profile_link} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">profile</a>}</div>
                  {r.payment_txn_id && <div className={`text-xs mt-0.5 ${T.sub}`}>UTR: {r.payment_txn_id} {r.payment_screenshot_url && <a href={r.payment_screenshot_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline ml-1">view proof</a>}</div>}
                  {r.created_at && <div className={`text-[11px] mt-0.5 ${T.sub}`}>🕒 {new Date(r.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {decided ? (
                    <button onClick={() => setStatus(r.id, 'pending')} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${T.chip}`}>✏️ Edit decision</button>
                  ) : r.payment_status === 'not_required' ? (
                    <button onClick={() => setStatus(r.id, 'verified')} className="rounded-full bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-500">Approve</button>
                  ) : (
                    <>
                      <button onClick={() => setStatus(r.id, 'verified')} className="rounded-full bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-500">Approve</button>
                      <button onClick={() => setStatus(r.id, 'rejected')} className="rounded-full bg-rose-100 text-rose-700 px-3 py-1.5 text-xs font-semibold hover:bg-rose-200">Reject</button>
                    </>
                  )}
                  <button onClick={() => deleteReg(r)} title="Delete registration" className={`rounded-full border px-2.5 py-1.5 text-xs font-semibold ${T.chip}`}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RegistrationsAdmin;
