// ============================================================
// SBCFC SHARED COMPONENTS, PAGES & DATA
// Ported verbatim from the Claude Design prototype (prototype-original/sbcfc-all.jsx).
// Internals untouched on purpose; we'll split this into smaller files when we
// next make real changes inside it.
// ============================================================
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
// @ts-nocheck
import React from 'react';
import { getPulseStats, getLiveFixtures, getLiveMembersByEaUser, getLiveNews, getLiveTransfers, getLiveStoreItems, getLivePlayers, type LiveMemberStats, type LivePlayer } from './liveData';
import { useAuth } from './auth';

/**
 * Hook: returns the PLAYERS array with live EA stats merged in for every
 * player who has an `eaUser` field (the human members of the club). AI/
 * fictional characters keep their hand-authored mock stats.
 *
 * The live fetch happens once; results are cached at module level so
 * pages that mount/unmount don't re-hit Supabase.
 */
let _liveMergedCache: any[] | null = null;
let _liveMergedInflight: Promise<any[]> | null = null;
let _livePlayersRefreshKey = 0;
function invalidateLivePlayers() {
  _livePlayersRefreshKey += 1;
  _liveMergedCache = null;
  _liveMergedInflight = null;
}

/** Convert a LivePlayer (DB row) into the player shape the prototype uses. */
function dbPlayerToPrototype(r: LivePlayer): any {
  return {
    id: r.id,
    name: r.name,
    shortName: r.shortName,
    number: r.number,
    eaUser: r.eaUser,
    image: r.image,
    position: r.position,
    rating: r.rating,
    rarity: r.rarity,
    nationality: r.nationality,
    goals: r.goals,
    apps: r.apps,
    assists: r.assists,
    cleanSheets: r.cleanSheets,
    stats: r.stats,
    tags: r.tags,
    accentColor: r.accentColor,
    glowColor: r.glowColor,
    archetype: r.archetype,
    lore: r.lore,
    timeline: r.timeline,
    sortOrder: r.sortOrder,
    visible: r.visible,
  };
}

function mergeLivePlayers(roster: any[], map: Map<string, LiveMemberStats>): any[] {
  return roster.map((p: any) => {
    if (!p.eaUser) return { ...p, isLive: false };
    const live = map.get(String(p.eaUser).toLowerCase());
    if (!live) return { ...p, isLive: false };
    return {
      ...p,
      goals:   live.goals,
      assists: live.assists,
      apps:    live.gamesPlayed,
      rating:  live.proOverall ?? p.rating,
      // Keep the full live record around for the profile modal.
      liveStats: live,
      isLive: true,
    };
  });
}

async function loadMergedPlayers(): Promise<any[]> {
  if (_liveMergedCache) return _liveMergedCache;
  if (_liveMergedInflight) return _liveMergedInflight;
  _liveMergedInflight = (async () => {
    try {
      const [dbPlayers, eaMap] = await Promise.all([
        getLivePlayers(),
        getLiveMembersByEaUser(),
      ]);
      const roster = dbPlayers.length > 0 ? dbPlayers.map(dbPlayerToPrototype) : PLAYERS;
      const merged = mergeLivePlayers(roster, eaMap);
      _liveMergedCache = merged;
      return merged;
    } catch {
      return PLAYERS;
    } finally {
      _liveMergedInflight = null;
    }
  })();
  return _liveMergedInflight;
}

function useLivePlayers(): any[] {
  const [players, setPlayers] = React.useState<any[]>(PLAYERS);
  React.useEffect(() => {
    let cancelled = false;
    loadMergedPlayers().then(merged => { if (!cancelled) setPlayers(merged); });
    return () => { cancelled = true; };
  }, [_livePlayersRefreshKey]);
  return players;
}

/** Convert an ISO timestamp into a "12 minutes ago" / "3 days ago" style
 *  string, matching the prototype's existing time strings. */
function relativeTime(iso: string): string {
  const now = Date.now();
  const t   = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const min = Math.floor(diff / 60000);
  if (min < 1)   return 'Just now';
  if (min < 60)  return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24)   return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const d = Math.floor(hr / 24);
  if (d < 7)     return `${d} day${d === 1 ? '' : 's'} ago`;
  const w = Math.floor(d / 7);
  if (w < 4)     return `${w} week${w === 1 ? '' : 's'} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12)   return `${mo} month${mo === 1 ? '' : 's'} ago`;
  const y = Math.floor(d / 365);
  return `${y} year${y === 1 ? '' : 's'} ago`;
}

/** Module-level invalidation flags. Admin CRUD bumps the relevant key so
 *  the next mount of a consumer page refetches instead of returning the
 *  same in-memory copy. */
let _liveNewsRefreshKey = 0;
function invalidateLiveNews() { _liveNewsRefreshKey += 1; }
let _liveTransfersRefreshKey = 0;
function invalidateLiveTransfers() { _liveTransfersRefreshKey += 1; }
let _liveStoreRefreshKey = 0;
function invalidateLiveStore() { _liveStoreRefreshKey += 1; }

/** Hook: returns the news article list. Falls back to the prototype's
 *  curated SORTED_NEWS / ALL_NEWS if the database has no rows yet, so
 *  the site looks alive even before any admin posts.
 *  When admins are inviting friends to read the site, the DB is the
 *  source of truth — once any row exists in news_articles, the mock
 *  list is fully replaced. */
function useLiveNews(): any[] {
  const fallback = ALL_NEWS;
  const [items, setItems] = React.useState<any[]>(fallback);
  const refreshKey = _liveNewsRefreshKey;
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const live = await getLiveNews();
      if (cancelled) return;
      if (live.length === 0) { setItems(fallback); return; }
      // Translate the live row shape into the same property names the
      // existing render code already uses (`image`, `tagColor`, `time`).
      setItems(live.map((a) => ({
        id:        a.id,
        headline:  a.headline,
        summary:   a.summary,
        body:      a.body,
        tag:       a.tag,
        tagColor:  a.tagColor,
        kicker:    a.kicker ?? undefined,
        image:     a.imageUrl ?? undefined,
        time:      relativeTime(a.publishedAt),
        hot:       a.hot,
        author:    a.author ?? undefined,
        publishedAt: a.publishedAt,
      })));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);
  return items;
}

/** Hook: live transfers from the database. Falls back to a small mock list
 *  if the table is empty so the page doesn't look broken pre-migration. */
const TRANSFERS_FALLBACK: any[] = [
  { id: 'mock-1', player: 'UNKNOWN SIGNING', club: 'CLASSIFIED FC', fee: 'UNDISCLOSED',
    statusLabel: 'HERE WE GO ✓', panelColor: '#2a9d8f',
    detail: 'Multiple sources confirm agreement in principle. Medicals booked. Nanna Tate personally approved the move. HERE WE GO.',
    imageUrl: null, happenedAt: new Date().toISOString() },
  { id: 'mock-2', player: 'GYMSKIN', club: 'SAD BOI CLIQUE FC', fee: 'LOYALTY',
    statusLabel: 'CONTRACT EXTENDED', panelColor: '#9b5de5',
    detail: 'Contract extension signed. New terms include guaranteed coffee at 95 degrees before every match. Non-negotiable clause.',
    imageUrl: null, happenedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'mock-3', player: 'PANIKOVA', club: 'SAD BOI CLIQUE FC', fee: 'N/A',
    statusLabel: 'DEVELOPING STORY', panelColor: '#E4002B',
    detail: 'Several unnamed clubs have enquired. Panikova reportedly saw signs in a potted cactus. Investigation ongoing.',
    imageUrl: null, happenedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
];

function useLiveTransfers(): any[] {
  const [items, setItems] = React.useState<any[]>(TRANSFERS_FALLBACK);
  const refreshKey = _liveTransfersRefreshKey;
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const live = await getLiveTransfers();
      if (cancelled) return;
      if (live.length === 0) { setItems(TRANSFERS_FALLBACK); return; }
      setItems(live);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);
  return items;
}

/** Fallback store catalogue used until the store_items table is populated.
 *  Mirrors the prototype's hand-curated list so the page never looks empty. */
const STORE_FALLBACK: any[] = [
  { id: 'mock-1', name: 'HOME SHIRT 25/26', price: 60, category: 'KITS', tag: 'NEW DROP', panelColor: '#E4002B',
    subtitle: 'Adult replica · Aura red, slim fit',
    images: ['/assets/store/home-shirt-front.jpg','/assets/store/home-shirt-angled.jpg','/assets/store/home-shirt-rear.jpg'],
    soldOut: false, sortOrder: 10, visible: true, featured: true },
  { id: 'mock-2', name: 'GK SHIRT 25/26', price: 55, category: 'KITS', tag: '', panelColor: '#2a9d8f',
    subtitle: 'Goalkeeper replica · Lewis #1',
    images: ['/assets/store/gk-shirt-front.jpg','/assets/store/gk-shirt-angled.jpg','/assets/store/gk-shirt-rear.jpg'],
    soldOut: false, sortOrder: 20, visible: true, featured: true },
  { id: 'mock-3', name: 'TRAINING JACKET', price: 55, category: 'TRAINING', tag: 'BACK IN STOCK', panelColor: '#E4002B',
    subtitle: 'Quarter-zip · what the squad warms up in',
    images: ['/assets/store/jacket-front.jpg','/assets/store/jacket-angled.jpg','/assets/store/jacket-rear.jpg'],
    soldOut: false, sortOrder: 30, visible: true, featured: true },
  { id: 'mock-4', name: 'PANIKOVA SCARF', price: 14, category: 'FAN GEAR', tag: 'LIMITED', panelColor: '#e9c46a',
    subtitle: '"WHEN THE PANIC HITS" · 100% acrylic',
    images: ['/assets/store/panikova-scarf.jpg','/assets/store/panikova-scarf-close.jpg'],
    soldOut: false, sortOrder: 40, visible: true, featured: true },
  { id: 'mock-5', name: 'TRAINING HOODIE', price: 45, category: 'TRAINING', tag: '', panelColor: '#2a9d8f',
    subtitle: 'Heavyweight · embroidered crest',
    images: ['/assets/store/hoodie-front.jpg','/assets/store/hoodie-angled.jpg','/assets/store/hoodie-rear.jpg'],
    soldOut: false, sortOrder: 50, visible: true, featured: true },
  { id: 'mock-6', name: 'AURA STABILITY MUG', price: 12, category: 'FAN GEAR', tag: 'BESTSELLER', panelColor: '#E4002B',
    subtitle: 'Reads at exactly 95°C · ceramic 11oz',
    images: ['/assets/store/aura-mug.jpg'],
    soldOut: false, sortOrder: 60, visible: true, featured: false },
];

function useLiveStoreItems(): any[] {
  const [items, setItems] = React.useState<any[]>(STORE_FALLBACK);
  const refreshKey = _liveStoreRefreshKey;
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const live = await getLiveStoreItems();
      if (cancelled) return;
      if (live.length === 0) { setItems(STORE_FALLBACK); return; }
      setItems(live);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);
  return items;
}

/** "1st" / "2nd" / "3rd" / "4th"… for league-position display. */
function ordinalSuffix(n: number): string {
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 13) return 'TH';
  switch (n % 10) { case 1: return 'ST'; case 2: return 'ND'; case 3: return 'RD'; default: return 'TH'; }
}

export const PLAYERS = [
{
  id: 'panikova', eaUser: 'broddleeee1', name: 'Amir Panikova', shortName: 'PANIKOVA', number: 77, image: '/uploads/pasted-1777415983890-0.png',
  position: 'ST', rating: 85, rarity: 'icon', nationality: 'RU',
  goals: 187, apps: 306, assists: 43, cleanSheets: null,
  stats: { PAC: 85, SHO: 91, PAS: 72, DRI: 87, DEF: 22, PHY: 80 },
  tags: ['The Calm (Formerly)', 'Aura Instability Risk', 'Vibe Injury Prone', 'Offside Non-Compliant'],
  accentColor: '#ff2244', glowColor: 'rgba(255,34,68,0.45)',
  archetype: 'Chaos Icon',
  lore: 'Once heralded as the most composed striker in Pro Clubs history. Then something shifted. Nobody knows what. Not even him.',
  timeline: [
  { era: 'The Rise', note: '187 goals. Cold. Clinical. Legendary.' },
  { era: 'The Collapse', note: 'Missed a penalty against 10 men. Blamed a seagull.' },
  { era: 'The Rebirth', note: 'Sad Boi era begins. Chaos becomes the method.' }]

},
{
  id: 'gymskin', eaUser: 'NoticeMeSenpepe', name: 'Gymskin', shortName: 'GYMSKIN', number: 95, image: '/uploads/pasted-1777416552965-0.png',
  position: 'CDM', rating: 88, rarity: 'legend', nationality: '🌟',
  goals: 278, apps: 298, assists: 127, cleanSheets: null,
  stats: { PAC: 80, SHO: 88, PAS: 85, DRI: 92, DEF: 45, PHY: 75 },
  tags: ['Aura Commander', 'Coffee Calibrated', 'Drop the Shoulder™', 'Streamer-God Hybrid'],
  accentColor: '#9b5de5', glowColor: 'rgba(155,93,229,0.45)',
  archetype: 'Aura Commander',
  lore: 'Operates on a frequency science cannot explain. Will not play before coffee reaches exactly 95 degrees. Non-negotiable.',
  timeline: [
  { era: 'The Awakening', note: 'Discovered "Drop the Shoulder™" aged 19. Patent pending.' },
  { era: 'The Aura Era', note: '278 goals. Mostly from impossible angles.' },
  { era: 'The Calibration', note: 'Coffee ritual introduced. Win rate +34%.' }]

},
{
  id: 'karavavov', eaUser: 'AnGeRy SpUrD', name: 'Dmitri Karavavov', shortName: 'KARAVAVOV', number: 11, image: '/uploads/Karavavov.png',
  position: 'CAM', rating: 87, rarity: 'rare', nationality: 'RU',
  goals: 52, apps: 241, assists: 89, cleanSheets: null,
  stats: { PAC: 78, SHO: 74, PAS: 91, DRI: 88, DEF: 55, PHY: 70 },
  tags: ['Creative Chaos Engine', 'Risk Merchant', 'Ball Retention: None'],
  accentColor: '#f4a261', glowColor: 'rgba(244,162,97,0.45)',
  archetype: 'Trickster Genius',
  lore: 'The architect of beautiful sequences and catastrophic collapses. Often in the same passage of play. Frequently both.',
  timeline: [
  { era: 'The Trickster', note: 'Invented a skill move. Refused to name it.' },
  { era: 'The Chaos Phase', note: 'Lost the ball 847 times in one season. Still assisted 89.' },
  { era: 'The Acceptance', note: 'Manager stopped telling him to keep it simple.' }]

},
{
  id: 'donnyp', eaUser: 'der bom113', name: 'Donald Partridge', shortName: 'DONNY P', number: 9, image: '/uploads/pasted-1777417166292-0.png',
  position: 'CF', rating: 85, rarity: 'rare', nationality: 'ENG',
  goals: 94, apps: 198, assists: 31, cleanSheets: null,
  stats: { PAC: 83, SHO: 79, PAS: 68, DRI: 80, DEF: 20, PHY: 76 },
  tags: ['Early Release Specialist', 'Top Bins (Rare)', 'Wind Resistant', 'Confidence MAX'],
  accentColor: '#e9c46a', glowColor: 'rgba(233,196,106,0.45)',
  archetype: 'Unreliable Technician',
  lore: 'Confident. Emphatic. Wildly inconsistent. Has scored some absolute worldies. Has also missed from 3 yards. Claims wind resistance for both.',
  timeline: [
  { era: 'The Promise', note: 'Scored a bicycle kick on debut. Never mentioned since.' },
  { era: 'The Sitter Era', note: 'DONNY P MISSES SITTER, CLAIMS WIND RESISTANCE.' },
  { era: 'The Redemption Arc', note: 'Top bins from 35 yards. "I meant it." He did not.' }]

},
{
  id: 'ricciardo', eaUser: 'ItsJustAhsan', name: 'Daniel Ricciardo', shortName: 'RICCIARDO', number: 7, image: '/uploads/Ricciardo.png',
  position: 'RW', rating: 86, rarity: 'rare', nationality: 'AUS',
  goals: 23, apps: 187, assists: 12, cleanSheets: null,
  stats: { PAC: 90, SHO: 72, PAS: 58, DRI: 85, DEF: 30, PHY: 78 },
  tags: ['No Cross Completion', 'Performance Variance MAX', 'Chaos Merchant', 'RICCIARDO STILL HASN\'T COMPLETED A CROSS'],
  accentColor: '#00c8ff', glowColor: 'rgba(0,200,255,0.45)',
  archetype: 'Chaos Merchant',
  lore: 'Fast. Unpredictable. Has never successfully completed a cross in his career. Cross completion rate: 0.0%. We have checked. Many times.',
  timeline: [
  { era: 'The Arrival', note: 'Fastest player in the club. Great. What could go wrong.' },
  { era: 'The Cross Incident', note: 'Attempted 847 crosses. Zero completed. Ongoing investigation.' },
  { era: 'The Acceptance', note: 'Cross attempts now celebrated ironically. Still not completed one.' }]

},
{
  // Sixth human-controlled player. eaUser matches the real EA Gamertag so live
  // stats from member_state get merged in. Photo is the magazine-style portrait
  // supplied by the user. Listed after the other humans, before the AI roster.
  id: 'oldreliable', name: 'Old Reliable', shortName: 'OLD RELIABLE', number: 6, image: '/uploads/old-reliable.png', eaUser: 'Shmuelly',
  position: 'CM', rating: 78, rarity: 'rare', nationality: '🌟',
  goals: 0, apps: 0, assists: 0, cleanSheets: null,
  stats: { PAC: 70, SHO: 65, PAS: 80, DRI: 72, DEF: 70, PHY: 74 },
  tags: ['Steady', 'Quietly Effective', 'Always Available'],
  accentColor: '#06d6a0', glowColor: 'rgba(6,214,160,0.4)',
  archetype: 'The Glue',
  lore: 'Holds the team together. Doesn\'t score, doesn\'t need to. Always exactly where the ball is going to be — or already moving the play before the ball arrives.',
  timeline: [
  { era: 'The Quiet Era', note: 'Low-key brilliant. The teammates know.' }],
  role: 'CM'
},
{
  id: 'jimenez', name: 'Jimenez', shortName: 'JIMENEZ', number: 1,
  position: 'GK', rating: 78, rarity: 'common', nationality: 'ES',
  goals: 0, apps: 134, assists: 1, cleanSheets: 29,
  stats: { DIV: 82, HAN: 76, KIC: 68, REF: 80, SPD: 60, POS: 85 },
  tags: ['Shot Stopper', 'Shouting Constantly', 'Blameless'],
  accentColor: '#2a9d8f', glowColor: 'rgba(42,157,143,0.4)',
  archetype: 'The Keeper',
  lore: 'Concedes goals. Blames the defenders. Always. Without exception. The defenders have stopped arguing.',
  timeline: [{ era: 'The Debut', note: '29 clean sheets. Communicates entirely through pointing.' }, { era: 'The Philosophy', note: '"If they don\'t shoot they can\'t score." Working on it.' }, { era: 'The Protocol', note: 'Developed a 47-step distribution routine. Nobody is asking him to stop.' }]
},
{
  id: 'kamala', name: 'Kamala Harris', shortName: 'K. HARRIS', number: 2,
  position: 'CB', rating: 74, rarity: 'common', nationality: 'US',
  goals: 3, apps: 112, assists: 8, cleanSheets: null,
  stats: { PAC: 70, SHO: 52, PAS: 74, DRI: 66, DEF: 79, PHY: 72 },
  tags: ['Word Salad Distributor', 'Unexpectedly Composed', 'Coconut Tree Defender'],
  accentColor: '#4361ee', glowColor: 'rgba(67,97,238,0.4)',
  archetype: 'The Defender',
  lore: 'Brings a unique verbal energy to defensive communication. Pre-match team talks are memorable if not always comprehensible.',
  timeline: [{ era: 'The Arrival', note: 'First press conference lasted 40 minutes. Nobody is sure what was said.' }, { era: 'The Coconut Arc', note: 'Delivered a pre-match speech about coconut trees. Kept a clean sheet.' }, { era: 'The Continuity', note: 'Still here. Still talking. Defending is fine.' }]
},
{
  id: 'newsom', name: 'Gavin Newsom', shortName: 'NEWSOM', number: 3,
  position: 'CB', rating: 72, rarity: 'common', nationality: 'US',
  goals: 2, apps: 98, assists: 5, cleanSheets: null,
  stats: { PAC: 68, SHO: 48, PAS: 71, DRI: 62, DEF: 77, PHY: 74 },
  tags: ['Hair Immaculate', 'Press Conference Ready', 'Suspiciously Tanned'],
  accentColor: '#457b9d', glowColor: 'rgba(69,123,157,0.4)',
  archetype: 'The Photogenic Defender',
  lore: 'Looks incredible at all times regardless of scoreline. Post-match interviews are polished. The defending is also polished. Somewhat.',
  timeline: [{ era: 'The Signing', note: 'Arrived with a full media team. Hair perfect.' }, { era: 'The Performance', note: 'Solid. Composed. Somehow always facing the camera.' }, { era: 'The Brand', note: 'Has his own highlight reel. It is very well edited.' }]
},
{
  id: 'rosekirk', name: 'Rose Kirk', shortName: 'R. KIRK', number: 4,
  position: 'RB', rating: 75, rarity: 'common', nationality: 'ENG',
  goals: 4, apps: 121, assists: 22, cleanSheets: null,
  stats: { PAC: 82, SHO: 60, PAS: 73, DRI: 76, DEF: 78, PHY: 71 },
  tags: ['Relentless', 'Overlap Queen', 'Never Stops Running'],
  accentColor: '#e63946', glowColor: 'rgba(230,57,70,0.4)',
  archetype: 'The Engine',
  lore: 'Runs. And runs. And runs. GPS data suggests she covers 14km per match. The sports scientists have asked her to slow down. She has not.',
  timeline: [{ era: 'The Debut', note: 'Ran the full length of the pitch 11 times in 90 minutes.' }, { era: 'The Assist Era', note: '22 assists. None planned. All the result of running.' }, { era: 'The Legend', note: 'Still running. Nobody has asked her to stop.' }]
},
{
  id: 'rubio', name: 'Marco Rubio', shortName: 'RUBIO', number: 5,
  position: 'LB', rating: 73, rarity: 'common', nationality: 'US',
  goals: 1, apps: 89, assists: 11, cleanSheets: null,
  stats: { PAC: 75, SHO: 55, PAS: 69, DRI: 70, DEF: 76, PHY: 73 },
  tags: ['Water Break Required', 'Sweating Profusely', 'Diplomatically Sound'],
  accentColor: '#f4a261', glowColor: 'rgba(244,162,97,0.4)',
  archetype: 'The Diplomat',
  lore: 'Takes an unusually high number of water breaks. Performance improves markedly after hydration. The club has installed extra water stations.',
  timeline: [{ era: 'The Signing', note: 'Arrived with 6 water bottles. Used all of them in the warm-up.' }, { era: 'The Water Era', note: 'Three MOTM awards. All in games with unlimited hydration access.' }, { era: 'The Protocol', note: 'New contract clause: minimum 4 water breaks per half.' }]
},
{
  id: 'noem', name: 'Kristi Noem', shortName: 'K. NOEM', number: 6,
  position: 'CM', rating: 70, rarity: 'common', nationality: 'US',
  goals: 5, apps: 77, assists: 14, cleanSheets: null,
  stats: { PAC: 72, SHO: 66, PAS: 70, DRI: 68, DEF: 68, PHY: 76 },
  tags: ['Unexpectedly Direct', 'No Nonsense', 'Controversial Decision Maker'],
  accentColor: '#9b5de5', glowColor: 'rgba(155,93,229,0.4)',
  archetype: 'The Enforcer',
  lore: 'Takes decisive action on the pitch with minimal deliberation. Some decisions are inspired. Others require a review panel.',
  timeline: [{ era: 'The Debut', note: 'Tackled the referee by accident. Yellow card. No apology.' }, { era: 'The Enforcer Era', note: 'Became de facto captain of the defensive press.' }, { era: 'The Controversy', note: 'Three red cards reviewed. One overturned. She was right that time.' }]
},
{
  id: 'rfk', name: 'Robert F Kennedy Jr', shortName: 'RFK JR', number: 14,
  position: 'CM', rating: 69, rarity: 'common', nationality: 'US',
  goals: 6, apps: 82, assists: 17, cleanSheets: null,
  stats: { PAC: 68, SHO: 63, PAS: 72, DRI: 65, DEF: 64, PHY: 70 },
  tags: ['Questionable Dietary Habits', 'Unconventional Methods', 'Bear Convinced He\'s Fine'],
  accentColor: '#e9c46a', glowColor: 'rgba(233,196,106,0.4)',
  archetype: 'The Wildcard',
  lore: 'Brings a unique perspective to team meetings. Pre-match nutrition choices are his own business. Performance is inconsistent but occasionally transcendent.',
  timeline: [{ era: 'The Signing', note: 'Arrived carrying a smoothie of unspecified contents. Scored twice.' }, { era: 'The Methods', note: 'Introduced an unorthodox training regime. Two players quit. Three improved.' }, { era: 'The Ongoing Situation', note: 'The bear is fine. We have been asked not to elaborate.' }]
},
{
  id: 'hegseth', name: 'Pete Hegseth', shortName: 'HEGSETH', number: 8,
  position: 'RW', rating: 68, rarity: 'common', nationality: 'US',
  goals: 8, apps: 64, assists: 6, cleanSheets: null,
  stats: { PAC: 76, SHO: 67, PAS: 55, DRI: 72, DEF: 42, PHY: 80 },
  tags: ['Fox & Friends Correspondent', 'Extremely Confident', 'Chaotic Good'],
  accentColor: '#e63946', glowColor: 'rgba(230,57,70,0.4)',
  archetype: 'The Pundit',
  lore: 'Plays with the energy of someone who has a lot of strong opinions and is not afraid to share them. Defending is not a priority.',
  timeline: [{ era: 'The Debut', note: 'Scored on debut. Immediately gave a press conference about it.' }, { era: 'The Pundit Arc', note: 'Began providing live commentary on his own performance mid-match.' }, { era: 'The Confidence', note: 'Rating: 68. Self-assessed rating: 94. The gap is the content.' }]
},
{
  id: 'diakite', name: 'Steve Diakite', shortName: 'DIAKITE', number: 99,
  position: 'ST', rating: 80, rarity: 'rare', nationality: 'ENG',
  goals: 41, apps: 88, assists: 12, cleanSheets: null,
  stats: { PAC: 84, SHO: 82, PAS: 65, DRI: 79, DEF: 25, PHY: 83 },
  tags: ['EXILED', 'Awaiting Return', 'The Prodigal Striker', 'DO NOT CONTACT'],
  accentColor: '#ff2244', glowColor: 'rgba(255,34,68,0.4)',
  archetype: 'The Exiled One',
  lore: 'Departed under circumstances that remain classified. The club has issued no statement. His shirt hangs in the changing room. Nobody has moved it.',
  timeline: [{ era: 'The Golden Era', note: '41 goals. Beloved. Everything was fine.' }, { era: 'The Incident', note: '[REDACTED BY CLUB LEGAL TEAM]' }, { era: 'The Exile', note: 'Location unknown. Number 99 retired. Then un-retired. Then retired again.' }]
}];


const NEWS_ITEMS = [
{ id: 9, headline: 'RICCIARDO SPOTTED LEAVING RIVAL CLUB GP UNION FC', image: '/uploads/news-ricciardo-rival.png', tag: 'BREAKING', tagColor: '#ff2244', kicker: 'Exclusive Investigation', summary: 'The Honeybadger photographed exiting GP Union FC reception in full incognito mode. Sources allege a pay-as-you-play side contract. He still hasn\'t completed a cross.', body: 'Multiple paparazzi captured Ricciardo leaving GP Union FC\'s reception with the body language of a man who knows. A source close to the boardroom claims a pay-as-you-play arrangement has been in place "for some time". Some fans see this as the deepest betrayal in Sad Boi Clique history. Others, more philosophically inclined, view it as the Honeybadger seeking out additional reps so he might one day, finally, complete a cross. The club has issued no statement. Ricciardo has not returned calls. The cross attempt counter remains, as ever, at zero.', time: '14 minutes ago', hot: true, author: 'Club Insider' },
{ id: 10, headline: 'THE BUS, THE DOG, THE BREED — KARAVAVOV vs PANIKOVA', image: '/uploads/news-bus-dog.png', tag: 'LORE', tagColor: '#f4a261', kicker: 'The Moldova Incident, 2023', summary: 'A roadside dog. A disagreement over breed. A two-year silence. The full story of the bus stop that broke a midfield partnership.', body: 'Spirits were low. Heating was too high. A 2009 Pitbull playlist was on. Then, at a roadside stop in Moldova, the dog appeared. Karavavov (quietly): "That is clearly a Border Terrier." Panikova (immediately, aggressively): "That is not a Border Terrier. That is a philosophical mutt." Karavavov produced a blurry phone image. Panikova refused to look, stating "Images are lies." The driver paused the bus to "let the situation breathe." Panikova rose in the aisle: "You see breeds. I see essence." Karavavov: "It has the face of a Border Terrier." Panikova: "It has the soul of something unregistered." Panikova attempted to disembark to consult the dog directly. Intervention was required. They have not spoken since. Panikova privately refers to Karavavov as "Kennel Mind". Karavavov refers to Panikova as "Unverifiable" and, more recently, "methodologically unsound". A club psychologist was brought in. The first session ended after Panikova asked whether the psychologist was "licensed, or just emotionally confident". This morning, a coach used a dog metaphor to demonstrate pressing shape. Both players refused to participate. The session collapsed. A senior source: "We tried to show them a picture of the dog again. It made things worse." Situation ongoing. Dressing room divided — not by tactics, but by the dog.', time: '6 hours ago', hot: true, author: 'Long Reads' },
{ id: 1, headline: 'PANIKOVA: The Panic Returns?', image: '/uploads/news-panikova.png', tag: 'INVESTIGATION', tagColor: '#ff2244', kicker: 'Investigation', summary: 'Sources close to the striker report "unusual energy" ahead of Saturday\'s fixture. Aura stability readings are at a season-low.', body: 'Multiple staff have reported Panikova circling the cone drill at unprecedented speeds. The medical team have escalated the situation to the highest tier. Nanna Tate has issued no statement.', time: '2 hours ago', hot: false, author: 'Club Insider' },
{ id: 2, headline: 'GYMSKIN ACTIVATES AURA PULSE IN 4-2 THRILLER', image: '/uploads/news-aurapulse.png', tag: 'MATCH REPORT', tagColor: '#9b5de5', kicker: 'Match Report', summary: 'The midfielder\'s coffee was reportedly at exactly 95 degrees. The correlation is undeniable. Science has confirmed it.', body: 'A second-half explosion saw three goals in 21 minutes after Gymskin entered what teammates call "the calibrated zone". The temperature reading remains classified.', time: '1 day ago', hot: false, author: 'Tactical Desk' },
{ id: 3, headline: 'DONNY P MISSES SITTER, CLAIMS "WIND RESISTANCE"', image: '/uploads/news-donnyp.png', tag: 'ANALYSIS', tagColor: '#e9c46a', kicker: 'Investigation', summary: 'Wind speed at time of shot: 0mph. Our analysts have reviewed the footage 47 times. There was no wind. We checked.', body: 'Stadium meteorological data shows still air at the moment of impact. Donny P has stood by his testimony. The matter is closed.', time: '2 days ago', hot: false, author: 'Stats Desk' },
{ id: 4, headline: 'RICCIARDO STILL HASN\'T COMPLETED A CROSS', image: '/uploads/news-ricciardo.png', tag: 'ONGOING', tagColor: '#00c8ff', kicker: 'Ongoing Saga', summary: 'Week 23 of our ongoing investigation. Cross attempt count: 1,247. Successful crosses: 0. The mystery deepens.', body: 'Despite extensive coaching and a 30% wage increase pegged to crossing accuracy, the Honeybadger remains on a streak that has now eclipsed all known records.', time: '3 days ago', hot: true, author: 'Long Reads' },
{ id: 5, headline: 'PANIKOVA CLAIMS HE SAW SIGNS IN A FERN AGAIN', image: '/uploads/news-panikova.png', tag: 'EXCLUSIVE', tagColor: '#ff2244', kicker: 'Exclusive', summary: 'The striker spotted what he describes as "a clear tactical formation" in the foliage outside the training ground. Worrying.', body: 'A botanist was consulted. They confirmed it was, in fact, a fern. Panikova is unconvinced and has scheduled a follow-up.', time: '4 days ago', hot: false, author: 'Club Insider' },
{ id: 6, headline: 'GYMSKIN REFUSES TO PLAY BEFORE COFFEE CALIBRATION', image: '/uploads/news-coffee.png', tag: 'CULTURE', tagColor: '#9b5de5', kicker: 'Inside the Clique', summary: 'Kick-off delayed 4 minutes as thermometer was misplaced. Once located and confirmed at 95°, performance was transcendent.', body: 'The thermometer in question is now kept in a locked drawer with a single backup. The protocol is non-negotiable.', time: '5 days ago', hot: false, author: 'Inside the Clique' },
{ id: 7, headline: 'KARAVAVOV: "THE RISKY PASS WAS THE RIGHT PASS"', image: '/uploads/news-karavavov.png', tag: 'POST-MATCH', tagColor: '#f4a261', kicker: 'Post-Match', summary: 'It wasn\'t. He lost possession 14 times. He scored twice from the resulting chaos. Karavavov remains undefeated in arguments.', body: 'Post-match analysis is colourful. Karavavov refused all questions and instead performed a no-look pass into the press microphone.', time: '6 days ago', hot: false, author: 'Press Box' },
{ id: 8, headline: 'TRANSFER SPECIAL: HERE WE GO — CLUB ANNOUNCES NEW DEAL', tag: 'TRANSFER', tagColor: '#2a9d8f', kicker: 'Transfer Window', summary: 'Multiple sources confirm agreement in principle. Personal terms agreed. Medical scheduled. Nanna Tate approved.', body: 'The signature is imminent. The hashtag is locked and loaded. The graphic is ready. Here. We. Go.', time: '1 week ago', hot: false, image: '/uploads/pasted-1777417166292-0.png', author: 'Transfer Desk' }];

// Time-ago weight: lower = more recent. Used to sort the news feed by date.
const __SBC_TIME_UNITS = { minute: 1, hour: 60, day: 60 * 24, week: 60 * 24 * 7, month: 60 * 24 * 30 };
const newsTimeWeight = (t) => {
  if (!t) return Number.MAX_SAFE_INTEGER;
  const m = String(t).match(/(\d+)\s*(minute|hour|day|week|month)/i);
  if (!m) return Number.MAX_SAFE_INTEGER;
  return parseInt(m[1], 10) * (__SBC_TIME_UNITS[m[2].toLowerCase()] || 1);
};
// Lead first (NEWS_ITEMS[0]); everything else by date order, most recent first.
const SORTED_NEWS = (() => {
  if (!NEWS_ITEMS.length) return [];
  const [lead, ...rest] = NEWS_ITEMS;
  return [lead, ...rest.slice().sort((a, b) => newsTimeWeight(a.time) - newsTimeWeight(b.time))];
})();

// Older stories — feed for the "From the Archive" panel & Archive view.
const OLDER_NEWS = [
{ id: 101, headline: 'THE ONE WHERE NANNA TATE BENCHED THE ENTIRE FRONT THREE', image: '/uploads/news-coffee.png', tag: 'LEGACY', tagColor: '#9b5de5', kicker: 'From The Archive', summary: 'A Tuesday training session, three coffees of incorrect temperature, and a decision that defined an era.', body: 'It was 9:14am. The coffees were wrong. Nanna Tate stood at the touchline, blew the whistle once, and benched the entire front three before the warm-up had finished. The reasons given, in order: vibes, posture, and "general lack of mood". The session continued in eerie silence. The team won 5-0 that weekend. The front three returned. Nothing was ever explained.', time: '2 months ago', hot: false, author: 'Long Reads' },
{ id: 102, headline: 'GYMSKIN\'S COFFEE SUPPLIER REVEALED — IT\'S HIS NAN', image: '/uploads/news-coffee.png', tag: 'LORE', tagColor: '#f4a261', kicker: 'Long Read', summary: 'After two years of speculation, the source of the 95° beans is finally identified. She lives above a post office.', body: 'Sources confirm the supplier is Gymskin\'s nan, who reportedly roasts in small batches "by feel" and refuses to discuss the temperature on the record. She has, however, agreed to a sponsorship deal that primarily involves more cardigans.', time: '3 months ago', hot: false, author: 'Inside the Clique' },
{ id: 103, headline: 'PANIKOVA: "THE FERN UNDERSTANDS ME"', image: '/uploads/news-panikova.png', tag: 'EXCLUSIVE', tagColor: '#ff2244', kicker: 'Long-Form Interview', summary: 'A 4,000-word interview about a fern. We have published it in full. We do not understand most of it.', body: 'Conducted at dawn in the changing-room corridor. Topics covered: foliage, formations, the soul of pre-season, why the away kit "smells of permission". A foundational text for any Sad Boi scholar.', time: '4 months ago', hot: false, author: 'Press Box' },
{ id: 104, headline: 'RICCIARDO ATTEMPTS A CROSS — PLAYBACK ANALYSIS WEEK 19', image: '/uploads/news-ricciardo.png', tag: 'ANALYSIS', tagColor: '#e9c46a', kicker: 'Cross Watch', summary: 'Frame-by-frame breakdown of attempt 1,128. Conclusion: it was, technically, a backwards header.', body: 'Our analysts re-watched the play 31 times in slow motion. The ball travelled 4.2 metres. Direction: backwards and slightly upward. The attempt has been logged as "ambitious".', time: '5 months ago', hot: false, author: 'Stats Desk' },
{ id: 105, headline: 'KARAVAVOV REFUSES TO ATTEND MEETING ABOUT MEETINGS', image: '/uploads/news-karavavov.png', tag: 'CULTURE', tagColor: '#9b5de5', kicker: 'Inside the Clique', summary: 'The midfielder cited "philosophical concerns about recursion". He sent a paragraph. It was applauded.', body: 'The boardroom received a single email. Three sentences. The third sentence was just the word "no" repeated four times in declining font sizes. The meeting was cancelled. Productivity reportedly increased.', time: '6 months ago', hot: false, author: 'Inside the Clique' },
{ id: 106, headline: 'THE MOLDOVA INCIDENT — ORIGINAL DASHCAM RELEASED', image: '/uploads/news-bus-dog.png', tag: 'LORE', tagColor: '#f4a261', kicker: 'The Tape', summary: 'Twelve seconds of footage. One roadside dog. The breed debate that broke a midfield. Now in 4K.', body: 'After two years of FOI requests the dashcam footage has been released. The dog is, frustratingly, only visible from behind. Both Karavavov and Panikova claim vindication. The bus driver continues to refuse all interviews.', time: '7 months ago', hot: true, author: 'Long Reads' },
{ id: 107, headline: 'DONNY P MISSED A SITTER (AGAIN) — A HISTORICAL TIMELINE', image: '/uploads/news-donnyp.png', tag: 'ANALYSIS', tagColor: '#e9c46a', kicker: 'Stats Desk', summary: 'Every recorded sitter since 2022. Reasons given. Wind speeds at time of shot. We have charted them.', body: 'Total recorded sitters: 47. Reasons cited: wind (12), sun (8), "the moment was off" (6), boots (5), unspecified vibes (16). Average wind speed at time of incident: 1.1 mph. The data does not support the testimony.', time: '8 months ago', hot: false, author: 'Stats Desk' },
{ id: 108, headline: 'OLD RELIABLE: THE GOAL THAT STARTED A RELIGION', image: '/uploads/pasted-1777417166292-0.png', tag: 'LEGACY', tagColor: '#9b5de5', kicker: 'Origin Story', summary: 'A scuffed shot from 8 yards in February. A new fanbase formed before the ball crossed the line.', body: 'It was a Tuesday. The shot was, charitably, a mishit. It bounced twice and went in. By Wednesday morning there was a dedicated forum, a tribute scarf, and a sub-section of the Sad Boi support that now exclusively follow Old Reliable. They call themselves The Reliables. They are extremely loud.', time: '9 months ago', hot: false, author: 'Long Reads' },
{ id: 109, headline: 'THE SCARF ECONOMY — HOW PANIKOVA MERCH DEFIED PHYSICS', image: '/uploads/news-panikova.png', tag: 'CULTURE', tagColor: '#9b5de5', kicker: 'Market Report', summary: 'The Panikova scarf has appreciated 240% year-on-year. Economists are confused. Fans are scarved.', body: 'Resale data shows the Panikova scarf trading hands for figures normally reserved for trading cards. The club has, sensibly, increased production. The aura, regrettably, cannot be cloned.', time: '10 months ago', hot: false, author: 'Market Desk' },
{ id: 110, headline: 'PRE-SEASON IN THE FOG: 8 DAYS, 0 SIGHTINGS, 1 LEGEND', image: '/uploads/news-aurapulse.png', tag: 'LORE', tagColor: '#f4a261', kicker: 'Pre-Season Diary', summary: 'A camp held in such dense fog the players claim they only ever saw each other in flashes. The vibes survived.', body: 'Eight days of training. Zero verified sightings of the goalposts. The squad emerged with renewed faith in spatial awareness and a profound mistrust of weather forecasts. Gymskin claims he scored seven, all unconfirmed. Panikova claims he was visited.', time: '11 months ago', hot: false, author: 'Long Reads' },
{ id: 111, headline: 'THE GREAT KIT DEBATE — WHY THE COLLAR MATTERS', image: '/uploads/news-bus-dog.png', tag: 'CULTURE', tagColor: '#9b5de5', kicker: 'Design Desk', summary: 'Three weeks of internal discussion. Two prototypes. One collar. We tell the full story of how the home shirt was won.', body: 'A polo collar was floated. A polo collar was rejected. A V-neck nearly made the final cut before being stopped at the door by Nanna Tate herself. The eventual collar — restrained, ribbed, briefly contrasting — required 14 mock-ups. We have all of them.', time: '1 year ago', hot: false, author: 'Design Desk' },
{ id: 112, headline: 'THE CALIBRATED ZONE — A SCIENCE PIECE', image: '/uploads/news-coffee.png', tag: 'ANALYSIS', tagColor: '#e9c46a', kicker: 'Long Read', summary: 'A peer-reviewed-by-no-one investigation into the 95° threshold. Spoiler: the science is real, the methodology is loose.', body: 'We commissioned a thermometer. We commissioned a second thermometer for control purposes. We brewed 28 cups. The data is in. The data is also incomplete. Gymskin declined to participate but did review our findings. He gave them, in his words, "a respectful nod".', time: '1 year ago', hot: false, author: 'Stats Desk' }];

const ALL_NEWS = SORTED_NEWS.concat(OLDER_NEWS);


const FIXTURES = [
{ id: 1, opponent: 'FC Midnight', date: 'May 3', time: '20:00', home: true, result: null, competition: 'Premier League' },
{ id: 2, opponent: 'The Ronaldo Enjoyers', date: 'Apr 26', time: 'FT', home: false, result: { us: 4, them: 2 }, scorers: ['Gymskin 23\'', 'Panikova 41\'', 'Panikova 67\'', 'Donny P 88\''], competition: 'Premier League', motm: 'Gymskin', narrative: 'Gymskin activated Aura Pulse in the 67th minute. Three goals in 21 minutes followed. Coincidence? No.' },
{ id: 3, opponent: 'Vibes Only United', date: 'Apr 19', time: 'FT', home: true, result: { us: 2, them: 2 }, scorers: ['Karavavov 12\'', 'M. Silva 89\''], competition: 'Premier League', motm: 'Watts', narrative: 'Silva\'s header from a corner nobody asked for saved the point. He said nothing.' },
{ id: 4, opponent: 'Banter FC', date: 'Apr 12', time: 'FT', home: false, result: { us: 6, them: 1 }, scorers: ['Panikova 8\' 22\' 45\'', 'Gymskin 51\' 78\'', 'Donny P 90+3\''], competition: 'Cup', motm: 'Panikova', narrative: 'Hat-trick in first half. Calm phase unlocked briefly. Then Panikova tried to dribble the keeper. Classic.' },
{ id: 5, opponent: 'The Metaphysicals', date: 'Apr 5', time: 'FT', home: true, result: { us: 1, them: 3 }, scorers: ['Ricciardo 44\''], competition: 'Premier League', motm: 'Watts', narrative: 'Ricciardo scored one goal and attempted 34 crosses. None were completed. He scored from open play. We\'ve stopped questioning it.' },
{ id: 6, opponent: 'Galaxy Brain XI', date: 'May 10', time: '19:45', home: true, result: null, competition: 'Cup' }];


const LEAGUE_TABLE = [
{ pos: 1, team: 'FC Midnight', p: 28, w: 20, d: 4, l: 4, gd: 34, pts: 64, form: ['W', 'W', 'W', 'D', 'W'] },
{ pos: 2, team: 'Sad Boi Clique FC', p: 28, w: 18, d: 5, l: 5, gd: 28, pts: 59, form: ['W', 'D', 'W', 'L', 'W'], us: true },
{ pos: 3, team: 'Vibes Only United', p: 28, w: 16, d: 7, l: 5, gd: 19, pts: 55, form: ['D', 'W', 'D', 'W', 'L'] },
{ pos: 4, team: 'The Metaphysicals', p: 28, w: 14, d: 6, l: 8, gd: 12, pts: 48, form: ['W', 'L', 'W', 'W', 'D'] },
{ pos: 5, team: 'Banter FC', p: 28, w: 12, d: 5, l: 11, gd: -2, pts: 41, form: ['L', 'L', 'W', 'D', 'L'] },
{ pos: 6, team: 'Galaxy Brain XI', p: 28, w: 10, d: 8, l: 10, gd: -8, pts: 38, form: ['D', 'W', 'L', 'D', 'W'] },
{ pos: 7, team: 'The Ronaldo Enjoyers', p: 28, w: 8, d: 4, l: 16, gd: -21, pts: 28, form: ['L', 'L', 'L', 'L', 'W'] }];


// ── NavBar ─────────────────────────────────────────────────────
// `onExit` (optional) is wired up by App.tsx and returns to the landing
// splash. We render it as a regular nav item (after BASKET) so it can't
// overlap the menu at any viewport — earlier it was a separate floating
// button positioned absolutely over the nav, which collided with menu
// items at certain widths.
const NavBar = ({ page, setPage, onExit }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const auth = useAuth();
  // Admin link is appended only when the signed-in user has is_admin = true.
  const baseNavItems = [
  { id: 'home', label: 'HOME' },
  { id: 'news', label: 'NEWS' },
  { id: 'squad', label: 'SQUAD' },
  { id: 'stats', label: 'STATS' },
  { id: 'transfers', label: 'TRANSFERS' },
  { id: 'fixtures', label: 'FIXTURES' },
  // 'league' (the parody Premier-League-style table) removed at user request —
  // no real-world table exists for an EA Pro Clubs custom club. The page
  // component still exists but is unreachable through the main nav.
  { id: 'store', label: 'STORE' }];
  const navItems = [
    ...baseNavItems,
    ...(auth.profile?.is_admin ? [{ id: 'admin', label: 'ADMIN' }] : []),
    { id: 'account', label: '' },
    { id: 'basket',  label: 'BASKET' },
    ...(onExit ? [{ id: 'exit', label: 'EXIT' }] : []),
  ];

  const handleNav = (id) => {
    if (id === 'exit') { setMobileOpen(false); onExit?.(); return; }
    setPage(id);
    setMobileOpen(false);
  };
  return (
    <nav className="sbc-nav" style={{
      position: 'relative',
      background: '#030810', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(228,0,43,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 64
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => handleNav('home')}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(228,0,43,0.15)', border: '1px solid rgba(228,0,43,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
          boxShadow: '0 0 12px rgba(228,0,43,0.35)'
        }}>
          <img src="/uploads/LCFC_white_primary_logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '5px' }} alt="SBCFC" />
        </div>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '0.12em', color: 'var(--accent)', lineHeight: 1 }}>SAD BOI CLIQUE</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 500, fontSize: 10, letterSpacing: '0.2em', color: 'rgba(228,0,43,0.7)', lineHeight: 1 }}>F.C. • EST. FC26</div>
        </div>
      </div>
      <div className="sbc-nav-links" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {navItems.map((item) =>
        <button key={item.id} onClick={() => handleNav(item.id)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
          fontSize: 12, letterSpacing: '0.15em',
          color: page === item.id ? 'var(--accent)' : 'rgba(220,230,255,0.55)',
          padding: '8px 12px', borderRadius: 4,
          borderBottom: page === item.id ? '2px solid var(--accent)' : '2px solid transparent',
          transition: 'all 0.2s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4
        }}
        onMouseEnter={(e) => {if (page !== item.id) e.currentTarget.style.color = 'var(--accent)';}}
        onMouseLeave={(e) => {if (page !== item.id) e.currentTarget.style.color = 'rgba(220,230,255,0.55)';}}>
          
            {item.id === 'account' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>
            ) : item.id === 'basket' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(228,0,43,0.15)', border: '1px solid rgba(228,0,43,0.45)', borderRadius: 999, padding: '4px 10px 4px 8px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18l-2 12H5L3 6z"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 11 }}>£0.00</span>
              </span>
            ) : item.id === 'exit' ? (
              <><span style={{ fontSize: 14 }}>←</span><span>EXIT</span></>
            ) : item.label}
          </button>
        )}
      </div>
      <div className="sbc-nav-sponsor" style={{
        fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.1em',
        color: 'rgba(220,230,255,0.35)', textAlign: 'right', lineHeight: 1.3,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
      }}>
        <span className="sbc-sponsor-label" style={{ color: 'rgba(228,0,43,0.7)', fontWeight: 700 }}>SPONSORED BY</span>
        <span className="sbc-sponsor-name" style={{ fontWeight: 600, fontSize: 11, color: 'rgba(220,230,255,0.5)' }}>NANNA TATE</span>
        <span className="sbc-sponsor-tag" style={{ fontSize: 9, color: 'rgba(220,230,255,0.3)' }}>POTATO PERFECTION</span>
      </div>
      {/* Mobile burger */}
      <button className="sbc-burger" onClick={() => setMobileOpen(!mobileOpen)} style={{
        display: 'none', background: 'none', border: 'none', flexDirection: 'column', gap: 5, padding: 8, cursor: 'pointer'
      }}>
        <span style={{ width: 22, height: 2, background: mobileOpen ? 'var(--accent)' : '#eef2ff', transition: 'all 0.2s', transform: mobileOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
        <span style={{ width: 22, height: 2, background: '#eef2ff', transition: 'all 0.2s', opacity: mobileOpen ? 0 : 1 }} />
        <span style={{ width: 22, height: 2, background: mobileOpen ? 'var(--accent)' : '#eef2ff', transition: 'all 0.2s', transform: mobileOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
      </button>
      {/* Mobile dropdown */}
      {mobileOpen &&
      <div className="sbc-mobile-menu" style={{
        position: 'absolute', top: 64, left: 0, right: 0, background: 'rgba(3,8,16,0.98)',
        backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(228,0,43,0.3)',
        display: 'flex', flexDirection: 'column', padding: '12px 0', zIndex: 100
      }}>
          {navItems.map((item) =>
        <button key={item.id} onClick={() => handleNav(item.id)} style={{
          background: page === item.id ? 'rgba(228,0,43,0.12)' : 'none', border: 'none',
          borderLeft: page === item.id ? '3px solid var(--accent)' : '3px solid transparent',
          fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: '0.15em',
          color: page === item.id ? 'var(--accent)' : 'rgba(220,230,255,0.7)',
          padding: '14px 28px', textAlign: 'left', textTransform: 'uppercase', cursor: 'pointer'
        }}>{item.id === 'account' ? '—  ACCOUNT' : item.id === 'basket' ? '—  BASKET (£0.00)' : item.id === 'exit' ? '←  EXIT' : item.label}</button>
        )}
        </div>
      }
    </nav>);

};

// ── PlayerCard ────────────────────────────────────────────────
const RARITY_CONFIGS = {
  icon: { bg: 'linear-gradient(145deg, #1a0a00, #3d1a00)', border: '#e6a817', glow: 'rgba(230,168,23,0.5)', label: 'ICON' },
  legend: { bg: 'linear-gradient(145deg, #0d0020, #1e0040)', border: '#9b5de5', glow: 'rgba(155,93,229,0.5)', label: 'LEGEND' },
  rare: { bg: 'linear-gradient(145deg, #000a1e, #001840)', border: '#4361ee', glow: 'rgba(67,97,238,0.4)', label: 'RARE' },
  common: { bg: 'linear-gradient(145deg, #070d18, #0d1626)', border: 'rgba(80,110,160,0.5)', glow: 'rgba(80,110,160,0.2)', label: '' }
};

const PlayerCard = ({ player, onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  const cfg = RARITY_CONFIGS[player.rarity];
  const statKeys = player.position === 'GK' ? ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'] : ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];

  return (
    <div
      onClick={() => onClick(player)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 200, flexShrink: 0, borderRadius: 8, overflow: 'hidden',
        cursor: 'pointer', position: 'relative', height: 300,
        border: `1px solid ${hovered ? 'var(--accent)' : cfg.border + '80'}`,
        transition: 'all 0.3s cubic-bezier(0.2,0,0,1)',
        transform: hovered ? 'translateY(-8px) scale(1.02)' : 'none',
        boxShadow: hovered ? '0 20px 60px rgba(228,0,43,0.35)' : '0 4px 20px rgba(0,0,0,0.5)',
        background: '#0a1628'
      }}>
      
      {player.image ?
      <>
          <img src={player.image} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block', position: 'absolute', inset: 0 }} alt={player.name} />
          <div style={{ position: 'absolute', inset: 0, background: hovered ? 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' : 'linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)', transition: 'all 0.3s' }} />
        </> :

      <>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #0d1f3c, #050d1a)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\'%3E%3Ctext x=\'30\' y=\'42\' text-anchor=\'middle\' font-size=\'32\' fill=\'rgba(255,255,255,0.025)\'%3E⚜%3C/text%3E%3C/svg%3E")' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-60%)', fontFamily: 'Anton, sans-serif', fontSize: 80, color: `${player.accentColor}18`, letterSpacing: '-0.02em', lineHeight: 1, userSelect: 'none' }}>{player.number}</div>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `linear-gradient(225deg, ${player.accentColor}15, transparent)` }} />
        </>
      }

      {/* Top: rating + rarity */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, lineHeight: 1, color: hovered ? 'var(--accent)' : cfg.border, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{player.rating}</div>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 2 }}>{player.position}</div>
      </div>

      {/* Top right: rarity badge */}
      {cfg.label && <div style={{ position: 'absolute', top: 12, right: 12, fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: cfg.border, background: `${cfg.border}22`, padding: '3px 7px', borderRadius: 2, border: `1px solid ${cfg.border}44` }}>{cfg.label}</div>}

      {/* Bottom: name + stats */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 12px 10px' }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: '#fff', textTransform: 'uppercase', lineHeight: 1, letterSpacing: '0.02em', marginBottom: 4, textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>{player.shortName}</div>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: 'rgba(218,218,218,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{player.archetype}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2 }}>
          {statKeys.map((k) =>
          <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 12, color: player.stats[k] >= 85 ? 'var(--accent)' : 'rgba(255,255,255,0.85)', lineHeight: 1 }}>{player.stats[k]}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 7, color: 'rgba(218,218,218,0.4)', letterSpacing: '0.05em' }}>{k}</div>
            </div>
          )}
        </div>
      </div>

      {/* Red top bar on hover */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--accent)', transform: hovered ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.3s' }} />

      {/* Hover CTA */}
      {hovered &&
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--accent)', color: '#fff', fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.1em', padding: '8px 16px', borderRadius: 3, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>VIEW PROFILE →</div>
      }
    </div>);

};

// ── Breaking News Ticker ────────────────────────────────────────
const BreakingTicker = () => {
  const headlines = [
  '⚡ PANIKOVA: THE PANIC RETURNS?',
  '🟣 GYMSKIN ACTIVATES AURA PULSE IN 4-2 THRILLER',
  '🔴 DONNY P MISSES SITTER — CLAIMS "WIND RESISTANCE"',
  '🔵 RICCIARDO STILL HASN\'T COMPLETED A CROSS — WEEK 23',
  '⚡ KARAVAVOV: "THE RISKY PASS WAS THE RIGHT PASS"',
  '🔴 PANIKOVA CLAIMS HE SAW SIGNS IN A FERN AGAIN',
  '🟡 HERE WE GO — TRANSFER ANNOUNCEMENT IMMINENT',
  '🟣 GYMSKIN REFUSES KICKOFF BEFORE COFFEE CALIBRATION'];

  const full = [...headlines, ...headlines];
  return (
    <div className="sbc-ticker" style={{ background: 'rgba(255,251,243,0.96)', overflow: 'hidden', whiteSpace: 'nowrap', borderTop: '1px solid rgba(228,0,43,0.25)', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
      <div style={{ display: 'inline-flex', animation: 'ticker 40s linear infinite' }}>
        {full.map((h, i) =>
        <span key={i} className="sbc-ticker-item" style={{ fontFamily: 'Anton, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.18em', color: 'var(--accent)', padding: '8px 32px', textTransform: 'uppercase' }}>
            {h}
          </span>
        )}
      </div>
    </div>);

};

// ── Stat Bar ────────────────────────────────────────────────────
const StatBar = ({ label, value, color, max = 99 }) => {
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {const t = setTimeout(() => setWidth(value), 100);return () => clearTimeout(t);}, [value]);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(220,230,255,0.7)' }}>{label}</span>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 800, color }}>{value}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width / max * 100}%`, background: color, borderRadius: 2, transition: 'width 1s cubic-bezier(0.2,0,0,1)', boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>);

};

// ── Rainbow Bar (kit trim) ──────────────────────────────────────
const RainbowBar = ({ height = 3 }) =>
<div style={{ height, background: 'linear-gradient(90deg, #e63946, #f4a261, #e9c46a, #2a9d8f, #4361ee, #9b5de5)', flexShrink: 0 }} />;


// ── Tag Chip ────────────────────────────────────────────────────
const TagChip = ({ label, color = 'rgba(0,200,255,0.15)', textColor = '#00c8ff' }) =>
<span style={{
  fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 700,
  letterSpacing: '0.1em', color: textColor, background: color,
  padding: '3px 8px', borderRadius: 3, border: `1px solid ${textColor}33`, whiteSpace: 'nowrap'
}}>{label}</span>;


// (exports merged into single file)



// ============================================================
// SBCFC PAGE COMPONENTS
// ============================================================
// Note: window refs are resolved lazily at render time, not at parse time

const getRefs = () => ({
  PLAYERS, NEWS_ITEMS, FIXTURES, LEAGUE_TABLE,
  NavBar, BreakingTicker, StatBar, RainbowBar, TagChip
});

// ── Player Profile Modal ────────────────────────────────────────
const PlayerProfileModal = ({ player, onClose }) => {
  const [tab, setTab] = React.useState('overview');
  const [panicLevel, setPanicLevel] = React.useState(42);
  const [riskLevel, setRiskLevel] = React.useState(50);
  const [perfLevel, setPerfLevel] = React.useState(60);
  const [auraAngle, setAuraAngle] = React.useState(0);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {const t = setTimeout(() => setVisible(true), 10);return () => clearTimeout(t);}, []);

  React.useEffect(() => {
    if (player.id === 'panikova') {
      const iv = setInterval(() => setPanicLevel((v) => Math.max(15, Math.min(95, v + (Math.random() - 0.4) * 18))), 1200);
      return () => clearInterval(iv);
    }
    if (player.id === 'karavavov') {
      const iv = setInterval(() => setRiskLevel((v) => Math.max(5, Math.min(98, v + (Math.random() - 0.5) * 30))), 900);
      return () => clearInterval(iv);
    }
    if (player.id === 'ricciardo') {
      const iv = setInterval(() => setPerfLevel((v) => Math.max(5, Math.min(98, v + (Math.random() - 0.5) * 35))), 1400);
      return () => clearInterval(iv);
    }
    if (player.id === 'gymskin') {
      const iv = setInterval(() => setAuraAngle((a) => (a + 2) % 360), 20);
      return () => clearInterval(iv);
    }
  }, [player.id]);

  const handleClose = () => {setVisible(false);setTimeout(onClose, 300);};
  const statKeys = player.position === 'GK' ? ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'] : ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
  const statColors = { PAC: '#f4a261', SHO: 'var(--accent)', PAS: '#4361ee', DRI: '#9b5de5', DEF: '#2a9d8f', PHY: '#e9c46a', DIV: '#00c8ff', HAN: '#4361ee', KIC: '#f4a261', REF: '#9b5de5', SPD: 'var(--accent)', POS: '#2a9d8f' };
  const getPanicColor = (v) => v < 30 ? '#2a9d8f' : v < 60 ? '#e9c46a' : 'var(--accent)';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', opacity: visible ? 1 : 0, transition: 'opacity 0.3s' }}
    onClick={(e) => {if (e.target === e.currentTarget) handleClose();}}>
      <div className="sbc-player-modal" style={{ width: '94vw', maxWidth: 940, maxHeight: '90vh', overflowY: 'auto', background: '#080f1e', border: `1px solid ${player.accentColor}44`, borderRadius: 12, position: 'relative', boxShadow: `0 0 80px ${player.glowColor}, 0 40px 80px rgba(0,0,0,0.85)`, transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)', transition: 'all 0.35s cubic-bezier(0.2,0,0,1)' }}>

        {/* IMAGE HEADER */}
        {player.image ?
        <div style={{ position: 'relative', height: 340, overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
            <img src={player.image} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} alt={player.name} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, #080f1e 0%, rgba(8,15,30,0.6) 40%, rgba(8,15,30,0.1) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${player.accentColor}22, transparent 60%)` }} />
            {/* Close */}
            <button onClick={handleClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(218,218,218,0.7)', borderRadius: 6, cursor: 'pointer', padding: '6px 14px', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', backdropFilter: 'blur(8px)' }}>✕ CLOSE</button>
            {/* Rating badge */}
            <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(8,15,30,0.85)', border: `2px solid ${player.accentColor}`, borderRadius: 8, padding: '8px 14px', backdropFilter: 'blur(12px)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: player.accentColor, lineHeight: 1 }}>{player.rating}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.6)', textTransform: 'uppercase' }}>{player.position}</div>
            </div>
            {/* Player name overlay */}
            <div style={{ position: 'absolute', bottom: 20, left: 28, right: 28 }}>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: player.accentColor, marginBottom: 4, textTransform: 'uppercase' }}>#{player.number} · {player.archetype}</div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 42, color: '#fff', lineHeight: 0.9, textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>{player.name}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {player.tags.slice(0, 3).map((t, i) => <span key={i} style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: player.accentColor, background: `${player.accentColor}22`, padding: '3px 8px', borderRadius: 3, border: `1px solid ${player.accentColor}33`, textTransform: 'uppercase' }}>{t}</span>)}
              </div>
            </div>
          </div> : (

        /* No image: gradient header */
        <div style={{ position: 'relative', height: 200, overflow: 'hidden', borderRadius: '12px 12px 0 0', background: `linear-gradient(135deg, ${player.accentColor}33, #080f1e)` }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 120, color: `${player.accentColor}18`, lineHeight: 1 }}>#{player.number}</div>
            </div>
            <button onClick={handleClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(218,218,218,0.7)', borderRadius: 6, cursor: 'pointer', padding: '6px 14px', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em' }}>✕ CLOSE</button>
            <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(8,15,30,0.85)', border: `2px solid ${player.accentColor}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: player.accentColor, lineHeight: 1 }}>{player.rating}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.6)', textTransform: 'uppercase' }}>{player.position}</div>
            </div>
            <div style={{ position: 'absolute', bottom: 20, left: 28 }}>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: player.accentColor, marginBottom: 4, textTransform: 'uppercase' }}>#{player.number} · {player.archetype}</div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: '#fff', textTransform: 'uppercase' }}>{player.name}</div>
            </div>
          </div>)
        }

        <RainbowBar height={3} />

        {/* Key stats banner */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${player.accentColor}22` }}>
          {player.goals !== null &&
          <div style={{ flex: 1, padding: '14px 0', textAlign: 'center', borderRight: `1px solid ${player.accentColor}22` }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: player.accentColor }}>{player.goals}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase' }}>Goals</div>
            </div>
          }
          {player.assists !== null &&
          <div style={{ flex: 1, padding: '14px 0', textAlign: 'center', borderRight: `1px solid ${player.accentColor}22` }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: player.accentColor }}>{player.assists}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase' }}>Assists</div>
            </div>
          }
          {player.cleanSheets !== null &&
          <div style={{ flex: 1, padding: '14px 0', textAlign: 'center', borderRight: `1px solid ${player.accentColor}22` }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: player.accentColor }}>{player.cleanSheets}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase' }}>Clean Sheets</div>
            </div>
          }
          <div style={{ flex: 1, padding: '14px 0', textAlign: 'center', borderRight: `1px solid ${player.accentColor}22` }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: player.accentColor }}>{player.apps}</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase' }}>Apps</div>
          </div>
          {/* Goals-per-game cell. Always rendered so the row stays consistent
              shape across players. Shows "—" when the ratio isn't computable
              (apps = 0, e.g. a player who has never appeared yet) — earlier
              the truthy check `player.goals && player.apps` returned the
              literal 0 for Old Reliable, which JSX rendered as a bare "0"
              outside any styled cell. */}
          <div style={{ flex: 1, padding: '14px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: player.accentColor }}>
              {player.apps > 0 ? (Number(player.goals || 0) / player.apps).toFixed(2) : '—'}
            </div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase' }}>G/Game</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${player.accentColor}22`, padding: '0 28px' }}>
          {['OVERVIEW', 'STATS', 'LORE'].map((t) =>
          <button key={t} onClick={() => setTab(t.toLowerCase())} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '14px 20px', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.15em', color: tab === t.toLowerCase() ? player.accentColor : 'rgba(218,218,218,0.35)', borderBottom: tab === t.toLowerCase() ? `2px solid ${player.accentColor}` : '2px solid transparent', transition: 'all 0.2s', textTransform: 'uppercase' }}>{t}</button>
          )}
        </div>

        {/* Tab content */}
        <div style={{ padding: '24px 28px 32px' }}>
          {tab === 'overview' &&
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
              <div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.35)', marginBottom: 16, textTransform: 'uppercase' }}>Attributes</div>
                {statKeys.map((k) => <StatBar key={k} label={k} value={player.stats[k]} color={statColors[k] || player.accentColor} />)}
              </div>
              <div>
                {player.id === 'panikova' &&
              <div>
                    <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.35)', marginBottom: 16, textTransform: 'uppercase' }}>PANIC METER™</div>
                    <div style={{ background: 'rgba(228,0,43,0.07)', border: '1px solid rgba(228,0,43,0.25)', borderRadius: 8, padding: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.5)' }}>STABILITY</span>
                        <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: getPanicColor(panicLevel), transition: 'color 0.5s' }}>{Math.round(panicLevel)}%</span>
                      </div>
                      <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
                        <div style={{ height: '100%', width: `${panicLevel}%`, background: `linear-gradient(90deg, #2a9d8f, ${getPanicColor(panicLevel)})`, transition: 'width 0.8s, background 0.5s', borderRadius: 5 }} />
                      </div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'rgba(218,218,218,0.4)', fontStyle: 'italic', textAlign: 'center' }}>
                        {panicLevel < 30 ? '🟢 CALM PHASE ACTIVE' : panicLevel < 60 ? '🟡 ELEVATED ENERGY' : '🔴 FULL PANIC MODE'}
                      </div>
                    </div>
                    <div style={{ marginTop: 16 }}>
                      {player.tags.map((t, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} /><span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.7)' }}>{t}</span></div>)}
                    </div>
                  </div>
              }
                {player.id === 'gymskin' &&
              <div>
                    <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.35)', marginBottom: 16, textTransform: 'uppercase' }}>AURA STATUS</div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                      <div style={{ position: 'relative', width: 110, height: 110 }}>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(from ${auraAngle}deg, #9b5de5, #00c8ff, #e9c46a, #9b5de5)`, filter: 'blur(8px)', opacity: 0.75 }} />
                        <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', background: '#080f1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#9b5de5' }}>ACTIVE</div>
                          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, color: 'rgba(218,218,218,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Aura Pulse</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(155,93,229,0.08)', border: '1px solid rgba(155,93,229,0.25)', borderRadius: 6, padding: 12, marginBottom: 10 }}>
                      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 12, color: '#9b5de5', marginBottom: 4, textTransform: 'uppercase' }}>☕ Coffee Protocol</div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.6)' }}>Target temp: <span style={{ color: '#9b5de5', fontWeight: 700 }}>95°C exactly</span>. ±1° margin: UNACCEPTABLE.</div>
                    </div>
                    {player.tags.map((t, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#9b5de5', flexShrink: 0 }} /><span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.7)' }}>{t}</span></div>)}
                  </div>
              }
                {player.id === 'karavavov' &&
              <div>
                    <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.35)', marginBottom: 16, textTransform: 'uppercase' }}>RISK METER™</div>
                    <div style={{ background: 'rgba(244,162,97,0.07)', border: '1px solid rgba(244,162,97,0.25)', borderRadius: 8, padding: 18, marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: '#2a9d8f' }}>SAFE</span>
                        <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'var(--accent)' }}>FULL CHAOS</span>
                      </div>
                      <div style={{ height: 14, background: 'linear-gradient(90deg, rgba(42,157,143,0.3), rgba(233,196,106,0.3), rgba(228,0,43,0.3))', borderRadius: 7, position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '50%', transform: 'translate(-50%,-50%)', left: `${riskLevel}%`, width: 20, height: 20, borderRadius: '50%', background: '#f4a261', boxShadow: '0 0 12px rgba(244,162,97,0.8)', transition: 'left 0.6s cubic-bezier(0.2,0,0,1)', border: '2px solid #fff' }} />
                      </div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'rgba(218,218,218,0.4)', textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
                        {riskLevel < 30 ? 'Playing it safe... temporarily.' : riskLevel < 70 ? 'Medium chaos. Warming up.' : '🔥 FULL KARAVAVOV MODE'}
                      </div>
                    </div>
                    {player.tags.map((t, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f4a261', flexShrink: 0 }} /><span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.7)' }}>{t}</span></div>)}
                  </div>
              }
                {player.id === 'ricciardo' &&
              <div>
                    <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.35)', marginBottom: 16, textTransform: 'uppercase' }}>PERFORMANCE VARIANCE</div>
                    <div style={{ background: 'rgba(0,200,255,0.07)', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 8, padding: 18, marginBottom: 14 }}>
                      <div style={{ height: 12, background: 'linear-gradient(90deg, var(--accent), #e9c46a, #2a9d8f)', borderRadius: 6, position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '50%', left: `${perfLevel}%`, transform: 'translate(-50%,-50%)', width: 18, height: 18, borderRadius: '50%', background: '#00c8ff', boxShadow: '0 0 14px rgba(0,200,255,0.9)', transition: 'left 0.8s cubic-bezier(0.2,0,0,1)', border: '2px solid #fff' }} />
                      </div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: '#00c8ff', textAlign: 'center', marginTop: 10, fontStyle: 'italic' }}>
                        {perfLevel < 25 ? '💀 FRAUDULENT PERFORMANCE' : perfLevel < 50 ? '📉 BELOW EXPECTATIONS' : perfLevel < 75 ? '📈 ACTUALLY DECENT' : '🔥 LOCKED IN (STILL NO CROSS)'}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(228,0,43,0.07)', border: '1px solid rgba(228,0,43,0.2)', borderRadius: 6, padding: 12 }}>
                      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 12, color: 'var(--accent)', marginBottom: 4, textTransform: 'uppercase' }}>Cross Completion Rate</div>
                      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: 'var(--accent)' }}>0.0%</div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>1,247 ATTEMPTS · 0 SUCCESSFUL</div>
                    </div>
                  </div>
              }
                {!['panikova', 'gymskin', 'karavavov', 'ricciardo'].includes(player.id) &&
              <div>
                    <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.35)', marginBottom: 16, textTransform: 'uppercase' }}>Traits</div>
                    {player.tags.map((t, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: player.accentColor, flexShrink: 0 }} /><span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.7)' }}>{t}</span></div>)}
                    <div style={{ marginTop: 18, fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.5)', lineHeight: 1.65, fontStyle: 'italic', borderLeft: `2px solid ${player.accentColor}44`, paddingLeft: 12 }}>{player.lore}</div>
                  </div>
              }
              </div>
            </div>
          }

          {tab === 'stats' &&
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.35)', marginBottom: 18, textTransform: 'uppercase' }}>Career Stats</div>
                {[['APPEARANCES', player.apps], ['GOALS', player.goals ?? 'N/A'], ['ASSISTS', player.assists ?? 'N/A'], ['CLEAN SHEETS', player.cleanSheets ?? 'N/A'], ['G/GAME', player.goals ? (player.goals / player.apps).toFixed(2) : 'N/A']].map(([l, v], i) =>
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase' }}>{l}</span>
                    <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: player.accentColor }}>{v}</span>
                  </div>
              )}
              </div>
              <div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.35)', marginBottom: 18, textTransform: 'uppercase' }}>Attributes</div>
                {statKeys.map((k) => <StatBar key={k} label={k} value={player.stats[k]} color={statColors[k] || player.accentColor} />)}
              </div>
            </div>
          }

          {tab === 'lore' &&
          <div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 14, color: 'rgba(218,218,218,0.6)', lineHeight: 1.75, marginBottom: 28, fontStyle: 'italic', borderLeft: `3px solid ${player.accentColor}`, paddingLeft: 16 }}>{player.lore}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.35)', marginBottom: 18, textTransform: 'uppercase' }}>Timeline</div>
              {player.timeline.map((item, i) =>
            <div key={i} style={{ display: 'flex', gap: 18, position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 18, flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: player.accentColor, boxShadow: `0 0 8px ${player.glowColor}`, flexShrink: 0, marginTop: 4 }} />
                    {i < player.timeline.length - 1 && <div style={{ width: 2, flex: 1, background: `${player.accentColor}33`, minHeight: 28 }} />}
                  </div>
                  <div style={{ paddingBottom: 24 }}>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: player.accentColor, marginBottom: 4, textTransform: 'uppercase' }}>{item.era}</div>
                    <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.6)', lineHeight: 1.55 }}>{item.note}</div>
                  </div>
                </div>
            )}
            </div>
          }
        </div>
      </div>
    </div>);

};

// ── Store carousel: auto-scroll + click-and-drag ─────────────────
const StoreCarousel = ({ loop, setPage }) => {
  const trackRef = React.useRef(null);
  const wrapRef  = React.useRef(null);
  const offsetRef = React.useRef(0);     // current translateX (negative)
  const halfRef   = React.useRef(0);     // width of one copy of the items
  const dragRef   = React.useRef({ active: false, startX: 0, startOffset: 0, moved: 0, pointerId: null });
  const rafRef    = React.useRef(0);
  const lastTRef  = React.useRef(0);
  const SPEED     = 38; // px/sec

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      // half = total scrollWidth / 2 because we duplicated the list
      halfRef.current = track.scrollWidth / 2;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener('resize', measure);

    const tick = (t) => {
      const dt = lastTRef.current ? (t - lastTRef.current) / 1000 : 0;
      lastTRef.current = t;
      if (!dragRef.current.active && halfRef.current > 0) {
        offsetRef.current -= SPEED * dt;
      }
      // Wrap by one duplicated copy width so the carousel loops seamlessly.
      // If a drag is active and we wrap, we also shift the drag's startOffset
      // by the same amount — otherwise the user's next pointermove would
      // suddenly translate the track by a full copy width, briefly emptying
      // the right side of the carousel.
      if (halfRef.current > 0) {
        if (offsetRef.current <= -halfRef.current) {
          offsetRef.current += halfRef.current;
          if (dragRef.current.active) dragRef.current.startOffset += halfRef.current;
        }
        if (offsetRef.current > 0) {
          offsetRef.current -= halfRef.current;
          if (dragRef.current.active) dragRef.current.startOffset -= halfRef.current;
        }
      }
      track.style.transform = `translate3d(${offsetRef.current}px,0,0)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const onPointerDown = (e) => {
    // Only primary button / touch / pen
    if (e.button !== undefined && e.button !== 0) return;
    const wrap = wrapRef.current;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startOffset: offsetRef.current,
      moved: 0,
      pointerId: e.pointerId
    };
    lastTRef.current = 0;
    try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
    wrap.style.cursor = 'grabbing';
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    d.moved = Math.max(d.moved, Math.abs(dx));
    offsetRef.current = d.startOffset + dx;
  };
  const endDrag = (e) => {
    const d = dragRef.current;
    if (!d.active) return;
    const wrap = wrapRef.current;
    try { wrap.releasePointerCapture(d.pointerId); } catch (err) {}
    wrap.style.cursor = 'grab';
    d.active = false;
    lastTRef.current = 0;
  };

  const handleCardClick = (item) => (e) => {
    if (dragRef.current.moved > 5) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    try { localStorage.setItem('sbc_focus_product', String(item.productId)); } catch (err) {}
    setPage('store');
  };

  return (
    <div
      ref={wrapRef}
      className="sbc-store-carousel"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{ position: 'relative', overflow: 'hidden', cursor: 'grab', userSelect: 'none', touchAction: 'pan-y', maskImage: 'linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)' }}
    >
      <div ref={trackRef} className="sbc-store-track" style={{ display: 'flex', gap: 16, width: 'max-content', willChange: 'transform' }}>
        {loop.map((item, i) =>
          <div key={i} onClick={handleCardClick(item)}
            className="sbc-glow-panel"
            draggable={false}
            style={{ '--panel-color': item.clr, flex: '0 0 240px', width: 240, background: 'rgba(8,15,30,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden', cursor: 'inherit', display: 'flex', flexDirection: 'column' }}>
            <div style={{ aspectRatio: '1 / 1', background: '#0a1322', position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <img src={item.img} alt={item.name} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
              {item.tag && <div style={{ position: 'absolute', top: 10, left: 10, fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: '#fff', background: item.clr, padding: '3px 8px', borderRadius: 2, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{item.tag}</div>}
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.name}</div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: item.clr }}>{item.price}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/** Two-line clamped paragraph; if the source string overflows, an
 *  italic "…continue reading" prompt appears below to signal the panel
 *  is clickable and there's more to read. Used by the homepage rotating
 *  hero card. Truncation is detected by measuring scrollHeight against
 *  clientHeight after layout, so it works across font / viewport
 *  changes (e.g. on resize). */
const TruncatedSubtext = ({ text }) => {
  const ref = React.useRef(null);
  const [truncated, setTruncated] = React.useState(false);
  React.useLayoutEffect(() => {
    setTruncated(false);
    if (!ref.current) return;
    // Allow the new text to settle into the DOM, then compare. scrollHeight
    // exceeds clientHeight whenever the line-clamp had to chop something.
    const id = window.requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      setTruncated(el.scrollHeight > el.clientHeight + 1);
    });
    return () => cancelAnimationFrame(id);
  }, [text]);
  return (
    <div>
      <div ref={ref} style={{
        fontFamily: 'Roboto, sans-serif', fontSize: 14, fontWeight: 300, color: 'rgba(218,218,218,0.75)', maxWidth: 520, lineHeight: 1.55,
        display: '-webkit-box', WebkitLineClamp: 2 as any, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
      }}>{text}</div>
      {truncated && (
        <div style={{
          marginTop: 6,
          fontFamily: 'Roboto, sans-serif', fontSize: 12, fontStyle: 'italic',
          color: 'var(--accent)', letterSpacing: '0.04em',
        }}>…continue reading →</div>
      )}
    </div>
  );
};

// ── HOME PAGE ───────────────────────────────────────────────────
const HomePage = ({ setPage, setSelectedPlayer }) => {
  const [headlineIdx, setHeadlineIdx] = React.useState(0);
  const [pulseValues, setPulseValues] = React.useState({ pos: 0, rate: 0, gd: 0, pts: 0, matches: 0, skill: 0 });
  const players = useLivePlayers();
  const news = useLiveNews();
  const storeItems = useLiveStoreItems();

  // Live fixtures: fetched once. All match-related panels on the home page
  // (LAST RESULT mini-card, CURRENT FORM, the LAST MATCH detail panel,
  // and the RECENT MATCHES grid) are derived from this single list.
  const [liveFixtures, setLiveFixtures] = React.useState/* :FixtureRow[] */([]);
  React.useEffect(() => {
    let cancelled = false;
    getLiveFixtures(20).then((rows) => { if (!cancelled) setLiveFixtures(rows); }).catch(() => { /* keep empty */ });
    return () => { cancelled = true; };
  }, []);

  /** Stash the matchId in localStorage and navigate to the Fixtures page —
   *  FixturesPage reads the same key on mount and auto-expands the match. */
  const goToFixture = (matchId) => {
    try { localStorage.setItem('sbc_focus_match', String(matchId)); } catch (e) { /* ignore */ }
    setPage('fixtures');
  };

  // Derived helpers for the various match panels:
  const lastMatch = liveFixtures[0] || null;
  // Form: oldest → newest order so the row reads left-to-right like a "form line".
  const formLast5 = liveFixtures.slice(0, 5).map((f) => f.result || '?').reverse();
  const lastMatchColor = (r) => r === 'W' ? '#2a9d8f' : r === 'L' ? 'var(--accent)' : '#e9c46a';

  // Headlines mirror the news page order: lead first, then by date. Click jumps straight to that story.
  const headlines = news.slice(0, 4).map((n) => ({
    id: n.id,
    text: (n.headline || '').toUpperCase(),
    sub: n.summary || '',
    tag: n.tag || 'NEWS',
    color: n.tagColor || 'var(--accent)',
    image: n.image || null,
  }));

  // Rotate every 4.5s. Depend on `headlines.length` so the interval resets
  // if the news list grows/shrinks underneath us, and use Math.max so we
  // never modulo by zero (which would NaN the index and crash the panel).
  React.useEffect(() => {
    if (headlines.length <= 1) return;
    const iv = setInterval(() => setHeadlineIdx((i) => (i + 1) % Math.max(1, headlines.length)), 4500);
    return () => clearInterval(iv);
  }, [headlines.length]);
  // Clamp the index whenever the list shrinks, so we don't render undefined
  // (this is the source of the occasional "no data" flicker on the home
  // page — a stale index pointing past the end of a freshly-fetched list).
  React.useEffect(() => {
    if (headlines.length > 0 && headlineIdx >= headlines.length) setHeadlineIdx(0);
  }, [headlines.length, headlineIdx]);

  // Pulse footer values: try live (Supabase, populated by the scraper).
  // Fall back to the prototype's mock numbers if live data isn't available.
  // Once the targets are known, animate from zero to them.
  const [pulseSource, setPulseSource] = React.useState/* :'live'|'mock' */('mock');
  React.useEffect(() => {
    let cancelled = false;
    let frame, start;
    const animateTo = (targets) => {
      const animate = (ts) => {
        if (cancelled) return;
        if (!start) start = ts;
        const p = Math.min((ts - start) / 2200, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setPulseValues({
          pos:     Math.round(targets.pos     * ease) || 1,
          rate:    Math.round(targets.rate    * ease),
          gd:      Math.round(targets.gd      * ease),
          pts:     Math.round(targets.pts     * ease),
          matches: Math.round(targets.matches * ease),
          skill:   Math.round(targets.skill   * ease),
        });
        if (p < 1) frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    };
    (async () => {
      try {
        const live = await getPulseStats();
        if (cancelled) return;
        setPulseSource(live.source);
        animateTo({ pos: live.position, rate: live.winRate, gd: live.goalDifference, pts: live.totalPoints, matches: live.gamesPlayed, skill: live.skillRating ?? 0 });
      } catch {
        if (cancelled) return;
        setPulseSource('mock');
        animateTo({ pos: 2, rate: 64, gd: 28, pts: 59, matches: 280, skill: 0 });
      }
    })();
    return () => { cancelled = true; if (frame) cancelAnimationFrame(frame); };
  }, []);

  const signings = [
  { player: players.find((p) => p.id === 'panikova'),    image: '/uploads/pasted-1777415983890-0.png', caption: 'FROM FERGANA VALLEY, UZBEKISTAN' },
  { player: players.find((p) => p.id === 'gymskin'),     image: '/uploads/pasted-1777416552965-0.png', caption: 'AURA PULSE ACTIVATED' },
  { player: players.find((p) => p.id === 'karavavov'),   image: '/uploads/Karavavov.png',              caption: 'THE MOLDOVAN TRICKSTER' },
  { player: players.find((p) => p.id === 'ricciardo'),   image: '/uploads/Ricciardo.png',              caption: 'THE HONEYBADGER. F1 TO FOOTBALL.' },
  { player: players.find((p) => p.id === 'donnyp'),      image: '/uploads/pasted-1777417166292-0.png', caption: 'STALWART. MAVERICK. CORNER TAKER.' },
  { player: players.find((p) => p.id === 'oldreliable'), image: '/uploads/old-reliable.png',           caption: 'THE GLUE. ALWAYS AVAILABLE.' }];


  const topScorers = [...players].filter((p) => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 5);
  // Defensive fallback so the panel never renders blank if `headlines` is
  // momentarily empty (e.g. between mock fallback and the live fetch).
  const h = headlines[headlineIdx] || { id: '', text: 'SAD BOI CLIQUE FC', sub: 'Loading the latest from the clique…', tag: 'NEWS', color: 'var(--accent)', image: null };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 124 }}>
      {/* HERO — minHeight reduced + top-anchored so the Last Match panel
          stays inside a typical desktop viewport. */}
      <div style={{ position: 'relative', minHeight: 720, marginTop: 92, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 16, paddingBottom: 24 }}>
        {/* Imp graphics as hero bg */}
        {/* Hero dark sheen removed — was creating a darker top vs the rest of the page bg */}

        {/* Red corner-glow gradients removed at user request. */}

        <div className="sbc-hero-row" style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* LEFT: hero content */}
          <div className="sbc-hero-left" style={{ padding: '0 0 0 64px', flex: '0 0 50%', maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 3, height: 20, background: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', textTransform: 'uppercase' }}>Sad Boi Clique FC · LNER Stadium, Lincoln · Est. 2024</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#fff', background: 'var(--accent)', padding: '4px 12px', borderRadius: 2, textTransform: 'uppercase', minWidth: 130, textAlign: 'center', display: 'inline-block', boxSizing: 'border-box' }}>{h.tag}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {headlines.map((_, i) => <div key={i} className={i === headlineIdx ? 'sbc-pagedot sbc-pagedot-active' : 'sbc-pagedot sbc-pagedot-inactive'} style={{ width: i === headlineIdx ? 24 : 6, height: 4, borderRadius: 2, background: i === headlineIdx ? 'var(--accent)' : 'rgba(255,255,255,0.2)', transition: 'all 0.4s' }} />)}
            </div>
            <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
              <button onClick={(e) => { e.stopPropagation(); setHeadlineIdx((i) => (i - 1 + headlines.length) % headlines.length); }}
                aria-label="Previous headline"
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 3, cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 14, transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              >‹</button>
              <button onClick={(e) => { e.stopPropagation(); setHeadlineIdx((i) => (i + 1) % headlines.length); }}
                aria-label="Next headline"
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 3, cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 14, transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              >›</button>
            </div>
          </div>
          {/* Rotating headline + image container. Height is now driven by
              the image (when present) instead of being fixed at 200px, so
              the headline photo sits naturally beneath the text. */}
          <div onClick={() => { try { localStorage.setItem('sbc_focus_news', String(h.id)); } catch (e) {} setPage('news'); }} style={{ position: 'relative', minHeight: 220, marginBottom: 14, cursor: 'pointer' }}>
            <div key={headlineIdx} style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeInHeadline 0.5s ease' }}>
              <div className="sbc-glow-heading" style={{
                fontFamily: 'Anton, sans-serif', fontSize: 'clamp(28px, 4.2vw, 54px)', lineHeight: 0.95, color: '#fff', maxWidth: 820, textTransform: 'uppercase',
                display: '-webkit-box', WebkitLineClamp: 2 as any, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
              }}>{h.text}</div>
              <TruncatedSubtext text={h.sub} />
              {/* "...continue reading" hint sits OUTSIDE the clamped div so
                  it remains visible. Only renders when the subtext was
                  measured as truncated; the helper component swallows the
                  detection internally and exposes nothing else. */}
              {h.image && (
                <div
                  className="sbc-hero-news-image sbc-glow-panel"
                  // Square panel (1:1). Most news images are 1254x1254 so they
                  // fill it natively; any non-square images (e.g. the 4:3
                  // bus-dog photo) crop slightly via objectFit:cover. Reuses
                  // the site's accent-coloured panel pattern: --panel-color
                  // drives both the border and the on-hover glow via the
                  // existing .sbc-glow-panel CSS rules.
                  style={{
                    '--panel-color': h.color,
                    width: '100%', maxWidth: 400, aspectRatio: '1 / 1',
                    borderRadius: 6, overflow: 'hidden',
                    border: `1px solid ${h.color}`,
                    background: '#030810',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                    transition: 'box-shadow 0.3s, transform 0.3s',
                  } as any}
                >
                  <img
                    src={h.image}
                    alt={h.text}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            <button onClick={() => setPage('news')} style={{ background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.1em', padding: '11px 22px', borderRadius: 3, textTransform: 'uppercase', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#ff1a3a'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}>
                LATEST NEWS →</button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {[
              { label: 'NEXT MATCH',
                val: 'TBC',
                sub: 'Awaiting next fixture',
                color: 'var(--accent)' },
              { label: 'SKILL RATING',
                val: pulseValues.skill > 0 ? String(pulseValues.skill) : '—',
                sub: 'Career — EA Pro Clubs',
                color: '#9b5de5' },
              // Live from the Pulse animation. Falls back to mock targets if Supabase is empty.
              { label: 'CURRENT DIVISION',
                val: pulseValues.pos > 0 ? `DIV ${pulseValues.pos}` : '—',
                sub: `${pulseValues.matches} matches · GD ${pulseValues.gd >= 0 ? '+' : ''}${pulseValues.gd}`,
                color: 'var(--accent)' },
              { label: 'CURRENT FORM',
                form: formLast5.length > 0 ? formLast5 : ['?', '?', '?', '?', '?'],
                sub: liveFixtures.length > 0 ? `Last ${formLast5.length} matches` : 'Awaiting data',
                color: '#e9c46a' }].
              map((w, i) =>
              <div key={i} className="sbc-glow-panel sbc-stat-panel" style={{ '--panel-color': w.color, background: 'rgba(8,15,30,0.85)', backdropFilter: 'blur(20px)', border: `1px solid ${w.color}33`, borderLeft: `3px solid ${w.color}`, borderRadius: 4, padding: '14px 20px', minWidth: 160 }}>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: w.color, marginBottom: 5, textTransform: 'uppercase' }}>{w.label}</div>
                {w.form ? (
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', margin: '4px 0 2px' }}>
                    {w.form.map((r, j) => {
                      const bg = r === 'W' ? '#2a9d8f' : r === 'D' ? 'rgba(255,255,255,0.22)' : r === 'L' ? '#e63946' : 'rgba(255,255,255,0.08)';
                      const sep = j === w.form.length - 1 ? <span key={'sep'+j} style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)', margin: '0 2px' }} /> : null;
                      return <React.Fragment key={j}>{sep}<div style={{ width: 18, height: 18, borderRadius: 3, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: '#fff' }}>{r}</div></React.Fragment>;
                    })}
                  </div>
                ) : (
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: w.val.length > 5 ? 16 : 24, color: '#fff', lineHeight: 1.1 }}>{w.val}</div>
                )}
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.45)', marginTop: 3 }}>{w.sub}</div>
              </div>
              )}
          </div>
          <div style={{ display: 'none' }}>
            <button onClick={() => setPage('squad')} style={{ background: 'var(--accent)', border: 'none', color: '#fff', fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.1em', padding: '12px 28px', borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#ff1a3a'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}>
                VIEW SQUAD →</button>
            <button onClick={() => setPage('news')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.1em', padding: '12px 28px', borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' }}
              onMouseEnter={(e) => {e.currentTarget.style.borderColor = 'var(--accent)';e.currentTarget.style.color = 'var(--accent)';}}
              onMouseLeave={(e) => {e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';e.currentTarget.style.color = '#fff';}}>
                LATEST NEWS</button>
          </div>

          {/* LAST MATCH PANEL — derives from the most recent live fixture.
              Hidden until the scrape lands at least one match. Click to jump
              to the Fixtures page with this match auto-expanded. */}
          {lastMatch && (() => {
            const col = lastMatchColor(lastMatch.result);
            const resultWord = lastMatch.result === 'W' ? 'WIN' : lastMatch.result === 'L' ? 'LOSS' : 'DRAW';
            // Substitute Sad Boi Clique character names where we have them; opponents stay raw.
            const usNameMap = new Map(PLAYERS.filter((p) => p.eaUser).map((p) => [String(p.eaUser).toLowerCase(), p.name]));
            const renderName = (raw) => usNameMap.get(String(raw).toLowerCase()) || raw;
            return (
              <div onClick={() => goToFixture(lastMatch.matchId)} className="sbc-glow-panel"
                style={{ '--panel-color': col, marginTop: 6, maxWidth: 520,
                         background: 'rgba(8,15,30,0.85)', backdropFilter: 'blur(20px)',
                         border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${col}`,
                         borderRadius: 4, padding: '12px 16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', color: col, textTransform: 'uppercase' }}>● Last Match · {resultWord}</div>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.4)' }}>{lastMatch.dateLabel || '—'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase', lineHeight: 1 }}>{lastMatch.us.name || 'SBC FC'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: lastMatch.result === 'L' ? 'rgba(218,218,218,0.6)' : col, lineHeight: 1 }}>{lastMatch.ourScore}</div>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: 'rgba(218,218,218,0.3)' }}>–</div>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: lastMatch.result === 'L' ? '#e76f51' : 'rgba(218,218,218,0.6)', lineHeight: 1 }}>{lastMatch.theirScore}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase', lineHeight: 1 }}>{(lastMatch.opp.name || 'OPPONENT').toUpperCase()}</div>
                  </div>
                </div>
                {lastMatch.scorers.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {lastMatch.scorers.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 10, color: '#2a9d8f' }}>⚽</span>
                        <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: 'rgba(218,218,218,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{renderName(s.name)}{s.goals > 1 ? ` ×${s.goals}` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 10, color: col, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 10, textAlign: 'right' }}>FULL REPORT →</div>
              </div>
            );
          })()}
          </div>

          {/* RIGHT: Player Spotlight in hero */}
          {(() => {
            const spotPlayers = (players || []).filter((p) => p.image);
            const [spIdx, setSpIdx] = React.useState(0);
            const [spHov, setSpHov] = React.useState(false);
            // Touch tracking for the swipe gesture (mobile). The same handlers
            // also let us suppress the panel's onClick when a real swipe
            // happened (so swiping doesn't accidentally open the profile modal).
            const spTouchStart = React.useRef(null);
            const spSwiped = React.useRef(false);
            React.useEffect(() => {
              if (spHov) return;
              const iv = setInterval(() => setSpIdx((i) => (i + 1) % spotPlayers.length), 3800);
              return () => clearInterval(iv);
            }, [spHov]);
            const sp = spotPlayers[spIdx];
            if (!sp) return null;
            const statKeys = sp.position === 'GK' ? ['DIV', 'HAN', 'REF'] : ['PAC', 'SHO', 'DRI'];
            const onSpTouchStart = (e) => {
              spTouchStart.current = e.touches[0]?.clientX ?? null;
              spSwiped.current = false;
            };
            const onSpTouchEnd = (e) => {
              if (spTouchStart.current == null || spotPlayers.length < 2) return;
              const dx = (e.changedTouches[0]?.clientX ?? 0) - spTouchStart.current;
              spTouchStart.current = null;
              if (Math.abs(dx) < 40) return;     // ignore taps / micro-drags
              spSwiped.current = true;
              if (dx < 0) setSpIdx((i) => (i + 1) % spotPlayers.length);
              else        setSpIdx((i) => (i - 1 + spotPlayers.length) % spotPlayers.length);
            };
            const onSpClick = () => {
              if (spSwiped.current) { spSwiped.current = false; return; }
              setSelectedPlayer(sp);
            };
            return (
              <div className="sbc-hero-right" style={{ flex: '0 0 auto', width: 'clamp(360px, 26vw, 560px)', padding: '0 32px 0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: '0.22em', color: 'var(--accent)', textTransform: 'uppercase' }}>Player Spotlight</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {spotPlayers.map((p, i) =>
                      <div key={p.id} onClick={() => setSpIdx(i)} className={i === spIdx ? 'sbc-pagedot sbc-pagedot-active' : 'sbc-pagedot sbc-pagedot-inactive'} style={{ width: i === spIdx ? 16 : 5, height: 5, borderRadius: 3, background: i === spIdx ? 'var(--accent)' : 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.3s' }} />
                      )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setSpIdx((i) => (i - 1 + spotPlayers.length) % spotPlayers.length); }} aria-label="Previous player"
                      style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 14, lineHeight: 1, padding: 0, borderRadius: 2, transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                    >‹</button>
                    <button onClick={(e) => { e.stopPropagation(); setSpIdx((i) => (i + 1) % spotPlayers.length); }} aria-label="Next player"
                      style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 14, lineHeight: 1, padding: 0, borderRadius: 2, transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                    >›</button>
                  </div>
                </div>
                <div onMouseEnter={() => setSpHov(true)} onMouseLeave={() => setSpHov(false)}
                onClick={onSpClick}
                onTouchStart={onSpTouchStart}
                onTouchEnd={onSpTouchEnd}
                className="sbc-glow-panel sbc-player-panel"
                style={{ '--panel-color': sp.accentColor, position: 'relative', borderRadius: 8, overflow: 'hidden',
                  border: `1px solid ${sp.accentColor}55`,
                  boxShadow: spHov ? `0 16px 50px ${sp.glowColor}` : '0 4px 24px rgba(0,0,0,0.5)',
                  transition: 'all 0.3s', cursor: 'pointer',
                  // Fluid portrait box that scales up on larger viewports while
                  // preserving the 332:600 (~0.553) aspect ratio of Panikova's
                  // source photo so he barely crops. Width is driven by the
                  // parent column's `clamp(...)`; aspect-ratio handles height.
                  width: '100%', aspectRatio: '332 / 600', flexShrink: 0 }}>
                  {/* Tinted backdrop sits behind the photo (only visible if a photo
                      ever fails to load — with cover-fit it's normally invisible). */}
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${sp.accentColor}22, ${sp.accentColor}05)` }} />
                  <img src={sp.image} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%', display: 'block', position: 'absolute', inset: 0, transform: spHov ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.5s' }} alt={sp.name} />
                  <div className="sbc-player-fade" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(3,8,16,0.97) 0%, rgba(3,8,16,0.3) 50%, transparent 100%)' }} />
                  {spHov && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${sp.accentColor}22, transparent)` }} />}
                  {/* Rating */}
                  <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(3,8,16,0.88)', border: `2px solid ${sp.accentColor}`, borderRadius: 6, padding: '5px 9px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: sp.accentColor, lineHeight: 1 }}>{sp.rating}</div>
                    <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 7, fontWeight: 700, color: 'rgba(218,218,218,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{sp.position}</div>
                  </div>
                  {/* Info */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', color: sp.accentColor, marginBottom: 2, textTransform: 'uppercase' }}>#{sp.number} · {sp.archetype}</div>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textTransform: 'uppercase', lineHeight: 1 }}>{sp.name}</div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 8, alignItems: 'flex-end' }}>
                      {statKeys.map((k) =>
                      <div key={k} style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: sp.accentColor, lineHeight: 1 }}>{sp.stats[k]}</div>
                          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 7, fontWeight: 700, color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase' }}>{k}</div>
                        </div>
                      )}
                      <div style={{ marginLeft: 'auto' }}>
                        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: sp.accentColor }}>{sp.goals ?? sp.cleanSheets}</div>
                        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 7, fontWeight: 700, color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase' }}>{sp.goals !== null ? 'Goals' : 'CS'}</div>
                      </div>
                    </div>
                    {spHov && <div style={{ marginTop: 8, fontFamily: 'Anton, sans-serif', fontSize: 10, color: sp.accentColor, letterSpacing: '0.12em', textTransform: 'uppercase' }}>VIEW PROFILE →</div>}
                  </div>
                </div>
              </div>);

          })()}
        </div>

        {/* Bottom fade removed — was creating a dark band before the next section */}
      </div>

      {/* WELCOME TO THE CLIQUE */}
      <div style={{ background: 'transparent', padding: '48px 64px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>25/26 SEASON ARRIVALS</div>
            <div className="sbc-glow-heading" style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: '#fff', letterSpacing: '0.03em', textTransform: 'uppercase' }}>WELCOME TO THE CLIQUE</div>
          </div>
          <button onClick={() => setPage('squad')} style={{ background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.1em', padding: '9px 18px', borderRadius: 3, textTransform: 'uppercase' }}>FULL SQUAD →</button>
        </div>
        <div
          ref={(el) => {
            // Imperatively wire up click-and-drag horizontal scrolling.
            // The wiring is idempotent — a flag on the element itself prevents
            // re-attaching listeners across React re-renders.
            if (!el || (el as any)._sbcDragWired) return;
            (el as any)._sbcDragWired = true;
            let isDown = false;
            let didDrag = false;
            let startX = 0;
            let startScroll = 0;
            // If the pointer moved at least this many px during the press,
            // we treat it as a drag and suppress the click that would
            // otherwise open whichever card the press started on.
            const DRAG_THRESHOLD_PX = 5;
            const down = (e: MouseEvent) => {
              if (e.button !== 0) return;
              isDown = true;
              didDrag = false;
              startX = e.pageX;
              startScroll = el.scrollLeft;
              el.style.cursor = 'grabbing';
              el.style.userSelect = 'none';
            };
            const move = (e: MouseEvent) => {
              if (!isDown) return;
              const dx = e.pageX - startX;
              if (Math.abs(dx) > DRAG_THRESHOLD_PX) didDrag = true;
              if (didDrag) {
                e.preventDefault();
                el.scrollLeft = startScroll - dx;
              }
            };
            const up = () => {
              if (!isDown) return;
              isDown = false;
              el.style.cursor = 'grab';
              el.style.userSelect = '';
              // didDrag stays true until the click handler reads it (next event tick).
            };
            // If a drag just happened, eat the click in the capture phase
            // before any card's onClick gets a look at it.
            const click = (e: MouseEvent) => {
              if (didDrag) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                didDrag = false;
              }
            };
            el.addEventListener('mousedown', down);
            // window listeners so a drag continues even if the cursor leaves the carousel.
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup',   up);
            el.addEventListener('click', click, true);
          }}
          className="sbc-drag-carousel"
          style={{
            display: 'flex', gap: 20,
            overflowX: 'auto', overflowY: 'visible',
            padding: '12px 0 16px',
            cursor: 'grab',
            scrollbarWidth: 'none' as any,        // Firefox
            msOverflowStyle: 'none' as any,       // legacy Edge / IE
          }}
        >
          {signings.map((s, i) => {
            const [hov, setHov] = React.useState(false);
            return (
              <div key={i} onClick={() => setSelectedPlayer(s.player)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
              style={{ flexShrink: 0, width: 265, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', position: 'relative', border: `1px solid ${hov ? 'var(--accent)' : 'rgba(228,0,43,0.2)'}`, transition: 'all 0.25s', transform: hov ? 'translateY(-6px)' : 'none', boxShadow: hov ? '0 20px 50px rgba(228,0,43,0.25)' : 'none' }}>
                <img src={s.image} loading="eager" decoding="async" style={{ width: '100%', height: 390, objectFit: 'cover', objectPosition: 'top', display: 'block' }} alt={s.player && s.player.name} />
                <div style={{ position: 'absolute', inset: 0, background: hov ? 'rgba(0,0,0,0.5)' : 'linear-gradient(0deg, rgba(3,8,16,0.9) 0%, transparent 45%)', transition: 'all 0.3s' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px' }}>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--accent)', marginBottom: 4 }}>NEW SIGNING · #{s.player && s.player.number}</div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: '#fff', textTransform: 'uppercase', lineHeight: 1.05 }}>{s.player && s.player.name}</div>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'rgba(218,218,218,0.55)', marginTop: 4 }}>{s.caption}</div>
                </div>
                {hov && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--accent)', color: '#fff', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.1em', padding: '10px 22px', borderRadius: 3, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>VIEW PROFILE →</div>}
              </div>);

          })}
          <div style={{ flexShrink: 0, width: 265, borderRadius: 6, border: '1px dashed rgba(228,0,43,0.25)', background: 'rgba(10,22,40,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 390, gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '2px dashed rgba(228,0,43,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 28, color: 'rgba(228,0,43,0.4)' }}>?</div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.3 }}>MORE SIGNINGS<br />INCOMING</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, color: 'rgba(228,0,43,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Fabrizio Knows</div>
          </div>
        </div>
      </div>


      {/* RECENT MATCHES */}
      <div style={{ background: 'transparent', padding: '40px 64px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>Form Guide · Last 5</div>
            <div className="sbc-glow-heading" style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: '#fff', letterSpacing: '0.03em', textTransform: 'uppercase' }}>RECENT MATCHES</div>
          </div>
          <button onClick={() => setPage('fixtures')} style={{ background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.1em', padding: '9px 18px', borderRadius: 3, textTransform: 'uppercase' }}>ALL FIXTURES →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {liveFixtures.length === 0 && (
            <div style={{ gridColumn: '1 / -1', fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.45)', padding: '20px 0', textAlign: 'center' }}>
              No matches played yet — they'll appear here once the next scrape from EA lands.
            </div>
          )}
          {liveFixtures.slice(0, 5).map((m) => {
            const clr = lastMatchColor(m.result);
            return (
              <div key={m.matchId} onClick={() => goToFixture(m.matchId)} className="sbc-glow-panel"
                style={{ '--panel-color': clr, background: 'rgba(8,15,30,0.7)', border: '1px solid rgba(255,255,255,0.08)',
                         borderLeft: `3px solid ${clr}`, borderRadius: 4, padding: '14px 16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, color: clr, letterSpacing: '0.18em', textTransform: 'uppercase' }}>● {m.result === 'W' ? 'WIN' : m.result === 'L' ? 'LOSS' : 'DRAW'}</div>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: 'rgba(218,218,218,0.4)', letterSpacing: '0.15em' }}>{m.dateLabel || '—'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 26, color: clr, lineHeight: 1 }}>{m.ourScore}</div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: 'rgba(218,218,218,0.3)' }}>–</div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 26, color: 'rgba(218,218,218,0.5)', lineHeight: 1 }}>{m.theirScore}</div>
                </div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.65)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>vs {m.opponent}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STORE PREVIEW */}
      <div style={{ background: 'transparent', padding: '32px 64px 56px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>Official Merch · Limited Drops</div>
            <div className="sbc-glow-heading" style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: '#fff', letterSpacing: '0.03em', textTransform: 'uppercase' }}>SAD BOI STORE</div>
          </div>
          <button onClick={() => setPage('store')} style={{ background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.1em', padding: '9px 18px', borderRadius: 3, textTransform: 'uppercase' }}>SHOP ALL →</button>
        </div>
        {(() => {
          // Pull featured items from the live store. Falls back to the
          // first six visible items if no row has featured = true.
          const featured = storeItems.filter((it) => it.featured);
          const pick = (featured.length > 0 ? featured : storeItems).slice(0, 6);
          const STORE_ITEMS = pick.map((it) => ({
            productId: it.id,
            name: it.name,
            price: `£${it.price}`,
            tag: it.tag,
            clr: it.panelColor,
            img: (it.images && it.images[0]) || '/assets/store/staff-shirt-front.jpg',
          }));
          if (STORE_ITEMS.length === 0) return null;
          // Duplicate the list so the marquee can loop seamlessly.
          const loop = STORE_ITEMS.concat(STORE_ITEMS);
          return <StoreCarousel loop={loop} setPage={setPage} />;
        })()}
      </div>

      {/* HIDDEN OLD GRID */}
      <div style={{ display: 'none' }}>
      <div style={{ background: '#030810', padding: '8px 64px 52px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }}>
        {/* LEFT: Headlines */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18, paddingTop: 8 }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 26, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.03em' }}>LATEST HEADLINES</div>
            <button onClick={() => setPage('news')} style={{ background: 'none', border: '1px solid rgba(228,0,43,0.4)', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', padding: '6px 14px', borderRadius: 3, textTransform: 'uppercase' }}>ALL NEWS →</button>
          </div>
          <div onClick={() => setPage('news')} style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderLeft: '4px solid var(--accent)', borderRadius: 6, padding: '20px 22px', marginBottom: 12, cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(228,0,43,0.07)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(10,22,40,0.7)'}>
            
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#fff', background: 'var(--accent)', padding: '3px 8px', borderRadius: 2, textTransform: 'uppercase' }}>BREAKING</span>
              <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'var(--accent)' }}>🔥 TRENDING NOW</span>
            </div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', lineHeight: 1.1, marginBottom: 8, textTransform: 'uppercase' }}>PANIKOVA: THE PANIC RETURNS?</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.6)', lineHeight: 1.6 }}>Sources close to the striker report "unusual energy" ahead of Saturday's fixture. Aura stability readings are at a season-low. Fern sightings reported.</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'rgba(218,218,218,0.3)', marginTop: 10, letterSpacing: '0.05em' }}>2 HOURS AGO</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {news.slice(1, 5).map((item) =>
            <div key={item.id} onClick={() => setPage('news')} style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,60,120,0.3)', borderRadius: 6, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => {e.currentTarget.style.borderColor = 'rgba(228,0,43,0.35)';e.currentTarget.style.background = 'rgba(228,0,43,0.05)';}}
            onMouseLeave={(e) => {e.currentTarget.style.borderColor = 'rgba(30,60,120,0.3)';e.currentTarget.style.background = 'rgba(10,22,40,0.6)';}}>
              
                <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#fff', background: item.tagColor, padding: '2px 6px', borderRadius: 2, textTransform: 'uppercase' }}>{item.tag}</span>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', lineHeight: 1.2, margin: '8px 0 6px', textTransform: 'uppercase' }}>{item.headline}</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'rgba(218,218,218,0.4)', letterSpacing: '0.04em' }}>{item.time}</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Spotlight + League + Fixture */}
        <div style={{ paddingTop: 8 }}>


                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 14 }}>LEAGUE STANDINGS</div>
          <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(30,60,120,0.35)', borderRadius: 8, overflow: 'hidden', marginBottom: 22 }}>
            {LEAGUE_TABLE.slice(0, 4).map((row, i) =>
            <div key={row.pos} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < 3 ? '1px solid rgba(30,60,120,0.2)' : 'none', background: row.us ? 'rgba(228,0,43,0.08)' : 'transparent', borderLeft: row.us ? '3px solid var(--accent)' : '3px solid transparent' }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 15, color: row.us ? 'var(--accent)' : 'rgba(218,218,218,0.3)', width: 20, textAlign: 'center' }}>{row.pos}</div>
                <div style={{ flex: 1, fontFamily: 'Roboto, sans-serif', fontWeight: row.us ? 700 : 400, fontSize: 12, color: row.us ? '#fff' : 'rgba(218,218,218,0.7)' }}>{row.team}{row.us && <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--accent)', fontWeight: 700 }}>← US</span>}</div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {row.form.map((r, j) => <div key={j} style={{ width: 14, height: 14, borderRadius: 2, background: r === 'W' ? '#2a9d8f' : r === 'D' ? '#e9c46a' : '#e63946', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Roboto, sans-serif', fontSize: 7, fontWeight: 700, color: '#fff' }}>{r}</div>)}
                </div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 15, color: row.us ? 'var(--accent)' : '#fff', width: 26, textAlign: 'right' }}>{row.pts}</div>
              </div>
            )}
            <div onClick={() => setPage('league')} style={{ padding: '10px 14px', textAlign: 'center', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase', background: 'rgba(228,0,43,0.05)', transition: 'background 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(228,0,43,0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(228,0,43,0.05)'}>
              FULL TABLE →</div>
          </div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 14 }}>NEXT FIXTURE</div>
          <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.2)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ background: 'rgba(228,0,43,0.1)', padding: '10px 16px', borderBottom: '1px solid rgba(228,0,43,0.15)' }}>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--accent)', textTransform: 'uppercase' }}>Premier League · Home</div>
            </div>
            <div style={{ padding: '18px 16px' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textTransform: 'uppercase' }}>SAD BOI CLIQUE FC</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: 'rgba(218,218,218,0.35)', letterSpacing: '0.15em' }}>VS</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textTransform: 'uppercase' }}>FC MIDNIGHT</div>
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: 'var(--accent)', lineHeight: 1 }}>MAY 3</div>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'rgba(218,218,218,0.45)', marginTop: 2 }}>20:00 KO · LNER STADIUM</div>
                </div>
                <button onClick={() => setPage('fixtures')} style={{ background: 'var(--accent)', border: 'none', color: '#fff', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', padding: '8px 14px', borderRadius: 3, cursor: 'pointer', textTransform: 'uppercase' }}>FIXTURES →</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP SCORERS */}
      <div style={{ background: 'rgba(6,12,24,0.9)', borderTop: '1px solid rgba(30,60,120,0.3)', padding: '36px 64px 44px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 26, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.03em' }}>TOP SCORERS</div>
          <button onClick={() => setPage('stats')} style={{ background: 'none', border: '1px solid rgba(228,0,43,0.4)', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', padding: '6px 14px', borderRadius: 3, textTransform: 'uppercase' }}>FULL STATS →</button>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {topScorers.map((p, i) =>
          <div key={p.id} onClick={() => setSelectedPlayer(p)} style={{ flex: '1 1 180px', minWidth: 180, background: 'rgba(10,22,40,0.6)', border: `1px solid ${p.accentColor}33`, borderRadius: 6, padding: '14px 16px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', transition: 'all 0.2s' }}
          onMouseEnter={(e) => {e.currentTarget.style.borderColor = p.accentColor;e.currentTarget.style.transform = 'translateY(-2px)';}}
          onMouseLeave={(e) => {e.currentTarget.style.borderColor = `${p.accentColor}33`;e.currentTarget.style.transform = 'none';}}>
            
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: 'rgba(218,218,218,0.12)', width: 26, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${p.accentColor}22`, border: `1px solid ${p.accentColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 15, color: p.accentColor, flexShrink: 0 }}>{p.number}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{p.shortName}</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, color: 'rgba(218,218,218,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p.position}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: p.accentColor, lineHeight: 1 }}>{p.goals}</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, color: 'rgba(218,218,218,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Goals</div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* HOMEPAGE FOOTER — rainbow attached to the top of the pulse strip, fixed at viewport bottom */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50 }}>
        <RainbowBar />
        <div className="sbc-pulse sbc-pulse-footer" style={{ background: 'var(--accent)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '0 64px' }}>
          {[
          { label: 'CURRENT DIVISION', val: 'DIV ' + pulseValues.pos, suffix: '' },
          { label: 'WIN RATE',         val: pulseValues.rate, suffix: '%' },
          { label: 'TOTAL MATCHES',    val: pulseValues.matches, suffix: '' },
          { label: 'GOAL DIFFERENCE',  val: (pulseValues.gd >= 0 ? '+' : '') + pulseValues.gd, suffix: '' }].
          map((item, i) =>
          <div key={i} style={{ padding: '22px 0', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.18)' : 'none' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 42, color: '#fff', lineHeight: 1 }}>{item.val}{item.suffix}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.65)', marginTop: 4, textTransform: 'uppercase' }}>{item.label}</div>
            </div>
          )}
        </div>
      </div>
    </div>);

};

// ── SQUAD PAGE ──────────────────────────────────────────────────
const SquadPage = ({ setSelectedPlayer }) => {
  const [filter, setFilter] = React.useState('ALL');
  const [search, setSearch] = React.useState('');
  const [hovered, setHovered] = React.useState(null);
  const players = useLivePlayers();   // human players carry their real EA stats here
  const positions = ['ALL', 'GK', 'DEF', 'MID', 'FWD'];
  const posMap = { GK: 'GK', CB: 'DEF', LB: 'DEF', RB: 'DEF', CDM: 'MID', CM: 'MID', CAM: 'MID', RW: 'FWD', LW: 'FWD', ST: 'FWD', CF: 'FWD' };
  // Search by name, short name, archetype, or shirt number. Case-insensitive
  // substring match on text fields; exact-or-prefix match on number so "9"
  // finds "9" without also matching "99". Empty query = no filtering.
  const q = search.trim().toLowerCase();
  const matchesSearch = (p) => {
    if (!q) return true;
    if (/^\d+$/.test(q)) return String(p.number ?? '').startsWith(q);
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.shortName || '').toLowerCase().includes(q) ||
      (p.archetype || '').toLowerCase().includes(q)
    );
  };
  const filtered = players
    .filter((p) => filter === 'ALL' || posMap[p.position] === filter)
    .filter(matchesSearch);

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* Hero banner */}
      <div className="sbc-page-header" style={{ position: 'relative', height: 240, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div className="sbc-page-header-bg" style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--page-header-image)', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div className="sbc-page-header-sheen" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.85) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.85) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', left: 64, bottom: 32 }}>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', marginBottom: 6, textTransform: 'uppercase' }}>Sad Boi Clique FC · 25/26 Season</div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 60, color: '#fff', lineHeight: 0.9, textTransform: 'uppercase', textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}>THE SQUAD</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, fontWeight: 300, color: 'rgba(218,218,218,0.6)', marginTop: 8, fontStyle: 'italic' }}>Chaos. Clique. Culture.</div>
        </div>
        <div style={{ position: 'absolute', right: 64, bottom: 32, textAlign: 'right' }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 42, color: 'rgba(228,0,43,0.15)', lineHeight: 1 }}>{players.length}</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(218,218,218,0.35)', textTransform: 'uppercase' }}>Players</div>
        </div>
      </div>
      <RainbowBar />

      {/* Filter bar — position pills on the left, search input on the right.
          Wraps on narrow screens so neither half ever overlaps. */}
      <div className="sbc-filter-bar" style={{ background: 'rgba(6,12,24,0.22)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(228,0,43,0.12)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0, padding: '0 64px' }}>
        {positions.map((pos) =>
        <button key={pos} onClick={() => setFilter(pos)} style={{
          background: 'none', border: 'none', borderBottom: filter === pos ? '3px solid var(--accent)' : '3px solid transparent',
          color: filter === pos ? 'var(--accent)' : 'rgba(218,218,218,0.45)', cursor: 'pointer',
          fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.12em', padding: '16px 24px',
          transition: 'all 0.2s', textTransform: 'uppercase'
        }}>{pos}</button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(218,218,218,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input
              type="search"
              placeholder="Search by name or number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'rgba(8,15,30,0.7)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff',
                fontFamily: 'Roboto, sans-serif', fontSize: 12, letterSpacing: '0.04em',
                padding: '8px 12px 8px 32px', borderRadius: 4, width: 240, outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
            />
          </div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.3)', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
            {filtered.length} PLAYER{filtered.length === 1 ? '' : 'S'}
          </div>
        </div>
      </div>

      {/* Empty state when search/filter yields nothing. */}
      {filtered.length === 0 && (
        <div className="sbc-page-pad" style={{ padding: '64px 64px', textAlign: 'center', fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.55)' }}>
          No players match {q ? `"${search}"` : 'this filter'}.
          <button onClick={() => { setSearch(''); setFilter('ALL'); }} style={{ display: 'inline-block', marginLeft: 12, background: 'none', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(218,218,218,0.85)', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.16em', padding: '6px 12px', borderRadius: 3, textTransform: 'uppercase' }}>Clear</button>
        </div>
      )}

      {/* Squad grid */}
      <div className="sbc-squad-grid sbc-page-pad" style={{ padding: '40px 64px 64px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
        {filtered.map((p) => {
          const isHov = hovered === p.id;
          return (
            <div key={p.id} onClick={() => setSelectedPlayer(p)} onMouseEnter={() => setHovered(p.id)} onMouseLeave={() => setHovered(null)}
            className="sbc-glow-panel sbc-player-panel"
            style={{ '--panel-color': p.accentColor, position: 'relative', borderRadius: 6, overflow: 'hidden', cursor: 'pointer', aspectRatio: '2/3',
              border: `1px solid ${isHov ? p.accentColor : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.3s cubic-bezier(0.2,0,0,1)',
              transform: isHov ? 'translateY(-8px) scale(1.02)' : 'none',
              boxShadow: isHov ? `0 24px 60px ${p.glowColor}, 0 0 0 1px ${p.accentColor}40` : '0 4px 20px rgba(0,0,0,0.5)'
            }}>
              {/* Background: signing image or dark gradient */}
              {p.image ?
              <img src={p.image} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', transition: 'transform 0.5s', transform: isHov ? 'scale(1.06)' : 'scale(1)' }} alt={p.name} /> :
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${p.accentColor}22 0%, #0a1628 100%)` }} />
              }
              {/* Gradient overlays */}
              <div className="sbc-player-fade" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(3,8,16,0.97) 0%, rgba(3,8,16,0.5) 45%, rgba(3,8,16,0.1) 100%)' }} />
              {isHov && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(0deg, ${p.accentColor}44, transparent 50%)` }} />}

              {/* Rating badge */}
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(3,8,16,0.85)', border: `1px solid ${p.accentColor}66`, borderRadius: 4, padding: '6px 10px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: p.accentColor, lineHeight: 1 }}>{p.rating}</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase' }}>{p.position}</div>
              </div>

              {/* Rarity badge */}
              {p.rarity !== 'common' && (() => {
                const cfg = (RARITY_CONFIGS || {})[p.rarity] || {};
                return <div style={{ position: 'absolute', top: 12, right: 12, fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: cfg.border, background: `${cfg.border}22`, padding: '3px 7px', borderRadius: 3, border: `1px solid ${cfg.border}44` }}>{cfg.label}</div>;
              })()}

              {/* No image: number placeholder */}
              {!p.image &&
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 80, color: `${p.accentColor}18`, userSelect: 'none', lineHeight: 1 }}>#{p.number}</div>
                </div>
              }

              {/* Bottom info */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 14px 14px' }}>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: p.accentColor, marginBottom: 3, textTransform: 'uppercase' }}>#{p.number} · {p.archetype}</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textTransform: 'uppercase', lineHeight: 1.05, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{p.shortName}</div>
                {isHov &&
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {p.tags.slice(0, 2).map((t, i) => <span key={i} style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', color: p.accentColor, background: `${p.accentColor}22`, padding: '2px 6px', borderRadius: 2, textTransform: 'uppercase' }}>{t}</span>)}
                  </div>
                }
                {isHov &&
                <div style={{ marginTop: 10, fontFamily: 'Anton, sans-serif', fontSize: 11, color: p.accentColor, letterSpacing: '0.12em', textTransform: 'uppercase' }}>VIEW PROFILE →</div>
                }
              </div>
            </div>);

        })}
      </div>
    </div>);

};

// ── STATS PAGE ──────────────────────────────────────────────────
// ── STATS PAGE ──────────────────────────────────────────────────
// Sortable EA-style league table — one row per player. Mirrors the columns
// EA's official member-list page shows. Live numbers (apps, wins, win %,
// goals, assists, pass %, tackle %, MOTM, avg rating) come from
// member_state for human players (eaUser set); AI characters fall back to
// their hand-authored mock numbers, with em-dashes for fields that don't
// apply (e.g. an AI character has no live pass success rate).
const POSITION_GROUPS = {
  ALL: null,
  GK:  ['GK'],
  DEF: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
  MID: ['CDM', 'CM', 'CAM'],
  ATT: ['LW', 'RW', 'CF', 'ST'],
};

const StatsPage = ({ setSelectedPlayer }) => {
  const players = useLivePlayers();
  const [sortKey, setSortKey] = React.useState('overall');
  const [sortDir, setSortDir] = React.useState('desc');
  const [posGroup, setPosGroup] = React.useState('ALL');
  // Below 820px (the site-wide mobile breakpoint) the 11-column table is
  // unreadable — switch to a card-per-player layout instead. Tracked via
  // matchMedia so it updates on resize and stays in sync with the CSS.
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 820px)').matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 820px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Flatten the merged player + EA-live record into a single row shape that
  // the table reads. AI characters have no `liveStats`; their EA-only
  // columns are null and render as em-dashes.
  const rows = players.map((p) => {
    const ls = p.liveStats || null;
    return {
      player:   p,
      name:     p.shortName || p.name,
      position: p.position,
      overall:  p.rating ?? null,
      apps:     p.apps ?? 0,
      wins:     ls?.wins ?? null,
      winPct:   ls?.winPercent ?? null,
      goals:    p.goals ?? 0,
      assists:  p.assists ?? 0,
      passPct:  ls?.passSuccessPct ?? null,
      tklPct:   ls?.tackleSuccessPct ?? null,
      motm:     ls?.manOfTheMatch ?? null,
      rating:   ls?.ratingAverage ?? null,
    };
  });

  const allowedPositions = POSITION_GROUPS[posGroup];
  const filtered = allowedPositions
    ? rows.filter((r) => allowedPositions.includes(r.position))
    : rows;

  // Nulls (em-dashes) always sort to the bottom regardless of direction —
  // the asc/desc flip is applied only between two real values, so AI
  // characters with no live EA data sink to the bottom either way.
  const cmp = (a, b, key) => {
    const av = a[key];
    const bv = b[key];
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : -av.localeCompare(bv);
    }
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  };
  const sorted = [...filtered].sort((a, b) => cmp(a, b, sortKey));

  const onHeaderClick = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      // Numeric stats default to descending (biggest first); name defaults asc.
      setSortDir(key === 'name' || key === 'position' ? 'asc' : 'desc');
    }
  };

  // Column definitions — drives both the header row and each body row, so
  // adding/removing a column only needs editing here.
  const columns = [
    { key: 'name',     label: 'Player',  align: 'left',   tip: 'Player name' },
    { key: 'position', label: 'POS',     align: 'center', tip: 'Position' },
    { key: 'overall',  label: 'OVR',     align: 'center', tip: 'Pro overall (EA)' },
    { key: 'apps',     label: 'APP',     align: 'center', tip: 'Appearances' },
    { key: 'winPct',   label: 'WIN %',   align: 'center', tip: 'Win percentage' },
    { key: 'goals',    label: 'GOAL',    align: 'center', tip: 'Goals' },
    { key: 'assists',  label: 'AST',     align: 'center', tip: 'Assists' },
    { key: 'passPct',  label: 'PASS %',  align: 'center', tip: 'Pass success %' },
    { key: 'tklPct',   label: 'TKL %',   align: 'center', tip: 'Tackle success %' },
    { key: 'motm',     label: 'MOTM',    align: 'center', tip: 'Man of the match awards' },
    { key: 'rating',   label: 'RATING',  align: 'center', tip: 'Average match rating' },
  ];

  const fmtPct  = (v) => (v == null ? '—' : `${Math.round(v as number)}%`);
  const fmtNum  = (v) => (v == null ? '—' : String(v));
  const fmtRate = (v) => (v == null ? '—' : (v as number).toFixed(1));

  // Build the right cell text for each column key.
  const cellText = (r, key) => {
    if (key === 'winPct' || key === 'passPct' || key === 'tklPct') return fmtPct(r[key]);
    if (key === 'rating') return fmtRate(r[key]);
    if (key === 'name' || key === 'position') return r[key];
    return fmtNum(r[key]);
  };

  // Grid template — keeps header + body rows aligned via a shared columns string.
  const gridTemplate = '2.4fr 0.7fr 0.7fr 0.7fr 0.9fr 0.7fr 0.7fr 0.9fr 0.9fr 0.7fr 0.9fr';

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      {/* HEADER */}
      <div className="sbc-page-header" style={{ position: 'relative', height: 240, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--page-header-image)', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.85) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.85) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', left: 64, bottom: 32 }}>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', marginBottom: 6, textTransform: 'uppercase' }}>Performance Data · 25/26</div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 60, color: '#fff', lineHeight: 0.9, textTransform: 'uppercase', textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}>STATS DASHBOARD</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, fontWeight: 300, color: 'rgba(218,218,218,0.6)', marginTop: 8, fontStyle: 'italic' }}>Numbers don't lie. Mostly.</div>
        </div>
      </div>
      <RainbowBar />

      <div style={{ padding: '32px 64px 64px' }}>
        {/* Filter strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase', marginRight: 4 }}>Position</div>
            {Object.keys(POSITION_GROUPS).map((g) => (
              <button key={g} onClick={() => setPosGroup(g)} style={{
                background: posGroup === g ? 'rgba(228,0,43,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${posGroup === g ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                color: posGroup === g ? '#fff' : 'rgba(218,218,218,0.7)',
                cursor: 'pointer',
                fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.14em',
                padding: '7px 14px', borderRadius: 4, textTransform: 'uppercase', transition: 'all 0.15s',
              }}>{g}</button>
            ))}
          </div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.5)' }}>
            {sorted.length} player{sorted.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Sort selector — only shown on mobile, where the table headers
            (which double as sort triggers on desktop) aren't visible. */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase' }}>Sort by</div>
            <select
              value={sortKey}
              onChange={(e) => { setSortKey(e.target.value); setSortDir(e.target.value === 'name' || e.target.value === 'position' ? 'asc' : 'desc'); }}
              style={{
                background: 'rgba(8,15,30,0.8)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff',
                fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.1em',
                padding: '8px 10px', borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase',
              }}
            >
              {columns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <button
              onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
              style={{
                background: 'rgba(228,0,43,0.18)', border: '1px solid var(--accent)', color: '#fff',
                fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.1em',
                padding: '8px 14px', borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase',
              }}
            >{sortDir === 'asc' ? '▲ ASC' : '▼ DESC'}</button>
          </div>
        )}

        {/* DESKTOP: full 11-column sortable table */}
        {!isMobile && (
          <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(30,60,120,0.35)', borderRadius: 8, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: gridTemplate, alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid rgba(30,60,120,0.5)', background: 'rgba(0,0,0,0.25)' }}>
              {columns.map((c) => {
                const active = sortKey === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => onHeaderClick(c.key)}
                    title={c.tip}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
                      color: active ? 'var(--accent)' : 'rgba(218,218,218,0.55)',
                      textAlign: c.align, textTransform: 'uppercase', padding: 0,
                      display: 'inline-flex', alignItems: 'center', justifyContent: c.align === 'left' ? 'flex-start' : 'center', gap: 4,
                    }}
                  >
                    <span>{c.label}</span>
                    {active && <span style={{ fontSize: 10, lineHeight: 1 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </button>
                );
              })}
            </div>

            {/* Body rows */}
            {sorted.length === 0 && (
              <div style={{ padding: 28, textAlign: 'center', fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.5)' }}>
                No players match this filter.
              </div>
            )}
            {sorted.map((r, i) => {
              const p = r.player;
              const accent = p.accentColor;
              // Subtle zebra striping for readability — odd rows get a light
              // tint, even rows stay transparent. The hover handlers still
              // override with the player's accent tint on enter and restore
              // the row's resting band on leave.
              const restingBg = i % 2 === 1 ? 'rgba(255,255,255,0.025)' : 'transparent';
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlayer(p)}
                  style={{
                    display: 'grid', gridTemplateColumns: gridTemplate, alignItems: 'center',
                    padding: '10px 20px',
                    borderBottom: i < sorted.length - 1 ? '1px solid rgba(30,60,120,0.15)' : 'none',
                    background: restingBg,
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${accent}0d`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = restingBg; }}
                >
                  {/* Player cell — avatar + name + (live/AI) badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    {p.image
                      ? <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${accent}55`, flexShrink: 0 }}><img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} alt={p.name} /></div>
                      : <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${accent}22`, border: `2px solid ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 13, color: accent, flexShrink: 0 }}>{p.number}</div>
                    }
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: p.isLive ? '#06d6a0' : 'rgba(218,218,218,0.4)' }}>
                        {p.isLive ? 'LIVE EA' : (p.eaUser ? 'AWAITING SCRAPE' : 'AI')}
                      </div>
                    </div>
                  </div>
                  {/* All other columns rendered from the columns[] config */}
                  {columns.slice(1).map((c) => (
                    <div key={c.key} style={{
                      fontFamily: c.key === 'overall' ? 'Anton, sans-serif' : 'Roboto, sans-serif',
                      fontSize: c.key === 'overall' ? 17 : 12,
                      fontWeight: c.key === 'overall' ? 400 : 600,
                      color: sortKey === c.key ? accent : '#fff',
                      textAlign: c.align as any,
                      letterSpacing: '0.04em',
                    }}>
                      {cellText(r, c.key)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* MOBILE: card per player. Same data, readable layout, big tap
            targets. Stats render as a 3-column grid inside each card so
            the numbers don't bunch up. Sort + filter still apply. */}
        {isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sorted.length === 0 && (
              <div style={{ padding: 28, textAlign: 'center', fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.5)', background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(30,60,120,0.35)', borderRadius: 8 }}>
                No players match this filter.
              </div>
            )}
            {sorted.map((r) => {
              const p = r.player;
              const accent = p.accentColor;
              // Skip Player, POS, and OVR — those three are already in the
              // card header (avatar + name, position chip, big OVR number).
              const cardStats = columns.slice(3);
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlayer(p)}
                  style={{
                    background: 'rgba(10,22,40,0.85)',
                    border: `1px solid ${accent}55`,
                    borderLeft: `4px solid ${accent}`,
                    borderRadius: 8,
                    padding: 14,
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}
                >
                  {/* Header row: avatar, name, live/AI badge + position */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {p.image
                      ? <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${accent}`, flexShrink: 0 }}><img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} alt={p.name} /></div>
                      : <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${accent}22`, border: `2px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 18, color: accent, flexShrink: 0 }}>{p.number}</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textTransform: 'uppercase', lineHeight: 1.05 }}>{r.name}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
                        <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: '#fff', background: `${accent}33`, border: `1px solid ${accent}77`, padding: '2px 7px', borderRadius: 3 }}>{r.position}</span>
                        <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: p.isLive ? '#06d6a0' : 'rgba(218,218,218,0.4)' }}>
                          {p.isLive ? 'LIVE EA' : (p.eaUser ? 'AWAITING' : 'AI')}
                        </span>
                      </div>
                    </div>
                    {/* Big OVR */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: accent, lineHeight: 1 }}>{cellText(r, 'overall')}</div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.5)' }}>OVERALL</div>
                    </div>
                  </div>
                  {/* Stats grid: each stat as a label + value pair. 3 cols
                      reads cleanly on a phone without the bunching the
                      11-col table caused. */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {cardStats.map((c) => (
                      <div key={c.key} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 4, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: sortKey === c.key ? accent : '#fff', lineHeight: 1 }}>{cellText(r, c.key)}</div>
                        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(218,218,218,0.5)', marginTop: 3 }}>{c.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <div style={{ marginTop: 12, fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'rgba(218,218,218,0.45)', lineHeight: 1.6 }}>
          Live EA numbers are pulled every 10 minutes from the official Pro Clubs API. AI characters carry hand-authored mock numbers; columns marked "—" don't apply to them. Click any column header to sort, click a row for the full profile.
        </div>
      </div>
    </div>);

};

// ── MATCH REPORT (expanded view inside each fixture row) ───────────
// Layout mirrors EA's official Pro Clubs match-report page:
//   - Centered score above the stats table, with both clubs' crests on
//     either side and "Days Ago: N" underneath.
//   - Match-stats grid (Shots / Red Cards / Saves / Tackles / Passes)
//   - Members section: switcher between the two clubs; each player row
//     expands to show Assists / Tackles Made / Pass Attempts / Shots /
//     Passes Made / Red Cards. SBCFC players are shown by their character
//     name (Amir Panikova etc.) instead of their EA Gamertag.
const MatchReport = ({ fixture }) => {
  const [side, setSide] = React.useState('us'); // 'us' | 'opp'
  const [expandedPlayer, setExpandedPlayer] = React.useState(null);

  const aggUs   = fixture.us.aggregate  || {};
  const aggOpp  = fixture.opp.aggregate || {};
  const stats = [
    { label: 'Shots on Target', us: aggUs.shots       ?? '—', opp: aggOpp.shots       ?? '—' },
    { label: 'Red Cards',       us: aggUs.redcards    ?? '—', opp: aggOpp.redcards    ?? '—' },
    { label: 'Saves',           us: aggUs.saves       ?? '—', opp: aggOpp.saves       ?? '—' },
    { label: 'Tackles',         us: aggUs.tacklesmade ?? '—', opp: aggOpp.tacklesmade ?? '—' },
    { label: 'Passes',          us: aggUs.passesmade  ?? '—', opp: aggOpp.passesmade  ?? '—' },
  ];

  const activeSide  = side === 'us' ? fixture.us : fixture.opp;
  const isUsActive  = side === 'us';
  const switchTo = (s) => { setSide(s); setExpandedPlayer(null); };

  // Build a Gamertag → character-name lookup for our club only. Opposing
  // teams stay as their raw EA names because we have no character mapping
  // for them.
  const usNameMap = React.useMemo(() => {
    const m = new Map();
    for (const p of PLAYERS) {
      if (p.eaUser) m.set(String(p.eaUser).toLowerCase(), p.name);
    }
    return m;
  }, []);
  const displayName = (rawName, sideIsUs) =>
    sideIsUs ? (usNameMap.get(String(rawName).toLowerCase()) || rawName) : rawName;

  // Crest visuals:
  //   - For Sad Boi Clique we always use our locally-stored logo.
  //   - For opposing clubs we never try to fetch a crest (the URL is fragile
  //     and we'd need to bundle every club's image). Instead a soft blurred
  //     circle with a "?" stands in.
  const Crest = ({ side: s, size = 64 }) => {
    if (s.clubId === '477926') {
      return (
        <img
          src="/uploads/pasted-1777404204917-0.png"
          alt={s.name}
          style={{
            width: size, height: size, borderRadius: '50%', objectFit: 'cover',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(228,0,43,0.3)',
            flexShrink: 0,
          }}
        />
      );
    }
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.08), rgba(0,0,0,0.4) 70%)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)', flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'Anton, sans-serif', fontSize: size * 0.42, color: 'rgba(218,218,218,0.45)', filter: 'blur(0.5px)' }}>?</span>
      </div>
    );
  };

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ padding: '24px 20px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Header: crests on the sides, score centered, days ago underneath */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'center' }}>
        {/* US side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'flex-end', minWidth: 0 }}>
          <div style={{ textAlign: 'right', minWidth: 0 }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textTransform: 'uppercase', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fixture.us.name}</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase', marginTop: 4 }}>HOME CLUB</div>
          </div>
          <Crest side={fixture.us} />
        </div>

        {/* Centered score block */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 44, color: '#fff', minWidth: 44, textAlign: 'center', lineHeight: 1 }}>{fixture.ourScore}</div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: 'rgba(218,218,218,0.4)' }}>—</div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 44, color: '#fff', minWidth: 44, textAlign: 'center', lineHeight: 1 }}>{fixture.theirScore}</div>
          </div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(218,218,218,0.45)', textTransform: 'uppercase' }}>
            {fixture.daysAgo === 0 ? 'TODAY' : fixture.daysAgo === 1 ? '1 DAY AGO' : `${fixture.daysAgo} DAYS AGO`}
          </div>
        </div>

        {/* OPP side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'flex-start', minWidth: 0 }}>
          <Crest side={fixture.opp} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textTransform: 'uppercase', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fixture.opp.name}</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase', marginTop: 4 }}>OPPONENT</div>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div style={{ marginTop: 22, background: 'rgba(8,15,30,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', alignItems: 'center', padding: '10px 18px', borderBottom: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textAlign: 'left' }}>{s.us}</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(218,218,218,0.6)', textTransform: 'uppercase', textAlign: 'center' }}>{s.label}</div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textAlign: 'right' }}>{s.opp}</div>
          </div>
        ))}
      </div>

      {/* Members section: switcher + expandable rows */}
      <div style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', gap: 0, marginBottom: 12, background: 'rgba(8,15,30,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
          {[
            { id: 'us',  name: fixture.us.name,  s: fixture.us },
            { id: 'opp', name: fixture.opp.name, s: fixture.opp },
          ].map((opt, i) => (
            <button key={opt.id} onClick={() => switchTo(opt.id)}
              style={{
                flex: 1, padding: '10px 14px', border: 'none', cursor: 'pointer',
                background: side === opt.id ? 'rgba(228,0,43,0.18)' : 'transparent',
                color: side === opt.id ? '#fff' : 'rgba(218,218,218,0.55)',
                fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase',
                borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.2s',
              }}>
              {side === opt.id ? '▶ ' : ''}{opt.name}
            </button>
          ))}
        </div>

        {/* Player rows */}
        <div style={{ background: 'rgba(8,15,30,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '24px 2fr 1fr 1fr 1fr', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
            <div />
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase' }}>Member</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase' }}>Position</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase', textAlign: 'right' }}>Goals</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase', textAlign: 'right' }}>Rating</div>
          </div>
          {activeSide.players.length === 0 && (
            <div style={{ padding: '14px 16px', fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.5)' }}>No player records for this club in this match.</div>
          )}
          {activeSide.players.map((p) => {
            const isExp = expandedPlayer === p.name;
            return (
              <div key={p.name}>
                <div onClick={() => setExpandedPlayer(isExp ? null : p.name)}
                  style={{ display: 'grid', gridTemplateColumns: '24px 2fr 1fr 1fr 1fr', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', background: isExp ? 'rgba(228,0,43,0.06)' : 'transparent', transition: 'background 0.15s' }}>
                  <div style={{ color: 'rgba(218,218,218,0.5)', fontSize: 10 }}>{isExp ? '▼' : '▶'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'none' }}>
                    {displayName(p.name, isUsActive)}
                    {p.isMotm && <span title="Man of the Match" style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#e9c46a', background: 'rgba(233,196,106,0.12)', border: '1px solid rgba(233,196,106,0.3)', padding: '1px 6px', borderRadius: 2, textTransform: 'uppercase' }}>★ MOTM</span>}
                  </div>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.7)', textTransform: 'capitalize' }}>{p.position ?? '—'}</div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: p.goals > 0 ? '#2a9d8f' : '#fff', textAlign: 'right' }}>{p.goals}</div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: '#fff', textAlign: 'right' }}>{p.rating !== null ? p.rating.toFixed(2) : '—'}</div>
                </div>
                {isExp && (
                  <div style={{ padding: '12px 16px 16px 40px', background: 'rgba(228,0,43,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                      {[
                        { label: 'Assists',       value: p.assists },
                        { label: 'Tackles Made',  value: p.tacklesMade },
                        { label: 'Pass Attempts', value: p.passAttempts },
                        { label: 'Shots',         value: p.shots },
                        { label: 'Passes Made',   value: p.passesMade },
                        { label: 'Red Cards',     value: p.redCards },
                      ].map((s, i) => (
                        <div key={i} style={{ background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, padding: '8px 10px' }}>
                          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase' }}>{s.label}</div>
                          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: '#fff', marginTop: 4 }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── FIXTURES PAGE ───────────────────────────────────────────────
const FixturesPage = () => {
  const [expanded, setExpanded] = React.useState(null);
  const [fixtures, setFixtures] = React.useState([]);
  const [status, setStatus] = React.useState('loading'); // 'loading' | 'live' | 'empty'
  // Show the 10 most-recent matches by default. Clicking "VIEW OLDER
  // MATCHES" expands to the full list (whatever the scraper has stored).
  const INITIAL_VISIBLE = 10;
  const [showAll, setShowAll] = React.useState(false);

  // Pull live league match history from Supabase on mount. If the home page
  // (or anywhere else) stashed a focus matchId in localStorage, expand that
  // match automatically once the data arrives, then clear the flag so a
  // later visit to the page doesn't keep popping it open.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getLiveFixtures(40);
        if (cancelled) return;
        setFixtures(rows);
        setStatus(rows.length > 0 ? 'live' : 'empty');
        try {
          const focusId = localStorage.getItem('sbc_focus_match');
          if (focusId && rows.some((r) => r.matchId === focusId)) {
            setExpanded(focusId);
          }
          localStorage.removeItem('sbc_focus_match');
        } catch (e) { /* localStorage may be disabled */ }
      } catch {
        if (cancelled) return;
        setFixtures([]);
        setStatus('empty');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const colourFor = (r) => r === 'W' ? '#2a9d8f' : r === 'L' ? 'var(--accent)' : '#e9c46a';

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="sbc-page-header" style={{ position: 'relative', height: 240, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--page-header-image)', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.85) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.85) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 64px 28px', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 3, height: 18, background: 'var(--accent)', flexShrink: 0 }} />
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', textTransform: 'uppercase' }}>EA Sports FC 26 · League Matches</div>
          </div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 64, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9, textShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>FIXTURES & RESULTS</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, fontWeight: 300, color: 'rgba(218,218,218,0.6)', marginTop: 8, fontStyle: 'italic' }}>Every weekend a different flavour of suffering.</div>
        </div>
      </div>
      <RainbowBar />
      <div style={{ padding: '40px 64px 64px' }}>
        {status === 'loading' && (
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.5)', textAlign: 'center', padding: '40px 0' }}>Loading match history…</div>
        )}
        {status === 'empty' && (
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.5)', textAlign: 'center', padding: '40px 0' }}>
            No matches found yet. They'll appear here after the next scheduled scrape from EA.
          </div>
        )}
        {(showAll ? fixtures : fixtures.slice(0, INITIAL_VISIBLE)).map((f) => {
          const col = colourFor(f.result);
          return (
            <div key={f.matchId} style={{ background: 'rgba(10,22,40,0.7)', border: `1px solid ${col}44`, borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderLeft: `4px solid ${col}`, cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === f.matchId ? null : f.matchId)}>
                <div style={{ width: 34, height: 34, borderRadius: 4, background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 16, color: '#fff', flexShrink: 0 }}>{f.result}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: '#fff', textTransform: 'uppercase' }}>VS {(f.opponent || 'UNKNOWN').toUpperCase()}</span>
                    <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: 'rgba(218,218,218,0.35)', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 3, textTransform: 'uppercase' }}>LEAGUE</span>
                  </div>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.4)' }}>{f.dateLabel || '—'}</div>
                </div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#fff', letterSpacing: '0.05em' }}>{f.ourScore} – {f.theirScore}</div>
                <div style={{ color: 'rgba(218,218,218,0.3)', fontSize: 12, marginLeft: 8 }}>{expanded === f.matchId ? '▲' : '▼'}</div>
              </div>
              {expanded === f.matchId && <MatchReport fixture={f} />}
            </div>
          );
        })}
        {/* View-older toggle. Only renders if there's anything beyond the
            initial slice — once everything's visible the button hides. */}
        {fixtures.length > INITIAL_VISIBLE && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
            <button
              onClick={() => setShowAll((v) => !v)}
              style={{
                background: showAll ? 'rgba(255,255,255,0.05)' : 'var(--accent)',
                color: showAll ? 'rgba(218,218,218,0.85)' : '#fff',
                border: showAll ? '1px solid rgba(255,255,255,0.15)' : 'none',
                cursor: 'pointer',
                fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.18em',
                padding: '12px 28px', borderRadius: 4, textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}
            >
              {showAll
                ? `Show fewer matches ↑`
                : `View older matches (${fixtures.length - INITIAL_VISIBLE} more) ↓`}
            </button>
          </div>
        )}
      </div>
    </div>);
};

// ── NEWS PAGE ───────────────────────────────────────────────────
const NewsArticleView = ({ article, onBack }) => {
  return (
    <div className="sbc-article-enter" style={{ background: 'transparent', minHeight: '100vh' }}>
      <style>{`
        @keyframes articleSlideIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes articleHeroIn { from { opacity: 0; transform: scale(1.04); } to { opacity: 1; transform: scale(1); } }
        .sbc-article-enter { animation: articleSlideIn 0.45s cubic-bezier(0.2,0.8,0.2,1) both; }
        .sbc-article-hero { animation: articleHeroIn 0.6s cubic-bezier(0.2,0.8,0.2,1) both; }
      `}</style>
      <div className="sbc-article-hero" style={{ position: 'relative', height: 520, marginTop: 92, overflow: 'hidden', borderBottom: `1px solid ${article.tagColor}55`, background: '#020a18' }}>
        {article.image && (
          <React.Fragment>
            {/* Blurred backdrop fills any letterbox gaps */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${article.image}")`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(40px) brightness(0.4) saturate(1.2)', transform: 'scale(1.15)' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(3,8,16,0.3) 0%, rgba(3,8,16,0.5) 50%, rgba(3,8,16,0.95) 100%)` }} />
            {/* Full sharp image, contained so nothing is cropped */}
            <img src={article.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center 40%' }} />
          </React.Fragment>
        )}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(3,8,16,0.4) 0%, rgba(3,8,16,0.92) 100%)` }} />
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 64px 36px', maxWidth: 1100, zIndex: 1 }}>
          <button onClick={onBack} style={{ position: 'absolute', top: 24, left: 64, background: 'rgba(8,15,30,0.7)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.18em', padding: '10px 16px', borderRadius: 4, backdropFilter: 'blur(8px)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = article.tagColor; e.currentTarget.style.color = article.tagColor; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#fff'; }}>
            ← BACK TO NEWS
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', color: '#fff', background: article.tagColor, padding: '5px 10px', borderRadius: 2, textTransform: 'uppercase' }}>{article.tag}</span>
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', color: article.tagColor, textTransform: 'uppercase' }}>{article.kicker}</span>
          </div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px, 5.4vw, 72px)', color: '#fff', textTransform: 'uppercase', lineHeight: 0.92, textShadow: '0 4px 32px rgba(0,0,0,0.7)', maxWidth: 1000, marginBottom: 16 }}>{article.headline}</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>{article.author || 'Sad Boi Newsroom'} · {article.time}</div>
        </div>
      </div>
      <RainbowBar />
      <div style={{ padding: '40px 64px 80px', maxWidth: 820, margin: '0 auto' }}>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 18, color: 'rgba(218,218,218,0.85)', lineHeight: 1.65, marginBottom: 28, fontWeight: 500 }}>{article.summary}</div>
        <div style={{ width: 60, height: 3, background: article.tagColor, marginBottom: 28 }} />
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 15, color: 'rgba(218,218,218,0.7)', lineHeight: 1.85, fontStyle: 'italic' }}>{article.body}</div>
        <div style={{ marginTop: 48, padding: '20px 24px', background: 'rgba(8,15,30,0.7)', border: `1px solid ${article.tagColor}33`, borderLeft: `3px solid ${article.tagColor}`, borderRadius: 4 }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, color: article.tagColor, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>Filed under</div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{article.kicker.toLowerCase() === article.tag.toLowerCase() ? article.tag : `${article.kicker} · ${article.tag}`}</div>
        </div>
        <button onClick={onBack} style={{ marginTop: 40, background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.18em', padding: '14px 28px', borderRadius: 4 }}>
          ← BACK TO ALL NEWS
        </button>
      </div>
    </div>
  );
};

const NewsPage = () => {
  const [active, setActive] = React.useState(null);
  const [articleId, setArticleId] = React.useState(null);
  const [archive, setArchive] = React.useState(false);
  const news = useLiveNews();
  // Pick up homepage-headline focus on mount
  React.useEffect(() => {
    let id = null;
    try { id = localStorage.getItem('sbc_focus_news'); localStorage.removeItem('sbc_focus_news'); } catch (e) {}
    if (id) setArticleId(id); // keep as raw string; we compare with String(n.id) below
  }, []);
  // Only scroll when transitioning between index <-> article (skip initial null mount)
  const prevArticleId = React.useRef(null);
  React.useEffect(() => {
    if (prevArticleId.current !== articleId) {
      if (prevArticleId.current !== null || articleId !== null) {
        window.scrollTo(0, 0);
      }
      prevArticleId.current = articleId;
    }
  }, [articleId]);

  if (articleId !== null) {
    const article = news.find((n) => String(n.id) === String(articleId));
    if (article) return <NewsArticleView article={article} onBack={() => setArticleId(null)} />;
  }

  if (archive) return <NewsArchiveView onBack={() => setArchive(false)} onOpen={(id) => setArticleId(id)} />;

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="sbc-page-header" style={{ position: 'relative', height: 240, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--page-header-image)', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.85) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.85) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 64px 28px', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 3, height: 18, background: 'var(--accent)', flexShrink: 0 }} />
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', textTransform: 'uppercase' }}>Club Media Hub</div>
          </div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 64, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9, textShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>NEWS & STORIES</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, fontWeight: 300, color: 'rgba(218,218,218,0.6)', marginTop: 8, fontStyle: 'italic' }}>Rumours, ramblings, and the occasional fact.</div>
        </div>
      </div>
      <RainbowBar />
      <div className="sbc-news-mosaic sbc-page-pad" style={{ padding: '32px 64px 64px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {(() => {
          const lead = news[0];
          if (!lead) return null;
          return (
            <div key={lead.id} onClick={() => setArticleId(lead.id)} className="sbc-news-lead sbc-glow-panel" style={{
              '--panel-color': lead.tagColor,
              gridColumn: 'span 2', gridRow: 'span 2',
              position: 'relative', borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
              padding: 2,
              background: 'linear-gradient(120deg, #e63946, #f4a261, #e9c46a, #2a9d8f, #4361ee, #9b5de5)',
              boxShadow: '0 18px 60px rgba(0,0,0,0.55)'
            }}>
              <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden', background: '#020a18' }}>
                <img src={lead.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {/* Strong gradient for headline legibility */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.25) 0%, rgba(3,8,16,0.35) 35%, rgba(3,8,16,0.85) 75%, rgba(3,8,16,0.96) 100%)' }} />
                {/* Side fade */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.55) 0%, transparent 45%)' }} />

                {/* Top-left tag cluster */}
                <div style={{ position: 'absolute', top: 18, left: 18, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', color: '#fff', background: 'var(--accent)', padding: '5px 11px', borderRadius: 2, textTransform: 'uppercase', boxShadow: '0 0 18px var(--glow-strong)' }}>● LEAD STORY</span>
                  <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: '#fff', background: lead.tagColor, padding: '5px 10px', borderRadius: 2, textTransform: 'uppercase' }}>{lead.tag}</span>
                  {lead.hot && <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 10, color: '#fff', letterSpacing: '0.2em', background: 'rgba(0,0,0,0.65)', padding: '5px 9px', borderRadius: 2, border: '1px solid var(--accent)' }}>🔥 HOT</span>}
                </div>

                {/* Bottom overlay: headline + meta */}
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '24px 28px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 24, height: 2, background: lead.tagColor }} />
                    <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', color: lead.tagColor, textTransform: 'uppercase' }}>{lead.kicker}</span>
                  </div>
                  <div className="sbc-glow-heading sbc-news-lead-headline" style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(32px, 3.4vw, 56px)', color: '#fff', textTransform: 'uppercase', lineHeight: 0.95, marginBottom: 14, maxWidth: '92%' }}>{lead.headline}</div>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 1.55, maxWidth: '78%', marginBottom: 14 }}>{lead.summary}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                    <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>{lead.author} · {lead.time}</span>
                    <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 13, color: '#fff', letterSpacing: '0.2em', textTransform: 'uppercase' }}>READ THE STORY →</span>
                  </div>
                </div>
              </div>
            </div>);

        })()}

        {news.slice(1).map((item) => {
          const isOpen = active === item.id;
          return (
            <div key={item.id} onClick={() => setArticleId(item.id)} className="sbc-news-tile sbc-glow-panel"
            style={{ '--panel-color': item.tagColor, background: 'rgba(8,15,30,0.78)', backdropFilter: 'blur(8px)', border: `1px solid ${isOpen ? item.tagColor + '66' : 'rgba(30,60,120,0.25)'}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
              {/* Thumbnail */}
              <div style={{ position: 'relative', flex: '1 1 auto', minHeight: 0, overflow: 'hidden', background: '#020a18' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${item.image}")`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(28px) brightness(0.45) saturate(1.2)', transform: 'scale(1.15)' }} />
                <img src={item.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center 35%', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 35%, rgba(8,15,30,0.92) 100%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                  <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: '#fff', background: item.tagColor, padding: '3px 8px', borderRadius: 2, textTransform: 'uppercase' }}>{item.tag}</span>
                  {item.hot && <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, color: 'var(--accent)', background: 'rgba(0,0,0,0.7)', padding: '3px 6px', borderRadius: 2, letterSpacing: '0.1em' }}>🔥</span>}
                </div>
                {/* Headline overlay */}
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '8px 10px' }}>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 7, fontWeight: 700, letterSpacing: '0.22em', color: item.tagColor, marginBottom: 3, textTransform: 'uppercase' }}>{item.kicker}</div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 13, color: '#fff', lineHeight: 1.05, textTransform: 'uppercase' }}>{item.headline}</div>
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: item.tagColor }} />
              </div>
              <div style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, color: 'rgba(218,218,218,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{item.time}</span>
                <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 9, color: item.tagColor, letterSpacing: '0.15em', textTransform: 'uppercase' }}>READ →</span>
              </div>
            </div>);

        })}
      </div>

      {/* Older Stories panel */}
      <div className="sbc-page-pad" style={{ padding: '8px 64px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 22, background: '#9b5de5' }} />
            <div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', color: '#9b5de5', textTransform: 'uppercase', marginBottom: 2 }}>From The Archive</div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1 }}>Older Stories</div>
            </div>
          </div>
          <button onClick={() => setArchive(true)} style={{ background: 'transparent', border: '1px solid rgba(155,93,229,0.55)', color: '#fff', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.18em', padding: '12px 22px', borderRadius: 4, textTransform: 'uppercase' }}>Browse Full Archive →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {OLDER_NEWS.slice(0, 4).map((item) =>
          <div key={item.id} onClick={() => setArticleId(item.id)} className="sbc-glow-panel sbc-archive-tile" style={{ '--panel-color': item.tagColor, background: 'rgba(8,15,30,0.78)', backdropFilter: 'blur(8px)', border: '1px solid rgba(30,60,120,0.25)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', height: 220, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${item.image}")`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px) brightness(0.4) saturate(1.2)', transform: 'scale(1.15)' }} />
              <img src={item.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center 35%' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(8,15,30,0.95) 100%)' }} />
              <div style={{ position: 'absolute', top: 10, left: 10 }}>
                <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: '#fff', background: item.tagColor, padding: '3px 8px', borderRadius: 2, textTransform: 'uppercase' }}>{item.tag}</span>
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 12px' }}>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 7, fontWeight: 700, letterSpacing: '0.22em', color: item.tagColor, marginBottom: 3, textTransform: 'uppercase' }}>{item.kicker}</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', lineHeight: 1.05, textTransform: 'uppercase' }}>{item.headline}</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, color: 'rgba(218,218,218,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 6 }}>{item.time}</div>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: item.tagColor }} />
            </div>
          )}
        </div>
      </div>
    </div>);

};

// ── NEWS ARCHIVE VIEW ───────────────────────────────────────────
const NewsArchiveView = ({ onBack, onOpen }) => {
  const [filter, setFilter] = React.useState('ALL');
  React.useEffect(() => { window.scrollTo(0, 0); }, []);
  const news = useLiveNews();
  const tags = ['ALL', ...Array.from(new Set(news.map((n) => n.tag)))];
  const items = filter === 'ALL' ? news : news.filter((n) => n.tag === filter);
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="sbc-page-header" style={{ position: 'relative', height: 220, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(155,93,229,0.3)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--page-header-image)', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.88) 100%)' }} />
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 64px 24px', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 3, height: 18, background: '#9b5de5' }} />
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: '#9b5de5', textTransform: 'uppercase' }}>From The Archive</div>
          </div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 64, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9, textShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>STORY ARCHIVE</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, fontWeight: 300, color: 'rgba(218,218,218,0.6)', marginTop: 8, fontStyle: 'italic' }}>Every chapter of the saga, in one place. {news.length} stories.</div>
        </div>
      </div>
      <RainbowBar />
      <div className="sbc-page-pad" style={{ padding: '24px 64px 12px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={onBack} style={{ background: 'transparent', border: '1px solid rgba(228,0,43,0.55)', color: '#fff', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.18em', padding: '10px 18px', borderRadius: 4, textTransform: 'uppercase', marginRight: 12 }}>← BACK</button>
        {tags.map(t =>
        <button key={t} onClick={() => setFilter(t)} style={{ background: filter === t ? '#9b5de5' : 'transparent', border: '1px solid ' + (filter === t ? '#9b5de5' : 'rgba(155,93,229,0.4)'), color: filter === t ? '#fff' : 'rgba(218,218,218,0.85)', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 10, letterSpacing: '0.18em', padding: '8px 14px', borderRadius: 999, textTransform: 'uppercase' }}>{t}</button>
        )}
      </div>
      <div className="sbc-page-pad" style={{ padding: '16px 64px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {items.map((item) =>
        <div key={item.id} onClick={() => onOpen(item.id)} className="sbc-glow-panel sbc-archive-tile" style={{ '--panel-color': item.tagColor, background: 'rgba(8,15,30,0.78)', backdropFilter: 'blur(8px)', border: '1px solid rgba(30,60,120,0.25)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', height: 220, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${item.image}")`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px) brightness(0.4) saturate(1.2)', transform: 'scale(1.15)' }} />
            <img src={item.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center 35%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(8,15,30,0.95) 100%)' }} />
            <div style={{ position: 'absolute', top: 10, left: 10 }}>
              <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: '#fff', background: item.tagColor, padding: '3px 8px', borderRadius: 2, textTransform: 'uppercase' }}>{item.tag}</span>
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 12px' }}>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 7, fontWeight: 700, letterSpacing: '0.22em', color: item.tagColor, marginBottom: 3, textTransform: 'uppercase' }}>{item.kicker}</div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', lineHeight: 1.05, textTransform: 'uppercase' }}>{item.headline}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, color: 'rgba(218,218,218,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 6 }}>{item.time}</div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: item.tagColor }} />
          </div>
        )}
      </div>
    </div>);

};
const TransfersPage = () => {
  const [revealed, setRevealed] = React.useState({});
  const transfers = useLiveTransfers();
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="sbc-page-header" style={{ position: 'relative', height: 240, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--page-header-image)', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.85) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.85) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 64px 28px', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 3, height: 18, background: 'var(--accent)', flexShrink: 0 }} />
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', textTransform: 'uppercase' }}>Transfer Centre</div>
          </div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 64, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9, textShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>TRANSFERS</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, fontWeight: 300, color: 'rgba(218,218,218,0.6)', marginTop: 8, fontStyle: 'italic' }}>Here we go. Maybe. Probably not. Definitely soon.</div>
        </div>
      </div>
      <RainbowBar />
      <div style={{ padding: '40px 64px 64px' }}>
        {transfers.length === 0 && (
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.55)', textAlign: 'center', padding: '40px 0' }}>
            No transfer activity right now. The window is quiet. Suspiciously quiet.
          </div>
        )}
        {transfers.map((t) => {
          const isOpen = revealed[t.id];
          const c = t.panelColor || '#E4002B';
          return (
            <div key={t.id} className="sbc-glow-panel" style={{ '--panel-color': c, background: 'rgba(10,22,40,0.7)', border: `1px solid ${c}44`, borderRadius: 8, overflow: 'hidden', marginBottom: 14, borderLeft: `4px solid ${c}` }}>
              <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 16 }} onClick={() => setRevealed((r) => ({ ...r, [t.id]: !r[t.id] }))}>
                {/* Left side — player photo (if any) + name + club */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                  {t.imageUrl && (
                    <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${c}55`, background: 'rgba(8,15,30,0.6)', flexShrink: 0 }}>
                      <img src={t.imageUrl} alt={t.player} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget).style.display = 'none'; }} />
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.player}</div>
                    <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.4)', marginTop: 2 }}>{t.club} · FEE: {t.fee}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#fff', background: c, padding: '5px 12px', borderRadius: 3, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{t.statusLabel}</div>
                  <div style={{ color: 'rgba(218,218,218,0.3)', fontSize: 10 }}>{isOpen ? '▲' : '▼'}</div>
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: '0 22px 18px', borderTop: `1px solid ${c}22` }}>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.7)', lineHeight: 1.7, fontStyle: 'italic', marginTop: 14, borderLeft: `2px solid ${c}`, paddingLeft: 12, whiteSpace: 'pre-wrap' }}>{t.detail}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>);

};

// ── LEAGUE TABLE PAGE ───────────────────────────────────────────
const LeaguePage = () => {
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="sbc-page-header" style={{ position: 'relative', height: 240, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--page-header-image)', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.85) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.85) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 64px 28px', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 3, height: 18, background: 'var(--accent)', flexShrink: 0 }} />
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', textTransform: 'uppercase' }}>2025/26 Season</div>
          </div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 64, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9, textShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>LEAGUE TABLE</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, fontWeight: 300, color: 'rgba(218,218,218,0.6)', marginTop: 8, fontStyle: 'italic' }}>The cold mathematics of trying our best.</div>
        </div>
      </div>
      <RainbowBar />
      <div style={{ padding: '40px 64px 64px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(30,60,120,0.35)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 44px 44px 44px 44px 54px 64px 110px', padding: '10px 20px', borderBottom: '1px solid rgba(30,60,120,0.35)', background: 'rgba(228,0,43,0.06)' }}>
            {['#', 'TEAM', 'P', 'W', 'D', 'L', 'GD', 'PTS', 'FORM'].map((h) => <div key={h} style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(228,0,43,0.7)', textAlign: h === 'TEAM' ? 'left' : 'center', textTransform: 'uppercase' }}>{h}</div>)}
          </div>
          {LEAGUE_TABLE.map((row, i) =>
          <div key={row.pos} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 44px 44px 44px 44px 54px 64px 110px', padding: '13px 20px', borderBottom: '1px solid rgba(30,60,120,0.12)', background: row.us ? 'rgba(228,0,43,0.07)' : 'transparent', borderLeft: row.us ? '3px solid var(--accent)' : '3px solid transparent', transition: 'background 0.2s' }}
          onMouseEnter={(e) => {if (!row.us) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';}}
          onMouseLeave={(e) => {if (!row.us) e.currentTarget.style.background = 'transparent';}}>
            
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: row.us ? 'var(--accent)' : 'rgba(218,218,218,0.35)', textAlign: 'center', alignSelf: 'center' }}>{row.pos}</div>
              <div style={{ fontFamily: row.us ? 'Anton, sans-serif' : 'Roboto, sans-serif', fontWeight: row.us ? undefined : 500, fontSize: 13, color: row.us ? '#fff' : 'rgba(218,218,218,0.75)', alignSelf: 'center', paddingLeft: 8, textTransform: row.us ? 'uppercase' : 'none' }}>
                {row.team}{row.us && <span style={{ marginLeft: 8, fontSize: 9, color: 'var(--accent)', fontFamily: 'Roboto, sans-serif', fontWeight: 700, textTransform: 'uppercase' }}>← US</span>}
              </div>
              {[row.p, row.w, row.d, row.l, row.gd > 0 ? `+${row.gd}` : row.gd].map((v, j) =>
            <div key={j} style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.55)', textAlign: 'center', alignSelf: 'center' }}>{v}</div>
            )}
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: row.us ? 'var(--accent)' : '#fff', textAlign: 'center', alignSelf: 'center' }}>{row.pts}</div>
              <div style={{ display: 'flex', gap: 3, justifyContent: 'center', alignSelf: 'center' }}>
                {row.form.map((r, j) =>
              <div key={j} style={{ width: 16, height: 16, borderRadius: 3, background: r === 'W' ? '#2a9d8f' : r === 'D' ? '#e9c46a' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Roboto, sans-serif', fontSize: 7, fontWeight: 700, color: '#fff' }}>{r}</div>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>);

};

// ── STORE CARD (own component so its hooks aren't called inside a .map) ────
const StoreCard = ({ item }) => {
  const [hov, setHov] = React.useState(false);
  const [imgIdx, setImgIdx] = React.useState(0);
  // Once the user clicks an arrow or swipes, stop the auto-cycle for the
  // remainder of this hover session — otherwise the image they picked
  // would jump back to the cycle a second later.
  const [manualNav, setManualNav] = React.useState(false);
  const touchStartX = React.useRef(null);
  const imgs = item.images || [];
  React.useEffect(() => {
    if (!hov || imgs.length < 2 || manualNav) return;
    const iv = setInterval(() => setImgIdx((i) => (i + 1) % imgs.length), 1100);
    return () => clearInterval(iv);
  }, [hov, imgs.length, manualNav]);
  React.useEffect(() => { if (!hov) { setImgIdx(0); setManualNav(false); } }, [hov]);

  const goNext = (e) => { if (e) e.stopPropagation(); setManualNav(true); setImgIdx((i) => (i + 1) % imgs.length); };
  const goPrev = (e) => { if (e) e.stopPropagation(); setManualNav(true); setImgIdx((i) => (i - 1 + imgs.length) % imgs.length); };
  const onTouchStart = (e) => { touchStartX.current = e.touches[0]?.clientX ?? null; };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null || imgs.length < 2) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;            // ignore taps / micro-drags
    if (dx < 0) goNext(); else goPrev();
  };
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="sbc-glow-panel sbc-store-card-enter"
      data-store-product={item.id}
      style={{ '--panel-color': item.clr === 'var(--accent)' ? 'var(--accent)' : item.clr, background: 'rgba(8,15,30,0.7)', border: `1px solid ${hov ? item.clr : 'rgba(255,255,255,0.08)'}`, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s', transform: hov ? 'translateY(-6px)' : 'none', boxShadow: hov ? `0 20px 50px ${item.clr === 'var(--accent)' ? 'rgba(228,0,43,0.3)' : item.clr + '33'}` : 'none' }}>
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ height: 280, background: `linear-gradient(160deg, ${item.clr === 'var(--accent)' ? 'rgba(228,0,43,0.10)' : item.clr + '14'} 0%, rgba(3,8,16,0.95) 100%)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>

        {imgs.length > 0 ? (
          <React.Fragment>
            {imgs.map((src, i) => (
              <img key={src} src={src} alt={item.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', opacity: i === imgIdx ? 1 : 0, transition: 'opacity 0.5s', transform: hov ? 'scale(1.04)' : 'scale(1)', transitionProperty: 'opacity, transform', transitionDuration: '0.5s, 0.6s', filter: item.soldOut ? 'blur(14px) saturate(1.2) brightness(0.55)' : undefined }} />
            ))}
            {/* Sold-out treatment: diagonal stripes overlay so the product is
                obscured but its silhouette / colour still reads. The "SOLD OUT"
                banner sits above this. */}
            {item.soldOut && (
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, transparent 0%, ${item.clr === 'var(--accent)' ? 'rgba(228,0,43,0.18)' : item.clr + '22'} 100%), repeating-linear-gradient(45deg, rgba(3,8,16,0.18) 0 8px, transparent 8px 16px)`, mixBlendMode: 'overlay' }} />
            )}
          </React.Fragment>
        ) : item.placeholderSrc ? (
          <React.Fragment>
            <img src={item.placeholderSrc} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'blur(18px) saturate(1.4) brightness(0.55)', transform: 'scale(1.18)' }} />
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, transparent 0%, ${item.clr === 'var(--accent)' ? 'rgba(228,0,43,0.18)' : item.clr + '22'} 100%), repeating-linear-gradient(45deg, rgba(3,8,16,0.18) 0 8px, transparent 8px 16px)`, mixBlendMode: 'overlay' }} />
            <div style={{ position: 'relative', fontFamily: 'Anton, sans-serif', fontSize: 64, color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '-0.04em', textShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>SBC</div>
          </React.Fragment>
        ) : (
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 88, color: item.clr, opacity: hov ? 0.32 : 0.18, textTransform: 'uppercase', letterSpacing: '-0.04em', transition: 'all 0.25s' }}>SBC</div>
        )}
        {item.soldOut && <div className="sbc-soldout-banner">SOLD OUT</div>}
        {item.tag && <div style={{ position: 'absolute', top: 12, left: 12, fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: '#fff', background: item.clr, padding: '4px 10px', borderRadius: 2, letterSpacing: '0.18em', textTransform: 'uppercase', zIndex: 2 }}>{item.tag}</div>}
        <div style={{ position: 'absolute', bottom: 12, right: 12, fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.18em', textTransform: 'uppercase', background: 'rgba(3,8,16,0.55)', padding: '3px 7px', borderRadius: 2, backdropFilter: 'blur(4px)', zIndex: 2 }}>{item.cat}</div>
        {/* Side arrows for manual navigation. Visible on items with more
            than one image at any viewport (touch friendly + click friendly).
            The pill below them shows the current index. */}
        {imgs.length > 1 && (
          <React.Fragment>
            <button
              onClick={goPrev}
              aria-label="Previous image"
              style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 3,
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(8,15,30,0.7)', border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff', cursor: 'pointer',
                fontFamily: 'Anton, sans-serif', fontSize: 16, lineHeight: 1, padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(6px)', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = item.clr; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(8,15,30,0.7)'; }}
            >‹</button>
            <button
              onClick={goNext}
              aria-label="Next image"
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 3,
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(8,15,30,0.7)', border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff', cursor: 'pointer',
                fontFamily: 'Anton, sans-serif', fontSize: 16, lineHeight: 1, padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(6px)', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = item.clr; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(8,15,30,0.7)'; }}
            >›</button>
          </React.Fragment>
        )}
        {/* Image-index pills. Wrapped in a dark blurred chip so the inactive
            dots aren't lost on white product photos (was rgba(255,255,255,0.25)
            which vanished against the kit shots). */}
        {imgs.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 10, left: 12, zIndex: 2,
            display: 'flex', gap: 4, alignItems: 'center',
            background: 'rgba(8,15,30,0.6)', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '5px 7px', borderRadius: 999,
          }}>
            {imgs.map((_, i) => (
              <div key={i} style={{ width: i === imgIdx ? 14 : 5, height: 4, borderRadius: 2, background: i === imgIdx ? item.clr : 'rgba(255,255,255,0.55)', transition: 'all 0.3s' }} />
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.name}</div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: item.clr }}>£{item.price}</div>
        </div>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.55)', lineHeight: 1.4, marginBottom: 12 }}>{item.sub}</div>
        {item.soldOut
          ? <button disabled style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(218,218,218,0.4)', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.18em', padding: '10px 0', borderRadius: 3, cursor: 'not-allowed', textTransform: 'uppercase' }}>NOTIFY ME</button>
          : <button style={{ width: '100%', background: hov ? item.clr : 'transparent', border: `1px solid ${item.clr}`, color: hov ? '#fff' : item.clr, fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.18em', padding: '10px 0', borderRadius: 3, cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' }}>ADD TO BAG</button>}
      </div>
    </div>
  );
};

// ── STORE PAGE ──────────────────────────────────────────────────
const StorePage = () => {
  const [filter, setFilter] = React.useState('ALL');
  const liveItems = useLiveStoreItems();

  // If we arrived from a homepage preview, find the right card and pulse it.
  React.useEffect(() => {
    let id = null;
    try { id = localStorage.getItem('sbc_focus_product'); localStorage.removeItem('sbc_focus_product'); } catch (e) {}
    if (!id) return;
    const tries = [60, 240, 520, 900];
    tries.forEach((t) => setTimeout(() => {
      const el = document.querySelector(`[data-store-product="${id}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + r.top - 180, behavior: 'smooth' });
      el.classList.add('sbc-store-focused');
      setTimeout(() => el.classList.remove('sbc-store-focused'), 2400);
    }, t));
  }, []);

  // Map live shape (panel_color/subtitle/category) onto the field names
  // the existing StoreCard component reads (clr/sub/cat). Keeps the
  // visual code untouched.
  const products = liveItems.map((it) => ({
    id: it.id,
    name: it.name,
    price: it.price,
    cat: it.category,
    tag: it.tag,
    clr: it.panelColor,
    sub: it.subtitle,
    images: it.images && it.images.length > 0 ? it.images : undefined,
    placeholderSrc: it.soldOut && (!it.images || it.images.length === 0) ? '/assets/store/staff-shirt-front.jpg' : undefined,
    soldOut: it.soldOut,
  }));

  // Filter pills: 'ALL' plus every distinct category present in the data,
  // preserving sort order so KITS/TRAINING/FAN GEAR stay grouped naturally.
  const seenCats = [];
  for (const p of products) if (p.cat && !seenCats.includes(p.cat)) seenCats.push(p.cat);
  const filters = ['ALL', ...seenCats];
  const filtered = filter === 'ALL' ? products : products.filter((p) => p.cat === filter);
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="sbc-page-header" style={{ position: 'relative', height: 240, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--page-header-image)', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.85) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.85) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', left: 64, bottom: 32 }}>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', marginBottom: 6, textTransform: 'uppercase' }}>Official Merch · Free UK Shipping over £60</div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 60, color: '#fff', lineHeight: 0.9, textTransform: 'uppercase', textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}>SAD BOI STORE</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, fontWeight: 300, color: 'rgba(218,218,218,0.6)', marginTop: 8, fontStyle: 'italic' }}>Wear the chaos. Embrace the sadness.</div>
        </div>
        <div style={{ position: 'absolute', right: 64, bottom: 32, textAlign: 'right' }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 42, color: 'rgba(228,0,43,0.18)', lineHeight: 1 }}>{products.length}</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(218,218,218,0.35)', textTransform: 'uppercase' }}>Items</div>
        </div>
      </div>
      <RainbowBar />
      <div className="sbc-filter-bar" style={{ background: 'rgba(6,12,24,0.22)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(228,0,43,0.12)', display: 'flex', gap: 0, padding: '0 64px' }}>
        {filters.map((f) =>
          <button key={f} onClick={() => setFilter(f)} style={{
            background: 'none', border: 'none', borderBottom: filter === f ? '3px solid var(--accent)' : '3px solid transparent',
            color: filter === f ? 'var(--accent)' : 'rgba(218,218,218,0.45)', cursor: 'pointer',
            fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.12em', padding: '16px 24px', textTransform: 'uppercase'
          }}>{f}</button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.3)', letterSpacing: '0.08em' }}>{filtered.length} ITEMS</div>
      </div>
      <div className="sbc-page-pad" style={{ padding: '40px 64px 64px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {filtered.map((item) => <StoreCard key={item.id + ':' + filter} item={item} />)}
      </div>
    </div>
  );
};

// ── PREFERENCES TAB (own component so hooks order stays stable) ──
const PreferencesTab = () => {
  const [prefs, setPrefs] = React.useState({
    'Match-day reminders': true,
    'Goal alerts (live)': true,
    'Transfer rumours': true,
    'Panikova fern updates': true,
    'Weekly newsletter': false,
    'Marketing emails': false
  });
  return (
    <div className="sbc-prefs-card" style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderRadius: 8, padding: '24px 28px', maxWidth: 640 }}>
      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', marginBottom: 18, letterSpacing: '0.04em' }}>Notifications</div>
      {Object.entries(prefs).map(([label, on]) => (
        <div key={label} onClick={() => setPrefs((p) => ({ ...p, [label]: !p[label] }))} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
          <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: '#fff' }}>{label}</span>
          <div className={on ? 'sbc-toggle sbc-toggle-on' : 'sbc-toggle sbc-toggle-off'} style={{ width: 44, height: 22, borderRadius: 11, background: on ? 'var(--accent)' : 'rgba(255,255,255,0.18)', position: 'relative', transition: 'all 0.2s', border: on ? 'none' : '1px solid rgba(255,255,255,0.3)' }}>
            <div style={{ position: 'absolute', top: 2, left: on ? 24 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ── ACCOUNT PAGE ────────────────────────────────────────────────
const AccountPage = ({ setPage }) => {
  // Real Supabase-backed auth state. The mock localStorage gating is gone.
  const auth = useAuth();
  const [tab, setTab] = React.useState('PROFILE');
  const [signInForm, setSignInForm] = React.useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = React.useState({ email: '', password: '', displayName: '', inviteCode: '' });
  const [signInError, setSignInError] = React.useState(null);
  const [signUpError, setSignUpError] = React.useState(null);
  const [signUpSuccess, setSignUpSuccess] = React.useState(null); // null | { needsConfirm: boolean, email: string }
  const [busy, setBusy] = React.useState(false);
  const [editingName, setEditingName] = React.useState(false);
  const [draftName, setDraftName] = React.useState('');
  // Forgot-password flow.
  const [forgotMode, setForgotMode] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [forgotError, setForgotError] = React.useState(null);
  const [forgotSent, setForgotSent] = React.useState(false);
  // Set-new-password (recovery) flow — triggered by Supabase when user
  // lands via a reset email link.
  const [newPwd, setNewPwd] = React.useState('');
  const [newPwdConfirm, setNewPwdConfirm] = React.useState('');
  const [newPwdError, setNewPwdError] = React.useState(null);
  const [newPwdSuccess, setNewPwdSuccess] = React.useState(false);
  const tabs = ['PROFILE', 'BASKET', 'ORDERS', 'TICKETS', 'PREFERENCES'];

  const handleSignIn = async (e) => {
    e?.preventDefault?.();
    setSignInError(null);
    setBusy(true);
    const { error } = await auth.signIn(signInForm.email, signInForm.password);
    setBusy(false);
    if (error) setSignInError(error);
  };
  const handleSignUp = async (e) => {
    e?.preventDefault?.();
    setSignUpError(null);
    if (signUpForm.password.length < 6) { setSignUpError('Password must be at least 6 characters.'); return; }
    if (!signUpForm.displayName.trim()) { setSignUpError('Please pick a display name.'); return; }
    if (!signUpForm.inviteCode.trim()) { setSignUpError('You need an invite code to sign up.'); return; }
    setBusy(true);
    const { error, needsEmailConfirmation } = await auth.signUp(
      signUpForm.email,
      signUpForm.password,
      signUpForm.displayName,
      signUpForm.inviteCode,
    );
    setBusy(false);
    if (error) { setSignUpError(error); return; }
    setSignUpSuccess({ needsConfirm: needsEmailConfirmation, email: signUpForm.email });
  };
  const handleSaveName = async () => {
    const { error } = await auth.updateDisplayName(draftName);
    if (error) { alert(error); return; }
    setEditingName(false);
  };

  const handleSendReset = async (e) => {
    e?.preventDefault?.();
    setForgotError(null);
    setBusy(true);
    const { error } = await auth.requestPasswordReset(forgotEmail);
    setBusy(false);
    if (error) { setForgotError(error); return; }
    setForgotSent(true);
  };

  const handleSetNewPassword = async (e) => {
    e?.preventDefault?.();
    setNewPwdError(null);
    if (newPwd !== newPwdConfirm) { setNewPwdError('Both passwords need to match.'); return; }
    setBusy(true);
    const { error } = await auth.applyNewPassword(newPwd);
    setBusy(false);
    if (error) { setNewPwdError(error); return; }
    setNewPwdSuccess(true);
    setNewPwd(''); setNewPwdConfirm('');
  };

  const memberSinceLabel = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  // ── Recovery (set new password) — takes priority over everything else
  // because the user has clicked a one-time email link and we want them to
  // pick a new password before doing anything else.
  if (auth.recoveryMode) {
    return (
      <div style={{ background: 'transparent', minHeight: '100vh' }}>
        <AccountPageHeader subtitle="Almost done" title="SET A NEW PASSWORD" />
        <RainbowBar />
        <div className="sbc-page-pad" style={{ padding: '64px 64px 96px', maxWidth: 520, margin: '0 auto' }}>
          <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderRadius: 8, padding: '28px 32px' }}>
            {newPwdSuccess ? (
              <>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', marginBottom: 14 }}>Password updated ✓</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 14, color: 'rgba(218,218,218,0.75)', lineHeight: 1.6, marginBottom: 18 }}>
                  Your new password is set and you're signed in.
                </div>
                <button onClick={() => { setNewPwdSuccess(false); auth.clearRecoveryMode(); }}
                        style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.18em', padding: '12px 22px', borderRadius: 4, textTransform: 'uppercase' }}>Continue</button>
              </>
            ) : (
              <form onSubmit={handleSetNewPassword}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', marginBottom: 8 }}>Choose a new password</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.65)', lineHeight: 1.6, marginBottom: 18 }}>
                  Type a new password (at least 6 characters), then confirm it. Your old password will stop working as soon as this is saved.
                </div>
                <input type="password" required minLength={6} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="New password"
                       style={{ width: '100%', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '12px 14px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
                <input type="password" required minLength={6} value={newPwdConfirm} onChange={(e) => setNewPwdConfirm(e.target.value)} placeholder="Confirm new password"
                       style={{ width: '100%', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '12px 14px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13, marginBottom: 16, boxSizing: 'border-box' }} />
                {newPwdError && <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'var(--accent)', marginBottom: 12 }}>{newPwdError}</div>}
                <button type="submit" disabled={busy}
                        style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.18em', padding: '14px 0', borderRadius: 4, textTransform: 'uppercase', opacity: busy ? 0.6 : 1 }}>{busy ? '…' : 'SAVE NEW PASSWORD →'}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Guard: still loading the initial session ──
  if (auth.loading) {
    return (
      <div style={{ background: 'transparent', minHeight: '100vh' }}>
        <AccountPageHeader subtitle="Loading…" title="MEMBERS AREA" />
        <RainbowBar />
        <div style={{ padding: '64px', textAlign: 'center', color: 'rgba(218,218,218,0.5)', fontFamily: 'Roboto, sans-serif', fontSize: 13 }}>Checking your session…</div>
      </div>
    );
  }

  // ── Just signed up, awaiting email confirmation ──
  if (!auth.user && signUpSuccess) {
    return (
      <div style={{ background: 'transparent', minHeight: '100vh' }}>
        <AccountPageHeader subtitle="Almost in" title="CHECK YOUR EMAIL" />
        <RainbowBar />
        <div className="sbc-page-pad" style={{ padding: '64px 64px 96px', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderRadius: 8, padding: '28px 32px' }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', marginBottom: 14 }}>One more step</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 14, color: 'rgba(218,218,218,0.75)', lineHeight: 1.6, marginBottom: 18 }}>
              We've sent a confirmation link to <strong style={{ color: '#fff' }}>{signUpSuccess.email}</strong>. Click the link in that email to activate your account, then come back here and sign in.
            </div>
            <button onClick={() => { setSignUpSuccess(null); setSignUpForm({ email: '', password: '', displayName: '', inviteCode: '' }); }}
                    style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.18em', padding: '12px 22px', borderRadius: 4, textTransform: 'uppercase' }}>Back to Sign In</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Not signed in: side-by-side sign-in / sign-up ──
  if (!auth.user) {
    return (
      <div style={{ background: 'transparent', minHeight: '100vh' }}>
        <AccountPageHeader subtitle="Members Area" title="JOIN THE CLIQUE" />
        <RainbowBar />
        <div className="sbc-page-pad sbc-auth-grid" style={{ padding: '64px 64px 96px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, maxWidth: 980, margin: '0 auto' }}>
          {/* Sign in / forgot-password — same card, two modes. */}
          {forgotMode ? (
            <form onSubmit={handleSendReset} style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderRadius: 8, padding: '32px 32px 28px' }}>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'rgba(218,218,218,0.5)', marginBottom: 8, textTransform: 'uppercase' }}>Reset access</div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: '#fff', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.04em' }}>Forgot password</div>
              {forgotSent ? (
                <>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.75)', lineHeight: 1.6, marginBottom: 18 }}>
                    If an account exists for <strong style={{ color: '#fff' }}>{forgotEmail}</strong>, we've emailed it a reset link. Click it and you'll be brought back here to set a new password.
                  </div>
                  <button type="button" onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(''); setForgotError(null); }}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', padding: '10px 16px', borderRadius: 4, textTransform: 'uppercase' }}>← Back to Sign In</button>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.65)', lineHeight: 1.55, marginBottom: 14 }}>
                    Enter the email you signed up with. We'll send you a link to set a new password.
                  </div>
                  <input type="email" placeholder="Email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                         style={{ width: '100%', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '12px 14px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13, marginBottom: 16, boxSizing: 'border-box' }} />
                  {forgotError && <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'var(--accent)', marginBottom: 12 }}>{forgotError}</div>}
                  <button type="submit" disabled={busy} style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.18em', padding: '14px 0', borderRadius: 4, textTransform: 'uppercase', opacity: busy ? 0.6 : 1, marginBottom: 10 }}>{busy ? '…' : 'SEND RESET LINK →'}</button>
                  <button type="button" onClick={() => { setForgotMode(false); setForgotError(null); }}
                          style={{ width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(218,218,218,0.65)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', padding: '10px 0', borderRadius: 4, textTransform: 'uppercase' }}>← Back to Sign In</button>
                </>
              )}
            </form>
          ) : (
            <form onSubmit={handleSignIn} style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderRadius: 8, padding: '32px 32px 28px' }}>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'rgba(218,218,218,0.5)', marginBottom: 8, textTransform: 'uppercase' }}>Already initiated</div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: '#fff', textTransform: 'uppercase', marginBottom: 18, letterSpacing: '0.04em' }}>Sign In</div>
              <input type="email" placeholder="Email" required value={signInForm.email} onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                     style={{ width: '100%', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '12px 14px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
              <input type="password" placeholder="Password" required value={signInForm.password} onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                     style={{ width: '100%', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '12px 14px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13, marginBottom: 18, boxSizing: 'border-box' }} />
              {signInError && <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'var(--accent)', marginBottom: 12 }}>{signInError}</div>}
              <button type="submit" disabled={busy} style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.18em', padding: '14px 0', borderRadius: 4, textTransform: 'uppercase', opacity: busy ? 0.6 : 1 }}>{busy ? '…' : 'SIGN IN →'}</button>
              <button type="button" onClick={() => { setForgotMode(true); setForgotEmail(signInForm.email); setSignInError(null); }}
                      style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: 'rgba(218,218,218,0.55)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 12, padding: 0, textDecoration: 'underline' }}>
                Forgot password?
              </button>
            </form>
          )}

          {/* Sign up — invite-only */}
          <form onSubmit={handleSignUp} style={{ background: 'rgba(228,0,43,0.08)', border: '1px solid rgba(228,0,43,0.5)', borderRadius: 8, padding: '32px 32px 28px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--accent)', color: '#fff', padding: '4px 10px', fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', borderRadius: '0 8px 0 4px' }}>INVITE-ONLY</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', marginBottom: 8, textTransform: 'uppercase' }}>Got a code?</div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: '#fff', textTransform: 'uppercase', marginBottom: 14, letterSpacing: '0.04em' }}>Create Account</div>
            <input type="text" placeholder="Display name" required value={signUpForm.displayName} onChange={(e) => setSignUpForm({ ...signUpForm, displayName: e.target.value })}
                   style={{ width: '100%', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '12px 14px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
            <input type="email" placeholder="Email" required value={signUpForm.email} onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                   style={{ width: '100%', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '12px 14px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
            <input type="password" placeholder="Password (min 6 chars)" required value={signUpForm.password} onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                   style={{ width: '100%', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '12px 14px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
            <input type="text" placeholder="Invite code" required value={signUpForm.inviteCode} onChange={(e) => setSignUpForm({ ...signUpForm, inviteCode: e.target.value })}
                   style={{ width: '100%', background: 'rgba(8,15,30,0.6)', border: '1px solid var(--accent)', borderRadius: 4, padding: '12px 14px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13, marginBottom: 16, boxSizing: 'border-box', letterSpacing: '0.05em' }} />
            {signUpError && <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'var(--accent)', marginBottom: 12 }}>{signUpError}</div>}
            <button type="submit" disabled={busy} style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.18em', padding: '14px 0', borderRadius: 4, textTransform: 'uppercase', opacity: busy ? 0.6 : 1 }}>{busy ? '…' : 'EMBRACE SADNESS →'}</button>
          </form>
        </div>
      </div>
    );
  }

  // ── Signed in but profile failed to load (edge case) ──
  if (!auth.profile) {
    return (
      <div style={{ background: 'transparent', minHeight: '100vh' }}>
        <AccountPageHeader subtitle="Hmm" title="PROFILE UNAVAILABLE" />
        <RainbowBar />
        <div className="sbc-page-pad" style={{ padding: '64px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 14, color: 'rgba(218,218,218,0.7)', marginBottom: 18 }}>We couldn't find a profile for your account. Try signing out and in again.</div>
          <button onClick={() => auth.signOut()} style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.18em', padding: '12px 22px', borderRadius: 4, textTransform: 'uppercase' }}>SIGN OUT</button>
        </div>
      </div>
    );
  }

  const profile = auth.profile;
  const initials = (profile.display_name || 'SB').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase() || 'SB';

  // ── Signed in: full profile + parody tabs ──
  return (
    <div className="sbc-account-page" style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="sbc-page-header sbc-account-hero" style={{ position: 'relative', height: 240, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--page-header-image)', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.85) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.85) 0%, transparent 50%)' }} />
        <div className="sbc-account-hero-content" style={{ position: 'absolute', left: 64, bottom: 32, display: 'flex', alignItems: 'flex-end', gap: 20 }}>
          <div className="sbc-account-avatar" style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(228,0,43,0.15)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 40, color: 'var(--accent)' }}>{initials}</div>
          <div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', marginBottom: 6, textTransform: 'uppercase' }}>
              Member since {memberSinceLabel(profile.created_at)}{profile.is_admin ? ' · Admin' : ''}
            </div>
            <div className="sbc-account-displayname" style={{ fontFamily: 'Anton, sans-serif', fontSize: 56, color: '#fff', lineHeight: 0.9, textTransform: 'uppercase', textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}>{profile.display_name}</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, fontWeight: 300, color: 'rgba(218,218,218,0.6)', marginTop: 6, fontStyle: 'italic' }}>"Welcome back, manager."</div>
          </div>
        </div>
      </div>
      <RainbowBar />
      <div className="sbc-filter-bar" style={{ background: 'rgba(6,12,24,0.22)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(228,0,43,0.12)', display: 'flex', gap: 0, padding: '0 64px' }}>
        {tabs.map((t) =>
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', borderBottom: tab === t ? '3px solid var(--accent)' : '3px solid transparent',
            color: tab === t ? 'var(--accent)' : 'rgba(218,218,218,0.45)', cursor: 'pointer',
            fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.12em', padding: '16px 24px', textTransform: 'uppercase'
          }}>{t}</button>
        )}
      </div>
      <div className="sbc-page-pad" style={{ padding: '40px 64px 64px' }}>
        {/* Sign-out (top-right) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button onClick={() => auth.signOut()} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(218,218,218,0.55)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.18em', padding: '7px 14px', borderRadius: 3, textTransform: 'uppercase' }}>SIGN OUT</button>
        </div>
        {tab === 'PROFILE' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderRadius: 8, padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Account</div>
                {!editingName && (
                  <button onClick={() => { setDraftName(profile.display_name); setEditingName(true); }}
                          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(218,218,218,0.7)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 9, letterSpacing: '0.18em', padding: '5px 10px', borderRadius: 3, textTransform: 'uppercase' }}>EDIT NAME</button>
                )}
              </div>
              {editingName ? (
                <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
                  <input type="text" value={draftName} onChange={(e) => setDraftName(e.target.value)}
                         style={{ flex: 1, background: 'rgba(8,15,30,0.6)', border: '1px solid var(--accent)', borderRadius: 4, padding: '10px 12px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13 }} />
                  <button onClick={handleSaveName} style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.14em', padding: '0 14px', borderRadius: 4, textTransform: 'uppercase' }}>Save</button>
                  <button onClick={() => setEditingName(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(218,218,218,0.55)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, padding: '0 12px', borderRadius: 4 }}>Cancel</button>
                </div>
              ) : null}
              {[
                ['DISPLAY NAME', profile.display_name],
                ['EMAIL', auth.user.email],
                ['MEMBER SINCE', memberSinceLabel(profile.created_at)],
                ['ROLE', profile.is_admin ? 'ADMIN' : 'MEMBER'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.45)', textTransform: 'uppercase' }}>{k}</span>
                  <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: '#fff', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderRadius: 8, padding: '24px 28px' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', marginBottom: 18, letterSpacing: '0.04em' }}>Sad Boi Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  ['MATCHES ATTENDED', '14'],
                  ['SHIRTS OWNED', '3'],
                  ['CLIQUE POINTS', '2,840'],
                  ['BANTER LEVEL', 'MAXED'],
                  ['AURA STABILITY', '78%'],
                  ['SADNESS EMBRACED', '∞']
                ].map(([k, v]) => (
                  <div key={k} style={{ background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(228,0,43,0.18)', borderLeft: '3px solid var(--accent)', borderRadius: 4, padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: 'var(--accent)', lineHeight: 1 }}>{v}</div>
                    <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase', marginTop: 4 }}>{k}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab === 'BASKET' && (
          <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderRadius: 8, padding: '40px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(228,0,43,0.12)', border: '2px dashed rgba(228,0,43,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18l-2 12H5L3 6z"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Your basket is empty</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.6)', maxWidth: 420, margin: '0 auto 22px', lineHeight: 1.6 }}>£0.00 of regret. Time to fix that.</div>
            <button onClick={() => setPage('store')} style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.18em', padding: '12px 26px', borderRadius: 4, textTransform: 'uppercase' }}>BROWSE THE STORE →</button>
          </div>
        )}
        {tab === 'ORDERS' && (
          <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderRadius: 8, overflow: 'hidden' }}>
            {[
              { id: '#SBC-2417', date: 'APR 22 2026', items: 'Home Kit 25/26 + Panikova Scarf', total: 100, status: 'DELIVERED', clr: '#2a9d8f' },
              { id: '#SBC-2389', date: 'MAR 14 2026', items: 'Training Hoodie', total: 55, status: 'DELIVERED', clr: '#2a9d8f' },
              { id: '#SBC-2356', date: 'FEB 02 2026', items: 'Aura Stability Mug × 2', total: 28, status: 'DELIVERED', clr: '#2a9d8f' },
              { id: '#SBC-2298', date: 'JAN 09 2026', items: 'Away Kit 24/25 + Bucket Hat', total: 96, status: 'DELIVERED', clr: '#2a9d8f' }
            ].map((o, i) => (
              <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 110px', gap: 16, alignItems: 'center', padding: '16px 24px', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: 'var(--accent)', letterSpacing: '0.05em' }}>{o.id}</div>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'rgba(218,218,218,0.4)', letterSpacing: '0.1em', marginTop: 2 }}>{o.date}</div>
                </div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: '#fff' }}>{o.items}</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textAlign: 'right' }}>£{o.total}</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: o.clr, background: `${o.clr}22`, padding: '5px 10px', borderRadius: 3, letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center' }}>{o.status}</div>
              </div>
            ))}
          </div>
        )}
        {tab === 'TICKETS' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { match: 'SBC vs FC MIDNIGHT', date: 'MAY 03 · 20:00', seat: 'BLOCK A · ROW 12 · SEAT 14', status: 'UPCOMING', clr: 'var(--accent)' },
              { match: 'SBC vs REAL SADRID', date: 'MAY 17 · 15:00', seat: 'BLOCK A · ROW 12 · SEAT 14', status: 'UPCOMING', clr: 'var(--accent)' },
              { match: 'SBC vs INTER VIBES', date: 'MAR 30 · 17:30', seat: 'BLOCK A · ROW 12 · SEAT 14', status: 'USED', clr: 'rgba(218,218,218,0.4)' }
            ].map((t, i) => (
              <div key={i} style={{ background: 'rgba(10,22,40,0.7)', border: `1px solid ${t.clr === 'var(--accent)' ? 'rgba(228,0,43,0.4)' : 'rgba(255,255,255,0.08)'}`, borderLeft: `4px solid ${t.clr}`, borderRadius: 6, padding: '18px 20px' }}>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: t.clr, textTransform: 'uppercase', marginBottom: 8 }}>● {t.status}</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 6 }}>{t.match}</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: 'var(--accent)', letterSpacing: '0.05em', marginBottom: 10 }}>{t.date}</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t.seat}</div>
              </div>
            ))}
          </div>
        )}
        {tab === 'PREFERENCES' && <PreferencesTab />}
      </div>
    </div>
  );
};

/** Reusable header band for the AccountPage's various states. */
const AccountPageHeader = ({ subtitle, title }) => (
  <div className="sbc-page-header" style={{ position: 'relative', height: 220, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--page-header-image)', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.85) 100%)' }} />
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.85) 0%, transparent 50%)' }} />
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 64px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 3, height: 18, background: 'var(--accent)' }} />
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', color: 'var(--accent)', textTransform: 'uppercase' }}>{subtitle}</div>
      </div>
      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 64, color: '#fff', lineHeight: 0.9, textTransform: 'uppercase', textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}>{title}</div>
    </div>
  </div>
);


// ── ADMIN PAGE ──────────────────────────────────────────────────
// Phase 4B introduced the empty frame. Phase 4C builds the editors,
// one section at a time. Each section is a tab. The first to land is
// "Invite Codes"; the others stay as "Coming soon" placeholders for
// now and will be filled in subsequent commits.
const AdminPage = ({ setPage }) => {
  const auth = useAuth();
  const [tab, setTab] = React.useState('invites'); // 'invites' | 'news' | 'transfers' | 'store' | 'players'

  if (auth.loading) {
    return (
      <div style={{ background: 'transparent', minHeight: '100vh' }}>
        <AccountPageHeader subtitle="Loading…" title="ADMIN" />
        <RainbowBar />
        <div style={{ padding: 64, textAlign: 'center', color: 'rgba(218,218,218,0.5)', fontFamily: 'Roboto, sans-serif', fontSize: 13 }}>Checking your permissions…</div>
      </div>
    );
  }
  if (!auth.user || !auth.profile?.is_admin) {
    return (
      <div style={{ background: 'transparent', minHeight: '100vh' }}>
        <AccountPageHeader subtitle="Restricted" title="ADMIN ONLY" />
        <RainbowBar />
        <div style={{ padding: '64px 64px 96px', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 14, color: 'rgba(218,218,218,0.7)', lineHeight: 1.6, marginBottom: 22 }}>
            This page is only available to admin accounts. {auth.user ? 'Sign in with an admin account to continue.' : 'Sign in to continue.'}
          </div>
          <button onClick={() => setPage('account')} style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.18em', padding: '12px 22px', borderRadius: 4, textTransform: 'uppercase' }}>Go to Account</button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'invites',   label: 'Invite Codes',  ready: true  },
    { id: 'news',      label: 'News Articles', ready: true  },
    { id: 'transfers', label: 'Transfers',     ready: true  },
    { id: 'store',     label: 'Store Items',   ready: true  },
    { id: 'players',   label: 'Player Lore',   ready: true  },
  ];

  return (
    <div className="sbc-admin-page" style={{ background: 'transparent', minHeight: '100vh' }}>
      <AccountPageHeader subtitle={`Signed in as ${auth.profile.display_name}`} title="ADMIN" />
      <RainbowBar />
      <div className="sbc-page-pad" style={{ padding: '32px 64px 96px', maxWidth: 1100, margin: '0 auto' }}>
        {/* Tab strip */}
        <div className="sbc-admin-tabs" style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'rgba(8,15,30,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden', flexWrap: 'wrap' }}>
          {tabs.map((t, i) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: '1 1 auto', padding: '12px 18px', border: 'none', cursor: 'pointer',
                background: tab === t.id ? 'rgba(228,0,43,0.18)' : 'transparent',
                color: tab === t.id ? '#fff' : 'rgba(218,218,218,0.55)',
                fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase',
                borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>
              {tab === t.id ? '▶ ' : ''}{t.label}
              {!t.ready && <span style={{ marginLeft: 6, fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.4)' }}>SOON</span>}
            </button>
          ))}
        </div>

        {tab === 'invites'   && <AdminInvitesPanel />}
        {tab === 'news'      && <AdminNewsPanel />}
        {tab === 'transfers' && <AdminTransfersPanel />}
        {tab === 'store'     && <AdminStorePanel />}
        {tab === 'players'   && <AdminPlayerLorePanel />}
      </div>
    </div>
  );
};

// ── ADMIN: Invite Codes panel ────────────────────────────────────
const AdminInvitesPanel = () => {
  const auth = useAuth();
  const [codes, setCodes]   = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr]       = React.useState(null);
  const [busy, setBusy]     = React.useState(false);
  const [draftCode, setDraftCode] = React.useState('');
  const [draftNotes, setDraftNotes] = React.useState('');
  const [copied, setCopied] = React.useState(null);

  const fetchCodes = React.useCallback(async () => {
    const sb = (await import('./supabase')).getSupabase();
    if (!sb) { setErr('No backend connection.'); setLoading(false); return; }
    const { data, error } = await sb
      .from('invite_codes')
      .select('code, created_at, expires_at, used_at, used_by, notes')
      .order('created_at', { ascending: false });
    if (error) setErr(error.message);
    setCodes(data || []);
    setLoading(false);
  }, []);

  // Load all profile rows we need for "used by" name display.
  const [namesByUserId, setNamesByUserId] = React.useState/* :Map<string,string> */(new Map());
  React.useEffect(() => {
    let cancelled = false;
    fetchCodes();
    (async () => {
      const sb = (await import('./supabase')).getSupabase();
      if (!sb) return;
      const { data } = await sb.from('profiles').select('id, display_name');
      if (cancelled || !data) return;
      const m = new Map();
      for (const row of data) m.set(row.id, row.display_name);
      setNamesByUserId(m);
    })();
    return () => { cancelled = true; };
  }, [fetchCodes]);

  const generateRandom = () => {
    // 8-char A-Z + digits; skip 0/O/1/I to avoid confusion when typed.
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
    setDraftCode(s);
  };

  const create = async () => {
    setErr(null);
    const code = draftCode.trim();
    if (!code) { setErr('Enter a code, or click "Generate random" to make one.'); return; }
    setBusy(true);
    const sb = (await import('./supabase')).getSupabase();
    const { error } = await sb.from('invite_codes').insert({
      code, notes: draftNotes.trim() || null, created_by: auth.user.id,
    });
    setBusy(false);
    if (error) {
      setErr(error.code === '23505' ? 'That code already exists — pick another.' : error.message);
      return;
    }
    setDraftCode('');
    setDraftNotes('');
    fetchCodes();
  };

  const revoke = async (code) => {
    if (!confirm(`Revoke (delete) invite code "${code}"? This can't be undone.`)) return;
    const sb = (await import('./supabase')).getSupabase();
    const { error } = await sb.from('invite_codes').delete().eq('code', code);
    if (error) { setErr(error.message); return; }
    fetchCodes();
  };

  const copy = async (code) => {
    try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied((c) => c === code ? null : c), 1400); }
    catch { /* ignore */ }
  };

  const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Generate */}
      <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderRadius: 8, padding: '20px 24px' }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 14 }}>Generate Invite Code</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,1fr) auto 2fr auto', gap: 10, alignItems: 'center' }}>
          <input type="text" value={draftCode} onChange={(e) => setDraftCode(e.target.value)} placeholder="Code (e.g. GYMSKIN-2026 or click Generate)"
                 style={{ background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '10px 12px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13, letterSpacing: '0.04em' }} />
          <button onClick={generateRandom} type="button"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', padding: '10px 14px', borderRadius: 4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Generate random</button>
          <input type="text" value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} placeholder="Notes (optional — e.g. 'For Donny P')"
                 style={{ background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '10px 12px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13 }} />
          <button onClick={create} disabled={busy || !draftCode.trim()}
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.16em', padding: '10px 18px', borderRadius: 4, textTransform: 'uppercase', whiteSpace: 'nowrap', opacity: (busy || !draftCode.trim()) ? 0.5 : 1 }}>
            {busy ? '…' : 'Create →'}
          </button>
        </div>
        {err && <div style={{ marginTop: 10, fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'var(--accent)' }}>{err}</div>}
      </div>

      {/* Existing codes table */}
      <div style={{ background: 'rgba(8,15,30,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 0.6fr 1.2fr 1.4fr 0.7fr', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
            {['Code','Created','Status','Used by','Notes',''].map((h, i) => (
              <div key={i} style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase' }}>{h}</div>
            ))}
        </div>
        {loading && <div style={{ padding: 20, fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.5)' }}>Loading…</div>}
        {!loading && codes.length === 0 && (
          <div style={{ padding: 20, fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.5)' }}>No invite codes yet. Create one above.</div>
        )}
        {codes.map((c, i) => {
          const isUsed = !!c.used_at;
          const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
          const status = isUsed ? 'USED' : isExpired ? 'EXPIRED' : 'UNUSED';
          const statusColor = isUsed ? 'rgba(218,218,218,0.45)' : isExpired ? '#e9c46a' : '#2a9d8f';
          const usedByName = c.used_by ? (namesByUserId.get(c.used_by) || '—') : '—';
          return (
            <div key={c.code} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 0.6fr 1.2fr 1.4fr 0.7fr', alignItems: 'center', padding: '12px 18px', borderBottom: i < codes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <code style={{ fontFamily: 'Roboto Mono, ui-monospace, monospace', fontSize: 12, color: '#fff', background: 'rgba(255,255,255,0.05)', padding: '3px 7px', borderRadius: 3 }}>{c.code}</code>
                {!isUsed && (
                  <button onClick={() => copy(c.code)} title="Copy"
                          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(218,218,218,0.65)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', padding: '3px 8px', borderRadius: 3, textTransform: 'uppercase' }}>
                    {copied === c.code ? 'Copied ✓' : 'Copy'}
                  </button>
                )}
              </div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.65)' }}>{fmtDate(c.created_at)}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: statusColor, textTransform: 'uppercase' }}>● {status}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: '#fff' }}>{usedByName}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.7)' }}>{c.notes || '—'}</div>
              <div>
                {!isUsed && (
                  <button onClick={() => revoke(c.code)}
                          style={{ background: 'transparent', border: '1px solid rgba(228,0,43,0.4)', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', padding: '5px 10px', borderRadius: 3, textTransform: 'uppercase' }}>
                    Revoke
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.4)', lineHeight: 1.6, padding: '0 4px' }}>
        Codes are single-use — once a friend signs up with one, it's marked
        used and the row sticks around as an audit trail. Revoke deletes
        only unused codes; used codes can't be revoked.
      </div>
    </div>
  );
};

// ── ADMIN: News Articles panel ──────────────────────────────────
// List, create, edit, delete entries in news_articles. Anyone with
// is_admin = true on their profile can use this; RLS on the table
// is the actual gate.
const AdminNewsPanel = () => {
  const auth = useAuth();
  const [rows, setRows]       = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr]         = React.useState(null);
  const [busy, setBusy]       = React.useState(false);
  const [editingId, setEditingId] = React.useState/* :null|'new'|number */(null);
  const [uploading, setUploading] = React.useState(false);
  // Editor form state. `id` is null for new posts, the row id for edits.
  const blankForm = {
    headline: '', summary: '', body: '',
    tag: 'BREAKING', tag_color: '#E4002B',
    kicker: '', image_url: '', author: '',
    hot: false,
    published_at: new Date().toISOString().slice(0, 16), // 'YYYY-MM-DDTHH:mm' for the input
  };
  const [form, setForm] = React.useState(blankForm);

  /** Upload a file the admin chose to the `news-images` storage bucket
   *  and put the resulting public URL into the form's image_url field. */
  const onUploadImage = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr('Image is over 5 MB — please pick a smaller one.'); return; }
    setUploading(true);
    setErr(null);
    try {
      const sb = (await import('./supabase')).getSupabase();
      // Sanitize filename and prefix with timestamp to avoid collisions.
      const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').toLowerCase();
      const path = `${Date.now()}-${safe}`;
      const { error: upErr } = await sb.storage.from('news-images').upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) { setErr(`Upload failed: ${upErr.message}`); return; }
      const { data } = sb.storage.from('news-images').getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
    } finally {
      setUploading(false);
    }
  };

  const fetchRows = React.useCallback(async () => {
    setLoading(true);
    const sb = (await import('./supabase')).getSupabase();
    if (!sb) { setErr('No backend connection.'); setLoading(false); return; }
    const { data, error } = await sb
      .from('news_articles')
      .select('id, published_at, created_at, headline, summary, body, tag, tag_color, kicker, image_url, author, hot')
      .order('published_at', { ascending: false });
    if (error) setErr(error.message);
    setRows(data || []);
    setLoading(false);
  }, []);

  React.useEffect(() => { fetchRows(); }, [fetchRows]);

  const openNew = () => {
    setForm({ ...blankForm, published_at: new Date().toISOString().slice(0, 16) });
    setEditingId('new');
    setErr(null);
  };

  const openEdit = (row) => {
    setForm({
      headline: row.headline ?? '',
      summary:  row.summary  ?? '',
      body:     row.body     ?? '',
      tag:      row.tag      ?? 'NEWS',
      tag_color:row.tag_color ?? '#E4002B',
      kicker:   row.kicker   ?? '',
      image_url:row.image_url ?? '',
      author:   row.author   ?? '',
      hot:      Boolean(row.hot),
      published_at: row.published_at ? new Date(row.published_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    });
    setEditingId(row.id);
    setErr(null);
  };

  const cancelEdit = () => { setEditingId(null); setErr(null); };

  const save = async () => {
    setErr(null);
    if (!form.headline.trim()) { setErr('Headline is required.'); return; }
    setBusy(true);
    const sb = (await import('./supabase')).getSupabase();
    const payload = {
      headline:    form.headline.trim(),
      summary:     form.summary.trim(),
      body:        form.body,
      tag:         form.tag.trim() || 'NEWS',
      tag_color:   form.tag_color.trim() || '#E4002B',
      kicker:      form.kicker.trim() || null,
      image_url:   form.image_url.trim() || null,
      author:      form.author.trim() || null,
      hot:         form.hot,
      published_at: new Date(form.published_at).toISOString(),
    };
    let error;
    if (editingId === 'new') {
      ({ error } = await sb.from('news_articles').insert({ ...payload, created_by: auth.user?.id ?? null }));
    } else {
      ({ error } = await sb.from('news_articles').update(payload).eq('id', editingId));
    }
    setBusy(false);
    if (error) { setErr(error.message); return; }
    invalidateLiveNews();
    setEditingId(null);
    fetchRows();
  };

  const remove = async (row) => {
    if (!confirm(`Delete "${row.headline}"? This can't be undone.`)) return;
    const sb = (await import('./supabase')).getSupabase();
    const { error } = await sb.from('news_articles').delete().eq('id', row.id);
    if (error) { setErr(error.message); return; }
    invalidateLiveNews();
    fetchRows();
  };

  const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  // Preset tag/colour combos that mirror the prototype's existing palette.
  const tagPresets = [
    { tag: 'BREAKING',     color: '#E4002B' },
    { tag: 'MATCH REPORT', color: '#9b5de5' },
    { tag: 'ANALYSIS',     color: '#e9c46a' },
    { tag: 'TRANSFER',     color: '#2a9d8f' },
    { tag: 'EXCLUSIVE',    color: '#ff2244' },
    { tag: 'CULTURE',      color: '#9b5de5' },
    { tag: 'POST-MATCH',   color: '#f4a261' },
    { tag: 'LORE',         color: '#f4a261' },
    { tag: 'ONGOING',      color: '#00c8ff' },
    { tag: 'NEWS',         color: '#E4002B' },
  ];

  // ── EDITOR ──────────────────────────────────────────────────────
  if (editingId !== null) {
    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{editingId === 'new' ? 'New article' : 'Edit article'}</div>
          <button onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(218,218,218,0.65)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', padding: '8px 14px', borderRadius: 4, textTransform: 'uppercase' }}>← Back to list</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Headline" required>
            <input type="text" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Kicker (optional)">
            <input type="text" placeholder='e.g. "Exclusive Investigation"' value={form.kicker} onChange={(e) => setForm({ ...form, kicker: e.target.value })} style={inputStyle} />
          </Field>
        </div>

        <Field label="Summary (one-line preview text shown on cards)">
          <textarea rows={2} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} style={{ ...inputStyle, fontFamily: 'Roboto, sans-serif', resize: 'vertical' }} />
        </Field>

        <Field label="Body (full article text — line breaks become paragraphs)">
          <textarea rows={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} style={{ ...inputStyle, fontFamily: 'Roboto, sans-serif', resize: 'vertical', lineHeight: 1.55 }} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Field label="Tag">
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
              <select onChange={(e) => { const p = tagPresets[+e.target.value]; if (p) setForm({ ...form, tag: p.tag, tag_color: p.color }); e.target.selectedIndex = 0; }} style={{ ...inputStyle, width: 36, padding: '0 6px', cursor: 'pointer' }}>
                <option value="">▼</option>
                {tagPresets.map((p, i) => <option key={p.tag} value={i}>{p.tag}</option>)}
              </select>
            </div>
          </Field>
          <Field label="Tag colour">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={form.tag_color} onChange={(e) => setForm({ ...form, tag_color: e.target.value })} style={{ width: 38, height: 38, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: 0, background: 'transparent', cursor: 'pointer' }} />
              <input type="text" value={form.tag_color} onChange={(e) => setForm({ ...form, tag_color: e.target.value })} style={{ ...inputStyle, flex: 1, fontFamily: 'Roboto Mono, ui-monospace, monospace' }} />
            </div>
          </Field>
          <Field label="Author (optional byline)">
            <input type="text" placeholder='e.g. "Club Insider"' value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
          <Field label="Lead image">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="text" placeholder="Paste a URL/path, or click Upload →" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
              <label style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', padding: '10px 14px', borderRadius: 4, textTransform: 'uppercase', whiteSpace: 'nowrap', opacity: uploading ? 0.5 : 1 }}>
                {uploading ? 'Uploading…' : 'Upload'}
                <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { onUploadImage(e.target.files?.[0]); e.target.value = ''; }} style={{ display: 'none' }} />
              </label>
            </div>
            {form.image_url && <div style={{ marginTop: 8 }}><img src={form.image_url} alt="" style={{ maxWidth: 220, maxHeight: 120, objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }} onError={(e) => { (e.currentTarget).style.display = 'none'; }} /></div>}
          </Field>
          <Field label="Published at">
            <input type="datetime-local" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} style={inputStyle} />
          </Field>
          <Field label=" ">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.hot} onChange={(e) => setForm({ ...form, hot: e.target.checked })} />
              <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: '#fff', letterSpacing: '0.05em' }}>🔥 Mark as HOT (trending)</span>
            </label>
          </Field>
        </div>

        {err && <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'var(--accent)' }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(218,218,218,0.65)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', padding: '10px 16px', borderRadius: 4, textTransform: 'uppercase' }}>Cancel</button>
          <button onClick={save} disabled={busy || !form.headline.trim()}
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.16em', padding: '10px 18px', borderRadius: 4, textTransform: 'uppercase', whiteSpace: 'nowrap', opacity: (busy || !form.headline.trim()) ? 0.5 : 1 }}>
            {busy ? '…' : (editingId === 'new' ? 'Publish →' : 'Save changes →')}
          </button>
        </div>
      </div>
    );
  }

  // ── LIST ────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.6)' }}>{rows.length} article{rows.length === 1 ? '' : 's'} in the database.</div>
        <button onClick={openNew} style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.16em', padding: '10px 18px', borderRadius: 4, textTransform: 'uppercase' }}>+ New article</button>
      </div>

      {err && <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'var(--accent)' }}>{err}</div>}

      <div style={{ background: 'rgba(8,15,30,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 2.5fr 0.9fr 1.2fr 0.7fr', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
          {['Tag','Headline','Hot?','Published','Actions'].map((h, i) => (
            <div key={i} style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>
        {loading && <div style={{ padding: 20, fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.5)' }}>Loading…</div>}
        {!loading && rows.length === 0 && (
          <div style={{ padding: 20, fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.5)' }}>No articles yet. The site is currently showing the prototype's sample articles. Click "+ New article" to publish your first real one.</div>
        )}
        {rows.map((r, i) => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '0.7fr 2.5fr 0.9fr 1.2fr 0.7fr', alignItems: 'center', padding: '12px 18px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div>
              <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#fff', background: r.tag_color || 'var(--accent)', padding: '3px 8px', borderRadius: 2, textTransform: 'uppercase' }}>{r.tag || 'NEWS'}</span>
            </div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.headline}</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: r.hot ? '#e9c46a' : 'rgba(218,218,218,0.4)' }}>{r.hot ? '🔥 HOT' : '—'}</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.65)' }}>{fmtDate(r.published_at)}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(r)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(218,218,218,0.8)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', padding: '5px 10px', borderRadius: 3, textTransform: 'uppercase' }}>Edit</button>
              <button onClick={() => remove(r)} style={{ background: 'transparent', border: '1px solid rgba(228,0,43,0.4)', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', padding: '5px 10px', borderRadius: 3, textTransform: 'uppercase' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const inputStyle = { width: '100%', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '10px 12px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13, boxSizing: 'border-box' };

const Field = ({ label, required, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase' }}>
      {label}{required && <span style={{ color: 'var(--accent)', marginLeft: 4 }}>*</span>}
    </span>
    {children}
  </label>
);

// ── ADMIN: Transfers panel ──────────────────────────────────────
const AdminTransfersPanel = () => {
  const auth = useAuth();
  const [rows, setRows]       = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr]         = React.useState(null);
  const [busy, setBusy]       = React.useState(false);
  const [editingId, setEditingId] = React.useState/* :null|'new'|number */(null);
  const [uploading, setUploading] = React.useState(false);

  const blankForm = {
    player: '', club: '', fee: 'Undisclosed',
    status_label: 'DEVELOPING STORY', panel_color: '#E4002B',
    detail: '', image_url: '',
    happened_at: new Date().toISOString().slice(0, 16),
  };
  const [form, setForm] = React.useState(blankForm);

  const fetchRows = React.useCallback(async () => {
    setLoading(true);
    const sb = (await import('./supabase')).getSupabase();
    if (!sb) { setErr('No backend connection.'); setLoading(false); return; }
    const { data, error } = await sb
      .from('transfers')
      .select('id, happened_at, player, club, fee, status_label, panel_color, detail, image_url')
      .order('happened_at', { ascending: false });
    if (error) setErr(error.message);
    setRows(data || []);
    setLoading(false);
  }, []);

  React.useEffect(() => { fetchRows(); }, [fetchRows]);

  const openNew = () => {
    setForm({ ...blankForm, happened_at: new Date().toISOString().slice(0, 16) });
    setEditingId('new');
    setErr(null);
  };

  const openEdit = (row) => {
    setForm({
      player:       row.player ?? '',
      club:         row.club ?? '',
      fee:          row.fee ?? 'Undisclosed',
      status_label: row.status_label ?? 'DEVELOPING STORY',
      panel_color:  row.panel_color ?? '#E4002B',
      detail:       row.detail ?? '',
      image_url:    row.image_url ?? '',
      happened_at:  row.happened_at ? new Date(row.happened_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    });
    setEditingId(row.id);
    setErr(null);
  };

  const cancelEdit = () => { setEditingId(null); setErr(null); };

  const onUploadImage = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr('Image is over 5 MB — please pick a smaller one.'); return; }
    setUploading(true); setErr(null);
    try {
      const sb = (await import('./supabase')).getSupabase();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').toLowerCase();
      const path = `${Date.now()}-${safe}`;
      const { error: upErr } = await sb.storage.from('transfer-images').upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) { setErr(`Upload failed: ${upErr.message}`); return; }
      const { data } = sb.storage.from('transfer-images').getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
    } finally { setUploading(false); }
  };

  const save = async () => {
    setErr(null);
    if (!form.player.trim()) { setErr('Player is required.'); return; }
    if (!form.club.trim())   { setErr('Club is required.'); return; }
    setBusy(true);
    const sb = (await import('./supabase')).getSupabase();
    const payload = {
      player:       form.player.trim(),
      club:         form.club.trim(),
      fee:          form.fee.trim() || 'Undisclosed',
      status_label: form.status_label.trim() || 'DEVELOPING STORY',
      panel_color:  form.panel_color.trim() || '#E4002B',
      detail:       form.detail,
      image_url:    form.image_url.trim() || null,
      happened_at:  new Date(form.happened_at).toISOString(),
    };
    let error;
    if (editingId === 'new') {
      ({ error } = await sb.from('transfers').insert({ ...payload, created_by: auth.user?.id ?? null }));
    } else {
      ({ error } = await sb.from('transfers').update(payload).eq('id', editingId));
    }
    setBusy(false);
    if (error) { setErr(error.message); return; }
    invalidateLiveTransfers();
    setEditingId(null);
    fetchRows();
  };

  const remove = async (row) => {
    if (!confirm(`Delete transfer entry for "${row.player}"? This can't be undone.`)) return;
    const sb = (await import('./supabase')).getSupabase();
    const { error } = await sb.from('transfers').delete().eq('id', row.id);
    if (error) { setErr(error.message); return; }
    invalidateLiveTransfers();
    fetchRows();
  };

  const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  // Common status preset chips. Admins can still type whatever they want;
  // these just save typing for typical entries.
  const statusPresets = [
    { label: 'HERE WE GO ✓',       color: '#2a9d8f' },
    { label: 'AGREED',             color: '#2a9d8f' },
    { label: 'CONTRACT EXTENDED',  color: '#9b5de5' },
    { label: 'DEVELOPING STORY',   color: '#E4002B' },
    { label: 'RUMOUR',             color: '#E4002B' },
    { label: 'DEPARTED',           color: '#e76f51' },
    { label: 'REJECTED',           color: '#e76f51' },
    { label: 'LOAN',               color: '#f4a261' },
    { label: 'ANNOUNCED',          color: '#00c8ff' },
  ];

  if (editingId !== null) {
    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{editingId === 'new' ? 'New transfer' : 'Edit transfer'}</div>
          <button onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(218,218,218,0.65)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', padding: '8px 14px', borderRadius: 4, textTransform: 'uppercase' }}>← Back to list</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Field label="Player" required>
            <input type="text" placeholder="e.g. PANIKOVA" value={form.player} onChange={(e) => setForm({ ...form, player: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Club" required>
            <input type="text" placeholder="e.g. CLASSIFIED FC" value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Fee">
            <input type="text" placeholder="e.g. £10m / Free / Undisclosed / N/A" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Field label="Status label">
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={form.status_label} onChange={(e) => setForm({ ...form, status_label: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
              <select onChange={(e) => { const p = statusPresets[+e.target.value]; if (p) setForm({ ...form, status_label: p.label, panel_color: p.color }); e.target.selectedIndex = 0; }} style={{ ...inputStyle, width: 36, padding: '0 6px', cursor: 'pointer' }}>
                <option value="">▼</option>
                {statusPresets.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}
              </select>
            </div>
          </Field>
          <Field label="Accent colour (panel + chip)">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={form.panel_color} onChange={(e) => setForm({ ...form, panel_color: e.target.value })} style={{ width: 38, height: 38, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: 0, background: 'transparent', cursor: 'pointer' }} />
              <input type="text" value={form.panel_color} onChange={(e) => setForm({ ...form, panel_color: e.target.value })} style={{ ...inputStyle, flex: 1, fontFamily: 'Roboto Mono, ui-monospace, monospace' }} />
            </div>
          </Field>
          <Field label="Happened at">
            <input type="datetime-local" value={form.happened_at} onChange={(e) => setForm({ ...form, happened_at: e.target.value })} style={inputStyle} />
          </Field>
        </div>

        <Field label="Detail / narrative (line breaks become paragraphs)">
          <textarea rows={6} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} style={{ ...inputStyle, fontFamily: 'Roboto, sans-serif', resize: 'vertical', lineHeight: 1.55 }} />
        </Field>

        <Field label="Player image (optional)">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="text" placeholder="Paste a URL/path, or click Upload →" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
            <label style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', padding: '10px 14px', borderRadius: 4, textTransform: 'uppercase', whiteSpace: 'nowrap', opacity: uploading ? 0.5 : 1 }}>
              {uploading ? 'Uploading…' : 'Upload'}
              <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { onUploadImage(e.target.files?.[0]); e.target.value = ''; }} style={{ display: 'none' }} />
            </label>
          </div>
          {form.image_url && <div style={{ marginTop: 8 }}><img src={form.image_url} alt="" style={{ maxWidth: 220, maxHeight: 120, objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }} onError={(e) => { (e.currentTarget).style.display = 'none'; }} /></div>}
        </Field>

        {err && <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'var(--accent)' }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(218,218,218,0.65)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', padding: '10px 16px', borderRadius: 4, textTransform: 'uppercase' }}>Cancel</button>
          <button onClick={save} disabled={busy || !form.player.trim() || !form.club.trim()}
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.16em', padding: '10px 18px', borderRadius: 4, textTransform: 'uppercase', whiteSpace: 'nowrap', opacity: (busy || !form.player.trim() || !form.club.trim()) ? 0.5 : 1 }}>
            {busy ? '…' : (editingId === 'new' ? 'Publish →' : 'Save changes →')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.6)' }}>{rows.length} transfer{rows.length === 1 ? '' : 's'} in the database.</div>
        <button onClick={openNew} style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.16em', padding: '10px 18px', borderRadius: 4, textTransform: 'uppercase' }}>+ New transfer</button>
      </div>
      {err && <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'var(--accent)' }}>{err}</div>}
      <div style={{ background: 'rgba(8,15,30,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 0.9fr 1.2fr 1.2fr 0.7fr', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
          {['Player','Club','Fee','Status','Date','Actions'].map((h, i) => (
            <div key={i} style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>
        {loading && <div style={{ padding: 20, fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.5)' }}>Loading…</div>}
        {!loading && rows.length === 0 && (
          <div style={{ padding: 20, fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.5)' }}>No transfers yet. The Transfers page is currently showing placeholder entries. Click "+ New transfer" to publish a real one.</div>
        )}
        {rows.map((r, i) => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 0.9fr 1.2fr 1.2fr 0.7fr', alignItems: 'center', padding: '12px 18px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.player}</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.club}</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.7)' }}>{r.fee}</div>
            <div>
              <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#fff', background: r.panel_color || 'var(--accent)', padding: '3px 8px', borderRadius: 2, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{r.status_label}</span>
            </div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.65)' }}>{fmtDate(r.happened_at)}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(r)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(218,218,218,0.8)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', padding: '5px 10px', borderRadius: 3, textTransform: 'uppercase' }}>Edit</button>
              <button onClick={() => remove(r)} style={{ background: 'transparent', border: '1px solid rgba(228,0,43,0.4)', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', padding: '5px 10px', borderRadius: 3, textTransform: 'uppercase' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ── ADMIN: Store Items panel ────────────────────────────────────
const AdminStorePanel = () => {
  const auth = useAuth();
  const [rows, setRows]       = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr]         = React.useState(null);
  const [busy, setBusy]       = React.useState(false);
  const [editingId, setEditingId] = React.useState/* :null|'new'|number */(null);
  const [uploadingIdx, setUploadingIdx] = React.useState/* :number|null */(null);

  const blankForm = {
    name: '', price: '0', category: 'KITS', tag: '', panel_color: '#E4002B',
    subtitle: '', images: /* :string[] */ [],
    sold_out: false, sort_order: '100', visible: true, featured: false,
  };
  const [form, setForm] = React.useState(blankForm);

  const fetchRows = React.useCallback(async () => {
    setLoading(true);
    const sb = (await import('./supabase')).getSupabase();
    if (!sb) { setErr('No backend connection.'); setLoading(false); return; }
    const { data, error } = await sb
      .from('store_items')
      .select('id, name, price, category, tag, panel_color, subtitle, images, sold_out, sort_order, visible, featured, updated_at')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    if (error) setErr(error.message);
    setRows(data || []);
    setLoading(false);
  }, []);

  React.useEffect(() => { fetchRows(); }, [fetchRows]);

  const openNew = () => {
    setForm({ ...blankForm, sort_order: String((rows.at(-1)?.sort_order ?? 100) + 10) });
    setEditingId('new');
    setErr(null);
  };
  const openEdit = (row) => {
    setForm({
      name:        row.name ?? '',
      price:       String(row.price ?? '0'),
      category:    row.category ?? 'KITS',
      tag:         row.tag ?? '',
      panel_color: row.panel_color ?? '#E4002B',
      subtitle:    row.subtitle ?? '',
      images:      Array.isArray(row.images) ? row.images.slice() : [],
      sold_out:    Boolean(row.sold_out),
      sort_order:  String(row.sort_order ?? 100),
      visible:     row.visible !== false,
      featured:    Boolean(row.featured),
    });
    setEditingId(row.id);
    setErr(null);
  };
  const cancelEdit = () => { setEditingId(null); setErr(null); };

  const setImageAt = (idx, value) => setForm((f) => {
    const next = f.images.slice();
    next[idx] = value;
    return { ...f, images: next };
  });
  const addImageRow = () => setForm((f) => ({ ...f, images: [...f.images, ''] }));
  const removeImageAt = (idx) => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  const moveImage = (idx, dir) => setForm((f) => {
    const next = f.images.slice();
    const j = idx + dir;
    if (j < 0 || j >= next.length) return f;
    [next[idx], next[j]] = [next[j], next[idx]];
    return { ...f, images: next };
  });

  const onUploadAt = async (idx, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr('Image is over 5 MB — pick a smaller one.'); return; }
    setUploadingIdx(idx); setErr(null);
    try {
      const sb = (await import('./supabase')).getSupabase();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').toLowerCase();
      const path = `${Date.now()}-${safe}`;
      const { error: upErr } = await sb.storage.from('store-images').upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) { setErr(`Upload failed: ${upErr.message}`); return; }
      const { data } = sb.storage.from('store-images').getPublicUrl(path);
      setImageAt(idx, data.publicUrl);
    } finally { setUploadingIdx(null); }
  };

  const save = async () => {
    setErr(null);
    if (!form.name.trim()) { setErr('Name is required.'); return; }
    const priceNum = Number(form.price);
    if (Number.isNaN(priceNum) || priceNum < 0) { setErr('Price must be a non-negative number.'); return; }
    const sortNum = Number(form.sort_order);
    if (Number.isNaN(sortNum)) { setErr('Sort order must be a number.'); return; }
    setBusy(true);
    const sb = (await import('./supabase')).getSupabase();
    const cleanImages = form.images.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);
    const payload = {
      name:        form.name.trim(),
      price:       priceNum,
      category:    form.category.trim() || 'FAN GEAR',
      tag:         form.tag.trim(),
      panel_color: form.panel_color.trim() || '#E4002B',
      subtitle:    form.subtitle.trim(),
      images:      cleanImages,
      sold_out:    form.sold_out,
      sort_order:  sortNum,
      visible:     form.visible,
      featured:    form.featured,
    };
    let error;
    if (editingId === 'new') {
      ({ error } = await sb.from('store_items').insert({ ...payload, created_by: auth.user?.id ?? null }));
    } else {
      ({ error } = await sb.from('store_items').update(payload).eq('id', editingId));
    }
    setBusy(false);
    if (error) { setErr(error.message); return; }
    invalidateLiveStore();
    setEditingId(null);
    fetchRows();
  };

  const remove = async (row) => {
    if (!confirm(`Delete "${row.name}"? This can't be undone.`)) return;
    const sb = (await import('./supabase')).getSupabase();
    const { error } = await sb.from('store_items').delete().eq('id', row.id);
    if (error) { setErr(error.message); return; }
    invalidateLiveStore();
    fetchRows();
  };

  const fmtPrice = (p) => `£${Number(p).toFixed(2).replace(/\.00$/, '')}`;

  const categoryPresets = ['KITS', 'TRAINING', 'FAN GEAR', 'ACCESSORIES'];
  const tagPresets      = ['NEW DROP', 'BACK IN STOCK', 'LIMITED', 'NEW', 'BESTSELLER', 'SALE', ''];

  if (editingId !== null) {
    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{editingId === 'new' ? 'New product' : 'Edit product'}</div>
          <button onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(218,218,218,0.65)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', padding: '8px 14px', borderRadius: 4, textTransform: 'uppercase' }}>← Back to list</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
          <Field label="Name" required>
            <input type="text" placeholder="HOME SHIRT 25/26" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Price (£)">
            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Sort order (lower = earlier)">
            <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Field label="Category">
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
              <select onChange={(e) => { if (e.target.value) setForm({ ...form, category: e.target.value }); e.target.selectedIndex = 0; }} style={{ ...inputStyle, width: 36, padding: '0 6px', cursor: 'pointer' }}>
                <option value="">▼</option>
                {categoryPresets.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </Field>
          <Field label="Tag (optional chip)">
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} style={{ ...inputStyle, flex: 1 }} placeholder="e.g. NEW DROP" />
              <select onChange={(e) => { setForm({ ...form, tag: e.target.value }); e.target.selectedIndex = 0; }} style={{ ...inputStyle, width: 36, padding: '0 6px', cursor: 'pointer' }}>
                <option value="">▼</option>
                {tagPresets.map((t, i) => <option key={i} value={t}>{t || '(none)'}</option>)}
              </select>
            </div>
          </Field>
          <Field label="Accent colour">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={form.panel_color} onChange={(e) => setForm({ ...form, panel_color: e.target.value })} style={{ width: 38, height: 38, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: 0, background: 'transparent', cursor: 'pointer' }} />
              <input type="text" value={form.panel_color} onChange={(e) => setForm({ ...form, panel_color: e.target.value })} style={{ ...inputStyle, flex: 1, fontFamily: 'Roboto Mono, ui-monospace, monospace' }} />
            </div>
          </Field>
        </div>

        <Field label="Subtitle (one-line description shown on the card)">
          <input type="text" placeholder='e.g. "Adult replica · Aura red, slim fit"' value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} style={inputStyle} />
        </Field>

        <Field label="Product images (first one is the main card image)">
          <div style={{ display: 'grid', gap: 10 }}>
            {form.images.length === 0 && (
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.5)' }}>No images yet. Add one below — the first image is what shoppers see on the card.</div>
            )}
            {form.images.map((url, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto auto auto auto', gap: 8, alignItems: 'center', background: 'rgba(8,15,30,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: 8 }}>
                <div style={{ width: 70, height: 50, borderRadius: 3, background: 'rgba(0,0,0,0.4)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {url
                    ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget).style.display = 'none'; }} />
                    : <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, color: 'rgba(218,218,218,0.4)' }}>{i + 1}</span>}
                </div>
                <input type="text" value={url} onChange={(e) => setImageAt(i, e.target.value)} placeholder="Paste URL/path or click Upload →" style={{ ...inputStyle, fontSize: 12 }} />
                <label style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: uploadingIdx === i ? 'not-allowed' : 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', padding: '8px 10px', borderRadius: 3, textTransform: 'uppercase', whiteSpace: 'nowrap', opacity: uploadingIdx === i ? 0.5 : 1 }}>
                  {uploadingIdx === i ? '…' : 'Upload'}
                  <input type="file" accept="image/*" disabled={uploadingIdx !== null} onChange={(e) => { onUploadAt(i, e.target.files?.[0]); e.target.value = ''; }} style={{ display: 'none' }} />
                </label>
                <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} title="Move up"
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: i === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(218,218,218,0.65)', cursor: i === 0 ? 'not-allowed' : 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 12, padding: '6px 8px', borderRadius: 3 }}>↑</button>
                <button type="button" onClick={() => moveImage(i, 1)} disabled={i === form.images.length - 1} title="Move down"
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: i === form.images.length - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(218,218,218,0.65)', cursor: i === form.images.length - 1 ? 'not-allowed' : 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 12, padding: '6px 8px', borderRadius: 3 }}>↓</button>
                <button type="button" onClick={() => removeImageAt(i)} title="Remove"
                        style={{ background: 'transparent', border: '1px solid rgba(228,0,43,0.4)', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', padding: '6px 10px', borderRadius: 3, textTransform: 'uppercase' }}>×</button>
              </div>
            ))}
            <div>
              <button type="button" onClick={addImageRow}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', color: 'rgba(218,218,218,0.85)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', padding: '8px 14px', borderRadius: 4, textTransform: 'uppercase' }}>+ Add image</button>
            </div>
          </div>
        </Field>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.sold_out} onChange={(e) => setForm({ ...form, sold_out: e.target.checked })} />
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: '#fff' }}>Sold out</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: '#fff' }}>Featured (homepage carousel)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: '#fff' }}>Visible on the public store</span>
          </label>
        </div>

        {err && <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'var(--accent)' }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(218,218,218,0.65)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', padding: '10px 16px', borderRadius: 4, textTransform: 'uppercase' }}>Cancel</button>
          <button onClick={save} disabled={busy || !form.name.trim()}
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.16em', padding: '10px 18px', borderRadius: 4, textTransform: 'uppercase', whiteSpace: 'nowrap', opacity: (busy || !form.name.trim()) ? 0.5 : 1 }}>
            {busy ? '…' : (editingId === 'new' ? 'Publish →' : 'Save changes →')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.6)' }}>{rows.length} item{rows.length === 1 ? '' : 's'} in the store.</div>
        <button onClick={openNew} style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.16em', padding: '10px 18px', borderRadius: 4, textTransform: 'uppercase' }}>+ New item</button>
      </div>
      {err && <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'var(--accent)' }}>{err}</div>}
      <div style={{ background: 'rgba(8,15,30,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 2fr 1.1fr 0.7fr 0.9fr 1fr 0.7fr', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
          {['', 'Name', 'Category', 'Price', 'Tag', 'Flags', 'Actions'].map((h, i) => (
            <div key={i} style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>
        {loading && <div style={{ padding: 20, fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.5)' }}>Loading…</div>}
        {!loading && rows.length === 0 && (
          <div style={{ padding: 20, fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.5)' }}>No items yet. The Store page is showing fallback items. Click "+ New item" to add a real one.</div>
        )}
        {rows.map((r, i) => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '60px 2fr 1.1fr 0.7fr 0.9fr 1fr 0.7fr', alignItems: 'center', padding: '12px 18px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ width: 50, height: 40, borderRadius: 3, background: 'rgba(0,0,0,0.4)', overflow: 'hidden' }}>
              {Array.isArray(r.images) && r.images[0]
                ? <img src={r.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget).style.display = 'none'; }} />
                : null}
            </div>
            <div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
              {r.subtitle && <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'rgba(218,218,218,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subtitle}</div>}
            </div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.7)' }}>{r.category}</div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff' }}>{fmtPrice(r.price)}</div>
            <div>{r.tag ? <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#fff', background: r.panel_color || 'var(--accent)', padding: '3px 8px', borderRadius: 2, textTransform: 'uppercase' }}>{r.tag}</span> : <span style={{ color: 'rgba(218,218,218,0.3)' }}>—</span>}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {r.sold_out && <span style={{ color: '#e9c46a', background: 'rgba(233,196,106,0.1)', padding: '2px 6px', borderRadius: 2 }}>SOLD OUT</span>}
              {r.featured && <span style={{ color: '#9b5de5', background: 'rgba(155,93,229,0.12)', padding: '2px 6px', borderRadius: 2 }}>FEATURED</span>}
              {!r.visible && <span style={{ color: 'rgba(218,218,218,0.5)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 2 }}>HIDDEN</span>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(r)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(218,218,218,0.8)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', padding: '5px 10px', borderRadius: 3, textTransform: 'uppercase' }}>Edit</button>
              <button onClick={() => remove(r)} style={{ background: 'transparent', border: '1px solid rgba(228,0,43,0.4)', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', padding: '5px 10px', borderRadius: 3, textTransform: 'uppercase' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ── ADMIN: Player Lore panel ─────────────────────────────────────
// Edits the static parts of every player profile (identity, archetype,
// lore, attributes, accent, image, timeline, mock career numbers).
// Live EA stats are kept untouched — for human players (ea_user set)
// the goals/assists/apps shown on the front-end are always overridden
// at read time by the scraper's member_state numbers.
const POSITION_PRESETS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'CF', 'ST'];
const RARITY_PRESETS   = ['common', 'rare', 'legend', 'icon'];
const OUTFIELD_KEYS    = ['PAC','SHO','PAS','DRI','DEF','PHY'];
const GK_KEYS          = ['DIV','HAN','KIC','REF','SPD','POS'];

const AdminPlayerLorePanel = () => {
  const auth = useAuth();
  const [rows, setRows]       = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr]         = React.useState(null);
  const [busy, setBusy]       = React.useState(false);
  const [editingId, setEditingId] = React.useState/* :null|'new'|string */(null);
  const [uploading, setUploading] = React.useState(false);

  const blankStats = (pos) => {
    const keys = pos === 'GK' ? GK_KEYS : OUTFIELD_KEYS;
    return Object.fromEntries(keys.map((k) => [k, 70]));
  };
  const blankForm = {
    id: '', name: '', short_name: '', number: '', ea_user: '',
    position: 'CM', rating: '70', rarity: 'common', nationality: '',
    stats: blankStats('CM'),
    mock_goals: '', mock_apps: '', mock_assists: '', mock_clean_sheets: '',
    tags: /* :string[] */ [],
    accent_color: '#E4002B', glow_color: '',
    archetype: '', lore: '',
    timeline: /* :{era,note}[] */ [],
    image: '',
    sort_order: '100', visible: true,
  };
  const [form, setForm] = React.useState(blankForm);

  const fetchRows = React.useCallback(async () => {
    setLoading(true);
    const sb = (await import('./supabase')).getSupabase();
    if (!sb) { setErr('No backend connection.'); setLoading(false); return; }
    const { data, error } = await sb
      .from('players')
      .select('id, name, short_name, number, ea_user, position, rating, rarity, image, sort_order, visible, updated_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) setErr(error.message);
    setRows(data || []);
    setLoading(false);
  }, []);
  React.useEffect(() => { fetchRows(); }, [fetchRows]);

  const openNew = () => {
    setForm({ ...blankForm, sort_order: String((rows.at(-1)?.sort_order ?? 100) + 10) });
    setEditingId('new');
    setErr(null);
  };
  const openEdit = async (row) => {
    // Fetch the full row (list query only pulls the columns shown in the table).
    const sb = (await import('./supabase')).getSupabase();
    const { data, error } = await sb.from('players').select('*').eq('id', row.id).maybeSingle();
    if (error || !data) { setErr(error?.message || 'Player not found.'); return; }
    setForm({
      id: data.id ?? '',
      name: data.name ?? '',
      short_name: data.short_name ?? '',
      number: data.number == null ? '' : String(data.number),
      ea_user: data.ea_user ?? '',
      position: data.position ?? 'CM',
      rating: String(data.rating ?? 70),
      rarity: data.rarity ?? 'common',
      nationality: data.nationality ?? '',
      stats: { ...blankStats(data.position ?? 'CM'), ...(data.stats || {}) },
      mock_goals:        data.mock_goals        == null ? '' : String(data.mock_goals),
      mock_apps:         data.mock_apps         == null ? '' : String(data.mock_apps),
      mock_assists:      data.mock_assists      == null ? '' : String(data.mock_assists),
      mock_clean_sheets: data.mock_clean_sheets == null ? '' : String(data.mock_clean_sheets),
      tags: Array.isArray(data.tags) ? data.tags.slice() : [],
      accent_color: data.accent_color ?? '#E4002B',
      glow_color: data.glow_color ?? '',
      archetype: data.archetype ?? '',
      lore: data.lore ?? '',
      timeline: Array.isArray(data.timeline) ? data.timeline.slice() : [],
      image: data.image ?? '',
      sort_order: String(data.sort_order ?? 100),
      visible: data.visible !== false,
    });
    setEditingId(row.id);
    setErr(null);
  };
  const cancelEdit = () => { setEditingId(null); setErr(null); };

  // When position toggles between GK / outfield we swap the stat key set.
  const onPositionChange = (next) => {
    setForm((f) => {
      const wasGK  = f.position === 'GK';
      const willGK = next === 'GK';
      if (wasGK !== willGK) return { ...f, position: next, stats: blankStats(next) };
      return { ...f, position: next };
    });
  };
  const setStat = (key, value) => setForm((f) => ({ ...f, stats: { ...f.stats, [key]: Number(value) || 0 } }));

  // Tag chip editor.
  const [tagDraft, setTagDraft] = React.useState('');
  const addTag = () => {
    const t = tagDraft.trim();
    if (!t) return;
    setForm((f) => ({ ...f, tags: f.tags.includes(t) ? f.tags : [...f.tags, t] }));
    setTagDraft('');
  };
  const removeTag = (t) => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }));

  // Timeline editor — list of { era, note }.
  const setTimelineAt = (idx, key, value) => setForm((f) => {
    const next = f.timeline.slice();
    next[idx] = { ...next[idx], [key]: value };
    return { ...f, timeline: next };
  });
  const addTimelineRow = () => setForm((f) => ({ ...f, timeline: [...f.timeline, { era: '', note: '' }] }));
  const removeTimelineAt = (idx) => setForm((f) => ({ ...f, timeline: f.timeline.filter((_, i) => i !== idx) }));
  const moveTimeline = (idx, dir) => setForm((f) => {
    const next = f.timeline.slice();
    const j = idx + dir;
    if (j < 0 || j >= next.length) return f;
    [next[idx], next[j]] = [next[j], next[idx]];
    return { ...f, timeline: next };
  });

  const onUploadImage = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr('Image is over 5 MB — pick a smaller one.'); return; }
    setUploading(true); setErr(null);
    try {
      const sb = (await import('./supabase')).getSupabase();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').toLowerCase();
      const path = `${Date.now()}-${safe}`;
      const { error: upErr } = await sb.storage.from('player-images').upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) { setErr(`Upload failed: ${upErr.message}`); return; }
      const { data } = sb.storage.from('player-images').getPublicUrl(path);
      setForm((f) => ({ ...f, image: data.publicUrl }));
    } finally { setUploading(false); }
  };

  // Auto-derive a slug-ish ID from the name when creating, but only if the
  // user hasn't typed one in yet.
  const suggestId = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 40);

  const save = async () => {
    setErr(null);
    if (!form.name.trim())       { setErr('Name is required.');       return; }
    if (!form.short_name.trim()) { setErr('Short name is required.'); return; }
    const ratingNum = Number(form.rating);
    if (Number.isNaN(ratingNum) || ratingNum < 0 || ratingNum > 99) { setErr('Rating must be 0–99.'); return; }
    const sortNum = Number(form.sort_order);
    if (Number.isNaN(sortNum)) { setErr('Sort order must be a number.'); return; }

    const idVal = (editingId === 'new' ? (form.id.trim() || suggestId(form.name)) : String(editingId));
    if (!idVal) { setErr('Player ID is required.'); return; }
    if (!/^[a-z0-9_-]+$/.test(idVal)) { setErr('Player ID can only contain lowercase letters, numbers, dashes and underscores.'); return; }

    const numToCol = (v) => (v === '' ? null : (Number.isFinite(Number(v)) ? Number(v) : null));

    setBusy(true);
    const sb = (await import('./supabase')).getSupabase();
    const payload = {
      name:         form.name.trim(),
      short_name:   form.short_name.trim(),
      number:       numToCol(form.number),
      ea_user:      form.ea_user.trim() || null,
      position:     form.position,
      rating:       ratingNum,
      rarity:       form.rarity,
      nationality:  form.nationality.trim() || null,
      stats:        form.stats,
      mock_goals:        numToCol(form.mock_goals),
      mock_apps:         numToCol(form.mock_apps),
      mock_assists:      numToCol(form.mock_assists),
      mock_clean_sheets: numToCol(form.mock_clean_sheets),
      tags:         form.tags,
      accent_color: form.accent_color.trim() || '#E4002B',
      glow_color:   form.glow_color.trim() || null,
      archetype:    form.archetype.trim(),
      lore:         form.lore,
      timeline:     form.timeline.filter((t) => (t.era || '').trim() || (t.note || '').trim()),
      image:        form.image.trim() || null,
      sort_order:   sortNum,
      visible:      form.visible,
    };
    let error;
    if (editingId === 'new') {
      ({ error } = await sb.from('players').insert({ id: idVal, ...payload, created_by: auth.user?.id ?? null }));
    } else {
      ({ error } = await sb.from('players').update(payload).eq('id', idVal));
    }
    setBusy(false);
    if (error) { setErr(error.message); return; }
    invalidateLivePlayers();
    setEditingId(null);
    fetchRows();
  };

  const remove = async (row) => {
    if (!confirm(`Delete "${row.name}"? This can't be undone.`)) return;
    const sb = (await import('./supabase')).getSupabase();
    const { error } = await sb.from('players').delete().eq('id', row.id);
    if (error) { setErr(error.message); return; }
    invalidateLivePlayers();
    fetchRows();
  };

  const statKeys = form.position === 'GK' ? GK_KEYS : OUTFIELD_KEYS;
  const isHuman = !!form.ea_user.trim();

  if (editingId !== null) {
    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{editingId === 'new' ? 'New player' : 'Edit player'}</div>
          <button onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(218,218,218,0.65)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', padding: '8px 14px', borderRadius: 4, textTransform: 'uppercase' }}>← Back to list</button>
        </div>

        {/* Identity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 0.8fr', gap: 14 }}>
          <Field label="Name" required>
            <input type="text" placeholder="Amir Panikova" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Short name" required>
            <input type="text" placeholder="PANIKOVA" value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Player ID (slug)">
            <input type="text" placeholder={form.name ? suggestId(form.name) : 'panikova'} value={form.id} disabled={editingId !== 'new'} onChange={(e) => setForm({ ...form, id: e.target.value })} style={{ ...inputStyle, opacity: editingId !== 'new' ? 0.55 : 1 }} />
          </Field>
          <Field label="Kit number">
            <input type="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.8fr 0.8fr 0.8fr', gap: 14 }}>
          <Field label="EA Pro Clubs Gamertag (humans only — leave blank for AI characters)">
            <input type="text" placeholder="e.g. NoticeMeSenpepe" value={form.ea_user} onChange={(e) => setForm({ ...form, ea_user: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Position">
            <select value={form.position} onChange={(e) => onPositionChange(e.target.value)} style={inputStyle}>
              {POSITION_PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Rating (0–99)">
            <input type="number" min="0" max="99" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Rarity">
            <select value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })} style={inputStyle}>
              {RARITY_PRESETS.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
            </select>
          </Field>
          <Field label="Nationality (code or 🌟)">
            <input type="text" placeholder="ENG / RU / 🌟" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} style={inputStyle} />
          </Field>
        </div>

        {/* Six-key attribute grid */}
        <Field label={`Attributes (${form.position === 'GK' ? 'goalkeeper' : 'outfielder'} keys)`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
            {statKeys.map((k) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.6)' }}>{k}</div>
                <input type="number" min="0" max="99" value={form.stats[k] ?? ''} onChange={(e) => setStat(k, e.target.value)} style={inputStyle} />
              </div>
            ))}
          </div>
        </Field>

        {/* Image */}
        <Field label="Player photo (portrait — head-and-shoulders works best)">
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 10, alignItems: 'center', background: 'rgba(8,15,30,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: 10 }}>
            <div style={{ width: 90, height: 110, borderRadius: 4, background: 'rgba(0,0,0,0.4)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {form.image
                ? <img src={form.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} onError={(e) => { (e.currentTarget).style.display = 'none'; }} />
                : <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, color: 'rgba(218,218,218,0.4)' }}>No image</span>}
            </div>
            <input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="Paste URL/path or click Upload →" style={{ ...inputStyle, fontSize: 12 }} />
            <label style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', padding: '8px 12px', borderRadius: 3, textTransform: 'uppercase', whiteSpace: 'nowrap', opacity: uploading ? 0.5 : 1 }}>
              {uploading ? '…' : 'Upload'}
              <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { onUploadImage(e.target.files?.[0]); e.target.value = ''; }} style={{ display: 'none' }} />
            </label>
          </div>
        </Field>

        {/* Mock career numbers + colours */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
          <Field label="Career goals">
            <input type="number" value={form.mock_goals} onChange={(e) => setForm({ ...form, mock_goals: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Career appearances">
            <input type="number" value={form.mock_apps} onChange={(e) => setForm({ ...form, mock_apps: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Career assists">
            <input type="number" value={form.mock_assists} onChange={(e) => setForm({ ...form, mock_assists: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Clean sheets (GK)">
            <input type="number" value={form.mock_clean_sheets} onChange={(e) => setForm({ ...form, mock_clean_sheets: e.target.value })} style={inputStyle} />
          </Field>
        </div>
        {isHuman && (
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(233,196,106,0.85)', background: 'rgba(233,196,106,0.08)', border: '1px solid rgba(233,196,106,0.25)', borderRadius: 4, padding: '8px 12px' }}>
            This player has an EA Gamertag, so the front-end overrides the four numbers above with EA's live <em>member_state</em> stats. The values you set here only show until the first scrape lands.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.6fr', gap: 14 }}>
          <Field label="Accent colour (card border / glow)">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} style={{ width: 38, height: 38, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: 0, background: 'transparent', cursor: 'pointer' }} />
              <input type="text" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} style={{ ...inputStyle, flex: 1, fontFamily: 'Roboto Mono, ui-monospace, monospace' }} />
            </div>
          </Field>
          <Field label="Glow colour (optional rgba — leave blank to derive from accent)">
            <input type="text" placeholder="rgba(255,34,68,0.45)" value={form.glow_color} onChange={(e) => setForm({ ...form, glow_color: e.target.value })} style={{ ...inputStyle, fontFamily: 'Roboto Mono, ui-monospace, monospace' }} />
          </Field>
          <Field label="Sort order">
            <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} style={inputStyle} />
          </Field>
        </div>

        {/* Tags */}
        <Field label="Personality chips (shown on profile)">
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="e.g. Aura Commander — press Enter to add" style={{ ...inputStyle, flex: 1 }} />
              <button type="button" onClick={addTag} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', padding: '8px 14px', borderRadius: 3, textTransform: 'uppercase' }}>+ Add</button>
            </div>
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {form.tags.map((t) => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 600, color: '#fff', background: 'rgba(228,0,43,0.18)', border: '1px solid rgba(228,0,43,0.4)', padding: '4px 8px', borderRadius: 12 }}>
                    {t}
                    <button type="button" onClick={() => removeTag(t)} title="Remove" style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Field>

        <Field label="Archetype (one-line role descriptor)">
          <input type="text" placeholder="Aura Commander" value={form.archetype} onChange={(e) => setForm({ ...form, archetype: e.target.value })} style={inputStyle} />
        </Field>

        <Field label="Lore (the 1–2 sentence flavour text shown on the profile)">
          <textarea rows={3} value={form.lore} onChange={(e) => setForm({ ...form, lore: e.target.value })} style={{ ...inputStyle, resize: 'vertical', minHeight: 70, padding: 10 }} />
        </Field>

        {/* Timeline */}
        <Field label="Timeline (career chapters shown on the profile modal)">
          <div style={{ display: 'grid', gap: 8 }}>
            {form.timeline.length === 0 && (
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.5)' }}>No chapters yet. Add one below.</div>
            )}
            {form.timeline.map((entry, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '0.9fr 2fr auto auto auto', gap: 8, alignItems: 'center', background: 'rgba(8,15,30,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: 8 }}>
                <input type="text" value={entry.era || ''} onChange={(e) => setTimelineAt(i, 'era', e.target.value)} placeholder="The Awakening" style={{ ...inputStyle, fontSize: 12 }} />
                <input type="text" value={entry.note || ''} onChange={(e) => setTimelineAt(i, 'note', e.target.value)} placeholder="What happened in this chapter" style={{ ...inputStyle, fontSize: 12 }} />
                <button type="button" onClick={() => moveTimeline(i, -1)} disabled={i === 0} title="Move up"
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: i === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(218,218,218,0.65)', cursor: i === 0 ? 'not-allowed' : 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 12, padding: '6px 8px', borderRadius: 3 }}>↑</button>
                <button type="button" onClick={() => moveTimeline(i, 1)} disabled={i === form.timeline.length - 1} title="Move down"
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: i === form.timeline.length - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(218,218,218,0.65)', cursor: i === form.timeline.length - 1 ? 'not-allowed' : 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 12, padding: '6px 8px', borderRadius: 3 }}>↓</button>
                <button type="button" onClick={() => removeTimelineAt(i)} title="Remove"
                        style={{ background: 'transparent', border: '1px solid rgba(228,0,43,0.4)', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', padding: '6px 10px', borderRadius: 3, textTransform: 'uppercase' }}>×</button>
              </div>
            ))}
            <div>
              <button type="button" onClick={addTimelineRow}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', color: 'rgba(218,218,218,0.85)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', padding: '8px 14px', borderRadius: 4, textTransform: 'uppercase' }}>+ Add chapter</button>
            </div>
          </div>
        </Field>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: '#fff' }}>Visible on the public squad</span>
          </label>
        </div>

        {err && <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'var(--accent)' }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(218,218,218,0.65)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', padding: '10px 16px', borderRadius: 4, textTransform: 'uppercase' }}>Cancel</button>
          <button onClick={save} disabled={busy || !form.name.trim() || !form.short_name.trim()}
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.16em', padding: '10px 18px', borderRadius: 4, textTransform: 'uppercase', whiteSpace: 'nowrap', opacity: (busy || !form.name.trim() || !form.short_name.trim()) ? 0.5 : 1 }}>
            {busy ? '…' : (editingId === 'new' ? 'Publish →' : 'Save changes →')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.6)' }}>{rows.length} player{rows.length === 1 ? '' : 's'} in the squad.</div>
        <button onClick={openNew} style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.16em', padding: '10px 18px', borderRadius: 4, textTransform: 'uppercase' }}>+ New player</button>
      </div>
      {err && <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'var(--accent)' }}>{err}</div>}
      <div style={{ background: 'rgba(8,15,30,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 2fr 0.6fr 0.6fr 0.8fr 0.9fr 0.7fr', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
          {['', 'Name', '#', 'POS', 'Rarity', 'Flags', 'Actions'].map((h, i) => (
            <div key={i} style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>
        {loading && <div style={{ padding: 20, fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.5)' }}>Loading…</div>}
        {!loading && rows.length === 0 && (
          <div style={{ padding: 20, fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.5)' }}>No players yet. The Squad page is showing the prototype's hard-coded fallback. Click "+ New player" or run the migration to add real ones.</div>
        )}
        {rows.map((r, i) => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '60px 2fr 0.6fr 0.6fr 0.8fr 0.9fr 0.7fr', alignItems: 'center', padding: '12px 18px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', overflow: 'hidden' }}>
              {r.image
                ? <img src={r.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} onError={(e) => { (e.currentTarget).style.display = 'none'; }} />
                : null}
            </div>
            <div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'rgba(218,218,218,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.ea_user ? `EA: ${r.ea_user}` : 'AI character'} · ID {r.id}
              </div>
            </div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff' }}>{r.number ?? '—'}</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.7)' }}>{r.position}</div>
            <div>
              <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#fff', background: r.rarity === 'icon' ? '#e6a817' : r.rarity === 'legend' ? '#9b5de5' : r.rarity === 'rare' ? '#4361ee' : 'rgba(80,110,160,0.5)', padding: '3px 8px', borderRadius: 2, textTransform: 'uppercase' }}>{(r.rarity || 'common').toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {r.ea_user && <span style={{ color: '#06d6a0', background: 'rgba(6,214,160,0.12)', padding: '2px 6px', borderRadius: 2 }}>HUMAN</span>}
              {!r.ea_user && <span style={{ color: 'rgba(218,218,218,0.55)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 2 }}>AI</span>}
              {!r.visible && <span style={{ color: 'rgba(218,218,218,0.5)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 2 }}>HIDDEN</span>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(r)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(218,218,218,0.8)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', padding: '5px 10px', borderRadius: 3, textTransform: 'uppercase' }}>Edit</button>
              <button onClick={() => remove(r)} style={{ background: 'transparent', border: '1px solid rgba(228,0,43,0.4)', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', padding: '5px 10px', borderRadius: 3, textTransform: 'uppercase' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── BASKET PAGE ─────────────────────────────────────────────────
const BasketPage = ({ setPage }) => {
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="sbc-page-header" style={{ position: 'relative', height: 220, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--page-header-image)', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.6) 0%, rgba(3,8,16,0.9) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.85) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 64px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 3, height: 18, background: 'var(--accent)' }} />
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', color: 'var(--accent)', textTransform: 'uppercase' }}>Your Order</div>
          </div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 64, color: '#fff', lineHeight: 0.9, textTransform: 'uppercase', textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}>BASKET</div>
        </div>
      </div>
      <RainbowBar />
      <div className="sbc-page-pad" style={{ padding: '64px 64px 96px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 480, textAlign: 'center' }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(228,0,43,0.12)', border: '2px dashed rgba(228,0,43,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18l-2 12H5L3 6z"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        </div>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Your basket is empty</div>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 14, color: 'rgba(218,218,218,0.6)', maxWidth: 480, lineHeight: 1.6, marginBottom: 28 }}>Even our basket embraces sadness. Fill it with something — kits, mugs, regret. The choice is yours.</div>
        <button onClick={() => setPage('store')} style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.18em', padding: '14px 32px', borderRadius: 4, textTransform: 'uppercase' }}>BROWSE THE STORE →</button>
      </div>
    </div>);

};

// ── Module exports ───────────────────────────────────────────────
// (Replaces the original `Object.assign(window, ...)` from the prototype.)
export {
  // Data
  NEWS_ITEMS,
  OLDER_NEWS,
  ALL_NEWS,
  FIXTURES,
  LEAGUE_TABLE,
  RARITY_CONFIGS,
  // Components
  NavBar,
  PlayerCard,
  BreakingTicker,
  StatBar,
  RainbowBar,
  TagChip,
  PlayerProfileModal,
  // Pages
  HomePage,
  SquadPage,
  StatsPage,
  FixturesPage,
  NewsPage,
  TransfersPage,
  LeaguePage,
  StorePage,
  AccountPage,
  AdminPage,
  BasketPage,
};
