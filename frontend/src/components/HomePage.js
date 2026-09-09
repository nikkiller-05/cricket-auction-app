import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from './Button';
import BrandFooter from './BrandFooter';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const authInputCls = 'w-full rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/40 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300/50';

// Sign in / sign up (self-serve organizer) — opens over the landing page.
const AuthModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', phone: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: k === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value });

  const finish = (data) => {
    localStorage.setItem('regToken', data.token);
    localStorage.setItem('regUser', JSON.stringify(data.user));
    navigate('/console');
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (mode === 'signin') {
        const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { username: form.username.trim(), password: form.password });
        if (!['super-admin', 'admin', 'organizer'].includes(res.data.user.role)) {
          setErr('This account cannot access the console.'); setBusy(false); return;
        }
        finish(res.data);
      } else {
        const res = await axios.post(`${API_BASE_URL}/api/auth/signup-organizer`, {
          username: form.username.trim(), password: form.password, name: form.name.trim(),
          email: form.email.trim(), phone: form.phone, website: form.website,
        });
        finish(res.data);
      }
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Something went wrong');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/12 bg-[#12101b] p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-3 text-white/50 hover:text-white text-2xl leading-none">×</button>
        <div className="text-center mb-5">
          <img src="/logo-full.png" alt="GoldenBidX" className="w-40 mx-auto mb-2" />
          <p className="text-indigo-200/70 text-sm">Welcome to GoldenBidX!</p>
          <h2 className="text-2xl font-extrabold text-white">{mode === 'signin' ? 'Sign In' : 'Create your account'}</h2>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-full bg-white/5 p-1 mb-5 text-sm font-semibold">
          <button type="button" onClick={() => { setMode('signin'); setErr(''); }} className={`rounded-full py-1.5 ${mode === 'signin' ? 'bg-amber-400 text-slate-900' : 'text-indigo-200/70'}`}>Sign In</button>
          <button type="button" onClick={() => { setMode('signup'); setErr(''); }} className={`rounded-full py-1.5 ${mode === 'signup' ? 'bg-amber-400 text-slate-900' : 'text-indigo-200/70'}`}>Sign Up</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden="true" />
          {mode === 'signup' && <input placeholder="Full name" value={form.name} onChange={set('name')} className={authInputCls} />}
          <input placeholder={mode === 'signin' ? 'Username or email' : 'Username *'} value={form.username} onChange={set('username')} className={authInputCls} />
          {mode === 'signup' && (
            <>
              <input type="email" placeholder="Email" value={form.email} onChange={set('email')} className={authInputCls} />
              <input inputMode="numeric" placeholder="Phone (10 digits)" value={form.phone} onChange={set('phone')} className={authInputCls} />
            </>
          )}
          <input type="password" placeholder="Password" value={form.password} onChange={set('password')} className={authInputCls} />
          {err && <p className="text-rose-300 text-sm bg-rose-500/10 rounded-lg px-3 py-2">{err}</p>}
          <button disabled={busy} className="w-full rounded-full bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 font-bold py-2.5 hover:-translate-y-0.5 transition disabled:opacity-50">
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-indigo-200/60">
          {mode === 'signin'
            ? (<>New here? <button type="button" onClick={() => setMode('signup')} className="text-amber-300 font-semibold">Create an organizer account</button></>)
            : (<>Already have an account? <button type="button" onClick={() => setMode('signin')} className="text-amber-300 font-semibold">Sign in</button></>)}
        </p>
      </div>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Saved-auction resume flow: null | 'resume' | 'clear'
  const [resumeStep, setResumeStep] = useState(null);
  const [savedSession, setSavedSession] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
      localStorage.setItem('adminToken', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

      // If a saved auction is in progress, offer to resume it instead of
      // forcing a fresh setup. Any failure here falls back to normal setup.
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/auction/data`);
        const hasSaved =
          data?.fileUploaded ||
          (Array.isArray(data?.players) && data.players.length > 0);
        if (hasSaved) {
          setSavedSession({
            fileName: data.fileName,
            totalPlayers: data.players?.length || 0,
            soldPlayers: (data.players || []).filter((p) => p.status === 'sold').length,
            teams: data.teams?.length || 0,
            status: data.auctionStatus,
          });
          setResumeStep('resume');
          return; // wait for the user's choice in the modal
        }
      } catch (checkErr) {
        console.warn('Could not check for a saved auction:', checkErr.message);
      }

      navigate('/setup');
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Resume the existing auction and jump straight to the live dashboard.
  const handleResume = () => {
    navigate('/dashboard', { state: { isAdmin: true } });
  };

  // Move to the explicit second confirmation before wiping a saved auction.
  const handleStartNew = () => {
    setResumeStep('clear');
  };

  // Clear the saved auction, then start the fresh setup flow.
  const handleConfirmClear = async () => {
    setResumeLoading(true);
    setLoginError('');
    try {
      // Full wipe (players, teams, fileUploaded=false) - not the soft
      // auction/reset which keeps players around.
      await axios.delete(`${API_BASE_URL}/api/players/clear`);
      setResumeStep(null);
      setSavedSession(null);
      navigate('/setup');
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Could not clear the previous auction');
      setResumeStep('resume');
    } finally {
      setResumeLoading(false);
    }
  };

  // Safe default: close the prompt without touching the saved auction.
  const handleCancelResume = () => {
    setResumeStep(null);
    setSavedSession(null);
  };

  const handleViewerAccess = () => {
    // Clear any stale admin credentials so spectator mode is truly read-only.
    localStorage.removeItem('adminToken');
    navigate('/dashboard', { state: { isAdmin: false } });
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const scrollToEnter = () => {
    document.getElementById('enter')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{background: 'radial-gradient(58rem 40rem at -8% -18%, rgba(232,184,75,0.16) 0%, transparent 60%), radial-gradient(54rem 40rem at 112% 116%, rgba(176,120,32,0.18) 0%, transparent 60%), radial-gradient(42rem 30rem at 50% 32%, rgba(99,102,241,0.12) 0%, transparent 62%), linear-gradient(160deg, #0a0a0f 0%, #12101b 46%, #0b0b11 100%)'}}>
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top nav */}
        <nav className="sticky top-0 z-30 backdrop-blur-xl bg-gradient-to-b from-black/70 to-black/15 border-b border-amber-300/25 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.95)]">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/auction-logo.png" alt="" className="h-10 w-auto drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]" />
              <span className="font-extrabold tracking-tight text-lg">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">Golden</span><span className="text-white">Bid</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">X</span>
              </span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-indigo-100/80">
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition">Home</button>
                <button onClick={() => scrollToId('features')} className="hover:text-white transition">Features</button>
                <button onClick={() => scrollToId('contact')} className="hover:text-white transition">Contact</button>
              </nav>
              <button onClick={() => setShowAuth(true)} className="rounded-full bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 text-sm font-bold px-5 py-1.5 hover:-translate-y-0.5 transition">Sign In</button>
            </div>
          </div>
        </nav>

        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

        {/* Hero */}
        <header className="pt-10 pb-4">
          <div className="max-w-6xl mx-auto px-4 flex flex-col items-center text-center">
            <img
              src="/logo-full.png"
              alt="GoldenBidX"
              className="w-64 sm:w-80 md:w-96 mb-3 drop-shadow-[0_8px_24px_rgba(232,184,75,0.22)]"
            />
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight max-w-2xl">Run live player auctions like a pro</h1>
            <p className="mt-3 text-base md:text-lg text-indigo-200/90 font-light max-w-xl">
              Real-time bidding, self-serve player registration, automatic team budgets and live stats — for cricket and every sport.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button onClick={scrollToEnter} className="rounded-full bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 font-bold px-6 py-3 hover:-translate-y-0.5 transition shadow-lg">Get started</button>
              <button onClick={handleViewerAccess} className="rounded-full border border-white/25 bg-white/5 text-white font-semibold px-6 py-3 hover:bg-white/10 transition">Watch a live auction</button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main id="enter" className="px-4 py-8 scroll-mt-16">
          <div className="max-w-lg w-full mx-auto">
            <div className="rounded-2xl p-6 border border-white/15 bg-white/[0.06] backdrop-blur-2xl shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_30px_80px_-30px_rgba(0,0,0,0.6)]">
              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to the Auction</h2>
                <p className="text-blue-200">
                  {showAdminLogin 
                    ? 'Login as admin to set up and manage the auction' 
                    : 'Choose how you want to participate'
                  }
                </p>
              </div>

              {!showAdminLogin ? (
                // Role Selection
                <div className="space-y-4">
                  <Button
                    variant="success"
                    size="xl"
                    onClick={handleViewerAccess}
                    className="w-full"
                  >
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Enter as Spectator
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white border-opacity-30" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-transparent text-blue-200">or</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="xl"
                    onClick={() => setShowAdminLogin(true)}
                    className="w-full"
                  >
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin Setup
                  </Button>
                </div>
              ) : (
                // Admin Login Form
                <form onSubmit={handleAdminLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      required
                      className="w-full px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      placeholder="Enter username"
                      value={credentials.username}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      className="w-full px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      placeholder="Enter password"
                      value={credentials.password}
                      onChange={handleChange}
                    />
                  </div>

                  {loginError && (
                    <div className="text-red-300 text-sm text-center bg-red-500 bg-opacity-20 p-3 rounded-lg">
                      {loginError}
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="glass"
                      size="lg"
                      onClick={() => {
                        setShowAdminLogin(false);
                        setLoginError('');
                        setCredentials({ username: '', password: '' });
                      }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loginLoading}
                      loading={loginLoading}
                      className="flex-1"
                    >
                      {loginLoading ? 'Signing in…' : 'Sign In'}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Features Preview */}
            <div className="mt-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { icon: '⚡', title: 'Real-Time Bidding', desc: 'Instant live updates' },
                  { icon: '💰', title: 'Auto Budgets', desc: 'Team spend tracked live' },
                  { icon: '📥', title: 'Squad Exports', desc: 'One-tap PNG & PDF' },
                  { icon: '📊', title: 'Live Stats', desc: 'Full auction analytics' },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-white/[0.07]"
                  >
                    <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
                    <div className="text-xl mb-1">{f.icon}</div>
                    <h5 className="text-white font-semibold text-sm mb-0.5">{f.title}</h5>
                    <p className="text-blue-200/80 text-xs">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* How it works */}
        <section id="features" className="px-4 py-10 scroll-mt-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center text-2xl md:text-3xl font-extrabold text-white mb-2">How it works</h2>
            <p className="text-center text-indigo-200/70 mb-8">From setup to sold in three simple steps.</p>
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                { n: '1', t: 'Create your event', d: 'Set your budget, teams and rules in minutes — free or paid registration.' },
                { n: '2', t: 'Players register', d: 'Share a link; players self-register with photo, role and stats — no manual entry.' },
                { n: '3', t: 'Go live', d: 'Run real-time bidding while teams and spectators follow every bid live.' },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
                  <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 font-black">{s.n}</div>
                  <h3 className="text-white font-bold mb-1">{s.t}</h3>
                  <p className="text-indigo-200/70 text-sm">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="px-4 py-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">Built for every auction</h2>
            <div className="flex flex-wrap justify-center gap-2.5">
              {['🏏 Box cricket', '🏢 Corporate leagues', '🏆 Gully tournaments', '⚽ Football', '🎾 Tennis', '🏸 Badminton', '👥 Community clubs'].map((c) => (
                <span key={c} className="rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-medium text-indigo-100/90">{c}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section id="contact" className="px-4 py-12 scroll-mt-16">
          <div className="max-w-3xl mx-auto rounded-3xl border border-amber-300/20 bg-gradient-to-b from-amber-400/10 to-transparent p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Ready to run your next auction?</h2>
            <p className="mt-2 text-indigo-200/80">Set it up in minutes. Your players and teams will love it.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button onClick={scrollToEnter} className="rounded-full bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 font-bold px-6 py-3 hover:-translate-y-0.5 transition shadow-lg">Get started</button>
              <a href="https://wa.me/918867976531" target="_blank" rel="noreferrer" className="rounded-full border border-white/25 bg-white/5 text-white font-semibold px-6 py-3 hover:bg-white/10 transition">💬 WhatsApp us</a>
              <a href="mailto:contactus@goldenbidx.com" className="rounded-full border border-white/25 bg-white/5 text-white font-semibold px-6 py-3 hover:bg-white/10 transition">✉️ Email us</a>
            </div>
            <p className="mt-4 text-sm text-indigo-200/70">
              Call or WhatsApp <a href="tel:+918867976531" className="font-semibold text-amber-300 hover:text-amber-200">+91 88679 76531</a> · <a href="mailto:contactus@goldenbidx.com" className="font-semibold text-amber-300 hover:text-amber-200">contactus@goldenbidx.com</a>
            </p>
          </div>
        </section>

        {/* Footer */}
        <BrandFooter theme="dark" compact />
      </div>

      {/* Resume / Clear saved-auction modal */}
      {resumeStep && savedSession && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={resumeStep === 'resume' ? handleCancelResume : undefined}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-2xl shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_30px_80px_-30px_rgba(0,0,0,0.7)] p-7">
            {resumeStep === 'resume' ? (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl">♻️</span>
                  <h3 className="text-2xl font-bold tracking-tight text-white">
                    Resume previous auction?
                  </h3>
                </div>
                <p className="text-indigo-200/90 text-sm mb-5 leading-relaxed">
                  We found an auction already in progress. You can pick up right where it
                  left off, or start a brand-new one.
                </p>

                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 mb-6">
                  {savedSession.fileName && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-blue-200/80 text-sm">Player file</span>
                      <span className="text-white font-medium text-sm truncate max-w-[60%] text-right">
                        {savedSession.fileName}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-blue-200/80 text-sm">Players</span>
                    <span className="text-white font-semibold text-sm">
                      {savedSession.soldPlayers} sold
                      <span className="text-blue-300/70 font-normal"> / {savedSession.totalPlayers} total</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-blue-200/80 text-sm">Teams</span>
                    <span className="text-white font-semibold text-sm">{savedSession.teams}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-blue-200/80 text-sm">Status</span>
                    <span className="inline-flex items-center gap-1.5 text-white font-medium text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 capitalize">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {savedSession.status || 'stopped'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleResume}
                    className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-3.5 px-6 rounded-xl transition-[background-color,transform] duration-150 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-emerald-500/30"
                  >
                    Resume auction
                  </button>
                  <button
                    onClick={handleStartNew}
                    className="w-full bg-white/[0.06] hover:bg-white/[0.12] text-white font-semibold py-3.5 px-6 rounded-xl border border-white/15 transition-colors duration-150"
                  >
                    Start a new auction
                  </button>
                  <button
                    onClick={handleCancelResume}
                    className="w-full text-blue-200/70 hover:text-white text-sm font-medium py-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl">⚠️</span>
                  <h3 className="text-2xl font-bold tracking-tight text-white">
                    Clear previous auction?
                  </h3>
                </div>
                <p className="text-rose-200/90 text-sm mb-2 leading-relaxed">
                  This will permanently delete the saved auction
                  {savedSession.soldPlayers > 0 && (
                    <>
                      {' '}— including{' '}
                      <span className="font-semibold text-white">
                        {savedSession.soldPlayers} sold player
                        {savedSession.soldPlayers === 1 ? '' : 's'}
                      </span>
                    </>
                  )}
                  . This cannot be undone.
                </p>
                <p className="text-blue-200/70 text-sm mb-6">
                  Are you sure you want to start fresh?
                </p>

                {loginError && (
                  <div className="text-rose-300 text-sm text-center bg-rose-500/15 border border-rose-400/20 p-3 rounded-lg mb-4">
                    {loginError}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleConfirmClear}
                    disabled={resumeLoading}
                    className="w-full bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl transition-[background-color,transform] duration-150 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-rose-500/30"
                  >
                    {resumeLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Clearing...
                      </span>
                    ) : (
                      'Yes, clear & start new'
                    )}
                  </button>
                  <button
                    onClick={() => setResumeStep('resume')}
                    disabled={resumeLoading}
                    className="w-full bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-50 text-white font-semibold py-3.5 px-6 rounded-xl border border-white/15 transition-colors duration-150"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
