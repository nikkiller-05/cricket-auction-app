/**
 * CricHeroes stats cache backed by Supabase.
 *
 * Schema (run once in Supabase SQL Editor):
 *   CREATE TABLE IF NOT EXISTS cricheroes_stats (
 *     player_id    text PRIMARY KEY,
 *     stats        jsonb NOT NULL,
 *     fetched_at   timestamptz NOT NULL DEFAULT now()
 *   );
 *
 * Cache is best-effort: if Supabase is unavailable or misconfigured,
 * all functions silently return null / no-op so the caller falls through
 * to a live fetch.
 */

const supabase = require('../config/supabase');

const TABLE = 'cricheroes_stats';
const TTL_DAYS = 30;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;
// Negative cache (failed fetches) - shorter TTL so transient failures get retried
const NEGATIVE_TTL_DAYS = 1;
const NEGATIVE_TTL_MS = NEGATIVE_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Returns cached entry for a player ID:
 *   { stats: {...}, manualOverride: bool }  - stats present
 *   { failed: true, manualOverride: bool }  - known recent failure, skip API call
 *   null                                    - no usable cache entry, caller should fetch
 *
 * If manual_override=true on the row, age/TTL is IGNORED — the manual entry
 * is treated as fresh forever. This lets you pin a manually-curated row.
 */
async function getCachedStats(playerId) {
  if (!supabase || !playerId) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('stats, fetched_at, manual_override')
      .eq('player_id', String(playerId))
      .maybeSingle();

    if (error) {
      console.log(`   ⚠️  cache read error for ${playerId}: ${error.message}`);
      return null;
    }
    if (!data) return null;

    const manualOverride = data.manual_override === true;
    const isFailureMarker = data.stats && data.stats.__failed === true;

    if (!manualOverride) {
      const age = Date.now() - new Date(data.fetched_at).getTime();
      const ttl = isFailureMarker ? NEGATIVE_TTL_MS : TTL_MS;
      if (age > ttl) {
        console.log(`   🕒 cache stale for ${playerId} (${Math.round(age / 86400000)}d, ${isFailureMarker ? 'fail' : 'ok'})`);
        return null;
      }
    }

    if (isFailureMarker) return { failed: true, manualOverride };
    return { stats: data.stats, manualOverride };
  } catch (e) {
    console.log(`   ⚠️  cache read exception for ${playerId}: ${e.message}`);
    return null;
  }
}

/**
 * Internal: check whether a row is locked by manual_override.
 */
async function isManualOverride(playerId) {
  if (!supabase || !playerId) return false;
  try {
    const { data } = await supabase
      .from(TABLE)
      .select('manual_override')
      .eq('player_id', String(playerId))
      .maybeSingle();
    return data?.manual_override === true;
  } catch {
    return false;
  }
}

/**
 * Upsert successful stats for a player ID.
 * Skips the upsert if the existing row has manual_override=true.
 */
async function setCachedStats(playerId, stats) {
  if (!supabase || !playerId || !stats) return;
  if (await isManualOverride(playerId)) {
    console.log(`   🔒 ${playerId}: manual_override=true, NOT overwriting`);
    return;
  }
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert(
        {
          player_id: String(playerId),
          stats,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: 'player_id' }
      );
    if (error) {
      console.log(`   ⚠️  cache write error for ${playerId}: ${error.message}`);
    }
  } catch (e) {
    console.log(`   ⚠️  cache write exception for ${playerId}: ${e.message}`);
  }
}

/**
 * Mark a player as failed (negative cache). Skipped if manual_override=true.
 */
async function setCachedFailure(playerId) {
  if (!supabase || !playerId) return;
  if (await isManualOverride(playerId)) {
    console.log(`   🔒 ${playerId}: manual_override=true, NOT writing failure marker`);
    return;
  }
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert(
        {
          player_id: String(playerId),
          stats: { __failed: true },
          fetched_at: new Date().toISOString(),
        },
        { onConflict: 'player_id' }
      );
    if (error) {
      console.log(`   ⚠️  cache (negative) write error for ${playerId}: ${error.message}`);
    }
  } catch (e) {
    console.log(`   ⚠️  cache (negative) write exception for ${playerId}: ${e.message}`);
  }
}

module.exports = {
  getCachedStats,
  setCachedStats,
  setCachedFailure,
  TTL_DAYS,
  NEGATIVE_TTL_DAYS,
};
