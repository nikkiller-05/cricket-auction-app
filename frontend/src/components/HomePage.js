import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from './Button';
import BrandFooter from './BrandFooter';
import { API_BASE_URL } from '../config';
import { getPrimarySession, clearAllSessions, saveSession } from '../lib/session';

const IcoWhatsApp = (p) => (<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" {...p}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.463 3.488A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>);
const IcoMail = (p) => (<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" {...p}><path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z"/><path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z"/></svg>);

const authInputCls = 'w-full rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/40 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300/50';

// Original, hand-drawn flat-icon sport art for the hero background decoration
// (not a photo/screenshot — zero licensing or likeness risk, crisp at any size).
const SportBadge = ({ className = '', children }) => (
  <div className={`rounded-full border border-amber-200/[0.14] bg-gradient-to-br from-amber-400/[0.06] to-white/[0.015] grid place-items-center ${className}`}>
    <div className="w-[52%] h-[52%] text-amber-100/[0.16]">{children}</div>
  </div>
);
const CricketIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full" fill="currentColor">
    <g transform="rotate(14 24 30)">
      <rect x="20" y="4" width="8" height="20" rx="4" />
      <path d="M15 23 L33 23 L33 47 Q33 53 27 53 L21 53 Q15 53 15 47 Z" />
    </g>
    <circle cx="48" cy="44" r="9" />
    <path d="M42 40 Q48 44 42 48 M54 40 Q48 44 54 48" stroke="#0b0a06" strokeWidth="1.6" fill="none" opacity="0.55" />
  </svg>
);
const FootballIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" stroke="currentColor">
    <circle cx="32" cy="32" r="26" strokeWidth="3" />
    <polygon points="32,23 40.6,29.2 37.3,39.3 26.7,39.3 23.4,29.2" fill="currentColor" stroke="none" />
    <polygon points="46.8,11.6 49.1,18.5 43.2,22.8 37.3,18.5 39.5,11.6" fill="currentColor" stroke="none" />
    <polygon points="56,39.8 50.1,44.1 44.2,39.8 46.4,32.9 53.7,32.9" fill="currentColor" stroke="none" />
    <polygon points="32,57.2 26.1,52.9 28.4,46 35.6,46 37.9,52.9" fill="currentColor" stroke="none" />
    <polygon points="8,39.8 10.3,32.9 17.6,32.9 19.8,39.8 13.9,44.1" fill="currentColor" stroke="none" />
    <polygon points="17.2,11.6 24.5,11.6 26.7,18.5 20.8,22.8 14.9,18.5" fill="currentColor" stroke="none" />
  </svg>
);
const BadmintonIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full" fill="currentColor">
    <path d="M25 44 L14 12 L50 12 L39 44 Z" opacity="0.18" stroke="none" />
    <path
      d="M27 44 L18 12 M29.5 44 L25 12 M32 44 L32 12 M34.5 44 L39 12 M37 44 L46 12"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="32" cy="47" r="7" />
  </svg>
);
const BasketballIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" stroke="currentColor">
    <circle cx="32" cy="32" r="26" strokeWidth="3" />
    <path d="M32 6 V58 M6 32 H58 M12 14 Q32 32 12 50 M52 14 Q32 32 52 50" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// Downscale a chosen image to a small square-ish JPEG data URL for the avatar.
const compressAvatarDataUrl = (file, maxDim = 160) => new Promise((resolve, reject) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    let { width, height } = img;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    width = Math.round(width * scale); height = Math.round(height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    resolve(canvas.toDataURL('image/jpeg', 0.72));
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('invalid image')); };
  img.src = url;
});

// Sign in / sign up (self-serve organizer) — opens over the landing page.
const AuthModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', phone: '', website: '' });
  const [avatar, setAvatar] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: k === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value });

  const finish = (data) => {
    saveSession(data.token, data.user);
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
          avatarUrl: avatar,
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
          {mode === 'signup' && (
            <div className="flex items-center gap-3">
              {avatar
                ? <img src={avatar} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-amber-300/40" />
                : <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-lg">👤</span>}
              <label className="cursor-pointer rounded-full border border-white/20 text-indigo-100/80 text-xs font-semibold px-3 py-1.5 hover:text-white hover:border-white/40 transition">
                {avatar ? 'Change photo' : 'Add profile photo (optional)'}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { setAvatar(await compressAvatarDataUrl(f)); } catch { /* ignore bad image */ } } }} />
              </label>
              {avatar && <button type="button" onClick={() => setAvatar('')} className="text-xs text-indigo-200/60 hover:text-white">Remove</button>}
            </div>
          )}
          <input placeholder={mode === 'signin' ? 'Username or email' : 'Username *'} value={form.username} onChange={set('username')} className={authInputCls} />
          {mode === 'signup' && (
            <>
              <input type="email" placeholder="Email" value={form.email} onChange={set('email')} className={authInputCls} />
              <input inputMode="numeric" placeholder="Phone (10 digits)" value={form.phone} onChange={set('phone')} className={authInputCls} />
            </>
          )}
          <input type="password" placeholder="Password" value={form.password} onChange={set('password')} className={authInputCls} />
          {err && <p className="text-rose-300 text-sm bg-rose-500/10 rounded-lg px-3 py-2">{err}</p>}
          <Button type="submit" variant="primary" size="md" loading={busy} className="w-full">
            {mode === 'signin' ? 'Sign In' : 'Create account'}
          </Button>
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
  // Reflect any persisted login (organizer console or auction admin) in the nav.
  const [session, setSession] = useState(() => getPrimarySession());
  const [showAuth, setShowAuth] = useState(false);
  // Real live/upcoming tournaments for the homepage teaser strip (null = loading).
  const [publicEvents, setPublicEvents] = useState(null);

  useEffect(() => {
    let active = true;
    axios.get(`${API_BASE_URL}/api/registrations/public-events`)
      .then(({ data }) => { if (active) setPublicEvents(data.events || []); })
      .catch(() => { if (active) setPublicEvents([]); });
    return () => { active = false; };
  }, []);

  // Create Auction: signed-in organizers go straight to their console; everyone else signs in first.
  const handleCreateAuction = () => {
    if (session) navigate('/console');
    else setShowAuth(true);
  };

  const scrollToEnter = () => {
    document.getElementById('enter')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleLogout = () => {
    clearAllSessions();
    setSession(null);
  };

  // Reveal landing sections as they scroll into view.
  useEffect(() => {
    const els = document.querySelectorAll('.gbx-reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-visible')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden gbx-bg">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Floating gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" style={{ animation: 'gbxFloat 9s ease-in-out infinite' }} />
        <div className="absolute top-44 -right-24 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" style={{ animation: 'gbxFloat 11s ease-in-out infinite reverse' }} />
      </div>

      {/* Multi-sport icon badges (original flat-icon art, not a photo — no
          licensing/likeness risk, crisp at any resolution). Cricket is what
          we support today; the others hint at the roadmap without claiming
          they work yet (the FAQ/copy already says "cricket only, more soon"). */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden hidden sm:block" aria-hidden="true">
        <SportBadge className="absolute -right-8 top-4 h-40 w-40 lg:h-48 lg:w-48 -rotate-6">
          <CricketIcon />
        </SportBadge>
        <SportBadge className="absolute left-2 top-56 h-28 w-28 lg:h-32 lg:w-32 rotate-12">
          <FootballIcon />
        </SportBadge>
        <SportBadge className="absolute right-24 top-96 h-24 w-24 lg:h-28 lg:w-28 -rotate-12">
          <BadmintonIcon />
        </SportBadge>
        <SportBadge className="absolute left-24 top-8 h-24 w-24 lg:h-28 lg:w-28 rotate-6">
          <BasketballIcon />
        </SportBadge>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top nav */}
        <nav className="sticky top-0 z-30 backdrop-blur-xl bg-gradient-to-b from-black/70 to-black/15 border-b border-amber-300/25 shadow-[0_16px_34px_-18px_rgba(0,0,0,0.95)]">
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
                <button onClick={() => navigate('/tournaments')} className="hover:text-white transition">Tournaments</button>
                <button onClick={() => scrollToId('features')} className="hover:text-white transition">Features</button>
                <button onClick={() => scrollToId('contact')} className="hover:text-white transition">Contact</button>
              </nav>
              {session ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="hidden sm:inline text-sm font-semibold text-indigo-100/80 max-w-[9rem] truncate">
                    {session.user?.name || session.user?.username}
                  </span>
                  <Button variant="primary" size="sm" onClick={() => navigate(session.destination)}>
                    {session.destinationLabel}
                  </Button>
                  <Button variant="glass" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setShowAuth(true)}>Sign In</Button>
              )}
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
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight max-w-2xl gbx-fade-up">Run live player auctions like a pro</h1>
            <p className="mt-3 text-base md:text-lg text-indigo-200/90 font-light max-w-xl gbx-fade-up" style={{ animationDelay: '80ms' }}>
              Real-time bidding, self-serve player registration, automatic team budgets and live stats — for cricket auctions, with more sports coming soon.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 gbx-fade-up" style={{ animationDelay: '140ms' }}>
              {['⚡ Real-time bidding', '📝 Self-serve registration', '💰 Auto team budgets', '📥 Instant exports'].map((b) => (
                <span key={b} className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium text-indigo-100/80">{b}</span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 gbx-fade-up" style={{ animationDelay: '200ms' }}>
              <Button variant="primary" size="lg" onClick={scrollToEnter}>Get started</Button>
              <Button variant="glass" size="lg" onClick={() => navigate('/tournaments')}>Browse tournaments</Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main id="enter" className="px-4 py-8 scroll-mt-16">
          <div className="max-w-lg w-full mx-auto">
            <div className="rounded-2xl p-6 border border-white/15 bg-white/[0.06] backdrop-blur-2xl shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_30px_80px_-30px_rgba(0,0,0,0.6)] text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Ready to run your auction?</h2>
              <p className="text-blue-200 mb-5">Create your event, invite players and go live — all in one place.</p>
              <Button
                variant="primary"
                size="xl"
                onClick={handleCreateAuction}
                className="w-full"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Auction
              </Button>
              <p className="mt-3 text-xs text-indigo-200/70">
                {session ? 'Opens your organizer console' : 'Sign in or create a free organizer account'}
              </p>
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

        {/* Live & Upcoming Tournaments — real data, only shown when there's
            something real to show (never a fake/empty placeholder). NOTE:
            deliberately no `gbx-reveal` class — that scroll-fade-in relies on
            a one-time IntersectionObserver set up on mount, but this section
            only appears after the async events fetch resolves, so it would
            never get observed and would stay invisible (opacity:0) forever. */}
        {(() => {
          const live = (publicEvents || []).filter((e) => e.status === 'live');
          const upcoming = (publicEvents || []).filter((e) => e.status !== 'live' && e.status !== 'completed');
          const teaser = [...live, ...upcoming].slice(0, 4);
          if (!teaser.length) return null;
          return (
            <section className="px-4 py-10">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">Live &amp; upcoming tournaments</h2>
                  <button onClick={() => navigate('/tournaments')} className="shrink-0 text-sm font-semibold text-amber-300 hover:text-amber-200 transition">View all →</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {teaser.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => navigate(`/a/${ev.slug}`)}
                      className="group w-full min-w-0 text-left rounded-2xl border border-white/10 hover:border-amber-300/40 bg-white/[0.04] hover:bg-white/[0.07] p-4 flex items-center gap-4 transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5"
                    >
                      {ev.logo_url ? (
                        <img src={ev.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover bg-white/10 shrink-0 ring-1 ring-white/10" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-amber-400/20 grid place-items-center text-amber-200 font-black shrink-0">
                          {(ev.name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-bold text-white truncate min-w-0">{ev.name}</h3>
                          {ev.status === 'live' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-200 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide shrink-0">Upcoming</span>
                          )}
                        </div>
                        <span className="mt-1 inline-block text-sm font-semibold text-amber-300 group-hover:text-amber-200">
                          {ev.status === 'live' ? 'Watch live' : 'View'} →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          );
        })()}

        {/* Why GoldenBidX — full feature grid (capabilities we actually ship). */}
        <section id="features" className="gbx-reveal px-4 py-10 scroll-mt-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center text-2xl md:text-3xl font-extrabold text-white mb-2">Everything your auction needs</h2>
            <p className="text-center text-indigo-200/70 mb-8">From the first bid to the final squad — built in, not bolted on.</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '⚡', title: 'Real-Time Bidding', desc: 'Instant updates for every operator, team and spectator.' },
                { icon: '🎲', title: 'Smart Random & Reveal', desc: 'A dramatic mystery-card reveal builds suspense before every bid.' },
                { icon: '💰', title: 'Auto Team Budgets', desc: 'Purse and squad limits enforced automatically, live.' },
                { icon: '👁️', title: 'Live Spectator Sync', desc: 'Anyone with the link follows every bid — no refresh needed.' },
                { icon: '⏪', title: 'Undo & Revert', desc: 'Made a mistake mid-auction? Fix it safely without breaking the flow.' },
                { icon: '📥', title: 'Squad & Poster Exports', desc: 'One-tap Excel, team squad images and a shareable results poster.' },
                { icon: '📊', title: 'Full Auction Stats', desc: 'Spend, highest/lowest bids and category breakdowns, live.' },
                { icon: '🔗', title: 'Shareable Results Page', desc: 'A clean public link with final squads and highlights, after the auction.' },
              ].map((f) => (
                <div
                  key={f.title}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-white/[0.07]"
                >
                  <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
                  <div className="text-2xl mb-1.5">{f.icon}</div>
                  <h5 className="text-white font-semibold text-sm mb-1">{f.title}</h5>
                  <p className="text-blue-200/80 text-xs leading-snug">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="gbx-reveal px-4 py-10 scroll-mt-16">
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
        <section className="gbx-reveal px-4 py-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">Built for cricket auctions of every kind</h2>
            <div className="flex flex-wrap justify-center gap-2.5">
              {['🏏 Box cricket', '🏢 Corporate leagues', '🏆 Gully tournaments', '🎓 School & college', '👥 Community clubs', '🏟️ Franchise leagues'].map((c) => (
                <span key={c} className="rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-medium text-indigo-100/90">{c}</span>
              ))}
              <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200">➕ More sports coming soon</span>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="gbx-reveal px-4 py-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center text-2xl md:text-3xl font-extrabold text-white mb-8">Frequently asked</h2>
            <div className="space-y-3">
              {[
                ['Is it only for cricket?', 'Currently only cricket is supported. Other sports are on the roadmap and will be added soon.'],
                ['How do players register?', 'Share your event’s registration link. Players self-register with a photo, role and stats — no manual data entry for you.'],
                ['Can spectators watch live?', 'Yes. Share the public link and anyone can follow every bid live, then browse the final results afterwards.'],
                ['Do I need to install anything?', 'No. Everything runs in the browser on a phone or laptop.'],
                ['What happens after the auction?', 'The public link becomes a results page with final squads, spotlights and one-tap exports (Excel, squad images, a shareable poster).'],
              ].map(([q, a]) => (
                <details key={q} className="group rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-white font-semibold list-none">
                    {q}
                    <span className="text-amber-300 text-xl leading-none transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm text-indigo-200/80 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section id="contact" className="gbx-reveal px-4 py-12 scroll-mt-16">
          <div className="max-w-3xl mx-auto rounded-3xl border border-amber-300/20 bg-gradient-to-b from-amber-400/10 to-transparent p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Ready to run your next auction?</h2>
            <p className="mt-2 text-indigo-200/80">Set it up in minutes. Your players and teams will love it.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a href="https://wa.me/918867976531" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white font-semibold px-6 py-3 shadow-lg hover:brightness-110 transition"><IcoWhatsApp /> WhatsApp us</a>
              <a href="mailto:contactus@goldenbidx.com" className="inline-flex items-center gap-2 rounded-full bg-[#2563eb] text-white font-semibold px-6 py-3 shadow-lg hover:brightness-110 transition"><IcoMail /> Email us</a>
            </div>
            <p className="mt-4 text-sm text-indigo-200/70">
              Call or WhatsApp <a href="tel:+918867976531" className="font-semibold text-amber-300 hover:text-amber-200">+91 88679 76531</a> · <a href="mailto:contactus@goldenbidx.com" className="font-semibold text-amber-300 hover:text-amber-200">contactus@goldenbidx.com</a>
            </p>
          </div>
        </section>

        {/* Footer links */}
        <section className="gbx-reveal px-4 pt-8 border-t border-white/10">
          <div className="max-w-5xl mx-auto grid gap-8 sm:grid-cols-3 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/auction-logo.png" alt="" className="h-8 w-auto" />
                <span className="font-extrabold text-white"><span className="text-amber-300">Golden</span>BidX</span>
              </div>
              <p className="text-indigo-200/60">Live player auctions, made effortless. Bid · Build · Win.</p>
              <div className="mt-3 flex items-center gap-2">
                <a href="https://wa.me/918867976531" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-indigo-200/70 hover:text-white hover:border-white/30 transition"><IcoWhatsApp width={15} height={15} /></a>
                <a href="mailto:contactus@goldenbidx.com" aria-label="Email" className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-indigo-200/70 hover:text-white hover:border-white/30 transition"><IcoMail width={15} height={15} /></a>
              </div>
            </div>
            <div>
              <div className="text-white font-semibold mb-2">Product</div>
              <ul className="space-y-1.5 text-indigo-200/70">
                <li><button onClick={() => scrollToId('features')} className="hover:text-white transition">Features</button></li>
                <li><button onClick={() => navigate('/tournaments')} className="hover:text-white transition">Tournaments</button></li>
                <li><button onClick={scrollToEnter} className="hover:text-white transition">Get started</button></li>
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold mb-2">Support</div>
              <ul className="space-y-1.5 text-indigo-200/70">
                <li><a href="https://wa.me/918867976531" target="_blank" rel="noreferrer" className="hover:text-white transition">WhatsApp</a></li>
                <li><a href="mailto:contactus@goldenbidx.com" className="hover:text-white transition">contactus@goldenbidx.com</a></li>
                <li><a href="tel:+918867976531" className="hover:text-white transition">+91 88679 76531</a></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <BrandFooter theme="dark" compact />
      </div>
    </div>
  );
};

export default HomePage;
