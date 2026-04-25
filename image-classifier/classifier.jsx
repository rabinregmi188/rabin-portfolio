// ── Classification Engine ──────────────────────────────────────────────
const PROTOTYPES = [
  { label:'Landscape', vector:[0.62,0.28,0.5,0.25,0.36,0.48,0.26,0.34,0.1,0.42] },
  { label:'Portrait',  vector:[0.58,0.24,0.4,0.42,0.16,0.12,0.18,0.82,0.05,0.71] },
  { label:'Document',  vector:[0.86,0.22,0.05,0.12,0.1,0.08,0.64,0.24,0.92,0.38] },
  { label:'Night',     vector:[0.18,0.34,0.25,0.08,0.56,0.1,0.22,0.31,0.02,0.48] },
  { label:'Abstract',  vector:[0.52,0.58,0.81,0.4,0.32,0.28,0.71,0.44,0.06,0.35] },
];
const LABEL_ICONS  = { Landscape:'◈', Portrait:'◉', Document:'▤', Night:'◐', Abstract:'◆' };
const LABEL_COLORS = { Landscape:'#39e2ff', Portrait:'#ff5db1', Document:'#b3ff69', Night:'#8969ff', Abstract:'#fb923c' };

function softmax(vals){ const m=Math.max(...vals),e=vals.map(v=>Math.exp(v-m)),s=e.reduce((a,b)=>a+b,0);return e.map(v=>v/s); }
function distance(a,b){ return Math.sqrt(a.reduce((t,v,i)=>t+(v-b[i])**2,0)); }

function extractFeatures(imgData,w,h){
  const d=imgData.data,N=w*h;
  let bSum=0,bSqSum=0,satSum=0,warmC=0,coolC=0,greenC=0,docBrC=0,docSatC=0;
  const bmap=new Float32Array(N);
  for(let i=0;i<N;i++){
    const o=i*4,r=d[o]/255,g=d[o+1]/255,b=d[o+2]/255;
    const br=(r+g+b)/3,mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx-mn;
    bmap[i]=br;bSum+=br;bSqSum+=br*br;satSum+=sat;
    if(r>g&&g>b*0.7)warmC++;if(b>r&&b>g*0.8)coolC++;if(g>r&&g>b)greenC++;
    if(br>0.82)docBrC++;if(sat<0.08)docSatC++;
  }
  const brightness=bSum/N,variance=Math.max(bSqSum/N-brightness**2,0),contrast=Math.sqrt(variance),saturation=satSum/N;
  let edgeSum=0,edgeCount=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const idx=y*w+x;
    if(x+1<w){edgeSum+=Math.abs(bmap[idx]-bmap[idx+1]);edgeCount++;}
    if(y+1<h){edgeSum+=Math.abs(bmap[idx]-bmap[idx+w]);edgeCount++;}
  }
  const cy1=Math.floor(h*.25),cy2=Math.max(Math.floor(h*.75),cy1+1);
  const cx1=Math.floor(w*.25),cx2=Math.max(Math.floor(w*.75),cx1+1);
  let cSum=0,cCount=0;
  for(let y=cy1;y<cy2;y++)for(let x=cx1;x<cx2;x++){cSum+=bmap[y*w+x];cCount++;}
  return {
    brightness,contrast,saturation,
    warm_ratio:warmC/N,cool_ratio:coolC/N,green_ratio:greenC/N,
    edge_density:edgeCount?edgeSum/edgeCount:0,
    portrait_bias:Math.min(h/Math.max(w,1),2)/2,
    document_bias:(docBrC/N)*0.65+(docSatC/N)*0.35,
    center_focus:cCount?cSum/cCount:brightness,
  };
}

async function classifyFile(file){
  const url=URL.createObjectURL(file);
  const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url;});
  const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
  const imgData=ctx.getImageData(0,0,w,h);
  const feats=extractFeatures(imgData,w,h);
  const fvec=[feats.brightness,feats.contrast,feats.saturation,feats.warm_ratio,feats.cool_ratio,feats.green_ratio,feats.edge_density,feats.portrait_bias,feats.document_bias,feats.center_focus];
  const logits=PROTOTYPES.map(p=>-4*distance(p.vector,fvec));
  const probs=softmax(logits);
  const preds=PROTOTYPES.map((p,i)=>({label:p.label,confidence:+probs[i].toFixed(4)})).sort((a,b)=>b.confidence-a.confidence);
  URL.revokeObjectURL(url);
  return {label:preds[0].label,confidence:preds[0].confidence,predictions:preds,features:Object.fromEntries(Object.entries(feats).map(([k,v])=>[k,+v.toFixed(4)])),width:w,height:h};
}

async function createSampleFile(){
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=640;
  const ctx=canvas.getContext('2d');
  const g=ctx.createLinearGradient(0,0,640,640);
  g.addColorStop(0,'#ff8f6b');g.addColorStop(.4,'#ff4db8');g.addColorStop(1,'#4b6bff');
  ctx.fillStyle=g;ctx.fillRect(0,0,640,640);
  ctx.fillStyle='rgba(255,255,255,0.22)';ctx.beginPath();ctx.arc(470,180,86,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#102144';ctx.fillRect(0,460,640,180);
  ctx.fillStyle='#29d8ff';ctx.beginPath();ctx.moveTo(70,470);ctx.lineTo(230,280);ctx.lineTo(360,470);ctx.closePath();ctx.fill();
  return new Promise(res=>canvas.toBlob(b=>res(new File([b],'sample-scene.png',{type:'image/png'})),'image/png'));
}

function fmtKey(k){ return k.split('_').map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join(' '); }
const STORAGE_KEY='image-classifier-history-v1';
function loadHistory(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');}catch{return[];} }
function saveHistory(items){ localStorage.setItem(STORAGE_KEY,JSON.stringify(items)); }

// ── Icons ─────────────────────────────────────────────────────────────
const ICIcon = ({ name, size=20, color='currentColor', sw=1.75 }) => {
  const s={stroke:color,strokeWidth:sw,fill:'none',strokeLinecap:'round',strokeLinejoin:'round'};
  const icons={
    upload:<><path {...s} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path {...s} d="M17 8l-5-5-5 5M12 3v12"/></>,
    trash: <><path {...s} d="M3 6h18M19 6l-1.5 14H6.5L5 6M9 6V4h6v2"/></>,
    x:     <path {...s} d="M18 6L6 18M6 6l12 12"/>,
    img:   <><rect {...s} x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5" fill={color} stroke="none"/><path {...s} d="M21 15l-5-5L5 21"/></>,
    zap:   <path {...s} d="M13 2L3 14h9l-1 8 10-12h-9z"/>,
    clock: <><circle {...s} cx="12" cy="12" r="9"/><path {...s} d="M12 7v5l3.5 2"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>{icons[name]||null}</svg>;
};

// ── Drop Zone ─────────────────────────────────────────────────────────
const DropZone = ({ onFile, previewUrl, fileName, onClear }) => {
  const [drag,setDrag]=React.useState(false);
  const ref=React.useRef();
  const handleDrop=e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/'))onFile(f);};
  if(previewUrl) return (
    <div style={{borderRadius:16,overflow:'hidden',position:'relative',border:'1px solid var(--border2)'}}>
      <img src={previewUrl} alt="preview" style={{width:'100%',maxHeight:240,objectFit:'cover',display:'block'}}/>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(4,8,16,.85) 0%,transparent 55%)',display:'flex',alignItems:'flex-end',padding:'14px 16px',gap:10}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:10,color:'var(--cyan)',fontFamily:'IBM Plex Mono',letterSpacing:'0.1em',marginBottom:2}}>LOADED</div>
          <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{fileName}</div>
        </div>
        <button onClick={onClear} style={{background:'rgba(255,255,255,0.12)',border:'none',borderRadius:8,padding:'5px 7px',cursor:'pointer',color:'white'}}>
          <ICIcon name="x" size={14} color="white"/>
        </button>
      </div>
    </div>
  );
  return (
    <div onDragEnter={e=>{e.preventDefault();setDrag(true);}} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={handleDrop} onClick={()=>ref.current.click()} style={{
      border:`1.5px dashed ${drag?'var(--cyan)':'rgba(57,226,255,0.22)'}`,borderRadius:16,minHeight:180,cursor:'pointer',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,
      background:drag?'rgba(57,226,255,0.06)':'radial-gradient(circle at 65% 30%,rgba(137,105,255,0.09),transparent 60%)',
      transition:'all .2s',padding:'28px 20px',transform:drag?'scale(1.01)':'scale(1)',
    }}>
      <input ref={ref} type="file" accept="image/*" hidden onChange={e=>{const f=e.target.files[0];if(f)onFile(f);}}/>
      <div style={{width:54,height:54,borderRadius:16,background:'linear-gradient(135deg,rgba(57,226,255,0.15),rgba(137,105,255,0.15))',border:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <ICIcon name="upload" size={22} color="var(--cyan)"/>
      </div>
      <div style={{textAlign:'center'}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Drop an image or click to browse</div>
        <div style={{fontSize:12,color:'var(--muted)'}}>PNG, JPG, WEBP · Analysis runs locally</div>
      </div>
    </div>
  );
};

// ── Confidence Bar ────────────────────────────────────────────────────
const ConfBar = ({ label, pct, color, rank }) => (
  <div style={{display:'grid',gap:6}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div style={{display:'flex',alignItems:'center',gap:7}}>
        {rank===0&&<span style={{fontSize:9,padding:'2px 6px',borderRadius:20,background:color+'22',color,fontWeight:700,fontFamily:'IBM Plex Mono',letterSpacing:'0.05em'}}>TOP</span>}
        <span style={{fontSize:13,fontWeight:rank===0?600:400,color:rank===0?'var(--text)':'var(--muted)'}}>{label}</span>
      </div>
      <span style={{fontFamily:'IBM Plex Mono',fontSize:12,color,fontWeight:600}}>{Math.round(pct)}%</span>
    </div>
    <div style={{height:5,borderRadius:99,background:'var(--s3)',overflow:'hidden'}}>
      <div style={{height:'100%',borderRadius:'inherit',width:`${pct}%`,background:`linear-gradient(90deg,${color},${color}77)`,animation:'barIn .6s ease'}}/>
    </div>
  </div>
);

// ── Feature Cell ──────────────────────────────────────────────────────
const FeatureCell = ({ label, value }) => {
  const pct=Math.round(value*100);
  const col=pct>66?'var(--cyan)':pct>33?'var(--violet)':'var(--dim)';
  return (
    <div style={{background:'var(--s2)',border:'1px solid var(--border)',borderRadius:11,padding:'11px 13px'}}>
      <div style={{fontSize:9,color:'var(--muted)',fontFamily:'IBM Plex Mono',letterSpacing:'0.08em',marginBottom:7}}>{label.toUpperCase()}</div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{flex:1,height:3,borderRadius:99,background:'var(--s3)',overflow:'hidden'}}>
          <div style={{width:`${pct}%`,height:'100%',borderRadius:'inherit',background:col,animation:'barIn .5s ease'}}/>
        </div>
        <span style={{fontFamily:'IBM Plex Mono',fontSize:11,color:col,fontWeight:600,minWidth:30,textAlign:'right'}}>{pct}%</span>
      </div>
    </div>
  );
};

// ── History Row ───────────────────────────────────────────────────────
const HistRow = ({ item, onDelete }) => {
  const col=LABEL_COLORS[item.label]||'var(--cyan)';
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:11,background:'var(--s2)',border:'1px solid var(--border)',transition:'border-color .15s'}}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border2)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
    >
      <div style={{width:34,height:34,borderRadius:9,flexShrink:0,background:col+'1a',border:'1px solid '+col+'33',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'IBM Plex Mono',fontSize:14,color:col,fontWeight:700}}>{LABEL_ICONS[item.label]||'?'}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,fontWeight:600,color:'var(--text)',marginBottom:1}}>{item.label}</div>
        <div style={{fontSize:10,color:'var(--muted)',fontFamily:'IBM Plex Mono',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{Math.round(item.confidence*100)}% · {item.original_name}</div>
      </div>
      <button onClick={()=>onDelete(item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--dim)',padding:4,borderRadius:6,flexShrink:0,transition:'color .15s'}}
        onMouseEnter={e=>e.currentTarget.style.color='var(--pink)'}
        onMouseLeave={e=>e.currentTarget.style.color='var(--dim)'}
      ><ICIcon name="trash" size={13} color="currentColor"/></button>
    </div>
  );
};

Object.assign(window,{LABEL_ICONS,LABEL_COLORS,ICIcon,DropZone,ConfBar,FeatureCell,HistRow,classifyFile,createSampleFile,fmtKey,loadHistory,saveHistory,PROTOTYPES});
