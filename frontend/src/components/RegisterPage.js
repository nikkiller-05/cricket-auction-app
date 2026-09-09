import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ROLES = ['Batter', 'Bowler', 'WK', 'Batting AR', 'Bowling AR'];

// Downscale + compress an image file to keep storage small (~1000px, JPEG q0.7).
const compressImage = (file, maxDim = 1000, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) { height = (height * maxDim) / width; width = maxDim; }
      else if (height >= width && height > maxDim) { width = (width * maxDim) / height; height = maxDim; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (b) => (b ? resolve(new File([b], 'upload.jpg', { type: 'image/jpeg' })) : reject(new Error('compression failed'))),
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('invalid image')); };
    img.src = url;
  });

const Field = ({ label, required, children, hint }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wide text-indigo-200/80 mb-1.5">
      {label} {required && <span className="text-amber-300">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-[11px] text-indigo-200/50">{hint}</p>}
  </div>
);

const inputCls =
  'w-full rounded-lg bg-white/10 border border-white/20 text-white text-sm px-3 py-2.5 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-300/50 [&>option]:text-slate-900';

const RegisterPage = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: '', mobile: '', role: '', profileLink: '',
    matches: '', runs: '', wickets: '', paymentTxnId: '', website: '',
  });
  const [photo, setPhoto] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [photoName, setPhotoName] = useState('');
  const [shotName, setShotName] = useState('');

  useEffect(() => {
    let active = true;
    axios.get(`${API_BASE_URL}/api/registrations/public/${slug}`)
      .then((res) => { if (active) setEvent(res.data.event); })
      .catch(() => { if (active) setNotFound(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickFile = useCallback((setter, setName) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) { setError('Please choose an image file'); return; }
    setError('');
    try {
      const compressed = await compressImage(file);
      setter(compressed);
      setName(file.name);
    } catch {
      setError('Could not process that image, try another');
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name is required');
    if (!/^[0-9]{10}$/.test(form.mobile.trim())) return setError('Enter a valid 10-digit mobile number');
    if (!form.role) return setError('Please select a role');
    if (!photo) return setError('Profile photo is required');
    if (event.payment_required) {
      if (!form.paymentTxnId.trim()) return setError('Enter the payment reference (UTR)');
      if (!screenshot) return setError('Please upload the payment screenshot');
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('photo', photo);
      if (screenshot) fd.append('screenshot', screenshot);
      await axios.post(`${API_BASE_URL}/api/registrations/public/${slug}/submit`, fd);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const bg = { background: 'radial-gradient(58rem 40rem at -8% -18%, rgba(232,184,75,0.16) 0%, transparent 60%), radial-gradient(54rem 40rem at 112% 116%, rgba(176,120,32,0.18) 0%, transparent 60%), linear-gradient(160deg, #0a0a0f 0%, #12101b 46%, #0b0b11 100%)' };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white" style={bg}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-300" />
    </div>;
  }

  if (notFound) {
    return <div className="min-h-screen flex items-center justify-center text-center px-4" style={bg}>
      <div className="text-white">
        <div className="text-5xl mb-4">🏏</div>
        <h1 className="text-xl font-bold mb-1">Registration link not found</h1>
        <p className="text-indigo-200/70 text-sm">Please check the link with your organizer.</p>
      </div>
    </div>;
  }

  if (done) {
    return <div className="min-h-screen flex items-center justify-center text-center px-4" style={bg}>
      <div className="max-w-md w-full rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-2xl p-8 text-white">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Registration submitted!</h1>
        <p className="text-indigo-200/80 text-sm">
          Thanks for registering for <span className="font-semibold text-amber-200">{event.name}</span>.
          {event.payment_required ? ' The organizer will verify your payment and confirm your entry.' : ' The organizer will review and confirm your entry.'}
        </p>
      </div>
    </div>;
  }

  if (!event.registration_open) {
    return <div className="min-h-screen flex items-center justify-center text-center px-4" style={bg}>
      <div className="text-white">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold mb-1">Registration is closed</h1>
        <p className="text-indigo-200/70 text-sm">for {event.name}</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen py-8 px-4" style={bg}>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <img src="/auction-logo.png" alt="" className="w-16 h-16 rounded-xl mx-auto mb-3 ring-1 ring-amber-300/30" />
          <p className="text-sm font-extrabold text-white tracking-tight">GoldenBidX</p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/90 font-bold">Player Registration</p>
          <h1 className="text-2xl font-extrabold text-white mt-1">{event.name}</h1>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-2xl p-6 space-y-4 shadow-2xl">
          {/* Honeypot */}
          <input type="text" value={form.website} onChange={set('website')} name="website" className="hidden" tabIndex={-1} autoComplete="off" />

          <Field label="Full Name" required>
            <input className={inputCls} value={form.name} onChange={set('name')} placeholder="Your name" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Mobile" required>
              <input className={inputCls} value={form.mobile} onChange={set('mobile')} inputMode="numeric" maxLength={10} placeholder="10-digit number" />
            </Field>
            <Field label="Role" required>
              <select className={inputCls} value={form.role} onChange={set('role')}>
                <option value="">Select…</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Profile Photo" required hint="Max 3MB — auto-compressed to save space.">
            <input type="file" accept="image/*" onChange={pickFile(setPhoto, setPhotoName)} className="block w-full text-xs text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-amber-400/90 file:px-4 file:py-2 file:text-slate-900 file:font-semibold" />
            {photoName && <p className="mt-1 text-[11px] text-emerald-300">✓ {photoName}</p>}
          </Field>

          <Field label="Player Profile Link" hint="e.g. your CricHeroes profile — used to auto-fill stats.">
            <input className={inputCls} value={form.profileLink} onChange={set('profileLink')} placeholder="https://cricheroes.com/player-profile/…" />
          </Field>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80 mb-2">Optional stats</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Matches"><input className={inputCls} value={form.matches} onChange={set('matches')} inputMode="numeric" /></Field>
              <Field label="Runs"><input className={inputCls} value={form.runs} onChange={set('runs')} inputMode="numeric" /></Field>
              <Field label="Wickets"><input className={inputCls} value={form.wickets} onChange={set('wickets')} inputMode="numeric" /></Field>
            </div>
          </div>

          {event.payment_required && (
            <div className="rounded-xl border border-amber-300/30 bg-amber-400/[0.06] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-amber-200">Registration Fee</p>
                <p className="text-lg font-extrabold text-amber-300">₹{Number(event.reg_fee || 0).toLocaleString('en-IN')}</p>
              </div>
              {event.upi_qr_url && <img src={event.upi_qr_url} alt="Payment QR" className="mx-auto w-40 h-40 rounded-lg bg-white p-1" />}
              {event.upi_id && (
                <div className="flex items-center justify-center gap-2 text-sm text-white">
                  <span className="text-indigo-200/70">UPI:</span>
                  <span className="font-semibold">{event.upi_id}</span>
                  <button type="button" onClick={() => { navigator.clipboard?.writeText(event.upi_id); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                    className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold hover:bg-white/25">
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
              <Field label="Payment Reference / UTR" required>
                <input className={inputCls} value={form.paymentTxnId} onChange={set('paymentTxnId')} placeholder="12-digit UPI reference no." />
              </Field>
              <Field label="Payment Screenshot" required hint="Upload proof of payment (auto-compressed).">
                <input type="file" accept="image/*" onChange={pickFile(setScreenshot, setShotName)} className="block w-full text-xs text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-amber-400/90 file:px-4 file:py-2 file:text-slate-900 file:font-semibold" />
                {shotName && <p className="mt-1 text-[11px] text-emerald-300">✓ {shotName}</p>}
              </Field>
            </div>
          )}

          {error && <div className="rounded-lg bg-rose-500/20 border border-rose-400/30 text-rose-100 text-sm px-3 py-2">{error}</div>}

          <button type="submit" disabled={submitting}
            className="w-full rounded-full bg-gradient-to-b from-amber-400 to-amber-500 px-6 py-3 text-sm font-bold text-slate-900 shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition disabled:opacity-50">
            {submitting ? 'Submitting…' : 'Submit Registration'}
          </button>
          <p className="text-center text-[11px] text-indigo-200/50">Crafted by The Vernekar Brothers</p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
