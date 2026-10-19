import React, { useMemo } from "react";
import { RUNES } from "../lib/wizard.js";

/* ════════════════════════════════════════════
   MAGICAL BACKGROUND LAYERS
   ════════════════════════════════════════════ */
export default function MagicalBackground() {
  const orbs = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    id: i, x: 10 + Math.random() * 80, y: 10 + Math.random() * 80,
    size: 200 + Math.random() * 400,
    color: ["rgb(var(--btn-c) / 0.08)","rgb(var(--orb-blue) / 0.06)","rgb(var(--orb-pink) / 0.05)","rgb(var(--success) / 0.04)","rgb(var(--gold) / 0.05)","rgb(var(--btn-b) / 0.07)"][i],
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
          background: s.bright ? "rgb(var(--ink) / 0.9)" : "rgb(var(--ink) / 0.5)",
          boxShadow: s.bright ? "0 0 6px 2px rgb(var(--accent) / 0.4)" : "none",
          animation: `twinkle ${s.dur}s ${s.delay}s infinite ease-in-out`,
        }} />
      ))}
      {runes.map(r => (
        <div key={r.id} style={{
          position: "absolute", left: `${r.x}%`, top: `${r.y}%`,
          fontSize: r.size, color: "rgb(var(--accent) / 0.06)", fontFamily: "serif",
          animation: `floatRune ${r.dur}s ${r.delay}s infinite ease-in-out`,
          "--dx": `${r.driftX}px`, "--dy": `${r.driftY}px`,
        }}>{r.char}</div>
      ))}
      <div style={{
        position: "absolute", top: 0, left: "-20%", right: "-20%", height: "40%",
        background: "linear-gradient(180deg, rgb(var(--btn-c) / 0.04) 0%, rgb(var(--orb-blue) / 0.03) 30%, rgb(var(--success) / 0.02) 60%, transparent 100%)",
        animation: "aurora 20s infinite ease-in-out", filter: "blur(60px)", transformOrigin: "center top",
      }} />
    </div>
  );
}
