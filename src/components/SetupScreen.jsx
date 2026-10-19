import React, { useState } from "react";
import { PLAYER_COLORS, RUNES, MAGIC_SYMBOLS } from "../lib/wizard.js";

/* ════════════════════════════════════════════
   SETUP SCREEN
   ════════════════════════════════════════════ */
export default function SetupScreen({ onStart, onBack }) {
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
      animation: entered ? "portalOut 0.8s ease-in forwards" : "portalIn 0.8s ease-out backwards",
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

      {onBack && (
        <button onClick={onBack} className="magic-btn-secondary" style={{ marginTop: 24 }}>◁ Zurück</button>
      )}
    </div>
  );
}
