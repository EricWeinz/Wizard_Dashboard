/* ════════════════════════════════════════════
   SPIELREGELN & KONSTANTEN
   Gemeinsam genutzt vom lokalen Modus (ein Gerät) und vom Online-Modus.
   ════════════════════════════════════════════ */

export const PLAYER_COLORS = [
  { accent: "#c084fc", glow: "rgba(192,132,252,0.4)", bg: "rgba(192,132,252,0.06)", dim: "rgba(192,132,252,0.15)", doneBg: "rgba(192,132,252,0.04)" },
  { accent: "#60a5fa", glow: "rgba(96,165,250,0.4)", bg: "rgba(96,165,250,0.06)", dim: "rgba(96,165,250,0.15)", doneBg: "rgba(96,165,250,0.04)" },
  { accent: "#f97316", glow: "rgba(249,115,22,0.4)", bg: "rgba(249,115,22,0.06)", dim: "rgba(249,115,22,0.15)", doneBg: "rgba(249,115,22,0.04)" },
  { accent: "#34d399", glow: "rgba(52,211,153,0.4)", bg: "rgba(52,211,153,0.06)", dim: "rgba(52,211,153,0.15)", doneBg: "rgba(52,211,153,0.04)" },
  { accent: "#fb7185", glow: "rgba(251,113,133,0.4)", bg: "rgba(251,113,133,0.06)", dim: "rgba(251,113,133,0.15)", doneBg: "rgba(251,113,133,0.04)" },
  { accent: "#fbbf24", glow: "rgba(251,191,36,0.4)", bg: "rgba(251,191,36,0.06)", dim: "rgba(251,191,36,0.15)", doneBg: "rgba(251,191,36,0.04)" },
];
export const ROUNDS_MAP = { 3: 20, 4: 15, 5: 12, 6: 10 };
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 6;
export const RUNES = ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ"];
export const MAGIC_SYMBOLS = ["✦","✧","⟡","◈","◇","⬡","✶","⊹","⋆","∗"];

export function calcPoints(pred, act) {
  if (pred === "" || act === "") return null;
  const p = parseInt(pred), a = parseInt(act);
  if (isNaN(p) || isNaN(a)) return null;
  const diff = Math.abs(p - a);
  return diff === 0 ? p * 10 + 20 : -(diff * 10);
}
export function cardsForRound(ri, totalRounds) {
  const half = Math.floor(totalRounds / 2);
  return ri < half ? ri + 1 : totalRounds - ri;
}

/**
 * Alle abgeleiteten Werte des Spielblocks – exakt die bisherige Logik aus dem
 * GameScreen, nur an einer Stelle gebündelt.
 * `data[pi][ri] = { pred, act }` mit Strings ("" = noch leer).
 */
export function computeGameStats(data, playerCount, totalRounds) {
  const roundComplete = (ri) => data.every(p => calcPoints(p[ri].pred, p[ri].act) !== null);
  const roundsDone = Array.from({ length: totalRounds }, (_, ri) => roundComplete(ri));
  const gameComplete = roundsDone.every(Boolean);

  let activeRound = totalRounds - 1;
  for (let r = 0; r < totalRounds; r++) if (!roundsDone[r]) { activeRound = r; break; }

  const runningTotal = (pi, upTo) => {
    let t = 0; for (let r = 0; r <= upTo; r++) { const p = calcPoints(data[pi][r].pred, data[pi][r].act); if (p !== null) t += p; } return t;
  };

  const totals = Array.from({ length: playerCount }, (_, i) => runningTotal(i, totalRounds - 1));
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

  const correctPreds = Array.from({ length: playerCount }, (_, pi) => {
    let c = 0; for (let ri = 0; ri < totalRounds; ri++) if (calcPoints(data[pi][ri].pred, data[pi][ri].act) !== null && data[pi][ri].pred === data[pi][ri].act) c++;
    return c;
  });

  const completedRounds = roundsDone.filter(Boolean).length;

  return {
    roundComplete: (ri) => roundsDone[ri],
    gameComplete, activeRound, completedRounds,
    totals, maxTotal, correctPreds,
    runningTotal, actSumWarn, predSumNote,
  };
}
