// ============================================================
// Live-data access layer.
// The website renders from this module instead of from raw mock
// data. Each accessor:
//   1. Tries to read from Supabase (live state populated by the
//      scraper).
//   2. Falls back to the prototype's hard-coded mock data when
//      Supabase is empty, the env vars are missing, or anything
//      goes wrong.
// EA's exact JSON shape is partly unknown until the first scrape
// run lands real data, so the parsers below are deliberately
// forgiving — they look for likely field names and drop back to
// the mock value if a field is missing.
// ============================================================

import { getSupabase, SBC_CLUB_ID, SBC_PLATFORM } from './supabase';

// ── Shapes the website expects ───────────────────────────────────────
export interface PulseStats {
  position: number;          // currently the club's best division — see notes in getPulseStats
  winRate: number;           // 0-100, career
  goalDifference: number;    // career
  totalPoints: number;       // career (3*wins + draws)
  skillRating: number | null;// career skill rating, used as a richer fallback
  gamesPlayed: number;       // career
  source: 'live' | 'mock';
  fetchedAt: string | null;  // ISO
}

export interface ClubInfo {
  id: string;
  name: string;
  crestId: number | null;
  source: 'live' | 'mock';
  fetchedAt: string | null;
}

export interface LiveMember {
  name: string;
  goals: number;
  assists: number;
  apps: number;
  cleanSheets: number | null;
  proPos: string | null;
  matchRating: number | null;
  raw: Record<string, unknown>;
}

export interface LiveMatch {
  matchId: string;
  playedAt: string | null;
  opponent: string | null;
  ourScore: number | null;
  theirScore: number | null;
  matchType: string | null;
  raw: Record<string, unknown>;
}

// ── Mock fallback (used until Supabase has real data) ────────────────
const MOCK_PULSE: PulseStats = {
  position: 2,
  winRate: 64,
  goalDifference: 28,
  totalPoints: 59,
  skillRating: null,
  gamesPlayed: 0,
  source: 'mock',
  fetchedAt: null,
};

const MOCK_CLUB: ClubInfo = {
  id: SBC_CLUB_ID,
  name: 'Sad Boi Clique FC',
  crestId: null,
  source: 'mock',
  fetchedAt: null,
};

// ── Helpers ──────────────────────────────────────────────────────────
function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function str(v: unknown): string | null {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return null;
}

/** Pull the first of several candidate fields out of a JSON blob. */
function pick<T>(obj: Record<string, unknown> | null | undefined, keys: string[], coerce: (v: unknown) => T | null): T | null {
  if (!obj) return null;
  for (const k of keys) {
    const v = coerce(obj[k]);
    if (v !== null) return v;
  }
  return null;
}

/**
 * EA wraps several response payloads in containers we don't care about:
 *   - overallStats: returned as an array `[{ ... }]`.
 *   - clubInfo:     returned as an object keyed by clubId, `{ "477926": {...} }`.
 * This unwraps both shapes back to the inner record.
 */
function unwrapEaContainer(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object') return null;
  if (Array.isArray(v)) {
    const first = v[0];
    return (first && typeof first === 'object') ? (first as Record<string, unknown>) : null;
  }
  const obj = v as Record<string, unknown>;
  const keys = Object.keys(obj);
  // Single numeric key → return its value (the clubId-keyed shape).
  if (keys.length === 1 && /^\d+$/.test(keys[0]!) && obj[keys[0]!] && typeof obj[keys[0]!] === 'object') {
    return obj[keys[0]!] as Record<string, unknown>;
  }
  return obj;
}

// ── Accessors ────────────────────────────────────────────────────────

/**
 * Returns the four numbers shown in the homepage Pulse footer + hero stat row.
 * Shape of the EA payload is unknown until first real scrape; we look for the
 * likely field names and otherwise fall back to mock values.
 */
export async function getPulseStats(): Promise<PulseStats> {
  const sb = getSupabase();
  if (!sb) return MOCK_PULSE;

  const { data, error } = await sb
    .from('club_state')
    .select('data, fetched_at')
    .eq('club_id', SBC_CLUB_ID)
    .eq('platform', SBC_PLATFORM)
    .maybeSingle();

  if (error || !data) return MOCK_PULSE;
  const blob = (data.data || {}) as Record<string, unknown>;
  const stats = unwrapEaContainer(blob['overallStats']) ?? unwrapEaContainer(blob['stats']) ?? blob;

  const wins   = pick(stats, ['wins', 'totalWins', 'winsTotal'], num) ?? 0;
  const losses = pick(stats, ['losses', 'totalLosses'], num) ?? 0;
  const draws  = pick(stats, ['ties', 'draws', 'totalDraws'], num) ?? 0;
  const games  = pick(stats, ['gamesPlayed'], num) ?? (wins + losses + draws);
  const winRatePct = games > 0 ? Math.round((wins / games) * 100) : 0;

  const gd =
    pick(stats, ['goalDifference', 'gd'], num) ??
    ((pick(stats, ['goalsFor', 'goals'], num) ?? 0) - (pick(stats, ['goalsAgainst', 'goalsConceded'], num) ?? 0));

  const points = pick(stats, ['points', 'totalPoints', 'pts'], num) ?? (wins * 3 + draws);
  // EA's overallStats endpoint returns CAREER stats, not a current league
  // standing. There is no "league position" field. Surface `bestDivision`
  // as an alternative position-like signal so the front-end can render
  // something meaningful (e.g. "DIV 3"). Fronts that absolutely need a
  // numeric ranking can fall back to mock.
  const bestDivision = pick(stats, ['bestDivision', 'currentDivision'], num);
  const position = bestDivision ?? pick(stats, ['position', 'leaguePosition', 'currentPosition'], num) ?? MOCK_PULSE.position;
  const skillRating = pick(stats, ['skillRating'], num);

  return {
    position,
    winRate: winRatePct,
    goalDifference: gd,
    totalPoints: points,
    skillRating,
    gamesPlayed: games,
    source: 'live',
    fetchedAt: data.fetched_at as string,
  };
}

/** High-level club info (name, crest) for header / titles. */
export async function getClubInfo(): Promise<ClubInfo> {
  const sb = getSupabase();
  if (!sb) return MOCK_CLUB;

  const { data, error } = await sb
    .from('club_state')
    .select('data, fetched_at')
    .eq('club_id', SBC_CLUB_ID)
    .eq('platform', SBC_PLATFORM)
    .maybeSingle();

  if (error || !data) return MOCK_CLUB;
  const blob = (data.data || {}) as Record<string, unknown>;
  const info = unwrapEaContainer(blob['clubInfo']) ?? unwrapEaContainer(blob['info']) ?? blob;

  // crest is nested under `customKit.crestAssetId` on EA's response; surface
  // the most likely places we'd find it in.
  const crestNested = info?.['customKit'] && typeof info['customKit'] === 'object'
    ? (info['customKit'] as Record<string, unknown>)
    : null;

  return {
    id: SBC_CLUB_ID,
    name: pick(info, ['name', 'clubName'], str) ?? MOCK_CLUB.name,
    crestId: pick(info, ['crestId', 'clubCrestId'], num)
      ?? (crestNested ? pick(crestNested, ['crestAssetId'], num) : null),
    source: 'live',
    fetchedAt: data.fetched_at as string,
  };
}

/**
 * Returns a Map of EA Gamertag (lowercased) → live stats for the human players.
 * AI / fictional characters have no `eaUser` and aren't in this map; the Squad
 * page falls back to mock data for them.
 */
export interface LiveMemberStats {
  gamertag: string;
  goals: number;
  assists: number;
  gamesPlayed: number;
  manOfTheMatch: number;
  ratingAverage: number | null;
  proOverall: number | null;
  proName: string | null;
  favoritePosition: string | null;
  fetchedAt: string;
}

export async function getLiveMembersByEaUser(): Promise<Map<string, LiveMemberStats>> {
  const sb = getSupabase();
  const out = new Map<string, LiveMemberStats>();
  if (!sb) return out;
  const { data, error } = await sb
    .from('member_state')
    .select('name, data, fetched_at')
    .eq('club_id', SBC_CLUB_ID)
    .eq('platform', SBC_PLATFORM);
  if (error || !data) return out;
  for (const row of data) {
    const blob = (row.data || {}) as Record<string, unknown>;
    const stats = (blob.stats || {}) as Record<string, unknown>;
    out.set((row.name as string).toLowerCase(), {
      gamertag: row.name as string,
      goals:         pick(stats, ['goals'], num)         ?? 0,
      assists:       pick(stats, ['assists'], num)       ?? 0,
      gamesPlayed:   pick(stats, ['gamesPlayed'], num)   ?? 0,
      manOfTheMatch: pick(stats, ['manOfTheMatch'], num) ?? 0,
      ratingAverage: pick(stats, ['ratingAve'], num),
      proOverall:    pick(stats, ['proOverall'], num),
      proName:       pick(stats, ['proName'], str),
      favoritePosition: pick(stats, ['favoritePosition'], str),
      fetchedAt: row.fetched_at as string,
    });
  }
  return out;
}

/** Returns all members for the squad page. Empty array if no live data yet. */
export async function getLiveMembers(): Promise<LiveMember[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('member_state')
    .select('name, data, fetched_at')
    .eq('club_id', SBC_CLUB_ID)
    .eq('platform', SBC_PLATFORM)
    .order('name');

  if (error || !data) return [];

  return data.map((row) => {
    const blob = (row.data || {}) as Record<string, unknown>;
    return {
      name: row.name as string,
      goals:        pick(blob, ['goals'], num)        ?? 0,
      assists:      pick(blob, ['assists'], num)      ?? 0,
      apps:         pick(blob, ['gamesPlayed', 'appearances', 'apps'], num) ?? 0,
      cleanSheets:  pick(blob, ['cleanSheetsAny', 'cleanSheets'], num),
      proPos:       pick(blob, ['favoritePosition', 'proPos'], str),
      matchRating:  pick(blob, ['ratingAve', 'rating'], num),
      raw: blob,
    };
  });
}

/** Recent matches for the fixtures page. Newest first. */
export async function getLiveMatches(limit = 30): Promise<LiveMatch[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('match_state')
    .select('match_id, played_at, match_type, data, fetched_at')
    .eq('club_id', SBC_CLUB_ID)
    .eq('platform', SBC_PLATFORM)
    .order('played_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => {
    const blob = (row.data || {}) as Record<string, unknown>;
    const us   = pick(blob, ['ourScore'], num);
    const them = pick(blob, ['theirScore'], num);
    const opp  = pick(blob, ['opponentName', 'opponent'], str);
    return {
      matchId:    row.match_id as string,
      playedAt:   (row.played_at as string | null) ?? null,
      opponent:   opp,
      ourScore:   us,
      theirScore: them,
      matchType:  (row.match_type as string | null) ?? null,
      raw: blob,
    };
  });
}

// ── Fixtures (rich match summaries for the Fixtures page) ────────────

export type FixtureResult = 'W' | 'L' | 'D';

export interface PlayerMatchStats {
  name: string;
  position: string | null;
  goals: number;
  assists: number;
  rating: number | null;
  shots: number;
  passesMade: number;
  passAttempts: number;
  tacklesMade: number;
  redCards: number;
  saves: number;
  isMotm: boolean;
}

export interface ClubMatchSide {
  clubId: string;
  name: string;
  crestId: string | null;
  score: number;
  aggregate: Record<string, unknown> | null;
  players: PlayerMatchStats[];
}

export interface FixtureRow {
  matchId: string;
  playedAt: string | null;
  dateLabel: string;
  daysAgo: number | null;
  opponent: string;
  ourScore: number;
  theirScore: number;
  result: FixtureResult | null;
  matchType: string;
  scorers: { name: string; goals: number }[];
  motm: string | null;
  // Two-sided view of the match for the EA-style report layout.
  us:  ClubMatchSide;
  opp: ClubMatchSide;
}

function fmtDateLabel(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/**
 * League match history for the Fixtures page. Returns clean per-match summaries
 * derived from EA's raw payloads. Newest first.
 */
export async function getLiveFixtures(limit = 30): Promise<FixtureRow[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('match_state')
    .select('match_id, played_at, match_type, data')
    .eq('club_id', SBC_CLUB_ID)
    .eq('platform', SBC_PLATFORM)
    .eq('match_type', 'leagueMatch')
    .order('played_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => {
    const blob = (row.data || {}) as Record<string, unknown>;
    const clubs     = (blob.clubs     || {}) as Record<string, Record<string, unknown>>;
    const players   = (blob.players   || {}) as Record<string, Record<string, Record<string, unknown>>>;
    const aggregate = (blob.aggregate || {}) as Record<string, Record<string, unknown>>;

    const us   = clubs[SBC_CLUB_ID] || {};
    const oppId = Object.keys(clubs).find((k) => k !== SBC_CLUB_ID) || '';
    const them = clubs[oppId] || {};

    const ourScore   = num(us['score'])   ?? num(us['goals']) ?? 0;
    const theirScore = num(them['score']) ?? num(them['goals']) ?? num(us['goalsAgainst']) ?? 0;

    const result: FixtureResult | null =
      ourScore > theirScore ? 'W' : ourScore < theirScore ? 'L' : 'D';

    // Build a clean per-side view (club name, crest, players, aggregates).
    const buildSide = (clubId: string, raw: Record<string, unknown>, score: number): ClubMatchSide => {
      const details = (raw.details || {}) as Record<string, unknown>;
      const customKit = (details.customKit || {}) as Record<string, unknown>;
      const playerMap = players[clubId] || {};
      const list: PlayerMatchStats[] = [];
      for (const p of Object.values(playerMap)) {
        const name = pick(p, ['playername'], str);
        if (!name) continue;
        list.push({
          name,
          position:     pick(p, ['pos', 'proPos'], str),
          goals:        num(p['goals'])         ?? 0,
          assists:      num(p['assists'])       ?? 0,
          rating:       num(p['rating']),
          shots:        num(p['shots'])         ?? 0,
          passesMade:   num(p['passesmade'])    ?? 0,
          passAttempts: num(p['passattempts'])  ?? 0,
          tacklesMade:  num(p['tacklesmade'])   ?? 0,
          redCards:     num(p['redcards'])      ?? 0,
          saves:        num(p['saves'])         ?? 0,
          isMotm:       num(p['mom']) === 1,
        });
      }
      // Highest in-game rating first matches what EA shows on the official site.
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

      // EA's match payload sometimes flags MOTM via `mom: 1`, sometimes leaves
      // every player at 0. If nobody on this side is flagged, derive MOTM as
      // the player with the highest match rating; on a tie, prefer the player
      // with the higher (goals * 0.6 + assists * 0.4) score.
      const someoneFlagged = list.some((p) => p.isMotm);
      if (!someoneFlagged && list.length > 0) {
        const ranked = [...list].sort((a, b) => {
          const r = (b.rating ?? 0) - (a.rating ?? 0);
          if (r !== 0) return r;
          return (b.goals * 0.6 + b.assists * 0.4) - (a.goals * 0.6 + a.assists * 0.4);
        });
        const winner = ranked[0]!;
        const idx = list.findIndex((p) => p.name === winner.name);
        if (idx !== -1) list[idx] = { ...list[idx]!, isMotm: true };
      }

      return {
        clubId,
        name: pick(details, ['name', 'clubName'], str) ?? (clubId === SBC_CLUB_ID ? 'Sad Boi Clique' : 'UNKNOWN'),
        crestId: pick(customKit, ['crestAssetId'], str),
        score,
        aggregate: aggregate[clubId] ?? null,
        players: list,
      };
    };

    const usSide  = buildSide(SBC_CLUB_ID, us,   ourScore);
    const oppSide = buildSide(oppId, them, theirScore);

    // Scorers / MOTM derived from our side, for the collapsed-row chips.
    const scorers = usSide.players
      .filter((p) => p.goals > 0)
      .map((p) => ({ name: p.name, goals: p.goals }))
      .sort((a, b) => b.goals - a.goals);
    const motm = usSide.players.find((p) => p.isMotm)?.name ?? null;

    const playedAtIso = (row.played_at as string | null) ?? null;
    const daysAgo = playedAtIso
      ? Math.max(0, Math.floor((Date.now() - new Date(playedAtIso).getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    return {
      matchId: row.match_id as string,
      playedAt: playedAtIso,
      dateLabel: fmtDateLabel(playedAtIso),
      daysAgo,
      opponent: oppSide.name,
      ourScore,
      theirScore,
      result,
      matchType: (row.match_type as string) || 'leagueMatch',
      scorers,
      motm,
      us:  usSide,
      opp: oppSide,
    };
  });
}

/** Latest scrape run timestamp + status, for an "as of …" footer. */
export async function getScraperHealth(): Promise<{ ranAt: string; ok: boolean } | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('scrape_log')
    .select('ran_at, ok')
    .order('ran_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return { ranAt: data.ran_at as string, ok: data.ok as boolean };
}
