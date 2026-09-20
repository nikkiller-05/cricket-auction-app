import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import BrandFooter from './BrandFooter';

const roleLabel = (r) =>
  r === 'wicket-keeper' ? 'Keeper' : r ? r.charAt(0).toUpperCase() + r.slice(1) : 'Player';

const fmtDateTime = (iso) => { if (!iso) return null; const d = new Date(iso); return isNaN(d.getTime()) ? null : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); };
const fmtDate = (s) => { if (!s) return null; const d = new Date(`${String(s).slice(0, 10)}T00:00:00`); return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-IN', { dateStyle: 'medium' }); };

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
  const teams = Array.isArray(event.teams) ? event.teams : [];
  const teamCount = event.team_count || teams.length || 0;
  const hasTeamNames = teams.some((t) => t && t.name);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden gbx-bg text-white">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-gradient-to-b from-black/70 to-black/15 border-b border-amber-300/25 shadow-[0_16px_34px_-18px_rgba(0,0,0,0.95)]">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 min-w-0 group" title="Home">
            <img src="/auction-logo.png" alt="" className="h-10 w-auto shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]" />
            <span className="font-extrabold tracking-tight text-lg truncate">
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

        {/* Schedule */}
        {(event.auction_at || event.registration_deadline || event.event_start_date || event.event_end_date) && (
          <div className="grid gap-3 sm:grid-cols-3 mb-6">
            {event.auction_at && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                <div className="text-[11px] uppercase tracking-wide text-amber-100/50">Auction</div>
                <div className="text-sm font-semibold text-white mt-0.5">{fmtDateTime(event.auction_at)}</div>
              </div>
            )}
            {event.registration_deadline && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                <div className="text-[11px] uppercase tracking-wide text-amber-100/50">Registration {event.registration_open ? 'closes' : 'closed'}</div>
                <div className="text-sm font-semibold text-white mt-0.5">{fmtDateTime(event.registration_deadline)}</div>
              </div>
            )}
            {(event.event_start_date || event.event_end_date) && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                <div className="text-[11px] uppercase tracking-wide text-amber-100/50">Tournament</div>
                <div className="text-sm font-semibold text-white mt-0.5">{[fmtDate(event.event_start_date), fmtDate(event.event_end_date)].filter(Boolean).join(' – ')}</div>
              </div>
            )}
          </div>
        )}

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

        {/* Teams */}
        {teamCount > 0 && (
          <section className="mb-7">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-200/70">Teams</h2>
              <span className="text-amber-100/60 text-sm font-semibold">{teamCount}</span>
            </div>
            {hasTeamNames ? (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: teamCount }).map((_, i) => {
                  const t = teams[i] || {};
                  return (
                    <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 flex items-center gap-3">
                      {t.logoUrl
                        ? <img src={t.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover bg-white/10 shrink-0" />
                        : <div className="w-10 h-10 rounded-xl bg-amber-400/15 grid place-items-center text-amber-200 font-bold shrink-0">{i + 1}</div>}
                      <span className="min-w-0 font-semibold text-white truncate">{t.name || `Team ${i + 1}`}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-amber-100/80">
                <span className="font-extrabold text-white">{teamCount}</span> teams participating
              </div>
            )}
          </section>
        )}

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
