// ============================================================
// SBCFC Landing splash
// React port of prototype-original/landing.html. Visuals match the
// original (animated entry, rain canvas, lightning-line canvas,
// stat counters, parallax, glitch transition out).
// ============================================================
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

interface LandingProps {
  onEnter: () => void;
}

const RAIN_CHARS = '⚜SBCFC25/26CHAOSCLIQUENANNATATEPOWERGLORY'.split('');

const Landing: React.FC<LandingProps> = ({ onEnter }) => {
  const rainRef       = React.useRef<HTMLCanvasElement>(null);
  const linesRef      = React.useRef<HTMLCanvasElement>(null);
  const bgImageRef    = React.useRef<HTMLDivElement>(null);
  const bgFleurRef    = React.useRef<HTMLDivElement>(null);
  const contentRef    = React.useRef<HTMLDivElement>(null);
  const overlayRef    = React.useRef<HTMLDivElement>(null);
  const titleRef      = React.useRef<HTMLDivElement>(null);

  // Visibility flags drive the staged entry animation (CSS classes).
  const [show, setShow] = React.useState({
    badge:    false,
    eyebrow:  false,
    line1:    false,
    line2:    false,
    subtitle: false,
    cta:      false,
    tagline:  false,
    stats:    false,
    hlines:   false,
    bg:       false,
  });

  // Animated stat counter values.
  const [stats, setStats] = React.useState({ s1: 0, s2: 0, s3: 0, s4: 0 });

  // Track mounted state so timers don't update after unmount.
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;

    // ── Entry animation sequence (mirrors the prototype's setTimeouts) ──
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => mountedRef.current && setShow(s => ({ ...s, bg: true })), 200));
    timers.push(setTimeout(() => mountedRef.current && setShow(s => ({ ...s, badge: true })), 600));
    timers.push(setTimeout(() => mountedRef.current && setShow(s => ({ ...s, eyebrow: true })), 1000));
    timers.push(setTimeout(() => mountedRef.current && setShow(s => ({ ...s, line1: true })), 1300));
    timers.push(setTimeout(() => mountedRef.current && setShow(s => ({ ...s, line2: true })), 1500));
    timers.push(setTimeout(() => mountedRef.current && setShow(s => ({ ...s, subtitle: true, hlines: true })), 1800));
    timers.push(setTimeout(() => mountedRef.current && setShow(s => ({ ...s, cta: true })), 2200));
    timers.push(setTimeout(() => mountedRef.current && setShow(s => ({ ...s, tagline: true })), 2600));
    timers.push(setTimeout(() => mountedRef.current && setShow(s => ({ ...s, stats: true })), 2800));

    // ── Stat counter animation (kicks in with stats reveal) ──
    const targets = { s1: 89, s2: 126, s3: 64, s4: 13 };
    const start = performance.now() + 2800;
    let rafTick = 0;
    const tick = (now: number) => {
      if (!mountedRef.current) return;
      const p = Math.min(Math.max((now - start) / 2000, 0), 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setStats({
        s1: Math.round(targets.s1 * ease),
        s2: Math.round(targets.s2 * ease),
        s3: Math.round(targets.s3 * ease),
        s4: Math.round(targets.s4 * ease),
      });
      if (p < 1) rafTick = requestAnimationFrame(tick);
    };
    rafTick = requestAnimationFrame(tick);

    // ── Rain canvas ──
    const rainCanvas = rainRef.current!;
    const rctx = rainCanvas.getContext('2d')!;
    let drops: number[] = [];
    const initRain = () => {
      rainCanvas.width  = window.innerWidth;
      rainCanvas.height = window.innerHeight;
      const cols = Math.floor(window.innerWidth / 22);
      drops = Array.from({ length: cols }, () => Math.random() * -100);
    };
    initRain();
    const drawRain = () => {
      rctx.fillStyle = 'rgba(3,8,16,0.05)';
      rctx.fillRect(0, 0, rainCanvas.width, rainCanvas.height);
      rctx.font = '14px "Roboto"';
      drops.forEach((y, i) => {
        const ch = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
        const alpha = Math.random() > 0.97 ? 0.8 : 0.18;
        rctx.fillStyle = Math.random() > 0.95 ? 'rgba(228,0,43,0.9)' : `rgba(228,0,43,${alpha})`;
        rctx.fillText(ch, i * 22, y * 20);
        drops[i] = y > rainCanvas.height / 20 && Math.random() > 0.975 ? 0 : y + 0.4;
      });
    };
    const rainInterval = window.setInterval(drawRain, 50);

    // ── Lightning-lines canvas ──
    const linesCanvas = linesRef.current!;
    const lctx = linesCanvas.getContext('2d')!;
    linesCanvas.width = window.innerWidth;
    linesCanvas.height = window.innerHeight;
    let lineParticles: { x: number; y: number; speed: number; alpha: number; width: number }[] = [];
    const drawLines = () => {
      lctx.clearRect(0, 0, linesCanvas.width, linesCanvas.height);
      if (Math.random() > 0.94) {
        const x = Math.random() * window.innerWidth;
        lineParticles.push({ x, y: 0, speed: 2 + Math.random() * 4, alpha: 0.15 + Math.random() * 0.2, width: 0.5 + Math.random() });
      }
      lineParticles = lineParticles.filter(p => p.y < linesCanvas.height && p.alpha > 0);
      lineParticles.forEach(p => {
        lctx.beginPath();
        lctx.moveTo(p.x, p.y);
        lctx.lineTo(p.x, p.y + 60);
        lctx.strokeStyle = `rgba(228,0,43,${p.alpha})`;
        lctx.lineWidth = p.width;
        lctx.stroke();
        p.y += p.speed;
        p.alpha -= 0.001;
      });
    };
    const linesInterval = window.setInterval(drawLines, 16);

    // ── Resize handler ──
    const onResize = () => {
      initRain();
      linesCanvas.width = window.innerWidth;
      linesCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // ── Parallax on mouse move ──
    const onMouseMove = (e: MouseEvent) => {
      const cx = (e.clientX / window.innerWidth  - 0.5) * 20;
      const cy = (e.clientY / window.innerHeight - 0.5) * 10;
      if (bgImageRef.current) bgImageRef.current.style.transform = `translate(${cx * 0.5}px, ${cy * 0.5}px) scale(1.05)`;
      if (contentRef.current) contentRef.current.style.transform = `translate(${cx * -0.3}px, ${cy * -0.3}px)`;
    };
    document.addEventListener('mousemove', onMouseMove);

    // ── Body overflow lock for fullscreen splash ──
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      mountedRef.current = false;
      timers.forEach(t => clearTimeout(t));
      cancelAnimationFrame(rafTick);
      clearInterval(rainInterval);
      clearInterval(linesInterval);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousemove', onMouseMove);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // ── Glitchy exit transition, then signal "user has entered" to App ──
  const triggerEnter = React.useCallback(() => {
    const overlay = overlayRef.current;
    const title   = titleRef.current;
    if (overlay) overlay.classList.add('sbc-landing-panel-enter');
    if (title)   title.style.animation = 'sbc-landing-glitch 0.3s forwards';
    setTimeout(onEnter, 850);
  }, [onEnter]);

  // ── Keyboard: Enter or Space to advance ──
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') triggerEnter();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [triggerEnter]);

  return (
    <div className="sbc-landing-root">
      {/* Local-scope CSS — keeps the landing's particular animations and cursor adjustments isolated. */}
      <style>{LANDING_STYLES}</style>

      <canvas ref={rainRef}  className="sbc-landing-rain" />
      <canvas ref={linesRef} className="sbc-landing-lines" />

      <div className="sbc-landing-stage">
        <div ref={bgImageRef} className={`sbc-landing-bg-image ${show.bg ? 'visible' : ''}`} />
        <div className="sbc-landing-bg-overlay" />
        <div ref={bgFleurRef} className={`sbc-landing-bg-fleur ${show.bg ? 'visible' : ''}`} />

        <div className={`sbc-landing-hline ${show.hlines ? 'visible' : ''}`} style={{ top: '18%' }} />
        <div className={`sbc-landing-hline ${show.hlines ? 'visible' : ''}`} style={{ bottom: '18%' }} />

        <div className="sbc-landing-scanlines" />

        <div ref={contentRef} className="sbc-landing-content visible">
          <div className={`sbc-landing-badge ${show.badge ? 'visible' : ''}`}>
            <img src="/uploads/pasted-1777404204917-0.png" alt="SBCFC" />
          </div>
          <div className={`sbc-landing-eyebrow ${show.eyebrow ? 'visible' : ''}`}>
            Est. 2024 · Lincoln, England · EA Sports FC 26
          </div>
          <div ref={titleRef} className="sbc-landing-title">
            <span className={`sbc-landing-title-line ${show.line1 ? 'visible' : ''}`}><span>SAD BOI</span></span>
            <span className={`sbc-landing-title-line ${show.line2 ? 'visible' : ''}`}><span>CLIQUE FC</span></span>
          </div>
          <div className={`sbc-landing-subtitle ${show.subtitle ? 'visible' : ''}`}>Chaos. Clique. Culture.</div>

          <div className={`sbc-landing-cta-wrap ${show.cta ? 'visible' : ''}`}>
            <button className="sbc-landing-cta" onClick={triggerEnter}>
              <div className="sbc-landing-cta-inner">
                <span className="sbc-landing-cta-text">EMBRACE SADNESS</span>
                <span className="sbc-landing-cta-arrow">→</span>
              </div>
            </button>
          </div>

          <div className={`sbc-landing-tagline ${show.tagline ? 'visible' : ''}`}>
            "We're not here to fit in. We're here to win."
          </div>
        </div>
      </div>

      <div className={`sbc-landing-stats ${show.stats ? 'visible' : ''}`}>
        <div className="sbc-landing-stat"><div className="sbc-landing-stat-val">{stats.s1}</div><div className="sbc-landing-stat-lbl">Goals This Season</div></div>
        <div className="sbc-landing-stat"><div className="sbc-landing-stat-val">{stats.s2}</div><div className="sbc-landing-stat-lbl">Assists</div></div>
        <div className="sbc-landing-stat"><div className="sbc-landing-stat-val">{stats.s3}%</div><div className="sbc-landing-stat-lbl">Win Rate</div></div>
        <div className="sbc-landing-stat"><div className="sbc-landing-stat-val">{stats.s4}</div><div className="sbc-landing-stat-lbl">Squad Players</div></div>
        <div className="sbc-landing-stat"><div className="sbc-landing-stat-val">2ND</div><div className="sbc-landing-stat-lbl">League Position</div></div>
      </div>

      <div ref={overlayRef} className="sbc-landing-transition-overlay" />
    </div>
  );
};

const LANDING_STYLES = `
.sbc-landing-root { position: fixed; inset: 0; background: #000; overflow: hidden; z-index: 5000; }

.sbc-landing-rain  { position: absolute; inset: 0; opacity: 0.12; }
.sbc-landing-lines { position: absolute; inset: 0; pointer-events: none; }

.sbc-landing-stage { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }

.sbc-landing-bg-image {
  position: absolute; inset: 0;
  background-image: url('/uploads/Sad Boi Clique Widescreen.png');
  background-size: contain; background-position: center center; background-repeat: no-repeat;
  background-color: #030810;
  opacity: 0; transition: opacity 2s ease, transform 0.2s ease-out;
  filter: saturate(0.7);
}
/* On portrait / mobile-sized viewports the widescreen splash crops badly,
   so swap to the dedicated mobile splash. Threshold matches the rest of
   the site's mobile breakpoint (820px). */
@media (max-width: 820px) {
  .sbc-landing-bg-image {
    background-image: url('/uploads/Sad Boi Clique Mobile Splash.png');
    background-size: cover;
  }
}
.sbc-landing-bg-image.visible { opacity: 1; }

.sbc-landing-bg-overlay {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 120% 100% at 50% 60%, rgba(3,8,16,0.5) 0%, rgba(3,8,16,0.92) 70%, #030810 100%);
}
.sbc-landing-bg-fleur {
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ctext x='40' y='56' text-anchor='middle' font-size='44' fill='rgba(255,255,255,0.025)'%3E⚜%3C/text%3E%3C/svg%3E");
  opacity: 0; transition: opacity 1.5s ease 0.5s;
}
.sbc-landing-bg-fleur.visible { opacity: 1; }

.sbc-landing-hline {
  position: absolute; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(228,0,43,0.3), transparent);
  opacity: 0; transition: opacity 1s ease;
}
.sbc-landing-hline.visible { opacity: 1; }

.sbc-landing-scanlines {
  position: absolute; inset: 0; z-index: 5; pointer-events: none;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
}

.sbc-landing-content {
  position: relative; z-index: 10;
  text-align: center; padding: 40px;
  opacity: 0; transform: translateY(30px);
  transition: opacity 1s ease, transform 1s ease;
}
.sbc-landing-content.visible { opacity: 1; transform: translateY(0); }

.sbc-landing-badge {
  width: 120px; height: 120px; margin: 0 auto 28px;
  border-radius: 50%; overflow: hidden;
  border: 2px solid rgba(228,0,43,0.4);
  box-shadow: 0 0 60px rgba(228,0,43,0.3);
  opacity: 0; transform: scale(0.6);
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.2,0,0,1);
  background: #0a1020;
}
.sbc-landing-badge.visible { opacity: 1; transform: scale(1); }
.sbc-landing-badge img { width: 100%; height: 100%; object-fit: cover; }

.sbc-landing-eyebrow {
  font-family: 'Roboto', sans-serif; font-weight: 700;
  font-size: 11px; letter-spacing: 0.3em; color: #E4002B;
  text-transform: uppercase; margin-bottom: 18px;
  opacity: 0; transform: translateY(10px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.sbc-landing-eyebrow.visible { opacity: 1; transform: translateY(0); }

.sbc-landing-title {
  font-family: 'Anton', sans-serif;
  font-size: clamp(52px, 9vw, 120px);
  color: #fff; line-height: 0.88;
  text-transform: uppercase; letter-spacing: -0.01em;
  text-shadow: 0 0 80px rgba(228,0,43,0.2);
  margin-bottom: 8px;
  overflow: hidden;
  animation: sbc-landing-flicker 8s infinite 3s;
}
.sbc-landing-title-line { display: block; overflow: hidden; }
.sbc-landing-title-line span {
  display: block; transform: translateY(110%);
  transition: transform 0.8s cubic-bezier(0.16,1,0.3,1);
}
.sbc-landing-title-line.visible span { transform: translateY(0); }

.sbc-landing-subtitle {
  font-family: 'Anton', sans-serif;
  font-size: clamp(18px, 3vw, 38px);
  color: #E4002B; letter-spacing: 0.08em;
  text-transform: uppercase; margin-bottom: 48px;
  opacity: 0; transform: translateY(10px);
  transition: opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s;
}
.sbc-landing-subtitle.visible { opacity: 1; transform: translateY(0); }

.sbc-landing-cta-wrap {
  opacity: 0; transform: translateY(16px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.sbc-landing-cta-wrap.visible { opacity: 1; transform: translateY(0); }

.sbc-landing-cta {
  position: relative; display: inline-block;
  font-family: 'Anton', sans-serif; font-size: 18px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: #fff; background: none; border: none;
  cursor: none; padding: 0; overflow: hidden;
}
.sbc-landing-cta-inner {
  display: flex; align-items: center; gap: 16px; padding: 18px 44px;
  border: 1px solid rgba(228,0,43,0.5);
  position: relative; overflow: hidden;
  transition: border-color 0.3s;
}
.sbc-landing-cta-inner::before {
  content: ''; position: absolute; inset: 0;
  background: #E4002B;
  transform: scaleX(0); transform-origin: left;
  transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
}
.sbc-landing-cta:hover .sbc-landing-cta-inner { border-color: #E4002B; }
.sbc-landing-cta:hover .sbc-landing-cta-inner::before { transform: scaleX(1); }
.sbc-landing-cta-text  { position: relative; z-index: 1; }
.sbc-landing-cta-arrow { position: relative; z-index: 1; font-size: 22px; transition: transform 0.3s; }
.sbc-landing-cta:hover .sbc-landing-cta-arrow { transform: translateX(8px); }

.sbc-landing-tagline {
  margin-top: 40px; font-family: 'Roboto', sans-serif;
  font-weight: 300; font-size: 13px; font-style: italic;
  color: rgba(218,218,218,0.35); letter-spacing: 0.08em;
  opacity: 0; transition: opacity 1s ease;
}
.sbc-landing-tagline.visible { opacity: 1; }

.sbc-landing-stats {
  position: absolute; bottom: 0; left: 0; right: 0; z-index: 20;
  display: flex; border-top: 1px solid rgba(228,0,43,0.15);
  background: rgba(3,8,16,0.9); backdrop-filter: blur(20px);
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.sbc-landing-stats.visible { opacity: 1; transform: translateY(0); }
.sbc-landing-stat { flex: 1; padding: 14px 0; text-align: center; border-right: 1px solid rgba(228,0,43,0.1); }
.sbc-landing-stat:last-child { border-right: none; }
.sbc-landing-stat-val { font-family: 'Anton', sans-serif; font-size: 28px; color: #E4002B; line-height: 1; }
.sbc-landing-stat-lbl { font-family: 'Roboto', sans-serif; font-size: 8px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(218,218,218,0.35); margin-top: 3px; }

.sbc-landing-transition-overlay {
  position: absolute; inset: 0; z-index: 1000;
  background: #E4002B;
  transform: scaleY(0); transform-origin: top;
  pointer-events: none;
}
.sbc-landing-panel-enter { animation: sbc-landing-panel-enter 0.9s cubic-bezier(0.76,0,0.24,1) forwards; }

@keyframes sbc-landing-flicker {
  0%,94%,100% { opacity:1; }
  95% { opacity:0.3; }
  96% { opacity:0.9; }
  97% { opacity:0.2; }
  98% { opacity:1; }
}
@keyframes sbc-landing-glitch {
  0%,96%,100% { transform: none; clip-path: none; }
  97% { transform: translate(-3px,1px); color: #E4002B; }
  98% { transform: translate(3px,-1px); }
  99% { transform: translate(-1px,2px); color: #00c8ff; }
}
@keyframes sbc-landing-panel-enter {
  0%   { transform: scaleY(0); transform-origin: bottom; }
  50%  { transform: scaleY(1); transform-origin: bottom; }
  50.01% { transform-origin: top; }
  100% { transform: scaleY(0); transform-origin: top; }
}
`;

export default Landing;
