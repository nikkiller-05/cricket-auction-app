import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useNotification } from './NotificationSystem';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/95 backdrop-blur">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">🖼️ Team Squads</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadAllPdf}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/30"
            >
              ⬇️ Download all (PDF)
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none" aria-label="Close">
              ×
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 gap-6">
          {teams.map((team, idx) => (
            <div key={team.id} className="flex flex-col items-center gap-3">
              <TeamCard
                ref={(el) => (cardRefs.current[team.id] = el)}
                team={team}
                players={players}
                accent={TEAM_ACCENTS[idx % TEAM_ACCENTS.length]}
              />
              <button
                onClick={() => downloadPng(team)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 shadow-sm"
              >
                🖼️ Download this squad (PNG)
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamSquadsModal;
