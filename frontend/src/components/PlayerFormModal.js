import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from './NotificationSystem';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BLANK = {
  name: '',
  role: '',
  cricHeroesLink: '',
  manualId: '',
  imageUrl: '',
  matches: '',
  runs: '',
  battingAvg: '',
  highestScore: '',
  wickets: '',
  economy: '',
  bestBowling: '',
};

// Fields shown in the "stats" grid (label + key)
const STAT_FIELDS = [
  ['Matches', 'matches'],
  ['Runs', 'runs'],
  ['Batting Avg', 'battingAvg'],
  ['Highest Score', 'highestScore'],
  ['Wickets', 'wickets'],
  ['Economy', 'economy'],
  ['Best Bowling', 'bestBowling'],
];

// Reusable modal for adding a new player or editing an existing one.
const PlayerFormModal = ({ isOpen, mode = 'add', player = null, onClose }) => {
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && player) {
      setForm({ ...BLANK, ...player });
    } else {
      setForm(BLANK);
    }
  }, [isOpen, mode, player]);

  if (!isOpen) return null;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError('Player name is required', 'Missing Name');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        role: form.role,
        cricHeroesLink: form.cricHeroesLink,
        manualId: form.manualId,
        imageUrl: form.imageUrl,
        matches: form.matches,
        runs: form.runs,
        battingAvg: form.battingAvg,
        highestScore: form.highestScore,
        wickets: form.wickets,
        economy: form.economy,
        bestBowling: form.bestBowling,
      };

      if (mode === 'edit' && player) {
        await axios.put(`${API_BASE_URL}/api/players/${player.id}`, payload);
        showSuccess(`${form.name} updated`, 'Player Updated');
      } else {
        await axios.post(`${API_BASE_URL}/api/players/add`, payload);
        showSuccess(`${form.name} added`, 'Player Added');
      }
      onClose();
    } catch (err) {
      showError(
        err.response?.data?.error || `Could not ${mode === 'edit' ? 'update' : 'add'} player`,
        'Save Failed'
      );
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all';
  const labelCls =
    'block text-[11px] uppercase tracking-[0.14em] font-semibold text-slate-500 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={saving ? undefined : onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/95 backdrop-blur">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            {mode === 'edit' ? '✏️ Edit Player' : '➕ Add Player'}
          </h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none disabled:opacity-40"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <label className={labelCls}>Name *</label>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Player name"
                autoFocus
              />
            </div>
            <div className="md:col-span-1">
              <label className={labelCls}>Role / Category</label>
              <input
                className={inputCls}
                value={form.role}
                onChange={(e) => setField('role', e.target.value)}
                placeholder="e.g. Batsman, Bowler, Wicket Keeper"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>CricHeroes Link</label>
              <input
                className={inputCls}
                value={form.cricHeroesLink}
                onChange={(e) => setField('cricHeroesLink', e.target.value)}
                placeholder="https://cricheroes.com/player-profile/…"
              />
            </div>
            <div>
              <label className={labelCls}>Image URL</label>
              <input
                className={inputCls}
                value={form.imageUrl}
                onChange={(e) => setField('imageUrl', e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-slate-400 mb-2">
              Stats (optional)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STAT_FIELDS.map(([label, key]) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input
                    className={inputCls}
                    value={form[key]}
                    onChange={(e) => setField(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 disabled:opacity-40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 shadow-md shadow-indigo-500/30 transition-[background-color,transform] duration-150 hover:-translate-y-0.5 active:translate-y-0"
            >
              {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Add Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerFormModal;
