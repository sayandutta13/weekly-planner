import { useState, useEffect, useRef } from "react";

/* ─── Persistence ─────────────────────────────────────────────────────────── */
const _store = {};
function load(key, fb) {
  try {
    if (typeof localStorage === "undefined") return _store[key] ?? fb;
    const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb;
  } catch { return _store[key] ?? fb; }
}
function save(key, val) {
  try {
    if (typeof localStorage === "undefined") { _store[key] = val; return; }
    localStorage.setItem(key, JSON.stringify(val));
  } catch { _store[key] = val; }
}
function usePS(key, def) {
  const [s, set] = useState(() => load(key, def));
  useEffect(() => { save(key, s); }, [key, s]);
  return [s, set];
}

/* ─── Constants ───────────────────────────────────────────────────────────── */
const DAYS          = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DAY_LABELS    = { Mon:"Monday",Tue:"Tuesday",Wed:"Wednesday",Thu:"Thursday",Fri:"Friday",Sat:"Saturday",Sun:"Sunday" };
const DAY_ROLE      = { Mon:"q",Tue:"q",Wed:"q",Thu:"q",Fri:"q",Sat:"a",Sun:"a" };
const BLOCK_DURATIONS = [1, 1.5, 2, 2.5, 3];
const SWATCH_COLORS   = ["#0a84ff","#30d158","#ff9f0a","#bf5af2","#64d2ff","#ff453a","#ff6b81","#ffd60a","#00c7be","#ac8e68"];

const DEFAULT_TYPES = [
  { id:"q", label:"Quadrical", color:"#0a84ff" },
  { id:"a", label:"AntRidge",  color:"#30d158" },
  { id:"b", label:"Break",     color:"#ff9f0a" },
  { id:"p", label:"Personal",  color:"#bf5af2" },
  { id:"f", label:"Focus",     color:"#64d2ff" },
];

const DEFAULT_LOGS    = Object.fromEntries(DAYS.map(d=>[d,""]));
const DEFAULT_SETTINGS = {
  dayStart:6, dayEnd:23, blockDuration:2, sleepStart:23, sleepEnd:6,
};

/* ─── Block generator ─────────────────────────────────────────────────────── */
function pad(h) { return String(Math.floor(h)).padStart(2,"0")+":"+(h%1===0.5?"30":"00"); }

function makeBlocks(settings, roleTypeId) {
  const { dayStart, dayEnd, blockDuration, sleepStart, sleepEnd } = settings;
  const blocks=[]; let id=1;
  if (sleepEnd>0) blocks.push({id:id++,label:"Sleep",start:"00:00",end:pad(sleepEnd),type:"b"});
  if (sleepEnd<dayStart) blocks.push({id:id++,label:"Morning Routine",start:pad(sleepEnd),end:pad(dayStart),type:"b"});
  let cursor=dayStart,slotIdx=0;
  const slotLabels=["Deep Work","Calls & Meetings","Lunch / Break","Work Block","Work Block","Work Block","Evening","Wind Down","Free Time"];
  while (cursor+blockDuration<=dayEnd) {
    blocks.push({id:id++,label:slotLabels[slotIdx]||"Block",start:pad(cursor),end:pad(cursor+blockDuration),type:slotIdx===2?"b":roleTypeId,actual:""});
    cursor+=blockDuration; slotIdx++;
  }
  if (cursor<sleepStart) blocks.push({id:id++,label:"Wind Down / Free",start:pad(cursor),end:pad(sleepStart),type:"b",actual:""});
  blocks.push({id:id++,label:"Sleep",start:pad(sleepStart),end:"23:59",type:"b",actual:""});
  return blocks;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const toM    = t=>{ const [h,m]=(t||"00:00").split(":").map(Number); return h*60+m; };
const durH   = b=>Math.max(0,(toM(b.end)-toM(b.start))/60);
const totalH = (bs,tid)=>bs.filter(b=>b.type===tid).reduce((a,b)=>a+durH(b),0);
const hex2rgb= h=>{ const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return `${r},${g},${b}`; };
const fmtSec = s=>{ const m=Math.floor(s/60),sec=s%60; return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}:${String(sec).padStart(2,"0")}`; };

function getWeekStart(off=0){
  const t=new Date(),day=t.getDay();
  const d=new Date(t); d.setDate(t.getDate()-day+(day===0?-6:1)+off*7); d.setHours(0,0,0,0); return d;
}
const getDayDate=(ws,i)=>{ const d=new Date(ws); d.setDate(d.getDate()+i); return d; };
const fmtS=d=>d.toLocaleDateString("en-IN",{day:"numeric",month:"short"});
const fmtF=d=>d.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const h12=h=>h===0?"12am":h===12?"12pm":h<12?`${h}am`:`${h-12}pm`;

/* ─── Theme — Quadrical=Light / AntRidge=Dark ────────────────────────────── */
function getTheme(isAntRidge) {
  return isAntRidge ? {
    // AntRidge → Dark
    bg:"#1c1c1e", bgElevated:"#2c2c2e", bgCard:"#3a3a3c",
    bgGlass:"rgba(44,44,46,0.82)", border:"rgba(255,255,255,0.08)",
    borderGlass:"rgba(255,255,255,0.13)",
    text1:"#ffffff", text2:"rgba(235,235,245,0.62)",
    text3:"rgba(235,235,245,0.32)", text4:"rgba(235,235,245,0.13)",
    shadow:"0 8px 32px rgba(0,0,0,0.5)", shadowSm:"0 2px 12px rgba(0,0,0,0.35)",
    liquidStart:"rgba(255,255,255,0.07)", red:"#ff453a",
    accent:"#30d158", accentLabel:"AntRidge", isDark:true,
  } : {
    // Quadrical → Light
    bg:"#f2f2f7", bgElevated:"#ffffff", bgCard:"#f2f2f7",
    bgGlass:"rgba(255,255,255,0.80)", border:"rgba(0,0,0,0.07)",
    borderGlass:"rgba(255,255,255,0.88)",
    text1:"#000000", text2:"rgba(60,60,67,0.75)",
    text3:"rgba(60,60,67,0.45)", text4:"rgba(60,60,67,0.16)",
    shadow:"0 8px 32px rgba(0,0,0,0.12)", shadowSm:"0 2px 12px rgba(0,0,0,0.07)",
    liquidStart:"rgba(255,255,255,0.95)", red:"#ff3b30",
    accent:"#0a84ff", accentLabel:"Quadrical", isDark:false,
  };
}

/* ─── Global CSS ──────────────────────────────────────────────────────────── */
function GlobalStyles({ isDark }) {
  useEffect(()=>{
    let el=document.getElementById("wp-g");
    if(!el){el=document.createElement("style");el.id="wp-g";document.head.appendChild(el);}
    el.textContent=`
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
      html{font-size:clamp(13px,1.05vw,16px);}
      body{background:${isDark?"#1c1c1e":"#f2f2f7"};font-family:'Manrope',-apple-system,sans-serif;-webkit-font-smoothing:antialiased;transition:background 0.35s;}
      input,textarea,select{font-family:inherit;}
      ::-webkit-scrollbar{width:5px;height:5px;}
      ::-webkit-scrollbar-thumb{background:rgba(128,128,128,0.22);border-radius:3px;}
      .hs{transition:transform 0.15s,opacity 0.15s;}.hs:hover{transform:scale(1.06);opacity:1!important;}
      .hb{transition:background 0.14s;}.hb:hover{background:rgba(128,128,128,0.07)!important;}
      .hd{transition:all 0.14s;}.hd:hover{border-color:rgba(128,128,128,0.28)!important;background:rgba(128,128,128,0.05)!important;}
      @keyframes fadeUp{from{opacity:0;transform:translateY(7px);}to{opacity:1;transform:translateY(0);}}
      .fu{animation:fadeUp 0.2s ease forwards;}
      @keyframes mIn{from{opacity:0;transform:scale(0.95) translateY(6px);}to{opacity:1;transform:scale(1) translateY(0);}}
      .mi{animation:mIn 0.22s cubic-bezier(0.34,1.15,0.64,1) forwards;}
      @keyframes pausePulse{0%,100%{box-shadow:0 0 0 0 rgba(255,159,10,0.5);}50%{box-shadow:0 0 0 8px rgba(255,159,10,0);}}
      .pause-pulse{animation:pausePulse 1.6s ease infinite;}
      input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer;}
      input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#0a84ff;cursor:pointer;box-shadow:0 2px 6px rgba(10,132,255,0.4);}
    `;
  },[isDark]);
  return null;
}

/* ─── 24h Timeline ────────────────────────────────────────────────────────── */
function Timeline({ blocks, T }) {
  const now=new Date();
  const nowPct=((now.getHours()*60+now.getMinutes())/(24*60))*100;
  return (
    <div style={{marginBottom:"clamp(16px,1.8vw,22px)"}}>
      <div style={{position:"relative",height:14,marginBottom:4}}>
        {[0,6,12,18,24].map(h=>(
          <div key={h} style={{position:"absolute",left:`${(h/24)*100}%`,transform:"translateX(-50%)",fontSize:"clamp(9px,0.65vw,11px)",color:T.text3,fontWeight:600}}>{h12(h)}</div>
        ))}
      </div>
      <div style={{position:"relative",height:"clamp(32px,3.2vw,46px)",background:T.isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",borderRadius:10,overflow:"hidden",border:`1px solid ${T.border}`,boxShadow:`inset 0 1px 0 ${T.liquidStart}`}}>
        {[6,12,18].map(h=><div key={h} style={{position:"absolute",left:`${(h/24)*100}%`,top:0,bottom:0,width:1,background:T.border}}/>)}
        {blocks.map((b,i)=>{
          const sp=(toM(b.start)/(24*60))*100;
          const wp=Math.max((toM(b.end)-toM(b.start))/(24*60)*100,0.4);
          return (
            <div key={b.id||i} title={`${b.label}  ${b.start}–${b.end}`} style={{position:"absolute",left:`${sp}%`,width:`${wp}%`,top:"clamp(4px,0.4vw,7px)",bottom:"clamp(4px,0.4vw,7px)",background:b._color||"#555",borderRadius:4,opacity:0.88,display:"flex",alignItems:"center",overflow:"hidden",paddingLeft:3}}>
              {wp>5&&<span style={{fontSize:"clamp(8px,0.58vw,10px)",color:"#fff",fontWeight:800,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{durH(b)>=1?b.label:""}</span>}
            </div>
          );
        })}
        <div style={{position:"absolute",left:`${nowPct}%`,top:0,bottom:0,width:2,background:T.red,zIndex:10}}>
          <div style={{position:"absolute",top:-2,left:-3,width:8,height:8,borderRadius:"50%",background:T.red}}/>
        </div>
      </div>
    </div>
  );
}

/* ─── Break Timer ─────────────────────────────────────────────────────────── */
/* ─── Stop Log Modal ─────────────────────────────────────────────────────── */
function StopLogModal({ T, elapsed, startedAt, blocks, onSave, onDiscard }) {
  const [input,   setInput]   = useState("");
  const [bullets, setBullets] = useState([]);
  const inputRef = useRef(null);

  // Auto-detect which block was active when timer started
  const startMin = startedAt ? (startedAt.getHours()*60 + startedAt.getMinutes()) : -1;
  const matchedBlock = blocks.find(b => startMin >= toM(b.start) && startMin < toM(b.end));

  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(), 80); },[]);

  const handleKey = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed) { setBullets(p=>[...p, trimmed]); setInput(""); }
    }
  };

  const removeBullet = i => setBullets(p=>p.filter((_,idx)=>idx!==i));

  const handleSave = () => {
    // also push any uncommitted input as a bullet
    const all = input.trim() ? [...bullets, input.trim()] : bullets;
    onSave(all, matchedBlock?.id);
  };

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:999,
      background:"rgba(0,0,0,0.55)",
      backdropFilter:"blur(10px)",
      WebkitBackdropFilter:"blur(10px)",
      display:"flex",alignItems:"center",justifyContent:"center",
      padding:16,
    }} onClick={e=>e.target===e.currentTarget&&onDiscard()}>
      <div className="mi" style={{
        background:T.bgElevated,
        border:`1px solid ${T.border}`,
        borderRadius:"clamp(18px,1.8vw,26px)",
        padding:"clamp(22px,2.2vw,34px)",
        width:"min(540px,95vw)",
        boxShadow:T.shadow,
      }}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"clamp(16px,1.6vw,22px)"}}>
          <div>
            <div style={{fontSize:"clamp(15px,1.3vw,19px)",fontWeight:900,color:T.text1,marginBottom:4}}>What did you do?</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{
                fontSize:"clamp(12px,0.9vw,14px)",fontWeight:800,
                color:"#ff9f0a",fontFamily:"monospace",letterSpacing:1,
                background:"rgba(255,159,10,0.12)",
                border:"1px solid rgba(255,159,10,0.25)",
                borderRadius:7,padding:"3px 10px",
              }}>{fmtSec(elapsed)}</div>
              {matchedBlock&&(
                <div style={{fontSize:"clamp(11px,0.82vw,13px)",color:T.text3,fontWeight:500}}>
                  → will log to <span style={{color:matchedBlock._color||T.accent,fontWeight:700}}>{matchedBlock.label}</span>
                </div>
              )}
            </div>
          </div>
          <button onClick={onDiscard} className="hs" style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"50%",width:32,height:32,cursor:"pointer",color:T.text2,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
        </div>

        {/* Bullet list so far */}
        {bullets.length>0&&(
          <div style={{marginBottom:12,display:"flex",flexDirection:"column",gap:5}}>
            {bullets.map((b,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,
                background:T.isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)",
                borderRadius:9,padding:"7px 12px",
                border:`1px solid ${T.border}`,
              }}>
                <span style={{color:T.accent,fontWeight:900,marginTop:1,flexShrink:0}}>•</span>
                <span style={{flex:1,fontSize:"clamp(12px,0.9vw,14px)",color:T.text1,fontWeight:500,lineHeight:1.5}}>{b}</span>
                <button onClick={()=>removeBullet(i)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:15,lineHeight:1,flexShrink:0,opacity:0.6}}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          display:"flex",alignItems:"center",gap:8,
          background:T.bgCard,
          border:`1.5px solid ${T.accent}44`,
          borderRadius:12,
          padding:"clamp(10px,1vw,13px) clamp(12px,1.2vw,16px)",
          marginBottom:"clamp(16px,1.6vw,20px)",
        }}>
          <span style={{color:T.accent,fontWeight:900,fontSize:16,flexShrink:0}}>•</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={bullets.length===0?"Type what you did, press Enter to add…":"Add another bullet, or save"}
            style={{flex:1,background:"transparent",border:"none",color:T.text1,fontSize:"clamp(13px,1vw,15px)",fontWeight:500,outline:"none"}}
          />
          {input.trim()&&(
            <span style={{fontSize:"clamp(10px,0.72vw,11px)",color:T.text3,fontWeight:600,whiteSpace:"nowrap"}}>↵ Enter</span>
          )}
        </div>

        {/* Footer */}
        <div style={{display:"flex",gap:8}}>
          <button onClick={onDiscard} style={{flex:1,background:"transparent",border:`1px solid ${T.border}`,borderRadius:12,color:T.text3,fontSize:"clamp(12px,0.9vw,14px)",fontWeight:600,padding:"clamp(10px,1vw,13px)",cursor:"pointer"}}>Discard</button>
          <button onClick={handleSave} style={{flex:2,background:T.accent,border:"none",borderRadius:12,color:"#fff",fontSize:"clamp(13px,1vw,15px)",fontWeight:800,padding:"clamp(10px,1vw,13px)",cursor:"pointer"}}>
            Save to {matchedBlock?matchedBlock.label:"Plan"} →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Break Timer ─────────────────────────────────────────────────────────── */
function BreakTimer({ T, blocks, onLogToBlock }) {
  // state: "idle" | "running" | "paused"
  const [state,     setState]    = useState("idle");
  const [secs,      setSecs]     = useState(0);
  const [startedAt, setStartedAt]= useState(null); // Date when Play was first pressed
  const [showModal, setShowModal] = useState(false);
  const [elapsed,   setElapsed]  = useState(0);    // snapshot when Stop pressed
  const [totalBreak,setTotalBreak]=usePS("wp_breakTotal", 0);
  const intRef = useRef(null);

  useEffect(()=>{
    if (state==="running") {
      intRef.current = setInterval(()=>setSecs(s=>s+1),1000);
    } else {
      clearInterval(intRef.current);
    }
    return ()=>clearInterval(intRef.current);
  },[state]);

  const onPlay = ()=>{
    if (state==="idle") setStartedAt(new Date());
    setState("running");
  };
  const onPause = ()=>setState("paused");
  const onStop  = ()=>{
    clearInterval(intRef.current);
    setElapsed(secs);
    setState("idle");
    setSecs(0);
    setShowModal(true);
  };

  const handleSave = (bullets, blockId) => {
    setTotalBreak(t=>t+elapsed);
    onLogToBlock(bullets, blockId, elapsed);
    setShowModal(false);
    setStartedAt(null);
    setElapsed(0);
  };
  const handleDiscard = () => {
    setShowModal(false);
    setStartedAt(null);
    setElapsed(0);
  };

  const btnBase = {
    width:"clamp(32px,2.8vw,40px)",height:"clamp(32px,2.8vw,40px)",
    borderRadius:"50%",cursor:"pointer",
    display:"flex",alignItems:"center",justifyContent:"center",
    transition:"all 0.18s",flexShrink:0,
  };

  return (
    <>
      {showModal&&(
        <StopLogModal
          T={T}
          elapsed={elapsed}
          startedAt={startedAt}
          blocks={blocks}
          onSave={handleSave}
          onDiscard={handleDiscard}
        />
      )}

      <div style={{display:"flex",alignItems:"center",gap:"clamp(5px,0.55vw,8px)"}}>

        {/* Live timer display */}
        {state!=="idle"&&(
          <div style={{
            fontSize:"clamp(11px,0.85vw,13px)",fontWeight:800,
            color:state==="paused"?T.text3:"#ff9f0a",
            letterSpacing:1,fontFamily:"monospace",
            background:state==="paused"?"rgba(128,128,128,0.1)":"rgba(255,159,10,0.11)",
            border:`1px solid ${state==="paused"?T.border:"rgba(255,159,10,0.28)"}`,
            borderRadius:8,padding:"clamp(3px,0.3vw,4px) clamp(8px,0.75vw,11px)",
            transition:"all 0.25s",
          }}>{fmtSec(secs)}</div>
        )}

        {/* ▶ Play — shown when idle or paused */}
        {(state==="idle"||state==="paused")&&(
          <button onClick={onPlay} className="hs"
            title={state==="paused"?"Resume":"Start break"}
            style={{...btnBase,
              border:`1.5px solid ${state==="paused"?"rgba(255,159,10,0.4)":T.border}`,
              background:state==="paused"?"rgba(255,159,10,0.08)":T.isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)",
            }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M3 2.5L11.5 7L3 11.5V2.5Z" fill={state==="paused"?"#ff9f0a":T.text2}/>
            </svg>
          </button>
        )}

        {/* ⏸ Pause — shown when running */}
        {state==="running"&&(
          <button onClick={onPause} className="pause-pulse"
            title="Pause"
            style={{...btnBase,
              border:"1.5px solid rgba(255,159,10,0.5)",
              background:"rgba(255,159,10,0.13)",
            }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="2" width="3.5" height="10" rx="1.5" fill="#ff9f0a"/>
              <rect x="8.5" y="2" width="3.5" height="10" rx="1.5" fill="#ff9f0a"/>
            </svg>
          </button>
        )}

        {/* ⏹ Stop — shown when running or paused */}
        {state!=="idle"&&(
          <button onClick={onStop} className="hs"
            title="Stop & log"
            style={{...btnBase,
              border:"1.5px solid rgba(255,69,58,0.4)",
              background:"rgba(255,69,58,0.09)",
            }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <rect x="1.5" y="1.5" width="9" height="9" rx="2" fill="#ff453a"/>
            </svg>
          </button>
        )}

        {/* Total break today */}
        {state==="idle"&&totalBreak>60&&(
          <span style={{fontSize:"clamp(10px,0.70vw,12px)",color:T.text3,fontWeight:600,whiteSpace:"nowrap"}}>
            {Math.round(totalBreak/60)}m today
          </span>
        )}
      </div>
    </>
  );
}

/* ─── Q/A Toggle ──────────────────────────────────────────────────────────── */
function ModeToggle({ isAntRidge, onChange, T }) {
  const qColor="#0a84ff", aColor="#30d158";
  return (
    <button
      onClick={()=>onChange(!isAntRidge)}
      title={isAntRidge?"Switch to Quadrical (Light)":"Switch to AntRidge (Dark)"}
      style={{
        display:"flex",alignItems:"center",gap:"clamp(5px,0.5vw,8px)",
        background:T.isDark
          ?"linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))"
          :"linear-gradient(135deg,rgba(0,0,0,0.05),rgba(0,0,0,0.01))",
        border:`1px solid ${T.borderGlass}`,
        borderRadius:24,
        padding:"clamp(5px,0.5vw,7px) clamp(10px,1vw,14px) clamp(5px,0.5vw,7px) clamp(6px,0.6vw,8px)",
        cursor:"pointer",
        backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)",
        boxShadow:`inset 0 1px 0 ${T.liquidStart}`,
        transition:"all 0.25s",
        flexShrink:0,
      }}
    >
      {/* Q label */}
      <span style={{
        fontSize:"clamp(10px,0.75vw,12px)",fontWeight:800,
        color:!isAntRidge?qColor:T.text4,
        transition:"color 0.25s",letterSpacing:0.5,
      }}>Q</span>

      {/* Track */}
      <div style={{
        width:"clamp(42px,3.8vw,52px)",height:"clamp(22px,2vw,28px)",
        borderRadius:20,position:"relative",
        background:isAntRidge
          ?"linear-gradient(135deg,#1a3a2a,#0d2218)"
          :"linear-gradient(135deg,#d6eaff,#e8f4ff)",
        border:`1px solid ${isAntRidge?"rgba(48,209,88,0.3)":"rgba(10,132,255,0.25)"}`,
        boxShadow:`inset 0 1px 3px rgba(0,0,0,0.15)`,
        transition:"all 0.28s",
        flexShrink:0,
      }}>
        {/* Thumb */}
        <div style={{
          position:"absolute",top:"50%",
          left:isAntRidge?"calc(100% - clamp(20px,1.8vw,24px))":"clamp(2px,0.2vw,3px)",
          transform:"translateY(-50%)",
          width:"clamp(17px,1.55vw,21px)",height:"clamp(17px,1.55vw,21px)",
          borderRadius:"50%",
          background:isAntRidge
            ?"linear-gradient(135deg,#30d158,#25a244)"
            :"linear-gradient(135deg,#0a84ff,#0060d0)",
          boxShadow:`0 2px 6px rgba(0,0,0,0.25), 0 0 0 1px ${isAntRidge?"rgba(48,209,88,0.4)":"rgba(10,132,255,0.4)"}`,
          transition:"left 0.28s cubic-bezier(0.34,1.2,0.64,1)",
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          {/* Mini icon in thumb */}
          <div style={{width:6,height:6,borderRadius:"50%",background:"rgba(255,255,255,0.7)"}}/>
        </div>
      </div>

      {/* A label */}
      <span style={{
        fontSize:"clamp(10px,0.75vw,12px)",fontWeight:800,
        color:isAntRidge?aColor:T.text4,
        transition:"color 0.25s",letterSpacing:0.5,
      }}>A</span>
    </button>
  );
}

/* ─── Pill selector ───────────────────────────────────────────────────────── */
function PillSelector({ options, value, onChange, T, color="#0a84ff" }) {
  return (
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      {options.map(o=>{
        const active=o.value===value;
        return (
          <button key={o.value} onClick={()=>onChange(o.value)} style={{
            padding:"clamp(5px,0.5vw,7px) clamp(12px,1.1vw,16px)",
            borderRadius:22,border:`1.5px solid ${active?color:T.border}`,
            background:active?`rgba(${hex2rgb(color)},0.14)`:"transparent",
            color:active?color:T.text2,fontSize:"clamp(12px,0.88vw,14px)",
            fontWeight:active?800:500,cursor:"pointer",transition:"all 0.15s",
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

/* ─── Hour Slider ─────────────────────────────────────────────────────────── */
function HourSlider({ label, value, min=0, max=23, onChange, T, color="#0a84ff" }) {
  return (
    <div style={{marginBottom:"clamp(14px,1.3vw,18px)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:"clamp(12px,0.9vw,14px)",color:T.text2,fontWeight:600}}>{label}</span>
        <span style={{fontSize:"clamp(13px,1vw,15px)",fontWeight:800,color}}>{h12(value)}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}
        style={{width:"100%",accentColor:color,background:`linear-gradient(to right,${color} ${((value-min)/(max-min))*100}%,${T.bgCard} ${((value-min)/(max-min))*100}%)`}}
      />
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
        <span style={{fontSize:"clamp(9px,0.63vw,10px)",color:T.text4,fontWeight:500}}>{h12(min)}</span>
        <span style={{fontSize:"clamp(9px,0.63vw,10px)",color:T.text4,fontWeight:500}}>{h12(max)}</span>
      </div>
    </div>
  );
}

/* ─── Settings View ───────────────────────────────────────────────────────── */
function SettingsView({ settings, setSettings, taskTypes, setTaskTypes, T, onApplySchedule }) {
  const [types, setTypes]       = useState(taskTypes.map(t=>({...t})));
  const [sets,  setSets]        = useState({...settings});
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#ff6b81");
  const [dirty, setDirty]       = useState(false);

  const updateSet=(k,v)=>{ setSets(p=>({...p,[k]:v})); setDirty(true); };
  const updateType=(id,f,v)=>{ setTypes(p=>p.map(t=>t.id===id?{...t,[f]:v}:t)); setDirty(true); };
  const removeType=id=>{ setTypes(p=>p.filter(t=>t.id!==id)); setDirty(true); };
  const addType=()=>{
    if(!newLabel.trim()) return;
    setTypes(p=>[...p,{id:`t_${Date.now()}`,label:newLabel.trim(),color:newColor}]);
    setNewLabel(""); setDirty(true);
  };
  const save=()=>{ setTaskTypes(types); setSettings(sets); setDirty(false); };
  const applyAndSave=()=>{ setTaskTypes(types); setSettings(sets); setDirty(false); onApplySchedule(sets,types); };

  const Sec=({title,children})=>(
    <div style={{marginBottom:"clamp(22px,2.2vw,34px)"}}>
      <div style={{fontSize:"clamp(10px,0.72vw,11px)",fontWeight:800,letterSpacing:2,textTransform:"uppercase",color:T.text3,marginBottom:"clamp(10px,1.2vw,16px)",paddingBottom:8,borderBottom:`1px solid ${T.border}`}}>{title}</div>
      {children}
    </div>
  );

  return (
    <div className="fu" style={{maxWidth:620}}>
      <Sec title="Schedule">
        <HourSlider label="Day starts" value={sets.dayStart} min={4} max={12} onChange={v=>updateSet("dayStart",v)} T={T} color={T.accent}/>
        <HourSlider label="Day ends"   value={sets.dayEnd}   min={16} max={23} onChange={v=>updateSet("dayEnd",v)}   T={T} color={T.accent}/>
        <div style={{marginBottom:"clamp(14px,1.3vw,18px)"}}>
          <div style={{fontSize:"clamp(12px,0.9vw,14px)",color:T.text2,fontWeight:600,marginBottom:10}}>Default block duration</div>
          <PillSelector options={BLOCK_DURATIONS.map(d=>({value:d,label:`${d}h`}))} value={sets.blockDuration} onChange={v=>updateSet("blockDuration",v)} T={T} color={T.accent}/>
        </div>
      </Sec>

      <Sec title="Sleep">
        <div style={{background:T.isDark?"rgba(100,210,255,0.06)":"rgba(0,122,255,0.05)",border:`1px solid ${T.isDark?"rgba(100,210,255,0.15)":"rgba(0,122,255,0.12)"}`,borderRadius:12,padding:"clamp(10px,1vw,14px)",marginBottom:"clamp(12px,1.2vw,16px)"}}>
          <p style={{fontSize:"clamp(11px,0.82vw,13px)",color:T.text3,fontWeight:500,lineHeight:1.6}}>Sleep blocks are shown on the timeline and excluded from productive time totals.</p>
        </div>
        <HourSlider label="Sleep time (night)" value={sets.sleepStart} min={20} max={23} onChange={v=>updateSet("sleepStart",v)} T={T} color="#64d2ff"/>
        <HourSlider label="Wake up time"        value={sets.sleepEnd}   min={4}  max={10} onChange={v=>updateSet("sleepEnd",v)}   T={T} color="#64d2ff"/>
        <div style={{background:T.bgCard,borderRadius:12,padding:"clamp(10px,1vw,14px)",border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <span style={{fontSize:"clamp(10px,0.72vw,12px)",color:T.text3,fontWeight:600,minWidth:44}}>Sleep</span>
            <div style={{flex:1,height:8,background:T.isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)",borderRadius:4,overflow:"hidden",position:"relative"}}>
              <div style={{position:"absolute",left:`${(sets.sleepStart/24)*100}%`,right:0,top:0,bottom:0,background:"#64d2ff",opacity:0.7,borderRadius:4}}/>
              <div style={{position:"absolute",left:0,width:`${(sets.sleepEnd/24)*100}%`,top:0,bottom:0,background:"#64d2ff",opacity:0.7,borderRadius:4}}/>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            {["12am","12pm","11:59pm"].map(l=><span key={l} style={{fontSize:"clamp(9px,0.63vw,10px)",color:T.text4,fontWeight:500}}>{l}</span>)}
          </div>
          <span style={{fontSize:"clamp(11px,0.82vw,13px)",color:T.text2,fontWeight:700}}>
            🌙 {h12(sets.sleepStart)} → ☀️ {h12(sets.sleepEnd)} · {((24-sets.sleepStart)+sets.sleepEnd).toFixed(1)}h sleep
          </span>
        </div>
      </Sec>

      <Sec title="Task Types">
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
          {types.map(t=>(
            <div key={t.id} className="hb" style={{display:"flex",alignItems:"center",gap:10,background:T.bgCard,borderRadius:12,padding:"clamp(9px,0.9vw,13px) clamp(12px,1.2vw,16px)",border:`1px solid ${T.border}`}}>
              <input type="color" value={t.color} onChange={e=>updateType(t.id,"color",e.target.value)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,cursor:"pointer",padding:2,background:"transparent",flexShrink:0}}/>
              <div style={{width:8,height:8,borderRadius:"50%",background:t.color,flexShrink:0}}/>
              <input value={t.label} onChange={e=>updateType(t.id,"label",e.target.value)} style={{flex:1,background:"transparent",border:"none",color:T.text1,fontSize:"clamp(13px,1vw,15px)",fontWeight:600}}/>
              <span style={{fontSize:"clamp(9px,0.65vw,11px)",color:T.text4,fontFamily:"monospace"}}>{t.id}</span>
              {types.length>2&&<button onClick={()=>removeType(t.id)} className="hs" style={{background:"none",border:"none",color:T.text3,cursor:"pointer",fontSize:18,lineHeight:1,opacity:0.7}}>×</button>}
            </div>
          ))}
        </div>
        <div style={{background:T.bgCard,borderRadius:14,padding:"clamp(12px,1.2vw,16px)",border:`1px solid ${T.border}`}}>
          <div style={{fontSize:"clamp(10px,0.72vw,11px)",fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color:T.text3,marginBottom:10}}>Add New Type</div>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
            <input type="color" value={newColor} onChange={e=>setNewColor(e.target.value)} style={{width:34,height:34,borderRadius:8,border:`1px solid ${T.border}`,cursor:"pointer",padding:2,background:"transparent",flexShrink:0}}/>
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="Type name e.g. Client Work" onKeyDown={e=>e.key==="Enter"&&addType()} style={{flex:1,minWidth:110,background:T.bgElevated,border:`1px solid ${T.border}`,borderRadius:10,color:T.text1,fontSize:"clamp(13px,1vw,15px)",fontWeight:500,padding:"clamp(7px,0.7vw,9px) clamp(10px,1vw,13px)"}}/>
            <button onClick={addType} style={{background:T.accent,border:"none",borderRadius:10,color:"#fff",fontSize:"clamp(12px,0.88vw,14px)",fontWeight:700,padding:"clamp(7px,0.7vw,9px) clamp(12px,1.2vw,16px)",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>+ Add</button>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {SWATCH_COLORS.map(c=>(
              <div key={c} onClick={()=>setNewColor(c)} style={{width:20,height:20,borderRadius:5,background:c,cursor:"pointer",border:newColor===c?"2.5px solid #fff":"2.5px solid transparent",transition:"transform 0.12s",transform:newColor===c?"scale(1.25)":"scale(1)"}}/>
            ))}
          </div>
        </div>
      </Sec>

      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <button onClick={save} disabled={!dirty} style={{flex:1,minWidth:130,background:dirty?T.accent:"rgba(128,128,128,0.2)",border:"none",borderRadius:13,color:"#fff",fontSize:"clamp(13px,1vw,15px)",fontWeight:700,padding:"clamp(11px,1.1vw,14px)",cursor:dirty?"pointer":"default",transition:"all 0.2s"}}>Save Settings</button>
        <button onClick={applyAndSave} style={{flex:1,minWidth:130,background:"linear-gradient(135deg,#30d158,#28a03e)",border:"none",borderRadius:13,color:"#fff",fontSize:"clamp(13px,1vw,15px)",fontWeight:700,padding:"clamp(11px,1.1vw,14px)",cursor:"pointer"}}>Save & Regenerate Schedule</button>
      </div>
      <p style={{fontSize:"clamp(10px,0.72vw,12px)",color:T.text3,marginTop:8,fontWeight:500,lineHeight:1.5}}>"Save Settings" keeps existing blocks. "Save & Regenerate" rebuilds all 7 days from scratch.</p>
    </div>
  );
}

/* ─── Main App ────────────────────────────────────────────────────────────── */
export default function WeeklyPlanner() {
  const [isAntRidge, setIsAntRidge] = usePS("wp_mode",     false); // false=Quadrical, true=AntRidge
  const [weekOff,    setWeekOff]    = usePS("wp_weekOffset",0);
  const [taskTypes,  setTaskTypes]  = usePS("wp_taskTypes", DEFAULT_TYPES);
  const [settings,   setSettings]   = usePS("wp_settings",  DEFAULT_SETTINGS);
  // Derive default blocks inside useState so settings is available
  const [blocks, setBlocks] = usePS("wp_blocks", null);
  const [logs,   setLogs]   = usePS("wp_logs",   DEFAULT_LOGS);
  const [activeDay, setActiveDay] = useState(()=>{ const m={0:6,1:0,2:1,3:2,4:3,5:4,6:5}; return DAYS[m[new Date().getDay()]]; });
  const [view,      setView]      = useState("plan");
  const [editing,   setEditing]   = useState(null);

  const initBlocks = (s=settings)=>Object.fromEntries(DAYS.map(d=>[d,makeBlocks(s,DAY_ROLE[d]==="a"?"a":"q")]));

  // Always ensure blocks is a real object before any writes
  const resolvedBlocks = blocks || initBlocks();
  // Ensure it's persisted if it was just initialised
  useEffect(()=>{ if(!blocks) setBlocks(initBlocks()); },[]);

  const T        = getTheme(isAntRidge);
  const colorMap = Object.fromEntries(taskTypes.map(t=>[t.id,t.color]));
  const enriched = Object.fromEntries(
    Object.entries(resolvedBlocks).map(([d,bs])=>[d,bs.map(b=>({...b,_color:colorMap[b.type]||"#888"}))])
  );

  const weekStart = getWeekStart(weekOff);
  const weekEnd   = getDayDate(weekStart,6);
  const day       = activeDay;
  const dayIdx    = DAYS.indexOf(day);
  const dayDate   = getDayDate(weekStart,dayIdx);
  const dayBlocks = enriched[day]||[];
  const isAR      = DAY_ROLE[day]==="a";
  const roleType  = taskTypes.find(t=>t.id===(isAR?"a":"q"));
  const accent    = roleType?.color||T.accent;
  const totalQ    = Object.values(enriched).reduce((a,bs)=>a+totalH(bs,"q"),0);
  const totalA    = Object.values(enriched).reduce((a,bs)=>a+totalH(bs,"a"),0);

  /* Block ops — guard against null blocks state */
  const updB=(d,id,f,v)=>setBlocks(p=>{ const base=p||initBlocks(); return {...base,[d]:base[d].map(b=>b.id===id?{...b,[f]:v}:b)}; });
  const remB=(d,id)=>setBlocks(p=>{ const base=p||initBlocks(); return {...base,[d]:base[d].filter(b=>b.id!==id)}; });
  const addB=d=>{
    const bl=resolvedBlocks[d], last=bl[bl.length-1], dur=settings.blockDuration||2;
    setBlocks(p=>{ const base=p||initBlocks(); return {...base,[d]:[...base[d],{id:Date.now(),label:"New Block",start:last?last.end:"09:00",end:last?pad(Math.min(toM(last.end)/60+dur,23)):"11:00",type:taskTypes[0]?.id||"q",actual:""}]}; });
  };
  /* Called when user saves bullets from the Stop modal */
  const onLogToBlock=(bullets, blockId, elapsedSecs)=>{
    if (!bullets.length) return;
    const formatted = bullets.map(b=>`• ${b}`).join("\n");
    const mins = Math.round(elapsedSecs/60);
    const entry = (mins>0?`[${mins}m]\n`:"")+formatted;
    if (blockId) {
      // Use resolvedBlocks as the guaranteed-non-null base
      const base = blocks || initBlocks();
      setBlocks({
        ...base,
        [day]: base[day].map(b=>
          b.id===blockId
            ? {...b, actual: b.actual ? b.actual+"\n\n"+entry : entry}
            : b
        )
      });
    } else {
      setLogs(p=>({...p,[day]: p[day] ? p[day]+"\n\n"+entry : entry}));
    }
  };

  const applySchedule=(newSettings)=>{
    const nb=Object.fromEntries(DAYS.map(d=>[d,makeBlocks(newSettings,DAY_ROLE[d]==="a"?"a":"q")]));
    setBlocks(nb);
  };

  const VIEWS=["Plan","Summary","Settings"];

  return (
    <>
      <GlobalStyles isDark={isAntRidge}/>
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",transition:"background 0.35s"}}>

        {/* ── Sticky Header ── */}
        <div style={{
          background:T.bgGlass,
          backdropFilter:"blur(32px) saturate(200%)",
          WebkitBackdropFilter:"blur(32px) saturate(200%)",
          borderBottom:`1px solid ${T.borderGlass}`,
          boxShadow:`0 1px 0 ${T.liquidStart}, ${T.shadowSm}`,
          padding:"clamp(10px,1.2vw,15px) clamp(16px,3vw,48px) 0",
          position:"sticky",top:0,zIndex:100,
        }}>
          {/* Top row */}
          <div style={{display:"flex",alignItems:"center",gap:"clamp(8px,1vw,16px)",marginBottom:"clamp(8px,0.9vw,12px)",flexWrap:"wrap"}}>

            {/* Brand + week nav */}
            <div style={{display:"flex",flexDirection:"column",gap:2}}>
              <span style={{fontSize:"clamp(9px,0.62vw,10px)",fontWeight:800,letterSpacing:2.5,color:T.text3,textTransform:"uppercase"}}>Week Planner · Sayan</span>
              <div style={{display:"flex",alignItems:"center",gap:"clamp(5px,0.7vw,9px)"}}>
                {["‹","›"].map((ch,i)=>(
                  <button key={ch} className="hs" onClick={()=>setWeekOff(w=>w+(i===0?-1:1))} style={{background:T.isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.04)",border:`1px solid ${T.border}`,color:T.text2,borderRadius:8,width:"clamp(26px,2.1vw,32px)",height:"clamp(26px,2.1vw,32px)",cursor:"pointer",fontSize:"clamp(12px,0.95vw,15px)",display:"flex",alignItems:"center",justifyContent:"center",opacity:0.85}}>{ch}</button>
                ))}
                <span style={{fontSize:"clamp(12px,0.95vw,15px)",fontWeight:800,color:T.text1,whiteSpace:"nowrap",letterSpacing:-0.2}}>
                  {fmtS(weekStart)} – {fmtS(weekEnd)}, {weekEnd.getFullYear()}
                </span>
                {weekOff!==0&&<button onClick={()=>setWeekOff(0)} style={{background:"none",border:"none",color:T.accent,fontSize:"clamp(11px,0.78vw,13px)",cursor:"pointer",fontWeight:700}}>Today</button>}
              </div>
            </div>

            {/* Right controls */}
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"clamp(8px,0.9vw,14px)",flexWrap:"wrap"}}>
              {/* Break timer with pause button */}
              <BreakTimer T={T} blocks={dayBlocks} onLogToBlock={onLogToBlock}/>

              {/* Q ↔ A toggle */}
              <ModeToggle isAntRidge={isAntRidge} onChange={setIsAntRidge} T={T}/>
            </div>
          </div>

          {/* Day tabs + View tabs */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:6}}>
            {view!=="settings"
              ? (
                <div style={{display:"flex",gap:0,overflowX:"auto",flex:1}}>
                  {DAYS.map((d,i)=>{
                    const isActive=d===activeDay;
                    const roleT=taskTypes.find(t=>t.id===(DAY_ROLE[d]==="a"?"a":"q"));
                    const col=roleT?.color||T.accent;
                    const date=getDayDate(weekStart,i);
                    const jsDay=new Date().getDay();
                    const isToday=weekOff===0&&(i===6?jsDay===0:jsDay===i+1);
                    return (
                      <button key={d} onClick={()=>setActiveDay(d)} style={{padding:"clamp(5px,0.6vw,9px) clamp(10px,1.2vw,18px) clamp(7px,0.8vw,11px)",border:"none",borderBottom:isActive?`2.5px solid ${col}`:"2.5px solid transparent",background:"transparent",color:isActive?col:T.text3,cursor:"pointer",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:1,transition:"color 0.15s"}}>
                        <span style={{fontSize:"clamp(11px,0.86vw,13px)",fontWeight:isActive?800:500}}>{d}</span>
                        <span style={{fontSize:"clamp(9px,0.65vw,11px)",color:isToday?col:isActive?T.text3:T.text4,fontWeight:isToday?700:400}}>{fmtS(date)}</span>
                        {isToday&&<div style={{width:3,height:3,borderRadius:"50%",background:col,marginTop:-1}}/>}
                      </button>
                    );
                  })}
                </div>
              )
              : <div style={{flex:1,padding:"0 0 clamp(7px,0.8vw,10px)",display:"flex",alignItems:"center"}}><span style={{fontSize:"clamp(13px,1vw,16px)",fontWeight:800,color:T.text1}}>Settings</span></div>
            }

            {/* View tabs */}
            <div style={{display:"flex",gap:0,flexShrink:0}}>
              {VIEWS.map(v=>{
                const active=view===v.toLowerCase();
                const isS=v==="Settings";
                return (
                  <button key={v} onClick={()=>setView(v.toLowerCase())} style={{
                    padding:"clamp(5px,0.6vw,9px) clamp(10px,1.1vw,15px) clamp(7px,0.8vw,11px)",
                    border:"none",
                    borderBottom:active?`2.5px solid ${isS?"#ff9f0a":T.accent}`:"2.5px solid transparent",
                    background:"transparent",
                    color:active?(isS?"#ff9f0a":T.accent):T.text3,
                    cursor:"pointer",fontSize:"clamp(11px,0.83vw,13px)",fontWeight:active?800:500,
                    transition:"color 0.15s",flexShrink:0,whiteSpace:"nowrap",
                  }}>{isS?"⚙ Settings":v}</button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{flex:1,padding:"clamp(16px,2vw,28px) clamp(16px,3vw,48px)",maxWidth:"clamp(600px,90vw,1100px)",margin:"0 auto",width:"100%"}}>

          {view==="settings"&&(
            <SettingsView settings={settings} setSettings={setSettings} taskTypes={taskTypes} setTaskTypes={setTaskTypes} T={T} onApplySchedule={applySchedule}/>
          )}

          {view!=="settings"&&(
            <>
              {/* Day heading */}
              <div style={{display:"flex",alignItems:"center",gap:"clamp(7px,0.9vw,13px)",marginBottom:"clamp(12px,1.4vw,20px)",flexWrap:"wrap"}}>
                <h1 style={{fontSize:"clamp(22px,2.6vw,38px)",fontWeight:900,color:T.text1,letterSpacing:-0.8}}>{DAY_LABELS[day]}</h1>
                <span style={{fontSize:"clamp(10px,0.8vw,13px)",color:T.text3,fontWeight:500}}>{fmtF(dayDate)}</span>
                <span style={{padding:"clamp(3px,0.3vw,4px) clamp(9px,0.9vw,13px)",borderRadius:20,background:`rgba(${hex2rgb(accent)},0.13)`,color:accent,fontSize:"clamp(9px,0.66vw,11px)",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase"}}>{isAR?"AntRidge Day":"Quadrical Day"}</span>
                <div style={{marginLeft:"auto",display:"flex",gap:"clamp(7px,0.9vw,13px)",flexWrap:"wrap"}}>
                  {taskTypes.map(tt=>{ const h=totalH(dayBlocks,tt.id); return h?<span key={tt.id} style={{fontSize:"clamp(11px,0.83vw,13px)",fontWeight:700,color:tt.color}}>{h}h {tt.label.split(" ")[0]}</span>:null; })}
                </div>
              </div>

              <Timeline blocks={dayBlocks} T={T}/>

              {/* ── MERGED PLAN + LOG VIEW ── */}
              {view==="plan"&&(
                <div className="fu" style={{display:"flex",flexDirection:"column",gap:"clamp(7px,0.7vw,10px)"}}>
                  {dayBlocks.map(b=>{
                    const tt=taskTypes.find(t=>t.id===b.type)||{color:"#888",label:"?"};
                    const isEd=editing===`${day}-${b.id}`;
                    return (
                      <div key={b.id} className="hb" style={{
                        background:isEd?(T.isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.02)"):T.bgElevated,
                        border:`1px solid ${isEd?tt.color+"44":T.border}`,
                        borderLeft:`3.5px solid ${tt.color}`,
                        borderRadius:"clamp(12px,1.1vw,16px)",
                        boxShadow:isEd?`0 0 0 3px rgba(${hex2rgb(tt.color)},0.09)`:T.shadowSm,
                        overflow:"hidden",
                        transition:"all 0.15s",
                      }}>
                        {/* ── Top row: time | dur | label | type | delete ── */}
                        <div style={{display:"flex",alignItems:"center",gap:"clamp(8px,1vw,14px)",padding:"clamp(10px,1.1vw,14px) clamp(12px,1.3vw,18px)"}}>
                          {/* Times */}
                          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,minWidth:"clamp(50px,4.5vw,66px)"}}>
                            <input value={b.start} onChange={e=>updB(day,b.id,"start",e.target.value)} style={{background:"transparent",border:"none",color:T.text2,fontSize:"clamp(11px,0.83vw,13px)",fontWeight:700,width:"100%",textAlign:"center"}}/>
                            <div style={{width:12,height:1,background:T.text4}}/>
                            <input value={b.end}   onChange={e=>updB(day,b.id,"end",e.target.value)}   style={{background:"transparent",border:"none",color:T.text2,fontSize:"clamp(11px,0.83vw,13px)",fontWeight:700,width:"100%",textAlign:"center"}}/>
                          </div>
                          {/* Duration badge */}
                          <div style={{background:`rgba(${hex2rgb(tt.color)},0.13)`,color:tt.color,fontSize:"clamp(10px,0.73vw,12px)",fontWeight:800,padding:"clamp(2px,0.2vw,3px) clamp(7px,0.7vw,10px)",borderRadius:20,whiteSpace:"nowrap",flexShrink:0}}>{durH(b)}h</div>
                          {/* Label */}
                          <input value={b.label} onChange={e=>updB(day,b.id,"label",e.target.value)} onFocus={()=>setEditing(`${day}-${b.id}`)} onBlur={()=>setEditing(null)} style={{flex:1,background:"transparent",border:"none",color:T.text1,fontSize:"clamp(13px,1.02vw,15px)",fontWeight:600}}/>
                          {/* Type */}
                          <select value={b.type} onChange={e=>updB(day,b.id,"type",e.target.value)} style={{background:T.bgCard,border:`1px solid ${T.border}`,color:tt.color,fontSize:"clamp(10px,0.73vw,12px)",borderRadius:8,padding:"clamp(4px,0.35vw,5px) clamp(6px,0.65vw,9px)",cursor:"pointer",fontWeight:700,flexShrink:0}}>
                            {taskTypes.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                          </select>
                          {/* Delete */}
                          <button className="hs" onClick={()=>remB(day,b.id)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"clamp(15px,1.2vw,19px)",lineHeight:1,opacity:0.6,flexShrink:0}}>×</button>
                        </div>

                        {/* ── Log row: inline "what happened" textarea ── */}
                        <div style={{
                          borderTop:`1px solid ${T.border}`,
                          padding:"clamp(8px,0.9vw,12px) clamp(12px,1.3vw,18px)",
                          background:T.isDark?"rgba(0,0,0,0.12)":"rgba(0,0,0,0.02)",
                          display:"flex",alignItems:"flex-start",gap:"clamp(8px,0.9vw,12px)",
                        }}>
                          <div style={{display:"flex",alignItems:"center",gap:5,paddingTop:2,flexShrink:0}}>
                            <div style={{width:6,height:6,borderRadius:"50%",background:tt.color,opacity:0.6}}/>
                            <span style={{fontSize:"clamp(9px,0.63vw,10px)",color:T.text3,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",whiteSpace:"nowrap"}}>Log</span>
                          </div>
                          <textarea
                            value={b.actual||""}
                            onChange={e=>{
                              updB(day,b.id,"actual",e.target.value);
                              e.target.style.height="auto";
                              e.target.style.height=e.target.scrollHeight+"px";
                            }}
                            placeholder="What actually happened? Notes, delays, wins…"
                            rows={(b.actual||"").split("\n").length||1}
                            style={{
                              flex:1,background:"transparent",border:"none",
                              color:T.text2,fontSize:"clamp(12px,0.86vw,13px)",
                              fontWeight:500,lineHeight:1.6,resize:"vertical",
                              fontFamily:"inherit",minHeight:22,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <button className="hd" onClick={()=>addB(day)} style={{marginTop:4,padding:"clamp(11px,1.1vw,14px)",border:`1.5px dashed ${T.border}`,borderRadius:"clamp(12px,1.1vw,16px)",background:"transparent",color:T.text3,fontSize:"clamp(12px,0.88vw,14px)",fontWeight:700,cursor:"pointer",width:"100%",letterSpacing:0.3,transition:"all 0.15s"}}>+ Add Block</button>

                  {/* Daily notes */}
                  <div style={{marginTop:6,padding:"clamp(12px,1.2vw,16px) clamp(14px,1.4vw,20px)",background:T.bgElevated,border:`1px solid ${T.border}`,borderRadius:"clamp(12px,1.1vw,16px)",boxShadow:T.shadowSm}}>
                    <div style={{fontSize:"clamp(9px,0.63vw,10px)",color:T.text3,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Daily Reflection</div>
                    <textarea value={logs[day]||""} onChange={e=>setLogs(p=>({...p,[day]:e.target.value}))} placeholder="Wins, blockers, what to do differently tomorrow…" rows={3} style={{width:"100%",background:"transparent",border:"none",color:T.text2,fontSize:"clamp(12px,0.88vw,14px)",fontWeight:500,lineHeight:1.7,resize:"none",fontFamily:"inherit"}}/>
                  </div>
                </div>
              )}

              {/* ── SUMMARY VIEW ── */}
              {view==="summary"&&(
                <div className="fu">
                  {/* Stat cards */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(clamp(120px,15vw,180px),1fr))",gap:"clamp(8px,1vw,13px)",marginBottom:"clamp(14px,1.8vw,24px)"}}>
                    {taskTypes.map(tt=>{ const h=Object.values(enriched).reduce((a,bs)=>a+totalH(bs,tt.id),0); return h?(
                      <div key={tt.id} style={{background:T.bgElevated,border:`1px solid ${T.border}`,borderTop:`3px solid ${tt.color}`,borderRadius:"clamp(12px,1.2vw,17px)",padding:"clamp(13px,1.4vw,18px) clamp(14px,1.6vw,22px)",boxShadow:T.shadowSm}}>
                        <div style={{fontSize:"clamp(9px,0.66vw,11px)",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:5}}>{tt.label}</div>
                        <div style={{fontSize:"clamp(22px,2.3vw,32px)",fontWeight:900,color:tt.color,lineHeight:1}}>{h}h</div>
                      </div>
                    ):null;})}
                    {totalQ+totalA>0&&(
                      <div style={{background:T.bgElevated,border:`1px solid ${T.border}`,borderTop:`3px solid ${T.text3}`,borderRadius:"clamp(12px,1.2vw,17px)",padding:"clamp(13px,1.4vw,18px) clamp(14px,1.6vw,22px)",boxShadow:T.shadowSm}}>
                        <div style={{fontSize:"clamp(9px,0.66vw,11px)",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:5}}>AntRidge %</div>
                        <div style={{fontSize:"clamp(22px,2.3vw,32px)",fontWeight:900,color:T.text2,lineHeight:1}}>{Math.round(totalA/(totalQ+totalA)*100)}%</div>
                      </div>
                    )}
                  </div>

                  {/* Week strips */}
                  <div style={{background:T.bgElevated,border:`1px solid ${T.border}`,borderRadius:"clamp(13px,1.3vw,18px)",padding:"clamp(14px,1.5vw,22px) clamp(16px,1.7vw,24px)",marginBottom:"clamp(10px,1.2vw,16px)",boxShadow:T.shadowSm}}>
                    <div style={{fontSize:"clamp(9px,0.66vw,11px)",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:"clamp(10px,1.2vw,16px)"}}>Week at a Glance — 24h</div>
                    {DAYS.map((d,i)=>{
                      const roleT=taskTypes.find(t=>t.id===(DAY_ROLE[d]==="a"?"a":"q"));
                      const col=roleT?.color||T.accent;
                      const date=getDayDate(weekStart,i);
                      return (
                        <div key={d} style={{display:"flex",alignItems:"center",gap:"clamp(7px,0.9vw,13px)",marginBottom:"clamp(4px,0.45vw,7px)"}}>
                          <div style={{minWidth:"clamp(60px,5.5vw,86px)"}}>
                            <span style={{fontSize:"clamp(11px,0.83vw,13px)",fontWeight:800,color:col}}>{d} </span>
                            <span style={{fontSize:"clamp(9px,0.65vw,11px)",color:T.text3,fontWeight:500}}>{fmtS(date)}</span>
                          </div>
                          <div style={{flex:1,position:"relative",height:"clamp(14px,1.4vw,20px)",background:T.isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",borderRadius:4,overflow:"hidden",border:`1px solid ${T.border}`}}>
                            {enriched[d].map((b,bi)=>{
                              const sp=(toM(b.start)/(24*60))*100;
                              const wp=Math.max((toM(b.end)-toM(b.start))/(24*60)*100,0.3);
                              return <div key={bi} title={b.label} style={{position:"absolute",left:`${sp}%`,width:`${wp}%`,top:2,bottom:2,background:b._color||"#888",borderRadius:2,opacity:0.85}}/>;
                            })}
                          </div>
                          <span style={{fontSize:"clamp(11px,0.8vw,13px)",minWidth:"clamp(46px,4.5vw,66px)",textAlign:"right",fontWeight:700}}>
                            {taskTypes.map(tt=>{ const h=totalH(enriched[d],tt.id); return h?<span key={tt.id} style={{color:tt.color}}>{h}h </span>:null; })}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Logs / reflections */}
                  <div style={{background:T.bgElevated,border:`1px solid ${T.border}`,borderRadius:"clamp(13px,1.3vw,18px)",padding:"clamp(14px,1.5vw,22px) clamp(16px,1.7vw,24px)",boxShadow:T.shadowSm}}>
                    <div style={{fontSize:"clamp(9px,0.66vw,11px)",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:"clamp(10px,1.1vw,14px)"}}>Daily Reflections</div>
                    {DAYS.map(d=>logs[d]?(
                      <div key={d} style={{marginBottom:"clamp(10px,1vw,14px)"}}>
                        <div style={{fontSize:"clamp(11px,0.82vw,13px)",fontWeight:800,color:taskTypes.find(t=>t.id===(DAY_ROLE[d]==="a"?"a":"q"))?.color||T.accent,marginBottom:3}}>{DAY_LABELS[d]}</div>
                        <div style={{fontSize:"clamp(12px,0.86vw,14px)",color:T.text2,lineHeight:1.7,fontWeight:500}}>{logs[d]}</div>
                      </div>
                    ):null)}
                    {!DAYS.some(d=>logs[d])&&<div style={{fontSize:"clamp(12px,0.86vw,14px)",color:T.text3,fontWeight:500}}>No reflections yet — add notes in the Plan view.</div>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
