import React, { useState } from "react";
import { PLAYER_COLORS } from "../lib/wizard.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import Confetti from "./Confetti.jsx";
import { ThemeMenu } from "./ThemePicker.jsx";
import ThemeLogo from "./ThemeLogo.jsx";
import { themeWords, useTheme } from "../lib/theme.js";

/* ════════════════════════════════════════════
   WINNER SCREEN
   ════════════════════════════════════════════ */
/**
 * Ohne `actions` verhält sich der Screen wie bisher (Zurück zur Tabelle / Neues Spiel mit Rückfrage).
 * Online übergibt eigene Aktionen, einen optionalen Hinweis (`notice`) und den eigenen Spielerindex.
 */
export default function WinnerScreen({ playerNames, totals, correctPreds, completedRounds, onReset, onBack, actions, notice, highlightIndex = null }) {
  const sorted = totals.map((t, i) => ({ name: playerNames[i], score: t, idx: i, pct: completedRounds > 0 ? Math.round((correctPreds[i] / completedRounds) * 100) : 0 }))
    .sort((a, b) => b.score - a.score);
  const medals = ["🥇", "🥈", "🥉"];
  // Gleichstand: gleiche Punktzahl = gleicher Platz (und gleiche Medaille)
  const placeOf = (p) => sorted.findIndex(q => q.score === p.score);
  const sharedWin = sorted.length > 1 && sorted[1].score === sorted[0].score;
  const [showConfirm, setShowConfirm] = useState(false);
  const words = themeWords(useTheme());

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24, position: "relative", zIndex: 1, animation: "portalIn 0.8s ease-out backwards" }}>
      {showConfirm && <ConfirmDialog message="Wirklich ein neues Spiel starten? Alle Punkte gehen verloren!" onConfirm={onReset} onCancel={() => setShowConfirm(false)} />}
      <Confetti />
      <ThemeMenu style={{ position: "absolute", top: 16, right: 16, zIndex: 20 }} />
      <div style={{ textAlign: "center", marginBottom: 40, position: "relative" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -60%)",
          width: 180, height: 180, borderRadius: "50%",
          background: "radial-gradient(circle, rgb(var(--gold) / 0.15), transparent 70%)",
          animation: "breathe 3s infinite ease-in-out",
        }} />
        <div style={{ fontSize: 72, marginBottom: 8, position: "relative", filter: "drop-shadow(0 0 20px rgb(var(--gold) / 0.4))", animation: "floatY 3s infinite ease-in-out" }}>
          <ThemeLogo height={110} style={{ margin: "0 auto 6px" }} fallback="🧙‍♂️" />
        </div>
        <h1 className="brand-title" style={{
          fontSize: "clamp(36px,7vw,56px)", fontFamily: "var(--font-title)",
          background: "linear-gradient(135deg, rgb(var(--gold)) 0%, rgb(var(--gold-2)) 50%, rgb(var(--gold)) 100%)",
          backgroundSize: "200% 200%", animation: "shimmer 3s ease-in-out infinite",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: 0, lineHeight: 1.2, position: "relative",
          filter: "drop-shadow(0 0 20px rgb(var(--gold) / 0.3))",
        }}>{words.winnerTitle}</h1>
        <p style={{ color: "rgb(var(--ink) / 0.4)", marginTop: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif", letterSpacing: 1 }}>
          {`✦ ${sharedWin ? words.winnerTie : words.winnerSub} ✦`}
        </p>
      </div>

      <div className="theme-stripe" style={{
        position: "relative",
        background: "rgb(var(--s-card) / 0.8)", border: "1px solid rgb(var(--gold) / 0.15)", borderRadius: 24,
        padding: "32px 36px", maxWidth: 460, width: "100%", backdropFilter: "blur(20px)",
        boxShadow: "0 0 60px rgb(var(--gold) / 0.06)",
      }}>
        {sorted.map((p, i) => { const rank = placeOf(p); return (
          <div key={p.idx} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "16px 0",
            borderBottom: i < sorted.length - 1 ? "1px solid rgb(var(--ink) / 0.05)" : "none",
            animation: `fadeSlideIn 0.6s ${i * 0.15}s both ease-out`,
          }}>
            <span style={{ fontSize: rank < 3 ? 30 : 18, width: 40, textAlign: "center", color: rank >= 3 ? "rgb(var(--ink) / 0.3)" : undefined, filter: rank === 0 ? "drop-shadow(0 0 8px rgb(var(--gold) / 0.5))" : "none" }}>
              {rank < 3 ? medals[rank] : `${rank + 1}.`}
            </span>
            <div style={{
              width: 14, height: 14, borderRadius: "50%", background: PLAYER_COLORS[p.idx].accent, flexShrink: 0,
              boxShadow: rank === 0 ? `0 0 16px ${PLAYER_COLORS[p.idx].glow}` : `0 0 6px ${PLAYER_COLORS[p.idx].glow}`,
              animation: rank === 0 ? "breathe 2s infinite ease-in-out" : "none",
            }} />
            <div style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
              <span style={{ fontSize: rank === 0 ? 20 : 16, fontWeight: rank === 0 ? 700 : 500, color: rank === 0 ? "rgb(var(--ink))" : "rgb(var(--ink) / 0.65)", fontFamily: "'DM Sans', sans-serif", display: "block" }}>{p.name}{p.idx === highlightIndex && <span style={{ color: "rgb(var(--ink) / 0.35)", fontWeight: 400 }}> (du)</span>}</span>
              <span style={{ fontSize: 11, color: "rgb(var(--ink) / 0.25)", fontFamily: "'DM Sans', sans-serif" }}>Trefferquote: {p.pct}%</span>
            </div>
            <span style={{
              fontSize: rank === 0 ? 28 : 20, fontWeight: 700, color: PLAYER_COLORS[p.idx].accent,
              fontFamily: "var(--font-label)",
              filter: rank === 0 ? `drop-shadow(0 0 8px ${PLAYER_COLORS[p.idx].glow})` : "none",
            }}>{p.score}</span>
          </div>
        ); })}
      </div>

      {notice && (
        <div role="status" style={{
          marginTop: 20, maxWidth: 460, width: "100%", padding: "12px 16px", borderRadius: 14,
          border: "1px solid rgb(var(--gold) / 0.25)", background: "rgb(var(--gold) / 0.06)",
          color: "rgb(var(--gold) / 0.85)", fontSize: 13, lineHeight: 1.5, textAlign: "center",
          fontFamily: "'DM Sans', sans-serif",
        }}>{notice}</div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap", justifyContent: "center" }}>
        {actions ?? (<>
          <button onClick={onBack} className="magic-btn-secondary">◁ Zurück zur Tabelle</button>
          <button onClick={() => setShowConfirm(true)} className="magic-btn-primary">✦ Neues Spiel ✦</button>
        </>)}
      </div>
    </div>
  );
}
