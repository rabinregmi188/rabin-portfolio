// ── Storage & Helpers ─────────────────────────────────────────────────
const SN_KEY    = 'smartnotes.v1';
const THEME_KEY = 'smartnotes.theme';

function escHtml(v){ return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }
function inlineMd(text){
  const codes=[];
  text=text.replace(/`([^`\n]+)`/g,(_,c)=>{const i=codes.length;codes.push(c);return`\u0001C${i}\u0001`;});
  text=escHtml(text);
  text=text.replace(/\*\*([^*\n]+?)\*\*/g,'<strong>$1</strong>');
  text=text.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g,'$1<em>$2</em>');
  text=text.replace(/(^|[^_\w])_([^_\n]+?)_(?!\w)/g,'$1<em>$2</em>');
  text=text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,(_,label,url)=>{const safe=/^(https?:\/\/|mailto:|#|\/)/.test(url)?url:'#';return`<a href="${escHtml(safe)}" target="_blank" rel="noopener noreferrer">${label}</a>`;});
  text=text.replace(/\u0001C(\d+)\u0001/g,(_,i)=>`<code>${escHtml(codes[+i])}</code>`);
  return text;
}
function renderMd(src){
  if(!src) return '';
  const codeBlocks=[];
  src=src.replace(/```(\w*)\n?([\s\S]*?)```/g,(_,lang,code)=>{const i=codeBlocks.length;codeBlocks.push({lang,code});return`\u0000CB${i}\u0000`;});
  return src.split(/\n{2,}/).map(b=>b.trim()).filter(Boolean).map(block=>{
    const cbM=block.match(/^\u0000CB(\d+)\u0000$/);
    if(cbM){const{code}=codeBlocks[+cbM[1]];return`<pre><code>${escHtml(code.replace(/\n$/,''))}</code></pre>`;}
    const h=block.match(/^(#{1,3})\s+(.+)$/);
    if(h&&!block.includes('\n')) return`<h${h[1].length}>${inlineMd(h[2])}</h${h[1].length}>`;
    const lines=block.split('\n');
    if(lines.every(l=>/^>\s?/.test(l))) return`<blockquote>${lines.map(l=>inlineMd(l.replace(/^>\s?/,''))).join('<br>')}</blockquote>`;
    if(lines.every(l=>/^[-*]\s+/.test(l))) return`<ul>${lines.map(l=>`<li>${inlineMd(l.replace(/^[-*]\s+/,''))}</li>`).join('')}</ul>`;
    if(lines.every(l=>/^\d+\.\s+/.test(l))) return`<ol>${lines.map(l=>`<li>${inlineMd(l.replace(/^\d+\.\s+/,''))}</li>`).join('')}</ol>`;
    if(/^(-{3,}|\*{3,})$/.test(block)) return'<hr/>';
    return`<p>${lines.map(inlineMd).join('<br>')}</p>`;
  }).join('');
}

function loadNotes(){
  try{const s=JSON.parse(localStorage.getItem(SN_KEY)||'{}');return{notes:s.notes||[],selectedId:s.selectedId||''};}
  catch{return{notes:[],selectedId:''};}
}
function saveNotes(st){ localStorage.setItem(SN_KEY,JSON.stringify({notes:st.notes,selectedId:st.selectedId})); }
function parseTags(v){ return[...new Set(v.split(',').map(t=>t.trim().toLowerCase()).filter(Boolean))]; }
function tagHue(tag){ let h=0;for(let i=0;i<tag.length;i++)h=(h*31+tag.charCodeAt(i))>>>0;return h%360; }
function snippet(text){ return text.replace(/[#>*_`]/g,'').replace(/\s+/g,' ').trim().slice(0,90); }

function demoNotes(){
  const now=new Date().toISOString();
  return[
    {id:crypto.randomUUID(),title:'Portfolio refresh',content:'# Portfolio refresh\n\nAdd a project spotlight section for shipped work.\n\n## Priorities\n\n- Stronger visual hierarchy for featured apps\n- Short 30-second demo clip per project\n- Link straight to the live app and the repo\n\n> Keep the copy tight — one paragraph per project is plenty.',tags:['portfolio','ideas','frontend'],pinned:true,updatedAt:now},
    {id:crypto.randomUUID(),title:'Interview prep checklist',content:'## This week\n\n- Review JavaScript fundamentals (event loop, closures, prototypes)\n- Practice explaining projects clearly — 90-second pitch each\n\n## System design primer\n\n`caching`, `load balancers`, `queues` — revisit the basics.',tags:['career','prep'],pinned:false,updatedAt:now},
    {id:crypto.randomUUID(),title:'Study plan',content:'# Study plan\n\nFocus this week on **data structures** and **system design**.\n\n1. One coding problem per day\n2. Re-read the hashing chapter\n3. Summarize each topic in your own words\n\n> Consistency beats intensity.',tags:['school','cs'],pinned:false,updatedAt:now},
  ];
}

// ── Icons ─────────────────────────────────────────────────────────────
const I = ({name,size=16,color='currentColor',sw=1.8})=>{
  const s={stroke:color,strokeWidth:sw,fill:'none',strokeLinecap:'round',strokeLinejoin:'round'};
  const icons={
    plus:   <path {...s} d="M12 5v14M5 12h14"/>,
    search: <><circle {...s} cx="11" cy="11" r="7"/><path {...s} d="M21 21l-4.35-4.35"/></>,
    pin:    <><path {...s} d="M12 17v5"/><path {...s} d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></>,
    copy:   <><rect {...s} x="9" y="9" width="13" height="13" rx="2"/><path {...s} d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    trash:  <><path {...s} d="M3 6h18M19 6l-1.5 14H6.5L5 6M9 6V4h6v2"/></>,
    sun:    <><circle {...s} cx="12" cy="12" r="4"/><path {...s} d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
    moon:   <path {...s} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
    export: <><path {...s} d="M14 3h7v7"/><path {...s} d="M10 14 21 3"/><path {...s} d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>,
    file:   <><path {...s} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline {...s} points="14 2 14 8 20 8"/></>,
    x:      <path {...s} d="M18 6L6 18M6 6l12 12"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>{icons[name]||null}</svg>;
};

// ── Tag Chip ──────────────────────────────────────────────────────────
const TagChip = ({tag,active,onClick,dark=false})=>{
  const hue=tagHue(tag);
  const bgLight=`hsla(${hue},70%,50%,0.1)`;
  const bgDark =`hsla(${hue},60%,60%,0.15)`;
  const colLight=`hsl(${hue},60%,35%)`;
  const colDark =`hsl(${hue},70%,72%)`;
  const bg  = active ? `hsl(${hue},65%,48%)` : (dark ? bgDark : bgLight);
  const col = active ? 'white' : (dark ? colDark : colLight);
  return(
    <button onClick={onClick} style={{
      display:'inline-flex',alignItems:'center',
      padding:'3px 9px',borderRadius:4,fontWeight:700,cursor:onClick?'pointer':'default',
      fontFamily:'JetBrains Mono,monospace',fontSize:10.5,transition:'all .15s',
      background:bg,color:col,border:'none',letterSpacing:'0.02em',
    }}># {tag}</button>
  );
};

// ── Note Card ─────────────────────────────────────────────────────────
const NoteCard = ({note,active,onClick})=>{
  const isNew=!note.title&&!note.content;
  return(
    <div onClick={onClick} className={active?'fade-in':''} style={{
      padding:'12px 14px',cursor:'pointer',borderRadius:8,
      background:active?'var(--sb-s2)':'transparent',
      borderLeft:`2px solid ${active?'var(--cyan)':'transparent'}`,
      transition:'all .12s', marginBottom:1,
    }}
      onMouseEnter={e=>{if(!active)e.currentTarget.style.background='rgba(255,255,255,0.04)';}}
      onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent';}}
    >
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4,gap:6}}>
        <span style={{
          fontSize:13,fontWeight:600,color:active?'white':'var(--sb-text)',
          lineHeight:1.35,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,
        }}>
          {note.title||<em style={{color:'var(--sb-muted)',fontWeight:400}}>Untitled</em>}
        </span>
        {note.pinned&&<span style={{fontSize:11,flexShrink:0,opacity:.7}}>📌</span>}
      </div>
      {!isNew&&<p style={{fontSize:11.5,color:'var(--sb-muted)',lineHeight:1.5,marginBottom:5,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
        {snippet(note.content)||'No content yet.'}
      </p>}
      <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
        {note.tags.slice(0,2).map(t=><TagChip key={t} tag={t} dark/>)}
        <span style={{fontSize:10,color:'var(--sb-muted)',marginLeft:'auto',fontFamily:'JetBrains Mono,monospace'}}>
          {new Date(note.updatedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
        </span>
      </div>
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────
const useToast=()=>{
  const [toasts,setToasts]=React.useState([]);
  const show=(msg,type='info')=>{const id=Date.now();setToasts(t=>[...t,{id,msg,type}]);setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),2400);};
  return[toasts,show];
};

// ── App ───────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS=/*EDITMODE-BEGIN*/{"accent":"#06b6d4","darkEditor":false}/*EDITMODE-END*/;

const SNApp=()=>{
  const [data,setData]     = React.useState(loadNotes);
  const [search,setSearch] = React.useState('');
  const [activeTag,setTag] = React.useState('');
  const [darkEd,setDarkEd] = React.useState(false);
  const [saveState,setSS]  = React.useState('saved');
  const [toasts,showToast] = useToast();
  const autoRef            = React.useRef(null);
  const [showTweaks,setShowTweaks]=React.useState(false);
  const [tweaks,setTweaks] = React.useState(TWEAK_DEFAULTS);

  React.useEffect(()=>{
    document.documentElement.style.setProperty('--cyan',tweaks.accent);
    document.documentElement.style.setProperty('--cyan-l',tweaks.accent+'cc');
    document.documentElement.style.setProperty('--cyan-d',tweaks.accent+'1a');
  },[tweaks]);

  // Dark editor mode
  React.useEffect(()=>{
    const r=document.documentElement;
    if(darkEd){
      r.style.setProperty('--ed-bg','#1a1825');
      r.style.setProperty('--ed-s1','#211f30');
      r.style.setProperty('--ed-border','rgba(255,255,255,0.08)');
      r.style.setProperty('--ed-text','#e8e4f8');
      r.style.setProperty('--ed-text2','#8b85a8');
      r.style.setProperty('--ed-muted','#5a5472');
    } else {
      r.style.setProperty('--ed-bg','#ffffff');
      r.style.setProperty('--ed-s1','#f7f8fa');
      r.style.setProperty('--ed-border','#e8eaed');
      r.style.setProperty('--ed-text','#111318');
      r.style.setProperty('--ed-text2','#6b7280');
      r.style.setProperty('--ed-muted','#9ca3af');
    }
  },[darkEd]);

  React.useEffect(()=>{
    const h=e=>{
      if(e.data?.type==='__activate_edit_mode')   setShowTweaks(true);
      if(e.data?.type==='__deactivate_edit_mode') setShowTweaks(false);
    };
    window.addEventListener('message',h);
    window.parent.postMessage({type:'__edit_mode_available'},'*');
    return()=>window.removeEventListener('message',h);
  },[]);

  const applyTweak=(k,v)=>{
    const next={...tweaks,[k]:v};setTweaks(next);
    window.parent.postMessage({type:'__edit_mode_set_keys',edits:next},'*');
  };

  const selected=data.notes.find(n=>n.id===data.selectedId);
  const allTags=[...new Set(data.notes.flatMap(n=>n.tags))].sort();

  const visible=React.useMemo(()=>{
    let ns=[...data.notes];
    if(search) ns=ns.filter(n=>`${n.title} ${n.content} ${n.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
    if(activeTag) ns=ns.filter(n=>n.tags.includes(activeTag));
    return ns.sort((a,b)=>{if(a.pinned!==b.pinned) return a.pinned?-1:1;return new Date(b.updatedAt)-new Date(a.updatedAt);});
  },[data.notes,search,activeTag]);

  const newNote=()=>{
    const note={id:crypto.randomUUID(),title:'',content:'',tags:[],pinned:false,updatedAt:new Date().toISOString()};
    const next={notes:[note,...data.notes],selectedId:note.id};
    setData(next);saveNotes(next);showToast('New note');
  };
  const select=id=>{ const next={...data,selectedId:id};setData(next);saveNotes(next); };
  const updateField=(field,val)=>{
    if(!selected) return;
    clearTimeout(autoRef.current); setSS('dirty');
    const updated={...selected,[field]:field==='tags'?parseTags(val):val,updatedAt:new Date().toISOString()};
    const next={...data,notes:data.notes.map(n=>n.id===selected.id?updated:n)};
    setData(next);
    autoRef.current=setTimeout(()=>{saveNotes(next);setSS('saved');},600);
  };
  const togglePin=()=>{
    if(!selected) return;
    const updated={...selected,pinned:!selected.pinned};
    const next={...data,notes:data.notes.map(n=>n.id===selected.id?updated:n)};
    setData(next);saveNotes(next);showToast(updated.pinned?'Pinned':'Unpinned');
  };
  const duplicate=()=>{
    if(!selected) return;
    const copy={...selected,id:crypto.randomUUID(),title:`${selected.title||'Untitled'} Copy`,updatedAt:new Date().toISOString()};
    const next={notes:[copy,...data.notes],selectedId:copy.id};
    setData(next);saveNotes(next);showToast('Duplicated');
  };
  const deleteNote=()=>{
    const rem=data.notes.filter(n=>n.id!==data.selectedId);
    const next={notes:rem,selectedId:rem[0]?.id||''};
    setData(next);saveNotes(next);showToast('Deleted','danger');
  };
  const exportJson=()=>{
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(data.notes,null,2)],{type:'application/json'}));
    a.download='smartnotes-export.json';a.click();showToast('Exported');
  };
  const loadDemo=()=>{
    const notes=demoNotes();const next={notes,selectedId:notes[0].id};
    setData(next);saveNotes(next);showToast('Demo notes loaded');
  };

  const words=selected?selected.content.trim().split(/\s+/).filter(Boolean).length:0;

  // Shared button style
  const ibtn=(danger=false)=>({
    display:'flex',alignItems:'center',justifyContent:'center',
    width:28,height:28,borderRadius:6,border:'none',
    background:'transparent',cursor:'pointer',
    color:danger?'var(--red)':'var(--sb-muted)',transition:'background .12s,color .12s',
  });
  const hoverIbtn=e=>{ e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='var(--sb-text)'; };
  const leaveIbtn=(e,danger=false)=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=danger?'var(--red)':'var(--sb-muted)'; };

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>

      {/* ── Title bar ────────────────────────────────────── */}
      <div style={{
        display:'flex',alignItems:'center',gap:0,height:38,flexShrink:0,
        background:'var(--sb-bg)',borderBottom:'1px solid var(--sb-border)',
      }}>
        {/* App name */}
        <div style={{width:240,flexShrink:0,display:'flex',alignItems:'center',gap:9,padding:'0 14px',borderRight:'1px solid var(--sb-border)',height:'100%'}}>
          <div style={{width:22,height:22,borderRadius:6,background:'var(--cyan)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <I name="file" size={12} color="white"/>
          </div>
          <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:600,fontSize:13,color:'var(--sb-text)',letterSpacing:'-0.01em'}}>SmartNotes</span>
        </div>

        {/* Stats */}
        <div style={{flex:1,display:'flex',alignItems:'center',gap:20,padding:'0 18px'}}>
          {[
            {val:data.notes.length,lbl:'notes'},
            {val:data.notes.filter(n=>n.pinned).length,lbl:'pinned'},
            {val:allTags.length,lbl:'tags'},
          ].map(s=>(
            <span key={s.lbl} style={{fontSize:11.5,color:'var(--sb-muted)',fontFamily:'JetBrains Mono,monospace'}}>
              <span style={{color:'var(--cyan)',fontWeight:600}}>{s.val}</span> {s.lbl}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div style={{display:'flex',alignItems:'center',gap:4,padding:'0 12px',borderLeft:'1px solid var(--sb-border)',height:'100%'}}>
          {[
            {icon:'plus',fn:newNote,title:'New note'},
            {icon:'file',fn:loadDemo,title:'Load demo'},
            {icon:'export',fn:exportJson,title:'Export JSON'},
          ].map(a=>(
            <button key={a.icon} onClick={a.fn} title={a.title} style={ibtn()}
              onMouseEnter={hoverIbtn} onMouseLeave={leaveIbtn}>
              <I name={a.icon} size={14} color="currentColor"/>
            </button>
          ))}
          <button onClick={()=>setDarkEd(d=>!d)} title="Toggle editor theme" style={ibtn()}
            onMouseEnter={hoverIbtn} onMouseLeave={leaveIbtn}>
            <I name={darkEd?'sun':'moon'} size={14} color="currentColor"/>
          </button>
        </div>
      </div>

      {/* ── 3-column body ─────────────────────────────────── */}
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>

        {/* ── Sidebar ─────────────────────────────────────── */}
        <div style={{
          width:240,flexShrink:0,background:'var(--sb-bg)',
          borderRight:'1px solid var(--sb-border)',
          display:'flex',flexDirection:'column',overflow:'hidden',
        }}>
          {/* Search */}
          <div style={{padding:'10px 10px 6px',borderBottom:'1px solid var(--sb-border)'}}>
            <div style={{position:'relative'}}>
              <I name="search" size={12} color="var(--sb-muted)" style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
                style={{
                  width:'100%',padding:'7px 10px 7px 28px',borderRadius:6,
                  background:'rgba(255,255,255,0.06)',border:'1px solid var(--sb-border)',
                  color:'var(--sb-text)',fontSize:12.5,outline:'none',
                  fontFamily:'Manrope,sans-serif',
                }}/>
            </div>
          </div>

          {/* Tags */}
          {allTags.length>0&&(
            <div style={{padding:'8px 10px',borderBottom:'1px solid var(--sb-border)',display:'flex',flexWrap:'wrap',gap:4}}>
              {allTags.map(t=>(
                <TagChip key={t} tag={t} active={activeTag===t} dark
                  onClick={()=>setTag(activeTag===t?'':t)}/>
              ))}
            </div>
          )}

          {/* Note list */}
          <div style={{flex:1,overflowY:'auto',padding:'6px 6px'}}>
            <div style={{
              fontSize:10,fontFamily:'JetBrains Mono,monospace',
              color:'var(--sb-muted)',letterSpacing:'.1em',textTransform:'uppercase',
              padding:'4px 8px 6px',
            }}>{visible.length} notes</div>
            {visible.length===0&&<p style={{fontSize:12,color:'var(--sb-muted)',padding:'10px 8px',fontStyle:'italic'}}>No notes match.</p>}
            {visible.map(n=><NoteCard key={n.id} note={n} active={n.id===data.selectedId} onClick={()=>select(n.id)}/>)}
          </div>

          {(search||activeTag)&&(
            <button onClick={()=>{setSearch('');setTag('');}} style={{
              padding:'9px',borderTop:'1px solid var(--sb-border)',background:'none',border:'none',
              cursor:'pointer',color:'var(--cyan)',fontSize:11.5,fontWeight:600,
              fontFamily:'JetBrains Mono,monospace',
            }}>× clear filters</button>
          )}
        </div>

        {/* ── Editor ──────────────────────────────────────── */}
        <div style={{
          width:400,flexShrink:0,borderRight:'1px solid var(--ed-border)',
          display:'flex',flexDirection:'column',overflow:'hidden',
          background:'var(--ed-bg)',
        }}>
          {/* Editor toolbar */}
          <div style={{
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'0 12px',height:38,borderBottom:'1px solid var(--ed-border)',
            background:'var(--ed-s1)',flexShrink:0,
          }}>
            <div style={{display:'flex',alignItems:'center',gap:7}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:saveState==='saved'?'var(--green)':'var(--cyan)',transition:'background .3s'}}/>
              <span style={{fontSize:11,color:'var(--ed-muted)',fontFamily:'JetBrains Mono,monospace'}}>
                {saveState==='saved'?'saved':'saving…'}
              </span>
              {selected&&<span style={{fontSize:10,color:'var(--ed-muted)',fontFamily:'JetBrains Mono,monospace',marginLeft:8}}>{words}w</span>}
            </div>
            <div style={{display:'flex',gap:3}}>
              {[
                {icon:'pin',  fn:togglePin, active:selected?.pinned},
                {icon:'copy', fn:duplicate},
                {icon:'trash',fn:deleteNote,danger:true},
              ].map(a=>(
                <button key={a.icon} onClick={a.fn} style={{
                  width:26,height:26,borderRadius:5,border:'none',
                  background:a.active?'rgba(6,182,212,0.15)':'transparent',
                  cursor:'pointer',transition:'background .12s',
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}
                  onMouseEnter={e=>e.currentTarget.style.background=a.danger?'rgba(239,68,68,0.1)':'rgba(6,182,212,0.1)'}
                  onMouseLeave={e=>e.currentTarget.style.background=a.active?'rgba(6,182,212,0.15)':'transparent'}
                >
                  <I name={a.icon} size={13} color={a.active?'var(--cyan)':a.danger?'var(--red)':'var(--ed-muted)'}/>
                </button>
              ))}
            </div>
          </div>

          {selected ? (
            <div style={{flex:1,overflowY:'auto',padding:'18px 20px',display:'flex',flexDirection:'column',gap:12}}>
              {/* Title */}
              <input value={selected.title} onChange={e=>updateField('title',e.target.value)}
                placeholder="Note title…"
                style={{
                  width:'100%',border:'none',background:'transparent',
                  fontFamily:'Manrope,sans-serif',fontWeight:800,fontSize:20,
                  color:'var(--ed-text)',letterSpacing:'-0.02em',padding:0,
                }}/>

              {/* Tags */}
              <div style={{display:'flex',flexWrap:'wrap',gap:5,alignItems:'center',paddingBottom:10,borderBottom:'1px solid var(--ed-border)'}}>
                {selected.tags.map(t=><TagChip key={t} tag={t} dark={darkEd}/>)}
                <input
                  value={selected.tags.join(', ')} onChange={e=>updateField('tags',e.target.value)}
                  placeholder={selected.tags.length?'':"add tags…"}
                  style={{
                    border:'none',background:'transparent',fontFamily:'JetBrains Mono,monospace',
                    fontSize:10.5,color:'var(--ed-text2)',padding:'2px 4px',minWidth:80,flex:1,
                  }}/>
              </div>

              {/* Content */}
              <textarea value={selected.content} onChange={e=>updateField('content',e.target.value)}
                placeholder={"Start writing…\n\nMarkdown is supported:\n# Heading  **bold**  *italic*\n`code`  - list  > quote"}
                style={{
                  flex:1,border:'none',background:'transparent',resize:'none',
                  fontFamily:'JetBrains Mono,monospace',fontSize:13.5,lineHeight:1.75,
                  color:'var(--ed-text)',padding:0,minHeight:300,
                }}/>
            </div>
          ) : (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,opacity:.3}}>
              <I name="file" size={28} color="var(--ed-muted)"/>
              <span style={{fontSize:12.5,color:'var(--ed-muted)',fontFamily:'JetBrains Mono,monospace'}}>no file selected</span>
            </div>
          )}
        </div>

        {/* ── Preview ─────────────────────────────────────── */}
        <div style={{flex:1,background:'var(--ed-s1)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{
            height:38,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'0 20px',borderBottom:'1px solid var(--ed-border)',background:'var(--ed-bg)',
          }}>
            <span style={{fontSize:10.5,fontFamily:'JetBrains Mono,monospace',color:'var(--ed-muted)',letterSpacing:'.08em',textTransform:'uppercase'}}>Preview</span>
            {selected&&<span style={{fontSize:10.5,fontFamily:'JetBrains Mono,monospace',color:'var(--ed-muted)'}}>
              {new Date(selected.updatedAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
            </span>}
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'28px 32px',maxWidth:720}}>
            {selected ? (
              <div className="fade-in">
                {selected.tags.length>0&&(
                  <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:18}}>
                    {selected.tags.map(t=><TagChip key={t} tag={t} dark={darkEd}/>)}
                  </div>
                )}
                <div className="preview-body"
                  dangerouslySetInnerHTML={{__html:`<h1>${escHtml(selected.title||'Untitled note')}</h1>${renderMd(selected.content)}`}}
                />
              </div>
            ) : (
              <div style={{textAlign:'center',paddingTop:60,opacity:.3}}>
                <I name="file" size={32} color="var(--ed-muted)"/>
                <p style={{fontSize:13,color:'var(--ed-muted)',marginTop:10,fontFamily:'JetBrains Mono,monospace'}}>// nothing to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toasts */}
      <div style={{position:'fixed',bottom:18,right:18,display:'flex',flexDirection:'column',gap:7,zIndex:9999,pointerEvents:'none'}}>
        {toasts.map(t=>(
          <div key={t.id} style={{
            padding:'9px 15px',borderRadius:7,fontSize:12.5,fontWeight:600,
            fontFamily:'JetBrains Mono,monospace',
            background:t.type==='danger'?'rgba(239,68,68,0.9)':'rgba(6,182,212,0.9)',
            color:'white',boxShadow:'0 4px 16px rgba(0,0,0,0.3)',
            animation:'fadeIn .2s ease',
          }}>{t.msg}</div>
        ))}
      </div>

      {/* Tweaks */}
      {showTweaks&&(
        <div style={{position:'fixed',bottom:20,right:20,zIndex:9999,background:'var(--sb-s1)',border:'1px solid var(--sb-border)',borderRadius:12,padding:'18px',width:220,boxShadow:'0 12px 40px rgba(0,0,0,0.5)'}}>
          <div style={{fontFamily:'JetBrains Mono,monospace',fontWeight:600,fontSize:13,color:'var(--sb-text)',marginBottom:14}}>Tweaks</div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div>
              <div style={{fontSize:9.5,fontFamily:'JetBrains Mono,monospace',color:'var(--sb-muted)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>Accent Color</div>
              <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
                {['#06b6d4','#10b981','#8b5cf6','#f59e0b','#f43f5e','#3b82f6'].map(c=>(
                  <button key={c} onClick={()=>applyTweak('accent',c)} style={{width:24,height:24,borderRadius:'50%',border:`2px solid ${tweaks.accent===c?'white':'transparent'}`,background:c,cursor:'pointer'}}/>
                ))}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:12,color:'var(--sb-text)'}}>Dark editor</span>
              <button onClick={()=>setDarkEd(d=>!d)} style={{width:38,height:21,borderRadius:10.5,border:'none',cursor:'pointer',background:darkEd?'var(--cyan)':'rgba(255,255,255,0.12)',position:'relative',transition:'background .2s',padding:0}}>
                <div style={{position:'absolute',top:2,left:darkEd?19:2,width:17,height:17,borderRadius:'50%',background:'white',transition:'left .2s'}}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<SNApp/>);
