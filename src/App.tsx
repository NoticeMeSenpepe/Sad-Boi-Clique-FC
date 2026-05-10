// ============================================================
// SBCFC App shell
// Ported from the original prototype index.html inline <script>.
// Wires the Chaos Feed ticker, NavBar, page router, Tweaks panel,
// global background and the custom cursor effect to the bundled
// components in ./sbcfc.
// ============================================================
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  NavBar,
  HomePage, SquadPage, StatsPage, FixturesPage,
  NewsPage, TransfersPage, LeaguePage, StorePage, AccountPage, BasketPage,
  PlayerProfileModal,
} from './sbcfc';
import Landing from './Landing';
import { useAuth } from './auth';

const TWEAK_DEFAULTS = {
  accentColor: '#E4002B',
  glowIntensity: 100,
  theme: 'dark' as 'dark' | 'light',
};

const BG_IMAGES = [
  '/uploads/pasted-1777416492636-0.png',
  '/uploads/pasted-1777416483790-0.png',
  '/uploads/Sad Boi Clique Widescreen.png',
  '/uploads/sad boi header.png',
];
const BG_IMAGES_LIGHT = [
  '/uploads/white imp background 1.png',
  '/uploads/white imp background 2.png',
  '/uploads/Sad Boi Clique Widescreen.png',
  '/uploads/sad boi header.png',
];

const THEME_COLORS = {
  dark:  '#030810',
  light: '#f4f1ea',
};

// localStorage key for persisting Tweaks panel state across visits.
const TWEAKS_STORAGE_KEY = 'sbcfc.tweaks.v1';

// Page-header backgrounds (used by every sub-page header band — Squad,
// Fixtures, Stats, etc.). Cycled on a 30-second timer.
const PAGE_HEADER_IMAGES = [
  '/uploads/sad boi header.png',
  '/uploads/new sbc header.png',
];

/** Cycles the `--page-header-image` CSS variable through PAGE_HEADER_IMAGES
 *  every 30 seconds. The variable is consumed by every sub-page's header
 *  band, so they all swap simultaneously. */
function usePageHeaderRotator() {
  React.useEffect(() => {
    const apply = (i: number) => {
      document.documentElement.style.setProperty(
        '--page-header-image',
        `url("${PAGE_HEADER_IMAGES[i % PAGE_HEADER_IMAGES.length]}")`
      );
    };
    let i = 0;
    apply(i);
    const id = window.setInterval(() => { i += 1; apply(i); }, 30_000);
    return () => clearInterval(id);
  }, []);
}

// ── Custom cursor — vanilla DOM, runs once on mount, no React state ──
function useCustomCursor() {
  React.useEffect(() => {
    const cur  = document.getElementById('site-cursor');
    const ring = document.getElementById('site-cursor-ring');
    if (!cur || !ring) return;

    let rx = window.innerWidth / 2;
    let ry = window.innerHeight / 2;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      cur.style.left = e.clientX + 'px';
      cur.style.top  = e.clientY + 'px';
    };
    const animRing = () => {
      const tx = parseFloat(cur.style.left) || 0;
      const ty = parseFloat(cur.style.top)  || 0;
      rx += (tx - rx) * 0.13;
      ry += (ty - ry) * 0.13;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      raf = requestAnimationFrame(animRing);
    };
    raf = requestAnimationFrame(animRing);

    const onDown = () => {
      cur.style.transform = 'translate(-50%,-50%) scale(1.8)';
      ring.style.width = '18px'; ring.style.height = '18px';
    };
    const onUp = () => {
      cur.style.transform = 'translate(-50%,-50%) scale(1)';
      ring.style.width = '36px'; ring.style.height = '36px';
    };
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('a,button,[role="button"]')) {
        ring.style.width = '56px'; ring.style.height = '56px';
        ring.style.borderColor = 'rgba(228,0,43,0.8)';
      }
    };
    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('a,button,[role="button"]')) {
        ring.style.width = '36px'; ring.style.height = '36px';
        ring.style.borderColor = 'rgba(228,0,43,0.45)';
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup',   onUp);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout',  onOut);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup',   onUp);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout',  onOut);
    };
  }, []);
}

// ── Chaos Feed ticker ──
const CHAOS_ITEMS = [
  { player: 'PANIKOVA',  msg: 'Arrived at training wearing sunglasses. Indoors. At night.', color: '#E4002B' },
  { player: 'GYMSKIN',   msg: 'Coffee refused. Thermometer reading: 94.8°. Session delayed 11 minutes.', color: '#9b5de5' },
  { player: 'RICCIARDO', msg: 'Attempted a cross. The ball went backwards. Investigation ongoing.', color: '#00c8ff' },
  { player: 'RFK JR',    msg: 'Brought unidentified smoothie to training. Team physio taking notes.', color: '#e9c46a' },
  { player: 'RUBIO',     msg: 'Fourth water break requested. Performance imminent.', color: '#f4a261' },
  { player: 'DONNY P',   msg: '"That shot was on target actually." GPS confirms it was not.', color: '#e9c46a' },
  { player: 'KARAVAVOV', msg: 'Attempted no-look pass. Lost possession. Declared it intentional.', color: '#f4a261' },
  { player: 'DIAKITE',   msg: 'Spotted in a car park near the stadium. DO NOT APPROACH.', color: '#E4002B' },
  { player: 'HEGSETH',   msg: 'Providing live commentary on his own performance. 89th minute. Again.', color: '#e63946' },
  { player: 'NOEM',      msg: 'Yellow card. No apology issued. Club statement: "We support this."', color: '#9b5de5' },
  { player: 'PANIKOVA',  msg: 'Claims he saw signs in a fern again. Tactical formation. We checked. It was a fern.', color: '#E4002B' },
  { player: 'GYMSKIN',   msg: 'Aura Pulse activated. Coffee at exactly 95°. Team immediately 34% better.', color: '#9b5de5' },
];

const ChaosTicker: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const doubled = [...CHAOS_ITEMS, ...CHAOS_ITEMS];
  return (
    <div className="sbc-ticker-wrap" style={{
      background: '#030810', borderBottom: `1px solid ${accentColor}33`,
      display: 'flex', alignItems: 'stretch', overflow: 'hidden', height: 36,
    }}>
      <div style={{
        background: accentColor, display: 'flex', alignItems: 'center',
        padding: '0 16px', flexShrink: 0, gap: 6, zIndex: 1,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse-ring 1.5s infinite' }} />
        <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, color: '#fff', letterSpacing: '0.18em', whiteSpace: 'nowrap' }}>CHAOS FEED</span>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', animation: 'ticker 55s linear infinite', whiteSpace: 'nowrap' }}>
          {doubled.map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 28px 0 0' }}>
              <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, color: item.color, letterSpacing: '0.1em' }}>{item.player}</span>
              <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: accentColor, fontWeight: 700, letterSpacing: '0.04em' }}>{item.msg}</span>
              <span style={{ color: `${accentColor}44`, fontSize: 8, marginLeft: 8 }}>◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

type Tweaks = typeof TWEAK_DEFAULTS;

function loadTweaks(): Tweaks {
  try {
    const raw = localStorage.getItem(TWEAKS_STORAGE_KEY);
    if (!raw) return TWEAK_DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      accentColor:    typeof parsed.accentColor === 'string'   ? parsed.accentColor   : TWEAK_DEFAULTS.accentColor,
      glowIntensity:  typeof parsed.glowIntensity === 'number' ? parsed.glowIntensity : TWEAK_DEFAULTS.glowIntensity,
      theme:          parsed.theme === 'light' ? 'light' : 'dark',
    };
  } catch {
    return TWEAK_DEFAULTS;
  }
}

const App: React.FC = () => {
  // mode === 'landing' shows the splash; 'site' shows the main app.
  // Default to landing on every fresh load — the user wants visitors to
  // see the splash first each time.
  const [mode, setMode]                     = React.useState<'landing' | 'site'>('landing');
  const [page, setPage]                     = React.useState('home');
  const [selectedPlayer, setSelectedPlayer] = React.useState<any>(null);
  const [tweaksOpen, setTweaksOpen]         = React.useState(false);
  const [tweaks, setTweaks]                 = React.useState<Tweaks>(() => loadTweaks());
  const [bgIdx, setBgIdx]                   = React.useState(0);
  const [pageKey, setPageKey]               = React.useState(0);

  useCustomCursor();
  usePageHeaderRotator();

  // ── Auth-driven Tweaks sync ──────────────────────────────────────
  // - When the user logs in and their profile carries saved tweaks,
  //   apply those (overriding whatever was in localStorage). This is
  //   how a user's accent / theme / glow follow them between devices.
  // - When the user updates a tweak while logged in, push the new
  //   value back to their profile (debounced so we don't spam writes
  //   on every slider tick).
  const auth = useAuth();
  const lastSavedRef = React.useRef<string | null>(null);
  const appliedFromServerRef = React.useRef<string | null>(null);

  // On profile load: if tweaks are stored on the server, apply them locally.
  React.useEffect(() => {
    if (!auth.profile?.tweaks) return;
    const serverJson = JSON.stringify(auth.profile.tweaks);
    if (serverJson === appliedFromServerRef.current) return;
    appliedFromServerRef.current = serverJson;
    lastSavedRef.current = serverJson;
    const parsed = auth.profile.tweaks as Partial<Tweaks>;
    setTweaks((current) => ({
      accentColor:    typeof parsed.accentColor   === 'string' ? parsed.accentColor   : current.accentColor,
      glowIntensity:  typeof parsed.glowIntensity === 'number' ? parsed.glowIntensity : current.glowIntensity,
      theme:          parsed.theme === 'light' ? 'light' : parsed.theme === 'dark' ? 'dark' : current.theme,
    }));
  }, [auth.profile?.tweaks]);

  // On every tweak change (while logged in): debounce-save to profile.
  React.useEffect(() => {
    if (!auth.user) return;
    const json = JSON.stringify(tweaks);
    if (json === lastSavedRef.current) return;
    const t = window.setTimeout(() => {
      lastSavedRef.current = json;
      auth.saveTweaks(tweaks);
    }, 600);
    return () => window.clearTimeout(t);
  }, [tweaks, auth]);

  // Apply CSS variables + body bg whenever tweaks change; persist to localStorage.
  React.useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--accent', tweaks.accentColor);
    const a = Math.max(0, Math.min(100, tweaks.glowIntensity)) / 100;
    const hex = tweaks.accentColor.replace('#', '');
    const rr = parseInt(hex.substring(0, 2), 16);
    const gg = parseInt(hex.substring(2, 4), 16);
    const bb = parseInt(hex.substring(4, 6), 16);
    r.style.setProperty('--glow',        `rgba(${rr},${gg},${bb},${(a * 0.6).toFixed(2)})`);
    r.style.setProperty('--glow-strong', `rgba(${rr},${gg},${bb},${a.toFixed(2)})`);
    r.style.setProperty('--glow-alpha',  a.toFixed(2));
    const bg = THEME_COLORS[tweaks.theme] ?? THEME_COLORS.dark;
    r.style.setProperty('--bg', bg);
    document.body.style.background = bg;
    if (tweaks.theme === 'light') r.classList.add('theme-light');
    else r.classList.remove('theme-light');
    const cur = document.getElementById('site-cursor');
    if (cur) cur.style.background = tweaks.accentColor;

    try { localStorage.setItem(TWEAKS_STORAGE_KEY, JSON.stringify(tweaks)); } catch { /* storage may be disabled */ }
  }, [tweaks]);

  const setTweak = <K extends keyof Tweaks>(k: K, v: Tweaks[K]) => {
    setTweaks(t => ({ ...t, [k]: v }));
  };

  const navigateTo = (p: string) => {
    setPageKey(k => k + 1);
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const acc = tweaks.accentColor;
  const bgColor = THEME_COLORS[tweaks.theme] ?? THEME_COLORS.dark;
  const activeBgList = tweaks.theme === 'light' ? BG_IMAGES_LIGHT : BG_IMAGES;

  const pageComponents: Record<string, React.ReactNode> = {
    home:      <HomePage      setPage={navigateTo} setSelectedPlayer={setSelectedPlayer} tweaks={tweaks} />,
    squad:     <SquadPage     setSelectedPlayer={setSelectedPlayer} tweaks={tweaks} />,
    stats:     <StatsPage     setSelectedPlayer={setSelectedPlayer} tweaks={tweaks} />,
    fixtures:  <FixturesPage  tweaks={tweaks} />,
    news:      <NewsPage      tweaks={tweaks} />,
    transfers: <TransfersPage tweaks={tweaks} />,
    league:    <LeaguePage    tweaks={tweaks} />,
    store:     <StorePage     tweaks={tweaks} />,
    basket:    <BasketPage    setPage={navigateTo} tweaks={tweaks} />,
    account:   <AccountPage   setPage={navigateTo} tweaks={tweaks} />,
  };

  // ── Landing splash gate ──
  // While in landing mode, render only the splash. The main site mounts
  // after the user clicks EMBRACE SADNESS (or hits the EXIT link later).
  if (mode === 'landing') {
    return <Landing onEnter={() => setMode('site')} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: bgColor, position: 'relative' }}>
      {/* Global background */}
      <div className={`sbc-globalbg ${page === 'home' ? '' : 'sbc-globalbg-subpage'}`}
           style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}>
        {activeBgList.map((img, i) => (
          <div key={img} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url("${img}")`,
            backgroundSize: 'cover', backgroundPosition: 'center center', backgroundRepeat: 'no-repeat',
            opacity: i === bgIdx ? 0.55 : 0,
            transition: 'opacity 2.5s ease',
          }} />
        ))}
        <div className="sbc-bg-tint" style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${bgColor}55 0%, ${bgColor}77 60%, ${bgColor}99 100%)` }} />
        {page === 'home' && (
          <div className="sbc-home-sheen" style={{
            position: 'absolute', inset: 0,
            background: tweaks.theme === 'light'
              ? 'linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.2) 100%)'
              : 'linear-gradient(90deg, rgba(3,8,16,0.85) 0%, rgba(3,8,16,0.55) 50%, rgba(3,8,16,0.25) 100%)',
          }} />
        )}
      </div>

      {/* Fixed header: Chaos Feed + Nav (with EXIT link to return to landing) */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1001, display: 'flex', flexDirection: 'column' }}>
        <ChaosTicker accentColor={acc} />
        <div style={{ position: 'relative' }}>
          <NavBar page={page} setPage={navigateTo} accentColor={acc} />
          <button
            type="button"
            onClick={() => setMode('landing')}
            title="Return to landing page"
            style={{
              position: 'absolute', right: 168, top: '50%', transform: 'translateY(-50%)',
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'none',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 12,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'rgba(220,230,255,0.55)', transition: 'color 0.2s', zIndex: 2,
              padding: '8px 12px',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = acc; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(220,230,255,0.55)'; }}
          >
            <span style={{ fontSize: 14 }}>←</span><span>EXIT</span>
          </button>
        </div>
      </div>

      {/* Page content */}
      <div key={pageKey} className="page-enter" style={{ position: 'relative', zIndex: 1, paddingBottom: 0 }}>
        {pageComponents[page] ?? pageComponents.home}
      </div>

      {/* Profile modal */}
      {selectedPlayer && (
        <PlayerProfileModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}

      {/* Tweaks toggle button */}
      {!tweaksOpen && (
        <button onClick={() => setTweaksOpen(true)} style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2999,
          background: 'rgba(4,10,22,0.95)', border: `1px solid ${acc}66`,
          borderRadius: '50%', width: 52, height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${acc}22`,
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = acc; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 32px ${acc}88`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${acc}66`; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${acc}22`; }}
          title="Customise theme">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={acc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      )}

      {/* Tweaks panel */}
      <div id="tweaks-panel" className={tweaksOpen ? 'open' : ''}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: acc, letterSpacing: '0.15em' }}>TWEAKS</span>
          <button onClick={() => setTweaksOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(218,218,218,0.4)', fontSize: 16, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>Accent Colour</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['#E4002B','#9b5de5','#00c8ff','#2a9d8f','#e9c46a','#f4a261'].map(c => (
            <div key={c} onClick={() => setTweak('accentColor', c)} style={{
              width: 28, height: 28, borderRadius: '50%', background: c, flexShrink: 0,
              border: acc === c ? '3px solid #fff' : '3px solid transparent',
              boxShadow: acc === c ? `0 0 12px ${c}` : 'none',
              transition: 'all 0.15s', cursor: 'none',
            }} />
          ))}
        </div>

        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.4)', margin: '14px 0 8px', textTransform: 'uppercase' }}>Glow Intensity</div>
        <input type="range" min="0" max="100" value={tweaks.glowIntensity}
               onChange={e => setTweak('glowIntensity', +e.target.value)}
               style={{ width: '100%', accentColor: acc }} />
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, color: acc, textAlign: 'right', marginTop: 2 }}>{tweaks.glowIntensity}%</div>

        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.4)', margin: '14px 0 8px', textTransform: 'uppercase' }}>Theme</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['dark','light'] as const).map(val => (
            <button key={val} onClick={() => setTweak('theme', val)} style={{
              flex: 1, padding: '7px 0',
              background: tweaks.theme === val ? acc : 'rgba(255,255,255,0.05)',
              border: `1px solid ${tweaks.theme === val ? acc : 'rgba(255,255,255,0.1)'}`,
              color: tweaks.theme === val ? '#fff' : 'rgba(218,218,218,0.4)',
              fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 10,
              letterSpacing: '0.1em', borderRadius: 3, transition: 'all 0.15s',
            }}>{val.toUpperCase()}</button>
          ))}
        </div>

        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(218,218,218,0.4)', margin: '14px 0 8px', textTransform: 'uppercase' }}>Background</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {activeBgList.map((img, i) => (
            <div key={i} onClick={() => setBgIdx(i)} style={{
              flex: 1, height: 48, borderRadius: 4, overflow: 'hidden',
              border: bgIdx === i ? `2px solid ${acc}` : '2px solid rgba(255,255,255,0.08)',
              backgroundImage: `url("${img}")`, backgroundSize: 'cover', backgroundPosition: 'center',
              cursor: 'none', transition: 'border-color 0.2s',
              boxShadow: bgIdx === i ? `0 0 12px ${acc}66` : 'none',
            }} />
          ))}
        </div>

        <div style={{ marginTop: 18, paddingTop: 12, borderTop: `1px solid ${acc}22`, fontFamily: 'Roboto, sans-serif', fontSize: 9, color: 'rgba(218,218,218,0.2)', textAlign: 'center', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Nanna Tate · Potato Perfection
        </div>
      </div>

    </div>
  );
};

export default App;
