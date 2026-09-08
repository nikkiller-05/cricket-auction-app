const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET;
const TABLE = 'admin_users';

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

const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  name: u.name,
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
        user: { id: user.id, username: user.username, role: user.role, eventId: user.event_id || null },
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
        .select('id, username, name, role, event_id, created_at')
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
        .update({ password_hash })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) return res.status(500).json({ error: 'Could not reset password' });
      if (!data) return res.status(404).json({ error: 'User not found' });
      res.json({ message: 'Password reset successfully', username: data.username });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
