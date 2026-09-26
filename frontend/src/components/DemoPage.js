import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import LiveBiddingCard from './LiveBiddingCard';
import SaleCelebration from './SaleCelebration';
import SmartRandomStage from '../features/auction/SmartRandomStage';
import TeamStandingsStrip from '../features/auction/TeamStandingsStrip';
import StatCards from '../features/auction/StatCards';
import LiveStatusPanel from '../features/auction/LiveStatusPanel';
import { formatCurrency } from '../lib/currency';

// Standalone, auto-playing showcase of the REAL auction UI, driven by
// scripted/fictional data (no live socket/API). Sample entries use well-known
// international cricketers' names with illustrated avatars (public/demo/*.svg) —
// their real photos are never used — to show how the live screens look, from
// both the spectator and the organizer's perspective.

const START_BUDGET = 60000;
const MAX_PLAYERS = 8;

const TEAMS = [
  { id: 't1', name: 'Thunder Strikers', logoUrl: '/demo/logo-t1.svg' },
  { id: 't2', name: 'Coastal Titans', logoUrl: '/demo/logo-t2.svg' },
  { id: 't3', name: 'Warriors CC', logoUrl: '/demo/logo-t3.svg' },
  { id: 't4', name: 'Royal Lancers', logoUrl: '/demo/logo-t4.svg' },
];

// Each player: a scripted bid ladder. Final frame with a team = sold to them;
// a final frame with team null = goes unsold (shows that animation too).
const PLAYERS = [
  {
    id: 'd1', name: 'Virat Kohli', role: 'batsman', category: 'A', imageUrl: '/demo/p1.svg',
    battingHand: 'Right-hand bat', matches: 42, runs: 1560, wickets: 4,
    ladder: [{ a: 2000, t: null }, { a: 3000, t: 't1' }, { a: 4500, t: 't2' }, { a: 6000, t: 't1' }],
  },
  {
    id: 'd2', name: 'Pat Cummins', role: 'bowler', category: 'A', imageUrl: '/demo/p2.svg',
    bowlingStyle: 'Right-arm fast', matches: 35, runs: 210, wickets: 58,
    ladder: [{ a: 1500, t: null }, { a: 2200, t: 't2' }, { a: 3200, t: 't3' }, { a: 4200, t: 't2' }],
  },
  {
    id: 'd3', name: 'Ben Stokes', role: 'all-rounder', category: 'A', imageUrl: '/demo/p3.svg',
    battingHand: 'Left-hand bat', matches: 50, runs: 980, wickets: 34,
    ladder: [{ a: 2500, t: null }, { a: 3500, t: 't3' }, { a: 5000, t: 't1' }, { a: 7000, t: 't3' }],
  },
  {
    id: 'd4', name: 'Quinton de Kock', role: 'wicket-keeper', category: 'B', imageUrl: '/demo/p4.svg',
    battingHand: 'Left-hand bat', matches: 12, runs: 180, wickets: 0,
    ladder: [{ a: 1500, t: null }], // no bids → unsold
  },
  {
    id: 'd5', name: 'Jason Holder', role: 'bowler', category: 'B', imageUrl: '/demo/p5.svg',
    bowlingStyle: 'Right-arm fast-medium', matches: 31, runs: 150, wickets: 41,
    ladder: [{ a: 1500, t: null }, { a: 2100, t: 't1' }, { a: 2900, t: 't3' }, { a: 3400, t: 't1' }],
  },
  {
    id: 'd6', name: 'Steve Smith', role: 'batsman', category: 'B', imageUrl: '/demo/p6.svg',
    battingHand: 'Right-hand bat', matches: 39, runs: 1180, wickets: 2,
    ladder: [{ a: 2000, t: null }, { a: 2600, t: 't2' }, { a: 3300, t: 't4' }, { a: 4100, t: 't2' }],
  },
];

const REVEAL_MS = 2600; // shuffle animation (~2.3s) + small buffer
const REVEALED_MS = 1500; // hold on the revealed player before bidding
const STEP_MS = 1400; // per bid tick

const emptyTeamState = () => TEAMS.map((t) => ({ ...t, budget: START_BUDGET, players: [] }));

// A faithful, INERT copy of the organizer's live bid controls (from
// LiveBiddingPanel) — same look, but demo-only so it never calls the API.
const DemoAdminControls = ({ teams, currentAmount, startingBudget }) => {
  const nextBid = currentAmount + 500;
  return (
    <div className="select-none">
      <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-bold text-white/70 text-center mb-3">Place Bid</p>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 mb-5">
        {teams.map((team) => {
          const pct = startingBudget > 0 ? Math.max(0, Math.min(100, (team.budget / startingBudget) * 100)) : 0;
          const barColor = pct > 50 ? 'bg-emerald-400' : pct > 20 ? 'bg-amber-400' : 'bg-rose-400';
          const canBid = team.budget >= nextBid && team.players.length < MAX_PLAYERS;
          return (
            <div
              key={team.id}
              className={`relative overflow-hidden px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border ${
                canBid
                  ? 'bg-gradient-to-br from-fuchsia-500/95 to-purple-600/95 text-white border-fuchsia-300/60 shadow-lg shadow-fuchsia-500/30'
                  : 'bg-white/5 text-white border-white/10 opacity-60'
              }`}
            >
              {canBid && <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />}
              <div className="relative flex flex-col items-center leading-tight">
                <span className="tracking-wide">{team.name}</span>
                <span className={`text-[10px] mt-0.5 font-semibold ${canBid ? 'text-white/85' : 'text-white/30'}`}>{formatCurrency(team.budget)}</span>
              </div>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-black/25">
                <span className={`block h-full ${barColor} ${canBid ? '' : 'opacity-40'}`} style={{ width: `${pct}%` }} />
              </span>
            </div>
          );
        })}
      </div>

      <div className="mb-5 pt-4 border-t border-white/15">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-bold text-white/70 text-center mb-2.5">Custom / Big Bid</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-lg bg-white/10 border border-white/25 text-white/60 text-sm px-3 py-2">Select team…</span>
          <span className="w-32 rounded-lg bg-white/10 border border-white/25 text-white/40 text-sm px-3 py-2">Amount</span>
          <span className="rounded-full border border-amber-300/50 bg-amber-400/10 px-5 py-2 text-sm font-semibold text-amber-200">Place</span>
        </div>
        <div className="flex justify-center gap-2 mt-2.5">
          {['+₹500', '+₹2,500', '+₹5,000', 'Clear'].map((l) => (
            <span key={l} className="rounded-full bg-white/10 border border-white/20 px-3.5 py-1.5 text-xs font-bold text-white">{l}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        <span className="px-5 sm:px-7 py-2.5 sm:py-3 bg-gradient-to-br from-emerald-400 to-green-600 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/40 border border-emerald-300/50 inline-flex items-center gap-2">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <span className="tracking-wide">SELL</span>
        </span>
        <span className="px-5 sm:px-7 py-2.5 sm:py-3 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/40 border border-rose-300/50 inline-flex items-center gap-2">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          <span className="tracking-wide">UNSOLD</span>
        </span>
      </div>
      <p className="mt-3 text-center text-[11px] text-white/45">Organizer controls (shown for illustration)</p>
    </div>
  );
};

const DemoPage = () => {
  const { theme } = useTheme();
  const [view, setView] = useState('spectator'); // 'spectator' | 'organizer'
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('revealing'); // 'revealing' | 'revealed' | 'bidding'
  const [step, setStep] = useState(0);
  const [teams, setTeams] = useState(emptyTeamState);
  const [history, setHistory] = useState([]);
  const [celebration, setCelebration] = useState(null);

  const player = PLAYERS[idx];
  const bid = phase === 'bidding' ? player.ladder[step] : player.ladder[0];
  const winner = teams.find((t) => t.id === bid.t) || null;
  const paused = !!celebration;

  const soldIds = useMemo(() => new Set(history.filter((h) => h.type === 'sold').map((h) => h.playerObj.id)), [history]);
  const unsoldIds = useMemo(() => new Set(history.filter((h) => h.type === 'unsold').map((h) => h.playerObj.id)), [history]);

  // Players shaped for the real components: sold/unsold get their status so the
  // reveal shuffle pool only draws from the ones still available.
  const playersWithStatus = useMemo(
    () => PLAYERS.map((p) => ({
      ...p,
      status: soldIds.has(p.id) ? 'sold' : unsoldIds.has(p.id) ? 'unsold' : 'available',
      team: history.find((h) => h.playerObj.id === p.id && h.type === 'sold')?.team?.id,
      finalBid: history.find((h) => h.playerObj.id === p.id && h.type === 'sold')?.finalBid,
    })),
    [soldIds, unsoldIds, history]
  );

  const soldPlayers = useMemo(() => playersWithStatus.filter((p) => p.status === 'sold'), [playersWithStatus]);
  const unsoldPlayers = useMemo(() => playersWithStatus.filter((p) => p.status === 'unsold'), [playersWithStatus]);

  const auctionData = useMemo(
    () => ({
      auctionStatus: 'running',
      currentBid: phase === 'bidding' ? { playerId: player.id, currentAmount: bid.a, biddingTeam: bid.t } : null,
      selection: phase === 'bidding' ? null : { stage: phase, playerId: player.id },
      players: playersWithStatus,
      teams,
      settings: { basePrice: 1500, startingBudget: START_BUDGET, maxPlayersPerTeam: MAX_PLAYERS },
    }),
    [phase, player.id, bid.a, bid.t, playersWithStatus, teams]
  );

  useEffect(() => {
    if (paused) return undefined;
    let t;
    if (phase === 'revealing') {
      t = setTimeout(() => setPhase('revealed'), REVEAL_MS);
    } else if (phase === 'revealed') {
      t = setTimeout(() => { setStep(0); setPhase('bidding'); }, REVEALED_MS);
    } else {
      // bidding
      t = setTimeout(() => {
        if (step < player.ladder.length - 1) { setStep((s) => s + 1); return; }
        const finalFrame = player.ladder[player.ladder.length - 1];
        if (finalFrame.t) {
          const winId = finalFrame.t;
          const finalBid = finalFrame.a;
          const winTeam = teams.find((tm) => tm.id === winId);
          setTeams((prev) => prev.map((tm) => (tm.id === winId ? { ...tm, budget: tm.budget - finalBid, players: [...tm.players, player.id] } : tm)));
          setHistory((prev) => [
            { id: `tx-${player.id}`, type: 'sold', playerName: player.name, playerRole: player.role, playerCategory: player.category, finalBid, timestamp: new Date(), team: { id: winId }, player: { ...player, team: winId }, playerObj: player },
            ...prev,
          ]);
          setCelebration({ type: 'sold', player, team: winTeam, amount: finalBid });
        } else {
          setHistory((prev) => [
            { id: `tx-${player.id}`, type: 'unsold', playerName: player.name, playerRole: player.role, playerCategory: player.category, timestamp: new Date(), player: { ...player }, playerObj: player },
            ...prev,
          ]);
          setCelebration({ type: 'unsold', player, team: null, amount: 0 });
        }
      }, STEP_MS);
    }
    return () => clearTimeout(t);
  }, [phase, step, idx, player, teams, paused]);

  const handleCelebrationDone = () => {
    setCelebration(null);
    const next = idx + 1;
    if (next >= PLAYERS.length) {
      setTeams(emptyTeamState());
      setHistory([]);
      setIdx(0);
    } else {
      setIdx(next);
    }
    setStep(0);
    setPhase('revealing');
  };

  const soldCount = soldPlayers.length;
  const unsoldCount = unsoldPlayers.length;
  const showReveal = phase === 'revealing' || phase === 'revealed';

  return (
    <div className="gbx-dashboard dash-root min-h-screen overflow-x-hidden" data-theme={theme}>
      <SaleCelebration celebration={celebration} onDone={handleCelebrationDone} />

      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-gradient-to-b from-black/80 to-black/40 backdrop-blur-xl border-b border-amber-300/25">
        <Link to="/" className="flex items-center gap-2 text-white font-extrabold">
          <span className="text-amber-300">Golden</span>BidX
        </Link>
        <span className="flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          Live demo · sample data
        </span>
        <Link to="/" className="text-indigo-100/80 hover:text-white text-sm font-semibold transition">← Home</Link>
      </header>

      {/* Other product screens — real pages, shown as screenshots (sample data) */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/80 mb-3">More of the product</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { img: '/demo/shot-registration.png', title: 'Player registration', desc: 'Players self-register with photo, role & stats.', to: '/tournaments', cta: 'Browse events →' },
            { img: '/demo/shot-console.png', title: 'Organizer console', desc: 'Create events, track registrations, launch auctions.', to: '/console', cta: 'Open console →' },
          ].map((s) => (
            <Link
              key={s.title}
              to={s.to}
              className="group block rounded-2xl border border-white/15 bg-[#12100c] overflow-hidden shadow-xl hover:border-amber-300/40 transition"
            >
              <div className="flex items-center gap-1.5 px-3 py-2 bg-black/30 border-b border-white/10">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                <span className="ml-2 text-[11px] font-semibold text-indigo-100/70">{s.title}</span>
              </div>
              <div className="h-52 sm:h-56 overflow-hidden">
                <img src={s.img} alt={`${s.title} screen`} className="w-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <p className="text-xs text-indigo-100/70">{s.desc}</p>
                <span className="shrink-0 text-xs font-semibold text-amber-300 group-hover:text-amber-200">{s.cta}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* View switcher */}
      <div className="flex justify-center gap-2 pt-5">
        {[
          { id: 'spectator', label: '\uD83D\uDC41\uFE0F Spectator view' },
          { id: 'organizer', label: '\uD83C\uDF9B\uFE0F Organizer view' },
        ].map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition border ${
              view === v.id ? 'bg-amber-400 text-slate-900 border-amber-300' : 'bg-white/[0.05] text-indigo-100/80 border-white/15 hover:bg-white/[0.09]'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="gbx-dashboard-content max-w-7xl mx-auto mt-4 sm:mt-5 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 rounded-2xl border border-white/60 bg-white/70 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_12px_28px_-16px_rgba(15,23,42,0.18)]">
        {showReveal ? (
          <SmartRandomStage
            players={playersWithStatus}
            selection={{ stage: phase, playerId: player.id }}
            settings={{ basePrice: 1500 }}
            isAdmin={view === 'organizer'}
            mode="all"
            eventName="Season Cup"
          />
        ) : (
          <LiveBiddingCard
            key={`${player.id}-${view}`}
            player={player}
            currentAmount={bid.a}
            leadingTeamName={winner?.name || null}
            leadingTeamBudget={winner ? winner.budget : null}
            leadingTeamLogo={winner ? winner.logoUrl : null}
            spectator={view === 'spectator'}
            rightSlot={view === 'organizer' ? (
              <DemoAdminControls teams={teams} currentAmount={bid.a} startingBudget={START_BUDGET} />
            ) : null}
          />
        )}

        <StatCards
          totalPlayers={PLAYERS.length}
          sold={soldCount}
          available={PLAYERS.length - soldCount - unsoldCount}
          unsold={unsoldCount}
          enableCaptains={false}
          enableRetention={false}
        />

        <TeamStandingsStrip teams={teams} startingBudget={START_BUDGET} maxPlayers={MAX_PLAYERS} />

        <div className="mt-2">
          <LiveStatusPanel
            auctionData={auctionData}
            transactionHistory={history}
            transactionsPerPage={6}
            currentPage={1}
            setCurrentPage={() => {}}
            soldPlayers={soldPlayers}
            unsoldPlayers={unsoldPlayers}
            onShare={() => {}}
          />
        </div>

        {/* See the other real screens */}
        <p className="mt-8 text-center text-xs text-slate-500">
          Automated demo with sample players and illustrated avatars — not a real auction.
        </p>
      </div>
    </div>
  );
};

export default DemoPage;
