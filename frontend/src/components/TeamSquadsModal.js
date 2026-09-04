import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useNotification } from './NotificationSystem';
import Button from './Button';

// Distinct accent per team card (cycled)
const TEAM_ACCENTS = [
  { from: '#4f46e5', to: '#7c3aed' }, // indigo→violet
  { from: '#0891b2', to: '#0e7490' }, // cyan
  { from: '#059669', to: '#0d9488' }, // emerald→teal
  { from: '#d97706', to: '#ea580c' }, // amber→orange
  { from: '#db2777', to: '#e11d48' }, // pink→rose
  { from: '#2563eb', to: '#4f46e5' }, // blue→indigo
  { from: '#7c3aed', to: '#a21caf' }, // violet→fuchsia
  { from: '#0d9488', to: '#0891b2' }, // teal→cyan
];

const cleanTeamName = (name) => (name ? name.replace(/\(\d+\)$/, '').trim() : '');

const catLabel = (c) =>
  c === 'wicket-keeper' ? 'Keeper' : c ? c.charAt(0).toUpperCase() + c.slice(1) : '—';

// A single designed team-squad card (also used as the capture target).
const TeamCard = React.forwardRef(({ team, players, accent }, ref) => {
  const squad = players.filter((p) => p.team === team.id);
  const captain = squad.find((p) => team.captain === p.id) || squad.find((p) => p.category === 'captain');
  const others = squad.filter((p) => p !== captain);
  const spent = squad.reduce((s, p) => s + (p.finalBid || 0), 0);

  return (
    <div
      ref={ref}
      style={{
        width: 640,
        background: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        border: '1px solid #e2e8f0',
        boxSizing: 'border-box',
      }}
    >
      {/* Header band */}
      <div
        style={{
          background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
          color: '#fff',
          padding: '18px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🏏</span>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {cleanTeamName(team.name)}
          </span>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, lineHeight: 1.4 }}>
          <div style={{ opacity: 0.85 }}>Budget Left</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>₹{team.budget}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 22px' }}>
        {captain && (
          <div
            style={{
              background: '#faf5ff',
              border: '1px solid #e9d5ff',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9333ea', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                👑 Captain
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#6b21a8' }}>{captain.name}</div>
              <div style={{ fontSize: 12, color: '#a855f7' }}>{captain.role || catLabel(captain.category)}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#7e22ce' }}>
              {captain.captainAmount || team.captainAmount ? `₹${captain.captainAmount || team.captainAmount}` : ''}
            </div>
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: '#64748b', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <th style={{ padding: '6px 4px' }}>#</th>
              <th style={{ padding: '6px 4px' }}>Player</th>
              <th style={{ padding: '6px 4px' }}>Category</th>
              <th style={{ padding: '6px 4px', textAlign: 'right' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {others.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '14px 4px', color: '#94a3b8', textAlign: 'center' }}>
                  No players bought yet
                </td>
              </tr>
            )}
            {others.map((p, i) => (
              <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 4px', color: '#94a3b8' }}>{i + 1}</td>
                <td style={{ padding: '8px 4px', fontWeight: 600, color: '#0f172a' }}>{p.name}</td>
                <td style={{ padding: '8px 4px', color: '#475569' }}>{catLabel(p.category)}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                  {p.finalBid ? `₹${p.finalBid}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '2px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
          }}
        >
          <span style={{ color: '#64748b' }}>
            {squad.length} player{squad.length === 1 ? '' : 's'}
          </span>
          <span style={{ fontWeight: 800, color: '#0f172a' }}>Total Spent: ₹{spent}</span>
        </div>
      </div>

      {/* Branding watermark (captured in the exported image) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 22px',
          background: '#0b0b0f',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src="/auction-logo.png"
            alt=""
            width={26}
            height={26}
            crossOrigin="anonymous"
            style={{ borderRadius: 6, display: 'block' }}
          />
          <span style={{ fontWeight: 800, letterSpacing: '0.16em', fontSize: 12 }}>AUCTION</span>
          <span style={{ color: '#e8b84b', fontSize: 11, fontWeight: 600 }}>Bid · Discover · Own</span>
        </div>
        <span style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.04em' }}>
          Vernekar Brothers
        </span>
      </div>
    </div>
  );
});

const TeamSquadsModal = ({ isOpen, onClose, teams = [], players = [] }) => {
  const { showSuccess, showError } = useNotification();
  const cardRefs = useRef({});

  if (!isOpen) return null;

  const captureCanvas = (el) => html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });

  const downloadPng = async (team) => {
    try {
      const el = cardRefs.current[team.id];
      if (!el) return;
      const canvas = await captureCanvas(el);
      const link = document.createElement('a');
      link.download = `${cleanTeamName(team.name).replace(/\s+/g, '-')}-squad.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showSuccess(`${cleanTeamName(team.name)} squad image downloaded`);
    } catch (err) {
      showError('Could not generate PNG');
    }
  };

  const downloadAllPdf = async () => {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      let first = true;

      for (const team of teams) {
        const el = cardRefs.current[team.id];
        if (!el) continue;
        const canvas = await captureCanvas(el);
        const imgW = pageW - 60;
        const imgH = (canvas.height * imgW) / canvas.width;
        if (!first) pdf.addPage();
        first = false;
        const y = Math.max(30, (pageH - imgH) / 2);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 30, y, imgW, Math.min(imgH, pageH - 60));
      }
      pdf.save('team-squads.pdf');
      showSuccess('Team squads PDF downloaded');
    } catch (err) {
      showError('Could not generate PDF');
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-4xl max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl">
        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-white">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">👥 Team Squads</h3>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="primary" size="sm" onClick={downloadAllPdf} className="whitespace-nowrap">
              <span className="text-base leading-none">⬇️</span>
              <span className="hidden sm:inline">Download all </span>(PDF)
            </Button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 grid grid-cols-1 gap-6">
          {teams.map((team, idx) => (
            <div key={team.id} className="flex flex-col items-center gap-3">
              {/* Wide (640px) card scrolls within its own cell instead of widening the modal */}
              <div className="w-full overflow-x-auto flex justify-start sm:justify-center">
                <TeamCard
                  ref={(el) => (cardRefs.current[team.id] = el)}
                  team={team}
                  players={players}
                  accent={TEAM_ACCENTS[idx % TEAM_ACCENTS.length]}
                />
              </div>
              <Button variant="primary" size="sm" onClick={() => downloadPng(team)}>
                <span className="text-base leading-none">🖼️</span>
                Download this squad (PNG)
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamSquadsModal;
