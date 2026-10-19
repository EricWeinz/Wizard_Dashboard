import React, { useMemo } from "react";
import { PLAYER_COLORS } from "../lib/wizard.js";
import { themeConfetti, useTheme } from "../lib/theme.js";

/* ════════════════════════════════════════════
   CONFETTI
   ════════════════════════════════════════════ */
export default function Confetti() {
  // Eigene Konfettifarben des Designs (Dynamo: Gelb, Weiß, Rot), sonst die Spielerfarben
  const palette = themeConfetti(useTheme()) ?? PLAYER_COLORS.map((c) => c.accent);
  const pieces = useMemo(() => Array.from({ length: 100 }, (_, i) => ({
    id: i, x: Math.random() * 100, color: palette[i % palette.length],
    delay: Math.random() * 3, dur: 2 + Math.random() * 3, size: 4 + Math.random() * 8,
    drift: (Math.random() - 0.5) * 300, rot: Math.random() * 1080,
    shape: Math.random() > 0.5 ? "circle" : "rect",
  })), [palette.join()]); // eslint-disable-line react-hooks/exhaustive-deps
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
