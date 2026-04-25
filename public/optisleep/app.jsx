// ── Mock Data ──────────────────────────────────────────────────────────
const DURATIONS = [7.2,7.8,6.5,8.1,7.4,6.9,8.3,7.5,7.0,8.2,6.8,7.6,8.0,7.3,6.7,7.9,8.1,7.2,6.5,7.8,8.4,7.1,7.5,6.9,8.0,7.3,7.7,8.2,6.8,7.5];
const QUALITIES = [3,4,3,5,4,3,5,4,3,5,3,4,4,4,3,5,4,3,3,4,5,3,4,3,5,4,4,5,3,4];
const BEDTIMES  = ['22:45','23:00','23:30','22:30','22:45','23:15','22:15','22:30','23:00','22:15','23:30','22:45','22:30','22:45','23:15','22:00','22:30','23:00','23:45','22:45','22:15','23:00','22:30','23:15','22:00','22:45','22:30','22:00','23:30','22:45'];
const SESS_NOTES = { 5:'Woke up feeling great', 15:'Restless — work stress', 25:'Warm room, slow to fall asleep' };

const RAW_SESSIONS = DURATIONS.map((dur, i) => {
  const base = new Date('2026-04-22');
  base.setDate(base.getDate() - (29 - i));
  const [bh, bm] = BEDTIMES[i].split(':').map(Number);
  const wakeMs = base.getTime() + bh * 3600000 + bm * 60000 + dur * 3600000;
  const wakeD  = new Date(wakeMs);
  const wh = wakeD.getHours().toString().padStart(2,'0');
  const wm = wakeD.getMinutes().toString().padStart(2,'0');
  return {
    id: `s${i+1}`,
    rawDate: new Date(base),
    dateLabel: base.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}),
    shortDate: base.toLocaleDateString('en-US',{month:'short',day:'numeric'}),
    duration: dur, quality: QUALITIES[i],
    bedtime: BEDTIMES[i], wakeTime: `${wh}:${wm}`,
    notes: SESS_NOTES[i] || '',
  };
});

const GOAL = { targetHours:8, targetBedtime:'22:30', targetWakeTime:'06:30', streak:12, longestStreak:18 };

// Pre-computed star positions (deterministic, no Math.random in render)
const STARS = Array.from({length:50},(_,i)=>({
  left: ((i*73.137+11.5)%100).toFixed(2),
  top:  ((i*47.293+31.7)%100).toFixed(2),
  size: i%6===0 ? 2.5 : i%3===0 ? 1.5 : 1,
  op:   (0.18 + (i%7)*0.04).toFixed(2),
}));

// ── Shared styles ──────────────────────────────────────────────────────
const inputSt = {
  width:'100%', padding:'11px 14px', borderRadius:10,
  background:'var(--surface2)', border:'1px solid var(--border)',
  color:'var(--text)', fontSize:14, outline:'none', fontFamily:'DM Sans,sans-serif',
};
const labelSt = {
  display:'block', fontSize:11, fontWeight:600, color:'var(--text2)',
  letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:7,
};

// ── Sidebar ────────────────────────────────────────────────────────────
const NAV = [
  {id:'dashboard', label:'Dashboard', icon:'grid'},
  {id:'log',       label:'Log Sleep',  icon:'plus'},
  {id:'goals',     label:'Goals',      icon:'target'},
  {id:'history',   label:'History',    icon:'clock'},
];

const Sidebar = ({ screen, onNav }) => (
  <div style={{
    width:216, flexShrink:0, background:'var(--surface)',
    borderRight:'1px solid var(--border)',
    display:'flex', flexDirection:'column', padding:'24px 14px', gap:3,
  }}>
    {/* Logo */}
    <div style={{display:'flex',alignItems:'center',gap:10,paddingLeft:8,paddingBottom:28}}>
      <div style={{width:32,height:32,borderRadius:9,background:'var(--accent-dim)',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Icon name="moon" size={16} color="var(--accent)"/>
      </div>
      <span style={{fontFamily:'Syne',fontWeight:700,fontSize:15,letterSpacing:'-0.01em'}}>OptiSleep</span>
    </div>

    {NAV.map(item => {
      const on = screen === item.id;
      return (
        <button key={item.id} onClick={() => onNav(item.id)} style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'9px 11px', borderRadius:10, border:'none', cursor:'pointer',
          background: on ? 'var(--accent-dim)' : 'transparent',
          color: on ? 'var(--accent-light)' : 'var(--text2)',
          fontFamily:'DM Sans', fontWeight: on ? 600 : 400, fontSize:14,
          borderLeft: on ? '2px solid var(--accent)' : '2px solid transparent',
          transition:'all 0.15s', textAlign:'left',
        }}>
          <Icon name={item.icon} size={16} color={on ? 'var(--accent)' : 'var(--muted)'}/>
          {item.label}
        </button>
      );
    })}

    <div style={{flex:1}}/>

    {/* User chip */}
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 8px',borderTop:'1px solid var(--border)'}}>
      <div style={{
        width:30,height:30,borderRadius:'50%',flexShrink:0,
        background:'linear-gradient(135deg,#7c3aed,#a78bfa)',
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:12,fontWeight:700,color:'white',
      }}>R</div>
      <div>
        <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>Rabin</div>
        <div style={{fontSize:11,color:'var(--muted)'}}>12-day streak 🔥</div>
      </div>
    </div>
  </div>
);

// ── Landing ────────────────────────────────────────────────────────────
const Landing = ({ onStart }) => (
  <div style={{
    height:'100vh', overflow:'hidden',
    background:'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(109,40,217,0.3) 0%, transparent 65%), var(--bg)',
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    padding:'40px 24px', textAlign:'center', position:'relative',
  }}>
    {/* Stars */}
    <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
      {STARS.map((s,i) => (
        <div key={i} style={{
          position:'absolute', left:`${s.left}%`, top:`${s.top}%`,
          width:s.size, height:s.size, borderRadius:'50%',
          background:`rgba(196,181,253,${s.op})`,
        }}/>
      ))}
    </div>

    {/* Moon */}
    <div style={{
      width:96,height:96,borderRadius:'50%',marginBottom:44,
      background:'radial-gradient(circle at 38% 32%, #d8b4fe, #6d28d9)',
      boxShadow:'0 0 60px rgba(139,92,246,0.5), 0 0 120px rgba(139,92,246,0.18)',
      animation:'floatMoon 7s ease-in-out infinite',
      position:'relative', flexShrink:0,
    }}>
      <div style={{position:'absolute',top:'20%',left:'55%',width:18,height:18,borderRadius:'50%',background:'rgba(0,0,0,0.13)'}}/>
      <div style={{position:'absolute',top:'58%',left:'28%',width:10,height:10,borderRadius:'50%',background:'rgba(0,0,0,0.1)'}}/>
    </div>

    <h1 style={{
      fontFamily:'Syne',fontWeight:800,
      fontSize:'clamp(38px,6vw,68px)',lineHeight:1.04,
      letterSpacing:'-0.03em', marginBottom:22, maxWidth:680,
    }}>
      Sleep smarter.<br/>
      <span style={{background:'linear-gradient(90deg,#c4b5fd 0%,#a78bfa 50%,#7c3aed 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
        Wake stronger.
      </span>
    </h1>

    <p style={{fontSize:18,color:'var(--text2)',maxWidth:420,lineHeight:1.7,marginBottom:40}}>
      Track your sleep, build streaks, and understand your rest with beautiful real-time analytics.
    </p>

    <button onClick={onStart} style={{
      display:'flex',alignItems:'center',gap:10,
      padding:'14px 34px',borderRadius:100,border:'none',cursor:'pointer',
      background:'linear-gradient(135deg,#7c3aed,#a78bfa)',
      color:'white',fontFamily:'DM Sans',fontWeight:600,fontSize:16,
      animation:'pulseGlow 3s ease-in-out infinite',
      transition:'transform 0.15s',
    }}
      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
      onMouseLeave={e=>e.currentTarget.style.transform=''}
    >
      Get started <Icon name="arrowR" size={18} color="white"/>
    </button>

    {/* Feature cards */}
    <div style={{display:'flex',gap:18,marginTop:64,flexWrap:'wrap',justifyContent:'center',maxWidth:700}}>
      {[
        {icon:'grid',  title:'Analytics',      desc:'Trend charts & 30-day sleep insights'},
        {icon:'target',title:'Goals & Streaks', desc:'Build lasting habits with daily targets'},
        {icon:'zap',   title:'Smart Insights',  desc:'Personalised recommendations each night'},
      ].map(f=>(
        <div key={f.title} style={{
          flex:'1 1 180px',
          background:'rgba(255,255,255,0.025)',border:'1px solid var(--border)',
          borderRadius:18,padding:'22px 20px',backdropFilter:'blur(12px)',textAlign:'left',
        }}>
          <div style={{color:'var(--accent)',marginBottom:12}}>
            <Icon name={f.icon} size={20} color="var(--accent)"/>
          </div>
          <div style={{fontFamily:'Syne',fontWeight:700,fontSize:15,marginBottom:6}}>{f.title}</div>
          <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.55}}>{f.desc}</div>
        </div>
      ))}
    </div>
  </div>
);

// ── Dashboard ──────────────────────────────────────────────────────────
const Dashboard = ({ sessions, goal, onNav }) => {
  const avg      = (sessions.reduce((s,x)=>s+x.duration,0)/sessions.length).toFixed(1);
  const avgQ     = sessions.reduce((s,x)=>s+x.quality,0)/sessions.length;
  const wkAvg    = sessions.slice(-7).reduce((s,x)=>s+x.duration,0)/7;
  const pwAvg    = sessions.slice(-14,-7).reduce((s,x)=>s+x.duration,0)/7;
  const delta    = (wkAvg - pwAvg).toFixed(1);
  const qualDist = [0,0,0,0,0];
  sessions.forEach(s=>qualDist[s.quality-1]++);
  const qualColors = ['#f87171','#fb923c','#fbbf24','#34d399','#a78bfa'];
  const qualLabels = ['Terrible','Poor','Okay','Good','Excellent'];
  const h = new Date().getHours();
  const greeting = h<12?'Good morning':h<18?'Good afternoon':'Good evening';

  return (
    <div style={{padding:'26px 30px',overflowY:'auto',height:'100%',display:'flex',flexDirection:'column',gap:20}} className="fade-up">
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h1 style={{fontFamily:'Syne',fontSize:22,fontWeight:700,marginBottom:3}}>{greeting}, Rabin</h1>
          <p style={{color:'var(--text2)',fontSize:13}}>Tuesday, April 22 · 30-day overview</p>
        </div>
        <button onClick={()=>onNav('log')} style={{
          display:'flex',alignItems:'center',gap:7,
          padding:'9px 20px',borderRadius:100,border:'none',cursor:'pointer',
          background:'var(--accent)',color:'white',fontFamily:'DM Sans',fontWeight:600,fontSize:13,
          transition:'opacity 0.15s',
        }}
          onMouseEnter={e=>e.currentTarget.style.opacity='0.85'}
          onMouseLeave={e=>e.currentTarget.style.opacity='1'}
        >
          <Icon name="plus" size={14} color="white"/> Log Sleep
        </button>
      </div>

      {/* Insight */}
      <div style={{
        background:'linear-gradient(135deg,rgba(109,40,217,0.18),rgba(167,139,250,0.08))',
        border:'1px solid rgba(167,139,250,0.2)', borderRadius:13,
        padding:'13px 18px', display:'flex', alignItems:'center', gap:12,
      }}>
        <Icon name="zap" size={15} color="var(--accent-light)"/>
        <p style={{fontSize:13.5,color:'var(--accent-light)',lineHeight:1.55}}>
          <strong>{goal.streak}-day streak!</strong> You averaged {avg}h this week — {parseFloat(delta)>=0 ? `up ${delta}h` : `${Math.abs(delta)}h below`} from last week. Keep the consistency going.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
        <StatCard label="Avg Sleep"      value={`${avg}h`}          icon="moon"   delta={{positive:parseFloat(delta)>=0, label:`${Math.abs(delta)}h vs last week`}}/>
        <StatCard label="Streak"         value={`${goal.streak}d`}  icon="flame"  accentColor="var(--orange)" sub="consecutive nights"/>
        <StatCard label="Avg Quality"    value={`${avgQ.toFixed(1)}/5`} icon="star" accentColor="var(--amber)" sub="out of 5"/>
        <StatCard label="Total Sessions" value={sessions.length}    icon="grid"   sub="past 30 days"/>
      </div>

      {/* Charts row */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:18}}>
        {/* Trend */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:'20px 22px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <h3 style={{fontFamily:'Syne',fontWeight:700,fontSize:14}}>Sleep Trend · 30 days</h3>
            <span style={{fontSize:11,color:'var(--muted)',display:'flex',alignItems:'center',gap:6}}>
              <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 3"/></svg>
              {goal.targetHours}h target
            </span>
          </div>
          <div style={{height:148}}>
            <TrendChart sessions={sessions} targetHours={goal.targetHours}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:6,color:'var(--muted)',fontSize:11}}>
            <span>{sessions[0].shortDate}</span><span>{sessions[sessions.length-1].shortDate}</span>
          </div>
        </div>

        {/* Quality donut */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:'20px 22px',display:'flex',flexDirection:'column'}}>
          <h3 style={{fontFamily:'Syne',fontWeight:700,fontSize:14,marginBottom:14}}>Quality Distribution</h3>
          <div style={{display:'flex',alignItems:'center',gap:16,flex:1}}>
            <div style={{width:110,height:110,flexShrink:0}}>
              <QualityDonut distribution={qualDist} avgQuality={avgQ}/>
            </div>
            <div style={{flex:1}}>
              {qualLabels.map((lbl,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}>
                  <div style={{width:Math.max(3,qualDist[i]/sessions.length*52),height:4,borderRadius:2,background:qualColors[i],flexShrink:0}}/>
                  <span style={{fontSize:11,color:'var(--text2)',whiteSpace:'nowrap'}}>{lbl} <span style={{color:'var(--muted)'}}>({qualDist[i]})</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:'20px 22px'}}>
        <h3 style={{fontFamily:'Syne',fontWeight:700,fontSize:14,marginBottom:14}}>Quick Actions</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[
            {id:'log',     icon:'plus',   label:'Log Sleep',  sub:'Record last night'},
            {id:'goals',   icon:'target', label:'Goals',      sub:`${goal.streak}-day streak`},
            {id:'history', icon:'clock',  label:'History',    sub:'All sessions'},
          ].map(a=>(
            <button key={a.id} onClick={()=>onNav(a.id)} style={{
              display:'flex',alignItems:'center',gap:12,
              padding:'13px 15px',borderRadius:12,
              border:'1px solid var(--border)',background:'transparent',cursor:'pointer',
              textAlign:'left',transition:'background 0.15s,border-color 0.15s',
            }}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-dim)';e.currentTarget.style.borderColor='var(--border2)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='var(--border)';}}
            >
              <div style={{width:34,height:34,borderRadius:9,background:'var(--accent-dim)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Icon name={a.icon} size={15} color="var(--accent)"/>
              </div>
              <div>
                <div style={{fontWeight:600,fontSize:13,color:'var(--text)'}}>{a.label}</div>
                <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{a.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Log Sleep ──────────────────────────────────────────────────────────
const LogSleep = ({ onLog, onBack }) => {
  const [form, setForm] = React.useState({ date:'2026-04-22', bedtime:'22:30', wakeTime:'06:30', quality:4, notes:'' });
  const [done, setDone] = React.useState(false);
  const qualColors = ['#f87171','#fb923c','#fbbf24','#34d399','#a78bfa'];
  const qualLabels = ['Terrible','Poor','Okay','Good','Excellent'];

  const duration = React.useMemo(() => {
    const b = new Date(`${form.date}T${form.bedtime}:00`);
    let w = new Date(`${form.date}T${form.wakeTime}:00`);
    if (w <= b) w.setDate(w.getDate()+1);
    return ((w-b)/3600000).toFixed(1);
  },[form.date,form.bedtime,form.wakeTime]);

  if (done) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:18}} className="fade-up">
      <div style={{width:70,height:70,borderRadius:'50%',background:'rgba(110,231,183,0.12)',border:'2px solid var(--green)',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Icon name="check" size={30} color="var(--green)"/>
      </div>
      <h2 style={{fontFamily:'Syne',fontWeight:700,fontSize:22}}>Sleep logged!</h2>
      <p style={{color:'var(--text2)',fontSize:14}}>Heading back to dashboard…</p>
    </div>
  );

  return (
    <div style={{padding:'26px 30px',overflowY:'auto',height:'100%'}} className="fade-up">
      <div style={{maxWidth:500,margin:'0 auto'}}>
        <button onClick={onBack} style={{background:'none',border:'none',color:'var(--text2)',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',gap:6,marginBottom:24,fontFamily:'DM Sans'}}>
          ← Back
        </button>
        <h1 style={{fontFamily:'Syne',fontWeight:700,fontSize:22,marginBottom:6}}>Log Sleep</h1>
        <p style={{color:'var(--text2)',fontSize:13,marginBottom:30}}>Record how you slept last night</p>

        <div style={{display:'flex',flexDirection:'column',gap:22}}>
          {/* Date */}
          <div>
            <label style={labelSt}>Date</label>
            <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inputSt}/>
          </div>

          {/* Times */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div>
              <label style={labelSt}>Bedtime</label>
              <input type="time" value={form.bedtime} onChange={e=>setForm(f=>({...f,bedtime:e.target.value}))} style={inputSt}/>
            </div>
            <div>
              <label style={labelSt}>Wake Time</label>
              <input type="time" value={form.wakeTime} onChange={e=>setForm(f=>({...f,wakeTime:e.target.value}))} style={inputSt}/>
            </div>
          </div>

          {/* Duration */}
          <div style={{background:'var(--accent-dim)',border:'1px solid var(--border2)',borderRadius:12,padding:'14px',textAlign:'center'}}>
            <span style={{color:'var(--text2)',fontSize:13}}>Duration · </span>
            <span style={{fontFamily:'Syne',fontSize:30,fontWeight:800,color:'var(--accent)'}}>{duration}h</span>
          </div>

          {/* Quality */}
          <div>
            <label style={labelSt}>Sleep Quality</label>
            <div style={{display:'flex',gap:8}}>
              {[1,2,3,4,5].map(n=>{
                const on = form.quality >= n;
                return (
                  <button key={n} onClick={()=>setForm(f=>({...f,quality:n}))} style={{
                    flex:1, padding:'12px 0', borderRadius:12, border:`1.5px solid`,
                    borderColor: on ? qualColors[n-1] : 'var(--border)',
                    background: on ? qualColors[n-1]+'18' : 'transparent',
                    cursor:'pointer', transition:'all 0.15s',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                  }}>
                    <span style={{fontSize:20,fontWeight:800,fontFamily:'Syne',color:on?qualColors[n-1]:'var(--muted)'}}>{n}</span>
                    <span style={{fontSize:9,letterSpacing:'0.03em',color:on?qualColors[n-1]:'var(--muted)',fontWeight:600}}>{qualLabels[n-1]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelSt}>Notes <span style={{fontWeight:400,textTransform:'none',letterSpacing:0,color:'var(--muted)'}}>— optional</span></label>
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
              placeholder="How did you sleep? Any dreams?" rows={3}
              style={{...inputSt,resize:'none'}}/>
          </div>

          {/* Submit */}
          <button onClick={()=>{setDone(true);setTimeout(onLog,1600);}} style={{
            padding:'14px',borderRadius:12,border:'none',cursor:'pointer',
            background:'linear-gradient(135deg,#6d28d9,#a78bfa)',
            color:'white',fontFamily:'DM Sans',fontWeight:600,fontSize:15,
            boxShadow:'0 4px 20px rgba(109,40,217,0.4)',
            transition:'transform 0.15s,box-shadow 0.15s',
          }}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
            onMouseLeave={e=>e.currentTarget.style.transform=''}
          >
            Log Sleep Session
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Goals ──────────────────────────────────────────────────────────────
const Goals = ({ goal }) => {
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({ targetHours:goal.targetHours, targetBedtime:goal.targetBedtime, targetWakeTime:goal.targetWakeTime });
  const pct = Math.round(goal.streak / 30 * 100);

  return (
    <div style={{padding:'26px 30px',overflowY:'auto',height:'100%'}} className="fade-up">
      <div style={{maxWidth:560,margin:'0 auto'}}>
        <h1 style={{fontFamily:'Syne',fontWeight:700,fontSize:22,marginBottom:5}}>Sleep Goals</h1>
        <p style={{color:'var(--text2)',fontSize:13,marginBottom:28}}>Your targets and streak progress</p>

        {/* Streak card */}
        <div style={{
          background:'var(--surface)',border:'1px solid var(--border)',
          borderRadius:20,padding:'28px 32px',
          display:'flex',alignItems:'center',gap:32,marginBottom:18,
        }}>
          <div style={{width:164,height:164,flexShrink:0}}>
            <StreakRing streak={goal.streak} best={goal.longestStreak}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Syne',fontWeight:700,fontSize:18,marginBottom:10}}>You're on a roll</div>
            <p style={{color:'var(--text2)',fontSize:13.5,lineHeight:1.65,marginBottom:18}}>
              {goal.streak} consecutive nights hitting your {goal.targetHours}h goal. Only {goal.longestStreak - goal.streak} nights away from your personal best.
            </p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
              {[
                {val:goal.streak,     lbl:'Current',  col:'var(--accent)'},
                {val:goal.longestStreak, lbl:'Best',  col:'var(--amber)'},
                {val:`${pct}%`,       lbl:'Monthly',  col:'var(--green)'},
              ].map(x=>(
                <div key={x.lbl} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:10,padding:'12px',textAlign:'center'}}>
                  <div style={{fontFamily:'Syne',fontWeight:800,fontSize:22,color:x.col}}>{x.val}</div>
                  <div style={{fontSize:11,color:'var(--text2)',marginTop:3}}>{x.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Goal detail */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:20,padding:'24px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <h3 style={{fontFamily:'Syne',fontWeight:700,fontSize:15}}>Current Goal</h3>
            <button onClick={()=>setEditing(e=>!e)} style={{
              background:'var(--accent-dim)',border:'1px solid var(--border2)',
              borderRadius:8,padding:'6px 14px',cursor:'pointer',
              color:'var(--accent)',fontSize:13,fontWeight:600,fontFamily:'DM Sans',
            }}>{editing ? 'Cancel' : 'Edit'}</button>
          </div>

          {editing ? (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div>
                <label style={labelSt}>Target Hours</label>
                <input type="number" min="4" max="12" step="0.5" value={form.targetHours}
                  onChange={e=>setForm(f=>({...f,targetHours:parseFloat(e.target.value)}))} style={inputSt}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div><label style={labelSt}>Bedtime</label><input type="time" value={form.targetBedtime} onChange={e=>setForm(f=>({...f,targetBedtime:e.target.value}))} style={inputSt}/></div>
                <div><label style={labelSt}>Wake Time</label><input type="time" value={form.targetWakeTime} onChange={e=>setForm(f=>({...f,targetWakeTime:e.target.value}))} style={inputSt}/></div>
              </div>
              <button onClick={()=>setEditing(false)} style={{padding:'12px',borderRadius:10,border:'none',cursor:'pointer',background:'var(--accent)',color:'white',fontFamily:'DM Sans',fontWeight:600,fontSize:14}}>
                Save Goal
              </button>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {[{lbl:'Target',val:`${form.targetHours}h`},{lbl:'Bedtime',val:form.targetBedtime},{lbl:'Wake Up',val:form.targetWakeTime}].map(x=>(
                <div key={x.lbl} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:12,padding:'18px',textAlign:'center'}}>
                  <div style={{fontFamily:'Syne',fontWeight:800,fontSize:24,color:'var(--text)',marginBottom:5}}>{x.val}</div>
                  <div style={{fontSize:11,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{x.lbl}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── History ────────────────────────────────────────────────────────────
const History = ({ sessions, onLog }) => {
  const [removed, setRemoved] = React.useState(new Set());
  const qualColors = ['#f87171','#fb923c','#fbbf24','#34d399','#a78bfa'];
  const qualLabels = ['Terrible','Poor','Okay','Good','Excellent'];
  const visible = sessions.filter(s=>!removed.has(s.id)).slice().reverse();

  return (
    <div style={{padding:'26px 30px',overflowY:'auto',height:'100%'}} className="fade-up">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
        <div>
          <h1 style={{fontFamily:'Syne',fontWeight:700,fontSize:22,marginBottom:3}}>Sleep History</h1>
          <p style={{color:'var(--text2)',fontSize:13}}>{visible.length} sessions recorded</p>
        </div>
        <button onClick={onLog} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 20px',borderRadius:100,border:'none',cursor:'pointer',background:'var(--accent)',color:'white',fontFamily:'DM Sans',fontWeight:600,fontSize:13}}>
          <Icon name="plus" size={14} color="white"/> Log Sleep
        </button>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:9}}>
        {visible.map(s=>(
          <div key={s.id} style={{
            background:'var(--surface)',border:'1px solid var(--border)',
            borderLeft:`3px solid ${qualColors[s.quality-1]}`,
            borderRadius:13,padding:'14px 18px',
            display:'flex',alignItems:'center',gap:16,
            transition:'border-color 0.2s',
          }}>
            {/* Quality number */}
            <div style={{textAlign:'center',flexShrink:0,width:36}}>
              <div style={{fontFamily:'Syne',fontWeight:800,fontSize:20,color:qualColors[s.quality-1],lineHeight:1}}>{s.quality}</div>
              <div style={{fontSize:9,color:'var(--muted)',letterSpacing:'0.04em'}}>/5</div>
            </div>

            <div style={{width:1,height:34,background:'var(--border)',flexShrink:0}}/>

            {/* Info */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:3,flexWrap:'wrap'}}>
                <span style={{fontWeight:600,fontSize:14}}>{s.dateLabel}</span>
                <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'var(--accent-dim)',color:'var(--accent)',fontWeight:600}}>{s.duration}h</span>
                <span style={{fontSize:11,color:qualColors[s.quality-1],fontWeight:500}}>{qualLabels[s.quality-1]}</span>
              </div>
              <p style={{fontSize:12.5,color:'var(--text2)'}}>
                {s.bedtime} → {s.wakeTime}
                {s.notes && <span style={{color:'var(--muted)'}}> · {s.notes}</span>}
              </p>
            </div>

            {/* Delete */}
            <button onClick={()=>setRemoved(r=>new Set([...r,s.id]))} style={{
              background:'none',border:'none',cursor:'pointer',
              color:'var(--muted)',padding:7,borderRadius:8,flexShrink:0,
              transition:'color 0.15s,background 0.15s',
            }}
              onMouseEnter={e=>{e.currentTarget.style.color='var(--red)';e.currentTarget.style.background='rgba(248,113,113,0.1)';}}
              onMouseLeave={e=>{e.currentTarget.style.color='var(--muted)';e.currentTarget.style.background='none';}}
            >
              <Icon name="trash" size={14} color="currentColor"/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Tweaks Panel ───────────────────────────────────────────────────────
const TweaksPanel = ({ tweaks, onTweak }) => (
  <div style={{
    position:'fixed',bottom:24,right:24,zIndex:9999,
    background:'var(--surface)',border:'1px solid var(--border2)',
    borderRadius:16,padding:'20px',width:230,
    boxShadow:'0 12px 48px rgba(0,0,0,0.6)',
  }}>
    <div style={{fontFamily:'Syne',fontWeight:700,fontSize:14,marginBottom:16}}>Tweaks</div>
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div>
        <label style={{...labelSt,marginBottom:8}}>Accent Color</label>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {['#a78bfa','#60a5fa','#34d399','#f472b6','#fb923c','#facc15'].map(c=>(
            <button key={c} onClick={()=>onTweak('accentColor',c)} style={{
              width:26,height:26,borderRadius:'50%',
              border:`2px solid ${tweaks.accentColor===c?'white':'transparent'}`,
              background:c,cursor:'pointer',transition:'transform 0.15s',
            }}/>
          ))}
        </div>
      </div>
      <div>
        <label style={{...labelSt,marginBottom:8}}>Background</label>
        <div style={{display:'flex',gap:8}}>
          {['#07050e','#050c14','#050e0a','#0e0508'].map(c=>(
            <button key={c} onClick={()=>onTweak('bgColor',c)} style={{
              width:26,height:26,borderRadius:6,
              border:`2px solid ${tweaks.bgColor===c?'var(--accent)':'var(--border)'}`,
              background:c,cursor:'pointer',
            }}/>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ── App ────────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{"accentColor":"#a78bfa","bgColor":"#07050e"}/*EDITMODE-END*/;

const App = () => {
  const [screen, setScreen] = React.useState(() => localStorage.getItem('optisleep_screen') || 'landing');
  const [tweaks, setTweaks] = React.useState(TWEAK_DEFAULTS);
  const [showTweaks, setShowTweaks] = React.useState(false);

  const nav = s => { setScreen(s); localStorage.setItem('optisleep_screen', s); };

  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', tweaks.accentColor);
    document.documentElement.style.setProperty('--accent-light', tweaks.accentColor + 'ee');
    document.documentElement.style.setProperty('--accent-dim', tweaks.accentColor + '1e');
    document.documentElement.style.setProperty('--accent-glow', tweaks.accentColor + '44');
    document.documentElement.style.setProperty('--bg', tweaks.bgColor);
  }, [tweaks]);

  React.useEffect(() => {
    const h = e => {
      if (e.data?.type === '__activate_edit_mode')   setShowTweaks(true);
      if (e.data?.type === '__deactivate_edit_mode') setShowTweaks(false);
    };
    window.addEventListener('message', h);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', h);
  }, []);

  const applyTweak = (k, v) => {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: next }, '*');
  };

  if (screen === 'landing') return (
    <>
      <Landing onStart={() => nav('dashboard')}/>
      {showTweaks && <TweaksPanel tweaks={tweaks} onTweak={applyTweak}/>}
    </>
  );

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar screen={screen} onNav={nav}/>
      <div style={{ flex:1, overflow:'hidden' }}>
        {screen === 'dashboard' && <Dashboard sessions={RAW_SESSIONS} goal={GOAL} onNav={nav}/>}
        {screen === 'log'       && <LogSleep  onLog={()=>nav('dashboard')} onBack={()=>nav('dashboard')}/>}
        {screen === 'goals'     && <Goals     goal={GOAL}/>}
        {screen === 'history'   && <History   sessions={RAW_SESSIONS} onLog={()=>nav('log')}/>}
      </div>
      {showTweaks && <TweaksPanel tweaks={tweaks} onTweak={applyTweak}/>}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
