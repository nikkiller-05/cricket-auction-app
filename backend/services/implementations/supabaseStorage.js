const supabase = require('../../config/supabase');

/**
 * Supabase Storage Implementation
 * Stores player images in a public Supabase Storage bucket and returns
 * public, CDN-served URLs. Bucket must exist and allow public read.
 * (See SUPABASE_SETUP.md — bucket name "player-images".)
 */
class SupabaseStorage {
  constructor() {
    this.bucket = process.env.SUPABASE_IMAGE_BUCKET || 'player-images';
    if (!supabase) {
      console.warn('⚠️  Supabase client not initialized - image uploads will fail. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }
  }

  async uploadPlayerImage(fileBuffer, playerId, mimetype) {
    if (!supabase) throw new Error('Supabase storage not available');

    const extMap = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const ext = extMap[mimetype] || 'jpg';
    const path = `${playerId}.${ext}`;

    const { error } = await supabase.storage
      .from(this.bucket)
      .upload(path, fileBuffer, { contentType: mimetype, upsert: true });
    if (error) throw new Error(`Failed to upload image: ${error.message}`);

    const { data } = supabase.storage.from(this.bucket).getPublicUrl(path);
    // Cache-bust so a re-uploaded image (same path) refreshes immediately.
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  async deletePlayerImage(playerId) {
    if (!supabase) return false;
    const paths = ['jpg', 'png', 'webp'].map((e) => `${playerId}.${e}`);
    const { error } = await supabase.storage.from(this.bucket).remove(paths);
    return !error;
  }

  async getPlayerImageUrl(playerId) {
    if (!supabase) return null;
    const { data } = supabase.storage.from(this.bucket).getPublicUrl(`${playerId}.jpg`);
    return data?.publicUrl || null;
  }

  async isAvailable() {
    return !!supabase;
  }
}

module.exports = SupabaseStorage;
