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
const DAYS        = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DAY_LABELS  = { Mon:"Monday",Tue:"Tuesday",Wed:"Wednesday",Thu:"Thursday",Fri:"Friday",Sat:"Saturday",Sun:"Sunday" };
const DAY_ROLE    = { Mon:"q",Tue:"q",Wed:"q",Thu:"q",Fri:"q",Sat:"a",Sun:"a" };
const BLOCK_DURATIONS = [1, 1.5, 2, 2.5, 3];
const SWATCH_COLORS   = ["#0a84ff","#30d158","#ff9f0a","#bf5af2","#64d2ff","#ff453a","#ff6b81","#ffd60a","#00c7be","#ac8e68"];
const DEFAULT_TYPES = [
  { id:"q", label:"Quadrical", color:"#0a84ff" },
  { id:"a", label:"AntRidge",  color:"#30d158" },
  { id:"b", label:"Break",     color:"#ff9f0a" },
  { id:"p", label:"Personal",  color:"#bf5af2" },
  { id:"f", label:"Focus",     color:"#64d2ff" },
];
const DEFAULT_LOGS     = Object.fromEntries(DAYS.map(d=>[d,""]));
const DEFAULT_SETTINGS = { dayStart:6, dayEnd:23, blockDuration:2, sleepStart:23, sleepEnd:6 };

/* ─── Block generator ─────────────────────────────────────────────────────── */
function pad(h) { return String(Math.floor(h)).padStart(2,"0")+":"+(h%1===0.5?"30":"00"); }
function makeBlocks(settings, roleTypeId) {
  const { dayStart, dayEnd, blockDuration, sleepStart, sleepEnd } = settings;
  const blocks=[]; let id=1;
  if (sleepEnd>0) blocks.push({id:id++,label:"Sleep",start:"00:00",end:pad(sleepEnd),type:"b",actual:""});
  if (sleepEnd<dayStart) blocks.push({id:id++,label:"Morning Routine",start:pad(sleepEnd),end:pad(dayStart),type:"b",actual:""});
  let cursor=dayStart, slotIdx=0;
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
const fmtSec = s=>{ const h=Math.floor(s/3600); const m=Math.floor((s%3600)/60); const sc=s%60; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`; };
function getWeekStart(off=0){ const t=new Date(),day=t.getDay(); const d=new Date(t); d.setDate(t.getDate()-day+(day===0?-6:1)+off*7); d.setHours(0,0,0,0); return d; }
const getDayDate=(ws,i)=>{ const d=new Date(ws); d.setDate(d.getDate()+i); return d; };
const fmtS=d=>d.toLocaleDateString("en-IN",{day:"numeric",month:"short"});
const fmtF=d=>d.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const h12=h=>h===0?"12am":h===12?"12pm":h<12?`${h}am`:`${h-12}pm`;

/* ─── Theme ───────────────────────────────────────────────────────────────── */
function getTheme(isAntRidge) {
  return isAntRidge ? {
    bg:"#1c1c1e", bgElevated:"#2c2c2e", bgCard:"#3a3a3c",
    bgGlass:"rgba(44,44,46,0.88)", border:"rgba(255,255,255,0.09)",
    borderGlass:"rgba(255,255,255,0.13)",
    text1:"#ffffff", text2:"rgba(235,235,245,0.75)",
    text3:"rgba(235,235,245,0.38)", text4:"rgba(235,235,245,0.15)",
    shadow:"0 8px 32px rgba(0,0,0,0.55)", shadowSm:"0 2px 12px rgba(0,0,0,0.38)",
    liquidStart:"rgba(255,255,255,0.07)", red:"#ff453a",
    accent:"#30d158", isDark:true,
  } : {
    bg:"#f2f2f7", bgElevated:"#ffffff", bgCard:"#f2f2f7",
    bgGlass:"rgba(255,255,255,0.85)", border:"rgba(0,0,0,0.08)",
    borderGlass:"rgba(255,255,255,0.88)",
    text1:"#000000", text2:"rgba(60,60,67,0.80)",
    text3:"rgba(60,60,67,0.48)", text4:"rgba(60,60,67,0.18)",
    shadow:"0 8px 32px rgba(0,0,0,0.13)", shadowSm:"0 2px 12px rgba(0,0,0,0.08)",
    liquidStart:"rgba(255,255,255,0.95)", red:"#ff3b30",
    accent:"#0a84ff", isDark:false,
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
      html{font-size:16px;}
      body{background:${isDark?"#1c1c1e":"#f2f2f7"};font-family:'Manrope',-apple-system,sans-serif;-webkit-font-smoothing:antialiased;transition:background 0.35s;}
      input,textarea,select{font-family:inherit;font-size:inherit;}
      ::-webkit-scrollbar{width:5px;height:5px;}
      ::-webkit-scrollbar-thumb{background:rgba(128,128,128,0.25);border-radius:3px;}
      .hs{transition:transform 0.15s;cursor:pointer;}.hs:hover{transform:scale(1.07);}
      .hb{transition:background 0.14s;}.hb:hover{background:rgba(128,128,128,0.06)!important;}
      .hd{transition:all 0.14s;}.hd:hover{border-color:rgba(128,128,128,0.3)!important;background:rgba(128,128,128,0.04)!important;}
      @keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
      .fu{animation:fadeUp 0.22s ease forwards;}
      @keyframes mIn{from{opacity:0;transform:scale(0.96) translateY(8px);}to{opacity:1;transform:scale(1) translateY(0);}}
      .mi{animation:mIn 0.24s cubic-bezier(0.34,1.15,0.64,1) forwards;}
      @keyframes runPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,159,10,0.45);}50%{box-shadow:0 0 0 8px rgba(255,159,10,0);}}
      .run-pulse{animation:runPulse 1.7s ease infinite;}
      input[type=range]{-webkit-appearance:none;appearance:none;height:5px;border-radius:3px;outline:none;cursor:pointer;}
      input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#0a84ff;cursor:pointer;box-shadow:0 2px 7px rgba(10,132,255,0.4);}
      textarea,input,select{outline:none;}
    `;
  },[isDark]);
  return null;
}

/* ─── 24h Timeline ────────────────────────────────────────────────────────── */
function Timeline({ blocks, T }) {
  const [now, setNow] = useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),60000); return ()=>clearInterval(t); },[]);
  const nowPct=((now.getHours()*60+now.getMinutes())/(24*60))*100;
  return (
    <div style={{marginBottom:22}}>
      <div style={{position:"relative",height:18,marginBottom:5}}>
        {[0,6,12,18,24].map(h=>(
          <div key={h} style={{position:"absolute",left:`${(h/24)*100}%`,transform:"translateX(-50%)",fontSize:11,color:T.text3,fontWeight:600}}>{h12(h)}</div>
        ))}
      </div>
      <div style={{position:"relative",height:48,background:T.isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",borderRadius:12,overflow:"hidden",border:`1px solid ${T.border}`}}>
        {[6,12,18].map(h=><div key={h} style={{position:"absolute",left:`${(h/24)*100}%`,top:0,bottom:0,width:1,background:T.border}}/>)}
        {blocks.map((b,i)=>{
          const sp=(toM(b.start)/(24*60))*100;
          const wp=Math.max((toM(b.end)-toM(b.start))/(24*60)*100,0.4);
          return (
            <div key={b.id||i} title={`${b.label}  ${b.start}–${b.end}`}
              style={{position:"absolute",left:`${sp}%`,width:`${wp}%`,top:6,bottom:6,background:b._color||"#555",borderRadius:5,opacity:0.88,display:"flex",alignItems:"center",overflow:"hidden",paddingLeft:4}}>
              {wp>5&&<span style={{fontSize:10,color:"#fff",fontWeight:800,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{durH(b)>=1?b.label:""}</span>}
            </div>
          );
        })}
        <div style={{position:"absolute",left:`${nowPct}%`,top:0,bottom:0,width:2,background:T.red,zIndex:10}}>
          <div style={{position:"absolute",top:-3,left:-4,width:10,height:10,borderRadius:"50%",background:T.red}}/>
        </div>
      </div>
    </div>
  );
}

/* ─── Stop Log Modal ──────────────────────────────────────────────────────── */
function StopLogModal({ T, elapsed, pausedSecs, startedAt, stoppedAt, blocks, isAntRidge, taskTypes, onSave, onDiscard }) {
  const [input,   setInput]   = useState("");
  const [bullets, setBullets] = useState([]);
  const inputRef = useRef(null);

  const startMin     = startedAt ? (new Date(startedAt).getHours()*60+new Date(startedAt).getMinutes()) : -1;
  const matchedBlock = blocks.find(b=>startMin>=toM(b.start)&&startMin<toM(b.end));
  const activeMin    = Math.round(elapsed/60);
  const breakMin     = Math.round((pausedSecs||0)/60);
  const modeType     = isAntRidge ? taskTypes.find(t=>t.id==="a") : taskTypes.find(t=>t.id==="q");
  const modeColor    = modeType?.color || T.accent;
  const modeLabel    = modeType?.label || (isAntRidge?"AntRidge":"Quadrical");
  const timeStr      = stoppedAt ? new Date(stoppedAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "";

  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(),80); },[]);
  const handleKey = e=>{ if(e.key==="Enter"){e.preventDefault();const t=input.trim();if(t){setBullets(p=>[...p,t]);setInput("");}} };
  const removeBullet = i=>setBullets(p=>p.filter((_,idx)=>idx!==i));
  const handleSave = ()=>{
    const all = input.trim() ? [...bullets,input.trim()] : bullets;
    onSave(all, matchedBlock?.id, elapsed, pausedSecs, timeStr, modeLabel, modeColor);
  };

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:9999,
      background:"rgba(0,0,0,0.65)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20,
    }} onClick={e=>e.target===e.currentTarget&&onDiscard()}>
      <div className="mi" style={{
        background:T.bgElevated,border:`1px solid ${T.border}`,
        borderRadius:24,padding:32,
        width:"min(580px,96vw)",maxHeight:"88vh",overflowY:"auto",
        boxShadow:T.shadow,
      }}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22}}>
          <div style={{flex:1}}>
            <div style={{fontSize:22,fontWeight:900,color:T.text1,marginBottom:10}}>What did you do?</div>
            <div style={{display:"flex",alignItems:"center",gap:9,flexWrap:"wrap",marginBottom:8}}>
              <div style={{background:"rgba(255,159,10,0.13)",border:"1px solid rgba(255,159,10,0.3)",borderRadius:8,padding:"5px 13px",fontSize:14,fontWeight:800,color:"#ff9f0a",fontFamily:"monospace",letterSpacing:1}}>
                ▶ {fmtSec(elapsed)}
              </div>
              {breakMin>0&&(
                <div style={{background:"rgba(100,210,255,0.1)",border:"1px solid rgba(100,210,255,0.28)",borderRadius:8,padding:"5px 13px",fontSize:14,fontWeight:700,color:"#64d2ff"}}>
                  ⏸ {breakMin}m break
                </div>
              )}
              <div style={{background:`rgba(${hex2rgb(modeColor)},0.12)`,border:`1px solid rgba(${hex2rgb(modeColor)},0.3)`,borderRadius:8,padding:"5px 13px",fontSize:14,fontWeight:700,color:modeColor}}>
                {modeLabel}
              </div>
              {timeStr&&<div style={{fontSize:13,color:T.text3,fontWeight:500}}>saved at {timeStr}</div>}
            </div>
            {matchedBlock&&(
              <div style={{fontSize:14,color:T.text3}}>
                → <span style={{color:matchedBlock._color||T.accent,fontWeight:700}}>{matchedBlock.label}</span>
              </div>
            )}
          </div>
          <button onClick={onDiscard} className="hs" style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"50%",width:36,height:36,cursor:"pointer",color:T.text2,fontSize:19,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:12}}>×</button>
        </div>

        {/* Bullets */}
        {bullets.length>0&&(
          <div style={{marginBottom:14,display:"flex",flexDirection:"column",gap:7}}>
            {bullets.map((b,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,background:T.isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.03)",borderRadius:11,padding:"10px 15px",border:`1px solid ${T.border}`}}>
                <span style={{color:T.accent,fontWeight:900,marginTop:2,flexShrink:0,fontSize:17}}>•</span>
                <span style={{flex:1,fontSize:15,color:T.text1,fontWeight:500,lineHeight:1.55}}>{b}</span>
                <button onClick={()=>removeBullet(i)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:17,lineHeight:1,flexShrink:0}}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Input row */}
        <div style={{display:"flex",alignItems:"center",gap:10,background:T.bgCard,border:`1.5px solid ${T.accent}55`,borderRadius:13,padding:"13px 16px",marginBottom:20}}>
          <span style={{color:T.accent,fontWeight:900,fontSize:19,flexShrink:0}}>•</span>
          <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
            placeholder={bullets.length===0?"Type what you did, press Enter to add a bullet…":"Add another bullet, or press Save"}
            style={{flex:1,background:"transparent",border:"none",color:T.text1,fontSize:15,fontWeight:500}}/>
          {input.trim()&&<span style={{fontSize:12,color:T.text3,fontWeight:600,whiteSpace:"nowrap"}}>↵ Enter</span>}
        </div>

        {/* Footer */}
        <div style={{display:"flex",gap:10}}>
          <button onClick={onDiscard} style={{flex:1,background:"transparent",border:`1px solid ${T.border}`,borderRadius:13,color:T.text3,fontSize:15,fontWeight:600,padding:14,cursor:"pointer"}}>Discard</button>
          <button onClick={handleSave} style={{flex:2,background:T.accent,border:"none",borderRadius:13,color:"#fff",fontSize:16,fontWeight:800,padding:14,cursor:"pointer"}}>
            Save to {matchedBlock?matchedBlock.label:"Daily Log"} →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Break Timer ─────────────────────────────────────────────────────────── */
function BreakTimer({ T, blocks, isAntRidge, taskTypes, onLogToBlock }) {
  // All persisted — survives refresh + browser close
  const [timerState, setTimerState] = usePS("wp_timerState","idle");
  const [startedAt,  setStartedAt]  = usePS("wp_timerStart", null);  // ISO wall-clock start
  const [pausedMs,   setPausedMs]   = usePS("wp_timerPaused",0);     // accumulated pause ms
  const [pauseBegin, setPauseBegin] = usePS("wp_timerPB",    null);  // ISO when current pause began
  const [totalBreak, setTotalBreak] = usePS("wp_breakTotal", 0);

  const [display,   setDisplay]   = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [snap,      setSnap]      = useState({elapsed:0,paused:0,stoppedAt:null,startedAt:null});
  const rafRef = useRef(null);

  const computeSecs = ()=>{
    if (!startedAt) return 0;
    const wallMs = Date.now() - new Date(startedAt).getTime();
    const curPauseMs = (timerState==="paused"&&pauseBegin) ? (Date.now()-new Date(pauseBegin).getTime()) : 0;
    return Math.max(0, Math.floor((wallMs - pausedMs - curPauseMs) / 1000));
  };

  // rAF loop — smooth, no drift
  useEffect(()=>{
    if (timerState==="running") {
      const tick=()=>{ setDisplay(computeSecs()); rafRef.current=requestAnimationFrame(tick); };
      rafRef.current=requestAnimationFrame(tick);
      return ()=>cancelAnimationFrame(rafRef.current);
    } else {
      setDisplay(computeSecs());
    }
    // eslint-disable-next-line
  },[timerState,startedAt,pausedMs,pauseBegin]);

  // Catchup on mount if running before refresh
  useEffect(()=>{ if(timerState!=="idle") setDisplay(computeSecs()); },[]);// eslint-disable-line

  const onPlay=()=>{
    if(timerState==="idle"){
      setStartedAt(new Date().toISOString());
      setPausedMs(0);
      setPauseBegin(null);
    } else if(timerState==="paused"&&pauseBegin){
      setPausedMs(p=>p+(Date.now()-new Date(pauseBegin).getTime()));
      setPauseBegin(null);
    }
    setTimerState("running");
  };

  const onPause=()=>{ setPauseBegin(new Date().toISOString()); setTimerState("paused"); };

  const onStop=()=>{
    cancelAnimationFrame(rafRef.current);
    const elapsed=computeSecs();
    const curPauseMs=pauseBegin?(Date.now()-new Date(pauseBegin).getTime()):0;
    const totalPauseSecs=Math.round((pausedMs+curPauseMs)/1000);
    setSnap({elapsed,paused:totalPauseSecs,stoppedAt:new Date().toISOString(),startedAt});
    setTimerState("idle");
    setPauseBegin(null);
    setShowModal(true);
  };

  const handleSave=(bullets,blockId,elapsed,pauseSecs,timeStr,modeLabel,modeColor)=>{
    setTotalBreak(t=>t+elapsed);
    onLogToBlock(bullets,blockId,elapsed,pauseSecs,timeStr,modeLabel,modeColor);
    setShowModal(false); setStartedAt(null); setPausedMs(0); setDisplay(0);
  };
  const handleDiscard=()=>{ setShowModal(false); setStartedAt(null); setPausedMs(0); setDisplay(0); };

  const btn=(extra)=>({width:40,height:40,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.18s",flexShrink:0,border:"none",...extra});

  return (
    <>
      {showModal&&(
        <StopLogModal T={T} elapsed={snap.elapsed} pausedSecs={snap.paused}
          startedAt={snap.startedAt} stoppedAt={snap.stoppedAt}
          blocks={blocks} isAntRidge={isAntRidge} taskTypes={taskTypes}
          onSave={handleSave} onDiscard={handleDiscard}/>
      )}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {timerState!=="idle"&&(
          <div style={{fontFamily:"monospace",fontSize:14,fontWeight:800,letterSpacing:1,
            color:timerState==="paused"?T.text3:"#ff9f0a",
            background:timerState==="paused"?"rgba(128,128,128,0.1)":"rgba(255,159,10,0.12)",
            border:`1px solid ${timerState==="paused"?T.border:"rgba(255,159,10,0.32)"}`,
            borderRadius:9,padding:"4px 12px",transition:"all 0.25s",
          }}>{fmtSec(display)}</div>
        )}
        {(timerState==="idle"||timerState==="paused")&&(
          <button onClick={onPlay} className="hs" title={timerState==="paused"?"Resume":"Start timer"}
            style={btn({border:`1.5px solid ${timerState==="paused"?"rgba(255,159,10,0.5)":T.border}`,background:timerState==="paused"?"rgba(255,159,10,0.1)":T.isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)"})}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 2.5L11.5 7L3 11.5V2.5Z" fill={timerState==="paused"?"#ff9f0a":T.text2}/>
            </svg>
          </button>
        )}
        {timerState==="running"&&(
          <button onClick={onPause} className="run-pulse" title="Pause"
            style={btn({border:"1.5px solid rgba(255,159,10,0.55)",background:"rgba(255,159,10,0.14)"})}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="2" width="3.5" height="10" rx="1.5" fill="#ff9f0a"/>
              <rect x="8.5" y="2" width="3.5" height="10" rx="1.5" fill="#ff9f0a"/>
            </svg>
          </button>
        )}
        {timerState!=="idle"&&(
          <button onClick={onStop} className="hs" title="Stop & log"
            style={btn({border:"1.5px solid rgba(255,69,58,0.45)",background:"rgba(255,69,58,0.1)"})}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1.5" y="1.5" width="9" height="9" rx="2" fill="#ff453a"/>
            </svg>
          </button>
        )}
        {timerState==="idle"&&totalBreak>60&&(
          <span style={{fontSize:13,color:T.text3,fontWeight:600,whiteSpace:"nowrap"}}>{Math.round(totalBreak/60)}m today</span>
        )}
      </div>
    </>
  );
}

/* ─── Q/A Toggle ──────────────────────────────────────────────────────────── */
function ModeToggle({ isAntRidge, onChange, T }) {
  return (
    <button onClick={()=>onChange(!isAntRidge)} title={isAntRidge?"Switch to Quadrical":"Switch to AntRidge"}
      style={{display:"flex",alignItems:"center",gap:8,background:T.isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.04)",border:`1px solid ${T.borderGlass}`,borderRadius:28,padding:"6px 14px 6px 10px",cursor:"pointer",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",transition:"all 0.25s",flexShrink:0}}>
      <span style={{fontSize:13,fontWeight:800,color:!isAntRidge?"#0a84ff":T.text4,transition:"color 0.25s",letterSpacing:0.5}}>Q</span>
      <div style={{width:48,height:26,borderRadius:20,position:"relative",background:isAntRidge?"linear-gradient(135deg,#1a3a2a,#0d2218)":"linear-gradient(135deg,#d6eaff,#e8f4ff)",border:`1px solid ${isAntRidge?"rgba(48,209,88,0.3)":"rgba(10,132,255,0.25)"}`,transition:"all 0.28s",flexShrink:0}}>
        <div style={{position:"absolute",top:"50%",transform:"translateY(-50%)",left:isAntRidge?"calc(100% - 23px)":"3px",width:20,height:20,borderRadius:"50%",background:isAntRidge?"linear-gradient(135deg,#30d158,#25a244)":"linear-gradient(135deg,#0a84ff,#0060d0)",boxShadow:"0 2px 6px rgba(0,0,0,0.28)",transition:"left 0.28s cubic-bezier(0.34,1.2,0.64,1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"rgba(255,255,255,0.75)"}}/>
        </div>
      </div>
      <span style={{fontSize:13,fontWeight:800,color:isAntRidge?"#30d158":T.text4,transition:"color 0.25s",letterSpacing:0.5}}>A</span>
    </button>
  );
}

/* ─── Pill Selector ───────────────────────────────────────────────────────── */
function PillSelector({ options, value, onChange, T, color="#0a84ff" }) {
  return (
    <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
      {options.map(o=>{const active=o.value===value;return(
        <button key={o.value} onClick={()=>onChange(o.value)} style={{padding:"6px 16px",borderRadius:24,border:`1.5px solid ${active?color:T.border}`,background:active?`rgba(${hex2rgb(color)},0.13)`:"transparent",color:active?color:T.text2,fontSize:14,fontWeight:active?800:500,cursor:"pointer",transition:"all 0.15s"}}>{o.label}</button>
      );})}
    </div>
  );
}

/* ─── Hour Slider ─────────────────────────────────────────────────────────── */
function HourSlider({ label, value, min=0, max=23, onChange, T, color="#0a84ff" }) {
  return (
    <div style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
        <span style={{fontSize:14,color:T.text2,fontWeight:600}}>{label}</span>
        <span style={{fontSize:15,fontWeight:800,color}}>{h12(value)}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}
        style={{width:"100%",accentColor:color,background:`linear-gradient(to right,${color} ${((value-min)/(max-min))*100}%,${T.bgCard} ${((value-min)/(max-min))*100}%)`}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
        <span style={{fontSize:11,color:T.text4,fontWeight:500}}>{h12(min)}</span>
        <span style={{fontSize:11,color:T.text4,fontWeight:500}}>{h12(max)}</span>
      </div>
    </div>
  );
}

/* ─── Settings View ───────────────────────────────────────────────────────── */
function SettingsView({ settings, setSettings, taskTypes, setTaskTypes, T, onApplySchedule }) {
  const [types,    setTypes]    = useState(taskTypes.map(t=>({...t})));
  const [sets,     setSets]     = useState({...settings});
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#ff6b81");
  const [dirty,    setDirty]    = useState(false);

  const updateSet=(k,v)=>{setSets(p=>({...p,[k]:v}));setDirty(true);};
  const updateType=(id,f,v)=>{setTypes(p=>p.map(t=>t.id===id?{...t,[f]:v}:t));setDirty(true);};
  const removeType=id=>{setTypes(p=>p.filter(t=>t.id!==id));setDirty(true);};
  const addType=()=>{if(!newLabel.trim())return;setTypes(p=>[...p,{id:`t_${Date.now()}`,label:newLabel.trim(),color:newColor}]);setNewLabel("");setDirty(true);};
  const save=()=>{setTaskTypes(types);setSettings(sets);setDirty(false);};
  const applyAndSave=()=>{setTaskTypes(types);setSettings(sets);setDirty(false);onApplySchedule(sets);};

  const Sec=({title,children})=>(
    <div style={{marginBottom:32}}>
      <div style={{fontSize:11,fontWeight:800,letterSpacing:2,textTransform:"uppercase",color:T.text3,marginBottom:16,paddingBottom:9,borderBottom:`1px solid ${T.border}`}}>{title}</div>
      {children}
    </div>
  );
  const Info=({col="#ff9f0a",children})=>(
    <div style={{background:`rgba(${hex2rgb(col)},0.07)`,border:`1px solid rgba(${hex2rgb(col)},0.22)`,borderRadius:11,padding:14,marginBottom:14}}>
      <p style={{fontSize:13,color:col,fontWeight:500,lineHeight:1.65}}>{children}</p>
    </div>
  );

  return (
    <div className="fu" style={{maxWidth:640}}>
      <Sec title="Schedule">
        <Info col={T.accent}>Mon–Fri = Quadrical days. Sat–Sun = AntRidge days. The Q/A toggle in the header overrides which mode the timer logs under — it does not change the day's default block types.</Info>
        <HourSlider label="Day starts" value={sets.dayStart} min={4} max={12} onChange={v=>updateSet("dayStart",v)} T={T} color={T.accent}/>
        <HourSlider label="Day ends"   value={sets.dayEnd}   min={16} max={23} onChange={v=>updateSet("dayEnd",v)}   T={T} color={T.accent}/>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:14,color:T.text2,fontWeight:600,marginBottom:11}}>Default block duration</div>
          <PillSelector options={BLOCK_DURATIONS.map(d=>({value:d,label:`${d}h`}))} value={sets.blockDuration} onChange={v=>updateSet("blockDuration",v)} T={T} color={T.accent}/>
        </div>
      </Sec>

      <Sec title="Sleep">
        <HourSlider label="Lights out" value={sets.sleepStart} min={20} max={23} onChange={v=>updateSet("sleepStart",v)} T={T} color="#64d2ff"/>
        <HourSlider label="Wake up"    value={sets.sleepEnd}   min={4}  max={10} onChange={v=>updateSet("sleepEnd",v)}   T={T} color="#64d2ff"/>
        <div style={{background:T.bgCard,borderRadius:13,padding:16,border:`1px solid ${T.border}`}}>
          <div style={{height:10,background:T.isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",borderRadius:5,overflow:"hidden",position:"relative",marginBottom:10}}>
            <div style={{position:"absolute",left:`${(sets.sleepStart/24)*100}%`,right:0,top:0,bottom:0,background:"#64d2ff",opacity:0.7,borderRadius:5}}/>
            <div style={{position:"absolute",left:0,width:`${(sets.sleepEnd/24)*100}%`,top:0,bottom:0,background:"#64d2ff",opacity:0.7,borderRadius:5}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            {["12am","12pm","11:59pm"].map(l=><span key={l} style={{fontSize:11,color:T.text4,fontWeight:500}}>{l}</span>)}
          </div>
          <span style={{fontSize:14,color:T.text2,fontWeight:700}}>🌙 {h12(sets.sleepStart)} → ☀️ {h12(sets.sleepEnd)} · {((24-sets.sleepStart)+sets.sleepEnd).toFixed(1)}h sleep</span>
        </div>
      </Sec>

      <Sec title="Break Timer">
        <Info col="#ff9f0a">▶ Play starts the timer. ⏸ Pause freezes it — pause time is captured separately as break duration. ⏹ Stop opens the log modal. Type bullets of what you did, Enter per item, then Save. The log entry shows: time saved · active duration · break duration · Q/A mode. It appends to the matching time block's Actual column automatically.</Info>
        <Info col="#64d2ff">Timer survives page refresh and browser close. It resumes from where it left off using wall-clock time, so closing the tab mid-session will still count the time correctly.</Info>
      </Sec>

      <Sec title="Task Types">
        <Info col={T.accent}>The <b>q</b> (Quadrical) and <b>a</b> (AntRidge) types are system types — rename or recolour freely, but they cannot be deleted. All other types can be added and removed as needed.</Info>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
          {types.map(t=>(
            <div key={t.id} className="hb" style={{display:"flex",alignItems:"center",gap:10,background:T.bgCard,borderRadius:12,padding:"11px 16px",border:`1px solid ${T.border}`}}>
              <input type="color" value={t.color} onChange={e=>updateType(t.id,"color",e.target.value)} style={{width:34,height:34,borderRadius:8,border:`1px solid ${T.border}`,cursor:"pointer",padding:2,background:"transparent",flexShrink:0}}/>
              <div style={{width:9,height:9,borderRadius:"50%",background:t.color,flexShrink:0}}/>
              <input value={t.label} onChange={e=>updateType(t.id,"label",e.target.value)} style={{flex:1,background:"transparent",border:"none",color:T.text1,fontSize:15,fontWeight:600}}/>
              <span style={{fontSize:11,color:T.text4,fontFamily:"monospace"}}>{t.id}</span>
              {!["q","a"].includes(t.id)&&<button onClick={()=>removeType(t.id)} className="hs" style={{background:"none",border:"none",color:T.text3,cursor:"pointer",fontSize:19,lineHeight:1,opacity:0.7}}>×</button>}
            </div>
          ))}
        </div>
        <div style={{background:T.bgCard,borderRadius:14,padding:16,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color:T.text3,marginBottom:11}}>Add New Type</div>
          <div style={{display:"flex",gap:9,alignItems:"center",marginBottom:11,flexWrap:"wrap"}}>
            <input type="color" value={newColor} onChange={e=>setNewColor(e.target.value)} style={{width:36,height:36,borderRadius:8,border:`1px solid ${T.border}`,cursor:"pointer",padding:2,background:"transparent",flexShrink:0}}/>
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="e.g. Client Work" onKeyDown={e=>e.key==="Enter"&&addType()} style={{flex:1,minWidth:120,background:T.bgElevated,border:`1px solid ${T.border}`,borderRadius:10,color:T.text1,fontSize:15,fontWeight:500,padding:"9px 13px"}}/>
            <button onClick={addType} style={{background:T.accent,border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,padding:"9px 16px",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>+ Add</button>
          </div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {SWATCH_COLORS.map(c=><div key={c} onClick={()=>setNewColor(c)} style={{width:22,height:22,borderRadius:6,background:c,cursor:"pointer",border:newColor===c?"2.5px solid #fff":"2.5px solid transparent",transition:"transform 0.12s",transform:newColor===c?"scale(1.25)":"scale(1)"}}/>)}
          </div>
        </div>
      </Sec>

      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <button onClick={save} disabled={!dirty} style={{flex:1,minWidth:140,background:dirty?T.accent:"rgba(128,128,128,0.2)",border:"none",borderRadius:13,color:"#fff",fontSize:15,fontWeight:700,padding:14,cursor:dirty?"pointer":"default",transition:"all 0.2s"}}>Save Settings</button>
        <button onClick={applyAndSave} style={{flex:1,minWidth:140,background:"linear-gradient(135deg,#30d158,#28a03e)",border:"none",borderRadius:13,color:"#fff",fontSize:15,fontWeight:700,padding:14,cursor:"pointer"}}>Save & Regenerate Schedule</button>
      </div>
      <p style={{fontSize:12,color:T.text3,marginTop:10,fontWeight:500,lineHeight:1.6}}>"Save Settings" keeps your existing blocks. "Save & Regenerate" rebuilds all 7 days from scratch with the new schedule.</p>
    </div>
  );
}

/* ─── Main App ────────────────────────────────────────────────────────────── */
export default function WeeklyPlanner() {
  const [isAntRidge, setIsAntRidge] = usePS("wp_mode",      false);
  const [weekOff,    setWeekOff]    = usePS("wp_weekOffset", 0);
  const [taskTypes,  setTaskTypes]  = usePS("wp_taskTypes",  DEFAULT_TYPES);
  const [settings,   setSettings]   = usePS("wp_settings",   DEFAULT_SETTINGS);
  const [blocks,     setBlocks]     = usePS("wp_blocks",     null);
  const [logs,       setLogs]       = usePS("wp_logs",       DEFAULT_LOGS);
  const [activeDay,  setActiveDay]  = useState(()=>{ const m={0:6,1:0,2:1,3:2,4:3,5:4,6:5}; return DAYS[m[new Date().getDay()]]; });
  const [view,       setView]       = useState("plan");
  const [editing,    setEditing]    = useState(null);

  const initBlocks=(s=settings)=>Object.fromEntries(DAYS.map(d=>[d,makeBlocks(s,DAY_ROLE[d]==="a"?"a":"q")]));
  const resolvedBlocks=blocks||initBlocks();
  useEffect(()=>{ if(!blocks) setBlocks(initBlocks()); },[]);// eslint-disable-line

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

  const updB=(d,id,f,v)=>setBlocks(p=>{const base=p||initBlocks();return{...base,[d]:base[d].map(b=>b.id===id?{...b,[f]:v}:b)};});
  const remB=(d,id)=>setBlocks(p=>{const base=p||initBlocks();return{...base,[d]:base[d].filter(b=>b.id!==id)};});
  const addB=d=>{
    const bl=resolvedBlocks[d],last=bl[bl.length-1],dur=settings.blockDuration||2;
    setBlocks(p=>{const base=p||initBlocks();return{...base,[d]:[...base[d],{id:Date.now(),label:"New Block",start:last?last.end:"09:00",end:last?pad(Math.min(toM(last.end)/60+dur,23)):"11:00",type:taskTypes[0]?.id||"q",actual:""}]};});
  };

  const onLogToBlock=(bullets,blockId,elapsedSecs,pauseSecs,timeStr,modeLabel,modeColor)=>{
    if(!bullets.length) return;
    const activeMin=Math.round(elapsedSecs/60);
    const breakMin=Math.round((pauseSecs||0)/60);
    const header=`📌 ${timeStr} · ${activeMin}m active${breakMin>0?` · ${breakMin}m break`:""} · ${modeLabel}`;
    const entry=header+"\n"+bullets.map(b=>`• ${b}`).join("\n");
    if(blockId){
      const base=blocks||initBlocks();
      setBlocks({...base,[day]:base[day].map(b=>b.id===blockId?{...b,actual:b.actual?b.actual+"\n\n"+entry:entry}:b)});
    } else {
      setLogs(p=>({...p,[day]:p[day]?p[day]+"\n\n"+entry:entry}));
    }
  };

  const applySchedule=(newSettings)=>{
    setBlocks(Object.fromEntries(DAYS.map(d=>[d,makeBlocks(newSettings,DAY_ROLE[d]==="a"?"a":"q")])));
  };

  const VIEWS=["Plan","Summary","Settings"];

  return (
    <>
      <GlobalStyles isDark={isAntRidge}/>
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",transition:"background 0.35s"}}>

        {/* ── Header ── */}
        <div style={{background:T.bgGlass,backdropFilter:"blur(32px) saturate(200%)",WebkitBackdropFilter:"blur(32px) saturate(200%)",borderBottom:`1px solid ${T.borderGlass}`,boxShadow:`0 1px 0 ${T.liquidStart},${T.shadowSm}`,padding:"13px 40px 0",position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:12,flexWrap:"wrap"}}>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              <span style={{fontSize:10,fontWeight:800,letterSpacing:2.5,color:T.text3,textTransform:"uppercase"}}>Week Planner · Sayan</span>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                {["‹","›"].map((ch,i)=>(
                  <button key={ch} className="hs" onClick={()=>setWeekOff(w=>w+(i===0?-1:1))}
                    style={{background:T.isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)",border:`1px solid ${T.border}`,color:T.text2,borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{ch}</button>
                ))}
                <span style={{fontSize:15,fontWeight:800,color:T.text1,whiteSpace:"nowrap",letterSpacing:-0.2}}>
                  {fmtS(weekStart)} – {fmtS(weekEnd)}, {weekEnd.getFullYear()}
                </span>
                {weekOff!==0&&<button onClick={()=>setWeekOff(0)} style={{background:"none",border:"none",color:T.accent,fontSize:13,cursor:"pointer",fontWeight:700}}>Today</button>}
              </div>
            </div>
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <BreakTimer T={T} blocks={dayBlocks} isAntRidge={isAntRidge} taskTypes={taskTypes} onLogToBlock={onLogToBlock}/>
              <ModeToggle isAntRidge={isAntRidge} onChange={setIsAntRidge} T={T}/>
            </div>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:6}}>
            {view!=="settings"?(
              <div style={{display:"flex",gap:0,overflowX:"auto",flex:1}}>
                {DAYS.map((d,i)=>{
                  const isActive=d===activeDay;
                  const col=taskTypes.find(t=>t.id===(DAY_ROLE[d]==="a"?"a":"q"))?.color||T.accent;
                  const date=getDayDate(weekStart,i);
                  const jsDay=new Date().getDay();
                  const isToday=weekOff===0&&(i===6?jsDay===0:jsDay===i+1);
                  return (
                    <button key={d} onClick={()=>setActiveDay(d)} style={{padding:"7px 18px 10px",border:"none",borderBottom:isActive?`3px solid ${col}`:"3px solid transparent",background:"transparent",color:isActive?col:T.text3,cursor:"pointer",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"color 0.15s"}}>
                      <span style={{fontSize:13,fontWeight:isActive?800:500}}>{d}</span>
                      <span style={{fontSize:11,color:isToday?col:isActive?T.text3:T.text4,fontWeight:isToday?700:400}}>{fmtS(date)}</span>
                      {isToday&&<div style={{width:4,height:4,borderRadius:"50%",background:col,marginTop:-1}}/>}
                    </button>
                  );
                })}
              </div>
            ):(
              <div style={{flex:1,padding:"0 0 10px",display:"flex",alignItems:"center"}}>
                <span style={{fontSize:17,fontWeight:800,color:T.text1}}>Settings</span>
              </div>
            )}
            <div style={{display:"flex",gap:0,flexShrink:0}}>
              {VIEWS.map(v=>{
                const active=view===v.toLowerCase();
                const isS=v==="Settings";
                return (
                  <button key={v} onClick={()=>setView(v.toLowerCase())} style={{padding:"7px 16px 10px",border:"none",borderBottom:active?`3px solid ${isS?"#ff9f0a":T.accent}`:"3px solid transparent",background:"transparent",color:active?(isS?"#ff9f0a":T.accent):T.text3,cursor:"pointer",fontSize:13,fontWeight:active?800:500,transition:"color 0.15s",flexShrink:0,whiteSpace:"nowrap"}}>
                    {isS?"⚙ Settings":v}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{flex:1,padding:"26px 40px",maxWidth:1200,margin:"0 auto",width:"100%"}}>

          {view==="settings"&&(
            <SettingsView settings={settings} setSettings={setSettings} taskTypes={taskTypes} setTaskTypes={setTaskTypes} T={T} onApplySchedule={applySchedule}/>
          )}

          {view!=="settings"&&(
            <>
              {/* Day heading */}
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,flexWrap:"wrap"}}>
                <h1 style={{fontSize:36,fontWeight:900,color:T.text1,letterSpacing:-0.8}}>{DAY_LABELS[day]}</h1>
                <span style={{fontSize:14,color:T.text3,fontWeight:500}}>{fmtF(dayDate)}</span>
                <span style={{padding:"4px 13px",borderRadius:20,background:`rgba(${hex2rgb(accent)},0.13)`,color:accent,fontSize:12,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase"}}>{isAR?"AntRidge Day":"Quadrical Day"}</span>
                <div style={{marginLeft:"auto",display:"flex",gap:14,flexWrap:"wrap"}}>
                  {taskTypes.map(tt=>{const h=totalH(dayBlocks,tt.id);return h?<span key={tt.id} style={{fontSize:14,fontWeight:700,color:tt.color}}>{h}h {tt.label.split(" ")[0]}</span>:null;})}
                </div>
              </div>

              <Timeline blocks={dayBlocks} T={T}/>

              {/* ── PLAN VIEW ── */}
              {view==="plan"&&(
                <div className="fu">
                  {/* Column headers */}
                  <div style={{display:"grid",gridTemplateColumns:"72px 1fr 1fr",gap:12,marginBottom:10,paddingLeft:4}}>
                    <div/>
                    <div style={{fontSize:12,fontWeight:800,letterSpacing:1.8,textTransform:"uppercase",color:T.text3}}>📋 Planned</div>
                    <div style={{fontSize:12,fontWeight:800,letterSpacing:1.8,textTransform:"uppercase",color:T.text3}}>✅ Actual</div>
                  </div>

                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {dayBlocks.map(b=>{
                      const tt=taskTypes.find(t=>t.id===b.type)||{color:"#888",label:"?"};
                      const isEd=editing===`${day}-${b.id}`;
                      const hasActual=!!(b.actual||"").trim();
                      return (
                        <div key={b.id} style={{display:"grid",gridTemplateColumns:"72px 1fr 1fr",gap:12,alignItems:"stretch"}}>

                          {/* Time column */}
                          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:T.bgElevated,border:`1px solid ${T.border}`,borderLeft:`4px solid ${tt.color}`,borderRadius:14,padding:"11px 4px",gap:3}}>
                            <span style={{fontSize:13,fontWeight:800,color:T.text1}}>{b.start}</span>
                            <div style={{width:18,height:1,background:tt.color,opacity:0.4}}/>
                            <span style={{fontSize:13,fontWeight:800,color:T.text1}}>{b.end}</span>
                            <div style={{marginTop:4,background:`rgba(${hex2rgb(tt.color)},0.15)`,color:tt.color,fontSize:11,fontWeight:800,padding:"2px 8px",borderRadius:10}}>{durH(b)}h</div>
                          </div>

                          {/* Planned column */}
                          <div style={{background:isEd?(T.isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.02)"):T.bgElevated,border:`1px solid ${isEd?tt.color+"55":T.border}`,borderRadius:14,padding:"13px 16px",display:"flex",flexDirection:"column",gap:10,boxShadow:isEd?`0 0 0 3px rgba(${hex2rgb(tt.color)},0.08)`:"none",transition:"all 0.15s"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <input value={b.label} onChange={e=>updB(day,b.id,"label",e.target.value)}
                                onFocus={()=>setEditing(`${day}-${b.id}`)} onBlur={()=>setEditing(null)}
                                style={{flex:1,background:"transparent",border:"none",color:T.text1,fontSize:15,fontWeight:700}}/>
                              <button className="hs" onClick={()=>remB(day,b.id)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:18,lineHeight:1,opacity:0.55,flexShrink:0}}>×</button>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:9,flexWrap:"wrap"}}>
                              <select value={b.type} onChange={e=>updB(day,b.id,"type",e.target.value)}
                                style={{background:T.bgCard,border:`1px solid ${T.border}`,color:tt.color,fontSize:13,borderRadius:8,padding:"5px 9px",cursor:"pointer",fontWeight:700}}>
                                {taskTypes.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                              </select>
                              <div style={{display:"flex",gap:5,alignItems:"center"}}>
                                <input value={b.start} onChange={e=>updB(day,b.id,"start",e.target.value)}
                                  style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:7,color:T.text2,fontSize:13,fontWeight:600,width:56,textAlign:"center",padding:"4px 3px"}}/>
                                <span style={{color:T.text4,fontSize:13}}>–</span>
                                <input value={b.end} onChange={e=>updB(day,b.id,"end",e.target.value)}
                                  style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:7,color:T.text2,fontSize:13,fontWeight:600,width:56,textAlign:"center",padding:"4px 3px"}}/>
                              </div>
                            </div>
                          </div>

                          {/* Actual column */}
                          <div style={{background:hasActual?(T.isDark?"rgba(48,209,88,0.05)":"rgba(48,209,88,0.03)"):T.bgElevated,border:`1px solid ${hasActual?"rgba(48,209,88,0.25)":T.border}`,borderRadius:14,padding:"13px 16px",display:"flex",flexDirection:"column",minHeight:90,position:"relative",transition:"all 0.2s"}}>
                            <textarea
                              value={b.actual||""}
                              onChange={e=>updB(day,b.id,"actual",e.target.value)}
                              placeholder="What actually happened?"
                              rows={Math.max(3,(b.actual||"").split("\n").length)}
                              style={{flex:1,width:"100%",background:"transparent",border:"none",color:T.text2,fontSize:14,fontWeight:500,lineHeight:1.7,resize:"none",fontFamily:"inherit",whiteSpace:"pre-wrap"}}
                            />
                            {hasActual&&(
                              <button onClick={()=>updB(day,b.id,"actual","")} className="hs"
                                style={{position:"absolute",top:9,right:9,background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:14,opacity:0.55}}>×</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button className="hd" onClick={()=>addB(day)} style={{marginTop:8,padding:14,border:`1.5px dashed ${T.border}`,borderRadius:14,background:"transparent",color:T.text3,fontSize:14,fontWeight:700,cursor:"pointer",width:"100%",letterSpacing:0.3}}>+ Add Block</button>

                  <div style={{marginTop:10,padding:"16px 20px",background:T.bgElevated,border:`1px solid ${T.border}`,borderRadius:14,boxShadow:T.shadowSm}}>
                    <div style={{fontSize:11,color:T.text3,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",marginBottom:9}}>Daily Reflection</div>
                    <textarea value={logs[day]||""} onChange={e=>setLogs(p=>({...p,[day]:e.target.value}))} placeholder="Wins, blockers, what to do differently tomorrow…" rows={3}
                      style={{width:"100%",background:"transparent",border:"none",color:T.text2,fontSize:14,fontWeight:500,lineHeight:1.7,resize:"none",fontFamily:"inherit"}}/>
                  </div>
                </div>
              )}

              {/* ── SUMMARY VIEW ── */}
              {view==="summary"&&(
                <div className="fu">
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:22}}>
                    {taskTypes.map(tt=>{const h=Object.values(enriched).reduce((a,bs)=>a+totalH(bs,tt.id),0);return h?(
                      <div key={tt.id} style={{background:T.bgElevated,border:`1px solid ${T.border}`,borderTop:`4px solid ${tt.color}`,borderRadius:16,padding:"16px 22px",boxShadow:T.shadowSm}}>
                        <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:6}}>{tt.label}</div>
                        <div style={{fontSize:32,fontWeight:900,color:tt.color,lineHeight:1}}>{h}h</div>
                      </div>
                    ):null;})}
                    {totalQ+totalA>0&&(
                      <div style={{background:T.bgElevated,border:`1px solid ${T.border}`,borderTop:`4px solid ${T.text3}`,borderRadius:16,padding:"16px 22px",boxShadow:T.shadowSm}}>
                        <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:6}}>AntRidge %</div>
                        <div style={{fontSize:32,fontWeight:900,color:T.text2,lineHeight:1}}>{Math.round(totalA/(totalQ+totalA)*100)}%</div>
                      </div>
                    )}
                  </div>

                  <div style={{background:T.bgElevated,border:`1px solid ${T.border}`,borderRadius:18,padding:"20px 24px",marginBottom:14,boxShadow:T.shadowSm}}>
                    <div style={{fontSize:11,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:16}}>Week at a Glance</div>
                    {DAYS.map((d,i)=>{
                      const col=taskTypes.find(t=>t.id===(DAY_ROLE[d]==="a"?"a":"q"))?.color||T.accent;
                      const date=getDayDate(weekStart,i);
                      return (
                        <div key={d} style={{display:"flex",alignItems:"center",gap:13,marginBottom:8}}>
                          <div style={{minWidth:90}}>
                            <span style={{fontSize:13,fontWeight:800,color:col}}>{d} </span>
                            <span style={{fontSize:11,color:T.text3,fontWeight:500}}>{fmtS(date)}</span>
                          </div>
                          <div style={{flex:1,position:"relative",height:18,background:T.isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",borderRadius:5,overflow:"hidden",border:`1px solid ${T.border}`}}>
                            {enriched[d].map((b,bi)=>{
                              const sp=(toM(b.start)/(24*60))*100;
                              const wp=Math.max((toM(b.end)-toM(b.start))/(24*60)*100,0.3);
                              return <div key={bi} title={b.label} style={{position:"absolute",left:`${sp}%`,width:`${wp}%`,top:2,bottom:2,background:b._color||"#888",borderRadius:3,opacity:0.85}}/>;
                            })}
                          </div>
                          <span style={{fontSize:13,minWidth:80,textAlign:"right",fontWeight:700}}>
                            {taskTypes.map(tt=>{const h=totalH(enriched[d],tt.id);return h?<span key={tt.id} style={{color:tt.color}}>{h}h </span>:null;})}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{background:T.bgElevated,border:`1px solid ${T.border}`,borderRadius:18,padding:"20px 24px",boxShadow:T.shadowSm}}>
                    <div style={{fontSize:11,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:14}}>Daily Reflections</div>
                    {DAYS.map(d=>logs[d]?(
                      <div key={d} style={{marginBottom:14}}>
                        <div style={{fontSize:13,fontWeight:800,color:taskTypes.find(t=>t.id===(DAY_ROLE[d]==="a"?"a":"q"))?.color||T.accent,marginBottom:4}}>{DAY_LABELS[d]}</div>
                        <div style={{fontSize:14,color:T.text2,lineHeight:1.75,fontWeight:500,whiteSpace:"pre-wrap"}}>{logs[d]}</div>
                      </div>
                    ):null)}
                    {!DAYS.some(d=>logs[d])&&<div style={{fontSize:14,color:T.text3,fontWeight:500}}>No reflections yet — add notes in the Plan view.</div>}
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
