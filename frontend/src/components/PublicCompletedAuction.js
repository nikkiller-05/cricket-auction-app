import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { formatCurrency, cleanTeamName } from '../lib/format';
import { getTeamIcon } from '../sports';
import BrandFooter from './BrandFooter';

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

// Read-only public results for a finished auction (event.status === 'completed').
// Fetches the header-scoped, public auction snapshot and presents final squads,
// spend and a one-tap squad export. No operator controls are ever rendered here.
const PublicCompletedAuction = ({ event }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadErr, setDownloadErr] = useState('');

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
    const topBuys = [...soldPlayers].sort((a, b) => (b.finalBid || 0) - (a.finalBid || 0)).slice(0, 5);
    return {
      teams, players, soldCount: soldPlayers.length,
      unsoldCount: players.length - soldPlayers.length,
      totalPlayers: players.length, totalSpend, squads, topBuys,
    };
  }, [data]);

  const downloadSquads = async () => {
    setDownloading(true);
    setDownloadErr('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/download-results`, {
        headers: { 'x-auction-id': event.id },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.slug || 'auction'}-squads.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadErr('Download is not available right now. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-gradient-to-br from-[#0b0a06] via-[#1c1608] to-[#2a1f08] text-white">
      {/* Top bar */}
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
          <button
            onClick={downloadSquads}
            disabled={downloading || loading || !!err}
            className="shrink-0 rounded-full bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 text-sm font-bold px-4 py-1.5 hover:-translate-y-0.5 transition disabled:opacity-50 disabled:translate-y-0"
          >
            {downloading ? 'Preparing…' : '⬇ Download squads'}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Event hero */}
        <div className="flex items-center gap-4 mb-6">
          {event.logo_url
            ? <img src={event.logo_url} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover bg-white/10 shrink-0" />
            : <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400/20 grid place-items-center text-2xl shrink-0">🏆</div>}
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Auction Completed
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight truncate">{event.name}</h1>
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
              {[
                { label: 'Teams', value: summary.teams.length },
                { label: 'Players sold', value: summary.soldCount },
                { label: 'Unsold', value: summary.unsoldCount },
                { label: 'Total spend', value: formatCurrency(summary.totalSpend) },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                  <div className="text-xs text-amber-100/60 font-medium">{s.label}</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 truncate">{s.value}</div>
                </div>
              ))}
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

            {/* Squads */}
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-200/70 mb-3">Final squads</h2>
            {summary.squads.length === 0 ? (
              <p className="text-amber-100/70">No teams to show.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
    </div>
  );
};

export default PublicCompletedAuction;
