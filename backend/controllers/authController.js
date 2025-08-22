const jwt = require('jsonwebtoken');

// Ensure users array is properly defined
const users = [
  { id: 1, username: 'superadmin', password: 'super123', role: 'super-admin' },
  { id: 2, username: 'admin', password: 'admin123', role: 'admin' }
];

let subAdmins = [];

console.log('AuthController loaded. Available users:', users.map(u => ({ username: u.username, role: u.role })));

const authController = {
  login: async (req, res, next) => {
    try {
      console.log('\n=== LOGIN ATTEMPT START ===');
      console.log('Request body received:', req.body);
      console.log('Available users:', users.map(u => u.username));
      
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        console.log('Missing credentials');
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      console.log(`Looking for user: ${username} with password: ${password}`);
      
      // Check main users first
      let user = users.find(u => {
        console.log(`Checking user: ${u.username} === ${username} && ${u.password} === ${password}`);
        return u.username === username && u.password === password;
      });
      
      console.log('Found in main users:', user ? 'Yes' : 'No');
      
      // If not found in main users, check sub-admins
      if (!user) {
        console.log('Checking sub-admins:', subAdmins.length);
        user = subAdmins.find(u => u.username === username && u.password === password);
        console.log('Found in sub-admins:', user ? 'Yes' : 'No');
      }
      
      if (!user) {
        console.log('LOGIN FAILED: Invalid credentials');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log('LOGIN SUCCESS: User found:', user.username, 'Role:', user.role);

      // Generate JWT token with role
      const tokenPayload = { id: user.id, username: user.username, role: user.role };
      console.log('Creating token with payload:', tokenPayload);
      
      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'cricket-auction-secret-key',
        { expiresIn: '24h' }
      );

      console.log('Token created successfully');
      
      const response = {
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      };
      
      console.log('Sending response:', response);
      console.log('=== LOGIN ATTEMPT END ===\n');
      
      res.json(response);

    } catch (error) {
      console.error('LOGIN ERROR CAUGHT:', error);
      next(error); // Pass to error middleware
    }
  },

  // Add the other methods here (createSubAdmin, getSubAdmins, deleteSubAdmin)
  createSubAdmin: async (req, res, next) => {
    try {
      const { username, password, name } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const existingUser = users.find(u => u.username === username) || 
                          subAdmins.find(u => u.username === username);
      
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const newSubAdmin = {
        id: Date.now(),
        username,
        password,
        name: name || username,
        role: 'sub-admin',
        permissions: ['bidding'],
        createdAt: new Date(),
        createdBy: req.user?.username || 'admin'
      };

      subAdmins.push(newSubAdmin);

      res.json({
        message: 'Sub-admin created successfully',
        subAdmin: {
          id: newSubAdmin.id,
          username: newSubAdmin.username,
          name: newSubAdmin.name,
          role: newSubAdmin.role,
          permissions: newSubAdmin.permissions,
          createdAt: newSubAdmin.createdAt
        }
      });

    } catch (error) {
      next(error);
    }
  },

  getSubAdmins: async (req, res, next) => {
    try {
      res.json({
        subAdmins: subAdmins.map(admin => ({
          id: admin.id,
          username: admin.username,
          name: admin.name,
          role: admin.role,
          permissions: admin.permissions,
          createdAt: admin.createdAt,
          createdBy: admin.createdBy
        }))
      });
    } catch (error) {
      next(error);
    }
  },

  deleteSubAdmin: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const adminIndex = subAdmins.findIndex(admin => admin.id === parseInt(id));
      
      if (adminIndex === -1) {
        return res.status(404).json({ error: 'Sub-admin not found' });
      }

      const deletedAdmin = subAdmins.splice(adminIndex, 1)[0];

      res.json({
        message: 'Sub-admin deleted successfully',
        deletedAdmin: deletedAdmin.username
      });

    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
