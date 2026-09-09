import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import BrandFooter from './BrandFooter';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ROLES = ['Batter', 'Bowler', 'WK', 'Batting AR', 'Bowling AR'];

const IcoWhatsApp = (p) => (<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" {...p}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.463 3.488A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>);
const IcoMail = (p) => (<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" {...p}><path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z"/><path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z"/></svg>);
const IcoPhone = (p) => (<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" {...p}><path fillRule="evenodd" clipRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"/></svg>);

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
          <img src="/logo-full.png" alt="GoldenBidX" className="w-44 sm:w-52 mx-auto mb-2 drop-shadow-[0_6px_20px_rgba(232,184,75,0.2)]" />
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/90 font-bold">Player Registration</p>
          {event.logo_url && <img src={event.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover mx-auto mt-2 ring-1 ring-white/15" />}
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
          <p className="text-center text-[11px] text-indigo-200/50">Have a great auction!</p>
        </form>

        {event.show_contact && (event.contact_phone || event.contact_email || event.contact_note) && (
          <div className="mt-4 rounded-2xl border border-amber-300/25 bg-amber-400/[0.06] p-4 text-center">
            <p className="text-amber-200 font-bold text-sm">Questions about this event?</p>
            <p className="text-indigo-200/70 text-xs mb-3">Contact the organizer directly.</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {event.contact_phone && <a href={`tel:${event.contact_phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-slate-700 text-white text-xs font-semibold px-3.5 py-2 hover:brightness-110 transition"><IcoPhone /> {event.contact_phone}</a>}
              {event.contact_phone && <a href={`https://wa.me/${event.contact_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] text-white text-xs font-semibold px-3.5 py-2 hover:brightness-110 transition"><IcoWhatsApp /> WhatsApp</a>}
              {event.contact_email && <a href={`mailto:${event.contact_email}`} className="inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] text-white text-xs font-semibold px-3.5 py-2 hover:brightness-110 transition"><IcoMail /> Email</a>}
            </div>
            {event.contact_note && <p className="text-indigo-200/60 text-xs mt-2">{event.contact_note}</p>}
          </div>
        )}
      </div>
      <BrandFooter theme="dark" compact />
    </div>
  );
};

export default RegisterPage;
