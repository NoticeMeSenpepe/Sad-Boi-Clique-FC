
// ============================================================
// SBCFC PAGE COMPONENTS
// ============================================================
// Note: window refs are resolved lazily at render time, not at parse time

const getRefs = () => ({
  PLAYERS: window.PLAYERS,
  NEWS_ITEMS: window.NEWS_ITEMS,
  FIXTURES: window.FIXTURES,
  LEAGUE_TABLE: window.LEAGUE_TABLE,
  NavBar: window.NavBar,
  BreakingTicker: window.BreakingTicker,
  StatBar: window.StatBar,
  RainbowBar: window.RainbowBar,
  TagChip: window.TagChip,
});

// Inline RARITY_CONFIGS to avoid cross-script timing issue
const RARITY_CONFIGS = {
  icon:   { bg: 'linear-gradient(145deg, #1a0a00, #3d1a00)', border: '#e6a817', glow: 'rgba(230,168,23,0.5)', label: 'ICON' },
  legend: { bg: 'linear-gradient(145deg, #0d0020, #1e0040)', border: '#9b5de5', glow: 'rgba(155,93,229,0.5)', label: 'LEGEND' },
  rare:   { bg: 'linear-gradient(145deg, #000a1e, #001840)', border: '#4361ee', glow: 'rgba(67,97,238,0.4)', label: 'RARE' },
  common: { bg: 'linear-gradient(145deg, #070d18, #0d1626)', border: 'rgba(80,110,160,0.5)', glow: 'rgba(80,110,160,0.2)', label: '' },
};

const getP  = () => window.getP() || [];
const getN  = () => window.NEWS_ITEMS || [] || [];
const getF  = () => window.FIXTURES || [] || [];
const getL  = () => window.LEAGUE_TABLE || [] || [];
const RainbowBar = (props) => React.createElement(window.RainbowBar || 'div', props);
const StatBar    = (props) => React.createElement(window.StatBar    || 'div', props);
const TagChip    = (props) => React.createElement(window.TagChip    || 'span', props);

// ── Player Profile Modal ────────────────────────────────────────
const PlayerProfileModal = ({ player, onClose }) => {
  const [tab, setTab] = React.useState('overview');
  const [panicLevel, setPanicLevel] = React.useState(42);
  const [riskLevel, setRiskLevel] = React.useState(50);
  const [perfLevel, setPerfLevel] = React.useState(60);
  const [auraAngle, setAuraAngle] = React.useState(0);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);

  React.useEffect(() => {
    if (player.id === 'panikova') {
      const iv = setInterval(() => setPanicLevel(v => Math.max(15, Math.min(95, v + (Math.random()-0.4)*18))), 1200);
      return () => clearInterval(iv);
    }
    if (player.id === 'karavavov') {
      const iv = setInterval(() => setRiskLevel(v => Math.max(5, Math.min(98, v + (Math.random()-0.5)*30))), 900);
      return () => clearInterval(iv);
    }
    if (player.id === 'ricciardo') {
      const iv = setInterval(() => setPerfLevel(v => Math.max(5, Math.min(98, v + (Math.random()-0.5)*35))), 1400);
      return () => clearInterval(iv);
    }
    if (player.id === 'gymskin') {
      const iv = setInterval(() => setAuraAngle(a => (a + 2) % 360), 20);
      return () => clearInterval(iv);
    }
  }, [player.id]);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 300); };
  const statKeys = player.position === 'GK' ? ['DIV','HAN','KIC','REF','SPD','POS'] : ['PAC','SHO','PAS','DRI','DEF','PHY'];
  const statColors = { PAC:'#f4a261', SHO:'#E4002B', PAS:'#4361ee', DRI:'#9b5de5', DEF:'#2a9d8f', PHY:'#e9c46a', DIV:'#00c8ff', HAN:'#4361ee', KIC:'#f4a261', REF:'#9b5de5', SPD:'#E4002B', POS:'#2a9d8f' };
  const getPanicColor = (v) => v < 30 ? '#2a9d8f' : v < 60 ? '#e9c46a' : '#E4002B';

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.88)', backdropFilter:'blur(10px)', opacity: visible?1:0, transition:'opacity 0.3s' }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div style={{ width:'94vw', maxWidth:940, maxHeight:'90vh', overflowY:'auto', background:'#080f1e', border:`1px solid ${player.accentColor}44`, borderRadius:12, position:'relative', boxShadow:`0 0 80px ${player.glowColor}, 0 40px 80px rgba(0,0,0,0.85)`, transform: visible?'scale(1) translateY(0)':'scale(0.95) translateY(20px)', transition:'all 0.35s cubic-bezier(0.2,0,0,1)' }}>

        {/* IMAGE HEADER */}
        {player.image ? (
          <div style={{ position:'relative', height:340, overflow:'hidden', borderRadius:'12px 12px 0 0' }}>
            <img src={player.image} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top center' }} alt={player.name} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg, #080f1e 0%, rgba(8,15,30,0.6) 40%, rgba(8,15,30,0.1) 100%)' }} />
            <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg, ${player.accentColor}22, transparent 60%)` }} />
            {/* Close */}
            <button onClick={handleClose} style={{ position:'absolute', top:16, right:16, background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(218,218,218,0.7)', borderRadius:6, cursor:'pointer', padding:'6px 14px', fontFamily:'Roboto, sans-serif', fontWeight:700, fontSize:11, letterSpacing:'0.1em', backdropFilter:'blur(8px)' }}>✕ CLOSE</button>
            {/* Rating badge */}
            <div style={{ position:'absolute', top:16, left:16, background:'rgba(8,15,30,0.85)', border:`2px solid ${player.accentColor}`, borderRadius:8, padding:'8px 14px', backdropFilter:'blur(12px)', textAlign:'center' }}>
              <div style={{ fontFamily:'Anton, sans-serif', fontSize:32, color:player.accentColor, lineHeight:1 }}>{player.rating}</div>
              <div style={{ fontFamily:'Roboto, sans-serif', fontSize:9, fontWeight:700, letterSpacing:'0.15em', color:'rgba(218,218,218,0.6)', textTransform:'uppercase' }}>{player.position}</div>
            </div>
            {/* Player name overlay */}
            <div style={{ position:'absolute', bottom:20, left:28, right:28 }}>
              <div style={{ fontFamily:'Roboto, sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.25em', color:player.accentColor, marginBottom:4, textTransform:'uppercase' }}>#{player.number} · {player.archetype}</div>
              <div style={{ fontFamily:'Anton, sans-serif', fontSize:42, color:'#fff', lineHeight:0.9, textTransform:'uppercase', textShadow:'0 4px 20px rgba(0,0,0,0.8)' }}>{player.name}</div>
              <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                {player.tags.slice(0,3).map((t,i) => <span key={i} style={{ fontFamily:'Roboto, sans-serif', fontSize:9, fontWeight:700, letterSpacing:'0.1em', color:player.accentColor, background:`${player.accentColor}22`, padding:'3px 8px', borderRadius:3, border:`1px solid ${player.accentColor}33`, textTransform:'uppercase' }}>{t}</span>)}
              </div>
            </div>
          </div>
        ) : (
          /* No image: gradient header */
          <div style={{ position:'relative', height:200, overflow:'hidden', borderRadius:'12px 12px 0 0', background:`linear-gradient(135deg, ${player.accentColor}33, #080f1e)` }}>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontFamily:'Anton, sans-serif', fontSize:120, color:`${player.accentColor}18`, lineHeight:1 }}>#{player.number}</div>
            </div>
            <button onClick={handleClose} style={{ position:'absolute', top:16, right:16, background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(218,218,218,0.7)', borderRadius:6, cursor:'pointer', padding:'6px 14px', fontFamily:'Roboto, sans-serif', fontWeight:700, fontSize:11, letterSpacing:'0.1em' }}>✕ CLOSE</button>
            <div style={{ position:'absolute', top:16, left:16, background:'rgba(8,15,30,0.85)', border:`2px solid ${player.accentColor}`, borderRadius:8, padding:'8px 14px', textAlign:'center' }}>
              <div style={{ fontFamily:'Anton, sans-serif', fontSize:32, color:player.accentColor, lineHeight:1 }}>{player.rating}</div>
              <div style={{ fontFamily:'Roboto, sans-serif', fontSize:9, fontWeight:700, letterSpacing:'0.15em', color:'rgba(218,218,218,0.6)', textTransform:'uppercase' }}>{player.position}</div>
            </div>
            <div style={{ position:'absolute', bottom:20, left:28 }}>
              <div style={{ fontFamily:'Roboto, sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.25em', color:player.accentColor, marginBottom:4, textTransform:'uppercase' }}>#{player.number} · {player.archetype}</div>
              <div style={{ fontFamily:'Anton, sans-serif', fontSize:36, color:'#fff', textTransform:'uppercase' }}>{player.name}</div>
            </div>
          </div>
        )}

        <RainbowBar height={3} />

        {/* Key stats banner */}
        <div style={{ display:'flex', borderBottom:`1px solid ${player.accentColor}22` }}>
          {player.goals !== null && (
            <div style={{ flex:1, padding:'14px 0', textAlign:'center', borderRight:`1px solid ${player.accentColor}22` }}>
              <div style={{ fontFamily:'Anton, sans-serif', fontSize:28, color:player.accentColor }}>{player.goals}</div>
              <div style={{ fontFamily:'Roboto, sans-serif', fontSize:8, fontWeight:700, letterSpacing:'0.15em', color:'rgba(218,218,218,0.4)', textTransform:'uppercase' }}>Goals</div>
            </div>
          )}
          {player.assists !== null && (
            <div style={{ flex:1, padding:'14px 0', textAlign:'center', borderRight:`1px solid ${player.accentColor}22` }}>
              <div style={{ fontFamily:'Anton, sans-serif', fontSize:28, color:player.accentColor }}>{player.assists}</div>
              <div style={{ fontFamily:'Roboto, sans-serif', fontSize:8, fontWeight:700, letterSpacing:'0.15em', color:'rgba(218,218,218,0.4)', textTransform:'uppercase' }}>Assists</div>
            </div>
          )}
          {player.cleanSheets !== null && (
            <div style={{ flex:1, padding:'14px 0', textAlign:'center', borderRight:`1px solid ${player.accentColor}22` }}>
              <div style={{ fontFamily:'Anton, sans-serif', fontSize:28, color:player.accentColor }}>{player.cleanSheets}</div>
              <div style={{ fontFamily:'Roboto, sans-serif', fontSize:8, fontWeight:700, letterSpacing:'0.15em', color:'rgba(218,218,218,0.4)', textTransform:'uppercase' }}>Clean Sheets</div>
            </div>
          )}
          <div style={{ flex:1, padding:'14px 0', textAlign:'center', borderRight:`1px solid ${player.accentColor}22` }}>
            <div style={{ fontFamily:'Anton, sans-serif', fontSize:28, color:player.accentColor }}>{player.apps}</div>
            <div style={{ fontFamily:'Roboto, sans-serif', fontSize:8, fontWeight:700, letterSpacing:'0.15em', color:'rgba(218,218,218,0.4)', textTransform:'uppercase' }}>Apps</div>
          </div>
          {player.goals && player.apps && (
            <div style={{ flex:1, padding:'14px 0', textAlign:'center' }}>
              <div style={{ fontFamily:'Anton, sans-serif', fontSize:28, color:player.accentColor }}>{(player.goals/player.apps).toFixed(2)}</div>
              <div style={{ fontFamily:'Roboto, sans-serif', fontSize:8, fontWeight:700, letterSpacing:'0.15em', color:'rgba(218,218,218,0.4)', textTransform:'uppercase' }}>G/Game</div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:`1px solid ${player.accentColor}22`, padding:'0 28px' }}>
          {['OVERVIEW','STATS','LORE'].map(t => (
            <button key={t} onClick={() => setTab(t.toLowerCase())} style={{ background:'none', border:'none', cursor:'pointer', padding:'14px 20px', fontFamily:'Anton, sans-serif', fontSize:13, letterSpacing:'0.15em', color: tab===t.toLowerCase() ? player.accentColor : 'rgba(218,218,218,0.35)', borderBottom: tab===t.toLowerCase() ? `2px solid ${player.accentColor}` : '2px solid transparent', transition:'all 0.2s', textTransform:'uppercase' }}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding:'24px 28px 32px' }}>
          {tab === 'overview' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:28 }}>
              <div>
                <div style={{ fontFamily:'Roboto, sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.15em', color:'rgba(218,218,218,0.35)', marginBottom:16, textTransform:'uppercase' }}>Attributes</div>
                {statKeys.map(k => <StatBar key={k} label={k} value={player.stats[k]} color={statColors[k]||player.accentColor} />)}
              </div>
              <div>
                {player.id === 'panikova' && (
                  <div>
                    <div style={{ fontFamily:'Roboto, sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.15em', color:'rgba(218,218,218,0.35)', marginBottom:16, textTransform:'uppercase' }}>PANIC METER™</div>
                    <div style={{ background:'rgba(228,0,43,0.07)', border:'1px solid rgba(228,0,43,0.25)', borderRadius:8, padding:18 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ fontFamily:'Roboto, sans-serif', fontSize:11, color:'rgba(218,218,218,0.5)' }}>STABILITY</span>
                        <span style={{ fontFamily:'Anton, sans-serif', fontSize:18, color:getPanicColor(panicLevel), transition:'color 0.5s' }}>{Math.round(panicLevel)}%</span>
                      </div>
                      <div style={{ height:10, background:'rgba(255,255,255,0.05)', borderRadius:5, overflow:'hidden', marginBottom:10 }}>
                        <div style={{ height:'100%', width:`${panicLevel}%`, background:`linear-gradient(90deg, #2a9d8f, ${getPanicColor(panicLevel)})`, transition:'width 0.8s, background 0.5s', borderRadius:5 }} />
                      </div>
                      <div style={{ fontFamily:'Roboto, sans-serif', fontSize:10, color:'rgba(218,218,218,0.4)', fontStyle:'italic', textAlign:'center' }}>
                        {panicLevel<30?'🟢 CALM PHASE ACTIVE':panicLevel<60?'🟡 ELEVATED ENERGY':'🔴 FULL PANIC MODE'}
                      </div>
                    </div>
                    <div style={{ marginTop:16 }}>
                      {player.tags.map((t,i) => <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}><div style={{ width:5, height:5, borderRadius:'50%', background:'#E4002B', flexShrink:0 }} /><span style={{ fontFamily:'Roboto, sans-serif', fontSize:12, color:'rgba(218,218,218,0.7)' }}>{t}</span></div>)}
                    </div>
                  </div>
                )}
                {player.id === 'gymskin' && (
                  <div>
                    <div style={{ fontFamily:'Roboto, sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.15em', color:'rgba(218,218,218,0.35)', marginBottom:16, textTransform:'uppercase' }}>AURA STATUS</div>
                    <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
                      <div style={{ position:'relative', width:110, height:110 }}>
                        <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:`conic-gradient(from ${auraAngle}deg, #9b5de5, #00c8ff, #e9c46a, #9b5de5)`, filter:'blur(8px)', opacity:0.75 }} />
                        <div style={{ position:'absolute', inset:8, borderRadius:'50%', background:'#080f1e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                          <div style={{ fontFamily:'Anton, sans-serif', fontSize:18, color:'#9b5de5' }}>ACTIVE</div>
                          <div style={{ fontFamily:'Roboto, sans-serif', fontSize:8, color:'rgba(218,218,218,0.4)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Aura Pulse</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ background:'rgba(155,93,229,0.08)', border:'1px solid rgba(155,93,229,0.25)', borderRadius:6, padding:12, marginBottom:10 }}>
                      <div style={{ fontFamily:'Anton, sans-serif', fontSize:12, color:'#9b5de5', marginBottom:4, textTransform:'uppercase' }}>☕ Coffee Protocol</div>
                      <div style={{ fontFamily:'Roboto, sans-serif', fontSize:11, color:'rgba(218,218,218,0.6)' }}>Target temp: <span style={{ color:'#9b5de5', fontWeight:700 }}>95°C exactly</span>. ±1° margin: UNACCEPTABLE.</div>
                    </div>
                    {player.tags.map((t,i) => <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}><div style={{ width:5, height:5, borderRadius:'50%', background:'#9b5de5', flexShrink:0 }} /><span style={{ fontFamily:'Roboto, sans-serif', fontSize:12, color:'rgba(218,218,218,0.7)' }}>{t}</span></div>)}
                  </div>
                )}
                {player.id === 'karavavov' && (
                  <div>
                    <div style={{ fontFamily:'Roboto, sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.15em', color:'rgba(218,218,218,0.35)', marginBottom:16, textTransform:'uppercase' }}>RISK METER™</div>
                    <div style={{ background:'rgba(244,162,97,0.07)', border:'1px solid rgba(244,162,97,0.25)', borderRadius:8, padding:18, marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ fontFamily:'Roboto, sans-serif', fontSize:10, color:'#2a9d8f' }}>SAFE</span>
                        <span style={{ fontFamily:'Roboto, sans-serif', fontSize:10, color:'#E4002B' }}>FULL CHAOS</span>
                      </div>
                      <div style={{ height:14, background:'linear-gradient(90deg, rgba(42,157,143,0.3), rgba(233,196,106,0.3), rgba(228,0,43,0.3))', borderRadius:7, position:'relative' }}>
                        <div style={{ position:'absolute', top:'50%', transform:'translate(-50%,-50%)', left:`${riskLevel}%`, width:20, height:20, borderRadius:'50%', background:'#f4a261', boxShadow:'0 0 12px rgba(244,162,97,0.8)', transition:'left 0.6s cubic-bezier(0.2,0,0,1)', border:'2px solid #fff' }} />
                      </div>
                      <div style={{ fontFamily:'Roboto, sans-serif', fontSize:10, color:'rgba(218,218,218,0.4)', textAlign:'center', marginTop:8, fontStyle:'italic' }}>
                        {riskLevel<30?'Playing it safe... temporarily.':riskLevel<70?'Medium chaos. Warming up.':'🔥 FULL KARAVAVOV MODE'}
                      </div>
                    </div>
                    {player.tags.map((t,i) => <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}><div style={{ width:5, height:5, borderRadius:'50%', background:'#f4a261', flexShrink:0 }} /><span style={{ fontFamily:'Roboto, sans-serif', fontSize:12, color:'rgba(218,218,218,0.7)' }}>{t}</span></div>)}
                  </div>
                )}
                {player.id === 'ricciardo' && (
                  <div>
                    <div style={{ fontFamily:'Roboto, sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.15em', color:'rgba(218,218,218,0.35)', marginBottom:16, textTransform:'uppercase' }}>PERFORMANCE VARIANCE</div>
                    <div style={{ background:'rgba(0,200,255,0.07)', border:'1px solid rgba(0,200,255,0.2)', borderRadius:8, padding:18, marginBottom:14 }}>
                      <div style={{ height:12, background:'linear-gradient(90deg, #E4002B, #e9c46a, #2a9d8f)', borderRadius:6, position:'relative' }}>
                        <div style={{ position:'absolute', top:'50%', left:`${perfLevel}%`, transform:'translate(-50%,-50%)', width:18, height:18, borderRadius:'50%', background:'#00c8ff', boxShadow:'0 0 14px rgba(0,200,255,0.9)', transition:'left 0.8s cubic-bezier(0.2,0,0,1)', border:'2px solid #fff' }} />
                      </div>
                      <div style={{ fontFamily:'Roboto, sans-serif', fontSize:10, color:'#00c8ff', textAlign:'center', marginTop:10, fontStyle:'italic' }}>
                        {perfLevel<25?'💀 FRAUDULENT PERFORMANCE':perfLevel<50?'📉 BELOW EXPECTATIONS':perfLevel<75?'📈 ACTUALLY DECENT':'🔥 LOCKED IN (STILL NO CROSS)'}
                      </div>
                    </div>
                    <div style={{ background:'rgba(228,0,43,0.07)', border:'1px solid rgba(228,0,43,0.2)', borderRadius:6, padding:12 }}>
                      <div style={{ fontFamily:'Anton, sans-serif', fontSize:12, color:'#E4002B', marginBottom:4, textTransform:'uppercase' }}>Cross Completion Rate</div>
                      <div style={{ fontFamily:'Anton, sans-serif', fontSize:32, color:'#E4002B' }}>0.0%</div>
                      <div style={{ fontFamily:'Roboto, sans-serif', fontSize:9, color:'rgba(218,218,218,0.4)', textTransform:'uppercase', letterSpacing:'0.08em' }}>1,247 ATTEMPTS · 0 SUCCESSFUL</div>
                    </div>
                  </div>
                )}
                {!['panikova','gymskin','karavavov','ricciardo'].includes(player.id) && (
                  <div>
                    <div style={{ fontFamily:'Roboto, sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.15em', color:'rgba(218,218,218,0.35)', marginBottom:16, textTransform:'uppercase' }}>Traits</div>
                    {player.tags.map((t,i) => <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}><div style={{ width:5, height:5, borderRadius:'50%', background:player.accentColor, flexShrink:0 }} /><span style={{ fontFamily:'Roboto, sans-serif', fontSize:12, color:'rgba(218,218,218,0.7)' }}>{t}</span></div>)}
                    <div style={{ marginTop:18, fontFamily:'Roboto, sans-serif', fontSize:13, color:'rgba(218,218,218,0.5)', lineHeight:1.65, fontStyle:'italic', borderLeft:`2px solid ${player.accentColor}44`, paddingLeft:12 }}>{player.lore}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'stats' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>
              <div>
                <div style={{ fontFamily:'Roboto, sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.15em', color:'rgba(218,218,218,0.35)', marginBottom:18, textTransform:'uppercase' }}>Career Stats</div>
                {[['APPEARANCES',player.apps],['GOALS',player.goals??'N/A'],['ASSISTS',player.assists??'N/A'],['CLEAN SHEETS',player.cleanSheets??'N/A'],['G/GAME',player.goals?(player.goals/player.apps).toFixed(2):'N/A']].map(([l,v],i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontFamily:'Roboto, sans-serif', fontSize:11, fontWeight:500, letterSpacing:'0.08em', color:'rgba(218,218,218,0.4)', textTransform:'uppercase' }}>{l}</span>
                    <span style={{ fontFamily:'Anton, sans-serif', fontSize:20, color:player.accentColor }}>{v}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontFamily:'Roboto, sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.15em', color:'rgba(218,218,218,0.35)', marginBottom:18, textTransform:'uppercase' }}>Attributes</div>
                {statKeys.map(k => <StatBar key={k} label={k} value={player.stats[k]} color={statColors[k]||player.accentColor} />)}
              </div>
            </div>
          )}

          {tab === 'lore' && (
            <div>
              <div style={{ fontFamily:'Roboto, sans-serif', fontSize:14, color:'rgba(218,218,218,0.6)', lineHeight:1.75, marginBottom:28, fontStyle:'italic', borderLeft:`3px solid ${player.accentColor}`, paddingLeft:16 }}>{player.lore}</div>
              <div style={{ fontFamily:'Roboto, sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.18em', color:'rgba(218,218,218,0.35)', marginBottom:18, textTransform:'uppercase' }}>Timeline</div>
              {player.timeline.map((item,i) => (
                <div key={i} style={{ display:'flex', gap:18, position:'relative' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:18, flexShrink:0 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:player.accentColor, boxShadow:`0 0 8px ${player.glowColor}`, flexShrink:0, marginTop:4 }} />
                    {i < player.timeline.length-1 && <div style={{ width:2, flex:1, background:`${player.accentColor}33`, minHeight:28 }} />}
                  </div>
                  <div style={{ paddingBottom:24 }}>
                    <div style={{ fontFamily:'Anton, sans-serif', fontSize:14, color:player.accentColor, marginBottom:4, textTransform:'uppercase' }}>{item.era}</div>
                    <div style={{ fontFamily:'Roboto, sans-serif', fontSize:13, color:'rgba(218,218,218,0.6)', lineHeight:1.55 }}>{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── HOME PAGE ───────────────────────────────────────────────────
const HomePage = ({ setPage, setSelectedPlayer }) => {
  const [headlineIdx, setHeadlineIdx] = React.useState(0);
  const [pulseValues, setPulseValues] = React.useState({ goals: 0, assists: 0, rate: 0, pos: 0 });

  const headlines = [
    { text: 'PANIKOVA: THE PANIC RETURNS?', sub: 'Aura stability readings at season-low. Fern sightings reported in the car park.', tag: 'BREAKING', color: '#E4002B' },
    { text: 'GYMSKIN ACTIVATES AURA PULSE IN 4-2 THRILLER', sub: 'Coffee confirmed at 95°. The correlation remains undeniable.', tag: 'MATCH REPORT', color: '#9b5de5' },
    { text: 'RICCIARDO STILL HASN\'T COMPLETED A CROSS', sub: 'Week 23. 1,247 attempts. Zero completions. Investigation continues.', tag: 'ONGOING', color: '#E4002B' },
    { text: 'HERE WE GO — TRANSFER ANNOUNCEMENT IMMINENT', sub: 'Multiple sources confirmed. Nanna Tate have personally approved.', tag: 'TRANSFER', color: '#2a9d8f' },
  ];

  React.useEffect(() => {
    const iv = setInterval(() => setHeadlineIdx(i => (i + 1) % headlines.length), 4500);
    return () => clearInterval(iv);
  }, []);

  React.useEffect(() => {
    const targets = { goals: 89, assists: 126, rate: 64, pos: 2 };
    let frame, start;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 2200, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setPulseValues({ goals: Math.round(targets.goals * ease), assists: Math.round(targets.assists * ease), rate: Math.round(targets.rate * ease), pos: Math.round(targets.pos * ease) || 1 });
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const signings = [
    { player: getP().find(p => p.id === 'panikova'), image: 'uploads/pasted-1777415983890-0.png', caption: 'FROM FERGANA VALLEY, UZBEKISTAN' },
    { player: getP().find(p => p.id === 'gymskin'), image: 'uploads/pasted-1777416552965-0.png', caption: 'AURA PULSE ACTIVATED' },
    { player: getP().find(p => p.id === 'donnyp'), image: 'uploads/pasted-1777417166292-0.png', caption: 'STALWART. MAVERICK. CORNER TAKER.' },
  ];

  const topScorers = [...getP()].filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 5);
  const h = headlines[headlineIdx];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* HERO */}
      <div style={{ position: 'relative', height: 'calc(100vh - 92px - 3px - 88px)', marginTop: 92, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Hero left-side darkening for headline legibility — kept subtle so the global imp bg reads through */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.6) 0%, rgba(3,8,16,0.25) 45%, rgba(3,8,16,0) 70%)', pointerEvents: 'none' }} />
        {/* Imp logo watermark - visible but not overwhelming */}
        <div style={{ position: 'absolute', right: 60, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', userSelect: 'none', opacity: 0 }} />
        {/* Imp watermark removed — global bg already shows the imp */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: 400, height: '100%', background: 'linear-gradient(225deg, rgba(228,0,43,0.1) 0%, transparent 55%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 300, height: 300, background: 'linear-gradient(45deg, rgba(228,0,43,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', height: '100%' }}>
          {/* LEFT: hero content */}
          <div style={{ flex: '0 0 58%', padding: '0 0 0 64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 3, height: 20, background: '#E4002B', flexShrink: 0 }} />
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.25em', color: '#E4002B', textTransform: 'uppercase' }}>Sad Boi Clique FC · LNER Stadium, Lincoln · Est. 2024</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#fff', background: '#E4002B', padding: '4px 12px', borderRadius: 2, textTransform: 'uppercase' }}>{h.tag}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {headlines.map((_, i) => <div key={i} style={{ width: i === headlineIdx ? 24 : 6, height: 4, borderRadius: 2, background: i === headlineIdx ? '#E4002B' : 'rgba(255,255,255,0.2)', transition: 'all 0.4s' }} />)}
            </div>
          </div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(34px, 5.2vw, 72px)', lineHeight: 0.95, color: '#fff', maxWidth: 820, marginBottom: 16, textTransform: 'uppercase', textShadow: '0 4px 40px rgba(228,0,43,0.2)', transition: 'all 0.4s' }}>{h.text}</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 15, fontWeight: 300, color: 'rgba(218,218,218,0.75)', maxWidth: 520, marginBottom: 36, lineHeight: 1.6 }}>{h.sub}</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            {[
              { label: 'NEXT MATCH', val: 'VS FC MIDNIGHT', sub: 'May 3 · 20:00 · HOME', color: '#E4002B' },
              { label: 'LAST RESULT', val: '4 – 2', sub: 'vs The Ronaldo Enjoyers', color: '#2a9d8f' },
              { label: 'LEAGUE POSITION', val: '2ND', sub: '59 pts · GD +28', color: '#E4002B' },
              { label: 'WIN STREAK', val: '3 WINS', sub: 'Current run · W W W', color: '#e9c46a' },
            ].map((w, i) => (
              <div key={i} style={{ background: 'rgba(8,15,30,0.85)', backdropFilter: 'blur(20px)', border: `1px solid ${w.color}33`, borderLeft: `3px solid ${w.color}`, borderRadius: 4, padding: '14px 20px', minWidth: 160 }}>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: w.color, marginBottom: 5, textTransform: 'uppercase' }}>{w.label}</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: w.val.length > 5 ? 16 : 24, color: '#fff', lineHeight: 1.1 }}>{w.val}</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.45)', marginTop: 3 }}>{w.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setPage('squad')} style={{ background: '#E4002B', border: 'none', color: '#fff', fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.1em', padding: '12px 28px', borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' }}
              onMouseEnter={e => e.currentTarget.style.background = '#ff1a3a'} onMouseLeave={e => e.currentTarget.style.background = '#E4002B'}
            >VIEW SQUAD →</button>
            <button onClick={() => setPage('news')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.1em', padding: '12px 28px', borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E4002B'; e.currentTarget.style.color = '#E4002B'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff'; }}
            >LATEST NEWS</button>
          </div>
        </div>
          </div>
          {/* RIGHT: Featured signing */}
          <div style={{ flex: '0 0 42%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <img src="uploads/pasted-1777415983890-0.png" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} alt="Panikova" />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,1) 0%, rgba(3,8,16,0.55) 35%, rgba(3,8,16,0.1) 70%, transparent 100%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(0deg, rgba(3,8,16,0.95) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', bottom: 40, left: 28 }}>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', color: '#E4002B', marginBottom: 6, textTransform: 'uppercase' }}>⚡ FEATURED SIGNING</div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: '#fff', textTransform: 'uppercase', lineHeight: 0.95, letterSpacing: '0.01em', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>AMIR<br />PANIKOVA</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.6)', marginTop: 8 }}>#77 · ST · FROM FERGANA VALLEY</div>
              <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                {['UNPREDICTABLE','UNDISCIPLINED','UNSTOPPABLE'].map(t => (
                  <span key={t} style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, color: '#fff', background: 'rgba(228,0,43,0.7)', padding: '3px 7px', borderRadius: 2, letterSpacing: '0.1em' }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade removed — was creating darker sheen vs the rest of the bg */}
      </div>

      {/* RainbowBar + pulse strip moved to global home footer in index.html */}

      {/* CLUB PULSE STRIP — moved to global footer in index.html */}

      {/* WELCOME TO THE CLIQUE */}
      <div style={{ background: '#030810', padding: '48px 64px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: '#E4002B', textTransform: 'uppercase', marginBottom: 4 }}>25/26 SEASON ARRIVALS</div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: '#fff', letterSpacing: '0.03em', textTransform: 'uppercase' }}>WELCOME TO THE CLIQUE</div>
          </div>
          <button onClick={() => setPage('squad')} style={{ background: 'none', border: '1px solid rgba(228,0,43,0.4)', color: '#E4002B', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', padding: '7px 16px', borderRadius: 3, textTransform: 'uppercase' }}>FULL SQUAD →</button>
        </div>
        <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 8 }}>
          {signings.map((s, i) => {
            const [hov, setHov] = React.useState(false);
            return (
              <div key={i} onClick={() => setSelectedPlayer(s.player)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                style={{ flexShrink: 0, width: 265, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', position: 'relative', border: `1px solid ${hov ? '#E4002B' : 'rgba(228,0,43,0.2)'}`, transition: 'all 0.25s', transform: hov ? 'translateY(-6px)' : 'none', boxShadow: hov ? '0 20px 50px rgba(228,0,43,0.25)' : 'none' }}>
                <img src={s.image} style={{ width: '100%', height: 390, objectFit: 'cover', objectPosition: 'top', display: 'block' }} alt={s.player && s.player.name} />
                <div style={{ position: 'absolute', inset: 0, background: hov ? 'rgba(0,0,0,0.5)' : 'linear-gradient(0deg, rgba(3,8,16,0.9) 0%, transparent 45%)', transition: 'all 0.3s' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px' }}>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: '#E4002B', marginBottom: 4 }}>NEW SIGNING · #{s.player && s.player.number}</div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: '#fff', textTransform: 'uppercase', lineHeight: 1.05 }}>{s.player && s.player.name}</div>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'rgba(218,218,218,0.55)', marginTop: 4 }}>{s.caption}</div>
                </div>
                {hov && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#E4002B', color: '#fff', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.1em', padding: '10px 22px', borderRadius: 3, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>VIEW PROFILE →</div>}
              </div>
            );
          })}
          <div style={{ flexShrink: 0, width: 265, borderRadius: 6, border: '1px dashed rgba(228,0,43,0.25)', background: 'rgba(10,22,40,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 390, gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '2px dashed rgba(228,0,43,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 28, color: 'rgba(228,0,43,0.4)' }}>?</div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.3 }}>MORE SIGNINGS<br />INCOMING</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, color: 'rgba(228,0,43,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Fabrizio Knows</div>
          </div>
        </div>
      </div>

      {/* CHAOS FEED STRIP */}
      <div style={{ background: 'rgba(6,12,24,0.98)', borderTop: '1px solid rgba(228,0,43,0.12)', borderBottom: '1px solid rgba(228,0,43,0.12)' }}>
        <div style={{ padding: '0 64px', display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'stretch' }}>
          <div style={{ background: '#E4002B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', margin: '0 auto 4px', boxShadow: '0 0 8px rgba(255,255,255,0.8)', animation: 'pulse-ring 1.5s infinite' }} />
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase' }}>CHAOS<br/>FEED</div>
            </div>
          </div>
          <div style={{ overflow: 'hidden', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'inline-flex', animation: 'ticker 35s linear infinite', gap: 0 }}>
              {[
                { player: 'PANIKOVA', msg: 'arrived at training wearing sunglasses. Indoors. At night.', color: '#E4002B' },
                { player: 'GYMSKIN', msg: 'coffee refused. Thermometer reading: 94.8°. Session delayed 11 minutes.', color: '#9b5de5' },
                { player: 'RICCIARDO', msg: 'attempted a cross. Ball went backwards. Investigation still ongoing.', color: '#00c8ff' },
                { player: 'RFK JR', msg: 'brought unidentified smoothie to training. Team physio is taking notes.', color: '#e9c46a' },
                { player: 'KARAVAVOV', msg: '"The risky pass was the right pass." It was not. He won the argument anyway.', color: '#f4a261' },
                { player: 'DIAKITE', msg: 'spotted in car park near stadium. No further information. DO NOT APPROACH.', color: '#E4002B' },
                { player: 'DONNY P', msg: '"That shot was on target actually." GPS confirms it was not. Confidence unchanged.', color: '#e9c46a' },
                { player: 'HEGSETH', msg: 'providing live commentary on his own performance. In the 89th minute. Again.', color: '#e63946' },
              ].concat([
                { player: 'PANIKOVA', msg: 'arrived at training wearing sunglasses. Indoors. At night.', color: '#E4002B' },
                { player: 'GYMSKIN', msg: 'coffee refused. Thermometer reading: 94.8°. Session delayed 11 minutes.', color: '#9b5de5' },
                { player: 'RICCIARDO', msg: 'attempted a cross. Ball went backwards. Investigation still ongoing.', color: '#00c8ff' },
                { player: 'RFK JR', msg: 'brought unidentified smoothie to training. Team physio is taking notes.', color: '#e9c46a' },
              ]).map((f, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px 14px 0', whiteSpace: 'nowrap' }}>
                  <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, color: f.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{f.player}</span>
                  <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.5)' }}>{f.msg}</span>
                  <span style={{ color: 'rgba(228,0,43,0.3)', marginLeft: 16 }}>◆</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div style={{ background: '#030810', padding: '8px 64px 52px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }}>
        {/* LEFT: Headlines */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18, paddingTop: 8 }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 26, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.03em' }}>LATEST HEADLINES</div>
            <button onClick={() => setPage('news')} style={{ background: 'none', border: '1px solid rgba(228,0,43,0.4)', color: '#E4002B', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', padding: '6px 14px', borderRadius: 3, textTransform: 'uppercase' }}>ALL NEWS →</button>
          </div>
          <div onClick={() => setPage('news')} style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.25)', borderLeft: '4px solid #E4002B', borderRadius: 6, padding: '20px 22px', marginBottom: 12, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(228,0,43,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(10,22,40,0.7)'}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#fff', background: '#E4002B', padding: '3px 8px', borderRadius: 2, textTransform: 'uppercase' }}>BREAKING</span>
              <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: '#E4002B' }}>🔥 TRENDING NOW</span>
            </div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', lineHeight: 1.1, marginBottom: 8, textTransform: 'uppercase' }}>PANIKOVA: THE PANIC RETURNS?</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.6)', lineHeight: 1.6 }}>Sources close to the striker report "unusual energy" ahead of Saturday's fixture. Aura stability readings are at a season-low. Fern sightings reported.</div>
            <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'rgba(218,218,218,0.3)', marginTop: 10, letterSpacing: '0.05em' }}>2 HOURS AGO</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {getN().slice(1, 5).map(item => (
              <div key={item.id} onClick={() => setPage('news')} style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,60,120,0.3)', borderRadius: 6, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(228,0,43,0.35)'; e.currentTarget.style.background = 'rgba(228,0,43,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,60,120,0.3)'; e.currentTarget.style.background = 'rgba(10,22,40,0.6)'; }}
              >
                <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#fff', background: item.tagColor, padding: '2px 6px', borderRadius: 2, textTransform: 'uppercase' }}>{item.tag}</span>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', lineHeight: 1.2, margin: '8px 0 6px', textTransform: 'uppercase' }}>{item.headline}</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'rgba(218,218,218,0.4)', letterSpacing: '0.04em' }}>{item.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: League + Fixture */}
        <div style={{ paddingTop: 8 }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 14 }}>LEAGUE STANDINGS</div>
          <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(30,60,120,0.35)', borderRadius: 8, overflow: 'hidden', marginBottom: 22 }}>
            {getL().slice(0, 4).map((row, i) => (
              <div key={row.pos} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < 3 ? '1px solid rgba(30,60,120,0.2)' : 'none', background: row.us ? 'rgba(228,0,43,0.08)' : 'transparent', borderLeft: row.us ? '3px solid #E4002B' : '3px solid transparent' }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 15, color: row.us ? '#E4002B' : 'rgba(218,218,218,0.3)', width: 20, textAlign: 'center' }}>{row.pos}</div>
                <div style={{ flex: 1, fontFamily: 'Roboto, sans-serif', fontWeight: row.us ? 700 : 400, fontSize: 12, color: row.us ? '#fff' : 'rgba(218,218,218,0.7)' }}>{row.team}{row.us && <span style={{ marginLeft: 6, fontSize: 9, color: '#E4002B', fontWeight: 700 }}>← US</span>}</div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {row.form.map((r, j) => <div key={j} style={{ width: 14, height: 14, borderRadius: 2, background: r === 'W' ? '#2a9d8f' : r === 'D' ? '#e9c46a' : '#e63946', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Roboto, sans-serif', fontSize: 7, fontWeight: 700, color: '#fff' }}>{r}</div>)}
                </div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 15, color: row.us ? '#E4002B' : '#fff', width: 26, textAlign: 'right' }}>{row.pts}</div>
              </div>
            ))}
            <div onClick={() => setPage('league')} style={{ padding: '10px 14px', textAlign: 'center', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#E4002B', textTransform: 'uppercase', background: 'rgba(228,0,43,0.05)', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(228,0,43,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(228,0,43,0.05)'}
            >FULL TABLE →</div>
          </div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 14 }}>NEXT FIXTURE</div>
          <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(228,0,43,0.2)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ background: 'rgba(228,0,43,0.1)', padding: '10px 16px', borderBottom: '1px solid rgba(228,0,43,0.15)' }}>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: '#E4002B', textTransform: 'uppercase' }}>Premier League · Home</div>
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
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: '#E4002B', lineHeight: 1 }}>MAY 3</div>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: 'rgba(218,218,218,0.45)', marginTop: 2 }}>20:00 KO · LNER STADIUM</div>
                </div>
                <button onClick={() => setPage('fixtures')} style={{ background: '#E4002B', border: 'none', color: '#fff', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', padding: '8px 14px', borderRadius: 3, cursor: 'pointer', textTransform: 'uppercase' }}>getF() →</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP SCORERS */}
      <div style={{ background: 'rgba(6,12,24,0.9)', borderTop: '1px solid rgba(30,60,120,0.3)', padding: '36px 64px 44px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 26, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.03em' }}>TOP SCORERS</div>
          <button onClick={() => setPage('stats')} style={{ background: 'none', border: '1px solid rgba(228,0,43,0.4)', color: '#E4002B', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', padding: '6px 14px', borderRadius: 3, textTransform: 'uppercase' }}>FULL STATS →</button>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {topScorers.map((p, i) => (
            <div key={p.id} onClick={() => setSelectedPlayer(p)} style={{ flex: '1 1 180px', minWidth: 180, background: 'rgba(10,22,40,0.6)', border: `1px solid ${p.accentColor}33`, borderRadius: 6, padding: '14px 16px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = p.accentColor; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${p.accentColor}33`; e.currentTarget.style.transform = 'none'; }}
            >
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
          ))}
        </div>
      </div>
    </div>
  );
};

// ── SQUAD PAGE ──────────────────────────────────────────────────
const SquadPage = ({ setSelectedPlayer }) => {
  const [filter, setFilter] = React.useState('ALL');
  const [hovered, setHovered] = React.useState(null);
  const positions = ['ALL','GK','DEF','MID','FWD'];
  const posMap = { GK:'GK', CB:'DEF', LB:'DEF', RB:'DEF', CDM:'MID', CM:'MID', CAM:'MID', RW:'FWD', LW:'FWD', ST:'FWD', CF:'FWD' };
  const filtered = filter === 'ALL' ? PLAYERS : getP().filter(p => posMap[p.position] === filter);

  return (
    <div style={{ minHeight: '100vh', background: '#030810' }}>
      {/* Hero banner */}
      <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
        <img src="uploads/Sad Boi Clique Widescreen.png" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} alt="" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,16,0.92) 0%, rgba(3,8,16,0.5) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\'%3E%3Ctext x=\'40\' y=\'56\' text-anchor=\'middle\' font-size=\'44\' fill=\'rgba(255,255,255,0.03)\'%3E⚜%3C/text%3E%3C/svg%3E")' }} />
        <div style={{ position: 'absolute', left: 64, bottom: 40 }}>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: '#E4002B', marginBottom: 6, textTransform: 'uppercase' }}>Sad Boi Clique FC · 25/26 Season</div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 60, color: '#fff', lineHeight: 0.9, textTransform: 'uppercase', textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}>THE SQUAD</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, fontWeight: 300, color: 'rgba(218,218,218,0.6)', marginTop: 8, fontStyle: 'italic' }}>Chaos. Clique. Culture.</div>
        </div>
        <div style={{ position: 'absolute', right: 64, bottom: 40, textAlign: 'right' }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 42, color: 'rgba(228,0,43,0.15)', lineHeight: 1 }}>{getP().length}</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(218,218,218,0.35)', textTransform: 'uppercase' }}>Players</div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: 'rgba(6,12,24,0.95)', borderBottom: '1px solid rgba(228,0,43,0.15)', display: 'flex', gap: 0, padding: '0 64px' }}>
        {positions.map(pos => (
          <button key={pos} onClick={() => setFilter(pos)} style={{
            background: 'none', border: 'none', borderBottom: filter === pos ? '3px solid #E4002B' : '3px solid transparent',
            color: filter === pos ? '#E4002B' : 'rgba(218,218,218,0.45)', cursor: 'pointer',
            fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.12em', padding: '16px 24px',
            transition: 'all 0.2s', textTransform: 'uppercase'
          }}>{pos}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.3)', letterSpacing: '0.08em' }}>
          {filtered.length} getP()
        </div>
      </div>

      {/* Squad grid */}
      <div style={{ padding: '40px 64px 64px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
        {filtered.map(p => {
          const isHov = hovered === p.id;
          return (
            <div key={p.id} onClick={() => setSelectedPlayer(p)} onMouseEnter={() => setHovered(p.id)} onMouseLeave={() => setHovered(null)}
              style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', cursor: 'pointer', aspectRatio: '2/3',
                border: `1px solid ${isHov ? p.accentColor : 'rgba(255,255,255,0.06)'}`,
                transition: 'all 0.3s cubic-bezier(0.2,0,0,1)',
                transform: isHov ? 'translateY(-8px) scale(1.02)' : 'none',
                boxShadow: isHov ? `0 24px 60px ${p.glowColor}, 0 0 0 1px ${p.accentColor}40` : '0 4px 20px rgba(0,0,0,0.5)'
              }}>
              {/* Background: signing image or dark gradient */}
              {p.image
                ? <img src={p.image} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', transition: 'transform 0.5s', transform: isHov ? 'scale(1.06)' : 'scale(1)' }} alt={p.name} />
                : <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${p.accentColor}22 0%, #0a1628 100%)` }} />
              }
              {/* Gradient overlays */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(3,8,16,0.97) 0%, rgba(3,8,16,0.5) 45%, rgba(3,8,16,0.1) 100%)' }} />
              {isHov && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(0deg, ${p.accentColor}44, transparent 50%)` }} />}

              {/* Rating badge */}
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(3,8,16,0.85)', border: `1px solid ${p.accentColor}66`, borderRadius: 4, padding: '6px 10px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: p.accentColor, lineHeight: 1 }}>{p.rating}</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(218,218,218,0.5)', textTransform: 'uppercase' }}>{p.position}</div>
              </div>

              {/* Rarity badge */}
              {p.rarity !== 'common' && (() => {
                const cfg = (window.RARITY_CONFIGS || {})[p.rarity] || {};
                return <div style={{ position: 'absolute', top: 12, right: 12, fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: cfg.border, background: `${cfg.border}22`, padding: '3px 7px', borderRadius: 3, border: `1px solid ${cfg.border}44` }}>{cfg.label}</div>;
              })()}

              {/* No image: number placeholder */}
              {!p.image && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 80, color: `${p.accentColor}18`, userSelect: 'none', lineHeight: 1 }}>#{p.number}</div>
                </div>
              )}

              {/* Bottom info */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 14px 14px' }}>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: p.accentColor, marginBottom: 3, textTransform: 'uppercase' }}>#{p.number} · {p.archetype}</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textTransform: 'uppercase', lineHeight: 1.05, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{p.shortName}</div>
                {isHov && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {p.tags.slice(0,2).map((t,i) => <span key={i} style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', color: p.accentColor, background: `${p.accentColor}22`, padding: '2px 6px', borderRadius: 2, textTransform: 'uppercase' }}>{t}</span>)}
                  </div>
                )}
                {isHov && (
                  <div style={{ marginTop: 10, fontFamily: 'Anton, sans-serif', fontSize: 11, color: p.accentColor, letterSpacing: '0.12em', textTransform: 'uppercase' }}>VIEW PROFILE →</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── STATS PAGE ──────────────────────────────────────────────────
const StatsPage = ({ setSelectedPlayer }) => {
  const scorers = [...getP()].filter(p => p.goals > 0).sort((a,b) => b.goals - a.goals);
  const assisters = [...getP()].filter(p => p.assists > 0).sort((a,b) => b.assists - a.assists);
  const maxGoals = scorers[0]?.goals || 1;

  return (
    <div style={{ background: '#030810', minHeight: '100vh' }}>
      <div style={{ background: 'rgba(6,12,24,0.95)', borderBottom: '1px solid rgba(228,0,43,0.15)', padding: '100px 64px 32px' }}>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: '#E4002B', marginBottom: 4, textTransform: 'uppercase' }}>Performance Data</div>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 52, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9 }}>STATS DASHBOARD</div>
      </div>
      <RainbowBar />
      <div style={{ padding: '40px 64px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          {/* Top Scorers */}
          <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(30,60,120,0.35)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,60,120,0.35)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(228,0,43,0.06)' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOP SCORERS</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: '#E4002B', letterSpacing: '0.15em', textTransform: 'uppercase' }}>⚽ Goals</div>
            </div>
            {scorers.map((p, i) => (
              <div key={p.id} onClick={() => setSelectedPlayer(p)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid rgba(30,60,120,0.15)', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = `${p.accentColor}0a`}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: 'rgba(218,218,218,0.15)', width: 24, textAlign: 'center' }}>{i+1}</div>
                {p.image
                  ? <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${p.accentColor}55`, flexShrink: 0 }}><img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} alt={p.name} /></div>
                  : <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${p.accentColor}22`, border: `2px solid ${p.accentColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 15, color: p.accentColor, flexShrink: 0 }}>{p.number}</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase' }}>{p.shortName}</div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 4 }}>
                    <div style={{ height: '100%', width: `${(p.goals/maxGoals)*100}%`, background: p.accentColor, borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: p.accentColor }}>{p.goals}</div>
              </div>
            ))}
          </div>
          {/* Top Assists */}
          <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(30,60,120,0.35)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,60,120,0.35)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(67,97,238,0.06)' }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOP ASSISTS</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: '#4361ee', letterSpacing: '0.15em', textTransform: 'uppercase' }}>🎯 Assists</div>
            </div>
            {assisters.slice(0,7).map((p, i) => {
              const maxA = assisters[0]?.assists || 1;
              return (
                <div key={p.id} onClick={() => setSelectedPlayer(p)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid rgba(30,60,120,0.15)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = `${p.accentColor}0a`}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: 'rgba(218,218,218,0.15)', width: 24 }}>{i+1}</div>
                  {p.image
                    ? <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${p.accentColor}55`, flexShrink: 0 }}><img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} alt={p.name} /></div>
                    : <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${p.accentColor}22`, border: `2px solid ${p.accentColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 15, color: p.accentColor, flexShrink: 0 }}>{p.number}</div>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase' }}>{p.shortName}</div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 4 }}>
                      <div style={{ height: '100%', width: `${(p.assists/maxA)*100}%`, background: p.accentColor, borderRadius: 2 }} />
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: p.accentColor }}>{p.assists}</div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Player cards grid */}
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 18 }}>PLAYER RATINGS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {getP().slice(0,6).map(p => (
            <div key={p.id} onClick={() => setSelectedPlayer(p)} style={{ background: 'rgba(10,22,40,0.7)', border: `1px solid ${p.accentColor}33`, borderRadius: 8, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 14, alignItems: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = p.accentColor; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${p.accentColor}33`; e.currentTarget.style.transform = 'none'; }}
            >
              {p.image
                ? <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${p.accentColor}66`, flexShrink: 0 }}><img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} alt={p.name} /></div>
                : <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${p.accentColor}22`, border: `2px solid ${p.accentColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 20, color: p.accentColor, flexShrink: 0 }}>{p.number}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 15, color: '#fff', textTransform: 'uppercase' }}>{p.shortName}</div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{p.position}</div>
                {Object.entries(p.stats).slice(0,3).map(([k,v]) => (
                  <div key={k} style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, color: 'rgba(218,218,218,0.4)', textTransform: 'uppercase' }}>{k}</span>
                      <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, color: p.accentColor }}>{v}</span>
                    </div>
                    <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                      <div style={{ height: '100%', width: `${v}%`, background: p.accentColor, borderRadius: 1 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: p.accentColor, flexShrink: 0 }}>{p.rating}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── getF() PAGE ───────────────────────────────────────────────
const FixturesPage = () => {
  const [expanded, setExpanded] = React.useState(null);
  const getCol = (f) => {
    if (!f.result) return '#00c8ff';
    return f.result.us > f.result.them ? '#2a9d8f' : f.result.us < f.result.them ? '#E4002B' : '#e9c46a';
  };
  const getLabel = (f) => {
    if (!f.result) return null;
    return f.result.us > f.result.them ? 'W' : f.result.us < f.result.them ? 'L' : 'D';
  };

  return (
    <div style={{ background: '#030810', minHeight: '100vh' }}>
      <div style={{ background: 'rgba(6,12,24,0.95)', borderBottom: '1px solid rgba(228,0,43,0.15)', padding: '100px 64px 32px' }}>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: '#E4002B', marginBottom: 4, textTransform: 'uppercase' }}>2025/26 Season</div>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 52, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9 }}>getF() & RESULTS</div>
      </div>
      <RainbowBar />
      <div style={{ padding: '40px 64px 64px', maxWidth: 860 }}>
        {getF().map(f => (
          <div key={f.id} style={{ background: 'rgba(10,22,40,0.7)', border: `1px solid ${f.result ? getCol(f)+'44' : 'rgba(0,200,255,0.15)'}`, borderRadius: 8, overflow: 'hidden', marginBottom: 10, cursor: f.result ? 'pointer' : 'default' }}
            onClick={() => f.result && setExpanded(expanded === f.id ? null : f.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderLeft: `4px solid ${f.result ? getCol(f) : 'rgba(0,200,255,0.3)'}` }}>
              {f.result
                ? <div style={{ width: 34, height: 34, borderRadius: 4, background: getCol(f), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 16, color: '#fff', flexShrink: 0 }}>{getLabel(f)}</div>
                : <div style={{ width: 34, height: 34, borderRadius: 4, background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 9, color: '#00c8ff', flexShrink: 0 }}>TBC</div>
              }
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: '#fff', textTransform: 'uppercase' }}>{f.home ? 'HOME' : 'AWAY'} vs {f.opponent.toUpperCase()}</span>
                  <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: 'rgba(218,218,218,0.35)', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 3, textTransform: 'uppercase' }}>{f.competition}</span>
                </div>
                <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.4)' }}>{f.date} · {f.time}</div>
              </div>
              {f.result && <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#fff', letterSpacing: '0.05em' }}>{f.result.us} – {f.result.them}</div>}
              {f.result && <div style={{ color: 'rgba(218,218,218,0.3)', fontSize: 12, marginLeft: 8 }}>{expanded === f.id ? '▲' : '▼'}</div>}
            </div>
            {expanded === f.id && f.result && (
              <div style={{ padding: '0 20px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {f.motm && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(233,196,106,0.1)', border: '1px solid rgba(233,196,106,0.25)', borderRadius: 4, padding: '6px 14px', marginTop: 14, marginBottom: 12 }}>
                    <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#e9c46a', textTransform: 'uppercase' }}>★ MOTM</span>
                    <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#fff', textTransform: 'uppercase' }}>{f.motm}</span>
                  </div>
                )}
                {f.scorers && (
                  <div style={{ marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {f.scorers.map((s,i) => <TagChip key={i} label={`⚽ ${s}`} color="rgba(42,157,143,0.1)" textColor="#2a9d8f" />)}
                  </div>
                )}
                {f.narrative && <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, fontStyle: 'italic', color: 'rgba(218,218,218,0.5)', lineHeight: 1.6, borderLeft: '2px solid rgba(228,0,43,0.3)', paddingLeft: 12 }}>{f.narrative}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── NEWS PAGE ───────────────────────────────────────────────────
const NewsPage = () => {
  const [active, setActive] = React.useState(null);
  return (
    <div style={{ background: '#030810', minHeight: '100vh' }}>
      <div style={{ background: 'rgba(6,12,24,0.95)', borderBottom: '1px solid rgba(228,0,43,0.15)', padding: '100px 64px 32px' }}>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: '#E4002B', marginBottom: 4, textTransform: 'uppercase' }}>Club Media Hub</div>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 52, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9 }}>NEWS & STORIES</div>
      </div>
      <RainbowBar />
      <div style={{ padding: '40px 64px 64px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
        {getN().map(item => (
          <div key={item.id} onClick={() => setActive(active === item.id ? null : item.id)}
            style={{ background: 'rgba(10,22,40,0.7)', border: `1px solid ${active === item.id ? item.tagColor+'66' : 'rgba(30,60,120,0.3)'}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { if (active !== item.id) e.currentTarget.style.borderColor = 'rgba(228,0,43,0.3)'; }}
            onMouseLeave={e => { if (active !== item.id) e.currentTarget.style.borderColor = 'rgba(30,60,120,0.3)'; }}
          >
            <div style={{ height: 3, background: item.tagColor }} />
            <div style={{ padding: '18px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: '#fff', background: item.tagColor, padding: '3px 8px', borderRadius: 2, textTransform: 'uppercase' }}>{item.tag}</span>
                {item.hot && <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, color: '#E4002B', fontWeight: 700 }}>🔥 HOT</span>}
              </div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#fff', lineHeight: 1.15, marginBottom: 8, textTransform: 'uppercase' }}>{item.headline}</div>
              <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.55)', lineHeight: 1.6 }}>{item.summary}</div>
              {active === item.id && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'rgba(218,218,218,0.4)', fontStyle: 'italic', lineHeight: 1.7 }}>
                  Our analysts continue to monitor the situation closely. Nanna Tate — official potato perfection partner — has issued no statement. The club has declined to comment further.
                </div>
              )}
              <div style={{ marginTop: 12, fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, color: 'rgba(218,218,218,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── TRANSFERS PAGE ──────────────────────────────────────────────
const TransfersPage = () => {
  const [revealed, setRevealed] = React.useState({});
  const transfers = [
    { id: 1, player: 'UNKNOWN SIGNING', club: 'CLASSIFIED FC', fee: 'UNDISCLOSED', status: 'here_we_go', detail: 'Multiple sources confirm agreement in principle. Medicals booked. Nanna Tate personally approved the move. HERE WE GO.', color: '#2a9d8f' },
    { id: 2, player: 'GYMSKIN', club: 'SAD BOI CLIQUE FC', fee: 'LOYALTY', status: 'renewed', detail: 'Contract extension signed. New terms include guaranteed coffee at 95 degrees before every match. Non-negotiable clause.', color: '#9b5de5' },
    { id: 3, player: 'PANIKOVA', club: 'SAD BOI CLIQUE FC', fee: 'N/A', status: 'rumour', detail: 'Several unnamed clubs have enquired. Panikova reportedly saw signs in a potted cactus. Investigation ongoing.', color: '#E4002B' },
  ];
  const statusConfig = {
    here_we_go: { label: 'HERE WE GO ✓', bg: '#2a9d8f' },
    renewed: { label: 'CONTRACT EXTENDED', bg: '#9b5de5' },
    rumour: { label: 'DEVELOPING STORY', bg: 'rgba(228,0,43,0.2)', text: '#E4002B' }
  };
  return (
    <div style={{ background: '#030810', minHeight: '100vh' }}>
      <div style={{ background: 'rgba(6,12,24,0.95)', borderBottom: '1px solid rgba(228,0,43,0.15)', padding: '100px 64px 32px' }}>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: '#E4002B', marginBottom: 4, textTransform: 'uppercase' }}>Transfer Centre</div>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 52, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9 }}>TRANSFERS</div>
      </div>
      <RainbowBar />
      <div style={{ padding: '40px 64px 64px', maxWidth: 760 }}>
        {transfers.map(t => {
          const cfg = statusConfig[t.status];
          const isOpen = revealed[t.id];
          return (
            <div key={t.id} style={{ background: 'rgba(10,22,40,0.7)', border: `1px solid ${t.color}44`, borderRadius: 8, overflow: 'hidden', marginBottom: 14, borderLeft: `4px solid ${t.color}` }}>
              <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setRevealed(r => ({ ...r, [t.id]: !r[t.id] }))}>
                <div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{t.player}</div>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(218,218,218,0.4)', marginTop: 2 }}>{t.club} · FEE: {t.fee}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: cfg.text || '#fff', background: cfg.bg, padding: '5px 12px', borderRadius: 3, textTransform: 'uppercase' }}>{cfg.label}</div>
                  <div style={{ color: 'rgba(218,218,218,0.3)', fontSize: 10 }}>{isOpen ? '▲' : '▼'}</div>
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: '0 22px 18px', borderTop: `1px solid ${t.color}22` }}>
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.6)', lineHeight: 1.7, fontStyle: 'italic', marginTop: 14, borderLeft: `2px solid ${t.color}`, paddingLeft: 12 }}>{t.detail}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── LEAGUE TABLE PAGE ───────────────────────────────────────────
const LeaguePage = () => {
  return (
    <div style={{ background: '#030810', minHeight: '100vh' }}>
      <div style={{ background: 'rgba(6,12,24,0.95)', borderBottom: '1px solid rgba(228,0,43,0.15)', padding: '100px 64px 32px' }}>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: '#E4002B', marginBottom: 4, textTransform: 'uppercase' }}>2025/26 Season</div>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 52, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9 }}>LEAGUE TABLE</div>
      </div>
      <RainbowBar />
      <div style={{ padding: '40px 64px 64px', maxWidth: 960 }}>
        <div style={{ background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(30,60,120,0.35)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 44px 44px 44px 44px 54px 64px 110px', padding: '10px 20px', borderBottom: '1px solid rgba(30,60,120,0.35)', background: 'rgba(228,0,43,0.06)' }}>
            {['#','TEAM','P','W','D','L','GD','PTS','FORM'].map(h => <div key={h} style={{ fontFamily: 'Roboto, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(228,0,43,0.7)', textAlign: h === 'TEAM' ? 'left' : 'center', textTransform: 'uppercase' }}>{h}</div>)}
          </div>
          {getL().map((row, i) => (
            <div key={row.pos} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 44px 44px 44px 44px 54px 64px 110px', padding: '13px 20px', borderBottom: '1px solid rgba(30,60,120,0.12)', background: row.us ? 'rgba(228,0,43,0.07)' : 'transparent', borderLeft: row.us ? '3px solid #E4002B' : '3px solid transparent', transition: 'background 0.2s' }}
              onMouseEnter={e => { if (!row.us) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              onMouseLeave={e => { if (!row.us) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: row.us ? '#E4002B' : 'rgba(218,218,218,0.35)', textAlign: 'center', alignSelf: 'center' }}>{row.pos}</div>
              <div style={{ fontFamily: row.us ? 'Anton, sans-serif' : 'Roboto, sans-serif', fontWeight: row.us ? undefined : 500, fontSize: 13, color: row.us ? '#fff' : 'rgba(218,218,218,0.75)', alignSelf: 'center', paddingLeft: 8, textTransform: row.us ? 'uppercase' : 'none' }}>
                {row.team}{row.us && <span style={{ marginLeft: 8, fontSize: 9, color: '#E4002B', fontFamily: 'Roboto, sans-serif', fontWeight: 700, textTransform: 'uppercase' }}>← US</span>}
              </div>
              {[row.p, row.w, row.d, row.l, row.gd > 0 ? `+${row.gd}` : row.gd].map((v, j) => (
                <div key={j} style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(218,218,218,0.55)', textAlign: 'center', alignSelf: 'center' }}>{v}</div>
              ))}
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: row.us ? '#E4002B' : '#fff', textAlign: 'center', alignSelf: 'center' }}>{row.pts}</div>
              <div style={{ display: 'flex', gap: 3, justifyContent: 'center', alignSelf: 'center' }}>
                {row.form.map((r, j) => (
                  <div key={j} style={{ width: 16, height: 16, borderRadius: 3, background: r==='W'?'#2a9d8f':r==='D'?'#e9c46a':'#E4002B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Roboto, sans-serif', fontSize: 7, fontWeight: 700, color: '#fff' }}>{r}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Export ──────────────────────────────────────────────────────
Object.assign(window, { PlayerProfileModal, HomePage, SquadPage, StatsPage, FixturesPage, NewsPage, TransfersPage, LeaguePage });
