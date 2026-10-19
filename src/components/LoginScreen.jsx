import React, { useState } from "react";
import { RUNES } from "../lib/wizard.js";
import { inviteCodeFromUrl } from "../online/keys.js";
import { themeIcon, useTheme } from "../lib/theme.js";

const ACCESS_KEY = "wizard";
/** localStorage-Schlüssel: Passwort wurde in diesem Browser schon einmal eingegeben. */
export const UNLOCK_KEY = "wizard:unlocked";

export function isUnlocked() {
  try { return localStorage.getItem(UNLOCK_KEY) === "1"; } catch { return false; }
}

/* ════════════════════════════════════════════
   LOGIN SCREEN
   ════════════════════════════════════════════ */
export default function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [inviteCode] = useState(inviteCodeFromUrl);
  const theme = useTheme();

  const handleSubmit = () => {
    if (password === ACCESS_KEY) {
      try { localStorage.setItem(UNLOCK_KEY, "1"); } catch { /* privater Modus: dann eben jedes Mal */ }
      setUnlocking(true);
      setTimeout(() => onLogin(), 900);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", padding: 24, position: "relative", zIndex: 1,
      animation: unlocking ? "portalOut 0.9s ease-in forwards" : "portalIn 1s ease-out backwards",
    }}>
      {/* Outer magic circle */}
      <div style={{
        position: "absolute", width: 360, height: 360, borderRadius: "50%",
        border: "1px solid rgb(var(--accent) / 0.08)",
        animation: "spinSlow 40s linear infinite",
      }}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <div key={i} style={{
            position: "absolute", left: `${50 + Math.cos(a) * 50}%`, top: `${50 + Math.sin(a) * 50}%`,
            transform: "translate(-50%,-50%)", fontSize: 14, color: "rgb(var(--accent) / 0.1)",
          }}>{RUNES[i]}</div>;
        })}
      </div>
      {/* Inner circle */}
      <div style={{
        position: "absolute", width: 280, height: 280, borderRadius: "50%",
        border: "1px dashed rgb(var(--accent-2) / 0.06)",
        animation: "spinSlow 25s linear infinite reverse",
      }} />

      <div style={{ position: "relative", textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 56, marginBottom: 16, filter: "drop-shadow(0 0 24px rgb(var(--accent) / 0.4))", animation: "floatY 4s infinite ease-in-out" }}>
          {themeIcon(theme)}
        </div>
        <h1 style={{
          fontSize: "clamp(40px, 7vw, 64px)", fontFamily: "'Cinzel Decorative', cursive",
          background: "linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-mid)) 50%, rgb(var(--accent-2)) 100%)",
          backgroundSize: "200% 200%", animation: "shimmer 4s ease-in-out infinite",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: 0, lineHeight: 1.1, fontWeight: 700,
          filter: "drop-shadow(0 0 20px rgb(var(--accent) / 0.2))",
        }}>Wizard</h1>
        <div style={{
          fontSize: 11, letterSpacing: 5, textTransform: "uppercase",
          color: "rgb(var(--accent) / 0.4)", marginTop: 10, fontFamily: "'Cinzel', serif",
        }}>✦ Score Tracker ✦</div>
      </div>

      <div style={{
        background: "rgb(var(--s-card) / 0.8)", border: "1px solid rgb(var(--accent) / 0.12)",
        borderRadius: 20, padding: "36px 40px", maxWidth: 380, width: "100%",
        backdropFilter: "blur(24px)", position: "relative", overflow: "hidden",
        boxShadow: "0 0 60px rgb(var(--btn-c) / 0.06), inset 0 1px 0 rgb(var(--ink) / 0.04)",
        animation: shake ? "shakeX 0.4s ease-out" : "none",
      }}>
        {/* Corner runes */}
        <div style={{ position: "absolute", top: 10, left: 14, fontSize: 16, color: "rgb(var(--accent) / 0.06)", fontFamily: "serif" }}>ᚺ</div>
        <div style={{ position: "absolute", top: 10, right: 14, fontSize: 16, color: "rgb(var(--accent) / 0.06)", fontFamily: "serif" }}>ᛉ</div>

        <label style={{
          display: "block", fontSize: 11, letterSpacing: 3, textTransform: "uppercase",
          color: "rgb(var(--accent) / 0.45)", marginBottom: 14, fontFamily: "'Cinzel', serif",
          textAlign: "center",
        }}>◈ Zugang ◈</label>

        <div style={{ position: "relative", marginBottom: 20 }}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Passwort eingeben"
            autoFocus
            style={{
              width: "100%", padding: "14px 18px", borderRadius: 12, textAlign: "center",
              border: `1.5px solid ${error ? "rgb(var(--danger) / 0.5)" : "rgb(var(--ink) / 0.08)"}`,
              background: error ? "rgb(var(--danger) / 0.06)" : "rgb(var(--ink) / 0.03)",
              color: "rgb(var(--ink))", fontSize: 16, outline: "none", fontFamily: "'DM Sans', sans-serif",
              letterSpacing: 4, transition: "all 0.3s",
            }}
            onFocus={e => { if (!error) { e.target.style.borderColor = "rgb(var(--accent))"; e.target.style.boxShadow = "0 0 16px rgb(var(--accent) / 0.2)"; } }}
            onBlur={e => { if (!error) { e.target.style.borderColor = "rgb(var(--ink) / 0.08)"; e.target.style.boxShadow = "none"; } }}
          />
        </div>

        {error && (
          <div style={{
            textAlign: "center", fontSize: 13, color: "rgb(var(--danger) / 0.8)",
            marginBottom: 16, fontFamily: "'DM Sans', sans-serif",
            animation: "fadeIn 0.3s ease-out",
          }}>
            ✗ Falsches Passwort
          </div>
        )}

        <button onClick={handleSubmit} style={{
          width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
          background: "linear-gradient(135deg, rgb(var(--btn-a)) 0%, rgb(var(--btn-b)) 50%, rgb(var(--btn-c)) 100%)",
          color: "rgb(var(--on-accent))", fontSize: 15, fontWeight: 600, cursor: "pointer",
          fontFamily: "'Cinzel', serif", letterSpacing: 3, textTransform: "uppercase",
          boxShadow: "0 4px 24px rgb(var(--btn-a) / 0.35), inset 0 1px 0 rgb(var(--ink) / 0.1)",
          transition: "all 0.3s",
        }}
          onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 32px rgb(var(--btn-a) / 0.5)"; }}
          onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = "0 4px 24px rgb(var(--btn-a) / 0.35)"; }}
        >✦ Eintreten ✦</button>
      </div>

      <div style={{
        marginTop: 32, fontSize: 11, color: "rgb(var(--ink) / 0.15)",
        fontFamily: "'DM Sans', sans-serif", textAlign: "center", letterSpacing: 1,
      }}>
        {inviteCode
          ? <>Einladung zu Sitzung <span style={{ letterSpacing: 3, color: "rgb(var(--accent) / 0.6)" }}>{inviteCode}</span> · Passwort bei der Spielleitung erfragen</>
          : "Geschützter Bereich · Nur für eingeladene Spieler"}
      </div>
    </div>
  );
}
