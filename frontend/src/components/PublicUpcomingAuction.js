import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import BrandFooter from './BrandFooter';

const roleLabel = (r) =>
  r === 'wicket-keeper' ? 'Keeper' : r ? r.charAt(0).toUpperCase() + r.slice(1) : 'Player';

// Read-only preview for an auction that hasn't started yet (event.status ===
// 'upcoming'): who has registered so far + how to join (via the organizer).
// Registration itself is not offered here — the organizer shares that link
// directly; viewers who want in are pointed to the organizer's contact.
const PublicUpcomingAuction = ({ event }) => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let active = true;
    axios
      .get(`${API_BASE_URL}/api/registrations/public/${event.slug}/players`)
      .then(({ data }) => { if (active) setPlayers(data.players || []); })
      .catch(() => { if (active) setErr('We could not load the registered players.'); });
    return () => { active = false; };
  }, [event.slug]);

  const hasContact = event.show_contact && (event.contact_phone || event.contact_email || event.contact_note);
  const digits = (event.contact_phone || '').replace(/\D/g, '');

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-gradient-to-br from-[#0b0a06] via-[#1c1608] to-[#2a1f08] text-white">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/40 border-b border-amber-300/20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 min-w-0 group" title="Home">
            <img src="/auction-logo.png" alt="" className="h-8 w-8 object-contain shrink-0" />
            <span className="font-extrabold tracking-tight truncate">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">Golden</span>
              <span className="text-white">Bid</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">X</span>
            </span>
          </button>
          <button onClick={() => navigate('/tournaments')} className="shrink-0 rounded-full border border-white/20 text-indigo-100/80 text-sm font-semibold px-4 py-1.5 hover:text-white hover:border-white/40 transition">All tournaments</button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Event hero */}
        <div className="flex items-center gap-4 mb-6">
          {event.logo_url
            ? <img src={event.logo_url} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover bg-white/10 shrink-0" />
            : <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400/20 grid place-items-center text-2xl shrink-0">🏆</div>}
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-200 text-[11px] font-bold px-2.5 py-0.5 uppercase tracking-wide">
              Upcoming
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight truncate">{event.name}</h1>
          </div>
        </div>

        {/* How to join */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:p-5 mb-6">
          <h2 className="font-bold text-white">This auction hasn’t started yet</h2>
          <p className="text-amber-100/70 text-sm mt-1">
            Here are the players who’ve registered so far. Want to take part?{' '}
            {hasContact ? 'Reach out to the organizer below to register.' : 'Contact the organizer to register.'}
          </p>
          {hasContact && (
            <div className="mt-3 flex flex-wrap gap-2">
              {event.contact_phone && (
                <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] text-white text-sm font-semibold px-4 py-1.5 hover:brightness-110 transition">WhatsApp organizer</a>
              )}
              {event.contact_phone && (
                <a href={`tel:${digits}`} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 text-white text-sm font-semibold px-4 py-1.5 hover:border-white/40 transition">Call {event.contact_phone}</a>
              )}
              {event.contact_email && (
                <a href={`mailto:${event.contact_email}`} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 text-white text-sm font-semibold px-4 py-1.5 hover:border-white/40 transition">Email organizer</a>
              )}
            </div>
          )}
          {event.contact_note && <p className="text-amber-100/60 text-xs mt-2">{event.contact_note}</p>}
        </div>

        {/* Registered players */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-200/70">Players registered</h2>
          <span className="text-amber-100/60 text-sm font-semibold">{players ? players.length : '—'}</span>
        </div>

        {err ? (
          <p className="text-amber-100/70">{err}</p>
        ) : players === null ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-amber-400 mx-auto mb-3" />
            <p className="text-amber-100/70">Loading players…</p>
          </div>
        ) : players.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-amber-100/60">
            No players have registered yet. Be the first — contact the organizer!
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {players.map((p) => (
              <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 flex items-center gap-3">
                <img src={p.profile_pic_url || '/logo192.png'} alt="" className="w-12 h-12 rounded-xl object-cover bg-white/10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white truncate">{p.name}</div>
                  <div className="text-xs text-amber-100/60">{roleLabel(p.role)}</div>
                  {(p.matches || p.runs || p.wickets) && (
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-semibold text-amber-100/70">
                      {p.matches ? <span className="rounded-full bg-white/10 px-2 py-0.5">M {p.matches}</span> : null}
                      {p.runs ? <span className="rounded-full bg-white/10 px-2 py-0.5">R {p.runs}</span> : null}
                      {p.wickets ? <span className="rounded-full bg-white/10 px-2 py-0.5">W {p.wickets}</span> : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BrandFooter theme="dark" compact />
    </div>
  );
};

export default PublicUpcomingAuction;
