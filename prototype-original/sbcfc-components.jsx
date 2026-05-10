
// ============================================================
// SBCFC SHARED COMPONENTS & DATA
// Exports to window for cross-file access
// ============================================================

const PLAYERS = [
  {
    id: 'panikova', name: 'Amir Panikova', shortName: 'PANIKOVA', number: 77, image: 'uploads/pasted-1777415983890-0.png', image: 'uploads/pasted-1777415983890-0.png',
    position: 'ST', rating: 90, rarity: 'icon', nationality: 'RU',
    goals: 187, apps: 306, assists: 43, cleanSheets: null,
    stats: { PAC: 85, SHO: 91, PAS: 72, DRI: 87, DEF: 22, PHY: 80 },
    tags: ['The Calm (Formerly)', 'Aura Instability Risk', 'Vibe Injury Prone', 'Offside Non-Compliant'],
    accentColor: '#ff2244', glowColor: 'rgba(255,34,68,0.45)',
    archetype: 'Chaos Icon',
    lore: 'Once heralded as the most composed striker in Pro Clubs history. Then something shifted. Nobody knows what. Not even him.',
    timeline: [
      { era: 'The Rise', note: '187 goals. Cold. Clinical. Legendary.' },
      { era: 'The Collapse', note: 'Missed a penalty against 10 men. Blamed a seagull.' },
      { era: 'The Rebirth', note: 'Sad Boi era begins. Chaos becomes the method.' }
    ]
  },
  {
    id: 'gymskin', name: 'Gymskin', shortName: 'GYMSKIN', number: 95, image: 'uploads/pasted-1777416552965-0.png', image: 'uploads/pasted-1777416552965-0.png',
    position: 'CAM', rating: 89, rarity: 'legend', nationality: '🌟',
    goals: 278, apps: 298, assists: 127, cleanSheets: null,
    stats: { PAC: 80, SHO: 88, PAS: 85, DRI: 92, DEF: 45, PHY: 75 },
    tags: ['Aura Commander', 'Coffee Calibrated', 'Drop the Shoulder™', 'Streamer-God Hybrid'],
    accentColor: '#9b5de5', glowColor: 'rgba(155,93,229,0.45)',
    archetype: 'Aura Commander',
    lore: 'Operates on a frequency science cannot explain. Will not play before coffee reaches exactly 95 degrees. Non-negotiable.',
    timeline: [
      { era: 'The Awakening', note: 'Discovered "Drop the Shoulder™" aged 19. Patent pending.' },
      { era: 'The Aura Era', note: '278 goals. Mostly from impossible angles.' },
      { era: 'The Calibration', note: 'Coffee ritual introduced. Win rate +34%.' }
    ]
  },
  {
    id: 'karavavov', name: 'Dmitri Karavavov', shortName: 'KARAVAVOV', number: 11, image: 'uploads/Karavavov.png',
    position: 'CM', rating: 85, rarity: 'rare', nationality: 'RU',
    goals: 52, apps: 241, assists: 89, cleanSheets: null,
    stats: { PAC: 78, SHO: 74, PAS: 91, DRI: 88, DEF: 55, PHY: 70 },
    tags: ['Creative Chaos Engine', 'Risk Merchant', 'Ball Retention: None'],
    accentColor: '#f4a261', glowColor: 'rgba(244,162,97,0.45)',
    archetype: 'Trickster Genius',
    lore: 'The architect of beautiful sequences and catastrophic collapses. Often in the same passage of play. Frequently both.',
    timeline: [
      { era: 'The Trickster', note: 'Invented a skill move. Refused to name it.' },
      { era: 'The Chaos Phase', note: 'Lost the ball 847 times in one season. Still assisted 89.' },
      { era: 'The Acceptance', note: 'Manager stopped telling him to keep it simple.' }
    ]
  },
  {
    id: 'donnyp', name: 'Donald Partridge', shortName: 'DONNY P', number: 9, image: 'uploads/pasted-1777417166292-0.png', image: 'uploads/pasted-1777417166292-0.png',
    position: 'CF', rating: 83, rarity: 'rare', nationality: 'ENG',
    goals: 94, apps: 198, assists: 31, cleanSheets: null,
    stats: { PAC: 83, SHO: 79, PAS: 68, DRI: 80, DEF: 20, PHY: 76 },
    tags: ['Early Release Specialist', 'Top Bins (Rare)', 'Wind Resistant', 'Confidence MAX'],
    accentColor: '#e9c46a', glowColor: 'rgba(233,196,106,0.45)',
    archetype: 'Unreliable Technician',
    lore: 'Confident. Emphatic. Wildly inconsistent. Has scored some absolute worldies. Has also missed from 3 yards. Claims wind resistance for both.',
    timeline: [
      { era: 'The Promise', note: 'Scored a bicycle kick on debut. Never mentioned since.' },
      { era: 'The Sitter Era', note: 'DONNY P MISSES SITTER, CLAIMS WIND RESISTANCE.' },
      { era: 'The Redemption Arc', note: 'Top bins from 35 yards. "I meant it." He did not.' }
    ]
  },
  {
    id: 'ricciardo', name: 'Daniel Ricciardo', shortName: 'RICCIARDO', number: 7, image: 'uploads/Ricciardo.png',
    position: 'RW', rating: 82, rarity: 'rare', nationality: 'AUS',
    goals: 23, apps: 187, assists: 12, cleanSheets: null,
    stats: { PAC: 90, SHO: 72, PAS: 58, DRI: 85, DEF: 30, PHY: 78 },
    tags: ['No Cross Completion', 'Performance Variance MAX', 'Chaos Merchant', 'RICCIARDO STILL HASN\'T COMPLETED A CROSS'],
    accentColor: '#00c8ff', glowColor: 'rgba(0,200,255,0.45)',
    archetype: 'Chaos Merchant',
    lore: 'Fast. Unpredictable. Has never successfully completed a cross in his career. Cross completion rate: 0.0%. We have checked. Many times.',
    timeline: [
      { era: 'The Arrival', note: 'Fastest player in the club. Great. What could go wrong.' },
      { era: 'The Cross Incident', note: 'Attempted 847 crosses. Zero completed. Ongoing investigation.' },
      { era: 'The Acceptance', note: 'Cross attempts now celebrated ironically. Still not completed one.' }
    ]
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
];

const NEWS_ITEMS = [
  { id: 1, headline: 'PANIKOVA: The Panic Returns?', tag: 'BREAKING', tagColor: '#ff2244', summary: 'Sources close to the striker report "unusual energy" ahead of Saturday\'s fixture. Aura stability readings are at a season-low.', time: '2 hours ago', hot: true },
  { id: 2, headline: 'GYMSKIN ACTIVATES AURA PULSE IN 4-2 THRILLER', tag: 'MATCH REPORT', tagColor: '#9b5de5', summary: 'The midfielder\'s coffee was reportedly at exactly 95 degrees. The correlation is undeniable. Science has confirmed it.', time: '1 day ago', hot: false },
  { id: 3, headline: 'DONNY P MISSES SITTER, CLAIMS "WIND RESISTANCE"', tag: 'ANALYSIS', tagColor: '#e9c46a', summary: 'Wind speed at time of shot: 0mph. Our analysts have reviewed the footage 47 times. There was no wind. We checked.', time: '2 days ago', hot: false },
  { id: 4, headline: 'RICCIARDO STILL HASN\'T COMPLETED A CROSS', tag: 'ONGOING', tagColor: '#00c8ff', summary: 'Week 23 of our ongoing investigation. Cross attempt count: 1,247. Successful crosses: 0. The mystery deepens.', time: '3 days ago', hot: true },
  { id: 5, headline: 'PANIKOVA CLAIMS HE SAW SIGNS IN A FERN AGAIN', tag: 'EXCLUSIVE', tagColor: '#ff2244', summary: 'The striker spotted what he describes as "a clear tactical formation" in the foliage outside the training ground. Worrying.', time: '4 days ago', hot: false },
  { id: 6, headline: 'GYMSKIN REFUSES TO PLAY BEFORE COFFEE CALIBRATION', tag: 'CULTURE', tagColor: '#9b5de5', summary: 'Kick-off delayed 4 minutes as thermometer was misplaced. Once located and confirmed at 95°, performance was transcendent.', time: '5 days ago', hot: false },
  { id: 7, headline: 'KARAVAVOV: "THE RISKY PASS WAS THE RIGHT PASS"', tag: 'POST-MATCH', tagColor: '#f4a261', summary: 'It wasn\'t. He lost possession 14 times. He scored twice from the resulting chaos. Karavavov remains undefeated in arguments.', time: '6 days ago', hot: false },
  { id: 8, headline: 'TRANSFER SPECIAL: HERE WE GO — CLUB ANNOUNCES NEW DEAL', tag: 'TRANSFER', tagColor: '#2a9d8f', summary: 'Multiple sources confirm agreement in principle. Personal terms agreed. Medical scheduled. Nanna Tate approved.', time: '1 week ago', hot: false }
];

const FIXTURES = [
  { id: 1, opponent: 'FC Midnight', date: 'May 3', time: '20:00', home: true, result: null, competition: 'Premier League' },
  { id: 2, opponent: 'The Ronaldo Enjoyers', date: 'Apr 26', time: 'FT', home: false, result: { us: 4, them: 2 }, scorers: ['Gymskin 23\'', 'Panikova 41\'', 'Panikova 67\'', 'Donny P 88\''], competition: 'Premier League', motm: 'Gymskin', narrative: 'Gymskin activated Aura Pulse in the 67th minute. Three goals in 21 minutes followed. Coincidence? No.' },
  { id: 3, opponent: 'Vibes Only United', date: 'Apr 19', time: 'FT', home: true, result: { us: 2, them: 2 }, scorers: ['Karavavov 12\'', 'M. Silva 89\''], competition: 'Premier League', motm: 'Watts', narrative: 'Silva\'s header from a corner nobody asked for saved the point. He said nothing.' },
  { id: 4, opponent: 'Banter FC', date: 'Apr 12', time: 'FT', home: false, result: { us: 6, them: 1 }, scorers: ['Panikova 8\' 22\' 45\'', 'Gymskin 51\' 78\'', 'Donny P 90+3\''], competition: 'Cup', motm: 'Panikova', narrative: 'Hat-trick in first half. Calm phase unlocked briefly. Then Panikova tried to dribble the keeper. Classic.' },
  { id: 5, opponent: 'The Metaphysicals', date: 'Apr 5', time: 'FT', home: true, result: { us: 1, them: 3 }, scorers: ['Ricciardo 44\''], competition: 'Premier League', motm: 'Watts', narrative: 'Ricciardo scored one goal and attempted 34 crosses. None were completed. He scored from open play. We\'ve stopped questioning it.' },
  { id: 6, opponent: 'Galaxy Brain XI', date: 'May 10', time: '19:45', home: true, result: null, competition: 'Cup' }
];

const LEAGUE_TABLE = [
  { pos: 1, team: 'FC Midnight', p: 28, w: 20, d: 4, l: 4, gd: 34, pts: 64, form: ['W','W','W','D','W'] },
  { pos: 2, team: 'Sad Boi Clique FC', p: 28, w: 18, d: 5, l: 5, gd: 28, pts: 59, form: ['W','D','W','L','W'], us: true },
  { pos: 3, team: 'Vibes Only United', p: 28, w: 16, d: 7, l: 5, gd: 19, pts: 55, form: ['D','W','D','W','L'] },
  { pos: 4, team: 'The Metaphysicals', p: 28, w: 14, d: 6, l: 8, gd: 12, pts: 48, form: ['W','L','W','W','D'] },
  { pos: 5, team: 'Banter FC', p: 28, w: 12, d: 5, l: 11, gd: -2, pts: 41, form: ['L','L','W','D','L'] },
  { pos: 6, team: 'Galaxy Brain XI', p: 28, w: 10, d: 8, l: 10, gd: -8, pts: 38, form: ['D','W','L','D','W'] },
  { pos: 7, team: 'The Ronaldo Enjoyers', p: 28, w: 8, d: 4, l: 16, gd: -21, pts: 28, form: ['L','L','L','L','W'] },
];

// ── NavBar ─────────────────────────────────────────────────────
const NavBar = ({ page, setPage }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navItems = [
    { id: 'home', label: 'HOME' },
    { id: 'squad', label: 'SQUAD' },
    { id: 'stats', label: 'STATS' },
    { id: 'fixtures', label: 'FIXTURES' },
    { id: 'news', label: 'NEWS' },
    { id: 'transfers', label: 'TRANSFERS' },
    { id: 'league', label: 'TABLE' }
  ];
  return (
    <nav style={{
      position: 'relative',
      background: 'rgba(3,8,16,0.96)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(228,0,43,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 64
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setPage('home')}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(228,0,43,0.15)', border: '1px solid rgba(228,0,43,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
          boxShadow: '0 0 12px rgba(228,0,43,0.35)'
        }}>
          <img src="uploads/LCFC_white_primary_logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '5px' }} alt="SBCFC" />
        </div>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '0.12em', color: '#eef2ff', lineHeight: 1 }}>SAD BOI CLIQUE</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 500, fontSize: 10, letterSpacing: '0.2em', color: 'rgba(0,200,255,0.7)', lineHeight: 1 }}>F.C. • EST. FC26</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
            fontSize: 12, letterSpacing: '0.15em',
            color: page === item.id ? '#E4002B' : 'rgba(220,230,255,0.55)',
            padding: '8px 12px', borderRadius: 4,
            borderBottom: page === item.id ? '2px solid #E4002B' : '2px solid transparent',
            transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}
          onMouseEnter={e => { if (page !== item.id) e.target.style.color = '#E4002B'; }}
          onMouseLeave={e => { if (page !== item.id) e.target.style.color = 'rgba(220,230,255,0.55)'; }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div style={{
        fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.1em',
        color: 'rgba(220,230,255,0.35)', textAlign: 'right', lineHeight: 1.3,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
      }}>
        <span style={{ color: 'rgba(228,0,43,0.7)', fontWeight: 700 }}>SPONSORED BY</span>
        <span style={{ fontWeight: 600, fontSize: 11, color: 'rgba(220,230,255,0.5)' }}>NANNA TATE</span>
        <span style={{ fontSize: 9, color: 'rgba(220,230,255,0.3)' }}>POTATO PERFECTION</span>
      </div>
    </nav>
  );
};

// ── PlayerCard ────────────────────────────────────────────────
const PlayerCard = ({ player, onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  const cfg = RARITY_CONFIGS[player.rarity];
  const statKeys = player.position === 'GK' ? ['DIV','HAN','KIC','REF','SPD','POS'] : ['PAC','SHO','PAS','DRI','DEF','PHY'];

  return (
    <div
      onClick={() => onClick(player)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 200, flexShrink: 0, borderRadius: 8, overflow: 'hidden',
        cursor: 'pointer', position: 'relative', height: 300,
        border: `1px solid ${hovered ? '#E4002B' : cfg.border + '80'}`,
        transition: 'all 0.3s cubic-bezier(0.2,0,0,1)',
        transform: hovered ? 'translateY(-8px) scale(1.02)' : 'none',
        boxShadow: hovered ? '0 20px 60px rgba(228,0,43,0.35)' : '0 4px 20px rgba(0,0,0,0.5)',
        background: '#0a1628'
      }}
    >
      {player.image ? (
        <>
          <img src={player.image} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block', position: 'absolute', inset: 0 }} alt={player.name} />
          <div style={{ position: 'absolute', inset: 0, background: hovered ? 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' : 'linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)', transition: 'all 0.3s' }} />
        </>
      ) : (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #0d1f3c, #050d1a)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\'%3E%3Ctext x=\'30\' y=\'42\' text-anchor=\'middle\' font-size=\'32\' fill=\'rgba(255,255,255,0.025)\'%3E⚜%3C/text%3E%3C/svg%3E")' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-60%)', fontFamily: 'Anton, sans-serif', fontSize: 80, color: `${player.accentColor}18`, letterSpacing: '-0.02em', lineHeight: 1, userSelect: 'none' }}>{player.number}</div>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `linear-gradient(225deg, ${player.accentColor}15, transparent)` }} />
        </>
      )}

      {/* Top: rating + rarity */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, lineHeight: 1, color: hovered ? '#E4002B' : cfg.border, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{player.rating}</div>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 2 }}>{player.position}</div>
      </div>

      {/* Top right: rarity badge */}
      {cfg.label && <div style={{ position: 'absolute', top: 12, right: 12, fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: cfg.border, background: `${cfg.border}22`, padding: '3px 7px', borderRadius: 2, border: `1px solid ${cfg.border}44` }}>{cfg.label}</div>}

      {/* Bottom: name + stats */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 12px 10px' }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: '#fff', textTransform: 'uppercase', lineHeight: 1, letterSpacing: '0.02em', marginBottom: 4, textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>{player.shortName}</div>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: 'rgba(218,218,218,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{player.archetype}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2 }}>
          {statKeys.map(k => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 12, color: player.stats[k] >= 85 ? '#E4002B' : 'rgba(255,255,255,0.85)', lineHeight: 1 }}>{player.stats[k]}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 7, color: 'rgba(218,218,218,0.4)', letterSpacing: '0.05em' }}>{k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Red top bar on hover */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#E4002B', transform: hovered ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.3s' }} />

      {/* Hover CTA */}
      {hovered && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#E4002B', color: '#fff', fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.1em', padding: '8px 16px', borderRadius: 3, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>VIEW PROFILE →</div>
      )}
    </div>
  );
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
    '🟣 GYMSKIN REFUSES KICKOFF BEFORE COFFEE CALIBRATION',
  ];
  const full = [...headlines, ...headlines];
  return (
    <div style={{ background: '#cc0022', overflow: 'hidden', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
      <div style={{ display: 'inline-flex', animation: 'ticker 40s linear infinite' }}>
        {full.map((h, i) => (
          <span key={i} style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', color: '#fff', padding: '6px 32px' }}>
            {h}
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Stat Bar ────────────────────────────────────────────────────
const StatBar = ({ label, value, color, max = 99 }) => {
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => { const t = setTimeout(() => setWidth(value), 100); return () => clearTimeout(t); }, [value]);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(220,230,255,0.7)' }}>{label}</span>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 800, color }}>{value}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(width / max) * 100}%`, background: color, borderRadius: 2, transition: 'width 1s cubic-bezier(0.2,0,0,1)', boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>
  );
};

// ── Rainbow Bar (kit trim) ──────────────────────────────────────
const RainbowBar = ({ height = 3 }) => (
  <div style={{ height, background: 'linear-gradient(90deg, #e63946, #f4a261, #e9c46a, #2a9d8f, #4361ee, #9b5de5)', flexShrink: 0 }} />
);

// ── Tag Chip ────────────────────────────────────────────────────
const TagChip = ({ label, color = 'rgba(0,200,255,0.15)', textColor = '#00c8ff' }) => (
  <span style={{
    fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.1em', color: textColor, background: color,
    padding: '3px 8px', borderRadius: 3, border: `1px solid ${textColor}33`, whiteSpace: 'nowrap'
  }}>{label}</span>
);

// ── Export ──────────────────────────────────────────────────────
Object.assign(window, { PLAYERS, NEWS_ITEMS, FIXTURES, LEAGUE_TABLE, NavBar, PlayerCard, BreakingTicker, StatBar, RainbowBar, TagChip, RARITY_CONFIGS });
