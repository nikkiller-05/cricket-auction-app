const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');

const BUCKET = process.env.SUPABASE_IMAGE_BUCKET || 'player-images';
const EVENTS = 'auction_events';
const REGS = 'player_registrations';

const ensure = () => {
  if (!supabase) throw new Error('Supabase not configured');
};

const EXT = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Upload a registration image (photo / payment screenshot) and return its public URL.
const uploadImage = async (buffer, mimetype, folder) => {
  ensure();
  const ext = EXT[mimetype] || 'jpg';
  const path = `registrations/${folder}/${uuidv4()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType: mimetype, upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

const registrationService = {
  uploadImage,

  // ---- Events ----
  async listEvents() {
    ensure();
    const { data, error } = await supabase.from(EVENTS).select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getEventBySlug(slug) {
    ensure();
    const { data, error } = await supabase.from(EVENTS).select('*').eq('slug', slug).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  async getEventById(id) {
    ensure();
    const { data, error } = await supabase.from(EVENTS).select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  async createEvent(payload) {
    ensure();
    const { data, error } = await supabase.from(EVENTS).insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateEvent(id, payload) {
    ensure();
    const { data, error } = await supabase.from(EVENTS).update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteEvent(id) {
    ensure();
    const { error } = await supabase.from(EVENTS).delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  // ---- Registrations ----
  async createRegistration(row) {
    ensure();
    const { data, error } = await supabase.from(REGS).insert(row).select().single();
    if (error) throw error; // caller inspects error.code for unique violations
    return data;
  },

  async listRegistrations(eventId, status) {
    ensure();
    let q = supabase.from(REGS).select('*').eq('event_id', eventId).order('created_at', { ascending: false });
    if (status) q = q.eq('payment_status', status);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getRegistration(id) {
    ensure();
    const { data, error } = await supabase.from(REGS).select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateRegistration(id, payload) {
    ensure();
    const { data, error } = await supabase.from(REGS).update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async getVerifiedRegistrations(eventId) {
    ensure();
    const { data, error } = await supabase
      .from(REGS)
      .select('*')
      .eq('event_id', eventId)
      .in('payment_status', ['verified', 'not_required'])
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async deleteRegistration(id) {
    ensure();
    const { error } = await supabase.from(REGS).delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  // Organizer accounts (id -> username/name) for display + scoping.
  async listOrganizers() {
    ensure();
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, username, name')
      .eq('role', 'organizer');
    if (error) throw new Error(error.message);
    return data || [];
  },
};

module.exports = registrationService;
