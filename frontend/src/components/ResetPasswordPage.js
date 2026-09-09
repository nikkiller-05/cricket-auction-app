import React, { useState } from 'react';
import axios from 'axios';
import { useNotification } from './NotificationSystem';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const api = axios.create({ baseURL: API_BASE_URL });

const DARK_BG = { background: 'radial-gradient(58rem 40rem at -8% -18%, rgba(232,184,75,0.16) 0%, transparent 60%), radial-gradient(54rem 40rem at 112% 116%, rgba(176,120,32,0.18) 0%, transparent 60%), linear-gradient(160deg, #0a0a0f 0%, #12101b 46%, #0b0b11 100%)' };

const ResetPasswordPage = () => {
  const { showSuccess, showError } = useNotification();
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 6) return showError('Password must be at least 6 characters');
    if (pw !== pw2) return showError('Passwords do not match');
    setBusy(true);
    try {
      await api.post('/api/auth/reset-password/confirm', { token, newPassword: pw });
      showSuccess('Password updated');
      setDone(true);
    } catch (err) {
      showError(err.response?.data?.error || 'Reset failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-white" style={DARK_BG}>
      <div className="w-full max-w-sm rounded-2xl border border-white/12 bg-white/[0.05] backdrop-blur-xl p-7">
        <div className="text-center mb-6">
          <img src="/auction-logo.png" alt="" className="w-14 h-14 rounded-xl mx-auto mb-3 ring-1 ring-amber-300/30" />
          <p className="text-lg font-extrabold text-white tracking-tight">GoldenBidX</p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-400/90 font-bold">Reset password</p>
        </div>
        {!token ? (
          <p className="text-sm text-center text-indigo-200/70">This reset link is invalid or incomplete.</p>
        ) : done ? (
          <div className="text-center">
            <p className="text-sm text-emerald-300 mb-4">Your password has been updated.</p>
            <a href="/registrations" className="inline-block rounded-full bg-gradient-to-b from-amber-400 to-amber-500 px-6 py-2.5 text-sm font-bold text-slate-900">Go to sign in</a>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label className="block text-xs font-semibold text-indigo-200/80 mb-1">New password</label>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="w-full rounded-lg border bg-white/10 border-white/20 text-white placeholder-white/40 px-3 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-amber-300/50" placeholder="Min 6 characters" />
            <label className="block text-xs font-semibold text-indigo-200/80 mb-1">Confirm password</label>
            <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="w-full rounded-lg border bg-white/10 border-white/20 text-white placeholder-white/40 px-3 py-2.5 mb-5 focus:outline-none focus:ring-2 focus:ring-amber-300/50" placeholder="Re-enter password" />
            <button disabled={busy} className="w-full rounded-full bg-gradient-to-b from-amber-400 to-amber-500 px-6 py-2.5 text-sm font-bold text-slate-900 hover:-translate-y-0.5 transition disabled:opacity-50">
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
