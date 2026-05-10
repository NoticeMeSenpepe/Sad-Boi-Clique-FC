// ============================================================
// SBCFC scraper — entry point.
//
// Strategy:
//   1. Launch a headless Chromium via Playwright.
//   2. Navigate to the public EA Sports FC Pro Clubs page for our
//      club. EA's anti-bot WAF sees this as a normal browser
//      session, so the page is allowed to load and to fire its
//      own internal API calls.
//   3. Inside the same browser context (so cookies and session
//      tokens are correct), call EA's internal endpoints with
//      `fetch()` and read the JSON they return.
//   4. Write the parsed data to Supabase.
//   5. Append an audit row to `scrape_log` either way.
//
// The scraper is deliberately defensive: any individual endpoint
// failing should NOT take the whole run down — we still want to
// ingest whatever we got.
// ============================================================

import { chromium, type BrowserContext, type Page } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL          = mustEnv('SUPABASE_URL');
const SUPABASE_SERVICE_KEY  = mustEnv('SUPABASE_SERVICE_ROLE_KEY');
const CLUB_ID               = process.env.SBC_CLUB_ID  || '477926';
const PLATFORM              = process.env.SBC_PLATFORM || 'common-gen5';

const PUBLIC_PAGE_URL =
  `https://www.ea.com/games/ea-sports-fc/clubs/overview?clubId=${CLUB_ID}&platform=${PLATFORM}`;

// EA's internal API host; reachable from inside an EA-loaded page,
// blocked from anywhere else.
const API_HOST = 'https://proclubs.ea.com/api/fc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

type Json = Record<string, unknown> | unknown[] | null;

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

/** Run a fetch from inside the page's browser context so EA's WAF
 *  treats it as a real ea.com → proclubs.ea.com call. */
async function fetchFromPage<T extends Json>(page: Page, url: string): Promise<T | null> {
  try {
    const result = await page.evaluate(async (target: string) => {
      const r = await fetch(target, {
        headers: { Accept: 'application/json, text/plain, */*' },
        credentials: 'include',
      });
      if (!r.ok) return { __sbcfcError: true, status: r.status };
      const text = await r.text();
      try { return JSON.parse(text); } catch { return { __sbcfcError: true, parseError: text.slice(0, 200) }; }
    }, url);

    if (result && typeof result === 'object' && (result as any).__sbcfcError) {
      console.warn(`[scrape] ${url} → error`, result);
      return null;
    }
    return result as T;
  } catch (err) {
    console.warn(`[scrape] fetch failed for ${url}:`, err);
    return null;
  }
}

async function ingestClubState(page: Page): Promise<{ ok: boolean; rowsWritten: number }> {
  const [info, overall] = await Promise.all([
    fetchFromPage<Json>(page, `${API_HOST}/clubs/info?clubIds=${CLUB_ID}&platform=${PLATFORM}`),
    fetchFromPage<Json>(page, `${API_HOST}/clubs/overallStats?clubIds=${CLUB_ID}&platform=${PLATFORM}`),
  ]);

  if (!info && !overall) return { ok: false, rowsWritten: 0 };

  const data = {
    clubInfo:     info     ?? null,
    overallStats: overall  ?? null,
  };

  const { error } = await supabase
    .from('club_state')
    .upsert({
      club_id: CLUB_ID,
      platform: PLATFORM,
      data,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'club_id,platform' });

  if (error) {
    console.error('[scrape] club_state upsert error:', error);
    return { ok: false, rowsWritten: 0 };
  }
  return { ok: true, rowsWritten: 1 };
}

async function ingestMembers(page: Page): Promise<{ ok: boolean; rowsWritten: number }> {
  const [stats, career] = await Promise.all([
    fetchFromPage<Json>(page, `${API_HOST}/members/stats?clubId=${CLUB_ID}&platform=${PLATFORM}`),
    fetchFromPage<Json>(page, `${API_HOST}/members/career/stats?clubId=${CLUB_ID}&platform=${PLATFORM}`),
  ]);

  // EA returns shapes like { members: [...] } — but be tolerant of variations.
  const list = extractArray(stats, 'members') ?? extractArray(stats, 'data') ?? [];
  const careerList = extractArray(career, 'members') ?? extractArray(career, 'data') ?? [];
  if (list.length === 0 && careerList.length === 0) return { ok: false, rowsWritten: 0 };

  // Index career stats by name so we can merge them per member.
  const careerByName = new Map<string, Record<string, unknown>>();
  for (const c of careerList) {
    const n = pickStr(c, ['name', 'memberName']);
    if (n) careerByName.set(n.toLowerCase(), c);
  }

  const rows = [];
  for (const m of list) {
    const name = pickStr(m, ['name', 'memberName']);
    if (!name) continue;
    rows.push({
      club_id: CLUB_ID,
      platform: PLATFORM,
      name,
      data: { stats: m, career: careerByName.get(name.toLowerCase()) ?? null },
      fetched_at: new Date().toISOString(),
    });
  }
  if (rows.length === 0) return { ok: false, rowsWritten: 0 };

  const { error } = await supabase.from('member_state').upsert(rows, { onConflict: 'club_id,platform,name' });
  if (error) {
    console.error('[scrape] member_state upsert error:', error);
    return { ok: false, rowsWritten: 0 };
  }
  return { ok: true, rowsWritten: rows.length };
}

async function ingestMatches(page: Page): Promise<{ ok: boolean; rowsWritten: number }> {
  // EA exposes both league matches and friendly/playoff types. We grab both.
  const [leagueMatches, playoffMatches] = await Promise.all([
    fetchFromPage<Json>(page, `${API_HOST}/clubs/matches?clubIds=${CLUB_ID}&platform=${PLATFORM}&matchType=leagueMatch`),
    fetchFromPage<Json>(page, `${API_HOST}/clubs/matches?clubIds=${CLUB_ID}&platform=${PLATFORM}&matchType=playoffMatch`),
  ]);

  const all = [
    ...(extractArray(leagueMatches,  null) ?? []).map(x => ({ row: x, type: 'leagueMatch' })),
    ...(extractArray(playoffMatches, null) ?? []).map(x => ({ row: x, type: 'playoffMatch' })),
  ];
  if (all.length === 0) return { ok: false, rowsWritten: 0 };

  const rows = [];
  for (const { row, type } of all) {
    const id = pickStr(row, ['matchId', 'id']);
    if (!id) continue;
    const tsRaw = pickStr(row, ['timestamp', 'matchTimestamp', 'date']);
    const playedAt = parseTimestamp(tsRaw);
    rows.push({
      match_id: id,
      club_id: CLUB_ID,
      platform: PLATFORM,
      played_at: playedAt,
      match_type: type,
      data: row,
      fetched_at: new Date().toISOString(),
    });
  }
  if (rows.length === 0) return { ok: false, rowsWritten: 0 };

  const { error } = await supabase.from('match_state').upsert(rows, { onConflict: 'match_id' });
  if (error) {
    console.error('[scrape] match_state upsert error:', error);
    return { ok: false, rowsWritten: 0 };
  }
  return { ok: true, rowsWritten: rows.length };
}

// ── Tiny helpers ─────────────────────────────────────────────────────
function pickStr(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of keys) {
    const v = (obj as Record<string, unknown>)[k];
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
  }
  return null;
}

function extractArray(maybe: unknown, key: string | null): Record<string, unknown>[] | null {
  if (Array.isArray(maybe)) return maybe as Record<string, unknown>[];
  if (maybe && typeof maybe === 'object' && key && Array.isArray((maybe as Record<string, unknown>)[key])) {
    return (maybe as Record<string, unknown>)[key] as Record<string, unknown>[];
  }
  return null;
}

function parseTimestamp(raw: string | null): string | null {
  if (!raw) return null;
  // EA timestamps appear as Unix seconds in some endpoints. Fall back to ISO parsing.
  const asNum = Number(raw);
  if (Number.isFinite(asNum) && asNum > 1e9 && asNum < 1e11) {
    return new Date(asNum * 1000).toISOString();
  }
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  const startedAt = Date.now();
  let context: BrowserContext | null = null;
  const summary: Record<string, unknown> = {};
  let runOk = true;

  try {
    // EA's CDN (Akamai) TLS-fingerprints clients and rejects Playwright's
    // bundled Chromium with ERR_HTTP2_PROTOCOL_ERROR. Using `channel: 'chrome'`
    // launches the real Google Chrome that's pre-installed on the runner —
    // its TLS fingerprint matches a normal user's browser and the request
    // sails through.
    const browser = await chromium.launch({
      channel: 'chrome',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });
    context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      locale: 'en-US',
      viewport: { width: 1280, height: 800 },
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    // Strip the navigator.webdriver flag that Playwright sets by default —
    // some bot detectors check it.
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    const page = await context.newPage();

    console.log(`[scrape] Loading ${PUBLIC_PAGE_URL}`);
    await page.goto(PUBLIC_PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    // Give EA's client-side JS time to bootstrap (so cookies and any anti-bot
    // tokens land before we make our internal API calls).
    await page.waitForTimeout(6_000);

    const club    = await ingestClubState(page);
    summary.club  = club;
    const members = await ingestMembers(page);
    summary.members = members;
    const matches = await ingestMatches(page);
    summary.matches = matches;

    runOk = club.ok || members.ok || matches.ok;
    if (!runOk) console.warn('[scrape] all three ingests returned no data');

    await context.close();
    await browser.close();
  } catch (err) {
    runOk = false;
    summary.error = String(err);
    console.error('[scrape] fatal error:', err);
    if (context) try { await context.close(); } catch { /* ignore */ }
  }

  const durationMs = Date.now() - startedAt;
  await supabase.from('scrape_log').insert({
    ok: runOk,
    error: runOk ? null : (summary.error as string | undefined) ?? 'partial-or-empty',
    duration_ms: durationMs,
    notes: summary,
  });
  console.log(`[scrape] Done in ${durationMs}ms — ok=${runOk}`, summary);

  process.exit(runOk ? 0 : 1);
}

main();
