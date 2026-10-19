import React, { useMemo } from "react";
import { PLAYER_COLORS, calcPoints } from "../lib/wizard.js";

/* ════════════════════════════════════════════
   SCORE CHART (SVG)
   ════════════════════════════════════════════ */
export default function ScoreChart({ data, playerCount, playerNames, totalRounds }) {
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
