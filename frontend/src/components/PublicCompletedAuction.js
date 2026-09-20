import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { formatCurrency, cleanTeamName } from '../lib/format';
import { getTeamIcon } from '../sports';
import BrandFooter from './BrandFooter';
import TeamSquadsModal from './TeamSquadsModal';
import PlayerAvatar from './PlayerAvatar';

// Distinct accent per team card (cycled) — mirrors the squad export palette.
const TEAM_ACCENTS = [
  'from-indigo-500 to-violet-600',
  'from-cyan-500 to-sky-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-fuchsia-600',
  'from-teal-500 to-cyan-600',
];

const roleLabel = (p) =>
  p.role || (p.category === 'wicket-keeper' ? 'Keeper' : p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : '');

// Ease-out count-up for the headline numbers.
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const to = Number(target) || 0;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

const StatCard = ({ label, value, icon, currency, delay = 0 }) => {
  const n = useCountUp(value);
  return (
    <div className="gbx-fade-up rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-4 py-3" style={{ animationDelay: `${delay}ms` }}>
      <div className="text-xs text-amber-100/60 font-medium flex items-center gap-1.5"><span>{icon}</span>{label}</div>
      <div className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 truncate">{currency ? formatCurrency(n) : n}</div>
    </div>
  );
};

// Off-screen designed poster (captured to PNG for sharing). Inline styles keep
// html2canvas capture reliable across themes.
const PosterCard = React.forwardRef(({ event, summary: S }, ref) => {
  const top = S.spotlights?.top;
  return (
    <div ref={ref} style={{ width: 760, background: 'linear-gradient(160deg,#0b0a06,#1c1608 55%,#2a1f08)', color: '#fff', fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif', padding: 36, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        {event.logo_url
          ? <img src={event.logo_url} crossOrigin="anonymous" alt="" width={72} height={72} style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', background: 'rgba(255,255,255,0.1)' }} />
          : <div style={{ width: 72, height: 72, borderRadius: 16, background: 'rgba(232,184,75,0.2)', display: 'grid', placeItems: 'center', fontSize: 34 }}>🏆</div>}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', color: '#6ee7b7', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(52,211,153,0.35)', borderRadius: 999, padding: '4px 12px' }}>AUCTION COMPLETED</div>
          <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6, lineHeight: 1.1 }}>{event.name}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
        {[['Teams', S.teams.length], ['Sold', S.soldCount], ['Unsold', S.unsoldCount], ['Spend', formatCurrency(S.totalSpend)]].map(([l, v]) => (
          <div key={l} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'rgba(253,230,138,0.6)' }}>{l}</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{v}</div>
          </div>
        ))}
      </div>
      {top && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'linear-gradient(90deg, rgba(251,191,36,0.2), rgba(245,158,11,0.05))', border: '1px solid rgba(252,211,77,0.4)', borderRadius: 20, padding: 16, marginBottom: 22 }}>
          {top.imageUrl
            ? <img src={top.imageUrl} crossOrigin="anonymous" alt="" width={72} height={72} style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover' }} />
            : <div style={{ width: 72, height: 72, borderRadius: 16, background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 26 }}>{(top.name || '?').slice(0, 1)}</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#fcd34d', letterSpacing: '0.1em' }}>⭐ HIGHEST BID OVERALL</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{top.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(253,230,138,0.7)' }}>{roleLabel(top)}{S.teamNameOf(top) ? ` · ${S.teamNameOf(top)}` : ''}</div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#fcd34d' }}>{formatCurrency(top.finalBid || 0)}</div>
        </div>
      )}
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(253,230,138,0.6)', marginBottom: 8 }}>TEAMS</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
        {S.squads.map(({ team, spent, count }) => (
          <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '10px 12px' }}>
            {team.logoUrl
              ? <img src={team.logoUrl} crossOrigin="anonymous" alt="" width={34} height={34} style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'contain', background: 'rgba(255,255,255,0.9)' }} />
              : <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}>🏏</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cleanTeamName(team.name)}</div>
              <div style={{ fontSize: 11, color: 'rgba(253,230,138,0.6)' }}>{count} players · {formatCurrency(spent)}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14 }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{window.location.host}/a/{event.slug}</div>
        <div style={{ fontSize: 16, fontWeight: 900 }}><span style={{ color: '#fbbf24' }}>Golden</span>BidX</div>
      </div>
    </div>
  );
});

// One spotlight (top buy in a category).
const SpotlightCard = ({ label, player, teamNameOf }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 flex items-center gap-3">
    <PlayerAvatar player={player} size="md" shape="rounded" />
    <div className="min-w-0 flex-1">
      <div className="text-[10px] uppercase tracking-wide font-bold text-amber-100/50">{label}</div>
      <div className="font-semibold text-white truncate">{player.name}</div>
      <div className="text-[11px] text-amber-100/50 truncate">{teamNameOf(player) || roleLabel(player)}</div>
    </div>
    <div className="text-base font-extrabold text-amber-300 shrink-0">{formatCurrency(player.finalBid || 0)}</div>
  </div>
);

// Read-only public results for a finished auction (event.status === 'completed').
// Fetches the header-scoped, public auction snapshot and presents final squads,
// spend and a one-tap squad export. No operator controls are ever rendered here.
const PublicCompletedAuction = ({ event }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [downloadingKind, setDownloadingKind] = useState('');
  const [downloadErr, setDownloadErr] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSquads, setShowSquads] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const [posterBusy, setPosterBusy] = useState(false);
  const menuRef = useRef(null);
  const posterRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    let active = true;
    axios
      .get(`${API_BASE_URL}/api/auction/data`, { headers: { 'x-auction-id': event.id } })
      .then(({ data: d }) => { if (active) { setData(d); setLoading(false); } })
      .catch(() => { if (active) { setErr('We could not load the results for this auction.'); setLoading(false); } });
    return () => { active = false; };
  }, [event.id]);

  const summary = useMemo(() => {
    const teams = data?.teams || [];
    const players = data?.players || [];
    const soldPlayers = players.filter((p) => p.status === 'sold' || p.finalBid > 0);
    const totalSpend = soldPlayers.reduce((s, p) => s + (p.finalBid || 0), 0);
    const squads = teams.map((team, i) => {
      const squad = players.filter((p) => p.team === team.id);
      const captain = squad.find((p) => team.captain === p.id) || squad.find((p) => p.category === 'captain');
      const others = squad.filter((p) => p !== captain).sort((a, b) => (b.finalBid || 0) - (a.finalBid || 0));
      const spent = squad.reduce((s, p) => s + (p.finalBid || 0), 0);
      const total = spent + (team.budget || 0);
      return {
        team,
        accent: TEAM_ACCENTS[i % TEAM_ACCENTS.length],
        players: captain ? [captain, ...others] : others,
        captainId: captain?.id,
        count: squad.length,
        spent,
        remaining: team.budget || 0,
        pct: total > 0 ? Math.round((spent / total) * 100) : 0,
      };
    });
    const soldSorted = [...soldPlayers].sort((a, b) => (b.finalBid || 0) - (a.finalBid || 0));
    const topBuys = soldSorted.slice(0, 5);
    const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
    const teamNameOf = (p) => { const t = teamById[p.team]; return t ? cleanTeamName(t.name) : ''; };
    // Spotlights: highest bid overall + top buy per category.
    const CATS = [['batter', 'Batter'], ['bowler', 'Bowler'], ['wicket-keeper', 'Keeper'], ['allrounder', 'All-rounder']];
    const catTop = {};
    soldPlayers.forEach((p) => { const c = p.category; if (c && (!catTop[c] || (p.finalBid || 0) > (catTop[c].finalBid || 0))) catTop[c] = p; });
    const spotlights = {
      top: soldSorted[0] || null,
      categories: CATS.map(([k, label]) => ({ label, player: catTop[k] })).filter((c) => c.player),
    };
    // Full roster with outcome, sold (by price) first then unsold.
    const roster = [...players].sort((a, b) => {
      const as = a.status === 'sold' || a.finalBid > 0 ? 1 : 0;
      const bs = b.status === 'sold' || b.finalBid > 0 ? 1 : 0;
      if (as !== bs) return bs - as;
      return (b.finalBid || 0) - (a.finalBid || 0);
    });
    return {
      teams, players, soldCount: soldPlayers.length,
      unsoldCount: players.length - soldPlayers.length,
      totalPlayers: players.length, totalSpend, squads, topBuys,
      teamNameOf, spotlights, roster,
    };
  }, [data]);

  const downloadFile = async (kind, suffix) => {
    setDownloadingKind(kind);
    setDownloadErr('');
    setMenuOpen(false);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/downloads/${kind}`, {
        headers: { 'x-auction-id': event.id },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.slug || 'auction'}-${suffix}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadErr('Download is not available right now. Please try again.');
    } finally {
      setDownloadingKind('');
    }
  };

  // Render the designed poster to PNG and share it (native share on mobile, else download).
  const downloadPoster = async () => {
    if (!posterRef.current) return;
    setPosterBusy(true); setDownloadErr(''); setMenuOpen(false);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(posterRef.current, { useCORS: true, backgroundColor: null, scale: 2, logging: false });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('render failed');
      const file = new File([blob], `${event.slug || 'auction'}-results.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: event.name, text: `${event.name} — auction results` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = file.name;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
      }
    } catch {
      setDownloadErr('Could not generate the poster. Please try again.');
    } finally {
      setPosterBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden gbx-bg text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-gradient-to-b from-black/70 to-black/15 border-b border-amber-300/25 shadow-[0_16px_34px_-18px_rgba(0,0,0,0.95)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 min-w-0 group" title="Home">
            <img src="/auction-logo.png" alt="" className="h-10 w-auto shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]" />
            <span className="font-extrabold tracking-tight text-lg truncate">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">Golden</span>
              <span className="text-white">Bid</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">X</span>
            </span>
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => navigate('/tournaments')} className="hidden sm:inline-flex rounded-full border border-white/20 text-indigo-100/80 text-sm font-semibold px-4 py-1.5 hover:text-white hover:border-white/40 transition" title="All tournaments">All tournaments</button>
            <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              disabled={loading || !!err}
              className="rounded-full bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 text-sm font-bold px-4 py-1.5 hover:-translate-y-0.5 transition disabled:opacity-50 disabled:translate-y-0"
            >
              {(downloadingKind || posterBusy) ? 'Preparing…' : '⬇ Download ▾'}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-[#14121c] shadow-2xl z-50 overflow-hidden">
                <button onClick={downloadPoster} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/5">
                  <span className="text-lg">📢</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">Share results poster</span>
                    <span className="block text-xs text-amber-100/60">A designed PNG summary to share</span>
                  </span>
                </button>
                <button onClick={() => { setShowSquads(true); setMenuOpen(false); }} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/5">
                  <span className="text-lg">🖼️</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">Team Squads (PDF / PNG)</span>
                    <span className="block text-xs text-amber-100/60">Designed, shareable team cards</span>
                  </span>
                </button>
                <button onClick={() => downloadFile('results', 'complete-report')} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/5">
                  <span className="text-lg">📊</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">Complete Report (Excel)</span>
                    <span className="block text-xs text-amber-100/60">Every sheet: squads, finances & more</span>
                  </span>
                </button>
                <button onClick={() => downloadFile('unsold', 'unsold-players')} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/5">
                  <span className="text-lg">📄</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">Unsold Players (Excel)</span>
                    <span className="block text-xs text-amber-100/60">Everyone who went unsold</span>
                  </span>
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Event hero */}
        <div className="gbx-shine relative overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-400/15 via-white/[0.04] to-transparent p-5 sm:p-7 mb-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            {event.logo_url
              ? <img src={event.logo_url} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-white/10 shrink-0 ring-2 ring-amber-300/30" />
              : <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-400/20 grid place-items-center text-3xl shrink-0">🏆</div>}
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold px-3 py-1 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Auction Completed
              </span>
              <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight truncate">{event.name}</h1>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400 mx-auto mb-4" />
            <p className="text-amber-100/80">Loading results…</p>
          </div>
        ) : err ? (
          <div className="py-20 text-center">
            <p className="text-amber-100/90 mb-4">{err}</p>
            <button onClick={() => navigate('/')} className="rounded-full bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 font-bold px-5 py-2.5">Go home</button>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StatCard label="Teams" value={summary.teams.length} icon="🛡️" delay={0} />
              <StatCard label="Players sold" value={summary.soldCount} icon="✅" delay={70} />
              <StatCard label="Unsold" value={summary.unsoldCount} icon="⚪" delay={140} />
              <StatCard label="Total spend" value={summary.totalSpend} icon="💰" currency delay={210} />
            </div>

            {downloadErr && (
              <p className="mb-4 text-sm text-rose-300 bg-rose-500/10 border border-rose-400/20 rounded-lg px-3 py-2">{downloadErr}</p>
            )}

            {/* Top buys */}
            {summary.topBuys.length > 0 && (
              <section className="mb-7">
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-200/70 mb-2">Top buys</h2>
                <div className="flex flex-wrap gap-2">
                  {summary.topBuys.map((p, i) => (
                    <div key={p.id || i} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] pl-1 pr-3 py-1">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-400 text-slate-900 text-xs font-black">{i + 1}</span>
                      <span className="text-sm font-semibold truncate max-w-[9rem]">{p.name}</span>
                      <span className="text-sm font-bold text-amber-300">{formatCurrency(p.finalBid || 0)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Auction spotlights */}
            {(summary.spotlights.top || summary.spotlights.categories.length > 0) && (
              <section className="gbx-fade-up mb-7" style={{ animationDelay: '260ms' }}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-200/70 mb-2">Auction spotlights</h2>
                {summary.spotlights.top && (
                  <div className="rounded-3xl border border-amber-300/40 bg-gradient-to-r from-amber-400/20 to-amber-500/[0.05] p-4 sm:p-5 mb-3 flex items-center gap-4">
                    <PlayerAvatar player={summary.spotlights.top} size="lg" shape="rounded" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] uppercase tracking-wider font-bold text-amber-300">⭐ Highest bid overall</div>
                      <div className="text-xl sm:text-2xl font-extrabold text-white truncate">{summary.spotlights.top.name}</div>
                      <div className="text-xs text-amber-100/60 truncate">{roleLabel(summary.spotlights.top)}{summary.teamNameOf(summary.spotlights.top) ? ` · ${summary.teamNameOf(summary.spotlights.top)}` : ''}</div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-300 shrink-0">{formatCurrency(summary.spotlights.top.finalBid || 0)}</div>
                  </div>
                )}
                {summary.spotlights.categories.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {summary.spotlights.categories.map((c) => (
                      <SpotlightCard key={c.label} label={`Top ${c.label}`} player={c.player} teamNameOf={summary.teamNameOf} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Registered players — clickable, scrollable roster with outcomes */}
            {summary.roster.length > 0 && (
              <section className="gbx-fade-up mb-8" style={{ animationDelay: '320ms' }}>
                <button onClick={() => setShowPlayers((v) => !v)} className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 hover:bg-white/[0.08] transition">
                  <span className="font-bold text-white">Players registered <span className="text-amber-100/50 font-semibold">({summary.roster.length})</span></span>
                  <span className="text-sm font-semibold text-amber-200">{showPlayers ? '▲ Hide' : '▼ Show'}</span>
                </button>
                {showPlayers && (
                  <div className="mt-2 max-h-[28rem] overflow-y-auto rounded-2xl border border-white/10 divide-y divide-white/5">
                    {summary.roster.map((p) => {
                      const sold = p.status === 'sold' || p.finalBid > 0;
                      return (
                        <div key={p.id} className={`flex items-center gap-3 px-4 py-2.5 ${sold ? 'bg-emerald-500/[0.06]' : 'bg-rose-500/[0.05]'}`}>
                          <PlayerAvatar player={p} size="sm" shape="rounded" />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white truncate">{p.name}</div>
                            {roleLabel(p) && <div className="text-[11px] text-amber-100/50">{roleLabel(p)}</div>}
                          </div>
                          <div className="text-right shrink-0">
                            {sold ? (
                              <>
                                <div className="text-sm font-bold text-emerald-300">{formatCurrency(p.finalBid || 0)}</div>
                                <div className="text-[11px] text-emerald-200/70 truncate max-w-[10rem]">Sold to {summary.teamNameOf(p) || 'team'}</div>
                              </>
                            ) : (
                              <span className="text-[11px] font-bold text-rose-300 bg-rose-500/10 border border-rose-400/25 rounded-full px-2.5 py-1">Unsold</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Squads */}
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-200/70 mb-3">Final squads</h2>
            {summary.squads.length === 0 ? (
              <p className="text-amber-100/70">No teams to show.</p>
            ) : (
              <div className="gbx-fade-up grid gap-4 sm:grid-cols-2 xl:grid-cols-3" style={{ animationDelay: '380ms' }}>
                {summary.squads.map(({ team, accent, players, captainId, count, spent, remaining, pct }) => (
                  <div key={team.id} className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden flex flex-col">
                    <div className={`bg-gradient-to-r ${accent} px-4 py-3 flex items-center gap-3`}>
                      {team.logoUrl
                        ? <img src={team.logoUrl} alt="" className="w-10 h-10 rounded-lg object-contain bg-white/90 shrink-0" />
                        : <span className="text-2xl shrink-0">{getTeamIcon()}</span>}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold text-white truncate">{cleanTeamName(team.name)}</h3>
                        <p className="text-white/80 text-xs">{count} player{count === 1 ? '' : 's'}</p>
                      </div>
                    </div>
                    <div className="px-4 pt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-amber-100/70">Spent <span className="font-bold text-white">{formatCurrency(spent)}</span></span>
                        <span className="text-amber-100/70">Left <span className="font-bold text-white">{formatCurrency(remaining)}</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="p-3 flex-1">
                      {players.length === 0 ? (
                        <p className="text-amber-100/50 text-sm px-1 py-2">No players bought.</p>
                      ) : (
                        <ul className="divide-y divide-white/5">
                          {players.map((p) => (
                            <li key={p.id} className="flex items-center gap-2 py-1.5">
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5">
                                  {p.id === captainId && <span title="Captain">👑</span>}
                                  <span className="font-semibold text-sm truncate">{p.name}</span>
                                </span>
                                {roleLabel(p) && <span className="block text-[11px] text-amber-100/50">{roleLabel(p)}</span>}
                              </span>
                              <span className="text-sm font-bold text-amber-300 shrink-0">{formatCurrency(p.finalBid || 0)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <BrandFooter theme="dark" compact />

      <TeamSquadsModal
        isOpen={showSquads}
        onClose={() => setShowSquads(false)}
        teams={data?.teams || []}
        players={data?.players || []}
      />

      {data && (
        <div style={{ position: 'fixed', left: '-99999px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
          <PosterCard ref={posterRef} event={event} summary={summary} />
        </div>
      )}
    </div>
  );
};

export default PublicCompletedAuction;
