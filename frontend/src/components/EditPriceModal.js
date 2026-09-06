import React, { useState, useEffect } from 'react';

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Styled dialog to correct a sold player's final price (replaces window.prompt).
const EditPriceModal = ({ isOpen, player, onClose, onSave, saving = false }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen && player) setValue(String(player.finalBid ?? ''));
  }, [isOpen, player]);

  if (!isOpen || !player) return null;

  const amount = parseInt(value, 10);
  const valid = !isNaN(amount) && amount > 0;
  const changed = valid && amount !== (player.finalBid || 0);

  const submit = () => {
    if (!valid) return;
    onSave(amount);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={saving ? undefined : onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl p-6">
        <button
          onClick={onClose}
          disabled={saving}
          aria-label="Close"
          className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition text-xl leading-none disabled:opacity-40"
        >
          ×
        </button>

        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Edit Sale Price</h3>
        <p className="text-sm text-slate-500 mb-4 truncate">{player.name}</p>

        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-slate-500">Current price</span>
          <span className="font-semibold text-slate-700">{formatCurrency(player.finalBid)}</span>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">New price (₹)</label>
        <input
          type="number"
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter new amount"
        />
        <div className="mt-2 h-5 text-sm">
          {valid ? (
            <span className="font-bold text-indigo-600">= {formatCurrency(amount)}</span>
          ) : value ? (
            <span className="text-rose-500">Enter a valid amount</span>
          ) : null}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-200 transition disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!changed || saving}
            className="rounded-full bg-gradient-to-b from-indigo-500 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:-translate-y-0.5 active:translate-y-0 transition disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {saving ? 'Saving…' : 'Save Price'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPriceModal;
