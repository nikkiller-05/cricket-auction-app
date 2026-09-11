// Load .env before requiring config/supabase.js, which reads process.env at import time -
// needed since this file is also run standalone via `node utils/enrichPlayerStats.js`.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const axios = require('axios');
const cheerio = require('cheerio');
const ExcelJS = require('exceljs');
const path = require('path');
const { getCachedStats, setCachedStats, setCachedFailure } = require('../services/cricHeroesCache');

// CricHeroes rate-limits aggressively (~3 concurrent before HTTP 429).
// Keep concurrency low and add a small inter-batch delay to avoid bans.
const CONCURRENCY_LIMIT = 3;
const DELAY_BETWEEN_BATCHES_MS = 600;
const MAX_RETRIES_ON_429 = 3;
const RETRY_BACKOFF_MS = 1500;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract player ID from CricHeroes link
 */
function extractPlayerIdFromUrl(url) {
  if (!url) return null;
  
  // Match patterns like:
  // https://cricheroes.com/player-profile/2968327/bonugu-saketh
  // https://cricheroes.com/player-profile/2968327
  const match = url.match(/player-profile\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Pull a single number/value out of the player_statement HTML blurb
 * via a list of regex patterns. Returns the first non-empty match.
 */
function extractFromStatement(statement, patterns) {
  if (!statement) return '';
  for (const re of patterns) {
    const m = statement.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return '';
}

/**
 * Fetch and parse CricHeroes stats for a single player.
 *
 * Approach: CricHeroes is a Next.js app that ships its initial data inside a
 * <script id="__NEXT_DATA__"> JSON blob. Parsing that JSON is far more
 * reliable than scraping CSS selectors (which change with every redesign).
 *
 * The JSON exposes:
 *   playerInfo.data.total_matches / total_runs / total_wickets
 *   playerInfo.data.profile_photo            (player photo URL)
 *   playerInfo.data.playing_role / batting_hand / bowling_style
 *   playerInfo.data.player_statement         (HTML blurb with HS, avg, SR, economy, sixes, fours)
 */
/**
 * CricHeroes migrated to Next.js App Router - the old <script id="__NEXT_DATA__">
 * blob is gone. Player data now ships inside React Server Component streaming
 * chunks: <script>self.__next_f.push([1,"...escaped JSON..."])</script>
 * This pulls the `playerInfo.data` object out of that stream via brace-matching
 * (string-aware, so escaped quotes inside values don't break the count).
 *
 * NOTE: This object is only present when the request is authenticated (a valid
 * CricHeroes session cookie) - anonymous requests get a client-render-only shell.
 */
function extractPlayerInfoFromFlight(html) {
  const anchorRe = /\\?"playerInfo\\?":\{\\?"status\\?":true,\\?"data\\?":/;
  const m = html.match(anchorRe);
  if (!m) return null;

  const braceStart = m.index + m[0].length;
  if (html[braceStart] !== '{') return null;

  let depth = 0;
  let inString = false;
  let i = braceStart;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (ch === '\\') { i++; continue; } // skip escaped char (e.g. \" )
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { i++; break; } }
  }

  // The extracted text is double-escaped (it's JSON embedded in a JS string
  // literal), so unescape the outer \" before JSON.parse handles \uXXXX etc.
  const raw = html.slice(braceStart, i).replace(/\\"/g, '"');
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Parse the HTML body of a CricHeroes player-profile page into a stats object.
 * Returns null if the body looks like a Cloudflare challenge / no useful data.
 */
function parseStatsHtml(html, silent = false) {
  if (typeof html !== 'string' || html.length < 100) return null;

  const stats = {
    matches: '',
    runs: '',
    battingAvg: '',
    highestScore: '',
    wickets: '',
    economy: '',
    bestBowling: '',
    imageUrl: '',
    role: '',
    battingHand: '',
    bowlingStyle: '',
    city: '',
    strikeRate: '',
  };

  // 1. Current format: playerInfo.data inside a Next.js RSC flight chunk
  let info = extractPlayerInfoFromFlight(html);

  // 2. Legacy format fallback, in case an older cached page ever comes through
  if (!info) {
    const nextDataMatch = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
    );
    if (nextDataMatch) {
      try {
        const json = JSON.parse(nextDataMatch[1]);
        info = json?.props?.pageProps?.playerInfo?.data || null;
      } catch (e) {
        if (!silent) console.log(`   ⚠️  __NEXT_DATA__ parse failed: ${e.message}`);
      }
    }
  }

  if (info) {
    const num = (v) => (v == null ? '' : String(v));
    stats.matches      = num(info.total_matches);
    stats.runs         = num(info.total_runs);
    stats.wickets      = num(info.total_wickets);
    stats.imageUrl     = info.profile_photo || '';
    stats.role         = info.playing_role || '';
    stats.battingHand  = info.batting_hand || '';
    stats.bowlingStyle = info.bowling_style || '';
    stats.city         = info.city_name || '';

    const stmt = info.player_statement || '';
    stats.highestScore = extractFromStatement(stmt, [
      /top score of\s*<b>([^<]+)<\/b>/i,
      /highest(?:\s+score)?\s*(?:of)?\s*<b>([^<]+)<\/b>/i,
    ]);
    stats.battingAvg = extractFromStatement(stmt, [
      /average of\s*<b>([\d.]+)<\/b>/i,
      /batting average of\s*<b>([\d.]+)<\/b>/i,
    ]);
    stats.strikeRate = extractFromStatement(stmt, [
      /strike rate of\s*<b>([\d.]+)<\/b>/i,
    ]);
    stats.economy = extractFromStatement(stmt, [
      /economy(?:\s+rate)?\s+of\s*<b>([\d.]+)<\/b>/i,
    ]);
    return stats;
  }

  // 2. Legacy cheerio fallback
  const $ = cheerio.load(html);
  let touched = false;
  $('.stat-card, .player-stat, [class*="stat"]').each((i, elem) => {
    const label = $(elem).find('.label, .stat-label, dt').text().toLowerCase();
    const value = $(elem).find('.value, .stat-value, dd').text().trim();
    if (!label || !value) return;
    if (label.includes('match'))                              { stats.matches = value; touched = true; }
    if (label.includes('run') && !label.includes('economy'))  { stats.runs = value; touched = true; }
    if (label.includes('average') || label.includes('avg'))   { stats.battingAvg = value; touched = true; }
    if (label.includes('highest') || label.includes('hs'))    { stats.highestScore = value; touched = true; }
    if (label.includes('wicket'))                             { stats.wickets = value; touched = true; }
    if (label.includes('economy') || label.includes('econ'))  { stats.economy = value; touched = true; }
    if (label.includes('best') && label.includes('bowl'))     { stats.bestBowling = value; touched = true; }
  });
  return touched ? stats : null;
}

/**
 * Direct HTTP fetch to cricheroes.com. Only succeeds from non-datacenter IPs
 * (i.e. run this locally, not on Render) - Cloudflare blocks cloud IPs.
 *
 * Also requires an authenticated session: the actual stats JSON is only
 * server-rendered for logged-in requests. Set CRICHEROES_COOKIE in .env to
 * the full `Cookie` header value copied from a logged-in browser session
 * (DevTools -> Network -> any cricheroes.com request -> Request Headers).
 * That cookie (in particular cf_clearance/__cf_bm) expires periodically and
 * will need re-copying from the browser when fetches start failing again.
 */
async function httpFetchStats(targetUrl) {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://cricheroes.com/',
  };
  if (process.env.CRICHEROES_COOKIE) {
    headers.Cookie = process.env.CRICHEROES_COOKIE;
  }
  return axios.get(targetUrl, {
    headers,
    timeout: 15000,
    validateStatus: (s) => s < 500,
  });
}

async function fetchPlayerStats(cricHeroesLink, silent = false) {
  try {
    const playerId = extractPlayerIdFromUrl(cricHeroesLink);
    if (!playerId) {
      if (!silent) console.log(`⚠️  Invalid CricHeroes link: ${cricHeroesLink}`);
      return null;
    }

    const statsUrl = `https://cricheroes.com/player-profile/${playerId}/stats`;
    if (!silent) console.log(`   Fetching: ${statsUrl}`);

    const resp = await httpFetchStats(statsUrl);
    const len = typeof resp.data === 'string' ? resp.data.length : -1;
    const hasPlayerInfo = typeof resp.data === 'string' && resp.data.includes('"playerInfo"');
    if (!silent) console.log(`   📥 direct HTTP ${resp.status} len=${len} playerInfo=${hasPlayerInfo}`);

    const stats = resp.status < 400 ? parseStatsHtml(resp.data, silent) : null;

    if (stats) {
      if (!silent) console.log(`   ✅ Stats fetched for ${playerId}`);
      return stats;
    }

    if (!silent) console.log(`   ❌ Fetch failed for ${playerId} - check CRICHEROES_COOKIE is set and not expired`);
    return null;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      if (!silent) console.log(`   ⚠️  Profile not found (404)`);
    } else {
      if (!silent) console.log(`   ❌ Error: ${error.message}`);
    }
    return null;
  }
}

/**
 * Fetch stats for multiple players in parallel with concurrency control
 */
async function fetchPlayerStatsBatch(players, concurrencyLimit = CONCURRENCY_LIMIT) {
  const results = [];
  
  // Process in batches
  for (let i = 0; i < players.length; i += concurrencyLimit) {
    const batch = players.slice(i, i + concurrencyLimit);
    console.log(`\n📦 Processing batch ${Math.floor(i / concurrencyLimit) + 1} (players ${i + 1}-${Math.min(i + concurrencyLimit, players.length)})`);
    
    // Fetch all players in this batch in parallel
    const batchPromises = batch.map(async (player) => {
      // Determine cache key:
      //   - real CricHeroes link  -> use the numeric player_id
      //   - no link but manualId  -> use "manual:<manualId>" (cache-only, never fetched)
      //   - neither               -> nothing to do, blank stats
      let cacheKey = null;
      let isManualOnly = false;
      if (player.cricHeroesLink) {
        cacheKey = extractPlayerIdFromUrl(player.cricHeroesLink);
      }
      if (!cacheKey && player.manualId) {
        cacheKey = `manual:${String(player.manualId).trim()}`;
        isManualOnly = true;
      }

      if (!cacheKey) {
        console.log(`   ⚪ ${player.name || 'unknown'}: no CricHeroes link or Manual ID`);
        return { player, stats: null };
      }

      // 1. Cache lookup
      const cached = await getCachedStats(cacheKey);
      if (cached?.stats) {
        const tag = cached.manualOverride ? '🔒 manual' : 'cache HIT';
        console.log(`   💾 ${player.name || 'unknown'}: ${tag} (${cacheKey})`);
        return { player, stats: cached.stats };
      }
      if (cached?.failed) {
        console.log(`   🚫 ${player.name || 'unknown'}: cached FAILURE (${cacheKey}) - skipping`);
        return { player, stats: null };
      }

      // 2. Manual-only players never trigger a network fetch
      if (isManualOnly) {
        console.log(`   📝 ${player.name || 'unknown'}: manual-only (${cacheKey}), no cache row yet - blank stats`);
        return { player, stats: null };
      }

      // 3. Live fetch (CricHeroes-linked players only)
      console.log(`   ➡️  ${player.name || 'unknown'}: ${player.cricHeroesLink}`);
      const stats = await fetchPlayerStats(player.cricHeroesLink, false);
      if (!stats) {
        console.log(`   ❌ ${player.name || 'unknown'}: stats returned null`);
        await setCachedFailure(cacheKey);
      } else {
        await setCachedStats(cacheKey, stats);
      }
      return { player, stats };
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Show batch progress
    const successCount = batchResults.filter(r => r.stats).length;
    console.log(`   ✅ Batch complete: ${successCount}/${batch.length} fetched successfully`);
    
    // Delay between batches to be polite
    if (i + concurrencyLimit < players.length) {
      await delay(DELAY_BETWEEN_BATCHES_MS);
    }
  }
  
  return results;
}

/**
 * Main function to enrich Excel with player stats
 */
async function enrichExcel(inputFilePath) {
  try {
    console.log('\n🏏 Cricket Auction - Player Stats Enricher\n');
    console.log(`📂 Reading: ${inputFilePath}\n`);

    // Read the input workbook (xlsx or csv) with exceljs.
    const isCsv = /\.csv$/i.test(inputFilePath);
    const workbook = new ExcelJS.Workbook();
    let worksheet;
    if (isCsv) {
      worksheet = await workbook.csv.readFile(inputFilePath);
    } else {
      await workbook.xlsx.readFile(inputFilePath);
      worksheet = workbook.worksheets[0];
    }
    const sheetName = worksheet?.name || 'Sheet1';

    // Map the header row, then build one plain object per data row.
    const headers = [];
    worksheet.getRow(1).eachCell((cell, col) => {
      headers[col - 1] = String(cell.value ?? '').trim();
    });
    const data = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const obj = {};
      row.eachCell((cell, col) => {
        const key = headers[col - 1];
        if (!key) return;
        let value = cell.value;
        if (value && typeof value === 'object') {
          value = value.hyperlink || value.text || value.result || '';
        }
        obj[key] = value ?? '';
      });
      data.push(obj);
    });

    if (data.length === 0) {
      console.log('❌ No data found in Excel file');
      return;
    }

    console.log(`📊 Found ${data.length} players`);
    console.log(`⚡ Using parallel fetching (${CONCURRENCY_LIMIT} concurrent requests)\n`);

    const startTime = Date.now();
    
    // Fetch stats for all players in parallel batches
    const playersWithLinks = data.map((row, index) => ({
      index,
      name: row['Name'] || row['Player Name'] || row['PlayerName'] || 'Unknown',
      cricHeroesLink: row['CricHeroes Link'] || row['Profile URL'] || row['Link'] || row['CricHeroes'] || row['Profile'] || '',
      originalRow: row
    }));

    const results = await fetchPlayerStatsBatch(playersWithLinks);
    
    // Update the original data with stats
    results.forEach(({ player, stats }) => {
      const row = player.originalRow;
      
      if (stats) {
        row['Matches'] = stats.matches;
        row['Runs'] = stats.runs;
        row['Batting Avg'] = stats.battingAvg;
        row['Highest Score'] = stats.highestScore;
        row['Wickets'] = stats.wickets;
        row['Economy'] = stats.economy;
        row['Best Bowling'] = stats.bestBowling;
      } else {
        // Set empty values if fetch failed
        row['Matches'] = '';
        row['Runs'] = '';
        row['Batting Avg'] = '';
        row['Highest Score'] = '';
        row['Wickets'] = '';
        row['Economy'] = '';
        row['Best Bowling'] = '';
      }
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    // Save enriched workbook back out, matching the input format.
    const outputFilePath = inputFilePath.replace(/(\.[^.]+)$/, '_enriched$1');
    const outWorkbook = new ExcelJS.Workbook();
    const outWorksheet = outWorkbook.addWorksheet(sheetName);
    const outHeaders = Object.keys(data[0] || {});
    outWorksheet.columns = outHeaders.map((header) => ({ header, key: header }));
    data.forEach((row) => outWorksheet.addRow(row));
    if (isCsv) {
      await outWorkbook.csv.writeFile(outputFilePath);
    } else {
      await outWorkbook.xlsx.writeFile(outputFilePath);
    }

    const successCount = results.filter(r => r.stats).length;
    
    console.log('\n✅ Stats enrichment complete!');
    console.log(`⏱️  Total time: ${duration}s (avg ${(duration / data.length).toFixed(2)}s per player)`);
    console.log(`📊 Success rate: ${successCount}/${data.length} players`);
    console.log(`📁 Saved to: ${outputFilePath}\n`);
    console.log('📋 New columns added:');
    console.log('   - Matches');
    console.log('   - Runs');
    console.log('   - Batting Avg');
    console.log('   - Highest Score');
    console.log('   - Wickets');
    console.log('   - Economy');
    console.log('   - Best Bowling\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n🏏 Usage: node enrichPlayerStats.js <path-to-excel-file>\n');
    console.log('Example:');
    console.log('  node enrichPlayerStats.js players.xlsx');
    console.log('  node enrichPlayerStats.js ../test_players.csv\n');
    console.log('⚡ Features:');
    console.log('  - Parallel fetching (10 concurrent requests)');
    console.log('  - ~30-35 seconds for 100 players');
    console.log('  - Polite delays between batches\n');
    process.exit(1);
  }

  const inputFile = path.resolve(args[0]);
  enrichExcel(inputFile);
}

module.exports = { enrichExcel, fetchPlayerStats, fetchPlayerStatsBatch };
