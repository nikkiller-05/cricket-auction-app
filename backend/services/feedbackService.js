const supabase = require('../config/supabase');

const TABLE = 'homepage_feedback';

module.exports = {
  // Insert one feedback row. Throws if Supabase isn't configured or the
  // insert fails — the controller turns that into a clean error response.
  async submit({ rating, comment, page }) {
    if (!supabase) throw new Error('Feedback storage is not configured');
    const row = {
      rating,
      comment: comment || null,
      page: page || 'homepage',
    };
    const { data, error } = await supabase.from(TABLE).insert(row).select().single();
    if (error) throw error;
    return data;
  },
};
