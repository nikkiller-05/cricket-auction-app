/**
 * Auction state snapshot store backed by Supabase.
 *
 * The live auction runs entirely in memory (see dataService.js) for speed.
 * This module keeps a single-row JSON "photo" of that state in Supabase so a
 * server restart/crash/redeploy can restore the auction instead of losing it.
 *
 * Schema (run once in Supabase SQL Editor):
 *   CREATE TABLE IF NOT EXISTS auction_state (
 *     id         text PRIMARY KEY,
 *     state      jsonb NOT NULL,
 *     updated_at timestamptz NOT NULL DEFAULT now()
 *   );
 *
 * Best-effort: if Supabase is unavailable or misconfigured, every function
 * silently no-ops so the in-memory auction keeps working normally.
 */

const supabase = require('../config/supabase');

const TABLE = 'auction_state';
const ROW_ID = 'default';

/**
 * Upsert the full serialized auction state into the single snapshot row.
 */
async function saveState(state) {
  if (!supabase || !state) return;
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert(
        {
          id: ROW_ID,
          state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    if (error) {
      console.log(`   ⚠️  snapshot save error: ${error.message}`);
    }
  } catch (e) {
    console.log(`   ⚠️  snapshot save exception: ${e.message}`);
  }
}

/**
 * Load the last saved snapshot. Returns the stored state object, or null if
 * there is no snapshot yet / Supabase is unavailable.
 */
async function loadState() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('state')
      .eq('id', ROW_ID)
      .maybeSingle();
    if (error) {
      console.log(`   ⚠️  snapshot load error: ${error.message}`);
      return null;
    }
    return data?.state || null;
  } catch (e) {
    console.log(`   ⚠️  snapshot load exception: ${e.message}`);
    return null;
  }
}

module.exports = { saveState, loadState };
