import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import PublicCompletedAuction from './PublicCompletedAuction';
import UnifiedDashboard from './UnifiedDashboard';

// Public, view-only entry point for an auction: /a/:slug — the single, permanent
// spectator URL for every state. Resolves the slug to its auction id and renders
// in place (the id lives internally in request headers, so the clean URL never
// changes): a completed event shows the read-only results summary, anything else
// shows the shared dashboard in spectator mode. The id here never grants operator
// access — the backend authorizes every write against the token + event ownership.
const PublicAuctionPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/registrations/public/${slug}`);
        if (!data?.event?.id) {
          if (active) setError('This auction could not be found.');
          return;
        }
        if (active) setEvent(data.event);
      } catch {
        if (active) setError('This auction link is not available.');
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0a06] via-[#1c1608] to-[#2a1f08] px-4">
        <div className="text-center">
          <p className="text-amber-100 text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="rounded-full bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 font-bold px-5 py-2.5"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0a06] via-[#1c1608] to-[#2a1f08] px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4" />
          <p className="text-amber-100 text-lg">Loading auction…</p>
        </div>
      </div>
    );
  }

  // Finished auctions get a read-only summary; live/upcoming show the spectator
  // dashboard in place — the URL stays /a/{slug} in every case.
  if (event.status === 'completed') {
    return <PublicCompletedAuction event={event} />;
  }
  return <UnifiedDashboard publicAuctionId={event.id} />;
};

export default PublicAuctionPage;

