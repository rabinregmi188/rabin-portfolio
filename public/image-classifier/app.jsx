// ── Tweaks Panel ──────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{"accentColor":"#39e2ff","bgColor":"#040810"}/*EDITMODE-END*/;

// ── Main App ───────────────────────────────────────────────────────────
const ICApp = () => {
  const [file,       setFile]       = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState('');
  const [result,     setResult]     = React.useState(null);
  const [analyzing,  setAnalyzing]  = React.useState(false);
  const [status,     setStatus]     = React.useState(null);
  const [history,    setHistory]    = React.useState(()=>loadHistory());
  const [tweaks,     setTweaks]     = React.useState(TWEAK_DEFAULTS);
  const [showTweaks, setShowTweaks] = React.useState(false);

  React.useEffect(()=>{
    document.documentElement.style.setProperty('--cyan', tweaks.accentColor);
    document.documentElement.style.setProperty('--bg', tweaks.bgColor);
  },[tweaks]);

  React.useEffect(()=>{
    const h=e=>{
      if(e.data?.type==='__activate_edit_mode')   setShowTweaks(true);
      if(e.data?.type==='__deactivate_edit_mode') setShowTweaks(false);
    };
    window.addEventListener('message',h);
    window.parent.postMessage({type:'__edit_mode_available'},'*');
    return ()=>window.removeEventListener('message',h);
  },[]);

  const applyTweak=(k,v)=>{
    const next={...tweaks,[k]:v};
    setTweaks(next);
    window.parent.postMessage({type:'__edit_mode_set_keys',edits:next},'*');
  };

  const onFile = f => {
    if(previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setStatus(null);
  };

  const onClear = () => {
    if(previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null); setPreviewUrl(''); setResult(null); setStatus(null);
  };

  const onAnalyze = async () => {
    if(!file) return;
    setAnalyzing(true); setStatus({msg:'Analyzing pixel features…',type:'info'});
    try {
      const r = await classifyFile(file);
      setResult(r);
      setStatus({msg:`Prediction complete — ${r.label} (${Math.round(r.confidence*100)}%)`,type:'success'});
      const items = [{id:Date.now(),original_name:file.name,label:r.label,confidence:r.confidence,created_at:new Date().toISOString()},...history].slice(0,12);
      setHistory(items); saveHistory(items);
    } catch(e) {
      setStatus({msg:e.message||'Analysis failed.',type:'error'});
    } finally { setAnalyzing(false); }
  };

  const onSample = async () => {
    const f = await createSampleFile();
    onFile(f); setStatus({msg:'Sample image loaded. Click Analyze to run prediction.',type:'info'});
  };

  const deleteHistItem = id => {
    const items = history.filter(x=>x.id!==id);
    setHistory(items); saveHistory(items);
  };

  // Stats
  const avgConf  = history.length ? Math.round(history.reduce((s,x)=>s+x.confidence,0)/history.length*100) : 0;
  const topLabel = (() => {
    if(!history.length) return 'None';
    const c=history.reduce((a,x)=>{a[x.label]=(a[x.label]||0)+1;return a},{});
    return Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0];
  })();

  const statusColors = { info:'var(--cyan)', success:'var(--violet)', error:'var(--pink)' };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>
      {/* Top bar */}
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'14px 28px',borderBottom:'1px solid var(--border)',
        background:'var(--s1)',flexShrink:0,
      }}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,rgba(57,226,255,0.18),rgba(137,105,255,0.18))',border:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <ICIcon name="img" size={16} color="var(--cyan)"/>
          </div>
          <div>
            <div style={{fontFamily:'IBM Plex Mono',fontWeight:600,fontSize:14,letterSpacing:'-0.01em'}}>Image Classifier</div>
            <div style={{fontSize:10,color:'var(--muted)',fontFamily:'IBM Plex Mono',letterSpacing:'0.06em'}}>VISION STUDIO · CLIENT-SIDE</div>
          </div>
        </div>

        {/* Stat pills */}
        <div style={{display:'flex',gap:10}}>
          {[
            {label:'Analyzed',val:history.length},
            {label:'Avg Confidence',val:`${avgConf}%`},
            {label:'Top Label',val:topLabel},
          ].map(s=>(
            <div key={s.label} style={{padding:'7px 14px',borderRadius:99,border:'1px solid var(--border)',background:'var(--s2)',textAlign:'center'}}>
              <div style={{fontFamily:'IBM Plex Mono',fontWeight:600,fontSize:13,color:'var(--cyan)'}}>{s.val}</div>
              <div style={{fontSize:9,color:'var(--muted)',letterSpacing:'0.07em',marginTop:1}}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{flex:1,overflow:'hidden',display:'grid',gridTemplateColumns:'340px 1fr 260px'}}>

        {/* Left: Upload panel */}
        <div style={{borderRight:'1px solid var(--border)',padding:'24px 20px',display:'flex',flexDirection:'column',gap:16,overflow:'hidden'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--muted)',letterSpacing:'0.12em'}}>UPLOAD</div>
            <button onClick={onSample} style={{fontSize:11,padding:'5px 11px',borderRadius:20,border:'1px solid var(--border)',background:'transparent',cursor:'pointer',color:'var(--muted)',fontFamily:'IBM Plex Mono',transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--text)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)';}}
            >Load Sample</button>
          </div>

          <DropZone onFile={onFile} previewUrl={previewUrl} fileName={file?.name} onClear={onClear}/>

          {/* Status */}
          {status && (
            <div style={{padding:'10px 14px',borderRadius:11,background:statusColors[status.type]+'12',border:`1px solid ${statusColors[status.type]}30`,fontSize:12,color:statusColors[status.type],lineHeight:1.5}}>
              {status.msg}
            </div>
          )}

          {/* Analyze button */}
          <button disabled={!file||analyzing} onClick={onAnalyze} style={{
            padding:'13px',borderRadius:12,border:'none',
            cursor:file&&!analyzing?'pointer':'not-allowed',
            background:file&&!analyzing?'linear-gradient(135deg,#39e2ff22,#8969ff22)':'var(--s2)',
            borderTop:`1px solid ${file&&!analyzing?'var(--border2)':'var(--border)'}`,
            borderLeft:`1px solid ${file&&!analyzing?'var(--border2)':'var(--border)'}`,
            borderRight:`1px solid ${file&&!analyzing?'var(--border2)':'var(--border)'}`,
            borderBottom:`1px solid ${file&&!analyzing?'var(--border2)':'var(--border)'}`,
            color:file&&!analyzing?'var(--text)':'var(--dim)',
            fontFamily:'IBM Plex Mono',fontWeight:600,fontSize:13,letterSpacing:'0.05em',
            display:'flex',alignItems:'center',justifyContent:'center',gap:10,
            transition:'all .2s',
          }}>
            {analyzing ? (
              <><div style={{width:14,height:14,border:'2px solid rgba(57,226,255,0.3)',borderTopColor:'var(--cyan)',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>ANALYZING…</>
            ) : (
              <><ICIcon name="zap" size={15} color={file?'var(--cyan)':'var(--dim)'}/>RUN PREDICTION</>
            )}
          </button>

          {/* Category legend */}
          <div style={{marginTop:'auto'}}>
            <div style={{fontFamily:'IBM Plex Mono',fontSize:10,color:'var(--muted)',letterSpacing:'0.1em',marginBottom:10}}>DETECTS</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {PROTOTYPES.map(p=>(
                <div key={p.label} style={{display:'flex',alignItems:'center',gap:9,fontSize:12}}>
                  <span style={{fontFamily:'IBM Plex Mono',fontSize:14,color:LABEL_COLORS[p.label]}}>{LABEL_ICONS[p.label]}</span>
                  <span style={{fontWeight:600,color:'var(--text)'}}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Results */}
        <div style={{padding:'24px',overflow:'auto',display:'flex',flexDirection:'column',gap:20}} className="fade-up">
          {!result ? (
            <div style={{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,opacity:.5}}>
              <div style={{width:72,height:72,borderRadius:22,border:'1.5px dashed rgba(57,226,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <ICIcon name="img" size={28} color="var(--muted)"/>
              </div>
              <p style={{fontFamily:'IBM Plex Mono',fontSize:13,color:'var(--muted)',textAlign:'center',maxWidth:300,lineHeight:1.6}}>Upload an image and run a prediction to see confidence bars, feature signals, and classification results.</p>
            </div>
          ) : (
            <>
              {/* Result hero */}
              <div style={{
                background:'linear-gradient(135deg,rgba(57,226,255,0.06),rgba(137,105,255,0.06))',
                border:'1px solid var(--border2)',borderRadius:18,padding:'24px',
                display:'grid',gridTemplateColumns:'200px 1fr',gap:22,alignItems:'center',
              }}>
                <img src={previewUrl} alt="result" style={{width:'100%',aspectRatio:'1/1',objectFit:'cover',borderRadius:14,border:'1px solid var(--border2)'}}/>
                <div>
                  <div style={{fontFamily:'IBM Plex Mono',fontSize:10,color:'var(--muted)',letterSpacing:'0.12em',marginBottom:12}}>PRIMARY LABEL</div>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                    <span style={{fontFamily:'IBM Plex Mono',fontSize:42,color:LABEL_COLORS[result.label]}}>{LABEL_ICONS[result.label]}</span>
                    <div>
                      <div style={{fontFamily:'Syne',fontWeight:800,fontSize:32,lineHeight:1,color:'var(--text)'}}>{result.label}</div>
                      <div style={{fontFamily:'IBM Plex Mono',fontSize:12,color:LABEL_COLORS[result.label],marginTop:4}}>{Math.round(result.confidence*100)}% confidence</div>
                    </div>
                  </div>
                  <div style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--muted)'}}>
                    {result.width} × {result.height}px
                  </div>
                </div>
              </div>

              {/* Confidence bars */}
              <div style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:16,padding:'20px'}}>
                <div style={{fontFamily:'IBM Plex Mono',fontSize:10,color:'var(--muted)',letterSpacing:'0.12em',marginBottom:16}}>ALL PREDICTIONS</div>
                <div style={{display:'flex',flexDirection:'column',gap:13}}>
                  {result.predictions.map((p,i)=>(
                    <ConfBar key={p.label} label={p.label} pct={p.confidence*100} color={LABEL_COLORS[p.label]||'var(--cyan)'} rank={i}/>
                  ))}
                </div>
              </div>

              {/* Feature signals */}
              <div style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:16,padding:'20px'}}>
                <div style={{fontFamily:'IBM Plex Mono',fontSize:10,color:'var(--muted)',letterSpacing:'0.12em',marginBottom:16}}>SIGNAL BREAKDOWN</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                  {Object.entries(result.features).map(([k,v])=>(
                    <FeatureCell key={k} label={fmtKey(k)} value={v}/>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: History */}
        <div style={{borderLeft:'1px solid var(--border)',padding:'24px 16px',display:'flex',flexDirection:'column',gap:12,overflow:'hidden'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
            <div style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--muted)',letterSpacing:'0.12em'}}>HISTORY</div>
            {history.length>0&&<button onClick={()=>{setHistory([]);saveHistory([]);}} style={{fontSize:10,color:'var(--dim)',background:'none',border:'none',cursor:'pointer',fontFamily:'IBM Plex Mono',padding:'2px 6px',borderRadius:6,transition:'color .15s'}}
              onMouseEnter={e=>e.currentTarget.style.color='var(--pink)'}
              onMouseLeave={e=>e.currentTarget.style.color='var(--dim)'}
            >CLEAR ALL</button>}
          </div>
          <div style={{overflowY:'auto',display:'flex',flexDirection:'column',gap:7,flex:1}}>
            {history.length===0 ? (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:10,opacity:.4}}>
                <ICIcon name="clock" size={24} color="var(--muted)"/>
                <p style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'var(--muted)',textAlign:'center',lineHeight:1.6}}>History will appear after your first prediction</p>
              </div>
            ) : (
              history.map(item=><HistRow key={item.id} item={item} onDelete={deleteHistItem}/>)
            )}
          </div>
        </div>
      </div>

      {/* Tweaks panel */}
      {showTweaks && (
        <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,background:'var(--s1)',border:'1px solid var(--border2)',borderRadius:16,padding:'20px',width:230,boxShadow:'0 12px 48px rgba(0,0,0,0.7)'}}>
          <div style={{fontFamily:'IBM Plex Mono',fontWeight:600,fontSize:13,marginBottom:16}}>Tweaks</div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div>
              <div style={{fontSize:10,color:'var(--muted)',fontFamily:'IBM Plex Mono',letterSpacing:'0.1em',marginBottom:8}}>ACCENT COLOR</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {['#39e2ff','#a78bfa','#ff5db1','#b3ff69','#fb923c','#fbbf24'].map(c=>(
                  <button key={c} onClick={()=>applyTweak('accentColor',c)} style={{width:26,height:26,borderRadius:'50%',border:`2px solid ${tweaks.accentColor===c?'white':'transparent'}`,background:c,cursor:'pointer'}}/>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,color:'var(--muted)',fontFamily:'IBM Plex Mono',letterSpacing:'0.1em',marginBottom:8}}>BACKGROUND</div>
              <div style={{display:'flex',gap:8}}>
                {['#040810','#080410','#040c08','#100408'].map(c=>(
                  <button key={c} onClick={()=>applyTweak('bgColor',c)} style={{width:26,height:26,borderRadius:6,border:`2px solid ${tweaks.bgColor===c?'var(--cyan)':'var(--border)'}`,background:c,cursor:'pointer'}}/>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<ICApp/>);
