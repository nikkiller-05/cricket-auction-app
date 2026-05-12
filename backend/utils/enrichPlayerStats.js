const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');
const path = require('path');

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
async function fetchPlayerStats(cricHeroesLink, silent = false) {
  try {
    const playerId = extractPlayerIdFromUrl(cricHeroesLink);
    if (!playerId) {
      if (!silent) console.log(`⚠️  Invalid CricHeroes link: ${cricHeroesLink}`);
      return null;
    }

    const statsUrl = `https://cricheroes.com/player-profile/${playerId}/stats`;
    if (!silent) console.log(`   Fetching: ${statsUrl}`);

    // Retry on transient 429 (CricHeroes rate-limits aggressively)
    let response;
    let attempt = 0;
    while (true) {
      attempt++;
      try {
        response = await axios.get(statsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://cricheroes.com/'
          },
          timeout: 15000,
          validateStatus: (s) => s < 500, // let us see 429 instead of throwing
        });
        if (response.status !== 429) break;
        if (attempt > MAX_RETRIES_ON_429) break;
        const wait = RETRY_BACKOFF_MS * attempt;
        if (!silent) console.log(`   ⏳ 429 from CricHeroes, retry ${attempt}/${MAX_RETRIES_ON_429} in ${wait}ms`);
        await delay(wait);
      } catch (e) {
        if (attempt > MAX_RETRIES_ON_429) throw e;
        await delay(RETRY_BACKOFF_MS * attempt);
      }
    }

    if (response.status >= 400) {
      if (!silent) console.log(`   ❌ HTTP ${response.status} after ${attempt} attempt(s)`);
      return null;
    }

    // Initialize stats object (kept keys identical to the previous scraper
    // so playerController doesn't need to change)
    const stats = {
      matches: '',
      runs: '',
      battingAvg: '',
      highestScore: '',
      wickets: '',
      economy: '',
      bestBowling: '',
      // New fields (optional consumers — safe to ignore)
      imageUrl: '',
      role: '',
      battingHand: '',
      bowlingStyle: '',
      city: '',
      strikeRate: '',
    };

    // 1. Try the structured JSON path first
    let info = null;
    const nextDataMatch = response.data.match(
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

      // Derived stats live inside the player_statement HTML blurb.
      // It looks like: "...top score of <b>168*</b>, with an average of <b>27.35</b>
      // and a quick strike rate of <b>160.44</b>... economy rate of <b>8.54</b>..."
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
    } else {
      // 2. Fallback: legacy cheerio scrape (kept as defence in case the
      //    Next.js payload ever disappears)
      const $ = cheerio.load(response.data);
      $('.stat-card, .player-stat, [class*="stat"]').each((i, elem) => {
        const label = $(elem).find('.label, .stat-label, dt').text().toLowerCase();
        const value = $(elem).find('.value, .stat-value, dd').text().trim();
        if (label.includes('match')) stats.matches = value || stats.matches;
        if (label.includes('run') && !label.includes('economy')) stats.runs = value || stats.runs;
        if (label.includes('average') || label.includes('avg')) stats.battingAvg = value || stats.battingAvg;
        if (label.includes('highest') || label.includes('hs')) stats.highestScore = value || stats.highestScore;
        if (label.includes('wicket')) stats.wickets = value || stats.wickets;
        if (label.includes('economy') || label.includes('econ')) stats.economy = value || stats.economy;
        if (label.includes('best') && label.includes('bowl')) stats.bestBowling = value || stats.bestBowling;
      });
    }

    if (!silent) console.log(`   ✅ Stats fetched:`, stats);
    return stats;

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
      if (!player.cricHeroesLink) {
        return { player, stats: null };
      }
      
      const stats = await fetchPlayerStats(player.cricHeroesLink, true);
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

    // Read Excel file
    const workbook = XLSX.readFile(inputFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

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

    // Save enriched Excel
    const outputFilePath = inputFilePath.replace(/(\.[^.]+)$/, '_enriched$1');
    const newWorksheet = XLSX.utils.json_to_sheet(data);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);
    XLSX.writeFile(newWorkbook, outputFilePath);

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
