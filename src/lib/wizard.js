/* ════════════════════════════════════════════
   SPIELREGELN & KONSTANTEN
   Gemeinsam genutzt vom lokalen Modus (ein Gerät) und vom Online-Modus.
   ════════════════════════════════════════════ */

/** Spielerfarben des Standard-Designs (Farbe = Position in der Sitzordnung). */
export const DEFAULT_PLAYER_COLORS = [
  { accent: "#c084fc", glow: "rgba(192,132,252,0.4)", bg: "rgba(192,132,252,0.06)", dim: "rgba(192,132,252,0.15)", doneBg: "rgba(192,132,252,0.04)" },
  { accent: "#60a5fa", glow: "rgba(96,165,250,0.4)", bg: "rgba(96,165,250,0.06)", dim: "rgba(96,165,250,0.15)", doneBg: "rgba(96,165,250,0.04)" },
  { accent: "#f97316", glow: "rgba(249,115,22,0.4)", bg: "rgba(249,115,22,0.06)", dim: "rgba(249,115,22,0.15)", doneBg: "rgba(249,115,22,0.04)" },
  { accent: "#34d399", glow: "rgba(52,211,153,0.4)", bg: "rgba(52,211,153,0.06)", dim: "rgba(52,211,153,0.15)", doneBg: "rgba(52,211,153,0.04)" },
  { accent: "#fb7185", glow: "rgba(251,113,133,0.4)", bg: "rgba(251,113,133,0.06)", dim: "rgba(251,113,133,0.15)", doneBg: "rgba(251,113,133,0.04)" },
  { accent: "#fbbf24", glow: "rgba(251,191,36,0.4)", bg: "rgba(251,191,36,0.06)", dim: "rgba(251,191,36,0.15)", doneBg: "rgba(251,191,36,0.04)" },
];

/** Spielerfarben aus Grundfarben erzeugen (gleiches Schema wie oben; `strength` hebt die Tönungen an). */
export function makePlayerColors(hexes, strength = 1) {
  return hexes.map((hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const a = (x) => `rgba(${r},${g},${b},${+(x * strength).toFixed(3)})`;
    return { accent: hex, glow: a(0.4), bg: a(0.06), dim: a(0.15), doneBg: a(0.04) };
  });
}

/**
 * Aktive Spielerfarben. Bewusst `let`: Ein Farbdesign kann eine eigene Palette
 * setzen (ES-Module reichen die neue Belegung an alle Importe weiter).
 */
export let PLAYER_COLORS = DEFAULT_PLAYER_COLORS;
export function setPlayerColors(colors) {
  PLAYER_COLORS = colors;
}
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
/**
 * Kartenzahl je Runde nach der offiziellen Anleitung: In Runde n bekommt jeder
 * n Karten (3 Spieler: 1 … 20, 4: 1 … 15, 5: 1 … 12, 6: 1 … 10 – in der letzten
 * Runde sind alle 60 Karten verteilt). `totalRounds` bleibt für Aufrufer erhalten.
 */
// eslint-disable-next-line no-unused-vars
export function cardsForRound(ri, totalRounds) {
  return ri + 1;
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

/* ════════════════════════════════════════════
   ANSAGE-REGELN
   1. Der Reihe nach: Wer beginnt, wird am Anfang festgelegt; danach rückt der
      Beginn jede Runde um einen Platz im Uhrzeigersinn weiter (der Letzte in der
      Reihe gibt die Karten).
   2. Die Summe aller Ansagen darf nicht der Kartenzahl der Runde entsprechen –
      sonst könnten alle richtig liegen (Variante „Plus/minus Eins“ der Anleitung).
   preds[pi] = Ansage als Zahl oder null, order = Spaltenindizes in Ansage-Reihenfolge.
   ════════════════════════════════════════════ */

/** Ansage-Reihenfolge einer Runde (Spaltenindizes); `startIndex` = wer in Runde 1 beginnt. */
export function bidOrderFor(ri, playerCount, startIndex = 0) {
  return Array.from({ length: playerCount }, (_, k) => (((startIndex + ri + k) % playerCount) + playerCount) % playerCount);
}

/** Ansagen einer Runde aus dem Tabellenformat ("" = leer) als Zahlen bzw. null. */
export function predsOf(data, ri) {
  return data.map((p) => (p[ri].pred === "" ? null : parseInt(p[ri].pred, 10)));
}

/** Stand der Ansagen: wer jetzt dran ist, Summe, ob alle angesagt haben und ob die Summe verboten ist. */
export function bidStatus(preds, order, cards) {
  const missing = order.filter((pi) => preds[pi] === null);
  const sum = preds.reduce((s, v) => s + (v ?? 0), 0);
  const allIn = missing.length === 0;
  return {
    next: missing[0] ?? null,
    first: order[0],
    last: order[order.length - 1],
    count: preds.length - missing.length,
    sum,
    allIn,
    violation: allIn && sum === cards,
  };
}

/** Verbotener Wert für Spieler `pi` – nur sobald alle anderen schon angesagt haben, sonst null. */
export function forbiddenBid(preds, pi, cards) {
  const others = preds.filter((_, i) => i !== pi);
  if (others.some((v) => v === null)) return null;
  const value = cards - others.reduce((s, v) => s + v, 0);
  return value >= 0 && value <= cards ? value : null;
}

/**
 * Darf Spieler `pi` jetzt `value` ansagen? null = ja, sonst
 * { reason: "order", blocker } (jemand davor fehlt noch) oder { reason: "sum", forbidden }.
 * Vorhandene Ansagen dürfen jederzeit korrigiert werden (nur die Summenregel gilt).
 */
export function checkBid(preds, order, cards, pi, value) {
  if (value === null) return null;
  if (preds[pi] === null) {
    const blocker = order.slice(0, order.indexOf(pi)).find((i) => preds[i] === null);
    if (blocker !== undefined) return { reason: "order", blocker };
  }
  if (forbiddenBid(preds, pi, cards) === value) return { reason: "sum", forbidden: value };
  return null;
}
