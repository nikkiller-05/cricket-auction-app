const jwt = require('jsonwebtoken');

// Verify any admin role
const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET || 'cricket-auction-secret-key', (err, user) => {
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

    jwt.verify(token, process.env.JWT_SECRET || 'cricket-auction-secret-key', (err, user) => {
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

    jwt.verify(token, process.env.JWT_SECRET || 'cricket-auction-secret-key', (err, user) => {
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
    console.log('🔐 verifyConfigPermission middleware hit');
    const authHeader = req.headers['authorization'];
    console.log('🔐 Auth header:', authHeader);
    const token = authHeader && authHeader.split(' ')[1];
    console.log('🔐 Extracted token:', token ? 'Present' : 'Missing');

    if (!token) {
      console.log('🔐 No token provided');
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'cricket-auction-secret-key', (err, user) => {
      if (err) {
        console.log('🔐 Token verification failed:', err.message);
        return res.status(403).json({ error: 'Invalid token' });
      }

      console.log('🔐 Token verified, user:', user);
      if (!['super-admin', 'admin'].includes(user.role)) {
        console.log('🔐 Insufficient permissions. User role:', user.role);
        return res.status(403).json({ error: 'Configuration permission required. Sub-admins can only perform bidding.' });
      }

      console.log('🔐 Permission granted, proceeding to controller');
      req.user = user;
      next();
    });

  } catch (error) {
    console.error('🔐 Config auth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = {
  verifyAdmin,
  verifySuperAdmin,
  verifyBiddingPermission,
  verifyConfigPermission
};
