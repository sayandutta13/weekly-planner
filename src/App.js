import { useState, useEffect } from "react";

// ── localStorage helpers ──────────────────────────────────────────────────────
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => load(key, defaultValue));
  useEffect(() => { save(key, state); }, [key, state]);
  return [state, setState];
}
// ─────────────────────────────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday"
};
const DAY_TYPE = {
  Mon: "quadrical", Tue: "quadrical", Wed: "quadrical",
  Thu: "quadrical", Fri: "quadrical", Sat: "antridge", Sun: "antridge"
};

const DEFAULT_BLOCKS = {
  Mon: [
    { id: 1, label: "Deep Work / BD", start: "09:00", end: "11:00", type: "quadrical" },
    { id: 2, label: "Calls & Meetings", start: "11:00", end: "13:00", type: "quadrical" },
    { id: 3, label: "Lunch", start: "13:00", end: "14:00", type: "break" },
    { id: 4, label: "Proposals / Follow-ups", start: "14:00", end: "16:00", type: "quadrical" },
    { id: 5, label: "Admin / Wrap", start: "16:00", end: "17:00", type: "quadrical" },
  ],
  Tue: [
    { id: 1, label: "Deep Work / BD", start: "09:00", end: "11:00", type: "quadrical" },
    { id: 2, label: "Calls & Meetings", start: "11:00", end: "13:00", type: "quadrical" },
    { id: 3, label: "Lunch", start: "13:00", end: "14:00", type: "break" },
    { id: 4, label: "Proposals / Follow-ups", start: "14:00", end: "16:00", type: "quadrical" },
    { id: 5, label: "Admin / Wrap", start: "16:00", end: "17:00", type: "quadrical" },
  ],
  Wed: [
    { id: 1, label: "Deep Work / BD", start: "09:00", end: "11:00", type: "quadrical" },
    { id: 2, label: "Calls & Meetings", start: "11:00", end: "13:00", type: "quadrical" },
    { id: 3, label: "Lunch", start: "13:00", end: "14:00", type: "break" },
    { id: 4, label: "Proposals / Follow-ups", start: "14:00", end: "16:00", type: "quadrical" },
    { id: 5, label: "Admin / Wrap", start: "16:00", end: "17:00", type: "quadrical" },
  ],
  Thu: [
    { id: 1, label: "Deep Work / BD", start: "09:00", end: "11:00", type: "quadrical" },
    { id: 2, label: "Calls & Meetings", start: "11:00", end: "13:00", type: "quadrical" },
    { id: 3, label: "Lunch", start: "13:00", end: "14:00", type: "break" },
    { id: 4, label: "Proposals / Follow-ups", start: "14:00", end: "16:00", type: "quadrical" },
    { id: 5, label: "Admin / Wrap", start: "16:00", end: "17:00", type: "quadrical" },
  ],
  Fri: [
    { id: 1, label: "Deep Work / BD", start: "09:00", end: "11:00", type: "quadrical" },
    { id: 2, label: "Calls & Meetings", start: "11:00", end: "13:00", type: "quadrical" },
    { id: 3, label: "Lunch", start: "13:00", end: "14:00", type: "break" },
    { id: 4, label: "Week Review", start: "14:00", end: "15:00", type: "quadrical" },
    { id: 5, label: "Free / Buffer", start: "15:00", end: "17:00", type: "break" },
  ],
  Sat: [
    { id: 1, label: "AntRidge: Outreach", start: "09:00", end: "11:00", type: "antridge" },
    { id: 2, label: "AntRidge: Build / Think", start: "11:00", end: "13:00", type: "antridge" },
    { id: 3, label: "Lunch / Break", start: "13:00", end: "14:00", type: "break" },
    { id: 4, label: "AntRidge: Deep Work", start: "14:00", end: "16:00", type: "antridge" },
  ],
  Sun: [
    { id: 1, label: "Weekly Review", start: "09:00", end: "10:00", type: "antridge" },
    { id: 2, label: "AntRidge: Strategy / Writing", start: "10:00", end: "12:00", type: "antridge" },
    { id: 3, label: "Break / Family", start: "12:00", end: "14:00", type: "break" },
    { id: 4, label: "Plan Next Week", start: "14:00", end: "15:00", type: "antridge" },
  ],
};

const DEFAULT_LOGS = Object.fromEntries(DAYS.map(d => [d, ""]));
const DEFAULT_ACTUALS = Object.fromEntries(
  DAYS.map(d => [d, DEFAULT_BLOCKS[d].map(b => ({ ...b, actual: "" }))])
);

function toMins(t) {
  const [h, m] = (t || "00:00").split(":").map(Number);
  return h * 60 + m;
}

function blockDuration(b) {
  return Math.max(0, (toMins(b.end) - toMins(b.start)) / 60);
}

function totalHours(bs, type) {
  return bs.filter(b => b.type === type).reduce((acc, b) => acc + blockDuration(b), 0);
}

function getWeekStart(offset = 0) {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  return new Date(new Date(today).setDate(diff));
}

function getDayDate(weekStart, dayIndex) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return d;
}

function formatDate(d) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatFullDate(d) {
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const TYPE_COLORS = {
  quadrical: { accent: "#4f8ef7" },
  antridge:  { accent: "#4caf7d" },
  break:     { accent: "#666" },
};

function DayTimeline({ blocks }) {
  const TOTAL_MINS = 24 * 60;
  const hourMarkers = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  return (
    <div style={{ marginBottom: 22 }}>
      {/* Hour labels */}
      <div style={{ position: "relative", height: 18, marginBottom: 3 }}>
        {hourMarkers.map(h => (
          <div key={h} style={{
            position: "absolute",
            left: `${(h / 24) * 100}%`,
            fontSize: 9, color: "#3a3a3a",
            transform: "translateX(-50%)",
            letterSpacing: 0.3,
          }}>
            {h === 0 ? "12am" : h === 12 ? "12pm" : h < 12 ? `${h}am` : `${h - 12}pm`}
          </div>
        ))}
      </div>

      {/* Bar */}
      <div style={{
        position: "relative", height: 40,
        background: "#141414",
        borderRadius: 7,
        overflow: "hidden",
        border: "1px solid #1e1e1e",
      }}>
        {/* Gridlines */}
        {Array.from({ length: 23 }, (_, i) => i + 1).map(h => (
          <div key={h} style={{
            position: "absolute", left: `${(h / 24) * 100}%`,
            top: 0, bottom: 0, width: 1,
            background: h % 6 === 0 ? "#222" : "#191919",
          }} />
        ))}

        {/* Blocks */}
        {blocks.map((b, i) => {
          const startPct = (toMins(b.start) / TOTAL_MINS) * 100;
          const widthPct = ((toMins(b.end) - toMins(b.start)) / TOTAL_MINS) * 100;
          const col = TYPE_COLORS[b.type] || TYPE_COLORS.break;
          const dur = blockDuration(b);
          return (
            <div key={b.id || i} title={`${b.label}\n${b.start}–${b.end} (${dur}h)`} style={{
              position: "absolute",
              left: `${startPct}%`,
              width: `${Math.max(widthPct, 0.4)}%`,
              top: 4, bottom: 4,
              background: col.accent,
              borderRadius: 3,
              opacity: 0.82,
              display: "flex", alignItems: "center",
              overflow: "hidden", paddingLeft: 5,
              cursor: "default",
            }}>
              {widthPct > 6 && (
                <span style={{
                  fontSize: 9, color: "#000", fontWeight: 800,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  letterSpacing: 0.2,
                }}>{dur >= 1 ? b.label : ""}</span>
              )}
            </div>
          );
        })}

        {/* Now line */}
        {(() => {
          const now = new Date();
          const pct = ((now.getHours() * 60 + now.getMinutes()) / TOTAL_MINS) * 100;
          return (
            <div style={{ position: "absolute", left: `${pct}%`, top: 0, bottom: 0, width: 2, background: "#ff4040", zIndex: 10 }}>
              <div style={{ position: "absolute", top: -2, left: -3, width: 8, height: 8, borderRadius: "50%", background: "#ff4040" }} />
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginTop: 7 }}>
        {[["quadrical","Quadrical"],["antridge","AntRidge"],["break","Break"]].map(([t,l]) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: TYPE_COLORS[t].accent, opacity: 0.82 }} />
            <span style={{ fontSize: 10, color: "#444" }}>{l}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 2, height: 9, background: "#ff4040" }} />
          <span style={{ fontSize: 10, color: "#444" }}>Now</span>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyPlanner() {
  const [weekOffset, setWeekOffset] = usePersistedState("wp_weekOffset", 0);
  const [blocks, setBlocks] = usePersistedState("wp_blocks", DEFAULT_BLOCKS);
  const [logs, setLogs] = usePersistedState("wp_logs", DEFAULT_LOGS);
  const [actuals, setActuals] = usePersistedState("wp_actuals", DEFAULT_ACTUALS);
  const [activeDay, setActiveDay] = useState(() => {
    const jsDay = new Date().getDay(); // 0=Sun
    const map = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
    return DAYS[map[jsDay]];
  });
  const [editingBlock, setEditingBlock] = useState(null);
  const [view, setView] = useState("plan");

  const weekStart = getWeekStart(weekOffset);
  const weekEnd = getDayDate(weekStart, 6);
  const day = activeDay;
  const dayIndex = DAYS.indexOf(day);
  const dayDate = getDayDate(weekStart, dayIndex);
  const dayBlocks = blocks[day];
  const isWeekend = DAY_TYPE[day] === "antridge";
  const accent = isWeekend ? "#4caf7d" : "#4f8ef7";
  const totalQ = Object.values(blocks).reduce((a, bs) => a + totalHours(bs, "quadrical"), 0);
  const totalA = Object.values(blocks).reduce((a, bs) => a + totalHours(bs, "antridge"), 0);

  function updateBlock(d, id, field, val) {
    setBlocks(prev => ({ ...prev, [d]: prev[d].map(b => b.id === id ? { ...b, [field]: val } : b) }));
  }

  function addBlock(d) {
    const last = blocks[d][blocks[d].length - 1];
    setBlocks(prev => ({
      ...prev, [d]: [...prev[d], {
        id: Date.now(), label: "New Block",
        start: last ? last.end : "09:00",
        end: last ? `${String(Math.min(parseInt(last.end) + 1, 23)).padStart(2,"0")}:00` : "10:00",
        type: DAY_TYPE[d],
      }]
    }));
  }

  function removeBlock(d, id) {
    setBlocks(prev => ({ ...prev, [d]: prev[d].filter(b => b.id !== id) }));
  }

  function updateActual(d, id, val) {
    setActuals(prev => ({ ...prev, [d]: prev[d].map(b => b.id === id ? { ...b, actual: val } : b) }));
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", color: "#e0e0e0", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#141414", borderBottom: "1px solid #1e1e1e", padding: "16px 28px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#444", textTransform: "uppercase", marginBottom: 6 }}>
              Week Planner · Sayan
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setWeekOffset(w => w - 1)} style={{
                background: "transparent", border: "1px solid #222", color: "#555",
                borderRadius: 4, padding: "2px 9px", cursor: "pointer", fontSize: 13,
              }}>‹</button>
              <span style={{ fontSize: 13, color: "#bbb", fontWeight: 700, letterSpacing: 0.3 }}>
                {formatDate(weekStart)} – {formatDate(weekEnd)}, {weekEnd.getFullYear()}
              </span>
              <button onClick={() => setWeekOffset(w => w + 1)} style={{
                background: "transparent", border: "1px solid #222", color: "#555",
                borderRadius: 4, padding: "2px 9px", cursor: "pointer", fontSize: 13,
              }}>›</button>
              {weekOffset !== 0 && (
                <button onClick={() => setWeekOffset(0)} style={{
                  background: "transparent", border: "none", color: "#555",
                  cursor: "pointer", fontSize: 11, textDecoration: "underline",
                }}>Today</button>
              )}
              <button onClick={() => {
                if (window.confirm("Reset all blocks, logs and actuals to defaults?")) {
                  setBlocks(DEFAULT_BLOCKS);
                  setLogs(DEFAULT_LOGS);
                  setActuals(DEFAULT_ACTUALS);
                }
              }} style={{
                marginLeft: 8,
                background: "transparent", border: "1px solid #222", color: "#3a3a3a",
                borderRadius: 4, padding: "2px 9px", cursor: "pointer", fontSize: 11,
              }}>Reset</button>
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {["plan", "log", "summary"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "5px 14px", borderRadius: 20,
                border: `1px solid ${view === v ? accent : "#222"}`,
                background: view === v ? accent + "20" : "transparent",
                color: view === v ? accent : "#555",
                fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
                cursor: "pointer", fontWeight: 600,
              }}>{v}</button>
            ))}
          </div>
        </div>

        {/* Day tabs */}
        <div style={{ display: "flex", gap: 1 }}>
          {DAYS.map((d, i) => {
            const isActive = d === activeDay;
            const col = DAY_TYPE[d] === "antridge" ? "#4caf7d" : "#4f8ef7";
            const date = getDayDate(weekStart, i);
            const todayJs = new Date().getDay();
            const dayJs = i === 6 ? 0 : i + 1;
            const isToday = weekOffset === 0 && todayJs === dayJs;
            return (
              <button key={d} onClick={() => setActiveDay(d)} style={{
                padding: "7px 16px 10px",
                border: "none",
                borderBottom: isActive ? `2px solid ${col}` : "2px solid transparent",
                background: isActive ? "#1a1a1a" : "transparent",
                color: isActive ? col : "#444",
                fontSize: 12, fontWeight: isActive ? 700 : 400,
                cursor: "pointer", borderRadius: "5px 5px 0 0",
                transition: "all 0.12s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
              }}>
                <span>{d}</span>
                <span style={{ fontSize: 10, color: isToday ? col : isActive ? "#555" : "#333", fontWeight: isToday ? 700 : 400 }}>
                  {formatDate(date)}
                </span>
                {isToday && <div style={{ width: 4, height: 4, borderRadius: "50%", background: col }} />}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "22px 28px", maxWidth: 900, margin: "0 auto" }}>

        {/* Day heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "#fff" }}>{DAY_LABELS[day]}</h2>
          <span style={{ fontSize: 12, color: "#444" }}>{formatFullDate(dayDate)}</span>
          <span style={{
            padding: "2px 10px", borderRadius: 20,
            background: accent + "1a", color: accent,
            fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
          }}>{isWeekend ? "AntRidge Day" : "Quadrical Day"}</span>
          <span style={{ marginLeft: "auto", fontSize: 12 }}>
            {totalHours(dayBlocks, "quadrical") > 0 && <span style={{ color: "#4f8ef7" }}>{totalHours(dayBlocks, "quadrical")}h Q </span>}
            {totalHours(dayBlocks, "antridge") > 0 && <span style={{ color: "#4caf7d" }}>{totalHours(dayBlocks, "antridge")}h A</span>}
          </span>
        </div>

        {/* 24h timeline — always visible */}
        <DayTimeline blocks={dayBlocks} />

        {/* PLAN VIEW */}
        {view === "plan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dayBlocks.map(b => {
              const col = TYPE_COLORS[b.type] || TYPE_COLORS.break;
              const isEditing = editingBlock === `${day}-${b.id}`;
              const dur = blockDuration(b);
              return (
                <div key={b.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "#161616",
                  border: `1px solid ${isEditing ? col.accent + "55" : "#1e1e1e"}`,
                  borderLeft: `3px solid ${col.accent}`,
                  borderRadius: 7, padding: "9px 14px",
                  transition: "border-color 0.12s",
                }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 76 }}>
                    <input value={b.start} onChange={e => updateBlock(day, b.id, "start", e.target.value)}
                      style={{ background: "transparent", border: "none", color: "#777", fontSize: 12, width: 46, textAlign: "center", outline: "none" }} />
                    <div style={{ height: 1, width: 14, background: "#2a2a2a", margin: "1px 0" }} />
                    <input value={b.end} onChange={e => updateBlock(day, b.id, "end", e.target.value)}
                      style={{ background: "transparent", border: "none", color: "#777", fontSize: 12, width: 46, textAlign: "center", outline: "none" }} />
                  </div>
                  <span style={{
                    fontSize: 10, color: col.accent, background: col.accent + "18",
                    padding: "2px 6px", borderRadius: 8, fontWeight: 700, minWidth: 26, textAlign: "center",
                  }}>{dur}h</span>
                  <input value={b.label} onChange={e => updateBlock(day, b.id, "label", e.target.value)}
                    onFocus={() => setEditingBlock(`${day}-${b.id}`)}
                    onBlur={() => setEditingBlock(null)}
                    style={{ flex: 1, background: "transparent", border: "none", color: "#d8d8d8", fontSize: 14, fontWeight: 500, outline: "none" }} />
                  <select value={b.type} onChange={e => updateBlock(day, b.id, "type", e.target.value)} style={{
                    background: "#0f0f0f", border: "1px solid #222", color: col.accent,
                    fontSize: 11, borderRadius: 5, padding: "3px 6px", cursor: "pointer",
                  }}>
                    <option value="quadrical">Quadrical</option>
                    <option value="antridge">AntRidge</option>
                    <option value="break">Break</option>
                  </select>
                  <button onClick={() => removeBlock(day, b.id)} style={{
                    background: "transparent", border: "none", color: "#333",
                    cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px",
                  }}>×</button>
                </div>
              );
            })}
            <button onClick={() => addBlock(day)} style={{
              marginTop: 4, padding: "9px",
              border: "1px dashed #222", borderRadius: 7,
              background: "transparent", color: "#3a3a3a", fontSize: 13,
              cursor: "pointer", width: "100%",
            }}>+ Add Block</button>
          </div>
        )}

        {/* LOG VIEW */}
        {view === "log" && (
          <div>
            <p style={{ fontSize: 12, color: "#444", marginTop: 0, marginBottom: 14 }}>Log what actually happened vs the plan.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {dayBlocks.map(b => {
                const col = TYPE_COLORS[b.type] || TYPE_COLORS.break;
                const actual = actuals[day]?.find(a => a.id === b.id);
                return (
                  <div key={b.id} style={{
                    background: "#161616", border: "1px solid #1e1e1e",
                    borderLeft: `3px solid ${col.accent}`,
                    borderRadius: 7, padding: "11px 14px",
                    display: "flex", gap: 14, alignItems: "flex-start",
                  }}>
                    <div style={{ minWidth: 100 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>{b.label}</div>
                      <div style={{ fontSize: 11, color: "#3a3a3a", marginTop: 2 }}>{b.start}–{b.end}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: "#3a3a3a", marginBottom: 4, letterSpacing: 1.2, textTransform: "uppercase" }}>What actually happened</div>
                      <textarea
                        value={actual?.actual || ""}
                        onChange={e => updateActual(day, b.id, e.target.value)}
                        placeholder="e.g. Overran by 30min, call moved to evening..."
                        rows={2}
                        style={{
                          width: "100%", background: "#0f0f0f", border: "1px solid #1e1e1e",
                          borderRadius: 5, color: "#bbb", fontSize: 13, padding: "7px 10px",
                          resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 9, color: "#3a3a3a", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Daily notes</div>
              <textarea
                value={logs[day]}
                onChange={e => setLogs(prev => ({ ...prev, [day]: e.target.value }))}
                placeholder="What got in the way? Wins? What to do differently?"
                rows={4}
                style={{
                  width: "100%", background: "#161616", border: "1px solid #1e1e1e",
                  borderRadius: 7, color: "#bbb", fontSize: 13, padding: "11px 14px",
                  resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        )}

        {/* SUMMARY VIEW */}
        {view === "summary" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Quadrical", hours: totalQ, color: "#4f8ef7", sub: "Mon–Fri" },
                { label: "AntRidge", hours: totalA, color: "#4caf7d", sub: "Sat–Sun" },
                { label: "AntRidge %", hours: null, color: "#888", sub: totalQ + totalA > 0 ? `${Math.round(totalA / (totalQ + totalA) * 100)}%` : "—" },
              ].map(s => (
                <div key={s.label} style={{
                  background: "#161616", border: "1px solid #1e1e1e",
                  borderTop: `3px solid ${s.color}`, borderRadius: 9, padding: "14px 16px",
                }}>
                  <div style={{ fontSize: 9, color: "#444", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.hours !== null ? `${s.hours}h` : s.sub}</div>
                  {s.hours !== null && <div style={{ fontSize: 11, color: "#3a3a3a", marginTop: 2 }}>{s.sub}</div>}
                </div>
              ))}
            </div>

            {/* Week at a glance — mini 24h strips */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: "#3a3a3a", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Week at a Glance — 24h</div>
              {DAYS.map((d, i) => {
                const col = DAY_TYPE[d] === "antridge" ? "#4caf7d" : "#4f8ef7";
                const date = getDayDate(weekStart, i);
                return (
                  <div key={d} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                    <div style={{ minWidth: 78 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: col }}>{d} </span>
                      <span style={{ fontSize: 10, color: "#333" }}>{formatDate(date)}</span>
                    </div>
                    <div style={{ flex: 1, position: "relative", height: 18, background: "#141414", borderRadius: 3, overflow: "hidden", border: "1px solid #1a1a1a" }}>
                      {blocks[d].map((b, bi) => {
                        const startPct = (toMins(b.start) / (24 * 60)) * 100;
                        const widthPct = ((toMins(b.end) - toMins(b.start)) / (24 * 60)) * 100;
                        const bcol = TYPE_COLORS[b.type] || TYPE_COLORS.break;
                        return (
                          <div key={bi} title={b.label} style={{
                            position: "absolute", left: `${startPct}%`,
                            width: `${Math.max(widthPct, 0.3)}%`,
                            top: 2, bottom: 2,
                            background: bcol.accent, borderRadius: 2, opacity: 0.8,
                          }} />
                        );
                      })}
                    </div>
                    <span style={{ fontSize: 11, minWidth: 68, textAlign: "right" }}>
                      {totalHours(blocks[d], "quadrical") > 0 && <span style={{ color: "#4f8ef7" }}>{totalHours(blocks[d], "quadrical")}h </span>}
                      {totalHours(blocks[d], "antridge") > 0 && <span style={{ color: "#4caf7d" }}>{totalHours(blocks[d], "antridge")}h</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: 9, padding: "14px 18px" }}>
              <div style={{ fontSize: 9, color: "#3a3a3a", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Week Logs</div>
              {DAYS.map(d => logs[d] ? (
                <div key={d} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: DAY_TYPE[d] === "antridge" ? "#4caf7d" : "#4f8ef7", marginBottom: 3 }}>{DAY_LABELS[d]}</div>
                  <div style={{ fontSize: 13, color: "#777", lineHeight: 1.6 }}>{logs[d]}</div>
                </div>
              ) : null)}
              {!DAYS.some(d => logs[d]) && <div style={{ fontSize: 13, color: "#2a2a2a" }}>No logs yet.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
