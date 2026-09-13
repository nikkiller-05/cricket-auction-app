const jwt = require('jsonwebtoken');
const { currentAuctionId, DEFAULT_AUCTION_ID } = require('../services/auctionContext');
const registrationService = require('../services/registrationService');

const JWT_SECRET = process.env.JWT_SECRET;

// Short-lived cache of event ownership so per-bid authz stays fast.
const eventOwnerCache = new Map(); // auctionId -> { organizerId, ts }
const OWNER_TTL_MS = 60 * 1000;

async function getEventOwnerId(auctionId) {
  const cached = eventOwnerCache.get(auctionId);
  if (cached && Date.now() - cached.ts < OWNER_TTL_MS) return cached.organizerId;
  const event = await registrationService.getEventById(auctionId);
  const organizerId = event ? String(event.organizer_id) : null;
  eventOwnerCache.set(auctionId, { organizerId, ts: Date.now() });
  return organizerId; // null when the event does not exist
}

// What an authenticated user may do on a given auction.
// - Default/main auction: legacy role tiers (no regression).
// - Event auction (auctionId = event.id): super-admin (global override) or the
//   owning organizer get full control; everyone else gets nothing.
async function computeAuctionAccess(user, auctionId) {
  const none = { canConfigure: false, canBid: false, canUndo: false };
  if (!user || !user.role) return none;
  const role = user.role;
  if (!auctionId || auctionId === DEFAULT_AUCTION_ID) {
    return {
      canConfigure: ['super-admin', 'admin'].includes(role),
      canBid: ['super-admin', 'admin', 'sub-admin'].includes(role),
      canUndo: role === 'super-admin',
    };
  }
  if (role === 'super-admin') return { canConfigure: true, canBid: true, canUndo: true };
  if (role === 'organizer') {
    const ownerId = await getEventOwnerId(auctionId);
    if (ownerId && ownerId === String(user.id)) {
      return { canConfigure: true, canBid: true, canUndo: true };
    }
  }
  return none;
}

// Gate a live-auction operator action by BOTH permission tier and tenant ownership.
const requireAuctionAccess = (tier) => (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    jwt.verify(token, JWT_SECRET, async (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = user;
      try {
        const auctionId = currentAuctionId();
        const access = await computeAuctionAccess(user, auctionId);
        const allowed =
          tier === 'config' ? access.canConfigure : tier === 'undo' ? access.canUndo : access.canBid;
        if (!allowed) {
          return res.status(403).json({ error: 'Not authorized to operate this auction' });
        }
        return next();
      } catch (e) {
        console.error('Auction access check error:', e);
        return res.status(500).json({ error: 'Authorization error' });
      }
    });
  } catch (error) {
    console.error('Auction operator auth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Verify any admin role
const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify JWT token
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }

      // Check if user has admin permissions
      if (!['super-admin', 'admin', 'sub-admin'].includes(user.role)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      req.user = user;
      next();
    });

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Verify super admin only
const verifySuperAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }

      if (user.role !== 'super-admin') {
        return res.status(403).json({ error: 'Super admin access required' });
      }

      req.user = user;
      next();
    });

  } catch (error) {
    console.error('Super admin auth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Verify bidding permission (sub-admin can bid, but not configure)
const verifyBiddingPermission = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }

      // All admin roles can perform bidding
      if (!['super-admin', 'admin', 'sub-admin'].includes(user.role)) {
        return res.status(403).json({ error: 'Bidding permission required' });
      }

      req.user = user;
      next();
    });

  } catch (error) {
    console.error('Bidding auth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Verify configuration permission (only super-admin and admin)
const verifyConfigPermission = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }

      if (!['super-admin', 'admin'].includes(user.role)) {
        return res.status(403).json({ error: 'Configuration permission required. Sub-admins can only perform bidding.' });
      }

      req.user = user;
      next();
    });

  } catch (error) {
    console.error('Config auth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Verify a registration manager: super-admin, admin, or organizer.
const verifyRegistrationManager = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      if (!['super-admin', 'admin', 'organizer'].includes(user.role)) {
        return res.status(403).json({ error: 'Registration management permission required' });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Registration auth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = {
  verifyAdmin,
  verifySuperAdmin,
  verifyBiddingPermission,
  verifyConfigPermission,
  verifyRegistrationManager,
  requireAuctionAccess,
  computeAuctionAccess
};
