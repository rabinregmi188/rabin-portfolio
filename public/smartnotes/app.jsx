// ── Constants & Storage ───────────────────────────────────────────────
const SN_KEY    = 'smartnotes.v1';
const THEME_KEY = 'smartnotes.theme';

const inputSt = {
  width:'100%', padding:'9px 12px', borderRadius:8,
  background:'var(--surface)', border:'1px solid var(--border2)',
  color:'var(--text)', fontSize:13.5, outline:'none',
};
const labelSt = {
  display:'block', fontSize:11, fontWeight:600, color:'var(--muted)',
  letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:6,
};

// ── Markdown renderer (ported from original app.js) ───────────────────
function escHtml(v){ return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }
function inlineMd(text){
  const codes=[];
  text=text.replace(/`([^`\n]+)`/g,(_,c)=>{const i=codes.length;codes.push(c);return`\u0001C${i}\u0001`;});
  text=escHtml(text);
  text=text.replace(/\*\*([^*\n]+?)\*\*/g,'<strong>$1</strong>');
  text=text.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g,'$1<em>$2</em>');
  text=text.replace(/(^|[^_\w])_([^_\n]+?)_(?!\w)/g,'$1<em>$2</em>');
  text=text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,(_,label,url)=>{
    const safe=/^(https?:\/\/|mailto:|#|\/)/.test(url)?url:'#';
    return`<a href="${escHtml(safe)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  text=text.replace(/\u0001C(\d+)\u0001/g,(_,i)=>`<code>${escHtml(codes[+i])}</code>`);
  return text;
}
function renderMd(src){
  if(!src) return '';
  const codeBlocks=[];
  src=src.replace(/```(\w*)\n?([\s\S]*?)```/g,(_,lang,code)=>{const i=codeBlocks.length;codeBlocks.push({lang,code});return`\u0000CB${i}\u0000`;});
  return src.split(/\n{2,}/).map(b=>b.trim()).filter(Boolean).map(block=>{
    const cbM=block.match(/^\u0000CB(\d+)\u0000$/);
    if(cbM){const{lang,code}=codeBlocks[+cbM[1]];return`<pre><code>${escHtml(code.replace(/\n$/,''))}</code></pre>`;}
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

// ── State helpers ─────────────────────────────────────────────────────
function loadNotes(){
  try{const s=JSON.parse(localStorage.getItem(SN_KEY)||'{}');return{notes:s.notes||[],selectedId:s.selectedId||''};}
  catch{return{notes:[],selectedId:''};}
}
function saveNotes(st){ localStorage.setItem(SN_KEY,JSON.stringify({notes:st.notes,selectedId:st.selectedId})); }
function parseTags(v){ return[...new Set(v.split(',').map(t=>t.trim().toLowerCase()).filter(Boolean))]; }
function tagHue(tag){ let h=0;for(let i=0;i<tag.length;i++)h=(h*31+tag.charCodeAt(i))>>>0;return h%360; }
function snippet(text){ return text.replace(/[#>*_`]/g,'').replace(/\s+/g,' ').trim().slice(0,100); }

// ── Demo Notes ────────────────────────────────────────────────────────
function demoNotes(){
  const now=new Date().toISOString();
  return[
    {id:crypto.randomUUID(),title:'Portfolio refresh',content:'# Portfolio refresh\n\nAdd a project spotlight section for shipped work.\n\n## Priorities\n\n- Stronger visual hierarchy for featured apps\n- Short 30-second demo clip per project\n- Link straight to the live app and the repo\n\n> Keep the copy tight — one paragraph per project is plenty.',tags:['portfolio','ideas','frontend'],pinned:true,updatedAt:now},
    {id:crypto.randomUUID(),title:'Interview prep checklist',content:'## This week\n\n- Review JavaScript fundamentals (event loop, closures, prototypes)\n- Practice explaining projects clearly — 90-second pitch each\n- Prepare examples for *teamwork*, *debugging*, and *ownership*\n\n## System design primer\n\n`caching`, `load balancers`, `queues` — revisit the basics.',tags:['career','prep'],pinned:false,updatedAt:now},
    {id:crypto.randomUUID(),title:'Study plan',content:'# Study plan\n\nFocus this week on **data structures** review and **system design** basics.\n\n1. One coding problem per day\n2. Re-read the hashing chapter\n3. Summarize each topic in your own words\n\n> Consistency beats intensity.',tags:['school','cs'],pinned:false,updatedAt:now},
  ];
}

// ── Icon ──────────────────────────────────────────────────────────────
const SNIcon = ({name,size=18,color='currentColor',sw=1.8})=>{
  const s={stroke:color,strokeWidth:sw,fill:'none',strokeLinecap:'round',strokeLinejoin:'round'};
  const icons={
    plus:   <path {...s} d="M12 5v14M5 12h14"/>,
    search: <><circle {...s} cx="11" cy="11" r="7"/><path {...s} d="M21 21l-4.35-4.35"/></>,
    pin:    <><path {...s} d="M12 17v5"/><path {...s} d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></>,
    copy:   <><rect {...s} x="9" y="9" width="13" height="13" rx="2"/><path {...s} d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    trash:  <><path {...s} d="M3 6h18M19 6l-1.5 14H6.5L5 6M9 6V4h6v2"/></>,
    moon:   <path {...s} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
    sun:    <><circle {...s} cx="12" cy="12" r="4"/><path {...s} d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
    export: <><path {...s} d="M14 3h7v7"/><path {...s} d="M10 14 21 3"/><path {...s} d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>,
    x:      <path {...s} d="M18 6L6 18M6 6l12 12"/>,
    save:   <><path {...s} d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline {...s} points="17 21 17 13 7 13 7 21"/><polyline {...s} points="7 3 7 8 15 8"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>{icons[name]||null}</svg>;
};

// ── Tag Chip ──────────────────────────────────────────────────────────
const TagChip = ({tag,active,onClick,size='sm'})=>{
  const hue=tagHue(tag);
  const base={
    display:'inline-flex',alignItems:'center',padding:size==='sm'?'3px 9px':'4px 11px',
    borderRadius:99,fontWeight:600,cursor:onClick?'pointer':'default',
    fontFamily:'DM Sans',fontSize:size==='sm'?11:12,transition:'all .15s',
    background:active?`hsl(${hue},65%,48%)`:`hsl(${hue},55%,93%)`,
    color:active?'white':`hsl(${hue},50%,32%)`,
    border:`1px solid ${active?`hsl(${hue},65%,45%)`:`hsl(${hue},40%,82%)`}`,
  };
  return <button style={base} onClick={onClick}>#{tag}</button>;
};

// ── Note Card ─────────────────────────────────────────────────────────
const NoteCard = ({note,active,onClick})=>{
  const isNew = !note.title && !note.content;
  return(
    <div onClick={onClick} style={{
      padding:'14px 16px',borderRadius:12,cursor:'pointer',
      borderLeft:`3px solid ${active?'var(--accent)':'transparent'}`,
      background:active?'var(--surface)':'transparent',
      transition:'all .15s',marginBottom:2,
    }}
      onMouseEnter={e=>{if(!active)e.currentTarget.style.background='rgba(90,65,40,0.05)';}}
      onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent';}}
      className="fade-in"
    >
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
        <span style={{fontFamily:'Lora',fontWeight:600,fontSize:14,color:'var(--text)',lineHeight:1.3,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',paddingRight:8}}>
          {note.title||<em style={{color:'var(--muted)',fontWeight:400}}>Untitled note</em>}
        </span>
        {note.pinned&&<span style={{fontSize:12,flexShrink:0}}>📌</span>}
      </div>
      {!isNew&&<p style={{fontSize:12,color:'var(--muted)',lineHeight:1.5,marginBottom:6,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
        {snippet(note.content)||'No content yet.'}
      </p>}
      <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
        {note.tags.slice(0,3).map(t=><TagChip key={t} tag={t} size="xs"/>)}
        <span style={{fontSize:10,color:'var(--muted)',marginLeft:'auto'}}>
          {new Date(note.updatedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
        </span>
      </div>
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────
const useToast = ()=>{
  const [toasts,setToasts]=React.useState([]);
  const show=(msg,type='info')=>{
    const id=Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),2400);
  };
  return [toasts,show];
};

// ── App ───────────────────────────────────────────────────────────────
const SNApp = ()=>{
  const [data,    setData]    = React.useState(loadNotes);
  const [search,  setSearch]  = React.useState('');
  const [activeTag, setActiveTag] = React.useState('');
  const [dark,    setDark]    = React.useState(()=>localStorage.getItem(THEME_KEY)==='dark');
  const [saveState, setSaveState] = React.useState('saved'); // 'saved'|'dirty'
  const [toasts,  showToast]  = useToast();
  const autoRef = React.useRef(null);
  const [showTweaks, setShowTweaks] = React.useState(false);

  // Apply dark mode
  React.useEffect(()=>{
    const r=document.documentElement;
    if(dark){
      r.style.setProperty('--bg','#1a1510');
      r.style.setProperty('--surface','#231e18');
      r.style.setProperty('--surface2','#2c2520');
      r.style.setProperty('--border','rgba(220,190,160,0.1)');
      r.style.setProperty('--border2','rgba(220,190,160,0.2)');
      r.style.setProperty('--text','#f0e8dc');
      r.style.setProperty('--text2','#c4a882');
      r.style.setProperty('--muted','#8a7060');
    } else {
      r.style.setProperty('--bg','#f2ede3');
      r.style.setProperty('--surface','#faf8f2');
      r.style.setProperty('--surface2','#f5f0e6');
      r.style.setProperty('--border','rgba(90,65,40,0.12)');
      r.style.setProperty('--border2','rgba(90,65,40,0.22)');
      r.style.setProperty('--text','#1c1309');
      r.style.setProperty('--text2','#6b5744');
      r.style.setProperty('--muted','#9e8b79');
    }
    localStorage.setItem(THEME_KEY, dark?'dark':'light');
  },[dark]);

  React.useEffect(()=>{
    const h=e=>{
      if(e.data?.type==='__activate_edit_mode')   setShowTweaks(true);
      if(e.data?.type==='__deactivate_edit_mode') setShowTweaks(false);
    };
    window.addEventListener('message',h);
    window.parent.postMessage({type:'__edit_mode_available'},'*');
    return()=>window.removeEventListener('message',h);
  },[]);

  const selected = data.notes.find(n=>n.id===data.selectedId);
  const allTags  = [...new Set(data.notes.flatMap(n=>n.tags))].sort();

  const visible = React.useMemo(()=>{
    let ns=[...data.notes];
    if(search) ns=ns.filter(n=>`${n.title} ${n.content} ${n.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
    if(activeTag) ns=ns.filter(n=>n.tags.includes(activeTag));
    return ns.sort((a,b)=>{
      if(a.pinned!==b.pinned) return a.pinned?-1:1;
      return new Date(b.updatedAt)-new Date(a.updatedAt);
    });
  },[data.notes,search,activeTag]);

  const newNote = ()=>{
    const note={id:crypto.randomUUID(),title:'',content:'',tags:[],pinned:false,updatedAt:new Date().toISOString()};
    const next={notes:[note,...data.notes],selectedId:note.id};
    setData(next); saveNotes(next); showToast('New note');
  };

  const select = id=>{ const next={...data,selectedId:id}; setData(next); saveNotes(next); };

  const updateField = (field,val)=>{
    if(!selected) return;
    clearTimeout(autoRef.current);
    setSaveState('dirty');
    const updated={...selected,[field]:field==='tags'?parseTags(val):val,updatedAt:new Date().toISOString()};
    const next={...data,notes:data.notes.map(n=>n.id===selected.id?updated:n)};
    setData(next);
    autoRef.current=setTimeout(()=>{saveNotes(next);setSaveState('saved');},600);
  };

  const togglePin = ()=>{
    if(!selected) return;
    const updated={...selected,pinned:!selected.pinned,updatedAt:new Date().toISOString()};
    const next={...data,notes:data.notes.map(n=>n.id===selected.id?updated:n)};
    setData(next);saveNotes(next);showToast(updated.pinned?'Pinned':'Unpinned');
  };

  const duplicate = ()=>{
    if(!selected) return;
    const copy={...selected,id:crypto.randomUUID(),title:`${selected.title||'Untitled'} Copy`,updatedAt:new Date().toISOString()};
    const next={notes:[copy,...data.notes],selectedId:copy.id};
    setData(next);saveNotes(next);showToast('Duplicated');
  };

  const deleteNote = ()=>{
    if(!data.notes.length) return;
    const remaining=data.notes.filter(n=>n.id!==data.selectedId);
    const next={notes:remaining,selectedId:remaining[0]?.id||''};
    setData(next);saveNotes(next);showToast('Deleted','danger');
  };

  const exportJson = ()=>{
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(data.notes,null,2)],{type:'application/json'}));
    a.download='smartnotes-export.json'; a.click();
    showToast('Exported');
  };

  const loadDemo = ()=>{
    const notes=demoNotes();
    const next={notes,selectedId:notes[0].id};
    setData(next);saveNotes(next);showToast('Demo notes loaded');
  };

  const pinnedCount = data.notes.filter(n=>n.pinned).length;

  const btnSt = (col='var(--accent)')=>({
    display:'flex',alignItems:'center',gap:6,padding:'7px 13px',borderRadius:8,
    border:`1px solid ${col}30`,background:`${col}12`,
    color:col,cursor:'pointer',fontSize:12.5,fontWeight:600,transition:'all .15s',
  });

  const iconBtnSt = (danger=false)=>({
    display:'flex',alignItems:'center',justifyContent:'center',
    width:32,height:32,borderRadius:8,border:'1px solid var(--border2)',
    background:'var(--surface)',cursor:'pointer',
    color:danger?'var(--red)':'var(--text2)',transition:'all .15s',
  });

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{"dark":false}/*EDITMODE-END*/;

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>
      {/* Top bar */}
      <div style={{
        display:'flex',alignItems:'center',gap:12,padding:'10px 20px',
        borderBottom:'1px solid var(--border)',background:'var(--surface)',flexShrink:0,
      }}>
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:9,marginRight:8}}>
          <div style={{width:28,height:28,borderRadius:7,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10z"/><polyline points="14 3 14 10 21 10"/></svg>
          </div>
          <span style={{fontFamily:'Lora',fontWeight:700,fontSize:16,color:'var(--text)'}}>SmartNotes</span>
        </div>

        {/* Stats */}
        <div style={{display:'flex',gap:16,fontSize:12,color:'var(--muted)'}}>
          <span><strong style={{color:'var(--text)',fontWeight:600}}>{data.notes.length}</strong> notes</span>
          <span><strong style={{color:'var(--text)',fontWeight:600}}>{pinnedCount}</strong> pinned</span>
          <span><strong style={{color:'var(--text)',fontWeight:600}}>{allTags.length}</strong> tags</span>
        </div>

        <div style={{flex:1}}/>

        {/* Actions */}
        <button style={btnSt('var(--accent)')} onClick={newNote}><SNIcon name="plus" size={14} color="var(--accent)"/>New Note</button>
        <button style={btnSt('var(--text2)')} onClick={loadDemo}><SNIcon name="save" size={14} color="var(--text2)"/>Demo</button>
        <button style={btnSt('var(--text2)')} onClick={exportJson}><SNIcon name="export" size={14} color="var(--text2)"/>Export</button>
        <button onClick={()=>setDark(d=>!d)} style={iconBtnSt()}>
          <SNIcon name={dark?'sun':'moon'} size={15} color="var(--text2)"/>
        </button>
      </div>

      {/* 3-column body */}
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>

        {/* ── Sidebar: note list ─────────────────────────────── */}
        <div style={{
          width:240,flexShrink:0,borderRight:'1px solid var(--border)',
          display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--surface)',
        }}>
          {/* Search */}
          <div style={{padding:'12px 14px 8px',borderBottom:'1px solid var(--border)'}}>
            <div style={{position:'relative'}}>
              <SNIcon name="search" size={14} color="var(--muted)" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes…"
                style={{...inputSt,paddingLeft:32,fontSize:12.5,padding:'8px 10px 8px 32px'}}/>
            </div>
          </div>

          {/* Tags */}
          {allTags.length>0&&(
            <div style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:5}}>
              {allTags.map(t=>(
                <TagChip key={t} tag={t} active={activeTag===t} size="xs"
                  onClick={()=>setActiveTag(activeTag===t?'':t)}/>
              ))}
            </div>
          )}

          {/* Note list */}
          <div style={{flex:1,overflowY:'auto',padding:'8px 8px'}}>
            <div style={{fontSize:10,color:'var(--muted)',letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:600,padding:'4px 8px 6px'}}>{visible.length} notes</div>
            {visible.length===0&&<p style={{fontSize:12,color:'var(--muted)',padding:'12px 8px',fontStyle:'italic'}}>No notes match.</p>}
            {visible.map(n=><NoteCard key={n.id} note={n} active={n.id===data.selectedId} onClick={()=>select(n.id)}/>)}
          </div>

          {/* Clear filters */}
          {(search||activeTag)&&(
            <button onClick={()=>{setSearch('');setActiveTag('');}} style={{
              padding:'10px',borderTop:'1px solid var(--border)',background:'none',border:'none',
              borderTop:'1px solid var(--border)',cursor:'pointer',color:'var(--accent)',fontSize:12,fontWeight:600,
            }}>Clear filters</button>
          )}
        </div>

        {/* ── Editor ─────────────────────────────────────────── */}
        <div style={{
          width:380,flexShrink:0,borderRight:'1px solid var(--border)',
          display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--surface2)',
        }}>
          {/* Editor toolbar */}
          <div style={{
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'10px 16px',borderBottom:'1px solid var(--border)',
          }}>
            <span style={{fontSize:11,color:'var(--muted)',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase'}}>Editor</span>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              {/* Save indicator */}
              <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--muted)'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:saveState==='saved'?'var(--green)':'var(--accent)',transition:'background .3s'}}/>
                {saveState==='saved'?'Saved':'Saving…'}
              </div>
              <div style={{width:1,height:14,background:'var(--border2)',margin:'0 4px'}}/>
              <button style={iconBtnSt()} onClick={togglePin} title="Pin note">
                <SNIcon name="pin" size={14} color={selected?.pinned?'var(--accent)':'var(--text2)'}/>
              </button>
              <button style={iconBtnSt()} onClick={duplicate} title="Duplicate">
                <SNIcon name="copy" size={14} color="var(--text2)"/>
              </button>
              <button style={iconBtnSt(true)} onClick={deleteNote} title="Delete">
                <SNIcon name="trash" size={14} color="var(--red)"/>
              </button>
            </div>
          </div>

          {/* Editor form */}
          {selected ? (
            <div style={{flex:1,overflowY:'auto',padding:'20px 18px',display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={labelSt}>Title</label>
                <input value={selected.title} onChange={e=>updateField('title',e.target.value)}
                  placeholder="Give this note a title…"
                  style={{...inputSt,fontFamily:'Lora',fontWeight:600,fontSize:16,padding:'10px 12px'}}/>
              </div>
              <div>
                <label style={labelSt}>Tags <span style={{fontWeight:400,textTransform:'none',letterSpacing:0,fontSize:10,color:'var(--muted)'}}>— comma separated</span></label>
                <input value={selected.tags.join(', ')} onChange={e=>updateField('tags',e.target.value)}
                  placeholder="ideas, work, school…" style={inputSt}/>
                {selected.tags.length>0&&(
                  <div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:7}}>
                    {selected.tags.map(t=><TagChip key={t} tag={t} size="sm"/>)}
                  </div>
                )}
              </div>
              <div style={{flex:1,display:'flex',flexDirection:'column'}}>
                <label style={labelSt}>Content <span style={{fontWeight:400,textTransform:'none',letterSpacing:0,fontSize:10,color:'var(--muted)'}}>— markdown supported</span></label>
                <textarea value={selected.content} onChange={e=>updateField('content',e.target.value)}
                  placeholder="Start writing… Markdown is supported: # heading, **bold**, *italic*, `code`, - list, > quote"
                  style={{
                    ...inputSt,resize:'none',flex:1,minHeight:320,
                    fontFamily:'DM Sans',lineHeight:1.7,fontSize:13.5,
                  }}/>
              </div>
              <div style={{fontSize:11,color:'var(--muted)',textAlign:'right'}}>
                {(()=>{const w=selected.content.trim().split(/\s+/).filter(Boolean).length;return`${w} word${w===1?'':'s'} · ${Math.max(1,Math.round(w/200))} min read`;})()}
              </div>
            </div>
          ) : (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,opacity:.5}}>
              <div style={{width:48,height:48,borderRadius:14,border:'1.5px dashed var(--border2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <SNIcon name="plus" size={20} color="var(--muted)"/>
              </div>
              <p style={{fontSize:13,color:'var(--muted)',fontStyle:'italic'}}>Create or select a note</p>
            </div>
          )}
        </div>

        {/* ── Preview ─────────────────────────────────────────── */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'10px 20px',borderBottom:'1px solid var(--border)',background:'var(--surface)',
          }}>
            <span style={{fontSize:11,color:'var(--muted)',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase'}}>Preview</span>
            {selected&&<span style={{fontSize:11,color:'var(--muted)'}}>Updated {new Date(selected.updatedAt).toLocaleString()}</span>}
          </div>

          <div style={{flex:1,overflowY:'auto',padding:'32px 40px',maxWidth:700}}>
            {selected ? (
              <div className="fade-in">
                {selected.tags.length>0&&(
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20}}>
                    {selected.tags.map(t=><TagChip key={t} tag={t} size="sm"/>)}
                  </div>
                )}
                <div className="preview-body"
                  dangerouslySetInnerHTML={{__html:`<h1>${escHtml(selected.title||'Untitled note')}</h1>${renderMd(selected.content)}`}}
                />
              </div>
            ) : (
              <div style={{textAlign:'center',paddingTop:60,opacity:.4}}>
                <div style={{fontFamily:'Lora',fontSize:22,color:'var(--text2)',marginBottom:12}}>Nothing selected</div>
                <p style={{color:'var(--muted)',fontSize:14}}>Create or choose a note to preview it here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toasts */}
      <div style={{position:'fixed',bottom:20,right:20,display:'flex',flexDirection:'column',gap:8,zIndex:9999,pointerEvents:'none'}}>
        {toasts.map(t=>(
          <div key={t.id} style={{
            padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,
            background:t.type==='danger'?'var(--red)':'var(--accent)',color:'white',
            boxShadow:'0 8px 24px rgba(0,0,0,0.2)',animation:'fadeIn .2s ease',
          }}>{t.msg}</div>
        ))}
      </div>

      {/* Tweaks */}
      {showTweaks&&(
        <div style={{position:'fixed',bottom:20,right:20,zIndex:9999,background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:14,padding:'18px',width:220,boxShadow:'0 12px 40px rgba(0,0,0,0.2)'}}>
          <div style={{fontFamily:'Lora',fontWeight:700,fontSize:14,marginBottom:14}}>Tweaks</div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div>
              <div style={{...labelSt,marginBottom:8}}>Accent Color</div>
              <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
                {['#b85c2a','#2563eb','#059669','#7c3aed','#be185d','#b45309'].map(c=>(
                  <button key={c} onClick={()=>{document.documentElement.style.setProperty('--accent',c);window.parent.postMessage({type:'__edit_mode_set_keys',edits:{accentColor:c}},'*');}} style={{width:24,height:24,borderRadius:'50%',border:'2px solid rgba(0,0,0,0.15)',background:c,cursor:'pointer'}}/>
                ))}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:13,color:'var(--text2)'}}>Dark mode</span>
              <button onClick={()=>setDark(d=>!d)} style={{width:40,height:22,borderRadius:11,border:'none',cursor:'pointer',background:dark?'var(--accent)':'var(--border2)',position:'relative',transition:'background .2s'}}>
                <div style={{position:'absolute',top:2,left:dark?20:2,width:18,height:18,borderRadius:'50%',background:'white',transition:'left .2s'}}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<SNApp/>);
