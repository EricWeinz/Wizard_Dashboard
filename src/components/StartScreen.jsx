import React from "react";
import { RUNES, MAGIC_SYMBOLS } from "../lib/wizard.js";
import ThemePicker from "./ThemePicker.jsx";

/* ════════════════════════════════════════════
   START SCREEN – Spielart wählen
   ════════════════════════════════════════════ */
export default function StartScreen({ onLocal, onOnline, resumeCode = null, onResume }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", padding: 24, position: "relative", zIndex: 1,
      animation: "portalIn 0.8s ease-out backwards",
    }}>
      <div style={{ position: "relative", textAlign: "center", marginBottom: 40 }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 240, height: 240, borderRadius: "50%", border: "1px solid rgb(var(--accent) / 0.1)",
          animation: "spinSlow 30s linear infinite",
        }}>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <div key={i} style={{
              position: "absolute", left: `${50 + Math.cos(a) * 50}%`, top: `${50 + Math.sin(a) * 50}%`,
              transform: "translate(-50%,-50%)", fontSize: 16, color: "rgb(var(--accent) / 0.15)",
            }}>{RUNES[i + 8]}</div>;
          })}
        </div>
        <div style={{ fontSize: 12, letterSpacing: 8, textTransform: "uppercase", color: "rgb(var(--accent) / 0.5)", marginBottom: 12, fontFamily: "'Cinzel', serif", position: "relative" }}>
          ✦ Score Tracker ✦
        </div>
        <h1 style={{
          fontSize: "clamp(52px, 9vw, 88px)", fontFamily: "'Cinzel Decorative', cursive",
          background: "linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-mid)) 25%, rgb(var(--accent-2)) 50%, rgb(var(--accent-mid)) 75%, rgb(var(--accent)) 100%)",
          backgroundSize: "200% 200%", animation: "shimmer 4s ease-in-out infinite",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: 0, lineHeight: 1.1, fontWeight: 700, position: "relative",
          filter: "drop-shadow(0 0 30px rgb(var(--accent) / 0.3))",
        }}>Wizard</h1>
        <div style={{ marginTop: 8, fontSize: 13, color: "rgb(var(--ink) / 0.25)", fontFamily: "'DM Sans', sans-serif", letterSpacing: 2 }}>
          {MAGIC_SYMBOLS.slice(0, 7).join(" ")}
        </div>
      </div>

      <div className="magic-card">
        <span className="magic-label">◈ Wie wollt ihr spielen? ◈</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {resumeCode && (
            <button className="magic-option" onClick={onResume} style={{ borderColor: "rgb(var(--gold) / 0.35)", background: "rgb(var(--gold) / 0.06)" }}>
              <span style={{ fontSize: 30, filter: "drop-shadow(0 0 10px rgb(var(--gold) / 0.35))" }} aria-hidden>↩</span>
              <span>
                <span style={{ display: "block", fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700, letterSpacing: 1, color: "rgb(var(--gold-text))" }}>
                  Zurück zu Sitzung <span style={{ letterSpacing: 3 }}>{resumeCode}</span>
                </span>
                <span style={{ display: "block", fontSize: 13, color: "rgb(var(--ink) / 0.45)", marginTop: 4, lineHeight: 1.4 }}>
                  Die zuletzt geöffnete Online-Sitzung fortsetzen.
                </span>
              </span>
            </button>
          )}
          <button className="magic-option" onClick={onLocal}>
            <span style={{ fontSize: 30, filter: "drop-shadow(0 0 10px rgb(var(--accent) / 0.35))" }} aria-hidden>🏠</span>
            <span>
              <span style={{ display: "block", fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700, letterSpacing: 1, color: "rgb(var(--soft))" }}>An einem Gerät</span>
              <span style={{ display: "block", fontSize: 13, color: "rgb(var(--ink) / 0.45)", marginTop: 4, lineHeight: 1.4 }}>
                Eine Person trägt für alle ein – wie gewohnt.
              </span>
            </span>
          </button>
          <button className="magic-option" onClick={onOnline}>
            <span style={{ fontSize: 30, filter: "drop-shadow(0 0 10px rgb(var(--accent-2) / 0.35))" }} aria-hidden>🌐</span>
            <span>
              <span style={{ display: "block", fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700, letterSpacing: 1, color: "rgb(var(--soft-blue))" }}>Online-Sitzung</span>
              <span style={{ display: "block", fontSize: 13, color: "rgb(var(--ink) / 0.45)", marginTop: 4, lineHeight: 1.4 }}>
                Alle sehen den Spielstand live auf dem eigenen Handy. Beitreten per Code, Link oder QR-Code.
              </span>
            </span>
          </button>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 500 }}>
        <ThemePicker />
      </div>
    </div>
  );
}
