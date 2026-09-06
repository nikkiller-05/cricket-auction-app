// One-time seed for admin_users. Run: `node scripts/seedAdmins.js`
// Credentials come from env vars (never hardcode). Existing usernames are
// updated (password re-hashed), so you can also use this to rotate passwords.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const seeds = [
  {
    username: process.env.SUPER_ADMIN_USERNAME,
    password: process.env.SUPER_ADMIN_PASSWORD,
    role: 'super-admin',
    name: 'Super Admin',
  },
  {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
    name: 'Admin',
  },
];

(async () => {
  if (!supabase) {
    console.error('❌ Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
    process.exit(1);
  }

  for (const s of seeds) {
    if (!s.username || !s.password) {
      console.warn(`⚠️  Skipping ${s.role}: missing ${s.role === 'super-admin' ? 'SUPER_ADMIN_USERNAME/PASSWORD' : 'ADMIN_USERNAME/PASSWORD'} env vars.`);
      continue;
    }
    const password_hash = await bcrypt.hash(s.password, 10);
    const { error } = await supabase
      .from('admin_users')
      .upsert(
        { username: s.username, password_hash, role: s.role, name: s.name, created_by: 'seed' },
        { onConflict: 'username' }
      );
    if (error) {
      console.error(`❌ Failed to seed ${s.role} (${s.username}):`, error.message);
    } else {
      console.log(`✅ Seeded ${s.role}: ${s.username}`);
    }
  }

  console.log('Done.');
  process.exit(0);
})();
