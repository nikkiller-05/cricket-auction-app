import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import BrandFooter from './BrandFooter';

// Public showcase of every tournament, grouped by lifecycle status. Each card
// deep-links to the single clean spectator URL /a/{slug}, which itself decides
// whether to show the live board or the completed results.
const SECTIONS = [
  { key: 'live', title: 'Live now', icon: '🔴', empty: 'No auctions are live right now.' },
  { key: 'upcoming', title: 'Upcoming', icon: '🗓️', empty: 'No upcoming auctions yet.' },
  { key: 'completed', title: 'Completed', icon: '🏆', empty: 'No completed auctions yet.' },
];

const initials = (name) =>
  (name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const fmtAuctionAt = (iso) => { if (!iso) return null; const d = new Date(iso); return isNaN(d.getTime()) ? null : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); };

const StatusPill = ({ status }) => {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
      </span>
    );
  }
  if (status === 'completed') {
    return <span className="rounded-full bg-white/10 border border-white/15 text-amber-100/80 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">Completed</span>;
  }
  return <span className="rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-200 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">Upcoming</span>;
};

const ctaLabel = (ev) =>
  ev.status === 'live' ? 'Watch live' : ev.status === 'completed' ? 'View results' : 'View';

const TournamentsDirectory = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    axios
      .get(`${API_BASE_URL}/api/registrations/public-events`)
      .then(({ data }) => { if (active) setEvents(data.events || []); })
      .catch(() => { if (active) setError('We could not load the tournaments right now.'); });
    return () => { active = false; };
  }, []);

  const grouped = useMemo(() => {
    const g = { live: [], upcoming: [], completed: [] };
    (events || []).forEach((e) => {
      const s = e.status === 'live' || e.status === 'completed' ? e.status : 'upcoming';
      g[s].push(e);
    });
    return g;
  }, [events]);

  const total = events?.length || 0;

  const Card = ({ ev }) => {
    const live = ev.status === 'live';
    const ring = live
      ? 'border-emerald-400/40 hover:border-emerald-300/60 shadow-[0_0_0_1px_rgba(16,185,129,0.12),0_12px_34px_-14px_rgba(16,185,129,0.4)]'
      : ev.status === 'completed'
        ? 'border-white/10 hover:border-white/25'
        : 'border-amber-300/25 hover:border-amber-300/45';
    return (
      <button
        onClick={() => navigate(`/a/${ev.slug}`)}
        className={`group text-left rounded-2xl border ${ring} bg-white/[0.04] p-4 flex items-center gap-4 hover:bg-white/[0.07] hover:-translate-y-0.5 transition-[transform,background-color,border-color,box-shadow] duration-200`}
      >
        {ev.logo_url
          ? <img src={ev.logo_url} alt="" className="w-14 h-14 rounded-xl object-cover bg-white/10 shrink-0 ring-1 ring-white/10" />
          : <div className="w-14 h-14 rounded-xl bg-amber-400/20 grid place-items-center text-amber-200 font-black shrink-0">{initials(ev.name)}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-bold text-white truncate min-w-0">{ev.name}</h3>
            <StatusPill status={ev.status} />
          </div>
          {fmtAuctionAt(ev.auction_at) && (
            <div className="mt-0.5 text-xs text-amber-100/50">📅 {fmtAuctionAt(ev.auction_at)}</div>
          )}
          <span className="mt-1 inline-block text-sm font-semibold text-amber-300 group-hover:text-amber-200">{ctaLabel(ev)} →</span>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0 text-amber-200/40 group-hover:text-amber-200 translate-x-0 group-hover:translate-x-1 transition" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-gradient-to-br from-[#0b0a06] via-[#1c1608] to-[#2a1f08] text-white">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/40 border-b border-amber-300/20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 min-w-0 group" title="Home">
            <img src="/auction-logo.png" alt="" className="h-8 w-8 object-contain shrink-0" />
            <span className="font-extrabold tracking-tight truncate">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">Golden</span>
              <span className="text-white">Bid</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">X</span>
            </span>
          </button>
          <button onClick={() => navigate('/')} className="shrink-0 rounded-full border border-white/20 text-indigo-100/80 text-sm font-semibold px-4 py-1.5 hover:text-white hover:border-white/40 transition">Home</button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Tournaments</h1>
          <p className="text-amber-100/70 mt-1">Watch live auctions and browse past results.</p>
        </div>

        {error ? (
          <div className="py-20 text-center">
            <p className="text-amber-100/90 mb-4">{error}</p>
            <button onClick={() => navigate('/')} className="rounded-full bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 font-bold px-5 py-2.5">Go home</button>
          </div>
        ) : events === null ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400 mx-auto mb-4" />
            <p className="text-amber-100/80">Loading tournaments…</p>
          </div>
        ) : total === 0 ? (
          <div className="py-20 text-center">
            <div className="text-4xl mb-3">🏟️</div>
            <p className="text-amber-100/80">No tournaments to show yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {SECTIONS.map(({ key, title, icon, empty }) => (
              <section key={key}>
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-200/70 mb-3">
                  <span>{icon}</span> {title}
                  <span className="text-amber-100/40 font-semibold">({grouped[key].length})</span>
                </h2>
                {grouped[key].length === 0 ? (
                  <p className="text-amber-100/40 text-sm">{empty}</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {grouped[key].map((ev) => <Card key={ev.id} ev={ev} />)}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>

      <BrandFooter theme="dark" compact />
    </div>
  );
};

export default TournamentsDirectory;
