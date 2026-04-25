// ── Icons ──────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = 'currentColor', sw = 1.75 }) => {
  const s = { stroke: color, strokeWidth: sw, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const icons = {
    moon:    <path {...s} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
    grid:    <><rect {...s} x="3" y="3" width="7" height="7" rx="1.5"/><rect {...s} x="14" y="3" width="7" height="7" rx="1.5"/><rect {...s} x="3" y="14" width="7" height="7" rx="1.5"/><rect {...s} x="14" y="14" width="7" height="7" rx="1.5"/></>,
    plus:    <path {...s} d="M12 5v14M5 12h14"/>,
    target:  <><circle {...s} cx="12" cy="12" r="9"/><circle {...s} cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="2" fill={color}/></>,
    clock:   <><circle {...s} cx="12" cy="12" r="9"/><path {...s} d="M12 7v5l3.5 2"/></>,
    flame:   <path {...s} d="M12 2s-5 5.5-5 10a5 5 0 0 0 10 0c0-3-2-5-2-5s-1 3.5-3 3.5S10 9 10 8c0 0 2 2.5 4.5.5C16 7 16 4 12 2z"/>,
    star:    <path {...s} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
    trash:   <><path {...s} d="M3 6h18M19 6l-1.5 14H6.5L5 6M9 6V4h6v2"/><path {...s} d="M10 11v5M14 11v5"/></>,
    edit:    <><path {...s} d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path {...s} d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></>,
    arrowR:  <path {...s} d="M5 12h14M12 5l7 7-7 7"/>,
    check:   <path {...s} d="M20 6L9 17l-5-5"/>,
    zap:     <path {...s} d="M13 2L3 14h9l-1 8 10-12h-9z"/>,
    chevR:   <path {...s} d="M9 18l6-6-6-6"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      {icons[name] || null}
    </svg>
  );
};

// ── Stat Card ──────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, accentColor, delta }) => {
  const col = accentColor || 'var(--accent)';
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--text2)', fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{
          width: 32, height: 32, borderRadius: 9, background: col + '1a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={15} color={col}/>
        </div>
      </div>
      <div>
        <div style={{ fontFamily: 'Syne', fontSize: 30, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        {(sub || delta) && (
          <div style={{ marginTop: 6, fontSize: 12, color: delta ? (delta.positive ? 'var(--green)' : 'var(--red)') : 'var(--text2)' }}>
            {delta ? `${delta.positive ? '↑' : '↓'} ${delta.label}` : sub}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Trend Chart (SVG) ──────────────────────────────────────────────────
const TrendChart = ({ sessions, targetHours = 8 }) => {
  const W = 600, H = 150;
  const P = { t: 14, r: 8, b: 4, l: 8 };
  const cW = W - P.l - P.r, cH = H - P.t - P.b;
  const minV = 4, maxV = 11, range = maxV - minV;

  const xS = i  => P.l + (i / (sessions.length - 1)) * cW;
  const yS = h  => P.t + cH - ((h - minV) / range) * cH;

  const pts  = sessions.map((s, i) => `${i === 0 ? 'M' : 'L'}${xS(i).toFixed(1)},${yS(s.duration).toFixed(1)}`);
  const line = pts.join(' ');
  const fill = line + ` L${xS(sessions.length-1).toFixed(1)},${(P.t+cH).toFixed(1)} L${xS(0).toFixed(1)},${(P.t+cH).toFixed(1)} Z`;
  const tY   = yS(targetHours).toFixed(1);
  const lX   = xS(sessions.length-1).toFixed(1);
  const lY   = yS(sessions[sessions.length-1].duration).toFixed(1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.28"/>
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[5,6,7,8,9,10].map(h => (
        <line key={h} x1={P.l} y1={yS(h)} x2={P.l+cW} y2={yS(h)} stroke="rgba(167,139,250,0.07)" strokeWidth="1"/>
      ))}
      <line x1={P.l} y1={tY} x2={P.l+cW} y2={tY} stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.4"/>
      <path d={fill} fill="url(#tGrad)"/>
      <path d={line} fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lX} cy={lY} r="5" fill="#a78bfa"/>
      <circle cx={lX} cy={lY} r="2.5" fill="var(--bg)"/>
    </svg>
  );
};

// ── Quality Donut (SVG) ────────────────────────────────────────────────
const QualityDonut = ({ distribution, avgQuality }) => {
  const total = distribution.reduce((a,b) => a+b, 0) || 1;
  const colors = ['#f87171','#fb923c','#fbbf24','#34d399','#a78bfa'];
  const R = 46, CX = 60, CY = 60, SW = 11;
  let ang = -Math.PI / 2;
  const arcs = [];
  distribution.forEach((count, i) => {
    if (!count) return;
    const sweep = (count / total) * 2 * Math.PI;
    const end = ang + sweep;
    const x1 = CX + R * Math.cos(ang), y1 = CY + R * Math.sin(ang);
    const x2 = CX + R * Math.cos(end), y2 = CY + R * Math.sin(end);
    arcs.push(
      <path key={i} d={`M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${sweep > Math.PI ? 1 : 0},1 ${x2.toFixed(2)},${y2.toFixed(2)}`}
        fill="none" stroke={colors[i]} strokeWidth={SW} strokeLinecap="round"/>
    );
    ang = end + 0.06;
  });
  return (
    <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(167,139,250,0.08)" strokeWidth={SW}/>
      {arcs}
      <text x={CX} y={CY-7} textAnchor="middle" fill="var(--text)" fontSize="22" fontWeight="800" fontFamily="Syne,sans-serif">{avgQuality.toFixed(1)}</text>
      <text x={CX} y={CY+12} textAnchor="middle" fill="var(--text2)" fontSize="9" fontFamily="DM Sans,sans-serif">avg quality</text>
    </svg>
  );
};

// ── Streak Ring (SVG) ──────────────────────────────────────────────────
const StreakRing = ({ streak, best = 30 }) => {
  const R = 68, CX = 82, CY = 82, SW = 10;
  const pct = Math.min(streak / best, 1);
  const circ = 2 * Math.PI * R;
  return (
    <svg viewBox="0 0 164 164" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="sGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c4b5fd"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
      </defs>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(167,139,250,0.09)" strokeWidth={SW}/>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#sGrad)" strokeWidth={SW}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        transform={`rotate(-90 ${CX} ${CY})`}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x={CX} y={CY-10} textAnchor="middle" fill="var(--text)" fontSize="40" fontWeight="800" fontFamily="Syne,sans-serif">{streak}</text>
      <text x={CX} y={CY+14} textAnchor="middle" fill="var(--text2)" fontSize="13" fontFamily="DM Sans,sans-serif" fontWeight="500">day streak</text>
      <text x={CX} y={CY+32} textAnchor="middle" fill="var(--muted)" fontSize="10" fontFamily="DM Sans,sans-serif">best: {best} days</text>
    </svg>
  );
};

// export to window for use in app.jsx
Object.assign(window, { Icon, StatCard, TrendChart, QualityDonut, StreakRing });
