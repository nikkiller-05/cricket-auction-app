import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const StarIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="32" height="32" className="transition-transform">
    <path
      d="M12 2.5l2.9 6.1 6.6.7-4.9 4.6 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.7z"
      fill={filled ? '#fbbf24' : 'none'}
      stroke={filled ? '#fbbf24' : 'rgba(255,255,255,0.35)'}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

// "How are we doing?" widget — a 1-5 star rating plus an optional short
// comment, posted to the backend so real visitor sentiment is captured (not
// just anecdotal). Restricted to signed-in visitors: an anonymous click on a
// star (or Submit) opens the same Sign In / Create account modal used
// elsewhere on the homepage, rather than silently accepting the rating.
const FeedbackWidget = ({ session, onRequireAuth }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const pickStar = (n) => {
    if (!session) { onRequireAuth?.(); return; }
    setRating(n);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!session) { onRequireAuth?.(); return; }
    if (!rating) { setError('Please pick a star rating first'); return; }
    setSubmitting(true);
    setError('');
    try {
      await axios.post(`${API_BASE_URL}/api/feedback`, {
        rating,
        comment: comment.trim() || undefined,
        page: 'homepage',
        website,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit feedback, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-3xl border border-amber-300/20 bg-gradient-to-b from-amber-400/10 to-transparent p-8 text-center">
        <div className="text-3xl mb-2">🙏</div>
        <h3 className="text-xl font-extrabold text-white">Thanks for the feedback!</h3>
        <p className="mt-1 text-indigo-200/80">It genuinely helps us make GoldenBidX better.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-amber-300/20 bg-gradient-to-b from-amber-400/10 to-transparent p-8 text-center">
      <h3 className="text-xl md:text-2xl font-extrabold text-white">How are we doing?</h3>
      <p className="mt-1 text-indigo-200/80">
        {session ? 'Rate your experience so far — it takes two seconds.' : (
          <>Sign in to rate your experience — <button type="button" onClick={() => onRequireAuth?.()} className="font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-2">sign in or create an account</button>.</>
        )}
      </p>

      <form onSubmit={submit} className="mt-5">
        {/* Honeypot */}
        <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" className="hidden" tabIndex={-1} autoComplete="off" />

        <div className="flex items-center justify-center gap-1.5" role="radiogroup" aria-label="Rate your experience">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onClick={() => pickStar(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="p-1 hover:scale-110 active:scale-95 transition-transform"
            >
              <StarIcon filled={(hover || rating) >= n} />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <div className="mt-4 mx-auto max-w-md gbx-fade-up">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Anything you'd like us to know? (optional)"
              className="w-full rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/50"
            />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

        <button
          type="submit"
          disabled={submitting || (session && !rating)}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 px-6 py-2.5 font-semibold text-slate-900 shadow-lg hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting ? 'Submitting…' : session ? 'Submit feedback' : 'Sign in to submit'}
        </button>
      </form>
    </div>
  );
};

export default FeedbackWidget;
