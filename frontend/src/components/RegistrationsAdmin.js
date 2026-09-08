import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNotification } from './NotificationSystem';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Isolated axios instance so this page's auth never clobbers the dashboard's.
const api = axios.create({ baseURL: API_BASE_URL });

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// ---- Theme tokens (dark default, matching the project; light optional) ----
const DARK_BG = { background: 'radial-gradient(58rem 40rem at -8% -18%, rgba(232,184,75,0.16) 0%, transparent 60%), radial-gradient(54rem 40rem at 112% 116%, rgba(176,120,32,0.18) 0%, transparent 60%), linear-gradient(160deg, #0a0a0f 0%, #12101b 46%, #0b0b11 100%)' };
const THEMES = {
  dark: {
    isDark: true,
    pageStyle: DARK_BG, pageCls: 'text-white',
    header: 'bg-white/[0.04] border-white/10 backdrop-blur-xl',
    card: 'rounded-2xl border border-white/12 bg-white/[0.05] backdrop-blur-xl',
    cardSel: 'border-amber-300/60 bg-amber-400/10',
    cardIdle: 'border-white/12 hover:border-white/25',
    heading: 'text-white', sub: 'text-indigo-200/60', label: 'text-indigo-200/80',
    input: 'bg-white/10 border-white/20 text-white placeholder-white/40 [&>option]:text-slate-900',
    chip: 'bg-white/10 text-white border-white/20 hover:bg-white/20',
    soft: 'bg-white/[0.06] border-white/10',
    divide: 'border-white/10',
  },
  light: {
    isDark: false,
    pageStyle: { backgroundColor: '#f6f4ef' }, pageCls: 'text-slate-900',
    header: 'bg-white border-slate-200',
    card: 'rounded-2xl border border-slate-200 bg-white',
    cardSel: 'border-indigo-400 bg-indigo-50',
    cardIdle: 'border-slate-200 hover:border-slate-300',
    heading: 'text-slate-900', sub: 'text-slate-500', label: 'text-slate-600',
    input: 'bg-white border-slate-300 text-slate-900 placeholder-slate-400',
    chip: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
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
  const { showSuccess, showError } = useNotification();
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
  if (!auth) return <LoginView onAuthed={setAuth} showError={showError} theme={theme} toggleTheme={toggleTheme} T={T} />;
  return <Console auth={auth} onLogout={onLogout} showSuccess={showSuccess} showError={showError} T={T} theme={theme} toggleTheme={toggleTheme} />;
};

// ---------------- Login ----------------
const LoginView = ({ onAuthed, showError, T, theme, toggleTheme }) => {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

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
        <input type="password" className={`w-full rounded-lg border px-3 py-2.5 mb-5 focus:outline-none focus:ring-2 focus:ring-amber-300/50 ${T.input}`} value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} />
        <button disabled={loading} className="w-full rounded-full bg-gradient-to-b from-amber-400 to-amber-500 px-6 py-2.5 text-sm font-bold text-slate-900 hover:-translate-y-0.5 transition disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <button type="button" onClick={toggleTheme} className={`mt-3 w-full rounded-full border px-4 py-1.5 text-xs font-semibold ${T.chip}`}>
          {theme === 'dark' ? '☀️ Light theme' : '🌙 Dark theme'}
        </button>
      </form>
    </div>
  );
};

// ---------------- Console ----------------
const Console = ({ auth, onLogout, showSuccess, showError, T, theme, toggleTheme }) => {
  const isSuper = auth.user.role === 'super-admin';
  const canImport = ['super-admin', 'admin'].includes(auth.user.role);
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showPwd, setShowPwd] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const res = await api.get('/api/registrations/events');
      const list = res.data.events || [];
      setEvents(list);
      setSelected((cur) => list.find((e) => e.id === cur?.id) || cur || list[0] || null);
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
      <header className={`border-b px-4 sm:px-6 py-3 flex items-center justify-between ${T.header}`}>
        <div className="flex items-center gap-3">
          <img src="/auction-logo.png" alt="" className="w-9 h-9 rounded-lg" />
          <div>
            <h1 className={`text-lg font-bold tracking-tight ${T.heading}`}>Registration Console</h1>
            <p className={`text-xs ${T.sub}`}>{auth.user.username} · {auth.user.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${T.chip}`} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setShowPwd(true)} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${T.chip}`}>Password</button>
          <button onClick={onLogout} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${T.chip}`}>Logout</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <EventsPanel isSuper={isSuper} events={events} organizers={organizers} selected={selected} onSelect={setSelected} reload={loadEvents} showSuccess={showSuccess} showError={showError} T={T} />
          {isSuper && <OrganizersPanel events={events} organizers={organizers} reload={loadOrganizers} showSuccess={showSuccess} showError={showError} T={T} />}
        </div>
        <div className="lg:col-span-2">
          {selected ? (
            <RegistrationsPanel event={selected} canImport={canImport} showSuccess={showSuccess} showError={showError} T={T} />
          ) : (
            <div className={`${T.card} p-10 text-center ${T.sub}`}>
              {isSuper ? 'Create an event to start collecting registrations.' : 'No event assigned to you yet.'}
            </div>
          )}
        </div>
      </div>

      {showPwd && <ChangePasswordModal onClose={() => setShowPwd(false)} showSuccess={showSuccess} showError={showError} T={T} />}
    </div>
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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={submit} className={`relative w-full max-w-sm ${T.card} p-6`}>
        <h3 className={`text-lg font-bold mb-4 ${T.heading}`}>Change Password</h3>
        <input type="password" placeholder="Current password" value={cur} onChange={(e) => setCur(e.target.value)} className={`w-full rounded-lg border px-3 py-2.5 mb-2 ${T.input}`} />
        <input type="password" placeholder="New password (min 6)" value={next} onChange={(e) => setNext(e.target.value)} className={`w-full rounded-lg border px-3 py-2.5 mb-4 ${T.input}`} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`rounded-full border px-4 py-2 text-sm font-semibold ${T.chip}`}>Cancel</button>
          <button disabled={busy} className="rounded-full bg-indigo-600 text-white px-5 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
};

// ---------------- Events panel ----------------
const emptyForm = { name: '', paymentRequired: true, regFee: '', upiId: '', organizerId: '' };
const EventsPanel = ({ isSuper, events, organizers, selected, onSelect, reload, showSuccess, showError, T }) => {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null); // event id being edited
  const [form, setForm] = useState(emptyForm);
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);

  const startEdit = (ev) => {
    setEditing(ev.id); setCreating(false); setQr(null);
    setForm({ name: ev.name, paymentRequired: ev.payment_required, regFee: ev.reg_fee || '', upiId: ev.upi_id || '', organizerId: ev.organizer_id || '' });
  };

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
      if (form.organizerId) fd.append('organizerId', form.organizerId);
      if (qr) fd.append('qr', qr);
      if (editing) {
        await api.put(`/api/registrations/events/${editing}`, fd);
        showSuccess('Event updated');
      } else {
        await api.post('/api/registrations/events', fd);
        showSuccess('Event created');
      }
      setForm(emptyForm); setQr(null); setCreating(false); setEditing(null);
      reload();
    } catch (err) {
      showError(err.response?.data?.error || 'Could not save event');
    } finally { setBusy(false); }
  };

  const toggleOpen = async (ev) => {
    try { await api.put(`/api/registrations/events/${ev.id}`, { registrationOpen: !ev.registration_open }); reload(); }
    catch (err) { showError(err.response?.data?.error || 'Update failed'); }
  };

  const remove = async (ev) => {
    if (!window.confirm(`Delete event "${ev.name}" and all its registrations?`)) return;
    try { await api.delete(`/api/registrations/events/${ev.id}`); showSuccess('Event deleted'); reload(); }
    catch (err) { showError(err.response?.data?.error || 'Delete failed'); }
  };

  const copyLink = (ev) => {
    navigator.clipboard?.writeText(`${window.location.origin}/register/${ev.slug}`);
    showSuccess('Registration link copied');
  };

  const EventForm = (
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
      <select className={`w-full rounded-lg border px-3 py-2 text-sm ${T.input}`} value={form.organizerId} onChange={(e) => setForm({ ...form, organizerId: e.target.value })}>
        <option value="">Assign organizer (optional)…</option>
        {organizers.map((o) => <option key={o.id} value={o.id}>{o.name || o.username}</option>)}
      </select>
      <div className="flex gap-2">
        <button disabled={busy} className="flex-1 rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50">{busy ? 'Saving…' : editing ? 'Update Event' : 'Create Event'}</button>
        <button type="button" onClick={() => { setCreating(false); setEditing(null); setForm(emptyForm); }} className={`rounded-full border px-4 py-2 text-sm font-semibold ${T.chip}`}>Cancel</button>
      </div>
    </form>
  );

  return (
    <div className={`${T.card} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={`font-bold ${T.heading}`}>Events</h2>
        {isSuper && !editing && <button onClick={() => { setCreating((v) => !v); setForm(emptyForm); }} className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">{creating ? 'Cancel' : '+ New'}</button>}
      </div>

      {isSuper && (creating || editing) && EventForm}

      <div className="space-y-2">
        {events.length === 0 && <p className={`text-sm ${T.sub}`}>No events yet.</p>}
        {events.map((ev) => (
          <div key={ev.id} className={`rounded-xl border p-3 cursor-pointer transition ${selected?.id === ev.id ? T.cardSel : T.cardIdle}`} onClick={() => onSelect(ev)}>
            <div className="flex items-center justify-between gap-2">
              <span className={`font-semibold truncate ${T.heading}`}>{ev.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.registration_open ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{ev.registration_open ? 'OPEN' : 'CLOSED'}</span>
            </div>
            <div className={`mt-1 text-xs ${T.sub}`}>
              {ev.payment_required ? `Paid · ${money(ev.reg_fee)}` : 'Free entry'}
              {ev.organizer_name ? ` · 👤 ${ev.organizer_name}` : (isSuper ? ' · 👤 unassigned' : '')}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={(e) => { e.stopPropagation(); copyLink(ev); }} className={`rounded-full border px-3 py-1 text-xs font-semibold ${T.chip}`}>🔗 Copy link</button>
              {isSuper && <button onClick={(e) => { e.stopPropagation(); startEdit(ev); }} className={`rounded-full border px-3 py-1 text-xs font-semibold ${T.chip}`}>✏️ Edit</button>}
              {isSuper && <button onClick={(e) => { e.stopPropagation(); toggleOpen(ev); }} className={`rounded-full border px-3 py-1 text-xs font-semibold ${T.chip}`}>{ev.registration_open ? 'Close' : 'Open'}</button>}
              {isSuper && <button onClick={(e) => { e.stopPropagation(); remove(ev); }} className="rounded-full border border-rose-300/40 bg-rose-500/10 text-rose-300 px-3 py-1 text-xs font-semibold hover:bg-rose-500/20">Delete</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------- Organizers panel ----------------
const OrganizersPanel = ({ events, organizers, reload, showSuccess, showError, T }) => {
  const [form, setForm] = useState({ username: '', password: '', name: '', eventId: '' });
  const [busy, setBusy] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return showError('Username and password required');
    setBusy(true);
    try {
      await api.post('/api/auth/organizer', form);
      showSuccess('Organizer created');
      setForm({ username: '', password: '', name: '', eventId: '' });
      reload();
    } catch (err) { showError(err.response?.data?.error || 'Could not create organizer'); }
    finally { setBusy(false); }
  };

  const resetPassword = async (o) => {
    const pw = window.prompt(`New password for ${o.username} (min 6 chars):`);
    if (pw === null) return;
    if (pw.length < 6) return showError('Password must be at least 6 characters');
    try { await api.post(`/api/auth/users/${o.id}/reset-password`, { newPassword: pw }); showSuccess(`Password reset for ${o.username}`); }
    catch (err) { showError(err.response?.data?.error || 'Reset failed'); }
  };

  const eventsFor = (oid) => events.filter((e) => e.organizer_id === oid).map((e) => e.name).join(', ') || '—';

  return (
    <div className={`${T.card} p-5`}>
      <h2 className={`font-bold mb-3 ${T.heading}`}>Organizers</h2>
      <form onSubmit={create} className="space-y-2 mb-3">
        <div className="grid grid-cols-2 gap-2">
          <input className={`rounded-lg border px-3 py-2 text-sm ${T.input}`} placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input type="password" className={`rounded-lg border px-3 py-2 text-sm ${T.input}`} placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <input className={`w-full rounded-lg border px-3 py-2 text-sm ${T.input}`} placeholder="Name (optional)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className={`w-full rounded-lg border px-3 py-2 text-sm ${T.input}`} value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>
          <option value="">Assign to event (optional)…</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
        <button disabled={busy} className="w-full rounded-full bg-slate-700 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-600 disabled:opacity-50">{busy ? 'Creating…' : 'Create Organizer'}</button>
      </form>
      <div className="space-y-1">
        {organizers.map((o) => (
          <div key={o.id} className={`flex items-center justify-between gap-2 text-sm border-t pt-1.5 ${T.divide}`}>
            <div className="min-w-0">
              <span className={`font-medium ${T.heading}`}>{o.username}</span>
              <span className={`block text-[11px] truncate ${T.sub}`}>{eventsFor(o.id)}</span>
            </div>
            <button onClick={() => resetPassword(o)} className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${T.chip}`}>Reset PW</button>
          </div>
        ))}
        {organizers.length === 0 && <p className={`text-xs ${T.sub}`}>No organizers yet.</p>}
      </div>
      <p className={`mt-2 text-[11px] ${T.sub}`}>Tip: assign one organizer to multiple events (season 1, 2…) by editing each event's organizer.</p>
    </div>
  );
};

// ---------------- Registrations panel ----------------
const RegistrationsPanel = ({ event, canImport, showSuccess, showError, T }) => {
  const [all, setAll] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch the full list once so tab counts are always correct.
      const res = await api.get(`/api/registrations/events/${event.id}/registrations`);
      setAll(res.data.registrations || []);
    } catch (err) { showError(err.response?.data?.error || 'Could not load registrations'); }
    finally { setLoading(false); }
  }, [event.id, showError]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    try { await api.patch(`/api/registrations/registrations/${id}/status`, { status }); load(); }
    catch (err) { showError(err.response?.data?.error || 'Update failed'); }
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
  const regs = filter ? all.filter((r) => r.payment_status === filter) : all;

  return (
    <div className={`${T.card} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className={`font-bold ${T.heading}`}>{event.name} — Registrations</h2>
          <p className={`text-xs ${T.sub} break-all`}>Link: {window.location.origin}/register/{event.slug}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} disabled={exporting} className={`rounded-full border px-4 py-2 text-sm font-semibold ${T.chip} disabled:opacity-50`}>
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
