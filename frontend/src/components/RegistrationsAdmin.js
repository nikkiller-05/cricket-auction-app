import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNotification } from './NotificationSystem';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Isolated axios instance so this page's auth never clobbers the dashboard's.
const api = axios.create({ baseURL: API_BASE_URL });

const bg = { background: 'radial-gradient(58rem 40rem at -8% -18%, rgba(232,184,75,0.16) 0%, transparent 60%), radial-gradient(54rem 40rem at 112% 116%, rgba(176,120,32,0.18) 0%, transparent 60%), linear-gradient(160deg, #0a0a0f 0%, #12101b 46%, #0b0b11 100%)' };
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
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

  if (booting) return <div className="min-h-screen" style={bg} />;
  if (!auth) return <LoginView onAuthed={setAuth} showError={showError} />;
  return <Console auth={auth} onLogout={onLogout} showSuccess={showSuccess} showError={showError} />;
};

// ---------------- Login ----------------
const LoginView = ({ onAuthed, showError }) => {
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
    <div className="min-h-screen flex items-center justify-center px-4" style={bg}>
      <form onSubmit={login} className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-2xl p-7 text-white">
        <div className="text-center mb-6">
          <img src="/auction-logo.png" alt="" className="w-14 h-14 rounded-xl mx-auto mb-3 ring-1 ring-amber-300/30" />
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/90 font-bold">Registration Console</p>
        </div>
        <label className="block text-xs font-semibold text-indigo-200/80 mb-1">Username</label>
        <input className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-amber-300/50" value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value })} />
        <label className="block text-xs font-semibold text-indigo-200/80 mb-1">Password</label>
        <input type="password" className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2.5 mb-5 focus:outline-none focus:ring-2 focus:ring-amber-300/50" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} />
        <button disabled={loading} className="w-full rounded-full bg-gradient-to-b from-amber-400 to-amber-500 px-6 py-2.5 text-sm font-bold text-slate-900 hover:-translate-y-0.5 transition disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

// ---------------- Console ----------------
const Console = ({ auth, onLogout, showSuccess, showError }) => {
  const isSuper = auth.user.role === 'super-admin';
  const canImport = ['super-admin', 'admin'].includes(auth.user.role);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);

  const loadEvents = useCallback(async () => {
    try {
      const res = await api.get('/api/registrations/events');
      let list = res.data.events || [];
      if (auth.user.role === 'organizer' && auth.user.eventId) {
        list = list.filter((e) => e.id === auth.user.eventId);
      }
      setEvents(list);
      setSelected((cur) => cur || list[0] || null);
    } catch (err) {
      showError(err.response?.data?.error || 'Could not load events');
    }
  }, [auth.user, showError]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/auction-logo.png" alt="" className="w-9 h-9 rounded-lg" />
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Registration Console</h1>
            <p className="text-xs text-slate-500">{auth.user.username} · {auth.user.role}</p>
          </div>
        </div>
        <button onClick={onLogout} className="rounded-full bg-slate-100 border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Logout</button>
      </header>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <EventsPanel isSuper={isSuper} events={events} selected={selected} onSelect={setSelected} reload={loadEvents} showSuccess={showSuccess} showError={showError} />
          {isSuper && <OrganizersPanel events={events} showSuccess={showSuccess} showError={showError} />}
        </div>
        <div className="lg:col-span-2">
          {selected ? (
            <RegistrationsPanel event={selected} canImport={canImport} showSuccess={showSuccess} showError={showError} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              {isSuper ? 'Create an event to start collecting registrations.' : 'No event assigned yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------- Events panel ----------------
const EventsPanel = ({ isSuper, events, selected, onSelect, reload, showSuccess, showError }) => {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', paymentRequired: true, regFee: '', upiId: '' });
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);

  const createEvent = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showError('Event name is required');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('paymentRequired', form.paymentRequired);
      fd.append('regFee', form.regFee || 0);
      fd.append('upiId', form.upiId);
      if (qr) fd.append('qr', qr);
      await api.post('/api/registrations/events', fd);
      showSuccess('Event created');
      setForm({ name: '', paymentRequired: true, regFee: '', upiId: '' });
      setQr(null); setCreating(false);
      reload();
    } catch (err) {
      showError(err.response?.data?.error || 'Could not create event');
    } finally { setBusy(false); }
  };

  const toggleOpen = async (ev) => {
    try {
      await api.put(`/api/registrations/events/${ev.id}`, { registrationOpen: !ev.registration_open });
      reload();
    } catch (err) { showError(err.response?.data?.error || 'Update failed'); }
  };

  const copyLink = (ev) => {
    const link = `${window.location.origin}/register/${ev.slug}`;
    navigator.clipboard?.writeText(link);
    showSuccess('Registration link copied');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-slate-900">Events</h2>
        {isSuper && <button onClick={() => setCreating((v) => !v)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">{creating ? 'Cancel' : '+ New'}</button>}
      </div>

      {creating && (
        <form onSubmit={createEvent} className="space-y-2 mb-4 rounded-xl bg-slate-50 border border-slate-200 p-3">
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Event name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.paymentRequired} onChange={(e) => setForm({ ...form, paymentRequired: e.target.checked })} />
            Paid registration
          </label>
          {form.paymentRequired && (
            <>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Registration fee (₹)" value={form.regFee} onChange={(e) => setForm({ ...form, regFee: e.target.value })} inputMode="numeric" />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="UPI ID" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} />
              <label className="block text-xs text-slate-500">Payment QR image
                <input type="file" accept="image/*" onChange={(e) => setQr(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs" />
              </label>
            </>
          )}
          <button disabled={busy} className="w-full rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50">{busy ? 'Creating…' : 'Create Event'}</button>
        </form>
      )}

      <div className="space-y-2">
        {events.length === 0 && <p className="text-sm text-slate-400">No events yet.</p>}
        {events.map((ev) => (
          <div key={ev.id} className={`rounded-xl border p-3 cursor-pointer transition ${selected?.id === ev.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`} onClick={() => onSelect(ev)}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-900 truncate">{ev.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.registration_open ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{ev.registration_open ? 'OPEN' : 'CLOSED'}</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">{ev.payment_required ? `Paid · ${money(ev.reg_fee)}` : 'Free entry'}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={(e) => { e.stopPropagation(); copyLink(ev); }} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">🔗 Copy link</button>
              {isSuper && <button onClick={(e) => { e.stopPropagation(); toggleOpen(ev); }} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">{ev.registration_open ? 'Close' : 'Open'}</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------- Organizers panel ----------------
const OrganizersPanel = ({ events, showSuccess, showError }) => {
  const [organizers, setOrganizers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', name: '', eventId: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { const res = await api.get('/api/auth/organizers'); setOrganizers(res.data.organizers || []); }
    catch { /* ignore */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return showError('Username and password required');
    setBusy(true);
    try {
      await api.post('/api/auth/organizer', form);
      showSuccess('Organizer created');
      setForm({ username: '', password: '', name: '', eventId: '' });
      load();
    } catch (err) { showError(err.response?.data?.error || 'Could not create organizer'); }
    finally { setBusy(false); }
  };

  const eventName = (id) => events.find((e) => e.id === id)?.name || '—';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-bold text-slate-900 mb-3">Organizers</h2>
      <form onSubmit={create} className="space-y-2 mb-3">
        <div className="grid grid-cols-2 gap-2">
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input type="password" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Name (optional)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>
          <option value="">Assign to event…</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
        <button disabled={busy} className="w-full rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-700 disabled:opacity-50">{busy ? 'Creating…' : 'Create Organizer'}</button>
      </form>
      <div className="space-y-1">
        {organizers.map((o) => (
          <div key={o.id} className="flex items-center justify-between text-sm text-slate-700 border-t border-slate-100 pt-1">
            <span className="font-medium">{o.username}</span>
            <span className="text-xs text-slate-400">{eventName(o.event_id)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------- Registrations panel ----------------
const RegistrationsPanel = ({ event, canImport, showSuccess, showError }) => {
  const [regs, setRegs] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/registrations/events/${event.id}/registrations${filter ? `?status=${filter}` : ''}`);
      setRegs(res.data.registrations || []);
    } catch (err) { showError(err.response?.data?.error || 'Could not load registrations'); }
    finally { setLoading(false); }
  }, [event.id, filter, showError]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    try {
      await api.patch(`/api/registrations/registrations/${id}/status`, { status });
      load();
    } catch (err) { showError(err.response?.data?.error || 'Update failed'); }
  };

  const importToAuction = async () => {
    setImporting(true);
    try {
      const res = await api.post(`/api/registrations/events/${event.id}/import-to-auction`);
      showSuccess(res.data.message || 'Imported');
    } catch (err) { showError(err.response?.data?.error || 'Import failed'); }
    finally { setImporting(false); }
  };

  const counts = regs.reduce((a, r) => { a[r.payment_status] = (a[r.payment_status] || 0) + 1; return a; }, {});

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold text-slate-900">{event.name} — Registrations</h2>
          <p className="text-xs text-slate-500">Link: <span className="font-mono">{window.location.origin}/register/{event.slug}</span></p>
        </div>
        {canImport && (
          <button onClick={importToAuction} disabled={importing} className="rounded-full bg-gradient-to-b from-emerald-500 to-teal-600 text-white px-4 py-2 text-sm font-semibold shadow hover:-translate-y-0.5 transition disabled:opacity-50">
            {importing ? 'Importing…' : '⬇ Import verified to auction'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {['', 'pending', 'verified', 'rejected'].map((s) => (
          <button key={s || 'all'} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs font-semibold border ${filter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            {s ? s[0].toUpperCase() + s.slice(1) : 'All'}{s && counts[s] ? ` (${counts[s]})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
      ) : regs.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">No registrations yet.</p>
      ) : (
        <div className="space-y-3">
          {regs.map((r) => (
            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-slate-200 p-3">
              <img src={r.profile_pic_url || '/logo192.png'} alt="" className="w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{r.name}</span>
                  <span className="text-xs text-slate-500">{r.role}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[r.payment_status] || 'bg-slate-100'}`}>{r.payment_status}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">📱 {r.mobile}{r.profile_link ? ' · ' : ''}{r.profile_link && <a href={r.profile_link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">profile</a>}</div>
                {r.payment_txn_id && <div className="text-xs text-slate-500 mt-0.5">UTR: {r.payment_txn_id} {r.payment_screenshot_url && <a href={r.payment_screenshot_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline ml-1">view proof</a>}</div>}
              </div>
              <div className="flex gap-2 shrink-0">
                {r.payment_status !== 'verified' && r.payment_status !== 'not_required' && (
                  <button onClick={() => setStatus(r.id, 'verified')} className="rounded-full bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-500">Approve</button>
                )}
                {r.payment_status !== 'rejected' && (
                  <button onClick={() => setStatus(r.id, 'rejected')} className="rounded-full bg-rose-100 text-rose-700 px-3 py-1.5 text-xs font-semibold hover:bg-rose-200">Reject</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegistrationsAdmin;
