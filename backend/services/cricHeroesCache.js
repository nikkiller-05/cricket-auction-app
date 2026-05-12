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

/**
 * Returns cached stats for a player ID if they exist and are fresh,
 * otherwise null.
 */
async function getCachedStats(playerId) {
  if (!supabase || !playerId) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('stats, fetched_at')
      .eq('player_id', String(playerId))
      .maybeSingle();

    if (error) {
      console.log(`   ⚠️  cache read error for ${playerId}: ${error.message}`);
      return null;
    }
    if (!data) return null;

    const age = Date.now() - new Date(data.fetched_at).getTime();
    if (age > TTL_MS) {
      console.log(`   🕒 cache stale for ${playerId} (${Math.round(age / 86400000)}d)`);
      return null;
    }
    return data.stats;
  } catch (e) {
    console.log(`   ⚠️  cache read exception for ${playerId}: ${e.message}`);
    return null;
  }
}

/**
 * Upsert stats for a player ID. Best-effort - errors are logged but not thrown.
 */
async function setCachedStats(playerId, stats) {
  if (!supabase || !playerId || !stats) return;
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

module.exports = {
  getCachedStats,
  setCachedStats,
  TTL_DAYS,
};
