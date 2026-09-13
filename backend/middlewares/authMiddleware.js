const jwt = require('jsonwebtoken');
const { currentAuctionId, DEFAULT_AUCTION_ID } = require('../services/auctionContext');
const registrationService = require('../services/registrationService');

const JWT_SECRET = process.env.JWT_SECRET;

// Role tiers that apply to the legacy main (default) auction only.
const TIER_ROLES = {
  bid: ['super-admin', 'admin', 'sub-admin'],
  config: ['super-admin', 'admin'],
  undo: ['super-admin'],
};

// Gate a live-auction operator action by BOTH permission tier and tenant ownership.
// - Default/main auction: preserve existing role tiers exactly (no regression).
// - Event-scoped auction (auctionId = event.id): super-admin (global override) or the
//   organizer who owns that event. Everyone else is denied.
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
        if (!auctionId || auctionId === DEFAULT_AUCTION_ID) {
          const allowed = TIER_ROLES[tier] || [];
          if (!allowed.includes(user.role)) {
            return res.status(403).json({ error: 'Insufficient permission for this action' });
          }
          return next();
        }
        if (user.role === 'super-admin') return next();
        const event = await registrationService.getEventById(auctionId);
        if (!event) {
          return res.status(404).json({ error: 'Auction event not found' });
        }
        if (user.role === 'organizer' && String(event.organizer_id) === String(user.id)) {
          return next();
        }
        return res.status(403).json({ error: 'Not authorized to operate this auction' });
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
  requireAuctionAccess
};
