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

/**
 * Upsert one auction's serialized state into its own row (id = auctionId).
 */
async function saveState(id, state) {
  if (!supabase || !id || !state) return;
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert(
        {
          id,
          state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    if (error) {
      console.log(`   ⚠️  snapshot save error (${id}): ${error.message}`);
    }
  } catch (e) {
    console.log(`   ⚠️  snapshot save exception (${id}): ${e.message}`);
  }
}

/**
 * Load one auction's snapshot by id. Returns the stored state object, or null.
 */
async function loadState(id) {
  if (!supabase || !id) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('state')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.log(`   ⚠️  snapshot load error (${id}): ${error.message}`);
      return null;
    }
    return data?.state || null;
  } catch (e) {
    console.log(`   ⚠️  snapshot load exception (${id}): ${e.message}`);
    return null;
  }
}

/**
 * Load every saved auction snapshot for restore-on-boot.
 * Returns an array of { id, state }, or [] when unavailable/empty.
 */
async function loadAllStates() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from(TABLE).select('id, state');
    if (error) {
      console.log(`   ⚠️  snapshot load-all error: ${error.message}`);
      return [];
    }
    return (data || []).filter((r) => r && r.id && r.state);
  } catch (e) {
    console.log(`   ⚠️  snapshot load-all exception: ${e.message}`);
    return [];
  }
}

module.exports = { saveState, loadState, loadAllStates };
