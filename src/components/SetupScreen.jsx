import React, { useState } from "react";
import { PLAYER_COLORS } from "../lib/wizard.js";
import { themeGlyphs, useTheme } from "../lib/theme.js";
import StartPlayerPicker from "./StartPlayerPicker.jsx";
import ThemeLogo from "./ThemeLogo.jsx";

/* ════════════════════════════════════════════
   SETUP SCREEN
   ════════════════════════════════════════════ */
export default function SetupScreen({ onStart, onBack }) {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState(["", "", "", "", "", ""]);
  const [entered, setEntered] = useState(false);
  // Wer sagt in Runde 1 zuerst an? Danach rückt der Beginn jede Runde eins weiter.
  const [startIndex, setStartIndex] = useState(0);
  const start = Math.min(startIndex, count - 1);
  const shownNames = Array.from({ length: count }, (_, i) => names[i] || `Spieler ${i + 1}`);
  const { ring, symbols } = themeGlyphs(useTheme());

  const handleStart = () => {
    setEntered(true);
    setTimeout(() => {
      const pn = names.slice(0, count).map((n, i) => n || `Spieler ${i + 1}`);
      onStart(count, pn, start);
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
          width: 260, height: 260, borderRadius: "50%", border: "1px solid rgb(var(--accent) / 0.1)",
          animation: "spinSlow 30s linear infinite",
        }}>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <div key={i} style={{
              position: "absolute", left: `${50 + Math.cos(a) * 50}%`, top: `${50 + Math.sin(a) * 50}%`,
              transform: "translate(-50%,-50%)", fontSize: 16, color: "rgb(var(--accent) / 0.15)",
            }}>{ring[i % ring.length]}</div>;
          })}
        </div>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 200, height: 200, borderRadius: "50%", border: "1px dashed rgb(var(--accent-2) / 0.08)",
          animation: "spinSlow 20s linear infinite reverse",
        }} />
        <ThemeLogo height={80} style={{ margin: "0 auto 14px", position: "relative" }} />
        <div style={{ fontSize: 12, letterSpacing: 8, textTransform: "uppercase", color: "rgb(var(--accent) / 0.5)", marginBottom: 12, fontFamily: "var(--font-label)", position: "relative" }}>
          ✦ Score Tracker ✦
        </div>
        <h1 className="brand-title" style={{
          fontSize: "clamp(52px, 9vw, 88px)", fontFamily: "var(--font-title)",
          background: "linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-mid)) 25%, rgb(var(--accent-2)) 50%, rgb(var(--accent-mid)) 75%, rgb(var(--accent)) 100%)",
          backgroundSize: "200% 200%", animation: "shimmer 4s ease-in-out infinite",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: 0, lineHeight: 1.1, fontWeight: 700, position: "relative",
          filter: "drop-shadow(0 0 30px rgb(var(--accent) / 0.3))",
        }}>Wizard</h1>
        <div style={{ marginTop: 8, fontSize: 13, color: "rgb(var(--ink) / 0.25)", fontFamily: "'DM Sans', sans-serif", letterSpacing: 2 }}>
          {symbols.slice(0, 7).join(" ")}
        </div>
      </div>

      <div className="theme-stripe" style={{
        background: "rgb(var(--s-card) / 0.8)", border: "1px solid rgb(var(--accent) / 0.15)",
        borderRadius: 24, padding: "clamp(26px, 7vw, 40px) clamp(18px, 6vw, 44px)", maxWidth: 500, width: "100%",
        backdropFilter: "blur(24px)", position: "relative", overflow: "hidden",
        boxShadow: "0 0 60px rgb(var(--btn-c) / 0.08), inset 0 1px 0 rgb(var(--ink) / 0.05)",
      }}>
        <div style={{ position: "absolute", top: 12, left: 16, fontSize: 18, color: "rgb(var(--accent) / 0.08)", fontFamily: "serif" }}>{ring[0 % ring.length]}</div>
        <div style={{ position: "absolute", top: 12, right: 16, fontSize: 18, color: "rgb(var(--accent) / 0.08)", fontFamily: "serif" }}>{ring[23 % ring.length]}</div>
        <div style={{ position: "absolute", bottom: 12, left: 16, fontSize: 18, color: "rgb(var(--accent) / 0.08)", fontFamily: "serif" }}>{ring[16 % ring.length]}</div>
        <div style={{ position: "absolute", bottom: 12, right: 16, fontSize: 18, color: "rgb(var(--accent) / 0.08)", fontFamily: "serif" }}>{ring[3 % ring.length]}</div>

        <div style={{ marginBottom: 32 }}>
          <StartPlayerPicker names={shownNames} selected={start} onSelect={setStartIndex} />
        </div>

        <label style={{ display: "block", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgb(var(--accent) / 0.5)", marginBottom: 16, fontFamily: "var(--font-label)" }}>
          ◈ Anzahl der Spieler ◈
        </label>
        <div style={{ display: "flex", gap: 10, marginBottom: 36 }}>
          {[3, 4, 5, 6].map(n => (
            <button key={n} onClick={() => setCount(n)} style={{
              flex: 1, padding: "16px 0", borderRadius: 14,
              border: `1.5px solid ${count === n ? "rgb(var(--accent))" : "rgb(var(--ink) / 0.06)"}`,
              background: count === n ? "rgb(var(--accent) / 0.12)" : "rgb(var(--ink) / 0.02)",
              color: count === n ? "rgb(var(--accent))" : "rgb(var(--ink) / 0.4)",
              fontSize: 24, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-label)",
              transition: "all 0.3s ease",
              boxShadow: count === n ? "0 0 24px rgb(var(--accent) / 0.2), inset 0 0 20px rgb(var(--accent) / 0.05)" : "none",
              transform: count === n ? "scale(1.05)" : "scale(1)",
            }}>{n}</button>
          ))}
        </div>

        <label style={{ display: "block", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgb(var(--accent) / 0.5)", marginBottom: 16, fontFamily: "var(--font-label)" }}>
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
                  border: "1.5px solid rgb(var(--ink) / 0.06)", background: "rgb(var(--ink) / 0.03)",
                  color: "rgb(var(--ink))", fontSize: 15, outline: "none", fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.3s",
                }}
                onFocus={e => { e.target.style.borderColor = PLAYER_COLORS[i].accent; e.target.style.boxShadow = `0 0 16px ${PLAYER_COLORS[i].glow}`; }}
                onBlur={e => { e.target.style.borderColor = "rgb(var(--ink) / 0.06)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: "rgb(var(--ink) / 0.35)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, marginTop: -22, marginBottom: 28 }}>
          Reihenfolge der Namen = Sitzordnung im Uhrzeigersinn.
        </p>

        <button onClick={handleStart} style={{
          width: "100%", padding: "18px 0", borderRadius: 16, border: "none",
          background: "linear-gradient(135deg, rgb(var(--btn-a)) 0%, rgb(var(--btn-b)) 50%, rgb(var(--btn-c)) 100%)",
          color: "rgb(var(--on-accent))", fontSize: 16, fontWeight: 600, cursor: "pointer",
          fontFamily: "var(--font-label)", letterSpacing: 3, textTransform: "uppercase",
          boxShadow: "0 4px 30px rgb(var(--btn-a) / 0.4), inset 0 1px 0 rgb(var(--ink) / 0.1)",
          transition: "all 0.3s", position: "relative", overflow: "hidden",
        }}
          onMouseEnter={e => { e.target.style.transform = "translateY(-2px) scale(1.01)"; e.target.style.boxShadow = "0 8px 40px rgb(var(--btn-a) / 0.5)"; }}
          onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = "0 4px 30px rgb(var(--btn-a) / 0.4)"; }}
        >
          ✦ Spiel starten ✦
          <span style={{ display: "block", fontSize: 12, letterSpacing: 0.5, textTransform: "none", opacity: 0.85, marginTop: 5, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
            {shownNames[start]} sagt zuerst an
          </span>
        </button>
      </div>

      {onBack && (
        <button onClick={onBack} className="magic-btn-secondary" style={{ marginTop: 24 }}>◁ Zurück</button>
      )}
    </div>
  );
}
