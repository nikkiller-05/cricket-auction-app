const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const mailer = require('../services/mailer');
const registrationService = require('../services/registrationService');

const JWT_SECRET = process.env.JWT_SECRET;
const TABLE = 'admin_users';
const APP_URL = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || '';
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

// Show a hint of the email without revealing it fully, e.g. n****r@gmail.com.
const maskEmail = (email) => {
  const [name, domain] = String(email).split('@');
  if (!domain) return email;
  const shown = name.length <= 2 ? name[0] : `${name[0]}****${name[name.length - 1]}`;
  return `${shown}@${domain}`;
};

// Look up a single admin/sub-admin row by username.
const findUserByUsername = async (username) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('username', username)
    .maybeSingle();
  if (error) {
    console.error('admin_users lookup error:', error.message);
    return null;
  }
  return data;
};

// Look up a row by a unique field (email lowercased / phone). Returns first match or null.
const findUserByField = async (field, value) => {
  if (!supabase || !value) return null;
  const { data } = await supabase.from(TABLE).select('id, username').eq(field, value).limit(1);
  return (data && data[0]) || null;
};

// Validate + assemble a name/email/phone update; sends an error response and
// returns null if validation fails. `selfId` is the row being edited (to skip
// its own email/phone during duplicate checks).
const buildProfilePayload = async (body, selfId, res) => {
  const payload = {};
  if (body.name !== undefined) payload.name = (body.name || '').trim() || null;

  if (body.email !== undefined) {
    const email = (body.email || '').trim().toLowerCase() || null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { res.status(400).json({ error: 'Invalid email address' }); return null; }
    if (email) {
      const ex = await findUserByField('email', email);
      if (ex && String(ex.id) !== String(selfId)) { res.status(400).json({ error: 'An account with this email already exists' }); return null; }
    }
    payload.email = email;
  }

  if (body.phone !== undefined) {
    const phone = (body.phone || '').trim() || null;
    if (phone && !/^\d{10}$/.test(phone)) { res.status(400).json({ error: 'Phone must be a 10-digit number' }); return null; }
    if (phone) {
      const ex = await findUserByField('phone', phone);
      if (ex && String(ex.id) !== String(selfId)) { res.status(400).json({ error: 'An account with this phone already exists' }); return null; }
    }
    payload.phone = phone;
  }

  return payload;
};

const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  permissions: u.permissions,
  createdAt: u.created_at,
  createdBy: u.created_by,
});

const authController = {
  login: async (req, res, next) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      if (!supabase) {
        return res.status(503).json({ error: 'Authentication service unavailable' });
      }

      const user = await findUserByUsername(username);
      if (!user || !user.password_hash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, eventId: user.event_id || null },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name || null,
          email: user.email || null,
          phone: user.phone || null,
          role: user.role,
          eventId: user.event_id || null,
        },
      });
    } catch (error) {
      console.error('Login error:', error.message);
      next(error);
    }
  },

  // Add the other methods here (createSubAdmin, getSubAdmins, deleteSubAdmin)
  createSubAdmin: async (req, res, next) => {
    try {
      const { username, password, name } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      if (!supabase) {
        return res.status(503).json({ error: 'Authentication service unavailable' });
      }

      const existing = await findUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          username,
          password_hash,
          name: name || username,
          role: 'sub-admin',
          permissions: ['bidding'],
          created_by: req.user?.username || 'admin',
        })
        .select()
        .single();

      if (error) {
        console.error('createSubAdmin error:', error.message);
        return res.status(500).json({ error: 'Could not create sub-admin' });
      }

      res.json({ message: 'Sub-admin created successfully', subAdmin: publicUser(data) });
    } catch (error) {
      next(error);
    }
  },

  getSubAdmins: async (req, res, next) => {
    try {
      if (!supabase) return res.json({ subAdmins: [] });

      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('role', 'sub-admin')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('getSubAdmins error:', error.message);
        return res.status(500).json({ error: 'Could not fetch sub-admins' });
      }

      res.json({ subAdmins: (data || []).map(publicUser) });
    } catch (error) {
      next(error);
    }
  },

  deleteSubAdmin: async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!supabase) {
        return res.status(503).json({ error: 'Authentication service unavailable' });
      }

      // Only sub-admins may be removed through this route.
      const { data, error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', id)
        .eq('role', 'sub-admin')
        .select()
        .maybeSingle();

      if (error) {
        console.error('deleteSubAdmin error:', error.message);
        return res.status(500).json({ error: 'Could not delete sub-admin' });
      }
      if (!data) {
        return res.status(404).json({ error: 'Sub-admin not found' });
      }

      res.json({ message: 'Sub-admin deleted successfully', deletedAdmin: data.username });
    } catch (error) {
      next(error);
    }
  },

  // Create an organizer account scoped to a single registration event (super-admin).
  createOrganizer: async (req, res, next) => {
    try {
      const { username, password, name, eventId } = req.body;
      const email = (req.body.email || '').trim().toLowerCase() || null;
      const phone = (req.body.phone || '').trim() || null;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }
      if (phone && !/^\d{10}$/.test(phone)) {
        return res.status(400).json({ error: 'Phone must be a 10-digit number' });
      }
      if (!supabase) {
        return res.status(503).json({ error: 'Authentication service unavailable' });
      }

      if (await findUserByUsername(username)) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      if (email && await findUserByField('email', email)) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }
      if (phone && await findUserByField('phone', phone)) {
        return res.status(400).json({ error: 'An account with this phone already exists' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          username,
          password_hash,
          name: name || username,
          email,
          phone,
          role: 'organizer',
          permissions: ['registrations'],
          event_id: eventId || null,
          created_by: req.user?.username || 'super-admin',
        })
        .select()
        .single();

      if (error) {
        console.error('createOrganizer error:', error.message);
        return res.status(500).json({ error: 'Could not create organizer' });
      }
      res.json({ message: 'Organizer created successfully', organizer: publicUser(data) });
    } catch (error) {
      next(error);
    }
  },

  getOrganizers: async (req, res, next) => {
    try {
      if (!supabase) return res.json({ organizers: [] });
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, username, name, email, phone, role, event_id, reset_requested_at, created_at')
        .eq('role', 'organizer')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('getOrganizers error:', error.message);
        return res.status(500).json({ error: 'Could not fetch organizers' });
      }
      res.json({ organizers: data || [] });
    } catch (error) {
      next(error);
    }
  },

  // Super-admin deletes an organizer; their events are unassigned first.
  deleteOrganizer: async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!supabase) return res.status(503).json({ error: 'Authentication service unavailable' });
      try { await registrationService.unassignOrganizerEvents(id); } catch (e) { /* events table optional */ }
      const { data, error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', id)
        .eq('role', 'organizer')
        .select()
        .maybeSingle();
      if (error) return res.status(500).json({ error: 'Could not delete organizer' });
      if (!data) return res.status(404).json({ error: 'Organizer not found' });
      res.json({ message: 'Organizer deleted', username: data.username });
    } catch (error) {
      next(error);
    }
  },

  // Edit your own profile (name / email / phone).
  updateProfile: async (req, res, next) => {
    try {
      if (!supabase) return res.status(503).json({ error: 'Authentication service unavailable' });
      const payload = await buildProfilePayload(req.body, req.user.id, res);
      if (!payload) return; // buildProfilePayload already sent an error response
      const { data, error } = await supabase.from(TABLE).update(payload).eq('id', req.user.id).select().maybeSingle();
      if (error) return res.status(500).json({ error: 'Could not update profile' });
      if (!data) return res.status(404).json({ error: 'User not found' });
      res.json({ user: publicUser(data) });
    } catch (error) {
      next(error);
    }
  },

  // Super-admin edits an organizer's profile (name / email / phone).
  updateOrganizer: async (req, res, next) => {
    try {
      if (!supabase) return res.status(503).json({ error: 'Authentication service unavailable' });
      const { id } = req.params;
      const payload = await buildProfilePayload(req.body, id, res);
      if (!payload) return;
      const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).eq('role', 'organizer').select().maybeSingle();
      if (error) return res.status(500).json({ error: 'Could not update organizer' });
      if (!data) return res.status(404).json({ error: 'Organizer not found' });
      res.json({ organizer: publicUser(data) });
    } catch (error) {
      next(error);
    }
  },
  // Change your own password (any logged-in manager: super-admin/admin/organizer).
  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      if (!supabase) return res.status(503).json({ error: 'Authentication service unavailable' });

      const user = await findUserByUsername(req.user.username);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const ok = await bcrypt.compare(currentPassword, user.password_hash);
      if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });

      const password_hash = await bcrypt.hash(newPassword, 10);
      const { error } = await supabase.from(TABLE).update({ password_hash }).eq('id', user.id);
      if (error) return res.status(500).json({ error: 'Could not change password' });
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Super-admin resets another user's (e.g. organizer's) password.
  resetUserPassword: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      if (!supabase) return res.status(503).json({ error: 'Authentication service unavailable' });

      const password_hash = await bcrypt.hash(newPassword, 10);
      const { data, error } = await supabase
        .from(TABLE)
        .update({ password_hash, reset_requested_at: null })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) return res.status(500).json({ error: 'Could not reset password' });
      if (!data) return res.status(404).json({ error: 'User not found' });
      res.json({ message: 'Password reset successfully', username: data.username });
    } catch (error) {
      next(error);
    }
  },

  // Public: a user who forgot their password. A reset link is ONLY ever sent to
  // the account's own registered email — never to an address typed by the
  // requester. Messages are explicit so users understand what happened.
  forgotPassword: async (req, res, next) => {
    try {
      const identifier = (req.body.identifier || req.body.username || req.body.email || '').trim();
      if (!identifier) return res.status(400).json({ error: 'Enter your username or registered email' });
      if (!supabase) return res.status(503).json({ error: 'Service unavailable' });

      // Resolve the account by username first, then by registered email.
      let user = await findUserByUsername(identifier);
      if (!user) user = await findUserByField('email', identifier.toLowerCase());
      if (!user) return res.status(404).json({ error: 'No account found with that username or email.' });

      // Record the request so an admin can help even if email can't be sent.
      await supabase.from(TABLE).update({ reset_requested_at: new Date().toISOString() }).eq('id', user.id);

      if (!user.email) {
        return res.status(400).json({ error: 'No email is registered for this account. Please contact your admin to reset your password.' });
      }
      if (!mailer.isConfigured) {
        return res.status(400).json({ error: 'Email is not set up on the server yet. Your admin has been notified to reset your password.' });
      }

      // Prefer the configured public URL; fall back to the request origin so the
      // link always points at the site the user came from.
      const appUrl = (APP_URL || req.headers.origin || '').replace(/\/$/, '');
      if (!appUrl) return res.status(500).json({ error: 'Server is missing PUBLIC_APP_URL. Please contact your admin.' });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
      await supabase.from(TABLE).update({ reset_token: hashToken(rawToken), reset_token_expires: expires }).eq('id', user.id);
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

      try {
        await mailer.sendPasswordReset(user.email, resetUrl, user.username);
      } catch (e) {
        console.error('reset email failed:', e.message);
        return res.status(502).json({ error: `Could not send the reset email: ${e.message}` });
      }
      res.json({ message: `A password reset link has been sent to ${maskEmail(user.email)}. It is valid for 1 hour.` });
    } catch (error) {
      next(error);
    }
  },

  // Super-admin: send a test email to verify SMTP configuration.
  sendTestEmail: async (req, res, next) => {
    try {
      const to = (req.body.to || '').trim();
      if (!to) return res.status(400).json({ error: 'Recipient email is required' });
      if (!mailer.isConfigured) {
        return res.status(400).json({ error: 'SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS on the server.' });
      }
      await mailer.sendTest(to);
      res.json({ message: `Test email sent to ${to}. Check the inbox (and spam).` });
    } catch (error) {
      // Surface the SMTP error so the admin can debug credentials/host.
      res.status(500).json({ error: error.message || 'Failed to send test email' });
    }
  },

  // Public: complete a reset using the emailed token.
  resetPasswordWithToken: async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
      if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
      if (!supabase) return res.status(503).json({ error: 'Authentication service unavailable' });

      const { data: user, error } = await supabase
        .from(TABLE)
        .select('id, reset_token_expires')
        .eq('reset_token', hashToken(token))
        .maybeSingle();
      if (error || !user) return res.status(400).json({ error: 'Invalid or expired reset link' });
      if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
        return res.status(400).json({ error: 'This reset link has expired' });
      }

      const password_hash = await bcrypt.hash(newPassword, 10);
      await supabase.from(TABLE).update({
        password_hash,
        reset_token: null,
        reset_token_expires: null,
        reset_requested_at: null,
      }).eq('id', user.id);
      res.json({ message: 'Password updated. You can now sign in.' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
