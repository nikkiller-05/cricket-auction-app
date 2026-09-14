import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import PublicCompletedAuction from './PublicCompletedAuction';

// Public, view-only entry point for a live auction: /a/:slug
// Resolves the event's slug to its auction id. A completed event shows a
// read-only results summary; anything else hands off to the shared dashboard in
// spectator mode. The id in the URL never grants operator access — the backend
// authorizes every write against the token + event ownership.
const PublicAuctionPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [completedEvent, setCompletedEvent] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/registrations/public/${slug}`);
        const event = data?.event;
        if (!event?.id) {
          if (active) setError('This auction could not be found.');
          return;
        }
        // Finished auctions get a read-only summary; live ones enter as spectator.
        if (event.status === 'completed') {
          if (active) setCompletedEvent(event);
          return;
        }
        navigate(`/dashboard?auctionId=${encodeURIComponent(event.id)}`, {
          replace: true,
          state: { isAdmin: false },
        });
      } catch {
        if (active) setError('This auction link is not available.');
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, navigate]);

  if (completedEvent) {
    return <PublicCompletedAuction event={completedEvent} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0a06] via-[#1c1608] to-[#2a1f08] px-4">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-amber-100 text-lg mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="rounded-full bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 font-bold px-5 py-2.5"
            >
              Go home
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4" />
            <p className="text-amber-100 text-lg">Loading live auction…</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicAuctionPage;
