// ============================================================
// SBCFC SHARED COMPONENTS, PAGES & DATA
// Ported verbatim from the Claude Design prototype (prototype-original/sbcfc-all.jsx).
// Internals untouched on purpose; we'll split this into smaller files when we
// next make real changes inside it.
// ============================================================
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
// @ts-nocheck
import React from 'react';
import { getPulseStats, getLiveFixtures, getLiveMembersByEaUser, type LiveMemberStats } from './liveData';

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

function mergeLivePlayers(map: Map<string, LiveMemberStats>): any[] {
  return PLAYERS.map((p: any) => {
    if (!p.eaUser) return { ...p, isLive: false };
    const live = map.get(p.eaUser.toLowerCase());
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
      const map = await getLiveMembersByEaUser();
      const merged = mergeLivePlayers(map);
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
  }, []);
  return players;
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
},
{
  // Sixth human-controlled player. No photo yet — placeholder until/unless one is supplied.
  // eaUser matches the real EA Gamertag so live stats from member_state get merged in.
  id: 'oldreliable', name: 'Old Reliable', shortName: 'OLD RELIABLE', number: 6, image: null, eaUser: 'Shmuelly',
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
const NavBar = ({ page, setPage }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navItems = [
  { id: 'home', label: 'HOME' },
  { id: 'news', label: 'NEWS' },
  { id: 'squad', label: 'SQUAD' },
  { id: 'stats', label: 'STATS' },
  { id: 'transfers', label: 'TRANSFERS' },
  { id: 'fixtures', label: 'FIXTURES' },
  // 'league' (the parody Premier-League-style table) removed at user request —
  // no real-world table exists for an EA Pro Clubs custom club. The page
  // component still exists but is unreachable through the main nav.
  { id: 'store', label: 'STORE' },
  { id: 'account', label: '' },
  { id: 'basket', label: 'BASKET' }];

  const handleNav = (id) => {setPage(id);setMobileOpen(false);};
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
        }}>{item.id === 'account' ? '—  ACCOUNT' : item.id === 'basket' ? '—  BASKET (£0.00)' : item.label}</button>
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
          {player.goals && player.apps &&
          <div style={{ flex: 1, padding: '14px 0', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: player.accentColor }}>{(player.goals / player.apps).toFixed(2)}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase' }}>G/Game</div>
            </div>
          }
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

// ── HOME PAGE ───────────────────────────────────────────────────
const HomePage = ({ setPage, setSelectedPlayer }) => {
  const [headlineIdx, setHeadlineIdx] = React.useState(0);
  const [pulseValues, setPulseValues] = React.useState({ pos: 0, rate: 0, gd: 0, pts: 0, matches: 0 });
  const players = useLivePlayers();

  // Headlines mirror the news page order: lead first, then by date. Click jumps straight to that story.
  const headlines = SORTED_NEWS.slice(0, 4).map((n) => ({
    id: n.id,
    text: (n.headline || '').toUpperCase(),
    sub: n.summary || '',
    tag: n.tag || 'NEWS',
    color: n.tagColor || 'var(--accent)'
  }));


  React.useEffect(() => {
    const iv = setInterval(() => setHeadlineIdx((i) => (i + 1) % headlines.length), 4500);
    return () => clearInterval(iv);
  }, []);

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
        animateTo({ pos: live.position, rate: live.winRate, gd: live.goalDifference, pts: live.totalPoints, matches: live.gamesPlayed });
      } catch {
        if (cancelled) return;
        setPulseSource('mock');
        animateTo({ pos: 2, rate: 64, gd: 28, pts: 59, matches: 280 });
      }
    })();
    return () => { cancelled = true; if (frame) cancelAnimationFrame(frame); };
  }, []);

  const signings = [
  { player: players.find((p) => p.id === 'panikova'), image: '/uploads/pasted-1777415983890-0.png', caption: 'FROM FERGANA VALLEY, UZBEKISTAN' },
  { player: players.find((p) => p.id === 'gymskin'), image: '/uploads/pasted-1777416552965-0.png', caption: 'AURA PULSE ACTIVATED' },
  { player: players.find((p) => p.id === 'karavavov'), image: '/uploads/Karavavov.png', caption: 'THE MOLDOVAN TRICKSTER' },
  { player: players.find((p) => p.id === 'ricciardo'), image: '/uploads/Ricciardo.png', caption: 'THE HONEYBADGER. F1 TO FOOTBALL.' },
  { player: players.find((p) => p.id === 'donnyp'), image: '/uploads/pasted-1777417166292-0.png', caption: 'STALWART. MAVERICK. CORNER TAKER.' }];


  const topScorers = [...players].filter((p) => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 5);
  const h = headlines[headlineIdx];

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
          {/* Fixed-height rotating headline container so layout below never shifts */}
          <div onClick={() => { try { localStorage.setItem('sbc_focus_news', String(h.id)); } catch (e) {} setPage('news'); }} style={{ position: 'relative', height: 200, marginBottom: 14, cursor: 'pointer', overflow: 'hidden' }}>
            <div key={headlineIdx} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', animation: 'fadeInHeadline 0.5s ease' }}>
              <div className="sbc-glow-heading" style={{
                fontFamily: 'Anton, sans-serif', fontSize: 'clamp(28px, 4.2vw, 54px)', lineHeight: 0.95, color: '#fff', maxWidth: 820, textTransform: 'uppercase',
                display: '-webkit-box', WebkitLineClamp: 2 as any, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
              }}>{h.text}</div>
              <div style={{
                fontFamily: 'Roboto, sans-serif', fontSize: 14, fontWeight: 300, color: 'rgba(218,218,218,0.75)', maxWidth: 520, marginTop: 12, lineHeight: 1.55,
                display: '-webkit-box', WebkitLineClamp: 2 as any, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
              }}>{h.sub}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            <button onClick={() => setPage('news')} style={{ background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.1em', padding: '11px 22px', borderRadius: 3, textTransform: 'uppercase', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#ff1a3a'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}>
                LATEST NEWS →</button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {[
              { label: 'NEXT MATCH', val: 'VS FC MIDNIGHT', sub: 'May 3 · 20:00 · HOME', color: 'var(--accent)' },
              { label: 'LAST RESULT', val: '4 – 2', sub: 'vs The Ronaldo Enjoyers', color: '#2a9d8f' },
              // Live values from the Pulse animation. Falls back to mock targets if Supabase is empty.
              { label: 'CURRENT DIVISION',
                val: pulseValues.pos > 0 ? `DIV ${pulseValues.pos}` : '—',
                sub: `${pulseValues.matches} matches · GD ${pulseValues.gd >= 0 ? '+' : ''}${pulseValues.gd}`,
                color: 'var(--accent)' },
              { label: 'CURRENT FORM', form: ['L', 'D', 'W', 'W', 'W'], sub: 'Last 5 matches', color: '#e9c46a' }].
              map((w, i) =>
              <div key={i} className="sbc-glow-panel sbc-stat-panel" style={{ '--panel-color': w.color, background: 'rgba(8,15,30,0.85)', backdropFilter: 'blur(20px)', border: `1px solid ${w.color}33`, borderLeft: `3px solid ${w.color}`, borderRadius: 4, padding: '14px 20px', minWidth: 160 }}>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: w.color, marginBottom: 5, textTransform: 'uppercase' }}>{w.label}</div>
                {w.form ? (
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', margin: '4px 0 2px' }}>
                    {w.form.map((r, j) => {
                      const bg = r === 'W' ? '#2a9d8f' : r === 'D' ? 'rgba(255,255,255,0.22)' : '#e63946';
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

          {/* LAST MATCH PANEL — under CTAs in left column */}
          <div onClick={() => setPage('fixtures')} className="sbc-glow-panel" style={{ '--panel-color': '#2a9d8f', marginTop: 6, maxWidth: 520, background: 'rgba(8,15,30,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid #2a9d8f', borderRadius: 4, padding: '12px 16px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', color: '#2a9d8f', textTransform: 'uppercase' }}>● Last Match · WIN</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.4)' }}>APR 26 · HOME</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase', lineHeight: 1 }}>SBC FC</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, color: 'rgba(218,218,218,0.4)', marginTop: 3, letterSpacing: '0.1em' }}>HOME</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: '#2a9d8f', lineHeight: 1 }}>4</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: 'rgba(218,218,218,0.3)' }}>–</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: '#e76f51', lineHeight: 1 }}>2</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase', lineHeight: 1 }}>Ronaldo<br />Enjoyers</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {[
                { min: '23\'', txt: 'Gymskin', clr: '#2a9d8f' },
                { min: '41\'', txt: 'Panikova', clr: '#2a9d8f' },
                { min: '55\'', txt: 'Cristiano J.', clr: '#e76f51' },
                { min: '67\'', txt: 'Panikova', clr: '#2a9d8f' },
                { min: '75\'', txt: 'Manuel R.', clr: '#e76f51' },
                { min: '88\'', txt: 'Donny P', clr: '#2a9d8f' }].
                map((g, i) =>
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 10, color: g.clr }}>{g.min}</span>
                  <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: 'rgba(218,218,218,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{g.txt}</span>
                </div>
                )}
            </div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 10, color: '#2a9d8f', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 10, textAlign: 'right' }}>FULL REPORT →</div>
          </div>
          </div>

          {/* RIGHT: Player Spotlight in hero */}
          {(() => {
            const spotPlayers = (players || []).filter((p) => p.image);
            const [spIdx, setSpIdx] = React.useState(0);
            const [spHov, setSpHov] = React.useState(false);
            React.useEffect(() => {
              if (spHov) return;
              const iv = setInterval(() => setSpIdx((i) => (i + 1) % spotPlayers.length), 3800);
              return () => clearInterval(iv);
            }, [spHov]);
            const sp = spotPlayers[spIdx];
            if (!sp) return null;
            const statKeys = sp.position === 'GK' ? ['DIV', 'HAN', 'REF'] : ['PAC', 'SHO', 'DRI'];
            return (
              <div className="sbc-hero-right" style={{ flex: '0 0 380px', padding: '0 32px 0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                onClick={() => setSelectedPlayer(sp)}
                className="sbc-glow-panel sbc-player-panel"
                style={{ '--panel-color': sp.accentColor, position: 'relative', borderRadius: 8, overflow: 'hidden',
                  border: `1px solid ${sp.accentColor}55`,
                  boxShadow: spHov ? `0 16px 50px ${sp.glowColor}` : '0 4px 24px rgba(0,0,0,0.5)',
                  transition: 'all 0.3s', cursor: 'pointer',
                  // Fixed portrait box — same on every viewport. The 332×600 ratio
                  // (≈ 0.55) is close to Panikova's source photo so he barely crops;
                  // taller-source photos lose a small slice top + bottom under
                  // objectFit: cover, which the user has confirmed is acceptable.
                  width: 332, height: 600, flexShrink: 0 }}>
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
          {[
            { res: 'W', us: 4, them: 2, opp: 'Ronaldo Enjoyers', date: 'APR 27', venue: 'HOME', clr: '#2a9d8f' },
            { res: 'W', us: 3, them: 1, opp: 'FC Stamford',     date: 'APR 20', venue: 'AWAY', clr: '#2a9d8f' },
            { res: 'W', us: 2, them: 0, opp: 'Aurora United',   date: 'APR 13', venue: 'HOME', clr: '#2a9d8f' },
            { res: 'L', us: 1, them: 3, opp: 'Real Sadrid',     date: 'APR 06', venue: 'AWAY', clr: '#e63946' },
            { res: 'D', us: 2, them: 2, opp: 'Inter Vibes',     date: 'MAR 30', venue: 'HOME', clr: '#e9c46a' }
          ].map((m, i) => (
            <div key={i} onClick={() => setPage('fixtures')} className="sbc-glow-panel" style={{ '--panel-color': m.clr, background: 'rgba(8,15,30,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${m.clr}`, borderRadius: 4, padding: '14px 16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, color: m.clr, letterSpacing: '0.18em', textTransform: 'uppercase' }}>● {m.res === 'W' ? 'WIN' : m.res === 'L' ? 'LOSS' : 'DRAW'}</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: 'rgba(218,218,218,0.4)', letterSpacing: '0.15em' }}>{m.date} · {m.venue}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 26, color: m.clr, lineHeight: 1 }}>{m.us}</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: 'rgba(218,218,218,0.3)' }}>–</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 26, color: 'rgba(218,218,218,0.5)', lineHeight: 1 }}>{m.them}</div>
              </div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.65)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>vs {m.opp}</div>
            </div>
          ))}
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
          const STORE_ITEMS = [
            { productId: 1,  name: 'HOME SHIRT 25/26',   price: '£60', tag: 'NEW DROP',      clr: 'var(--accent)', img: '/assets/store/home-shirt-front.jpg' },
            { productId: 4,  name: 'GK SHIRT 25/26',     price: '£55', tag: '',              clr: '#2a9d8f',       img: '/assets/store/gk-shirt-front.jpg' },
            { productId: 6,  name: 'TRAINING JACKET',    price: '£55', tag: 'BACK IN STOCK', clr: 'var(--accent)', img: '/assets/store/jacket-front.jpg' },
            { productId: 10, name: 'PANIKOVA SCARF',     price: '£14', tag: 'LIMITED',       clr: '#e9c46a',       img: '/assets/store/panikova-scarf.jpg' },
            { productId: 7,  name: 'TRAINING HOODIE',    price: '£45', tag: '',              clr: '#2a9d8f',       img: '/assets/store/hoodie-front.jpg' },
            { productId: 9,  name: 'STAFF POLO',         price: '£35', tag: '',              clr: '#9b5de5',       img: '/assets/store/staff-shirt-front.jpg' }
          ];
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
            {SORTED_NEWS.slice(1, 5).map((item) =>
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
  const [hovered, setHovered] = React.useState(null);
  const players = useLivePlayers();   // human players carry their real EA stats here
  const positions = ['ALL', 'GK', 'DEF', 'MID', 'FWD'];
  const posMap = { GK: 'GK', CB: 'DEF', LB: 'DEF', RB: 'DEF', CDM: 'MID', CM: 'MID', CAM: 'MID', RW: 'FWD', LW: 'FWD', ST: 'FWD', CF: 'FWD' };
  const filtered = filter === 'ALL' ? players : players.filter((p) => posMap[p.position] === filter);

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* Hero banner */}
      <div className="sbc-page-header" style={{ position: 'relative', height: 240, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div className="sbc-page-header-bg" style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/uploads/sad boi header.png")', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
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

      {/* Filter bar */}
      <div className="sbc-filter-bar" style={{ background: 'rgba(6,12,24,0.22)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(228,0,43,0.12)', display: 'flex', gap: 0, padding: '0 64px' }}>
        {positions.map((pos) =>
        <button key={pos} onClick={() => setFilter(pos)} style={{
          background: 'none', border: 'none', borderBottom: filter === pos ? '3px solid var(--accent)' : '3px solid transparent',
          color: filter === pos ? 'var(--accent)' : 'rgba(218,218,218,0.45)', cursor: 'pointer',
          fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.12em', padding: '16px 24px',
          transition: 'all 0.2s', textTransform: 'uppercase'
        }}>{pos}</button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.3)', letterSpacing: '0.08em' }}>
          {filtered.length} PLAYERS
        </div>
      </div>

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
const StatsPage = ({ setSelectedPlayer }) => {
  const players = useLivePlayers();
  const scorers = [...players].filter((p) => p.goals > 0).sort((a, b) => b.goals - a.goals);
  const assisters = [...players].filter((p) => p.assists > 0).sort((a, b) => b.assists - a.assists);
  const maxGoals = scorers[0]?.goals || 1;

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      {/* HEADER */}
      <div className="sbc-page-header" style={{ position: 'relative', height: 240, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/uploads/sad boi header.png")', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.85) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.85) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', left: 64, bottom: 32 }}>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', marginBottom: 6, textTransform: 'uppercase' }}>Performance Data · 25/26</div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 60, color: '#fff', lineHeight: 0.9, textTransform: 'uppercase', textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}>STATS DASHBOARD</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, fontWeight: 300, color: 'rgba(218,218,218,0.6)', marginTop: 8, fontStyle: 'italic' }}>Numbers don't lie. Mostly.</div>
        </div>
      </div>
      <RainbowBar />
      <div style={{ padding: '40px 64px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          {/* Top Scorers */}
          <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(30,60,120,0.35)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,60,120,0.35)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(228,0,43,0.06)' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOP SCORERS</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>⚽ Goals</div>
            </div>
            {scorers.map((p, i) =>
            <div key={p.id} onClick={() => setSelectedPlayer(p)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid rgba(30,60,120,0.15)', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = `${p.accentColor}0a`}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: 'rgba(218,218,218,0.15)', width: 24, textAlign: 'center' }}>{i + 1}</div>
                {p.image ?
              <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${p.accentColor}55`, flexShrink: 0 }}><img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} alt={p.name} /></div> :
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${p.accentColor}22`, border: `2px solid ${p.accentColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 15, color: p.accentColor, flexShrink: 0 }}>{p.number}</div>
              }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase' }}>{p.shortName}</div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 4 }}>
                    <div style={{ height: '100%', width: `${p.goals / maxGoals * 100}%`, background: p.accentColor, borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: p.accentColor }}>{p.goals}</div>
              </div>
            )}
          </div>
          {/* Top Assists */}
          <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(30,60,120,0.35)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,60,120,0.35)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(67,97,238,0.06)' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOP ASSISTS</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: '#4361ee', letterSpacing: '0.15em', textTransform: 'uppercase' }}>🎯 Assists</div>
            </div>
            {assisters.slice(0, 7).map((p, i) => {
              const maxA = assisters[0]?.assists || 1;
              return (
                <div key={p.id} onClick={() => setSelectedPlayer(p)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid rgba(30,60,120,0.15)', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = `${p.accentColor}0a`}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: 'rgba(218,218,218,0.15)', width: 24 }}>{i + 1}</div>
                  {p.image ?
                  <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${p.accentColor}55`, flexShrink: 0 }}><img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} alt={p.name} /></div> :
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${p.accentColor}22`, border: `2px solid ${p.accentColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 15, color: p.accentColor, flexShrink: 0 }}>{p.number}</div>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase' }}>{p.shortName}</div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 4 }}>
                      <div style={{ height: '100%', width: `${p.assists / maxA * 100}%`, background: p.accentColor, borderRadius: 2 }} />
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: p.accentColor }}>{p.assists}</div>
                </div>);

            })}
          </div>
        </div>
        {/* Player cards grid */}
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 18 }}>PLAYER RATINGS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {PLAYERS.slice(0, 6).map((p) =>
          <div key={p.id} onClick={() => setSelectedPlayer(p)} style={{ background: 'rgba(10,22,40,0.7)', border: `1px solid ${p.accentColor}33`, borderRadius: 8, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 14, alignItems: 'center' }}
          onMouseEnter={(e) => {e.currentTarget.style.borderColor = p.accentColor;e.currentTarget.style.transform = 'translateY(-2px)';}}
          onMouseLeave={(e) => {e.currentTarget.style.borderColor = `${p.accentColor}33`;e.currentTarget.style.transform = 'none';}}>
            
              {p.image ?
            <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${p.accentColor}66`, flexShrink: 0 }}><img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} alt={p.name} /></div> :
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${p.accentColor}22`, border: `2px solid ${p.accentColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 20, color: p.accentColor, flexShrink: 0 }}>{p.number}</div>
            }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 15, color: '#fff', textTransform: 'uppercase' }}>{p.shortName}</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{p.position}</div>
                {Object.entries(p.stats).slice(0, 3).map(([k, v]) =>
              <div key={k} style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase' }}>{k}</span>
                      <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, color: p.accentColor }}>{v}</span>
                    </div>
                    <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                      <div style={{ height: '100%', width: `${v}%`, background: p.accentColor, borderRadius: 1 }} />
                    </div>
                  </div>
              )}
              </div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: p.accentColor, flexShrink: 0 }}>{p.rating}</div>
            </div>
          )}
        </div>
      </div>
    </div>);

};

// ── FIXTURES PAGE ───────────────────────────────────────────────
const FixturesPage = () => {
  const [expanded, setExpanded] = React.useState(null);
  const [fixtures, setFixtures] = React.useState([]);
  const [status, setStatus] = React.useState('loading'); // 'loading' | 'live' | 'empty'

  // Pull live league match history from Supabase on mount.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getLiveFixtures(40);
        if (cancelled) return;
        setFixtures(rows);
        setStatus(rows.length > 0 ? 'live' : 'empty');
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
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/uploads/sad boi header.png")', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
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
        {fixtures.map((f) => {
          const col = colourFor(f.result);
          const aggUs  = f.ourClubAggregate || {};
          const aggThem = f.oppClubAggregate || {};
          return (
            <div key={f.matchId} style={{ background: 'rgba(10,22,40,0.7)', border: `1px solid ${col}44`, borderRadius: 8, overflow: 'hidden', marginBottom: 10, cursor: 'pointer' }}
              onClick={() => setExpanded(expanded === f.matchId ? null : f.matchId)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderLeft: `4px solid ${col}` }}>
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
              {expanded === f.matchId && (
                <div style={{ padding: '0 20px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {f.motm && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(233,196,106,0.1)', border: '1px solid rgba(233,196,106,0.25)', borderRadius: 4, padding: '6px 14px', marginTop: 14, marginBottom: 12 }}>
                      <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#e9c46a', textTransform: 'uppercase' }}>★ MOTM</span>
                      <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase' }}>{f.motm}</span>
                    </div>
                  )}
                  {f.scorers && f.scorers.length > 0 && (
                    <div style={{ marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {f.scorers.map((s, i) =>
                        <TagChip key={i} label={`⚽ ${s.name}${s.goals > 1 ? ' ×' + s.goals : ''}`} color="rgba(42,157,143,0.1)" textColor="#2a9d8f" />
                      )}
                    </div>
                  )}
                  {/* Match-aggregate stats from EA's payload — passes/shots/tackles for both sides */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 10 }}>
                    {[
                      { label: 'Shots',         us: aggUs.shots ?? '—',         them: aggThem.shots ?? '—' },
                      { label: 'Passes',        us: aggUs.passesmade ?? '—',    them: aggThem.passesmade ?? '—' },
                      { label: 'Tackles',       us: aggUs.tacklesmade ?? '—',   them: aggThem.tacklesmade ?? '—' },
                      { label: 'Goals',         us: aggUs.goals ?? f.ourScore,  them: aggThem.goals ?? f.theirScore },
                    ].map((s, i) => (
                      <div key={i} style={{ background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase' }}>{s.label}</div>
                        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: '#fff', marginTop: 4 }}>{s.us} <span style={{ color: 'rgba(218,218,218,0.4)' }}>vs</span> {s.them}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
  // Pick up homepage-headline focus on mount
  React.useEffect(() => {
    let id = null;
    try { id = localStorage.getItem('sbc_focus_news'); localStorage.removeItem('sbc_focus_news'); } catch (e) {}
    if (id) setArticleId(parseInt(id, 10));
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
    const article = ALL_NEWS.find(n => n.id === articleId);
    if (article) return <NewsArticleView article={article} onBack={() => setArticleId(null)} />;
  }

  if (archive) return <NewsArchiveView onBack={() => setArchive(false)} onOpen={(id) => setArticleId(id)} />;

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="sbc-page-header" style={{ position: 'relative', height: 240, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/uploads/sad boi header.png")', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
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
          const lead = SORTED_NEWS[0];
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

        {SORTED_NEWS.slice(1).map((item) => {
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
  const tags = ['ALL', ...Array.from(new Set(ALL_NEWS.map(n => n.tag)))];
  const items = filter === 'ALL' ? ALL_NEWS : ALL_NEWS.filter(n => n.tag === filter);
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="sbc-page-header" style={{ position: 'relative', height: 220, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(155,93,229,0.3)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/uploads/sad boi header.png")', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.88) 100%)' }} />
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 64px 24px', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 3, height: 18, background: '#9b5de5' }} />
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: '#9b5de5', textTransform: 'uppercase' }}>From The Archive</div>
          </div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 64, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9, textShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>STORY ARCHIVE</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, fontWeight: 300, color: 'rgba(218,218,218,0.6)', marginTop: 8, fontStyle: 'italic' }}>Every chapter of the saga, in one place. {ALL_NEWS.length} stories.</div>
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
  const transfers = [
  { id: 1, player: 'UNKNOWN SIGNING', club: 'CLASSIFIED FC', fee: 'UNDISCLOSED', status: 'here_we_go', detail: 'Multiple sources confirm agreement in principle. Medicals booked. Nanna Tate personally approved the move. HERE WE GO.', color: '#2a9d8f' },
  { id: 2, player: 'GYMSKIN', club: 'SAD BOI CLIQUE FC', fee: 'LOYALTY', status: 'renewed', detail: 'Contract extension signed. New terms include guaranteed coffee at 95 degrees before every match. Non-negotiable clause.', color: '#9b5de5' },
  { id: 3, player: 'PANIKOVA', club: 'SAD BOI CLIQUE FC', fee: 'N/A', status: 'rumour', detail: 'Several unnamed clubs have enquired. Panikova reportedly saw signs in a potted cactus. Investigation ongoing.', color: 'var(--accent)' }];

  const statusConfig = {
    here_we_go: { label: 'HERE WE GO ✓', bg: '#2a9d8f' },
    renewed: { label: 'CONTRACT EXTENDED', bg: '#9b5de5' },
    rumour: { label: 'DEVELOPING STORY', bg: 'rgba(228,0,43,0.2)', text: 'var(--accent)' }
  };
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="sbc-page-header" style={{ position: 'relative', height: 240, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/uploads/sad boi header.png")', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
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
        {transfers.map((t) => {
          const cfg = statusConfig[t.status];
          const isOpen = revealed[t.id];
          return (
            <div key={t.id} className="sbc-glow-panel" style={{ '--panel-color': t.color, background: 'rgba(10,22,40,0.7)', border: `1px solid ${t.color}44`, borderRadius: 8, overflow: 'hidden', marginBottom: 14, borderLeft: `4px solid ${t.color}` }}>
              <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setRevealed((r) => ({ ...r, [t.id]: !r[t.id] }))}>
                <div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{t.player}</div>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.4)', marginTop: 2 }}>{t.club} · FEE: {t.fee}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: cfg.text || '#fff', background: cfg.bg, padding: '5px 12px', borderRadius: 3, textTransform: 'uppercase' }}>{cfg.label}</div>
                  <div style={{ color: 'rgba(218,218,218,0.3)', fontSize: 10 }}>{isOpen ? '▲' : '▼'}</div>
                </div>
              </div>
              {isOpen &&
              <div style={{ padding: '0 22px 18px', borderTop: `1px solid ${t.color}22` }}>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.6)', lineHeight: 1.7, fontStyle: 'italic', marginTop: 14, borderLeft: `2px solid ${t.color}`, paddingLeft: 12 }}>{t.detail}</div>
                </div>
              }
            </div>);

        })}
      </div>
    </div>);

};

// ── LEAGUE TABLE PAGE ───────────────────────────────────────────
const LeaguePage = () => {
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="sbc-page-header" style={{ position: 'relative', height: 240, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/uploads/sad boi header.png")', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
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
  const imgs = item.images || [];
  React.useEffect(() => {
    if (!hov || imgs.length < 2) return;
    const iv = setInterval(() => setImgIdx((i) => (i + 1) % imgs.length), 1100);
    return () => clearInterval(iv);
  }, [hov, imgs.length]);
  React.useEffect(() => { if (!hov) setImgIdx(0); }, [hov]);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="sbc-glow-panel sbc-store-card-enter"
      data-store-product={item.id}
      style={{ '--panel-color': item.clr === 'var(--accent)' ? 'var(--accent)' : item.clr, background: 'rgba(8,15,30,0.7)', border: `1px solid ${hov ? item.clr : 'rgba(255,255,255,0.08)'}`, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s', transform: hov ? 'translateY(-6px)' : 'none', boxShadow: hov ? `0 20px 50px ${item.clr === 'var(--accent)' ? 'rgba(228,0,43,0.3)' : item.clr + '33'}` : 'none' }}>
      <div style={{ height: 280, background: `linear-gradient(160deg, ${item.clr === 'var(--accent)' ? 'rgba(228,0,43,0.10)' : item.clr + '14'} 0%, rgba(3,8,16,0.95) 100%)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        {imgs.length > 0 ? (
          <React.Fragment>
            {imgs.map((src, i) => (
              <img key={src} src={src} alt={item.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', opacity: i === imgIdx ? 1 : 0, transition: 'opacity 0.5s', transform: hov ? 'scale(1.04)' : 'scale(1)', transitionProperty: 'opacity, transform', transitionDuration: '0.5s, 0.6s' }} />
            ))}
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
        {imgs.length > 1 && (
          <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', gap: 4, zIndex: 2 }}>
            {imgs.map((_, i) => (
              <div key={i} style={{ width: i === imgIdx ? 14 : 5, height: 4, borderRadius: 2, background: i === imgIdx ? item.clr : 'rgba(255,255,255,0.25)', transition: 'all 0.3s' }} />
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
  const filters = ['ALL', 'KITS', 'TRAINING', 'FAN GEAR'];

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

  const products = [
    { id: 1, name: 'HOME SHIRT 25/26', price: 60, cat: 'KITS', tag: 'NEW DROP', clr: 'var(--accent)', sub: 'Adult replica · Aura red, slim fit', images: ['/assets/store/home-shirt-front.jpg', '/assets/store/home-shirt-angled.jpg', '/assets/store/home-shirt-rear.jpg'] },
    { id: 2, name: 'AWAY SHIRT 25/26', price: 60, cat: 'KITS', tag: '', clr: '#9b5de5', sub: 'Adult replica · Midnight purple', soldOut: true, placeholderSrc: '/assets/store/staff-shirt-front.jpg' },
    { id: 3, name: 'THIRD SHIRT 25/26', price: 60, cat: 'KITS', tag: '', clr: '#e9c46a', sub: 'Adult replica · European nights gold', soldOut: true, placeholderSrc: '/assets/store/staff-shirt-front.jpg' },
    { id: 4, name: 'GK SHIRT 25/26', price: 55, cat: 'KITS', tag: '', clr: '#2a9d8f', sub: 'Goalkeeper replica · Lewis #1', images: ['/assets/store/gk-shirt-front.jpg', '/assets/store/gk-shirt-angled.jpg', '/assets/store/gk-shirt-rear.jpg'] },
    { id: 5, name: 'JUNIOR HOME SHIRT', price: 45, cat: 'KITS', tag: '', clr: 'var(--accent)', sub: 'Ages 7–13 · same kit, smaller imp', images: ['/assets/store/home-shirt-front.jpg', '/assets/store/home-shirt-angled.jpg', '/assets/store/home-shirt-rear.jpg'] },
    { id: 6, name: 'TRAINING JACKET', price: 55, cat: 'TRAINING', tag: 'BACK IN STOCK', clr: 'var(--accent)', sub: 'Quarter-zip · what the squad warms up in', images: ['/assets/store/jacket-front.jpg', '/assets/store/jacket-angled.jpg', '/assets/store/jacket-rear.jpg'] },
    { id: 7, name: 'TRAINING HOODIE', price: 45, cat: 'TRAINING', tag: '', clr: '#2a9d8f', sub: 'Heavyweight · embroidered crest', images: ['/assets/store/hoodie-front.jpg', '/assets/store/hoodie-angled.jpg', '/assets/store/hoodie-rear.jpg'] },
    { id: 13, name: 'TRAINING TOP', price: 40, cat: 'TRAINING', tag: '', clr: 'var(--accent)', sub: 'Match-day warmup · technical fabric', images: ['/assets/store/training-front.jpg', '/assets/store/training-angled.jpg', '/assets/store/training-rear.jpg'] },
    { id: 8, name: 'STAFF POLO', price: 35, cat: 'TRAINING', tag: '', clr: '#9b5de5', sub: 'Bench-day fit · breathable mesh back', images: ['/assets/store/staff-shirt-front.jpg', '/assets/store/staff-shirt-angled.jpg', '/assets/store/staff-shirt-rear.jpg'] },
    { id: 9, name: 'TRAINING SHORTS', price: 28, cat: 'TRAINING', tag: '', clr: '#9b5de5', sub: 'Same shorts the squad trains in', images: ['/assets/store/training-shorts.jpg', '/assets/store/training-shorts-side.jpg'] },
    { id: 10, name: 'PANIKOVA SCARF', price: 14, cat: 'FAN GEAR', tag: 'LIMITED', clr: '#e9c46a', sub: '"WHEN THE PANIC HITS" · 100% acrylic', images: ['/assets/store/panikova-scarf.jpg', '/assets/store/panikova-scarf-close.jpg'] },
    { id: 14, name: 'BOBBLE HAT', price: 22, cat: 'FAN GEAR', tag: '', clr: '#9b5de5', sub: 'Knit · embroidered imp · pom-pom included', images: ['/assets/store/bobble-hat-front.jpg', '/assets/store/bobble-hat-rear.jpg'] },
    { id: 15, name: 'CLUB SOCKS', price: 12, cat: 'FAN GEAR', tag: '', clr: '#2a9d8f', sub: 'Crew length · cotton blend · imp on the cuff', images: ['/assets/store/socks.jpg'] },
    { id: 16, name: 'AURA WALLET', price: 28, cat: 'FAN GEAR', tag: 'NEW', clr: '#e9c46a', sub: 'Bifold · faux leather · debossed crest', images: ['/assets/store/wallet-front.jpg', '/assets/store/wallet-open.jpg'] },
    { id: 12, name: 'AURA STABILITY MUG', price: 12, cat: 'FAN GEAR', tag: 'BESTSELLER', clr: 'var(--accent)', sub: 'Reads at exactly 95°C · ceramic 11oz', images: ['/assets/store/aura-mug.jpg'] }
  ];
  const filtered = filter === 'ALL' ? products : products.filter(p => p.cat === filter);
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="sbc-page-header" style={{ position: 'relative', height: 240, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/uploads/sad boi header.png")', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
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
  // Persisted account state — 'guest' | 'signup' | 'signin' | 'member'
  const [authState, setAuthState] = React.useState(() => {
    try { return localStorage.getItem('sbc_auth_state') || 'guest'; } catch (e) { return 'guest'; }
  });
  const [tab, setTab] = React.useState('PROFILE');
  const [signupStep, setSignupStep] = React.useState(1);
  const [form, setForm] = React.useState({ name: '', email: '', password: '', favPlayer: '', tier: 'casual', sadnessLevel: 50, newsletter: true });

  React.useEffect(() => { try { localStorage.setItem('sbc_auth_state', authState); } catch (e) {} }, [authState]);

  const tabs = ['PROFILE', 'BASKET', 'ORDERS', 'TICKETS', 'PREFERENCES'];

  // ── GUEST: Sign in / Sign up choice ──
  if (authState === 'guest') {
    return (
      <div style={{ background: 'transparent', minHeight: '100vh' }}>
        <div className="sbc-page-header" style={{ position: 'relative', height: 220, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/uploads/sad boi header.png")', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.85) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.85) 0%, transparent 50%)' }} />
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 64px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 3, height: 18, background: 'var(--accent)' }} />
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', color: 'var(--accent)', textTransform: 'uppercase' }}>Members Area</div>
            </div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 64, color: '#fff', lineHeight: 0.9, textTransform: 'uppercase', textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}>JOIN THE CLIQUE</div>
          </div>
        </div>
        <RainbowBar />
        <div className="sbc-page-pad" style={{ padding: '64px 64px 96px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, maxWidth: 980, margin: '0 auto' }}>
          {/* Sign in card */}
          <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderRadius: 8, padding: '32px 32px 28px' }}>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'rgba(218,218,218,0.5)', marginBottom: 8, textTransform: 'uppercase' }}>Already initiated</div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: '#fff', textTransform: 'uppercase', marginBottom: 18, letterSpacing: '0.04em' }}>Sign In</div>
            <input type="email" placeholder="Email" style={{ width: '100%', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '12px 14px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
            <input type="password" placeholder="Password" style={{ width: '100%', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '12px 14px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13, marginBottom: 18, boxSizing: 'border-box' }} />
            <button onClick={() => setAuthState('member')} style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.18em', padding: '14px 0', borderRadius: 4, textTransform: 'uppercase' }}>SIGN IN →</button>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.4)', marginTop: 12, textAlign: 'center' }}>Forgot password? Embrace the loss.</div>
          </div>
          {/* Sign up card */}
          <div style={{ background: 'rgba(228,0,43,0.08)', border: '1px solid rgba(228,0,43,0.5)', borderRadius: 8, padding: '32px 32px 28px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--accent)', color: '#fff', padding: '4px 10px', fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', borderRadius: '0 8px 0 4px' }}>NEW</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', marginBottom: 8, textTransform: 'uppercase' }}>First time?</div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: '#fff', textTransform: 'uppercase', marginBottom: 14, letterSpacing: '0.04em' }}>Create Account</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.65)', lineHeight: 1.6, marginBottom: 22 }}>Join 47,000 fellow Sad Bois. Get match alerts, ticket priority, fern updates, and Panikova's coordinates (location data approximate).</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Priority match-day tickets', 'Exclusive transfer rumour drops', 'Member-only kit drops', 'Aura calibration updates'].map((t) => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Roboto, sans-serif', fontSize: 12, color: '#fff' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>{t}
                </li>
              ))}
            </ul>
            <button onClick={() => { setAuthState('signup'); setSignupStep(1); }} style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.18em', padding: '14px 0', borderRadius: 4, textTransform: 'uppercase' }}>EMBRACE SADNESS →</button>
          </div>
        </div>
      </div>);
  }

  // ── SIGNUP: 3-step onboarding ──
  if (authState === 'signup') {
    const totalSteps = 3;
    const stepLabels = ['Identity', 'Allegiance', 'Calibration'];
    return (
      <div style={{ background: 'transparent', minHeight: '100vh' }}>
        <div className="sbc-page-header" style={{ position: 'relative', height: 220, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/uploads/sad boi header.png")', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.85) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.85) 0%, transparent 50%)' }} />
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 64px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 3, height: 18, background: 'var(--accent)' }} />
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', color: 'var(--accent)', textTransform: 'uppercase' }}>Step {signupStep} of {totalSteps} · {stepLabels[signupStep - 1]}</div>
            </div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 56, color: '#fff', lineHeight: 0.9, textTransform: 'uppercase', textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}>WELCOME, SAD BOI</div>
          </div>
        </div>
        <RainbowBar />
        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 4, padding: '20px 64px 0', maxWidth: 720, margin: '0 auto', boxSizing: 'content-box' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ flex: 1, height: 4, borderRadius: 2, background: n <= signupStep ? 'var(--accent)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
          ))}
        </div>

        <div className="sbc-page-pad" style={{ padding: '32px 64px 96px', maxWidth: 720, margin: '0 auto' }}>
          <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderRadius: 8, padding: '36px 40px' }}>
            {signupStep === 1 && (
              <div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#fff', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.04em' }}>Who are you?</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.55)', marginBottom: 24, fontStyle: 'italic' }}>(Real-ish name optional. We'll never doxx you.)</div>
                {[
                  { key: 'name', label: 'DISPLAY NAME', placeholder: 'Sad Boi #2', type: 'text' },
                  { key: 'email', label: 'EMAIL', placeholder: 'manager@sadboiclique.fc', type: 'email' },
                  { key: 'password', label: 'PASSWORD', placeholder: '••••••••••', type: 'password' }
                ].map((f) => (
                  <div key={f.key} style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(218,218,218,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>{f.label}</div>
                    <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} style={{ width: '100%', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '12px 14px', color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            )}
            {signupStep === 2 && (
              <div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#fff', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.04em' }}>Pick your favourite</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.55)', marginBottom: 24, fontStyle: 'italic' }}>(They will let you down. That's the point.)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 22 }}>
                  {['PANIKOVA', 'GYMSKIN', 'DONNY P', 'RICCIARDO', 'KARAVAVOV', 'JIMENEZ'].map((p) => (
                    <button key={p} onClick={() => setForm({ ...form, favPlayer: p })} style={{ background: form.favPlayer === p ? 'rgba(228,0,43,0.18)' : 'rgba(8,15,30,0.6)', border: form.favPlayer === p ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '14px 8px', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 14, color: form.favPlayer === p ? 'var(--accent)' : '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'all 0.15s' }}>{p}</button>
                  ))}
                </div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(218,218,218,0.5)', marginBottom: 10, textTransform: 'uppercase' }}>Loyalty Tier</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['casual', 'CASUAL', '£0/mo'], ['cult', 'CULT MEMBER', '£8/mo'], ['lifer', 'LIFER', '£20/mo']].map(([val, lbl, price]) => (
                    <button key={val} onClick={() => setForm({ ...form, tier: val })} style={{ flex: 1, background: form.tier === val ? 'rgba(228,0,43,0.18)' : 'rgba(8,15,30,0.6)', border: form.tier === val ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)', borderLeft: form.tier === val ? '3px solid var(--accent)' : '3px solid transparent', borderRadius: 4, padding: '14px 12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: form.tier === val ? 'var(--accent)' : '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{lbl}</div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.5)', marginTop: 4 }}>{price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {signupStep === 3 && (
              <div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#fff', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.04em' }}>Aura Calibration</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.55)', marginBottom: 24, fontStyle: 'italic' }}>(This is mandatory and also legally non-binding.)</div>
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase' }}>Sadness Level</span>
                    <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: 'var(--accent)' }}>{form.sadnessLevel}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={form.sadnessLevel} onChange={(e) => setForm({ ...form, sadnessLevel: +e.target.value })} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: 'Roboto, sans-serif', fontSize: 9, color: 'rgba(218,218,218,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    <span>Stoic</span><span>Reasonable</span><span>Maxed</span>
                  </div>
                </div>
                <div onClick={() => setForm({ ...form, newsletter: !form.newsletter })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, cursor: 'pointer' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 4, background: form.newsletter ? 'var(--accent)' : 'transparent', border: form.newsletter ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {form.newsletter && <span style={{ color: '#fff', fontSize: 14, lineHeight: 1 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: '#fff', fontWeight: 600 }}>Send me the weekly newsletter</div>
                    <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.5)', marginTop: 2 }}>Mostly Panikova updates. Occasional fern photography.</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => signupStep === 1 ? setAuthState('guest') : setSignupStep(signupStep - 1)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(218,218,218,0.6)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.15em', padding: '11px 20px', borderRadius: 3, textTransform: 'uppercase' }}>← {signupStep === 1 ? 'CANCEL' : 'BACK'}</button>
              {signupStep < totalSteps ? (
                <button onClick={() => setSignupStep(signupStep + 1)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.18em', padding: '12px 28px', borderRadius: 4, textTransform: 'uppercase' }}>NEXT →</button>
              ) : (
                <button onClick={() => setAuthState('member')} style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.18em', padding: '12px 28px', borderRadius: 4, textTransform: 'uppercase' }}>FINISH & EMBRACE ✓</button>
              )}
            </div>
          </div>
        </div>
      </div>);
  }

  // ── MEMBER: full account view (existing layout) ──
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="sbc-page-header" style={{ position: 'relative', height: 240, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/uploads/sad boi header.png")', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,8,16,0.55) 0%, rgba(3,8,16,0.85) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.85) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', left: 64, bottom: 32, display: 'flex', alignItems: 'flex-end', gap: 20 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(228,0,43,0.15)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 48, color: 'var(--accent)' }}>SB</div>
          <div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', marginBottom: 6, textTransform: 'uppercase' }}>Member since 2024 · Lifetime Sad Boi</div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 56, color: '#fff', lineHeight: 0.9, textTransform: 'uppercase', textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}>SAD BOI #1</div>
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
          <button onClick={() => setAuthState('guest')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(218,218,218,0.55)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.18em', padding: '7px 14px', borderRadius: 3, textTransform: 'uppercase' }}>SIGN OUT</button>
        </div>
        {tab === 'PROFILE' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderRadius: 8, padding: '24px 28px' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', marginBottom: 18, letterSpacing: '0.04em' }}>Manager Info</div>
              {[
                ['DISPLAY NAME', 'Sad Boi #1'],
                ['EMAIL', 'manager@sadboiclique.fc'],
                ['MEMBER SINCE', 'September 2024'],
                ['FAVOURITE PLAYER', 'Panikova'],
                ['HOME GROUND', 'LNER Stadium, Lincoln'],
                ['LOYALTY TIER', 'CULT MEMBER · TIER III']
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.45)', textTransform: 'uppercase' }}>{k}</span>
                  <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: '#fff', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderRadius: 8, padding: '24px 28px' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', marginBottom: 18, letterSpacing: '0.04em' }}>Season Stats</div>
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

// ── BASKET PAGE ─────────────────────────────────────────────────
const BasketPage = ({ setPage }) => {
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="sbc-page-header" style={{ position: 'relative', height: 220, marginTop: 92, overflow: 'hidden', borderBottom: '1px solid rgba(228,0,43,0.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/uploads/sad boi header.png")', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
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
  BasketPage,
};
