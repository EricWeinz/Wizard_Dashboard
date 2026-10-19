import React, { useEffect, useMemo } from "react";

/* ════════════════════════════════════════════
   SPELL BURST
   ════════════════════════════════════════════ */
export default function SpellBurst({ x, y, color, onDone }) {
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
