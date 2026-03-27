import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ════════════════════════════════════════════
   CONSTANTS & HELPERS
   ════════════════════════════════════════════ */
const PLAYER_COLORS = [
  { accent: "#c084fc", glow: "rgba(192,132,252,0.4)", bg: "rgba(192,132,252,0.06)", dim: "rgba(192,132,252,0.15)", doneBg: "rgba(192,132,252,0.04)" },
  { accent: "#60a5fa", glow: "rgba(96,165,250,0.4)", bg: "rgba(96,165,250,0.06)", dim: "rgba(96,165,250,0.15)", doneBg: "rgba(96,165,250,0.04)" },
  { accent: "#f97316", glow: "rgba(249,115,22,0.4)", bg: "rgba(249,115,22,0.06)", dim: "rgba(249,115,22,0.15)", doneBg: "rgba(249,115,22,0.04)" },
  { accent: "#34d399", glow: "rgba(52,211,153,0.4)", bg: "rgba(52,211,153,0.06)", dim: "rgba(52,211,153,0.15)", doneBg: "rgba(52,211,153,0.04)" },
  { accent: "#fb7185", glow: "rgba(251,113,133,0.4)", bg: "rgba(251,113,133,0.06)", dim: "rgba(251,113,133,0.15)", doneBg: "rgba(251,113,133,0.04)" },
  { accent: "#fbbf24", glow: "rgba(251,191,36,0.4)", bg: "rgba(251,191,36,0.06)", dim: "rgba(251,191,36,0.15)", doneBg: "rgba(251,191,36,0.04)" },
];
const ROUNDS_MAP = { 3: 20, 4: 15, 5: 12, 6: 10 };
const RUNES = ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ"];
const MAGIC_SYMBOLS = ["✦","✧","⟡","◈","◇","⬡","✶","⊹","⋆","∗"];

function calcPoints(pred, act) {
  if (pred === "" || act === "") return null;
  const p = parseInt(pred), a = parseInt(act);
  if (isNaN(p) || isNaN(a)) return null;
  const diff = Math.abs(p - a);
  return diff === 0 ? p * 10 + 20 : -(diff * 10);
}
function cardsForRound(ri, totalRounds) {
  const half = Math.floor(totalRounds / 2);
  return ri < half ? ri + 1 : totalRounds - ri;
}

/* ════════════════════════════════════════════
   ANIMATED NUMBER (Feature 8)
   ════════════════════════════════════════════ */
function AnimatedNumber({ value, color, size = 30, glow = false, glowColor }) {
  const [display, setDisplay] = useState(value);
  const ref = useRef(value);
  const frameRef = useRef(null);

  useEffect(() => {
    const from = ref.current;
    const to = value;
    if (from === to) return;
    const diff = to - from;
    const steps = Math.min(Math.abs(diff), 20);
    const duration = Math.min(400, steps * 30);
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(from + diff * eased);
      setDisplay(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        ref.current = to;
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value]);

  return (
    <span style={{
      fontSize: size, fontWeight: 700, color, fontFamily: "'Cinzel', serif", lineHeight: 1,
      filter: glow ? `drop-shadow(0 0 6px ${glowColor})` : "none",
      transition: "color 0.3s",
    }}>{display}</span>
  );
}

/* ════════════════════════════════════════════
   CONFIRM DIALOG (Feature 5)
   ════════════════════════════════════════════ */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(5,3,17,0.8)", backdropFilter: "blur(8px)",
      animation: "fadeIn 0.2s ease-out",
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "rgba(15,10,35,0.95)", border: "1px solid rgba(192,132,252,0.2)",
        borderRadius: 20, padding: "32px 36px", maxWidth: 380, width: "90%",
        boxShadow: "0 0 60px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
        animation: "fadeSlideIn 0.3s ease-out",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, margin: 0 }}>
            {message}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "12px 0", borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
          }}>Abbrechen</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #dc2626, #ef4444)",
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 16px rgba(220,38,38,0.3)",
            transition: "all 0.2s",
          }}>Neues Spiel</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAGICAL BACKGROUND LAYERS
   ════════════════════════════════════════════ */
function MagicalBackground() {
  const orbs = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    id: i, x: 10 + Math.random() * 80, y: 10 + Math.random() * 80,
    size: 200 + Math.random() * 400,
    color: ["rgba(139,92,246,0.08)","rgba(59,130,246,0.06)","rgba(236,72,153,0.05)","rgba(52,211,153,0.04)","rgba(251,191,36,0.05)","rgba(99,102,241,0.07)"][i],
    dur: 15 + Math.random() * 25, delay: Math.random() * -20,
  })), []);
  const stars = useMemo(() => Array.from({ length: 120 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 2 + 0.5, delay: Math.random() * 5, dur: Math.random() * 3 + 1.5,
    bright: Math.random() > 0.85,
  })), []);
  const runes = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i, char: RUNES[i % RUNES.length],
    x: Math.random() * 100, y: Math.random() * 100,
    size: 14 + Math.random() * 20, delay: Math.random() * 8, dur: 6 + Math.random() * 10,
    driftX: (Math.random() - 0.5) * 60, driftY: -30 - Math.random() * 60,
  })), []);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {orbs.map(o => (
        <div key={o.id} style={{
          position: "absolute", left: `${o.x}%`, top: `${o.y}%`,
          width: o.size, height: o.size, borderRadius: "50%",
          background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
          animation: `floatOrb ${o.dur}s ${o.delay}s infinite ease-in-out`,
          filter: "blur(40px)", transform: "translate(-50%,-50%)",
        }} />
      ))}
      {stars.map(s => (
        <div key={s.id} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size, borderRadius: "50%",
          background: s.bright ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
          boxShadow: s.bright ? "0 0 6px 2px rgba(192,132,252,0.4)" : "none",
          animation: `twinkle ${s.dur}s ${s.delay}s infinite ease-in-out`,
        }} />
      ))}
      {runes.map(r => (
        <div key={r.id} style={{
          position: "absolute", left: `${r.x}%`, top: `${r.y}%`,
          fontSize: r.size, color: "rgba(192,132,252,0.06)", fontFamily: "serif",
          animation: `floatRune ${r.dur}s ${r.delay}s infinite ease-in-out`,
          "--dx": `${r.driftX}px`, "--dy": `${r.driftY}px`,
        }}>{r.char}</div>
      ))}
      <div style={{
        position: "absolute", top: 0, left: "-20%", right: "-20%", height: "40%",
        background: "linear-gradient(180deg, rgba(139,92,246,0.04) 0%, rgba(59,130,246,0.03) 30%, rgba(52,211,153,0.02) 60%, transparent 100%)",
        animation: "aurora 20s infinite ease-in-out", filter: "blur(60px)", transformOrigin: "center top",
      }} />
    </div>
  );
}

/* ════════════════════════════════════════════
   SPELL BURST
   ════════════════════════════════════════════ */
function SpellBurst({ x, y, color, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1200); return () => clearTimeout(t); }, []);
  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    return { id: i, angle, dist: 30 + Math.random() * 40, size: 3 + Math.random() * 4, dur: 0.6 + Math.random() * 0.4 };
  }), []);
  return (
    <div style={{ position: "fixed", left: x, top: y, zIndex: 200, pointerEvents: "none" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", width: p.size, height: p.size, borderRadius: "50%",
          background: color, boxShadow: `0 0 8px ${color}`,
          animation: `burstParticle ${p.dur}s ease-out forwards`,
          "--bx": `${Math.cos(p.angle) * p.dist}px`, "--by": `${Math.sin(p.angle) * p.dist}px`,
        }} />
      ))}
      <div style={{
        position: "absolute", width: 20, height: 20, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}, transparent)`,
        transform: "translate(-50%,-50%)", animation: "burstGlow 0.6s ease-out forwards",
      }} />
    </div>
  );
}

/* ════════════════════════════════════════════
   CONFETTI
   ════════════════════════════════════════════ */
function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 100 }, (_, i) => ({
    id: i, x: Math.random() * 100, color: PLAYER_COLORS[i % 6].accent,
    delay: Math.random() * 3, dur: 2 + Math.random() * 3, size: 4 + Math.random() * 8,
    drift: (Math.random() - 0.5) * 300, rot: Math.random() * 1080,
    shape: Math.random() > 0.5 ? "circle" : "rect",
  })), []);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 150, overflow: "hidden" }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, top: -20,
          width: p.size, height: p.shape === "circle" ? p.size : p.size * 0.5,
          background: p.color, borderRadius: p.shape === "circle" ? "50%" : 1,
          boxShadow: `0 0 6px ${p.color}`,
          animation: `confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
          "--drift": `${p.drift}px`, "--rot": `${p.rot}deg`,
        }} />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   SCORE CHART (SVG)
   ════════════════════════════════════════════ */
function ScoreChart({ data, playerCount, playerNames, totalRounds }) {
  const W = 620, H = 220, PAD = 44, PADR = 20, PADT = 16, PADB = 28;
  const cW = W - PAD - PADR, cH = H - PADT - PADB;
  const series = useMemo(() => Array.from({ length: playerCount }, (_, pi) => {
    let t = 0; const pts = [{ r: 0, v: 0 }];
    for (let ri = 0; ri < totalRounds; ri++) {
      const p = calcPoints(data[pi][ri].pred, data[pi][ri].act);
      if (p === null) break; t += p; pts.push({ r: ri + 1, v: t });
    }
    return pts;
  }), [data, playerCount, totalRounds]);
  const allV = series.flatMap(s => s.map(p => p.v));
  const minV = Math.min(0, ...allV), maxV = Math.max(10, ...allV), range = maxV - minV || 1;
  const x = r => PAD + (r / totalRounds) * cW;
  const y = v => PADT + cH - ((v - minV) / range) * cH;
  const step = Math.max(10, Math.ceil(range / 5 / 10) * 10);
  const grid = []; for (let v = Math.floor(minV / step) * step; v <= maxV; v += step) grid.push(v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        {Array.from({ length: playerCount }, (_, i) => (
          <linearGradient key={i} id={`lg${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PLAYER_COLORS[i].accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={PLAYER_COLORS[i].accent} stopOpacity="0" />
          </linearGradient>
        ))}
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {grid.map(v => (
        <g key={v}><line x1={PAD} x2={W-PADR} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.05)" /><text x={PAD-6} y={y(v)+4} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize={10} fontFamily="DM Sans">{v}</text></g>
      ))}
      <line x1={PAD} x2={W-PADR} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 3" />
      {[0, Math.floor(totalRounds/4), Math.floor(totalRounds/2), Math.floor(totalRounds*3/4), totalRounds].map(r => (
        <text key={r} x={x(r)} y={H-4} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={10} fontFamily="DM Sans">{r}</text>
      ))}
      {series.map((pts, pi) => {
        if (pts.length < 2) return null;
        const line = pts.map((p, i) => `${i===0?"M":"L"}${x(p.r).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
        const area = line + ` L${x(pts[pts.length-1].r).toFixed(1)},${y(minV).toFixed(1)} L${x(0).toFixed(1)},${y(minV).toFixed(1)} Z`;
        return (
          <g key={pi}>
            <path d={area} fill={`url(#lg${pi})`} />
            <path d={line} fill="none" stroke={PLAYER_COLORS[pi].accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
            {pts.slice(1).map((p, i) => <circle key={i} cx={x(p.r)} cy={y(p.v)} r={3} fill={PLAYER_COLORS[pi].accent} stroke="#0a0616" strokeWidth={1.5} />)}
          </g>
        );
      })}
    </svg>
  );
}

/* ════════════════════════════════════════════
   MAGICAL INPUT (Feature 4: Tab/Enter nav)
   ════════════════════════════════════════════ */
function MagicInput({ value, onChange, placeholder, color, warn, inputId, onNavigate }) {
  const handleChange = (e) => {
    const v = e.target.value;
    if (v !== "" && !/^\d+$/.test(v)) return;
    onChange(v);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      if (onNavigate) onNavigate(inputId);
    }
  };
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <input data-input-id={inputId} type="text" inputMode="numeric" value={value} onChange={handleChange} onKeyDown={handleKeyDown} placeholder={placeholder}
        style={{
          width: 46, padding: "7px 0", textAlign: "center", borderRadius: 8,
          border: `1.5px solid ${warn ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
          background: warn ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)",
          color: value ? "#fff" : "rgba(255,255,255,0.2)", fontSize: 14, outline: "none",
          fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s",
        }}
        onFocus={e => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 12px ${color}40`; }}
        onBlur={e => { e.target.style.borderColor = warn ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════
   SETUP SCREEN
   ════════════════════════════════════════════ */
function SetupScreen({ onStart }) {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState(["", "", "", "", "", ""]);
  const [entered, setEntered] = useState(false);

  const handleStart = () => {
    setEntered(true);
    setTimeout(() => {
      const pn = names.slice(0, count).map((n, i) => n || `Spieler ${i + 1}`);
      onStart(count, pn);
    }, 800);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", padding: 24, position: "relative", zIndex: 1,
      animation: entered ? "portalOut 0.8s ease-in forwards" : "portalIn 0.8s ease-out both",
    }}>
      <div style={{ position: "relative", textAlign: "center", marginBottom: 48 }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 260, height: 260, borderRadius: "50%", border: "1px solid rgba(192,132,252,0.1)",
          animation: "spinSlow 30s linear infinite",
        }}>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <div key={i} style={{
              position: "absolute", left: `${50 + Math.cos(a) * 50}%`, top: `${50 + Math.sin(a) * 50}%`,
              transform: "translate(-50%,-50%)", fontSize: 16, color: "rgba(192,132,252,0.15)",
            }}>{RUNES[i]}</div>;
          })}
        </div>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 200, height: 200, borderRadius: "50%", border: "1px dashed rgba(96,165,250,0.08)",
          animation: "spinSlow 20s linear infinite reverse",
        }} />
        <div style={{ fontSize: 12, letterSpacing: 8, textTransform: "uppercase", color: "rgba(192,132,252,0.5)", marginBottom: 12, fontFamily: "'Cinzel', serif", position: "relative" }}>
          ✦ Score Tracker ✦
        </div>
        <h1 style={{
          fontSize: "clamp(52px, 9vw, 88px)", fontFamily: "'Cinzel Decorative', cursive",
          background: "linear-gradient(135deg, #c084fc 0%, #818cf8 25%, #60a5fa 50%, #818cf8 75%, #c084fc 100%)",
          backgroundSize: "200% 200%", animation: "shimmer 4s ease-in-out infinite",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: 0, lineHeight: 1.1, fontWeight: 700, position: "relative",
          filter: "drop-shadow(0 0 30px rgba(192,132,252,0.3))",
        }}>Wizard</h1>
        <div style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Sans', sans-serif", letterSpacing: 2 }}>
          {MAGIC_SYMBOLS.slice(0, 7).join(" ")}
        </div>
      </div>

      <div style={{
        background: "rgba(12,8,28,0.8)", border: "1px solid rgba(192,132,252,0.15)",
        borderRadius: 24, padding: "40px 44px", maxWidth: 500, width: "100%",
        backdropFilter: "blur(24px)", position: "relative", overflow: "hidden",
        boxShadow: "0 0 60px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}>
        <div style={{ position: "absolute", top: 12, left: 16, fontSize: 18, color: "rgba(192,132,252,0.08)", fontFamily: "serif" }}>ᚠ</div>
        <div style={{ position: "absolute", top: 12, right: 16, fontSize: 18, color: "rgba(192,132,252,0.08)", fontFamily: "serif" }}>ᛟ</div>
        <div style={{ position: "absolute", bottom: 12, left: 16, fontSize: 18, color: "rgba(192,132,252,0.08)", fontFamily: "serif" }}>ᛏ</div>
        <div style={{ position: "absolute", bottom: 12, right: 16, fontSize: 18, color: "rgba(192,132,252,0.08)", fontFamily: "serif" }}>ᚨ</div>

        <label style={{ display: "block", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(192,132,252,0.5)", marginBottom: 16, fontFamily: "'Cinzel', serif" }}>
          ◈ Anzahl der Spieler ◈
        </label>
        <div style={{ display: "flex", gap: 10, marginBottom: 36 }}>
          {[3, 4, 5, 6].map(n => (
            <button key={n} onClick={() => setCount(n)} style={{
              flex: 1, padding: "16px 0", borderRadius: 14,
              border: `1.5px solid ${count === n ? "#c084fc" : "rgba(255,255,255,0.06)"}`,
              background: count === n ? "rgba(192,132,252,0.12)" : "rgba(255,255,255,0.02)",
              color: count === n ? "#c084fc" : "rgba(255,255,255,0.4)",
              fontSize: 24, fontWeight: 700, cursor: "pointer", fontFamily: "'Cinzel', serif",
              transition: "all 0.3s ease",
              boxShadow: count === n ? "0 0 24px rgba(192,132,252,0.2), inset 0 0 20px rgba(192,132,252,0.05)" : "none",
              transform: count === n ? "scale(1.05)" : "scale(1)",
            }}>{n}</button>
          ))}
        </div>

        <label style={{ display: "block", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(192,132,252,0.5)", marginBottom: 16, fontFamily: "'Cinzel', serif" }}>
          ◈ Namen der Spieler ◈
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
          {Array.from({ length: count }, (_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, animation: `fadeSlideIn 0.4s ${i * 0.08}s both ease-out` }}>
              <div style={{
                width: 12, height: 12, borderRadius: "50%", background: PLAYER_COLORS[i].accent,
                boxShadow: `0 0 10px ${PLAYER_COLORS[i].glow}`, flexShrink: 0,
                animation: `breathe 3s ${i * 0.5}s infinite ease-in-out`,
              }} />
              <input placeholder={`Spieler ${i + 1}`} value={names[i]}
                onChange={e => { const n = [...names]; n[i] = e.target.value; setNames(n); }}
                style={{
                  flex: 1, padding: "13px 18px", borderRadius: 12,
                  border: "1.5px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)",
                  color: "#fff", fontSize: 15, outline: "none", fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.3s",
                }}
                onFocus={e => { e.target.style.borderColor = PLAYER_COLORS[i].accent; e.target.style.boxShadow = `0 0 16px ${PLAYER_COLORS[i].glow}`; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.06)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          ))}
        </div>

        <button onClick={handleStart} style={{
          width: "100%", padding: "18px 0", borderRadius: 16, border: "none",
          background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #8b5cf6 100%)",
          color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer",
          fontFamily: "'Cinzel', serif", letterSpacing: 3, textTransform: "uppercase",
          boxShadow: "0 4px 30px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
          transition: "all 0.3s", position: "relative", overflow: "hidden",
        }}
          onMouseEnter={e => { e.target.style.transform = "translateY(-2px) scale(1.01)"; e.target.style.boxShadow = "0 8px 40px rgba(124,58,237,0.5)"; }}
          onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = "0 4px 30px rgba(124,58,237,0.4)"; }}
        >✦ Spiel starten ✦</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   WINNER SCREEN
   ════════════════════════════════════════════ */
function WinnerScreen({ playerNames, totals, correctPreds, completedRounds, onReset, onBack }) {
  const sorted = totals.map((t, i) => ({ name: playerNames[i], score: t, idx: i, pct: completedRounds > 0 ? Math.round((correctPreds[i] / completedRounds) * 100) : 0 }))
    .sort((a, b) => b.score - a.score);
  const medals = ["🥇", "🥈", "🥉"];
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24, position: "relative", zIndex: 1, animation: "portalIn 0.8s ease-out both" }}>
      {showConfirm && <ConfirmDialog message="Wirklich ein neues Spiel starten? Alle Punkte gehen verloren!" onConfirm={onReset} onCancel={() => setShowConfirm(false)} />}
      <Confetti />
      <div style={{ textAlign: "center", marginBottom: 40, position: "relative" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -60%)",
          width: 180, height: 180, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(251,191,36,0.15), transparent 70%)",
          animation: "breathe 3s infinite ease-in-out",
        }} />
        <div style={{ fontSize: 72, marginBottom: 8, position: "relative", filter: "drop-shadow(0 0 20px rgba(251,191,36,0.4))", animation: "floatY 3s infinite ease-in-out" }}>🧙‍♂️</div>
        <h1 style={{
          fontSize: "clamp(36px,7vw,56px)", fontFamily: "'Cinzel Decorative', cursive",
          background: "linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #fbbf24 100%)",
          backgroundSize: "200% 200%", animation: "shimmer 3s ease-in-out infinite",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: 0, lineHeight: 1.2, position: "relative",
          filter: "drop-shadow(0 0 20px rgba(251,191,36,0.3))",
        }}>Spielende!</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif", letterSpacing: 1 }}>
          ✦ Der mächtigste Spieler steht fest ✦
        </p>
      </div>

      <div style={{
        background: "rgba(12,8,28,0.8)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 24,
        padding: "32px 36px", maxWidth: 460, width: "100%", backdropFilter: "blur(20px)",
        boxShadow: "0 0 60px rgba(251,191,36,0.06)",
      }}>
        {sorted.map((p, rank) => (
          <div key={p.idx} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "16px 0",
            borderBottom: rank < sorted.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
            animation: `fadeSlideIn 0.6s ${rank * 0.15}s both ease-out`,
          }}>
            <span style={{ fontSize: rank < 3 ? 30 : 18, width: 40, textAlign: "center", color: rank >= 3 ? "rgba(255,255,255,0.3)" : undefined, filter: rank === 0 ? "drop-shadow(0 0 8px rgba(251,191,36,0.5))" : "none" }}>
              {rank < 3 ? medals[rank] : `${rank + 1}.`}
            </span>
            <div style={{
              width: 14, height: 14, borderRadius: "50%", background: PLAYER_COLORS[p.idx].accent,
              boxShadow: rank === 0 ? `0 0 16px ${PLAYER_COLORS[p.idx].glow}` : `0 0 6px ${PLAYER_COLORS[p.idx].glow}`,
              animation: rank === 0 ? "breathe 2s infinite ease-in-out" : "none",
            }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: rank === 0 ? 20 : 16, fontWeight: rank === 0 ? 700 : 500, color: rank === 0 ? "#fff" : "rgba(255,255,255,0.65)", fontFamily: "'DM Sans', sans-serif", display: "block" }}>{p.name}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Sans', sans-serif" }}>Trefferquote: {p.pct}%</span>
            </div>
            <span style={{
              fontSize: rank === 0 ? 28 : 20, fontWeight: 700, color: PLAYER_COLORS[p.idx].accent,
              fontFamily: "'Cinzel', serif",
              filter: rank === 0 ? `drop-shadow(0 0 8px ${PLAYER_COLORS[p.idx].glow})` : "none",
            }}>{p.score}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={onBack} className="magic-btn-secondary">◁ Zurück zur Tabelle</button>
        <button onClick={() => setShowConfirm(true)} className="magic-btn-primary">✦ Neues Spiel ✦</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   GAME SCREEN
   ════════════════════════════════════════════ */
function GameScreen({ playerCount, playerNames, onReset }) {
  const totalRounds = ROUNDS_MAP[playerCount];
  const [data, setData] = useState(() => Array.from({ length: playerCount }, () => Array.from({ length: totalRounds }, () => ({ pred: "", act: "" }))));
  const [showChart, setShowChart] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [history, setHistory] = useState([]);
  const [bursts, setBursts] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);
  const activeRowRef = useRef(null);
  const burstId = useRef(0);

  const triggerBurst = useCallback((e, color) => {
    const rect = e.target.getBoundingClientRect();
    const id = burstId.current++;
    setBursts(b => [...b, { id, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, color }]);
  }, []);

  const updateCell = (pi, ri, field, val, e) => {
    if (val !== "" && !/^\d+$/.test(val)) return;
    setHistory(h => [...h.slice(-30), JSON.parse(JSON.stringify(data))]);
    const next = data.map((p, i) => i === pi ? p.map((r, j) => j === ri ? { ...r, [field]: val } : r) : p);
    const newEntry = { ...data[pi][ri], [field]: val };
    const wasDone = calcPoints(data[pi][ri].pred, data[pi][ri].act) !== null;
    const nowDone = calcPoints(newEntry.pred, newEntry.act) !== null;
    if (!wasDone && nowDone && e) triggerBurst(e, PLAYER_COLORS[pi].accent);
    setData(next);
  };

  const undo = () => { if (!history.length) return; setData(history[history.length - 1]); setHistory(h => h.slice(0, -1)); };

  const roundComplete = (ri) => data.every(p => calcPoints(p[ri].pred, p[ri].act) !== null);
  const gameComplete = Array.from({ length: totalRounds }, (_, ri) => roundComplete(ri)).every(Boolean);

  const activeRound = useMemo(() => { for (let r = 0; r < totalRounds; r++) if (!roundComplete(r)) return r; return totalRounds - 1; }, [data]);

  const getRunningTotal = (pi, upTo) => {
    let t = 0; for (let r = 0; r <= upTo; r++) { const p = calcPoints(data[pi][r].pred, data[pi][r].act); if (p !== null) t += p; } return t;
  };

  const totals = Array.from({ length: playerCount }, (_, i) => getRunningTotal(i, totalRounds - 1));
  const maxTotal = Math.max(...totals);

  const actSumWarn = (ri) => {
    const cards = cardsForRound(ri, totalRounds);
    const acts = data.map(p => p[ri].act).filter(v => v !== "");
    if (acts.length < playerCount) return null;
    return acts.reduce((s, v) => s + parseInt(v), 0) !== cards;
  };

  const predSumNote = (ri) => {
    const cards = cardsForRound(ri, totalRounds);
    const preds = data.map(p => p[ri].pred).filter(v => v !== "");
    if (preds.length < playerCount) return false;
    return preds.reduce((s, v) => s + parseInt(v), 0) === cards;
  };

  const correctPreds = useMemo(() => Array.from({ length: playerCount }, (_, pi) => {
    let c = 0; for (let ri = 0; ri < totalRounds; ri++) if (calcPoints(data[pi][ri].pred, data[pi][ri].act) !== null && data[pi][ri].pred === data[pi][ri].act) c++;
    return c;
  }), [data]);

  const completedRounds = useMemo(() => { let c = 0; for (let r = 0; r < totalRounds; r++) if (roundComplete(r)) c++; return c; }, [data]);

  useEffect(() => { if (activeRowRef.current) activeRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); }, [activeRound]);

  /* Feature 4: Smart Tab/Enter navigation */
  const buildInputOrder = useCallback(() => {
    // Order: for each round, pred for all players, then act for all players
    const order = [];
    for (let ri = 0; ri < totalRounds; ri++) {
      for (let pi = 0; pi < playerCount; pi++) order.push(`pred-${pi}-${ri}`);
      for (let pi = 0; pi < playerCount; pi++) order.push(`act-${pi}-${ri}`);
    }
    return order;
  }, [totalRounds, playerCount]);

  const handleNavigate = useCallback((currentId) => {
    const order = buildInputOrder();
    const idx = order.indexOf(currentId);
    // Find next empty field starting from current position
    for (let offset = 1; offset <= order.length; offset++) {
      const nextIdx = (idx + offset) % order.length;
      const nextId = order[nextIdx];
      const [field, pi, ri] = nextId.split("-");
      const val = data[parseInt(pi)][parseInt(ri)][field];
      if (val === "") {
        const el = document.querySelector(`[data-input-id="${nextId}"]`);
        if (el) { el.focus(); return; }
      }
    }
    // If all filled, just go to literal next
    const nextIdx = (idx + 1) % order.length;
    const el = document.querySelector(`[data-input-id="${order[nextIdx]}"]`);
    if (el) el.focus();
  }, [data, buildInputOrder]);

  if (showWinner) return <WinnerScreen playerNames={playerNames} totals={totals} correctPreds={correctPreds} completedRounds={completedRounds} onReset={onReset} onBack={() => setShowWinner(false)} />;

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", animation: "portalIn 0.6s ease-out both" }}>
      {showConfirm && <ConfirmDialog message="Wirklich ein neues Spiel starten? Alle Punkte gehen verloren!" onConfirm={onReset} onCancel={() => setShowConfirm(false)} />}
      {bursts.map(b => <SpellBurst key={b.id} x={b.x} y={b.y} color={b.color} onDone={() => setBursts(bs => bs.filter(bb => bb.id !== b.id))} />)}

      {/* Header */}
      <div style={{
        padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 8,
        borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(8,5,20,0.9)",
        backdropFilter: "blur(24px)", position: "sticky", top: 0, zIndex: 10,
        boxShadow: "0 4px 30px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{
            fontSize: 18, fontFamily: "'Cinzel Decorative', cursive", margin: 0,
            background: "linear-gradient(135deg, #c084fc, #60a5fa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 8px rgba(192,132,252,0.2))",
          }}>Wizard</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
              Runde {Math.min(activeRound + 1, totalRounds)}/{totalRounds}
            </span>
            <div style={{ width: 80, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, transition: "width 0.5s ease",
                width: `${(completedRounds / totalRounds) * 100}%`,
                background: "linear-gradient(90deg, #c084fc, #818cf8, #60a5fa)",
                boxShadow: "0 0 8px rgba(192,132,252,0.4)",
              }} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={undo} disabled={!history.length} className="magic-btn-sm" style={{ opacity: history.length ? 1 : 0.3 }}>↩</button>
          <button onClick={() => setShowChart(c => !c)} className="magic-btn-sm" style={{ borderColor: showChart ? "rgba(192,132,252,0.3)" : undefined, color: showChart ? "#c084fc" : undefined }}>📈</button>
          {gameComplete && <button onClick={() => setShowWinner(true)} className="magic-btn-gold">🏆 Ergebnis</button>}
          <button onClick={() => setShowConfirm(true)} className="magic-btn-sm">✕</button>
        </div>
      </div>

      {/* Score Cards */}
      <div style={{ padding: "14px 20px 6px", display: "flex", gap: 8, overflowX: "auto", flexShrink: 0 }}>
        {playerNames.map((name, i) => {
          const isLeader = totals[i] === maxTotal && totals[i] !== 0;
          const pct = completedRounds > 0 ? Math.round((correctPreds[i] / completedRounds) * 100) : 0;
          return (
            <div key={i} style={{
              flex: 1, minWidth: 125, padding: "14px 16px", borderRadius: 16,
              background: `linear-gradient(135deg, ${PLAYER_COLORS[i].bg}, rgba(12,8,28,0.5))`,
              border: `1.5px solid ${isLeader ? PLAYER_COLORS[i].accent : "rgba(255,255,255,0.04)"}`,
              boxShadow: isLeader ? `0 0 30px ${PLAYER_COLORS[i].glow}, inset 0 0 20px ${PLAYER_COLORS[i].bg}` : "none",
              transition: "all 0.5s ease", position: "relative", overflow: "hidden",
            }}>
              {isLeader && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${PLAYER_COLORS[i].dim}, transparent 70%)`, pointerEvents: "none" }} />}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, position: "relative" }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", background: PLAYER_COLORS[i].accent,
                  boxShadow: `0 0 8px ${PLAYER_COLORS[i].glow}`,
                  animation: isLeader ? "breathe 2s infinite ease-in-out" : "none",
                }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
                {isLeader && <span style={{ fontSize: 14, marginLeft: "auto", filter: "drop-shadow(0 0 4px rgba(251,191,36,0.5))" }}>👑</span>}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 20, position: "relative" }}>
                <AnimatedNumber value={totals[i]} color={PLAYER_COLORS[i].accent} size={30} glow={isLeader} glowColor={PLAYER_COLORS[i].glow} />
                {data[i][activeRound].pred !== "" && (
                  <div style={{
                    fontSize: 17, fontWeight: 700, color: "rgba(255,255,255,0.6)",
                    fontFamily: "'DM Sans', sans-serif",
                    background: "rgba(255,255,255,0.07)", borderRadius: 8,
                    padding: "3px 10px", lineHeight: 1.4,
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginRight: 4 }}>Ans.</span>
                    {data[i][activeRound].pred}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 4, fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
                {correctPreds[i]}/{completedRounds} ✓ · {pct}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      {showChart && (
        <div style={{ margin: "8px 20px", padding: 16, borderRadius: 16, background: "rgba(12,8,28,0.7)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", animation: "fadeSlideIn 0.3s ease-out", boxShadow: "inset 0 0 40px rgba(139,92,246,0.03)" }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 10, flexWrap: "wrap" }}>
            {playerNames.map((n, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 3, borderRadius: 2, background: PLAYER_COLORS[i].accent, boxShadow: `0 0 4px ${PLAYER_COLORS[i].glow}` }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>{n}</span>
              </div>
            ))}
          </div>
          <ScoreChart data={data} playerCount={playerCount} playerNames={playerNames} totalRounds={totalRounds} />
        </div>
      )}

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 20px 32px" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr>
              <th className="th1">Runde</th>
              {playerNames.map((name, i) => (
                <th key={i} colSpan={3} className="th1" style={{ textAlign: "center", color: PLAYER_COLORS[i].accent, fontWeight: 600, fontSize: 13, borderBottom: `2px solid ${PLAYER_COLORS[i].accent}`, textShadow: `0 0 10px ${PLAYER_COLORS[i].glow}` }}>{name}</th>
              ))}
            </tr>
            <tr>
              <th className="th2" />
              {playerNames.map((_, i) => (
                <React.Fragment key={i}>
                  <th className="th2">Ans.</th>
                  <th className="th2">Stiche</th>
                  <th className="th2">Σ</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalRounds }, (_, ri) => {
              const isActive = ri === activeRound;
              const isDone = roundComplete(ri);
              const cards = cardsForRound(ri, totalRounds);
              const actWarn = actSumWarn(ri);
              const predNote = predSumNote(ri);
              const isHovered = hoveredRow === ri;

              return (
                <tr key={ri} ref={isActive ? activeRowRef : null}
                  onMouseEnter={() => setHoveredRow(ri)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    background: isActive ? "rgba(192,132,252,0.04)" : isHovered ? "rgba(255,255,255,0.02)" : "transparent",
                    transition: "background 0.25s",
                    boxShadow: isActive ? "inset 0 0 30px rgba(192,132,252,0.03)" : isHovered ? "inset 0 0 20px rgba(255,255,255,0.01)" : "none",
                  }}>
                  <td style={{
                    padding: "7px 12px", fontSize: 14, fontWeight: 600,
                    color: isActive ? "#c084fc" : isDone ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)",
                    borderBottom: "1px solid rgba(255,255,255,0.03)", whiteSpace: "nowrap", fontFamily: "'Cinzel', serif",
                    textShadow: isActive ? "0 0 8px rgba(192,132,252,0.3)" : "none",
                  }}>
                    {isActive && <span style={{ marginRight: 4, fontSize: 8, verticalAlign: "middle", animation: "breathe 1.5s infinite" }}>✦</span>}
                    {ri + 1}
                  </td>
                  {Array.from({ length: playerCount }, (_, pi) => {
                    const pts = calcPoints(data[pi][ri].pred, data[pi][ri].act);
                    const runTotal = pts !== null ? getRunningTotal(pi, ri) : null;
                    const isCorrect = pts !== null && data[pi][ri].pred === data[pi][ri].act;
                    const cellDone = pts !== null;
                    const doneBg = cellDone ? PLAYER_COLORS[pi].doneBg : "transparent";
                    return (
                      <React.Fragment key={pi}>
                        <td style={{ padding: "4px 2px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.03)", borderLeft: "1px solid rgba(255,255,255,0.02)", background: doneBg, transition: "background 0.4s" }}>
                          <MagicInput value={data[pi][ri].pred} onChange={v => updateCell(pi, ri, "pred", v, null)} placeholder="–" color={PLAYER_COLORS[pi].accent} warn={false} inputId={`pred-${pi}-${ri}`} onNavigate={handleNavigate} />
                        </td>
                        <td style={{ padding: "4px 2px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.03)", background: doneBg, transition: "background 0.4s" }}>
                          <MagicInput value={data[pi][ri].act}
                            onChange={v => updateCell(pi, ri, "act", v, null)} placeholder="–"
                            color={PLAYER_COLORS[pi].accent} warn={actWarn === true} inputId={`act-${pi}-${ri}`} onNavigate={handleNavigate} />
                        </td>
                        <td style={{
                          padding: "4px 6px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.03)",
                          fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                          color: runTotal === null ? "rgba(255,255,255,0.06)" : runTotal >= 0 ? PLAYER_COLORS[pi].accent : "#ef4444",
                          textShadow: runTotal !== null && runTotal >= 0 ? `0 0 8px ${PLAYER_COLORS[pi].glow}` : "none",
                          background: doneBg, transition: "background 0.4s",
                        }}>
                          {runTotal !== null ? (
                            <div style={{ lineHeight: 1.1, animation: "fadeIn 0.3s ease-out" }}>
                              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                                {runTotal}
                                {isCorrect ? <span style={{ fontSize: 10, color: "#34d399", textShadow: "0 0 6px rgba(52,211,153,0.5)" }}>✓</span>
                                  : <span style={{ fontSize: 9, color: "rgba(239,68,68,0.4)" }}>✗</span>}
                              </span>
                              <div style={{ fontSize: 10, fontWeight: 400, color: pts >= 0 ? "rgba(52,211,153,0.6)" : "rgba(239,68,68,0.5)" }}>{pts >= 0 ? "+" : ""}{pts}</div>
                            </div>
                          ) : <span style={{ opacity: 0.3 }}>·</span>}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  {actWarn === true && <td style={{ padding: "0 6px", fontSize: 9, color: "rgba(239,68,68,0.6)", whiteSpace: "nowrap", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>⚠ ≠{cards}</td>}
                  {predNote && actWarn !== true && <td style={{ padding: "0 6px", fontSize: 9, color: "rgba(251,191,36,0.35)", whiteSpace: "nowrap", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>💡 Σ={cards}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   ROOT
   ════════════════════════════════════════════ */
export default function WizardScoreTracker() {
  const [gs, setGs] = useState("setup");
  const [pc, setPc] = useState(4);
  const [pn, setPn] = useState([]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 0%, rgba(88,28,135,0.25) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(30,58,138,0.2) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(15,10,30,1) 0%, #050311 100%)",
      color: "#fff", overflow: "hidden",
    }}>
      <MagicalBackground />
      {gs === "setup" && <SetupScreen onStart={(c, n) => { setPc(c); setPn(n); setGs("playing"); }} />}
      {gs === "playing" && <GameScreen playerCount={pc} playerNames={pn} onReset={() => setGs("setup")} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@700;900&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

        * { box-sizing: border-box; margin: 0; }
        input::placeholder { color: rgba(255,255,255,0.12) !important; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(192,132,252,0.15); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(192,132,252,0.3); }
        table th, table td { vertical-align: middle; }

        .th1 {
          position: sticky; top: 0; z-index: 5; padding: 10px 8px;
          background: rgba(8,5,20,0.97); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          text-align: left; font-size: 11px; color: rgba(255,255,255,0.3);
          letter-spacing: 1px; text-transform: uppercase; font-weight: 500;
        }
        .th2 {
          position: sticky; top: 37px; z-index: 5; padding: 5px 4px;
          background: rgba(8,5,20,0.97);
          border-bottom: 1px solid rgba(255,255,255,0.04);
          text-align: center; font-size: 10px; color: rgba(255,255,255,0.2);
          letter-spacing: 1px; text-transform: uppercase;
        }

        .magic-btn-sm {
          padding: 7px 12px; border-radius: 8;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.5);
          font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.3s;
        }
        .magic-btn-sm:hover {
          border-color: rgba(192,132,252,0.3); color: #c084fc;
          box-shadow: 0 0 12px rgba(192,132,252,0.15);
        }

        .magic-btn-gold {
          padding: 7px 16px; border-radius: 8; border: none;
          background: linear-gradient(135deg, #fbbf24, #f97316);
          color: #000; font-size: 13px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          animation: pulseGold 2s infinite;
          box-shadow: 0 0 16px rgba(251,191,36,0.3);
        }

        .magic-btn-primary {
          padding: 14px 32px; border-radius: 14; border: none;
          background: linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #8b5cf6 100%);
          color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: 'Cinzel', serif; letter-spacing: 2px; text-transform: uppercase;
          box-shadow: 0 4px 24px rgba(124,58,237,0.35);
          transition: all 0.3s;
        }
        .magic-btn-primary:hover {
          transform: translateY(-2px); box-shadow: 0 8px 36px rgba(124,58,237,0.5);
        }

        .magic-btn-secondary {
          padding: 14px 28px; border-radius: 14;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6);
          font-size: 14px; cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.3s;
        }
        .magic-btn-secondary:hover {
          border-color: rgba(192,132,252,0.3); color: #c084fc;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(-50%,-50%) translate(0, 0); }
          25% { transform: translate(-50%,-50%) translate(30px, -40px); }
          50% { transform: translate(-50%,-50%) translate(-20px, 20px); }
          75% { transform: translate(-50%,-50%) translate(40px, 30px); }
        }
        @keyframes floatRune {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.04; }
          30% { opacity: 0.08; }
          50% { transform: translate(var(--dx), var(--dy)) rotate(15deg); opacity: 0.06; }
          70% { opacity: 0.08; }
        }
        @keyframes aurora {
          0%, 100% { transform: scaleX(1) skewX(0deg); opacity: 0.6; }
          33% { transform: scaleX(1.15) skewX(3deg); opacity: 0.8; }
          66% { transform: scaleX(0.9) skewX(-2deg); opacity: 0.5; }
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes spinSlow {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes portalIn {
          from { opacity: 0; transform: scale(0.95); filter: blur(6px); }
          to { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes portalOut {
          from { opacity: 1; transform: scale(1); filter: blur(0); }
          to { opacity: 0; transform: scale(1.05); filter: blur(8px); }
        }
        @keyframes pulseGold {
          0%, 100% { box-shadow: 0 0 10px rgba(251,191,36,0.3); }
          50% { box-shadow: 0 0 24px rgba(251,191,36,0.6), 0 0 48px rgba(251,191,36,0.2); }
        }
        @keyframes burstParticle {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--bx), var(--by)) scale(0); opacity: 0; }
        }
        @keyframes burstGlow {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 0.8; }
          100% { transform: translate(-50%,-50%) scale(4); opacity: 0; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) translateX(var(--drift)) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}